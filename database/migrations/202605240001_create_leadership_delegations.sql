-- Leadership delegation relation for on-behalf actions.

drop policy if exists "users can view self or permitted user list" on public.users;
create policy "users can view self or permitted user list" on public.users
  for select to authenticated
  using (
    id = public.current_app_user_id()
    or public.current_user_has_internal_permission('user.view')
    or public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_internal_permission('delegation.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('delegation.manage')
  );

create table if not exists public.leadership_delegations (
  id uuid primary key default gen_random_uuid(),
  principal_user_id uuid not null references public.users(id) on delete cascade,
  delegate_user_id uuid not null references public.users(id) on delete cascade,
  organization_id text,
  project_id text,
  axis_id text,
  workstream_id text,
  module_id text,
  record_id text,
  action_keys text[] not null default array[]::text[],
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  note text,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leadership_delegations_distinct_users check (principal_user_id <> delegate_user_id),
  constraint leadership_delegations_has_actions check (cardinality(action_keys) > 0),
  constraint leadership_delegations_has_scope check (
    organization_id is not null
    or project_id is not null
    or axis_id is not null
    or workstream_id is not null
    or module_id is not null
    or record_id is not null
  ),
  constraint leadership_delegations_valid_time check (
    starts_at is null
    or ends_at is null
    or starts_at <= ends_at
  )
);

create or replace function public.validate_leadership_delegation_action_keys()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  denied_actions constant text[] := array[
    'document.approve',
    'legal.approve',
    'decision.approve',
    'knowledge.approve',
    'design.approve_change',
    'acceptance.approve',
    'finance.approve',
    'payment.approve',
    'proposal.approve',
    'proposal.reject',
    'proposal.request_change',
    'investment.approve',
    'contract.approve',
    'hr.approve',
    'qa.approve',
    'safety.approve',
    'settings.manage',
    'delegation.manage',
    'user.invite',
    'user.update_role',
    'audit.view',
    'proposal.configure_flow',
    'proposal.archive',
    'knowledge.manage_source_registry',
    'ai.configure',
    'ai.confirm_action',
    'project.archive',
    'project.assign_member',
    'document.archive',
    'legal.configure_template',
    'task.archive',
    'contract.archive'
  ];
  unknown_action text;
  denied_action text;
begin
  select action_key
    into unknown_action
  from unnest(new.action_keys) as action_key
  where not exists (
    select 1 from public.permissions p where p.key = action_key
  )
  limit 1;

  if unknown_action is not null then
    raise exception 'delegation action % does not exist in permissions', unknown_action
      using errcode = '23514';
  end if;

  select action_key
    into denied_action
  from unnest(new.action_keys) as action_key
  where action_key = any(denied_actions)
     or action_key like '%.approve'
  limit 1;

  if denied_action is not null then
    raise exception 'delegation action % is not allowed for on-behalf delegation', denied_action
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create index if not exists idx_leadership_delegations_delegate_active
  on public.leadership_delegations (delegate_user_id, is_active);

create index if not exists idx_leadership_delegations_principal_active
  on public.leadership_delegations (principal_user_id, is_active);

create index if not exists idx_leadership_delegations_scope_lookup
  on public.leadership_delegations (
    delegate_user_id,
    principal_user_id,
    organization_id,
    project_id,
    axis_id,
    workstream_id,
    module_id,
    record_id,
    is_active
  );

drop trigger if exists validate_leadership_delegation_action_keys on public.leadership_delegations;
create trigger validate_leadership_delegation_action_keys
before insert or update of action_keys on public.leadership_delegations
for each row execute function public.validate_leadership_delegation_action_keys();

drop trigger if exists set_leadership_delegations_updated_at on public.leadership_delegations;
create trigger set_leadership_delegations_updated_at
before update on public.leadership_delegations
for each row execute function public.set_updated_at();

alter table public.leadership_delegations enable row level security;

drop policy if exists "leadership delegations readable by participants or managers" on public.leadership_delegations;
create policy "leadership delegations readable by participants or managers" on public.leadership_delegations
  for select to authenticated
  using (
    principal_user_id = public.current_app_user_id()
    or delegate_user_id = public.current_app_user_id()
    or public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_internal_permission('delegation.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('delegation.manage')
  );

drop policy if exists "leadership delegations insertable by managers" on public.leadership_delegations;
create policy "leadership delegations insertable by managers" on public.leadership_delegations
  for insert to authenticated
  with check (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_internal_permission('delegation.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('delegation.manage')
  );

drop policy if exists "leadership delegations updatable by managers" on public.leadership_delegations;
create policy "leadership delegations updatable by managers" on public.leadership_delegations
  for update to authenticated
  using (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_internal_permission('delegation.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('delegation.manage')
  )
  with check (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_internal_permission('delegation.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('delegation.manage')
  );
