-- Initial Supabase RLS policies for MVP tables.
-- Apply after the MVP schema and role/permission seed.
--
-- Sprint 8C alignment with app-level access scope:
-- - Internal roles keep MVP portfolio access when they have the relevant permission.
-- - `viewer` is read-only and project-membership/assigned-project scoped.
-- - External roles (`nha_thau`, `tu_van`) are limited to assigned project/task/document scope.
-- - Contractor (`nha_thau`) cannot read legal steps.
-- - Consultant (`tu_van`) can read legal steps only for assigned project/review scope.
--
-- RLS helper functions are SECURITY DEFINER so policy predicates can resolve
-- membership and assignment without being blocked by the same table policies.

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.users
  where auth_user_id = auth.uid()
     or id = auth.uid()
  limit 1
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = public.current_app_user_id()
    and status = 'active'
  limit 1
$$;

create or replace function public.current_app_role_scope()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select roles.scope
  from public.users
  join public.roles on roles.key = users.role
  where users.id = public.current_app_user_id()
    and users.status = 'active'
    and roles.is_active = true
  limit 1
$$;

create or replace function public.current_user_is_external()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role_scope() = 'external', false)
     or public.current_app_role() in ('nha_thau', 'tu_van')
$$;

create or replace function public.current_user_is_viewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = 'viewer'
$$;

create or replace function public.is_business_approval_permission(permission_key text)
returns boolean
language sql
immutable
as $$
  select permission_key = any(array[
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
    'safety.approve'
  ])
$$;

create or replace function public.current_user_has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    join public.roles r on r.key = u.role
    join public.role_permissions rp on rp.role_id = r.id
    join public.permissions p on p.id = rp.permission_id
    where u.id = public.current_app_user_id()
      and u.status = 'active'
      and p.key = permission_key
      and r.is_active = true
  )
$$;

create or replace function public.current_user_has_internal_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_permission(permission_key)
    and not public.current_user_is_external()
    and not public.current_user_is_viewer()
$$;

create or replace function public.current_user_is_project_member(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = project_uuid
      and pm.user_id = public.current_app_user_id()
  )
$$;

create or replace function public.current_user_has_task_assignment(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tasks t
    where t.project_id = project_uuid
      and t.assignee_id = public.current_app_user_id()
      and t.archived_at is null
  )
$$;

create or replace function public.current_user_has_document_assignment(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.documents d
    where d.project_id = project_uuid
      and d.owner_id = public.current_app_user_id()
      and d.archived_at is null
  )
$$;

