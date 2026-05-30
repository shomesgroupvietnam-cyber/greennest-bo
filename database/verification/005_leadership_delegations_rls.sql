-- Verify leadership_delegations schema and RLS objects after Story 1.4.

select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'leadership_delegations';

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'leadership_delegations'
  and column_name in (
    'principal_user_id',
    'delegate_user_id',
    'action_keys',
    'organization_id',
    'project_id',
    'axis_id',
    'workstream_id',
    'module_id',
    'record_id',
    'is_active',
    'starts_at',
    'ends_at',
    'note',
    'created_by',
    'updated_by'
  )
order by column_name;

select relname, relrowsecurity
from pg_class
where oid = 'public.leadership_delegations'::regclass;

select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'leadership_delegations'
order by policyname;

select policyname, qual
from pg_policies
where schemaname = 'public'
  and tablename = 'users'
  and policyname = 'users can view self or permitted user list';

select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'leadership_delegations'
  and indexname in (
    'idx_leadership_delegations_delegate_active',
    'idx_leadership_delegations_principal_active',
    'idx_leadership_delegations_scope_lookup'
  )
order by indexname;

select proname
from pg_proc
where proname = 'validate_leadership_delegation_action_keys';

select key, module
from public.permissions
where key = 'delegation.manage';

select r.key as role_key, p.key as permission_key
from public.roles r
join public.role_permissions rp on rp.role_id = r.id
join public.permissions p on p.id = rp.permission_id
where p.key = 'delegation.manage'
order by r.key;

select r.key as role_key, p.key as forbidden_permission
from public.roles r
join public.role_permissions rp on rp.role_id = r.id
join public.permissions p on p.id = rp.permission_id
where r.key = 'thu_ky_tro_ly'
  and p.key in ('proposal.approve', 'proposal.reject', 'proposal.request_change', 'delegation.manage')
order by p.key;
