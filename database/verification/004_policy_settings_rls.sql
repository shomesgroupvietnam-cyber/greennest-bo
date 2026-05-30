-- Story 1.3 verification for policy settings tables and RLS.
--
-- This script is intended for staging SQL editor or psql. The behavior checks
-- insert temporary verification rows inside transactions and roll them back.

select
  relname as table_name,
  relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('approval_threshold_policies', 'risk_group_configs')
order by relname;

select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('approval_threshold_policies', 'risk_group_configs')
  and column_name in (
    'policy_key',
    'target_type',
    'amount_min',
    'amount_max',
    'approval_level',
    'approver_role_key',
    'required_permission_key',
    'risk_key',
    'default_severity',
    'module_id',
    'created_by',
    'updated_by',
    'created_at',
    'updated_at'
  )
order by table_name, column_name;

select
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('approval_threshold_policies', 'risk_group_configs')
order by tablename, policyname;

select
  'active_read_predicates_installed' as check_name,
  count(*) filter (
    where cmd = 'SELECT'
      and qual ilike '%is_active%'
      and qual ilike '%settings.manage%'
  ) = 2 as passed,
  array_agg(policyname order by policyname) filter (where cmd = 'SELECT') as select_policies
from pg_policies
where schemaname = 'public'
  and tablename in ('approval_threshold_policies', 'risk_group_configs');

select
  'manager_write_predicates_installed' as check_name,
  count(*) filter (
    where cmd in ('INSERT', 'UPDATE')
      and coalesce(with_check, '') ilike '%settings.manage%'
  ) = 4 as passed,
  array_agg(policyname order by policyname) filter (where cmd in ('INSERT', 'UPDATE')) as write_policies
from pg_policies
where schemaname = 'public'
  and tablename in ('approval_threshold_policies', 'risk_group_configs');

select
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('approval_threshold_policies', 'risk_group_configs')
order by tablename, indexname;

select
  tgrelid::regclass::text as table_name,
  tgname as trigger_name
from pg_trigger
where not tgisinternal
  and tgrelid in (
    'public.approval_threshold_policies'::regclass,
    'public.risk_group_configs'::regclass
  )
order by table_name, trigger_name;

select
  policy_key,
  target_type,
  amount_min,
  amount_max,
  approval_level,
  approver_role_key,
  required_permission_key,
  is_active
from public.approval_threshold_policies
order by priority;

select
  risk_key,
  label_vi,
  default_severity,
  module_id,
  sort_order,
  is_default,
  is_active
from public.risk_group_configs
order by sort_order;

select
  'admin_has_no_business_approval_permissions' as check_name,
  count(*) = 0 as passed,
  coalesce(array_to_string(array_agg(p.key order by p.key), ', '), '<none>') as forbidden_permissions
from public.roles r
join public.role_permissions rp on rp.role_id = r.id
join public.permissions p on p.id = rp.permission_id
where r.key = 'admin'
  and public.is_business_approval_permission(p.key);

begin;
insert into public.users (id, auth_user_id, full_name, email, role, status)
values
  ('26000000-0000-4000-8000-000000000001', null, 'Policy Admin RLS', 'policy-admin.rls@greennest.local', 'admin', 'active'),
  ('26000000-0000-4000-8000-000000000002', null, 'Policy Viewer RLS', 'policy-viewer.rls@greennest.local', 'viewer', 'active')
on conflict (id) do update
set auth_user_id = coalesce(public.users.auth_user_id, excluded.auth_user_id),
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    updated_at = now();

insert into public.approval_threshold_policies (
  id,
  policy_key,
  label_vi,
  target_type,
  amount_min,
  amount_max,
  currency,
  approval_level,
  approver_role_key,
  required_permission_key,
  escalate_on_risk_levels,
  is_active,
  priority
) values
  ('rls-policy-active', 'rls_active_policy', 'RLS active policy', 'general', 0, 999999.99, 'VND', 'DEPARTMENT_HEAD', 'dau_tu_phat_trien', 'proposal.review', array[]::text[], true, 9000),
  ('rls-policy-inactive', 'rls_inactive_policy', 'RLS inactive policy', 'general', 1000000, 1999999.99, 'VND', 'DEPARTMENT_HEAD', 'dau_tu_phat_trien', 'proposal.review', array[]::text[], false, 9010)
on conflict (policy_key) do update
set label_vi = excluded.label_vi,
    is_active = excluded.is_active,
    updated_at = now();