create or replace function public.current_user_can_read_project(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_permission('project.view')
    and (
      (
        not public.current_user_is_external()
        and not public.current_user_is_viewer()
      )
      or public.current_user_is_project_member(project_uuid)
      or public.current_user_has_task_assignment(project_uuid)
      or public.current_user_has_document_assignment(project_uuid)
    )
$$;

create or replace function public.current_user_can_read_task(task_uuid uuid, project_uuid uuid, assignee_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_permission('task.view')
    and (
      (
        not public.current_user_is_external()
        and not public.current_user_is_viewer()
      )
      or (
        public.current_user_is_external()
        and assignee_uuid = public.current_app_user_id()
      )
      or (
        public.current_user_is_viewer()
        and public.current_user_can_read_project(project_uuid)
      )
    )
$$;

create or replace function public.current_user_can_read_document(document_uuid uuid, project_uuid uuid, owner_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_permission('document.view')
    and (
      (
        not public.current_user_is_external()
        and not public.current_user_is_viewer()
      )
      or (
        public.current_user_is_external()
        and owner_uuid = public.current_app_user_id()
      )
      or (
        public.current_user_is_viewer()
        and public.current_user_can_read_project(project_uuid)
      )
    )
$$;

create or replace function public.current_user_can_read_legal_step(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_permission('legal.view')
    and public.current_app_role() <> 'nha_thau'
    and (
      (
        not public.current_user_is_external()
        and not public.current_user_is_viewer()
      )
      or public.current_user_can_read_project(project_uuid)
    )
$$;

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

create or replace function public.current_user_can_write_decision_scope(
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
  with scoped_projects as (
    select distinct scoped_project.project_id
    from unnest(
      (
        case
          when decision_project_id is null then '{}'::uuid[]
          else array[decision_project_id]
        end
      ) || coalesce(decision_project_ids, '{}'::uuid[])
    ) as scoped_project(project_id)
    where scoped_project.project_id is not null
  ),
  scope_allowed as (
    select case
      when exists (select 1 from scoped_projects) then
        not exists (
          select 1
          from scoped_projects
          where not public.current_user_can_read_project(project_id)
        )
      else public.current_user_has_internal_permission('decision.create')
    end as allowed
  ),
  source_allowed as (
    select case
      when decision_source_type = 'independent' then true
      when decision_source_type = 'meeting' then
        decision_source_id is not null
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
      when decision_source_type in ('proposal', 'approval') then
        decision_source_id is not null
        and exists (
          select 1
          from public.proposals proposal
          where proposal.id = decision_source_id
            and public.current_user_has_permission('proposal.view')
            and (
              proposal.project_id is null
              or public.current_user_can_read_project(proposal.project_id)
            )
        )
      else false
    end as allowed
  )
  select
    (select allowed from scope_allowed)
    and (select allowed from source_allowed)
$$;

create or replace function public.current_user_can_create_document(project_uuid uuid, owner_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_permission('document.create')
    and (
      public.current_user_has_internal_permission('document.create')
      or (
        public.current_user_is_external()
        and public.current_user_can_read_project(project_uuid)
        and owner_uuid = public.current_app_user_id()
      )
    )
$$;

create or replace function public.current_user_can_update_document(project_uuid uuid, owner_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (public.current_user_has_permission('document.update') or public.current_user_has_permission('document.approve'))
    and (
      public.current_user_has_internal_permission('document.update')
      or public.current_user_has_internal_permission('document.approve')
      or (
        public.current_user_is_external()
        and owner_uuid = public.current_app_user_id()
      )
    )
$$;

alter table public.users enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.document_requirements enable row level security;
alter table public.document_versions enable row level security;
alter table public.legal_steps enable row level security;
alter table public.meetings enable row level security;
alter table public.decisions enable row level security;
alter table public.decision_versions enable row level security;
alter table public.decision_assignments enable row level security;
alter table public.report_runs enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_steps enable row level security;
alter table public.proposal_links enable row level security;
alter table public.proposal_decisions enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.knowledge_candidates enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.source_registry_entries enable row level security;
alter table public.external_search_logs enable row level security;
alter table public.knowledge_discovery_topics enable row level security;
alter table public.knowledge_discovery_run_logs enable row level security;
alter table public.ai_interactions enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.ai_citations enable row level security;
alter table public.ai_action_proposals enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Drop Sprint 8C policy names up front so this file can be reapplied safely.
drop policy if exists "projects readable by scoped permitted users" on public.projects;
drop policy if exists "projects creatable by internal permitted users" on public.projects;
drop policy if exists "projects updatable by internal permitted users" on public.projects;
drop policy if exists "project members readable by scoped users" on public.project_members;
drop policy if exists "project members assignable by internal permitted users" on public.project_members;
drop policy if exists "project members updatable by internal permitted users" on public.project_members;
drop policy if exists "tasks readable by scoped permitted users" on public.tasks;
drop policy if exists "tasks creatable by scoped permitted users" on public.tasks;
drop policy if exists "tasks updatable by scoped permitted users or assignee" on public.tasks;
drop policy if exists "decision assignment tasks rollback deletable by creators" on public.tasks;
drop policy if exists "documents readable by scoped permitted users" on public.documents;
drop policy if exists "documents creatable by scoped permitted users" on public.documents;
drop policy if exists "documents updatable by scoped permitted users" on public.documents;
drop policy if exists "document versions follow scoped document access" on public.document_versions;
drop policy if exists "document versions creatable by scoped document writers" on public.document_versions;
drop policy if exists "legal steps readable by scoped permitted users" on public.legal_steps;
drop policy if exists "legal steps updatable by internal permitted users" on public.legal_steps;
drop policy if exists "meetings readable by scoped permitted users" on public.meetings;
drop policy if exists "meetings creatable by scoped permitted users" on public.meetings;
drop policy if exists "meetings updatable by internal permitted users" on public.meetings;
drop policy if exists "decisions readable through scoped project permission" on public.decisions;
drop policy if exists "decisions creatable by scoped permitted users" on public.decisions;
drop policy if exists "decisions updatable by scoped meeting/task users" on public.decisions;
drop policy if exists "decision versions readable by scoped decision users" on public.decision_versions;
drop policy if exists "decision versions insertable by scoped decision writers" on public.decision_versions;
drop policy if exists "decision assignments readable by scoped decision users" on public.decision_assignments;
drop policy if exists "decision assignments creatable by scoped task users" on public.decision_assignments;
drop policy if exists "decision assignments updatable by scoped task users" on public.decision_assignments;
drop policy if exists "decision assignments rollback deletable by creators" on public.decision_assignments;
drop policy if exists "report runs readable by scoped permitted users" on public.report_runs;
drop policy if exists "report runs creatable by scoped permitted users" on public.report_runs;
drop policy if exists "proposals readable by permitted users" on public.proposals;
drop policy if exists "proposals creatable by permitted users" on public.proposals;
drop policy if exists "proposals updatable by permitted users" on public.proposals;
drop policy if exists "proposal child records readable by permitted users" on public.proposal_steps;
drop policy if exists "proposal links readable by permitted users" on public.proposal_links;
drop policy if exists "proposal decisions readable by permitted users" on public.proposal_decisions;
drop policy if exists "proposal steps writable by reviewers" on public.proposal_steps;
drop policy if exists "proposal decisions writable by reviewers" on public.proposal_decisions;
drop policy if exists "knowledge items readable by permitted users" on public.knowledge_items;
drop policy if exists "knowledge items creatable by permitted users" on public.knowledge_items;
drop policy if exists "knowledge items updatable by creators or reviewers" on public.knowledge_items;
drop policy if exists "knowledge candidates readable by permitted users" on public.knowledge_candidates;
drop policy if exists "knowledge candidates creatable by permitted users" on public.knowledge_candidates;
drop policy if exists "knowledge candidates updatable by promoters or reviewers" on public.knowledge_candidates;
drop policy if exists "knowledge chunks readable by permitted users" on public.knowledge_chunks;
drop policy if exists "knowledge chunks writable by reviewers" on public.knowledge_chunks;
drop policy if exists "knowledge chunks deletable by reviewers" on public.knowledge_chunks;
drop policy if exists "source registry readable by intake users" on public.source_registry_entries;
drop policy if exists "source registry manageable by settings users" on public.source_registry_entries;
drop policy if exists "external search logs readable by intake users" on public.external_search_logs;
drop policy if exists "external search logs insertable by intake users" on public.external_search_logs;
drop policy if exists "knowledge discovery topics readable by managers" on public.knowledge_discovery_topics;
drop policy if exists "knowledge discovery topics manageable by managers" on public.knowledge_discovery_topics;
drop policy if exists "knowledge discovery run logs readable by managers" on public.knowledge_discovery_run_logs;
drop policy if exists "knowledge discovery run logs insertable by managers" on public.knowledge_discovery_run_logs;
drop policy if exists "audit logs readable by internal permitted users" on public.audit_logs;
drop policy if exists "audit logs insertable by current user or audit users" on public.audit_logs;

drop policy if exists "roles are readable by authenticated users" on public.roles;
create policy "roles are readable by authenticated users" on public.roles
  for select to authenticated
  using (true);

drop policy if exists "roles insertable by settings managers" on public.roles;
create policy "roles insertable by settings managers" on public.roles
  for insert to authenticated
  with check (public.current_user_has_internal_permission('settings.manage'));

drop policy if exists "roles updatable by settings managers" on public.roles;
create policy "roles updatable by settings managers" on public.roles
  for update to authenticated
  using (public.current_user_has_internal_permission('settings.manage'))
  with check (public.current_user_has_internal_permission('settings.manage'));

drop policy if exists "permissions are readable by authenticated users" on public.permissions;
create policy "permissions are readable by authenticated users" on public.permissions
  for select to authenticated
  using (true);

drop policy if exists "permissions insertable by settings managers" on public.permissions;
create policy "permissions insertable by settings managers" on public.permissions
  for insert to authenticated
  with check (public.current_user_has_internal_permission('settings.manage'));

drop policy if exists "permissions updatable by settings managers" on public.permissions;
create policy "permissions updatable by settings managers" on public.permissions
  for update to authenticated
  using (public.current_user_has_internal_permission('settings.manage'))
  with check (public.current_user_has_internal_permission('settings.manage'));

drop policy if exists "role permissions are readable by authenticated users" on public.role_permissions;
create policy "role permissions are readable by authenticated users" on public.role_permissions
  for select to authenticated
  using (true);

drop policy if exists "role permissions manageable by settings managers" on public.role_permissions;
drop policy if exists "role permissions insertable by settings managers" on public.role_permissions;
create policy "role permissions insertable by settings managers" on public.role_permissions
  for insert to authenticated
  with check (
    public.current_user_has_internal_permission('settings.manage')
    and not exists (
      select 1
      from public.roles r
      join public.permissions p on p.id = permission_id
      where r.id = role_id
        and r.key = 'admin'
        and public.is_business_approval_permission(p.key)
    )
    and (
      public.current_app_role() = 'super_admin'
      or not exists (
        select 1
        from public.permissions p
        where p.id = permission_id
          and public.is_business_approval_permission(p.key)
      )
    )
  );

drop policy if exists "role permissions updatable by settings managers" on public.role_permissions;
create policy "role permissions updatable by settings managers" on public.role_permissions
  for update to authenticated
  using (
    public.current_user_has_internal_permission('settings.manage')
    and (
      public.current_app_role() = 'super_admin'
      or not exists (
        select 1
        from public.permissions p
        where p.id = permission_id
          and public.is_business_approval_permission(p.key)
      )
    )
  )
  with check (
    public.current_user_has_internal_permission('settings.manage')
    and not exists (
      select 1
      from public.roles r
      join public.permissions p on p.id = permission_id
      where r.id = role_id
        and r.key = 'admin'
        and public.is_business_approval_permission(p.key)
    )
    and (
      public.current_app_role() = 'super_admin'
      or not exists (
        select 1
        from public.permissions p
        where p.id = permission_id
          and public.is_business_approval_permission(p.key)
      )
    )
  );

drop policy if exists "role permissions deletable by settings managers" on public.role_permissions;
create policy "role permissions deletable by settings managers" on public.role_permissions
  for delete to authenticated
  using (
    public.current_user_has_internal_permission('settings.manage')
    and (
      public.current_app_role() = 'super_admin'
      or not exists (
        select 1
        from public.permissions p
        where p.id = permission_id
          and public.is_business_approval_permission(p.key)
      )
    )
  );

drop policy if exists "users can view self or permitted user list" on public.users;
create policy "users can view self or permitted user list" on public.users
  for select to authenticated
  using (
    id = public.current_app_user_id()
    or public.current_user_has_internal_permission('user.view')
    or public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_internal_permission('delegation.manage')
  );

drop policy if exists "permitted users can create invited profiles" on public.users;
create policy "permitted users can create invited profiles" on public.users
  for insert to authenticated
  with check (public.current_user_has_internal_permission('user.invite'));

drop policy if exists "permitted users can update user roles" on public.users;
create policy "permitted users can update user roles" on public.users
  for update to authenticated
  using (public.current_user_has_internal_permission('user.update_role'))
  with check (public.current_user_has_internal_permission('user.update_role'));

drop policy if exists "workspaces visible to members or admins" on public.workspaces;
create policy "workspaces visible to members or admins" on public.workspaces
  for select to authenticated
  using (
    public.current_user_has_internal_permission('settings.manage')
    or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = public.current_app_user_id()
    )
  );

drop policy if exists "workspace members visible to admins or same workspace members" on public.workspace_members;
create policy "workspace members visible to admins or same workspace members" on public.workspace_members
  for select to authenticated
  using (
    public.current_user_has_internal_permission('settings.manage')
    or user_id = public.current_app_user_id()
    or exists (
      select 1 from public.workspace_members own
      where own.workspace_id = workspace_members.workspace_id
        and own.user_id = public.current_app_user_id()
    )
  );

drop policy if exists "projects readable by permitted users" on public.projects;
create policy "projects readable by scoped permitted users" on public.projects
  for select to authenticated
  using (public.current_user_can_read_project(id));

drop policy if exists "projects readable by scoped permitted users" on public.projects;
create policy "projects readable by scoped permitted users" on public.projects
  for select to authenticated
  using (public.current_user_can_read_project(id));

drop policy if exists "projects creatable by permitted users" on public.projects;
create policy "projects creatable by internal permitted users" on public.projects
  for insert to authenticated
  with check (public.current_user_has_internal_permission('project.create'));

drop policy if exists "projects creatable by internal permitted users" on public.projects;
create policy "projects creatable by internal permitted users" on public.projects
  for insert to authenticated
  with check (public.current_user_has_internal_permission('project.create'));

drop policy if exists "projects updatable by permitted users" on public.projects;
create policy "projects updatable by internal permitted users" on public.projects
  for update to authenticated
  using (public.current_user_has_internal_permission('project.update'))
  with check (public.current_user_has_internal_permission('project.update'));

drop policy if exists "projects updatable by internal permitted users" on public.projects;
create policy "projects updatable by internal permitted users" on public.projects
  for update to authenticated
  using (public.current_user_has_internal_permission('project.update'))
  with check (public.current_user_has_internal_permission('project.update'));

drop policy if exists "project members readable by permitted users" on public.project_members;
create policy "project members readable by scoped users" on public.project_members
  for select to authenticated
  using (
    user_id = public.current_app_user_id()
    or public.current_user_has_internal_permission('project.view')
    or public.current_user_can_read_project(project_id)
  );

drop policy if exists "project members readable by scoped users" on public.project_members;
create policy "project members readable by scoped users" on public.project_members
  for select to authenticated
  using (
    user_id = public.current_app_user_id()
    or public.current_user_has_internal_permission('project.view')
    or public.current_user_can_read_project(project_id)
  );

drop policy if exists "project members assignable by permitted users" on public.project_members;
create policy "project members assignable by internal permitted users" on public.project_members
  for insert to authenticated
  with check (public.current_user_has_internal_permission('project.assign_member'));

drop policy if exists "project members assignable by internal permitted users" on public.project_members;
create policy "project members assignable by internal permitted users" on public.project_members
  for insert to authenticated
  with check (public.current_user_has_internal_permission('project.assign_member'));

drop policy if exists "project members updatable by permitted users" on public.project_members;
create policy "project members updatable by internal permitted users" on public.project_members
  for update to authenticated
  using (public.current_user_has_internal_permission('project.assign_member'))
  with check (public.current_user_has_internal_permission('project.assign_member'));

drop policy if exists "project members updatable by internal permitted users" on public.project_members;
create policy "project members updatable by internal permitted users" on public.project_members
  for update to authenticated
  using (public.current_user_has_internal_permission('project.assign_member'))
  with check (public.current_user_has_internal_permission('project.assign_member'));

drop policy if exists "tasks readable by permitted users" on public.tasks;
create policy "tasks readable by scoped permitted users" on public.tasks
  for select to authenticated
  using (public.current_user_can_read_task(id, project_id, assignee_id));

drop policy if exists "tasks readable by scoped permitted users" on public.tasks;
create policy "tasks readable by scoped permitted users" on public.tasks
  for select to authenticated
  using (public.current_user_can_read_task(id, project_id, assignee_id));

drop policy if exists "tasks creatable by permitted users" on public.tasks;
create policy "tasks creatable by scoped permitted users" on public.tasks
  for insert to authenticated
  with check (
    public.current_user_has_permission('task.create')
    and (
      public.current_user_has_internal_permission('task.create')
      or public.current_user_can_read_project(project_id)
    )
  );

drop policy if exists "tasks creatable by scoped permitted users" on public.tasks;
create policy "tasks creatable by scoped permitted users" on public.tasks
  for insert to authenticated
  with check (
    public.current_user_has_permission('task.create')
    and (
      public.current_user_has_internal_permission('task.create')
      or public.current_user_can_read_project(project_id)
    )
  );

drop policy if exists "tasks updatable by permitted users or assigned owner" on public.tasks;
create policy "tasks updatable by scoped permitted users or assignee" on public.tasks
  for update to authenticated
  using (
    public.current_user_has_internal_permission('task.update')
    or (
      public.current_user_has_permission('task.update_own')
      and assignee_id = public.current_app_user_id()
    )
  )
  with check (
    public.current_user_has_internal_permission('task.update')
    or (
      public.current_user_has_permission('task.update_own')
      and assignee_id = public.current_app_user_id()
    )
  );

drop policy if exists "tasks updatable by scoped permitted users or assignee" on public.tasks;
create policy "tasks updatable by scoped permitted users or assignee" on public.tasks
  for update to authenticated
  using (
    public.current_user_has_internal_permission('task.update')
    or (
      public.current_user_has_permission('task.update_own')
      and assignee_id = public.current_app_user_id()
    )
  )
  with check (
    public.current_user_has_internal_permission('task.update')
    or (
      public.current_user_has_permission('task.update_own')
      and assignee_id = public.current_app_user_id()
    )
  );

drop policy if exists "decision assignment tasks rollback deletable by creators" on public.tasks;
create policy "decision assignment tasks rollback deletable by creators" on public.tasks
  for delete to authenticated
  using (
    linked_entity_type = 'decision'
    and linked_entity_id is not null
    and created_by = public.current_app_user_id()
    and public.current_user_has_permission('task.create')
    and public.current_user_can_read_project(project_id)
    and exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = tasks.linked_entity_id
        and public.current_user_can_write_decision_scope(
          tasks.project_id,
          array[tasks.project_id],
          decision_record.source_type,
          decision_record.source_id
        )
    )
  );

drop policy if exists "documents readable by permitted users" on public.documents;
create policy "documents readable by scoped permitted users" on public.documents
  for select to authenticated
  using (public.current_user_can_read_document(id, project_id, owner_id));

drop policy if exists "documents readable by scoped permitted users" on public.documents;
create policy "documents readable by scoped permitted users" on public.documents
  for select to authenticated
  using (public.current_user_can_read_document(id, project_id, owner_id));

drop policy if exists "documents creatable by permitted users" on public.documents;
create policy "documents creatable by scoped permitted users" on public.documents
  for insert to authenticated
  with check (public.current_user_can_create_document(project_id, owner_id));

drop policy if exists "documents creatable by scoped permitted users" on public.documents;
create policy "documents creatable by scoped permitted users" on public.documents
  for insert to authenticated
  with check (public.current_user_can_create_document(project_id, owner_id));

drop policy if exists "documents updatable by permitted users" on public.documents;
create policy "documents updatable by scoped permitted users" on public.documents
  for update to authenticated
  using (public.current_user_can_update_document(project_id, owner_id))
  with check (public.current_user_can_update_document(project_id, owner_id));

drop policy if exists "documents updatable by scoped permitted users" on public.documents;
create policy "documents updatable by scoped permitted users" on public.documents
  for update to authenticated
  using (public.current_user_can_update_document(project_id, owner_id))
  with check (public.current_user_can_update_document(project_id, owner_id));

drop policy if exists "document versions follow document access" on public.document_versions;
create policy "document versions follow scoped document access" on public.document_versions
  for select to authenticated
  using (
    exists (
      select 1
      from public.documents d
      where d.id = document_versions.document_id
        and public.current_user_can_read_document(d.id, d.project_id, d.owner_id)
    )
  );

drop policy if exists "document versions follow scoped document access" on public.document_versions;
create policy "document versions follow scoped document access" on public.document_versions
  for select to authenticated
  using (
    exists (
      select 1
      from public.documents d
      where d.id = document_versions.document_id
        and public.current_user_can_read_document(d.id, d.project_id, d.owner_id)
    )
  );

drop policy if exists "document versions creatable by document writers" on public.document_versions;
create policy "document versions creatable by scoped document writers" on public.document_versions
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.documents d
      where d.id = document_versions.document_id
        and (
          public.current_user_can_create_document(d.project_id, d.owner_id)
          or public.current_user_can_update_document(d.project_id, d.owner_id)
        )
    )
  );

drop policy if exists "document versions creatable by scoped document writers" on public.document_versions;
create policy "document versions creatable by scoped document writers" on public.document_versions
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.documents d
      where d.id = document_versions.document_id
        and (
          public.current_user_can_create_document(d.project_id, d.owner_id)
          or public.current_user_can_update_document(d.project_id, d.owner_id)
        )
    )
  );

drop policy if exists "legal steps readable by permitted users" on public.legal_steps;
create policy "legal steps readable by scoped permitted users" on public.legal_steps
  for select to authenticated
  using (public.current_user_can_read_legal_step(project_id));

drop policy if exists "legal steps readable by scoped permitted users" on public.legal_steps;
create policy "legal steps readable by scoped permitted users" on public.legal_steps
  for select to authenticated
  using (public.current_user_can_read_legal_step(project_id));

drop policy if exists "legal steps updatable by permitted users" on public.legal_steps;
create policy "legal steps updatable by internal permitted users" on public.legal_steps
  for update to authenticated
  using (public.current_user_has_internal_permission('legal.update'))
  with check (public.current_user_has_internal_permission('legal.update'));

drop policy if exists "legal steps updatable by internal permitted users" on public.legal_steps;
create policy "legal steps updatable by internal permitted users" on public.legal_steps
  for update to authenticated
  using (public.current_user_has_internal_permission('legal.update'))
  with check (public.current_user_has_internal_permission('legal.update'));

create index if not exists idx_meetings_project_ids
  on public.meetings using gin(project_ids);

create or replace function public.current_user_uses_assignment_scope()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_app_role() = any(array[
    'pho_tong_giam_doc',
    'giam_doc_du_an',
    'quan_ly_du_an',
    'to_truong',
    'phap_ly',
    'ke_toan',
    'thiet_ke',
    'ky_thuat',
    'thi_cong',
    'mua_hang',
    'thu_ky_tro_ly'
  ])
$$;

create or replace function public.normalize_scope_axis(axis_value text)
returns text
language sql
immutable
as $$
  select case
    when axis_value in ('axis-1', 'axis1') then 'project_management'
    else axis_value
  end
$$;

create or replace function public.scope_dimension_matches(expected text, actual text, normalize_axis boolean default false)
returns boolean
language sql
immutable
as $$
  select
    expected is null
    or expected = ''
    or expected = '*'
    or (
      actual is not null
      and actual <> ''
      and case
        when normalize_axis then public.normalize_scope_axis(expected) = public.normalize_scope_axis(actual)
        else expected = actual
      end
    )
$$;

create or replace function public.current_user_has_matching_scope_assignment(
  permission_key text,
  target_organization_id text,
  target_project_id text,
  target_axis_id text,
  target_workstream_id text,
  target_module_id text,
  target_record_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.access_scope_assignments asa
    join public.roles role_record on role_record.key = asa.role_key
    join public.role_permissions role_permission on role_permission.role_id = role_record.id
    join public.permissions permission_record on permission_record.id = role_permission.permission_id
    where asa.user_id = public.current_app_user_id()
      and asa.is_active = true
      and role_record.is_active = true
      and permission_record.key = permission_key
      and permission_key = any(asa.permission_keys)
      and (asa.starts_at is null or asa.starts_at <= now())
      and (asa.ends_at is null or asa.ends_at >= now())
      and (
        (
          asa.scope_type = 'global'
          and asa.organization_id is null
          and asa.project_id is null
          and asa.axis_id is null
          and asa.workstream_id is null
          and asa.module_id is null
          and asa.record_id is null
        )
        or (
          asa.scope_type = 'scoped'
          and public.scope_dimension_matches(asa.organization_id, target_organization_id)
          and public.scope_dimension_matches(asa.project_id, target_project_id)
          and public.scope_dimension_matches(asa.axis_id, target_axis_id, true)
          and public.scope_dimension_matches(asa.workstream_id, target_workstream_id)
          and public.scope_dimension_matches(asa.module_id, target_module_id)
          and public.scope_dimension_matches(asa.record_id, target_record_id)
        )
      )
  )
$$;

create or replace function public.current_user_can_access_meeting_scope(
  meeting_id uuid,
  meeting_project_id uuid,
  meeting_project_ids uuid[],
  meeting_host_id uuid,
  meeting_participants uuid[],
  meeting_organization_id text,
  meeting_axis_id text,
  meeting_department_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with scoped_projects as (
    select distinct meeting_project.project_id
    from unnest(
      (
        case
          when meeting_project_id is null then '{}'::uuid[]
          else array[meeting_project_id]
        end
      ) || coalesce(meeting_project_ids, '{}'::uuid[])
    ) as meeting_project(project_id)
    where meeting_project.project_id is not null
  )
  select
    (
      (
        public.current_user_has_internal_permission('meeting.view')
        and not public.current_user_uses_assignment_scope()
      )
      or (
        (
          meeting_host_id = public.current_app_user_id()
          or public.current_app_user_id() = any(coalesce(meeting_participants, '{}'::uuid[]))
        )
        and (
          public.current_user_has_permission('meeting.view')
          or public.current_user_has_matching_scope_assignment(
            'meeting.view',
            meeting_organization_id,
            null,
            meeting_axis_id,
            coalesce(nullif(meeting_department_id, ''), 'meeting'),
            'meeting',
            meeting_id::text
          )
        )
      )
      or exists (
        select 1
        from scoped_projects
        where (
          (
            not public.current_user_uses_assignment_scope()
            and public.current_user_has_permission('meeting.view')
            and public.current_user_can_read_project(project_id)
          )
          or public.current_user_has_matching_scope_assignment(
            'meeting.view',
            meeting_organization_id,
            project_id::text,
            meeting_axis_id,
            coalesce(nullif(meeting_department_id, ''), 'meeting'),
            'meeting',
            meeting_id::text
          )
        )
      )
      or (
        not exists (select 1 from scoped_projects)
        and meeting_organization_id is not null
        and (
          (
            public.current_user_has_internal_permission('meeting.view')
            and not public.current_user_uses_assignment_scope()
          )
          or public.current_user_has_matching_scope_assignment(
            'meeting.view',
            meeting_organization_id,
            null,
            meeting_axis_id,
            coalesce(nullif(meeting_department_id, ''), 'meeting'),
            'meeting',
            meeting_id::text
          )
        )
      )
    )
$$;

create or replace function public.current_user_can_create_meeting_scope(
  meeting_project_id uuid,
  meeting_project_ids uuid[],
  meeting_host_id uuid,
  meeting_organization_id text,
  meeting_axis_id text,
  meeting_department_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with scoped_projects as (
    select distinct meeting_project.project_id
    from unnest(
      (
        case
          when meeting_project_id is null then '{}'::uuid[]
          else array[meeting_project_id]
        end
      ) || coalesce(meeting_project_ids, '{}'::uuid[])
    ) as meeting_project(project_id)
    where meeting_project.project_id is not null
  )
  select
    (
      (
        exists (select 1 from scoped_projects)
        and not exists (
          select 1
          from scoped_projects
          where not exists (
            select 1
            from public.projects project_record
            where project_record.id = project_id
              and (
                (
                  public.current_user_has_internal_permission('meeting.create')
                  and not public.current_user_uses_assignment_scope()
                )
                or (
                  not public.current_user_uses_assignment_scope()
                  and public.current_user_has_permission('meeting.create')
                  and public.current_user_can_read_project(project_id)
                )
                or public.current_user_has_matching_scope_assignment(
                  'meeting.create',
                  meeting_organization_id,
                  project_id::text,
                  meeting_axis_id,
                  coalesce(nullif(meeting_department_id, ''), 'meeting'),
                  'meeting',
                  null
                )
              )
          )
        )
      )
      or (
        meeting_project_id is null
        and cardinality(coalesce(meeting_project_ids, '{}'::uuid[])) = 0
        and meeting_organization_id is not null
        and (
          (
            public.current_user_has_internal_permission('meeting.create')
            and not public.current_user_uses_assignment_scope()
          )
          or public.current_user_has_matching_scope_assignment(
            'meeting.create',
            meeting_organization_id,
            null,
            meeting_axis_id,
            coalesce(nullif(meeting_department_id, ''), 'meeting'),
            'meeting',
            null
          )
        )
      )
    )
    and (
      meeting_host_id is null
      or meeting_host_id = public.current_app_user_id()
      or (
        public.current_user_has_internal_permission('meeting.create')
        and not public.current_user_uses_assignment_scope()
      )
    )
$$;

drop policy if exists "meetings readable by permitted users" on public.meetings;
drop policy if exists "meetings readable by scoped permitted users" on public.meetings;
create policy "meetings readable by scoped permitted users" on public.meetings
  for select to authenticated
  using (
    public.current_user_can_access_meeting_scope(id, project_id, project_ids, host_id, participants, organization_id, axis_id, department_id)
  );

drop policy if exists "meetings creatable by permitted users" on public.meetings;
drop policy if exists "meetings creatable by scoped permitted users" on public.meetings;
create policy "meetings creatable by scoped permitted users" on public.meetings
  for insert to authenticated
  with check (
    public.current_user_can_create_meeting_scope(project_id, project_ids, host_id, organization_id, axis_id, department_id)
  );

drop policy if exists "meetings updatable by permitted users" on public.meetings;
drop policy if exists "meetings updatable by internal permitted users" on public.meetings;
create policy "meetings updatable by internal permitted users" on public.meetings
  for update to authenticated
  using (public.current_user_has_internal_permission('meeting.update'))
  with check (public.current_user_has_internal_permission('meeting.update'));

drop policy if exists "decisions readable through meeting/project permission" on public.decisions;
create policy "decisions readable through scoped project permission" on public.decisions
  for select to authenticated
  using (
    public.current_user_has_permission('meeting.view')
    and public.current_user_can_access_decision_scope(project_id, project_ids, source_type, source_id)
  );

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
    and public.current_user_can_write_decision_scope(project_id, project_ids, source_type, source_id)
    and created_by = public.current_app_user_id()
  );

drop policy if exists "decisions updatable by scoped meeting/task users" on public.decisions;
create policy "decisions updatable by scoped meeting/task users" on public.decisions
  for update to authenticated
  using (
    public.current_user_can_write_decision_scope(project_id, project_ids, source_type, source_id)
    and (
      public.current_user_has_internal_permission('meeting.update')
      or public.current_user_has_permission('task.create')
    )
  )
  with check (
    public.current_user_can_write_decision_scope(project_id, project_ids, source_type, source_id)
    and (
      public.current_user_has_internal_permission('meeting.update')
      or public.current_user_has_permission('task.create')
    )
  );

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

drop policy if exists "decision assignments readable by scoped decision users" on public.decision_assignments;
create policy "decision assignments readable by scoped decision users" on public.decision_assignments
  for select to authenticated
  using (
    exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_assignments.decision_id
        and public.current_user_has_permission('meeting.view')
        and public.current_user_can_read_project(decision_assignments.project_id)
        and public.current_user_can_access_decision_scope(
          decision_record.project_id,
          decision_record.project_ids,
          decision_record.source_type,
          decision_record.source_id
        )
    )
  );

drop policy if exists "decision assignments creatable by scoped task users" on public.decision_assignments;
create policy "decision assignments creatable by scoped task users" on public.decision_assignments
  for insert to authenticated
  with check (
    public.current_user_has_permission('decision.create')
    and public.current_user_has_permission('task.create')
    and public.current_user_can_read_project(project_id)
    and created_by = public.current_app_user_id()
    and exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_assignments.decision_id
        and public.current_user_can_write_decision_scope(
          decision_assignments.project_id,
          array[decision_assignments.project_id],
          decision_record.source_type,
          decision_record.source_id
        )
        and decision_assignments.organization_id is not distinct from decision_record.organization_id
        and (
          (
            decision_record.project_id is null
            and cardinality(coalesce(decision_record.project_ids, '{}'::uuid[])) = 0
          )
          or decision_assignments.project_id = decision_record.project_id
          or decision_assignments.project_id = any(decision_record.project_ids)
        )
    )
    and task_id is not null
    and exists (
        select 1
        from public.tasks task_record
        where task_record.id = decision_assignments.task_id
          and task_record.project_id = decision_assignments.project_id
          and task_record.linked_entity_type = 'decision'
          and task_record.linked_entity_id = decision_assignments.decision_id
    )
  );

