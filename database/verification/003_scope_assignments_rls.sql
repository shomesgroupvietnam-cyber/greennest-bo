-- Verify access_scope_assignments schema and RLS objects after Story 1.2.

select
  table_name,
  row_security as rls_enabled
from information_schema.tables
join pg_class on pg_class.relname = information_schema.tables.table_name
where table_schema = 'public'
  and table_name = 'access_scope_assignments';

select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'access_scope_assignments'
order by ordinal_position;

select
  policyname,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'access_scope_assignments'
order by policyname;

select
  indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'access_scope_assignments'
order by indexname;
