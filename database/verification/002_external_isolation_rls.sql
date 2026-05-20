-- Sprint 8C Supabase RLS external isolation verification.
--
-- Apply first:
-- 1. database/migrations/202605160001_create_mvp_core_schema.sql
-- 2. database/seeds/001_roles_permissions.sql
-- 3. database/policies/001_mvp_rls.sql
-- 4. database/seeds/002_rls_external_isolation_seed.sql
--
-- This script simulates authenticated Supabase users by setting
-- request.jwt.claim.sub to fixed public.users IDs from the staging seed.
-- It is intended for staging SQL editor or psql. It should not be used in production.

-- 1. Helper function presence.
select
  proname as helper_function
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'current_app_user_id',
    'current_app_role',
    'current_app_role_scope',
    'current_user_is_external',
    'current_user_is_viewer',
    'current_user_has_permission',
    'current_user_has_internal_permission',
    'current_user_is_project_member',
    'current_user_has_task_assignment',
    'current_user_has_document_assignment',
    'current_user_can_read_project',
    'current_user_can_read_task',
    'current_user_can_read_document',
    'current_user_can_read_legal_step',
    'current_user_can_create_document',
    'current_user_can_update_document'
  )
order by proname;

-- 2. Contractor can read assigned records and cannot read unassigned records.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000003', true);

select
  'contractor_assigned_project_only' as check_name,
  coalesce(array_agg(code order by code) = array['RLS-ASG-001']::text[], false) as passed,
  coalesce(array_to_string(array_agg(code order by code), ', '), '<none>') as visible_codes
from public.projects
where code like 'RLS-%';

select
  'contractor_assigned_task_only' as check_name,
  coalesce(array_agg(id order by id) = array['40000000-0000-4000-8000-000000000001'::uuid], false) as passed,
  coalesce(array_to_string(array_agg(title order by id), ', '), '<none>') as visible_tasks
from public.tasks
where id in (
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000003'
);

select
  'contractor_assigned_document_only' as check_name,
  coalesce(array_agg(id order by id) = array['50000000-0000-4000-8000-000000000001'::uuid], false) as passed,
  coalesce(array_to_string(array_agg(title order by id), ', '), '<none>') as visible_documents
from public.documents
where id in (
  '50000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000003'
);

select
  'contractor_no_legal_steps' as check_name,
  count(*) = 0 as passed,
  count(*) as visible_legal_steps
from public.legal_steps
where project_id in (
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002'
);
commit;

-- 3. Consultant can read assigned review scope and cannot read unassigned contractor/internal records.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000004', true);

select
  'consultant_assigned_project_only' as check_name,
  coalesce(array_agg(code order by code) = array['RLS-ASG-001']::text[], false) as passed,
  coalesce(array_to_string(array_agg(code order by code), ', '), '<none>') as visible_codes
from public.projects
where code like 'RLS-%';

select
  'consultant_assigned_task_only' as check_name,
  coalesce(array_agg(id order by id) = array['40000000-0000-4000-8000-000000000003'::uuid], false) as passed,
  coalesce(array_to_string(array_agg(title order by id), ', '), '<none>') as visible_tasks
from public.tasks
where id in (
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  '40000000-0000-4000-8000-000000000003'
);

select
  'consultant_assigned_document_only' as check_name,
  coalesce(array_agg(id order by id) = array['50000000-0000-4000-8000-000000000003'::uuid], false) as passed,
  coalesce(array_to_string(array_agg(title order by id), ', '), '<none>') as visible_documents
from public.documents
where id in (
  '50000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000003'
);

select
  'consultant_assigned_legal_project_only' as check_name,
  coalesce(array_agg(project_id order by project_id) = array['30000000-0000-4000-8000-000000000001'::uuid], false) as passed,
  count(*) as visible_legal_steps
from public.legal_steps
where project_id in (
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000002'
);
commit;

-- 4. Viewer can read assigned project scope and cannot mutate.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000005', true);

select
  'viewer_assigned_project_only' as check_name,
  coalesce(array_agg(code order by code) = array['RLS-ASG-001']::text[], false) as passed,
  coalesce(array_to_string(array_agg(code order by code), ', '), '<none>') as visible_codes
from public.projects
where code like 'RLS-%';

select
  'viewer_read_only_permissions' as check_name,
  public.current_user_has_permission('project.view') = true
    and public.current_user_has_permission('project.create') = false
    and public.current_user_has_permission('task.create') = false
    and public.current_user_has_permission('document.update') = false as passed,
  public.current_app_role() as role_key;

do $$
begin
  insert into public.tasks (
    id,
    project_id,
    title,
    status,
    priority,
    created_by
  )
  values (
    '49000000-0000-4000-8000-000000000099',
    '30000000-0000-4000-8000-000000000001',
    'Viewer mutation should be blocked',
    'todo',
    'low',
    '20000000-0000-4000-8000-000000000005'
  );

  raise exception 'FAIL: viewer task insert was allowed unexpectedly';
exception
  when insufficient_privilege then
    raise notice 'PASS: viewer task insert was denied by RLS';
end $$;
commit;

-- 5. Internal PM/admin can access expected RLS seed records.
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);

select
  'pm_can_read_all_seed_projects' as check_name,
  count(*) = 2 as passed,
  count(*) as visible_projects
from public.projects
where code like 'RLS-%';

select
  'pm_can_read_all_seed_tasks_documents_legal' as check_name,
  (select count(*) from public.tasks where id in (
    '40000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000003'
  )) = 3
  and (select count(*) from public.documents where id in (
    '50000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000002',
    '50000000-0000-4000-8000-000000000003'
  )) = 3
  and (select count(*) from public.legal_steps where project_id in (
    '30000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002'
  )) = 2 as passed;
commit;

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);

select
  'admin_can_read_all_seed_projects' as check_name,
  count(*) = 2 as passed,
  count(*) as visible_projects
from public.projects
where code like 'RLS-%';
commit;