drop policy if exists "decision assignments rollback deletable by creators" on public.decision_assignments;
create policy "decision assignments rollback deletable by creators" on public.decision_assignments
  for delete to authenticated
  using (
    created_by = public.current_app_user_id()
    and public.current_user_has_permission('decision.create')
    and public.current_user_has_permission('task.create')
    and public.current_user_can_read_project(project_id)
    and exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_assignments.decision_id
        and public.current_user_can_write_decision_scope(
          decision_assignments.project_id,
          array[decision_assignments.project_id],
          decision_record.source_type,
          decision_record.source_id
        )
        and decision_assignments.organization_id is not distinct from decision_record.organization_id
    )
    and exists (
      select 1
      from public.tasks task_record
      where task_record.id = decision_assignments.task_id
        and task_record.project_id = decision_assignments.project_id
        and task_record.linked_entity_type = 'decision'
        and task_record.linked_entity_id = decision_assignments.decision_id
    )
  );

drop policy if exists "decision assignments updatable by scoped task users" on public.decision_assignments;
create policy "decision assignments updatable by scoped task users" on public.decision_assignments
  for update to authenticated
  using (
    public.current_user_has_permission('task.update')
    and public.current_user_can_read_project(project_id)
    and exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_assignments.decision_id
        and public.current_user_can_write_decision_scope(
          decision_assignments.project_id,
          array[decision_assignments.project_id],
          decision_record.source_type,
          decision_record.source_id
        )
        and decision_assignments.organization_id is not distinct from decision_record.organization_id
    )
    and exists (
      select 1
      from public.tasks task_record
      where task_record.id = decision_assignments.task_id
        and task_record.project_id = decision_assignments.project_id
        and task_record.linked_entity_type = 'decision'
        and task_record.linked_entity_id = decision_assignments.decision_id
    )
  )
  with check (
    public.current_user_has_permission('task.update')
    and public.current_user_can_read_project(project_id)
    and exists (
      select 1
      from public.decisions decision_record
      where decision_record.id = decision_assignments.decision_id
        and public.current_user_can_write_decision_scope(
          decision_assignments.project_id,
          array[decision_assignments.project_id],
          decision_record.source_type,
          decision_record.source_id
        )
        and decision_assignments.organization_id is not distinct from decision_record.organization_id
    )
    and exists (
      select 1
      from public.tasks task_record
      where task_record.id = decision_assignments.task_id
        and task_record.project_id = decision_assignments.project_id
        and task_record.linked_entity_type = 'decision'
        and task_record.linked_entity_id = decision_assignments.decision_id
    )
  );

