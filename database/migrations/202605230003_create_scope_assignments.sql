-- Scope assignments for user + role + permission + operating scope.

create table if not exists public.access_scope_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role_key text not null references public.roles(key),
  organization_id text,
  project_id text,
  axis_id text,
  workstream_id text,
  module_id text,
  record_id text,
  permission_keys text[] not null default array[]::text[],
  scope_type text not null default 'scoped' check (scope_type in ('scoped', 'global')),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint access_scope_assignments_has_scope check (
    scope_type = 'global'
    or organization_id is not null
    or project_id is not null
    or axis_id is not null
    or workstream_id is not null
    or module_id is not null
    or record_id is not null
  ),
  constraint access_scope_assignments_valid_time check (
    starts_at is null
    or ends_at is null
    or starts_at <= ends_at
  )
);

create index if not exists idx_access_scope_assignments_user_active
  on public.access_scope_assignments (user_id, is_active);

create index if not exists idx_access_scope_assignments_project_axis_module
  on public.access_scope_assignments (project_id, axis_id, module_id, is_active);

create index if not exists idx_access_scope_assignments_scope_lookup
  on public.access_scope_assignments (
    user_id,
    organization_id,
    project_id,
    axis_id,
    workstream_id,
    module_id,
    record_id,
    is_active
  );

alter table public.access_scope_assignments enable row level security;

create or replace function public.current_user_has_scope_assignment_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.access_scope_assignments asa
    where asa.user_id = public.current_app_user_id()
      and asa.is_active = true
      and asa.scope_type = 'global'
      and (asa.starts_at is null or asa.starts_at <= now())
      and (asa.ends_at is null or asa.ends_at >= now())
      and permission_key = any(asa.permission_keys)
  )
$$;

drop policy if exists "scope assignments readable by owner or settings managers" on public.access_scope_assignments;
create policy "scope assignments readable by owner or settings managers" on public.access_scope_assignments
  for select to authenticated
  using (
    user_id = public.current_app_user_id()
    or public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  );

drop policy if exists "scope assignments insertable by settings managers" on public.access_scope_assignments;
create policy "scope assignments insertable by settings managers" on public.access_scope_assignments
  for insert to authenticated
  with check (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  );

drop policy if exists "scope assignments updatable by settings managers" on public.access_scope_assignments;
create policy "scope assignments updatable by settings managers" on public.access_scope_assignments
  for update to authenticated
  using (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  )
  with check (
    public.current_user_has_internal_permission('settings.manage')
    or public.current_user_has_scope_assignment_permission('settings.manage')
  );
