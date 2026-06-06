-- GreenNest BuildFlow Supabase staging validation queries.
-- Run after migrations, baseline seed data and RLS policies are applied.
-- These queries are read-only.

-- 1. Core table presence.
select
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'roles',
    'permissions',
    'role_permissions',
    'users',
    'workspaces',
    'workspace_members',
    'project_members',
    'projects',
    'tasks',
    'documents',
    'document_versions',
    'legal_steps',
    'meetings',
    'decisions',
    'report_runs',
    'knowledge_items',
    'knowledge_candidates',
    'knowledge_chunks',
    'source_registry_entries',
    'external_search_logs',
    'notifications',
    'audit_logs'
  )
order by table_name;

-- 2. Expected baseline row counts.
select 'roles' as check_name, count(*) as actual_count, 18 as expected_minimum from public.roles
union all
select 'permissions', count(*), 63 from public.permissions
union all
select 'role_permissions', count(*), 1 from public.role_permissions;

-- 3. Required role keys.
with expected_roles(key) as (
  values
    ('super_admin'),
    ('admin'),
    ('tong_giam_doc'),
    ('pho_tong_giam_doc'),
    ('giam_doc_du_an'),
    ('quan_ly_du_an'),
    ('to_truong'),
    ('phap_ly'),
    ('ke_toan'),
    ('thiet_ke'),
    ('ky_thuat'),
    ('thi_cong'),
    ('mua_hang'),
    ('thu_ky_tro_ly'),
    ('kiem_soat_noi_bo'),
    ('nha_thau'),
    ('tu_van'),
    ('viewer')
)
select expected_roles.key as missing_role_key
from expected_roles
left join public.roles on roles.key = expected_roles.key
where roles.key is null;

-- 4. Required permission keys used by the MVP and planned module boundary.
with expected_permissions(key) as (
  values
    ('project.view'), ('project.create'), ('project.update'), ('project.archive'), ('project.assign_member'),
    ('task.view'), ('task.create'), ('task.update'), ('task.update_own'), ('task.archive'),
    ('document.view'), ('document.create'), ('document.update'), ('document.approve'), ('document.archive'),
    ('legal.view'), ('legal.update'), ('legal.approve'), ('legal.configure_template'),
    ('meeting.view'), ('meeting.create'), ('meeting.update'), ('decision.create'), ('decision.approve'),
    ('report.view'), ('report.create'), ('report.export'),
    ('knowledge.view'), ('knowledge.create'), ('knowledge.create_candidate'), ('knowledge.promote'), ('knowledge.review'), ('knowledge.approve'), ('knowledge.manage_source_registry'),
    ('design.view'), ('design.create'), ('design.update'), ('design.review'), ('design.approve_change'),
    ('construction.view'), ('construction.update'), ('site_diary.create'), ('quality.update'), ('acceptance.approve'),
    ('finance.view'), ('finance.create'), ('finance.update'), ('finance.approve'), ('payment.request'), ('payment.approve'),
    ('user.view'), ('user.invite'), ('user.update_role'), ('settings.manage'), ('audit.view'),
    ('ai.use'), ('ai.ask'), ('ai.use_rag'), ('ai.view_insight'), ('ai.create_draft'), ('ai.propose_action'), ('ai.confirm_action'), ('ai.configure')
)
select expected_permissions.key as missing_permission_key
from expected_permissions
left join public.permissions on permissions.key = expected_permissions.key
where permissions.key is null;

-- 5. RLS enabled on application tables.
select
  relname as table_name,
  relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'roles',
    'permissions',
    'role_permissions',
    'users',
    'workspaces',
    'workspace_members',
    'project_members',
    'projects',
    'tasks',
    'documents',
    'document_versions',
    'legal_steps',
    'meetings',
    'decisions',
    'report_runs',
    'knowledge_items',
    'knowledge_candidates',
    'knowledge_chunks',
    'source_registry_entries',
    'external_search_logs',
    'notifications',
    'audit_logs'
  )
order by relname;

-- 6. Policy coverage by table.
select
  schemaname,
  tablename,
  count(*) as policy_count
from pg_policies
where schemaname = 'public'
group by schemaname, tablename
order by tablename;

-- 7. Trigger coverage for updated_at tables.
select
  event_object_table as table_name,
  trigger_name
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name like 'set_%_updated_at'
order by event_object_table;

-- 8. Foreign key coverage for core project-linked records.
select
  tc.table_name,
  tc.constraint_name,
  ccu.table_name as referenced_table
from information_schema.table_constraints tc
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in ('projects', 'tasks', 'documents', 'document_versions', 'legal_steps', 'project_members', 'report_runs', 'knowledge_chunks')
order by tc.table_name, tc.constraint_name;

-- 9. Optional storage bucket check. Returns zero rows until the bucket is created.
select
  id,
  name,
  public as is_public
from storage.buckets
where id = 'project-documents';

-- 10. Knowledge vector-ready column check.
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'knowledge_chunks'
  and column_name in ('embedding', 'embedding_model', 'embedded_at')
order by column_name;

-- 11. Post-manual-test assertions. Run after creating one project through the app.
select
  projects.id,
  projects.code,
  projects.name,
  count(legal_steps.id) as legal_step_count
from public.projects
left join public.legal_steps on legal_steps.project_id = projects.id
group by projects.id, projects.code, projects.name
order by projects.created_at desc
limit 5;