drop policy if exists "report runs readable by scoped permitted users" on public.report_runs;
create policy "report runs readable by scoped permitted users" on public.report_runs
  for select to authenticated
  using (
    public.current_user_has_permission('report.view')
    and public.current_user_can_read_project(project_id)
  );

drop policy if exists "report runs creatable by scoped permitted users" on public.report_runs;
create policy "report runs creatable by scoped permitted users" on public.report_runs
  for insert to authenticated
  with check (
    public.current_user_has_permission('report.create')
    and public.current_user_can_read_project(project_id)
    and generated_by = public.current_app_user_id()
  );

drop policy if exists "proposals readable by permitted users" on public.proposals;
create policy "proposals readable by permitted users" on public.proposals
  for select to authenticated
  using (
    public.current_user_has_permission('proposal.view')
    and (project_id is null or public.current_user_can_read_project(project_id))
  );

drop policy if exists "proposals creatable by permitted users" on public.proposals;
create policy "proposals creatable by permitted users" on public.proposals
  for insert to authenticated
  with check (
    public.current_user_has_permission('proposal.create')
    and (project_id is null or public.current_user_can_read_project(project_id))
    and requested_by = public.current_app_user_id()
  );

drop policy if exists "proposals updatable by permitted users" on public.proposals;
create policy "proposals updatable by permitted users" on public.proposals
  for update to authenticated
  using (
    public.current_user_has_permission('proposal.update')
    or public.current_user_has_permission('proposal.review')
    or public.current_user_has_permission('proposal.approve')
  )
  with check (
    public.current_user_has_permission('proposal.update')
    or public.current_user_has_permission('proposal.review')
    or public.current_user_has_permission('proposal.approve')
  );

