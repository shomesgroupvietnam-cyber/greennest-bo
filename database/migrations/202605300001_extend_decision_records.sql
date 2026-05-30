-- Story 4.1: official decision records distinct from approval actions and meeting action items.

alter table public.decisions
  alter column project_id drop not null,
  add column if not exists title text,
  add column if not exists organization_id text,
  add column if not exists project_ids uuid[] not null default '{}',
  add column if not exists axis_id text,
  add column if not exists workstream_id text,
  add column if not exists module_id text,
  add column if not exists source_type text not null default 'meeting',
  add column if not exists source_id text,
  add column if not exists linked_records jsonb not null default '[]'::jsonb,
  add column if not exists priority text not null default 'medium',
  add column if not exists created_by uuid references public.users(id) on delete set null,
  add column if not exists decided_by uuid references public.users(id) on delete set null,
  add column if not exists decided_at timestamptz;

update public.decisions
set
  title = coalesce(title, left(decision_text, 120)),
  project_ids = case
    when project_id is not null and cardinality(project_ids) = 0 then array[project_id]
    else project_ids
  end,
  source_type = coalesce(source_type, case when meeting_id is not null then 'meeting' else 'independent' end),
  source_id = coalesce(source_id, meeting_id::text),
  priority = coalesce(priority, 'medium'),
  decided_at = coalesce(decided_at, created_at)
where title is null
   or (project_id is not null and cardinality(project_ids) = 0)
   or source_id is null
   or decided_at is null;

alter table public.decisions
  alter column title set not null,
  alter column decided_at set not null,
  drop constraint if exists decisions_source_type_check,
  add constraint decisions_source_type_check
    check (source_type in ('independent', 'proposal', 'approval', 'meeting')),
  drop constraint if exists decisions_priority_check,
  add constraint decisions_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent')),
  drop constraint if exists decisions_linked_records_json_check,
  add constraint decisions_linked_records_json_check
    check (jsonb_typeof(linked_records) = 'array');

create index if not exists idx_decisions_source
  on public.decisions(source_type, source_id);

create index if not exists idx_decisions_scope
  on public.decisions(organization_id, axis_id, workstream_id, module_id, status);

create index if not exists idx_decisions_project_ids
  on public.decisions using gin(project_ids);

create index if not exists idx_decisions_decided_at
  on public.decisions(decided_at desc);

create or replace function public.current_user_can_access_decision_scope(
  decision_project_id uuid,
  decision_project_ids uuid[],
  decision_source_type text,
  decision_source_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    (
      decision_project_id is not null
      and public.current_user_can_read_project(decision_project_id)
    )
    or exists (
      select 1
      from unnest(coalesce(decision_project_ids, '{}'::uuid[])) as scoped_project(project_id)
      where public.current_user_can_read_project(scoped_project.project_id)
    )
    or (
      decision_source_type = 'meeting'
      and decision_source_id is not null
      and exists (
        select 1
        from public.meetings meeting
        where meeting.id::text = decision_source_id
          and public.current_user_has_permission('meeting.view')
          and (
            public.current_user_has_internal_permission('meeting.view')
            or meeting.host_id = public.current_app_user_id()
            or public.current_app_user_id() = any(meeting.participants)
            or (
              meeting.project_id is not null
              and public.current_user_can_read_project(meeting.project_id)
            )
            or exists (
              select 1
              from unnest(coalesce(meeting.project_ids, '{}'::uuid[])) as meeting_project(project_id)
              where public.current_user_can_read_project(meeting_project.project_id)
            )
          )
      )
    )
    or (
      decision_project_id is null
      and cardinality(coalesce(decision_project_ids, '{}'::uuid[])) = 0
      and (
        public.current_user_has_internal_permission('meeting.view')
        or public.current_user_has_internal_permission('decision.create')
        or public.current_user_has_internal_permission('decision.approve')
      )
    )
$$;

drop policy if exists "decisions readable through scoped project permission" on public.decisions;
create policy "decisions readable through scoped project permission" on public.decisions
  for select to authenticated
  using (
    public.current_user_has_permission('meeting.view')
    and public.current_user_can_access_decision_scope(project_id, project_ids, source_type, source_id)
  );

drop policy if exists "decisions creatable by scoped permitted users" on public.decisions;
create policy "decisions creatable by scoped permitted users" on public.decisions
  for insert to authenticated
  with check (
    public.current_user_has_permission('decision.create')
    and public.current_user_can_access_decision_scope(project_id, project_ids, source_type, source_id)
    and created_by = public.current_app_user_id()
  );

drop policy if exists "decisions updatable by scoped meeting/task users" on public.decisions;
create policy "decisions updatable by scoped meeting/task users" on public.decisions
  for update to authenticated
  using (
    public.current_user_can_access_decision_scope(project_id, project_ids, source_type, source_id)
    and (
      public.current_user_has_internal_permission('meeting.update')
      or public.current_user_has_permission('task.create')
    )
  )
  with check (
    public.current_user_can_access_decision_scope(project_id, project_ids, source_type, source_id)
    and (
      public.current_user_has_internal_permission('meeting.update')
      or public.current_user_has_permission('task.create')
    )
  );
