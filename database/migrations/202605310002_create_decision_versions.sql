-- Story 4.3: immutable version history for important decision edits.

alter table public.decisions
  add column if not exists kpi text;

create table if not exists public.decision_versions (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id) on delete cascade,
  version_number integer not null,
  changed_fields text[] not null,
  previous_value jsonb not null default '{}'::jsonb,
  new_value jsonb not null default '{}'::jsonb,
  reason text,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint decision_versions_version_positive_check
    check (version_number > 0),
  constraint decision_versions_changed_fields_check
    check (cardinality(changed_fields) > 0),
  constraint decision_versions_previous_value_json_check
    check (jsonb_typeof(previous_value) = 'object'),
  constraint decision_versions_new_value_json_check
    check (jsonb_typeof(new_value) = 'object'),
  unique (decision_id, version_number)
);

create index if not exists idx_decision_versions_decision
  on public.decision_versions(decision_id, version_number);

create index if not exists idx_decision_versions_created_at
  on public.decision_versions(created_at desc);

alter table public.decision_versions enable row level security;

drop policy if exists "decision versions readable by scoped decision users" on public.decision_versions;
create policy "decision versions readable by scoped decision users" on public.decision_versions
  for select to authenticated
  using (
    exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_versions.decision_id
        and public.current_user_has_permission('meeting.view')
        and public.current_user_can_access_decision_scope(
          decision_record.project_id,
          decision_record.project_ids,
          decision_record.source_type,
          decision_record.source_id
        )
    )
  );

drop policy if exists "decision versions insertable by scoped decision writers" on public.decision_versions;
create policy "decision versions insertable by scoped decision writers" on public.decision_versions
  for insert to authenticated
  with check (
    created_by = public.current_app_user_id()
    and exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_versions.decision_id
        and public.current_user_has_permission('decision.create')
        and public.current_user_can_write_decision_scope(
          decision_record.project_id,
          decision_record.project_ids,
          decision_record.source_type,
          decision_record.source_id
      )
    )
  );

create or replace function public.update_decision_with_version_and_audit(
  p_decision_id uuid,
  p_decision_patch jsonb,
  p_decision_version jsonb,
  p_audit_log jsonb
)
returns public.decisions
language plpgsql
security invoker
set search_path = public
as $$
declare
  updated_decision public.decisions;
begin
  update public.decisions
  set
    title = case when p_decision_patch ? 'title' then p_decision_patch->>'title' else title end,
    organization_id = case
      when p_decision_patch ? 'organization_id' then p_decision_patch->>'organization_id'
      else organization_id
    end,
    project_id = case
      when p_decision_patch ? 'project_id' then (p_decision_patch->>'project_id')::uuid
      else project_id
    end,
    project_ids = case
      when p_decision_patch ? 'project_ids' and jsonb_typeof(p_decision_patch->'project_ids') = 'array'
        then array(
          select project_id.value::uuid
          from jsonb_array_elements_text(p_decision_patch->'project_ids') as project_id(value)
        )
      when p_decision_patch ? 'project_ids' then '{}'::uuid[]
      else project_ids
    end,
    axis_id = case when p_decision_patch ? 'axis_id' then p_decision_patch->>'axis_id' else axis_id end,
    workstream_id = case
      when p_decision_patch ? 'workstream_id' then p_decision_patch->>'workstream_id'
      else workstream_id
    end,
    module_id = case when p_decision_patch ? 'module_id' then p_decision_patch->>'module_id' else module_id end,
    decision_text = case
      when p_decision_patch ? 'decision_text' then p_decision_patch->>'decision_text'
      else decision_text
    end,
    linked_records = case
      when p_decision_patch ? 'linked_records' and jsonb_typeof(p_decision_patch->'linked_records') = 'array'
        then p_decision_patch->'linked_records'
      when p_decision_patch ? 'linked_records' then '[]'::jsonb
      else linked_records
    end,
    owner_id = case when p_decision_patch ? 'owner_id' then (p_decision_patch->>'owner_id')::uuid else owner_id end,
    priority = case when p_decision_patch ? 'priority' then p_decision_patch->>'priority' else priority end,
    kpi = case when p_decision_patch ? 'kpi' then p_decision_patch->>'kpi' else kpi end,
    due_date = case when p_decision_patch ? 'due_date' then (p_decision_patch->>'due_date')::date else due_date end,
    status = case when p_decision_patch ? 'status' then p_decision_patch->>'status' else status end,
    updated_at = case
      when p_decision_patch ? 'updated_at' then (p_decision_patch->>'updated_at')::timestamptz
      else updated_at
    end
  where id = p_decision_id
  returning * into updated_decision;

  if not found then
    raise exception 'Decision % was not updated or is not visible in the current scope.', p_decision_id
      using errcode = 'P0002';
  end if;

  if p_decision_version is not null and jsonb_typeof(p_decision_version) = 'object' then
    insert into public.decision_versions (
      id,
      decision_id,
      version_number,
      changed_fields,
      previous_value,
      new_value,
      reason,
      created_by,
      created_at,
      updated_at
    )
    values (
      (p_decision_version->>'id')::uuid,
      p_decision_id,
      (p_decision_version->>'version_number')::integer,
      array(
        select field_name.value
        from jsonb_array_elements_text(p_decision_version->'changed_fields') as field_name(value)
      ),
      coalesce(p_decision_version->'previous_value', '{}'::jsonb),
      coalesce(p_decision_version->'new_value', '{}'::jsonb),
      p_decision_version->>'reason',
      (p_decision_version->>'created_by')::uuid,
      coalesce((p_decision_version->>'created_at')::timestamptz, now()),
      coalesce((p_decision_version->>'updated_at')::timestamptz, now())
    );
  end if;

  insert into public.audit_logs (
    actor_id,
    entity_type,
    entity_id,
    action,
    old_value,
    new_value
  )
  values (
    (p_audit_log->>'actor_id')::uuid,
    coalesce(p_audit_log->>'entity_type', 'decision'),
    p_decision_id,
    coalesce(p_audit_log->>'action', 'decision.updated'),
    p_audit_log->'old_value',
    p_audit_log->'new_value'
  );

  return updated_decision;
end;
$$;