drop policy if exists "proposal child records readable by permitted users" on public.proposal_steps;
create policy "proposal child records readable by permitted users" on public.proposal_steps
  for select to authenticated
  using (public.current_user_has_permission('proposal.view'));

drop policy if exists "proposal links readable by permitted users" on public.proposal_links;
create policy "proposal links readable by permitted users" on public.proposal_links
  for select to authenticated
  using (public.current_user_has_permission('proposal.view'));

drop policy if exists "proposal decisions readable by permitted users" on public.proposal_decisions;
create policy "proposal decisions readable by permitted users" on public.proposal_decisions
  for select to authenticated
  using (public.current_user_has_permission('proposal.view'));

drop policy if exists "proposal steps writable by reviewers" on public.proposal_steps;
create policy "proposal steps writable by reviewers" on public.proposal_steps
  for all to authenticated
  using (public.current_user_has_permission('proposal.review') or public.current_user_has_permission('proposal.approve'))
  with check (public.current_user_has_permission('proposal.review') or public.current_user_has_permission('proposal.approve'));

drop policy if exists "proposal decisions writable by reviewers" on public.proposal_decisions;
create policy "proposal decisions writable by reviewers" on public.proposal_decisions
  for insert to authenticated
  with check (
    public.current_user_has_permission('proposal.review')
    or public.current_user_has_permission('proposal.approve')
    or public.current_user_has_permission('proposal.create')
  );