insert into public.risk_group_configs (
  id,
  risk_key,
  label_vi,
  description,
  default_severity,
  module_id,
  sort_order,
  is_default,
  is_active
) values
  ('rls-risk-active', 'rls_active_risk', 'RLS active risk', 'Visible active risk group.', 'low', 'settings', 9000, false, true),
  ('rls-risk-inactive', 'rls_inactive_risk', 'RLS inactive risk', 'Hidden inactive risk group.', 'low', 'settings', 9010, false, false)
on conflict (risk_key) do update
set label_vi = excluded.label_vi,
    is_active = excluded.is_active,
    updated_at = now();

set local role authenticated;
select set_config('request.jwt.claim.sub', '26000000-0000-4000-8000-000000000002', true);

select
  'viewer_reads_active_policy_only' as check_name,
  coalesce(array_agg(policy_key order by policy_key), array[]::text[]) = array['rls_active_policy']::text[] as passed,
  coalesce(array_to_string(array_agg(policy_key order by policy_key), ', '), '<none>') as visible_policy_keys
from public.approval_threshold_policies
where policy_key like 'rls_%';

select
  'viewer_reads_active_risk_only' as check_name,
  coalesce(array_agg(risk_key order by risk_key), array[]::text[]) = array['rls_active_risk']::text[] as passed,
  coalesce(array_to_string(array_agg(risk_key order by risk_key), ', '), '<none>') as visible_risk_keys
from public.risk_group_configs
where risk_key like 'rls_%';

do $$
begin
  update public.approval_threshold_policies
  set label_vi = 'Viewer mutation should not persist'
  where policy_key = 'rls_active_policy';

  if exists (
    select 1
    from public.approval_threshold_policies
    where policy_key = 'rls_active_policy'
      and label_vi = 'Viewer mutation should not persist'
  ) then
    raise exception 'FAIL: viewer approval policy update was allowed unexpectedly';
  end if;

  raise notice 'PASS: viewer approval policy update did not change rows';
exception
  when insufficient_privilege then
    raise notice 'PASS: viewer approval policy update was denied by RLS';
end $$;

do $$
begin
  insert into public.risk_group_configs (
    id,
    risk_key,
    label_vi,
    default_severity,
    sort_order,
    is_default,
    is_active
  )
  values (
    'rls-risk-viewer-insert',
    'rls_viewer_insert',
    'Viewer insert should fail',
    'low',
    9020,
    false,
    true
  );

  raise exception 'FAIL: viewer risk group insert was allowed unexpectedly';
exception
  when insufficient_privilege then
    raise notice 'PASS: viewer risk group insert was denied by RLS';
end $$;
rollback;

begin;
insert into public.users (id, auth_user_id, full_name, email, role, status)
values
  ('26000000-0000-4000-8000-000000000001', null, 'Policy Admin RLS', 'policy-admin.rls@greennest.local', 'admin', 'active')
on conflict (id) do update
set auth_user_id = coalesce(public.users.auth_user_id, excluded.auth_user_id),
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    updated_at = now();

insert into public.approval_threshold_policies (
  id,
  policy_key,
  label_vi,
  target_type,
  amount_min,
  amount_max,
  currency,
  approval_level,
  approver_role_key,
  required_permission_key,
  escalate_on_risk_levels,
  is_active,
  priority
) values
  ('rls-policy-active', 'rls_active_policy', 'RLS active policy', 'general', 0, 999999.99, 'VND', 'DEPARTMENT_HEAD', 'dau_tu_phat_trien', 'proposal.review', array[]::text[], true, 9000),
  ('rls-policy-inactive', 'rls_inactive_policy', 'RLS inactive policy', 'general', 1000000, 1999999.99, 'VND', 'DEPARTMENT_HEAD', 'dau_tu_phat_trien', 'proposal.review', array[]::text[], false, 9010)
on conflict (policy_key) do update
set label_vi = excluded.label_vi,
    is_active = excluded.is_active,
    updated_at = now();

set local role authenticated;
select set_config('request.jwt.claim.sub', '26000000-0000-4000-8000-000000000001', true);

select
  'settings_manager_reads_active_and_inactive_policy' as check_name,
  coalesce(array_agg(policy_key order by policy_key), array[]::text[]) = array['rls_active_policy', 'rls_inactive_policy']::text[] as passed,
  coalesce(array_to_string(array_agg(policy_key order by policy_key), ', '), '<none>') as visible_policy_keys
from public.approval_threshold_policies
where policy_key like 'rls_%';

update public.approval_threshold_policies
set label_vi = 'RLS manager update'
where policy_key = 'rls_inactive_policy';

select
  'settings_manager_can_update_policy' as check_name,
  count(*) = 1 as passed
from public.approval_threshold_policies
where policy_key = 'rls_inactive_policy'
  and label_vi = 'RLS manager update';
rollback;