drop policy if exists "knowledge items readable by permitted users" on public.knowledge_items;
create policy "knowledge items readable by permitted users" on public.knowledge_items
  for select to authenticated
  using (public.current_user_has_permission('knowledge.view'));

drop policy if exists "knowledge items creatable by permitted users" on public.knowledge_items;
create policy "knowledge items creatable by permitted users" on public.knowledge_items
  for insert to authenticated
  with check (
    public.current_user_has_permission('knowledge.create')
    and (created_by is null or created_by = public.current_app_user_id())
    and status in ('discovered', 'imported', 'pending_review')
    and (is_rag_eligible = false or status = 'approved')
  );

drop policy if exists "knowledge items updatable by creators or reviewers" on public.knowledge_items;
create policy "knowledge items updatable by creators or reviewers" on public.knowledge_items
  for update to authenticated
  using (
    public.current_user_has_permission('knowledge.review')
    or public.current_user_has_permission('knowledge.approve')
    or (
      public.current_user_has_permission('knowledge.create')
      and created_by = public.current_app_user_id()
    )
  )
  with check (
    (
      public.current_user_has_permission('knowledge.review')
      or public.current_user_has_permission('knowledge.approve')
      or (
        public.current_user_has_permission('knowledge.create')
        and created_by = public.current_app_user_id()
      )
    )
    and (status <> 'approved' or public.current_user_has_permission('knowledge.approve'))
    and (is_rag_eligible = false or status = 'approved')
  );

drop policy if exists "knowledge candidates readable by permitted users" on public.knowledge_candidates;
create policy "knowledge candidates readable by permitted users" on public.knowledge_candidates
  for select to authenticated
  using (public.current_user_has_permission('knowledge.view'));

drop policy if exists "knowledge candidates creatable by permitted users" on public.knowledge_candidates;
create policy "knowledge candidates creatable by permitted users" on public.knowledge_candidates
  for insert to authenticated
  with check (
    public.current_user_has_permission('knowledge.create_candidate')
    and submitted_by = public.current_app_user_id()
    and status = 'candidate'
    and promoted_knowledge_item_id is null
  );

drop policy if exists "knowledge candidates updatable by promoters or reviewers" on public.knowledge_candidates;
create policy "knowledge candidates updatable by promoters or reviewers" on public.knowledge_candidates
  for update to authenticated
  using (
    public.current_user_has_permission('knowledge.promote')
    or public.current_user_has_permission('knowledge.review')
    or public.current_user_has_permission('knowledge.approve')
  )
  with check (
    (
      public.current_user_has_permission('knowledge.promote')
      or public.current_user_has_permission('knowledge.review')
      or public.current_user_has_permission('knowledge.approve')
    )
    and (
      status <> 'approved'
      or (
        public.current_user_has_permission('knowledge.approve')
        and promoted_knowledge_item_id is not null
      )
    )
  );

drop policy if exists "knowledge chunks readable by permitted users" on public.knowledge_chunks;
create policy "knowledge chunks readable by permitted users" on public.knowledge_chunks
  for select to authenticated
  using (
    public.current_user_has_permission('knowledge.view')
    and (
      public.current_user_has_permission('knowledge.review')
      or public.current_user_has_permission('knowledge.approve')
      or (
        status = 'approved'
        and (
          access_level = 'public_read'
          or (
            public.current_user_is_external()
            and access_level = 'external_limited'
          )
          or (
            not public.current_user_is_external()
            and not public.current_user_is_viewer()
          )
        )
      )
    )
  );

drop policy if exists "knowledge chunks writable by reviewers" on public.knowledge_chunks;
create policy "knowledge chunks writable by reviewers" on public.knowledge_chunks
  for insert to authenticated
  with check (
    public.current_user_has_permission('knowledge.review')
    or public.current_user_has_permission('knowledge.approve')
  );

drop policy if exists "knowledge chunks deletable by reviewers" on public.knowledge_chunks;
create policy "knowledge chunks deletable by reviewers" on public.knowledge_chunks
  for delete to authenticated
  using (
    public.current_user_has_permission('knowledge.review')
    or public.current_user_has_permission('knowledge.approve')
  );

drop policy if exists "source registry readable by intake users" on public.source_registry_entries;
create policy "source registry readable by intake users" on public.source_registry_entries
  for select to authenticated
  using (
    public.current_user_has_permission('knowledge.create_candidate')
    or public.current_user_has_permission('knowledge.review')
    or public.current_user_has_permission('knowledge.manage_source_registry')
    or public.current_user_has_internal_permission('settings.manage')
  );

drop policy if exists "source registry manageable by settings users" on public.source_registry_entries;
create policy "source registry manageable by settings users" on public.source_registry_entries
  for all to authenticated
  using (
    public.current_user_has_permission('knowledge.manage_source_registry')
    or public.current_user_has_internal_permission('settings.manage')
  )
  with check (
    public.current_user_has_permission('knowledge.manage_source_registry')
    or public.current_user_has_internal_permission('settings.manage')
  );

drop policy if exists "external search logs readable by intake users" on public.external_search_logs;
create policy "external search logs readable by intake users" on public.external_search_logs
  for select to authenticated
  using (
    public.current_user_has_permission('knowledge.create')
    or public.current_user_has_permission('knowledge.review')
  );

drop policy if exists "external search logs insertable by intake users" on public.external_search_logs;
create policy "external search logs insertable by intake users" on public.external_search_logs
  for insert to authenticated
  with check (
    (public.current_user_has_permission('knowledge.create') or public.current_user_has_permission('knowledge.review'))
    and user_id = public.current_app_user_id()
  );

drop policy if exists "knowledge discovery topics readable by managers" on public.knowledge_discovery_topics;
create policy "knowledge discovery topics readable by managers" on public.knowledge_discovery_topics
  for select to authenticated
  using (
    public.current_user_has_permission('knowledge.manage_source_registry')
    or public.current_user_has_internal_permission('settings.manage')
  );

drop policy if exists "knowledge discovery topics manageable by managers" on public.knowledge_discovery_topics;
create policy "knowledge discovery topics manageable by managers" on public.knowledge_discovery_topics
  for all to authenticated
  using (
    public.current_user_has_permission('knowledge.manage_source_registry')
    or public.current_user_has_internal_permission('settings.manage')
  )
  with check (
    public.current_user_has_permission('knowledge.manage_source_registry')
    or public.current_user_has_internal_permission('settings.manage')
  );

drop policy if exists "knowledge discovery run logs readable by managers" on public.knowledge_discovery_run_logs;
create policy "knowledge discovery run logs readable by managers" on public.knowledge_discovery_run_logs
  for select to authenticated
  using (
    public.current_user_has_permission('knowledge.manage_source_registry')
    or public.current_user_has_internal_permission('settings.manage')
  );

drop policy if exists "knowledge discovery run logs insertable by managers" on public.knowledge_discovery_run_logs;
create policy "knowledge discovery run logs insertable by managers" on public.knowledge_discovery_run_logs
  for insert to authenticated
  with check (
    (
      public.current_user_has_permission('knowledge.manage_source_registry')
      or public.current_user_has_internal_permission('settings.manage')
    )
    and (run_by is null or run_by = public.current_app_user_id())
  );

drop policy if exists "notifications readable by recipient" on public.notifications;
create policy "notifications readable by recipient" on public.notifications
  for select to authenticated
  using (user_id = public.current_app_user_id());

create or replace function public.current_user_can_read_risk_record(
  project_uuid uuid,
  owner_uuid uuid,
  created_by_uuid uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_permission('risk.view')
    and (
      (
        project_uuid is null
        and not public.current_user_is_external()
        and not public.current_user_is_viewer()
      )
      or public.current_user_can_read_project(project_uuid)
      or owner_uuid = public.current_app_user_id()
      or created_by_uuid = public.current_app_user_id()
    )
$$;

create or replace function public.current_user_can_write_risk_record(
  permission_key text,
  project_uuid uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_has_permission(permission_key)
    and (
      (
        project_uuid is null
        and not public.current_user_is_external()
        and not public.current_user_is_viewer()
      )
      or public.current_user_can_read_project(project_uuid)
    )
$$;

create or replace function public.guard_executive_risk_record_lifecycle_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    new.status_override is distinct from old.status_override
    or new.status_override_reason is distinct from old.status_override_reason
    or new.status_override_by is distinct from old.status_override_by
    or new.status_override_at is distinct from old.status_override_at
    or new.status_override_source_status is distinct from old.status_override_source_status
  ) and not public.current_user_can_write_risk_record('risk.override', new.project_id) then
    raise exception 'Missing risk.override permission for risk status override';
  end if;

  if (
    new.status in ('closed', 'resolved')
    and old.status not in ('closed', 'resolved')
  ) and not (
    public.current_user_can_write_risk_record('risk.close', new.project_id)
    or public.current_user_can_write_risk_record('risk.close_high', new.project_id)
  ) then
    raise exception 'Missing risk.close permission for terminal risk close';
  end if;

  if (
    new.closed_reason is distinct from old.closed_reason
    or new.closed_by is distinct from old.closed_by
    or new.closed_at is distinct from old.closed_at
  ) and new.status not in ('closed', 'resolved') then
    raise exception 'Close audit fields require terminal risk status';
  end if;

  return new;
end
$$;

drop trigger if exists guard_executive_risk_record_lifecycle_permissions on public.executive_risk_records;
create trigger guard_executive_risk_record_lifecycle_permissions
  before update on public.executive_risk_records
  for each row execute function public.guard_executive_risk_record_lifecycle_permissions();

alter table public.executive_risk_records enable row level security;

drop policy if exists "executive risk records readable by scoped risk users" on public.executive_risk_records;
create policy "executive risk records readable by scoped risk users" on public.executive_risk_records
  for select to authenticated
  using (
    public.current_user_can_read_risk_record(
      project_id,
      owner_id,
      created_by
    )
  );

drop policy if exists "executive risk records creatable by scoped risk users" on public.executive_risk_records;
create policy "executive risk records creatable by scoped risk users" on public.executive_risk_records
  for insert to authenticated
  with check (
    created_by = public.current_app_user_id()
    and updated_by = public.current_app_user_id()
    and public.current_user_can_write_risk_record('risk.create', project_id)
  );

drop policy if exists "executive risk records updatable by scoped risk users" on public.executive_risk_records;
create policy "executive risk records updatable by scoped risk users" on public.executive_risk_records
  for update to authenticated
  using (
    public.current_user_can_write_risk_record('risk.update', project_id)
    or public.current_user_can_write_risk_record('risk.override', project_id)
    or public.current_user_can_write_risk_record('risk.close', project_id)
    or public.current_user_can_write_risk_record('risk.close_high', project_id)
  )
  with check (
    updated_by = public.current_app_user_id()
    and (
      (
        status not in ('closed', 'resolved')
        and public.current_user_can_write_risk_record('risk.update', project_id)
      )
      or (
        status_override is not null
        and public.current_user_can_write_risk_record('risk.override', project_id)
      )
      or (
        status in ('closed', 'resolved')
        and (
          public.current_user_can_write_risk_record('risk.close', project_id)
          or public.current_user_can_write_risk_record('risk.close_high', project_id)
        )
      )
    )
  );

create or replace function public.current_user_can_access_notification_outbox_item(
  item_source_type text,
  item_source_id text,
  item_project_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when item_source_type = 'proposal' then exists (
      select 1
      from public.proposals p
      where p.id = item_source_id
        and public.current_user_has_permission('proposal.view')
        and (p.project_id is null or public.current_user_can_read_project(p.project_id))
    )
    when item_source_type = 'risk' then exists (
      select 1
      from public.executive_risk_records risk_record
      where risk_record.id::text = item_source_id
        and public.current_user_can_read_risk_record(
          risk_record.project_id,
          risk_record.owner_id,
          risk_record.created_by
        )
    )
    when item_project_id is not null then
      public.current_user_has_permission('proposal.view')
      and exists (
        select 1
        from public.projects project
        where project.id::text = item_project_id
          and public.current_user_can_read_project(project.id)
      )
    else
      public.current_user_has_internal_permission('proposal.view')
      or public.current_user_has_internal_permission('proposal.approve')
  end
$$;

create or replace function public.current_user_can_write_notification_outbox_item(
  item_source_type text,
  item_source_id text,
  item_project_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when item_source_type = 'risk' then exists (
      select 1
      from public.executive_risk_records risk_record
      where risk_record.id::text = item_source_id
        and public.current_user_can_write_risk_record('risk.update', risk_record.project_id)
    )
    when item_source_type = 'proposal' then exists (
      select 1
      from public.proposals p
      where p.id = item_source_id
        and (
          public.current_user_has_permission('proposal.approve')
          or public.current_user_has_permission('proposal.review')
        )
        and (p.project_id is null or public.current_user_can_read_project(p.project_id))
    )
    when item_project_id is not null then
      (
        public.current_user_has_permission('proposal.approve')
        or public.current_user_has_permission('proposal.review')
      )
      and exists (
        select 1
        from public.projects project
        where project.id::text = item_project_id
          and public.current_user_can_read_project(project.id)
      )
    else
      public.current_user_has_internal_permission('proposal.approve')
      or public.current_user_has_internal_permission('proposal.review')
  end
$$;

drop policy if exists "notification outbox readable by approval viewers" on public.notification_outbox;
create policy "notification outbox readable by approval viewers" on public.notification_outbox
  for select to authenticated
  using (public.current_user_can_access_notification_outbox_item(source_type, source_id, project_id));

drop policy if exists "notification outbox insertable by approval viewers" on public.notification_outbox;
create policy "notification outbox insertable by approval viewers" on public.notification_outbox
  for insert to authenticated
  with check (public.current_user_can_write_notification_outbox_item(source_type, source_id, project_id));

drop policy if exists "notification outbox updatable by approval viewers" on public.notification_outbox;
create policy "notification outbox updatable by approval viewers" on public.notification_outbox
  for update to authenticated
  using (public.current_user_can_write_notification_outbox_item(source_type, source_id, project_id))
  with check (public.current_user_can_write_notification_outbox_item(source_type, source_id, project_id));

drop policy if exists "audit logs readable by permitted users" on public.audit_logs;
create policy "audit logs readable by internal permitted users" on public.audit_logs
  for select to authenticated
  using (public.current_user_has_internal_permission('audit.view'));

drop policy if exists "audit logs readable by internal permitted users" on public.audit_logs;
create policy "audit logs readable by internal permitted users" on public.audit_logs
  for select to authenticated
  using (public.current_user_has_internal_permission('audit.view'));

drop policy if exists "audit logs insertable by authenticated users" on public.audit_logs;
create policy "audit logs insertable by current user or audit users" on public.audit_logs
  for insert to authenticated
  with check (actor_id = public.current_app_user_id() or public.current_user_has_internal_permission('audit.view'));

drop policy if exists "audit logs insertable by current user or audit users" on public.audit_logs;
create policy "audit logs insertable by current user or audit users" on public.audit_logs
  for insert to authenticated
  with check (actor_id = public.current_app_user_id() or public.current_user_has_internal_permission('audit.view'));

drop policy if exists "document requirements readable by document viewers" on public.document_requirements;
create policy "document requirements readable by document viewers" on public.document_requirements
  for select to authenticated
  using (public.current_user_has_permission('document.view'));

drop policy if exists "document requirements manageable by internal document users" on public.document_requirements;
create policy "document requirements manageable by internal document users" on public.document_requirements
  for all to authenticated
  using (public.current_user_has_internal_permission('document.update'))
  with check (public.current_user_has_internal_permission('document.update'));

drop policy if exists "ai interactions readable by requester or audit" on public.ai_interactions;
create policy "ai interactions readable by requester or audit" on public.ai_interactions
  for select to authenticated
  using (
    requested_by = public.current_app_user_id()
    or public.current_user_has_internal_permission('audit.view')
  );

drop policy if exists "ai interactions insertable by requester" on public.ai_interactions;
create policy "ai interactions insertable by requester" on public.ai_interactions
  for insert to authenticated
  with check (
    public.current_user_has_permission('ai.ask')
    and requested_by = public.current_app_user_id()
    and (project_id is null or public.current_user_can_read_project(project_id))
  );

drop policy if exists "ai interactions updatable by requester or ai admin" on public.ai_interactions;
create policy "ai interactions updatable by requester or ai admin" on public.ai_interactions
  for update to authenticated
  using (
    requested_by = public.current_app_user_id()
    or public.current_user_has_internal_permission('ai.configure')
  )
  with check (
    requested_by = public.current_app_user_id()
    or public.current_user_has_internal_permission('ai.configure')
  );

drop policy if exists "ai jobs readable by requester or audit" on public.ai_jobs;
create policy "ai jobs readable by requester or audit" on public.ai_jobs
  for select to authenticated
  using (
    requested_by = public.current_app_user_id()
    or public.current_user_has_internal_permission('audit.view')
  );

drop policy if exists "ai jobs insertable by requester" on public.ai_jobs;
create policy "ai jobs insertable by requester" on public.ai_jobs
  for insert to authenticated
  with check (
    public.current_user_has_permission('ai.ask')
    and requested_by = public.current_app_user_id()
    and (project_id is null or public.current_user_can_read_project(project_id))
  );

drop policy if exists "ai jobs updatable by requester or ai admin" on public.ai_jobs;
create policy "ai jobs updatable by requester or ai admin" on public.ai_jobs
  for update to authenticated
  using (
    requested_by = public.current_app_user_id()
    or public.current_user_has_internal_permission('ai.configure')
  )
  with check (
    requested_by = public.current_app_user_id()
    or public.current_user_has_internal_permission('ai.configure')
  );

drop policy if exists "ai citations readable through interaction" on public.ai_citations;
create policy "ai citations readable through interaction" on public.ai_citations
  for select to authenticated
  using (
    exists (
      select 1
      from public.ai_interactions ai
      where ai.id = ai_citations.interaction_id
        and (
          ai.requested_by = public.current_app_user_id()
          or public.current_user_has_internal_permission('audit.view')
        )
    )
  );

drop policy if exists "ai citations insertable by ai users" on public.ai_citations;
create policy "ai citations insertable by ai users" on public.ai_citations
  for insert to authenticated
  with check (
    public.current_user_has_permission('ai.ask')
    and exists (
      select 1
      from public.ai_interactions ai
      where ai.id = ai_citations.interaction_id
        and ai.requested_by = public.current_app_user_id()
    )
  );

drop policy if exists "ai action proposals readable by requester or audit" on public.ai_action_proposals;
create policy "ai action proposals readable by requester or audit" on public.ai_action_proposals
  for select to authenticated
  using (
    requested_by = public.current_app_user_id()
    or public.current_user_has_internal_permission('audit.view')
  );

drop policy if exists "ai action proposals insertable by proposing users" on public.ai_action_proposals;
create policy "ai action proposals insertable by proposing users" on public.ai_action_proposals
  for insert to authenticated
  with check (
    public.current_user_has_permission('ai.propose_action')
    and requested_by = public.current_app_user_id()
    and status = 'proposed'
  );

drop policy if exists "ai action proposals updatable by confirmer" on public.ai_action_proposals;
create policy "ai action proposals updatable by confirmer" on public.ai_action_proposals
  for update to authenticated
  using (
    requested_by = public.current_app_user_id()
    or public.current_user_has_internal_permission('ai.configure')
  )
  with check (
    (
      requested_by = public.current_app_user_id()
      and (
        public.current_user_has_permission('ai.confirm_action')
        or status = 'rejected'
      )
    )
    or public.current_user_has_internal_permission('ai.configure')
  );
