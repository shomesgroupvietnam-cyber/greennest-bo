-- Deterministic staging seed for Sprint 8C external RLS isolation tests.
--
-- This seed is for staging validation only. It uses fixed public.users IDs so
-- verification SQL can simulate auth.uid() without requiring real Auth users.
-- For live manual tests, create matching Supabase Auth users and update
-- public.users.auth_user_id to those auth.users.id values.

insert into public.workspaces (id, name, slug, owner_id)
values (
  '10000000-0000-4000-8000-000000000001',
  'GreenNest Staging',
  'greennest-staging',
  null
)
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    updated_at = now();

insert into public.users (id, auth_user_id, full_name, email, role, status)
values
  ('20000000-0000-4000-8000-000000000001', null, 'Admin Staging', 'admin.rls@greennest.local', 'admin', 'active'),
  ('20000000-0000-4000-8000-000000000002', null, 'Quản lý dự án RLS', 'pm.rls@greennest.local', 'quan_ly_du_an', 'active'),
  ('20000000-0000-4000-8000-000000000003', null, 'Nhà thầu RLS', 'contractor.rls@greennest.local', 'nha_thau', 'active'),
  ('20000000-0000-4000-8000-000000000004', null, 'Tư vấn RLS', 'consultant.rls@greennest.local', 'tu_van', 'active'),
  ('20000000-0000-4000-8000-000000000005', null, 'Viewer RLS', 'viewer.rls@greennest.local', 'viewer', 'active')
on conflict (id) do update
set auth_user_id = coalesce(public.users.auth_user_id, excluded.auth_user_id),
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    updated_at = now();

update public.workspaces
set owner_id = '20000000-0000-4000-8000-000000000001'
where id = '10000000-0000-4000-8000-000000000001';

insert into public.workspace_members (id, workspace_id, user_id, role)
values
  ('21000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'admin'),
  ('21000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'quan_ly_du_an'),
  ('21000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'nha_thau'),
  ('21000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'tu_van'),
  ('21000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000005', 'viewer')
on conflict (workspace_id, user_id) do update
set role = excluded.role,
    updated_at = now();

insert into public.projects (
  id,
  workspace_id,
  code,
  name,
  location,
  area,
  project_type,
  investor,
  status,
  owner_name,
  owner_id,
  created_by
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'RLS-ASG-001',
    'Dự án RLS được phân công',
    'TP. Hồ Chí Minh',
    1200,
    'townhouse',
    'GreenNest',
    'active',
    'Quản lý dự án RLS',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'RLS-UNS-001',
    'Dự án RLS không phân công',
    'Đồng Nai',
    1800,
    'villa',
    'GreenNest',
    'active',
    'Quản lý dự án RLS',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001'
  )
on conflict (id) do update
set workspace_id = excluded.workspace_id,
    code = excluded.code,
    name = excluded.name,
    location = excluded.location,
    area = excluded.area,
    project_type = excluded.project_type,
    investor = excluded.investor,
    status = excluded.status,
    owner_name = excluded.owner_name,
    owner_id = excluded.owner_id,
    created_by = excluded.created_by,
    archived_at = null,
    updated_at = now();

insert into public.project_members (id, project_id, user_id, role)
values
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'quan_ly_du_an'),
  ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'quan_ly_du_an'),
  ('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'nha_thau'),
  ('31000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000005', 'viewer')
on conflict (project_id, user_id) do update
set role = excluded.role,
    updated_at = now();

insert into public.tasks (
  id,
  project_id,
  title,
  description,
  assignee_id,
  due_date,
  status,
  priority,
  category,
  created_by
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Nhà thầu cập nhật tiến độ gói được giao',
    'Task được giao cho nhà thầu để kiểm tra RLS.',
    '20000000-0000-4000-8000-000000000003',
    current_date + 7,
    'todo',
    'high',
    'construction',
    '20000000-0000-4000-8000-000000000002'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    'Task nội bộ không giao cho nhà thầu',
    'Nhà thầu không được thấy task này.',
    '20000000-0000-4000-8000-000000000002',
    current_date + 10,
    'todo',
    'medium',
    'project',
    '20000000-0000-4000-8000-000000000002'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    'Tư vấn rà soát hồ sơ thiết kế',
    'Task review được giao cho tư vấn.',
    '20000000-0000-4000-8000-000000000004',
    current_date + 5,
    'todo',
    'high',
    'design',
    '20000000-0000-4000-8000-000000000002'
  )
on conflict (id) do update
set project_id = excluded.project_id,
    title = excluded.title,
    description = excluded.description,
    assignee_id = excluded.assignee_id,
    due_date = excluded.due_date,
    status = excluded.status,
    priority = excluded.priority,
    category = excluded.category,
    created_by = excluded.created_by,
    archived_at = null,
    updated_at = now();

insert into public.documents (
  id,
  project_id,
  title,
  doc_type,
  version,
  external_url,
  status,
  owner_id,
  created_by
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Hồ sơ nhà thầu được giao',
    'construction',
    'v1',
    'https://example.com/contractor-assigned.pdf',
    'available',
    '20000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000002'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    'Hồ sơ nội bộ không phân công',
    'project',
    'v1',
    'https://example.com/internal-unassigned.pdf',
    'available',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    'Hồ sơ tư vấn cần review',
    'design',
    'v1',
    'https://example.com/consultant-review.pdf',
    'needs_update',
    '20000000-0000-4000-8000-000000000004',
    '20000000-0000-4000-8000-000000000002'
  )
on conflict (id) do update
set project_id = excluded.project_id,
    title = excluded.title,
    doc_type = excluded.doc_type,
    version = excluded.version,
    external_url = excluded.external_url,
    status = excluded.status,
    owner_id = excluded.owner_id,
    created_by = excluded.created_by,
    archived_at = null,
    updated_at = now();

insert into public.legal_steps (
  id,
  project_id,
  step_code,
  step_name,
  status,
  assignee_id,
  due_date,
  notes,
  order_index
)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'RLS-LEGAL-01',
    'Bước pháp lý dự án được phân công',
    'waiting_authority',
    '20000000-0000-4000-8000-000000000002',
    current_date + 14,
    'Dùng để kiểm tra tư vấn/viewer thấy theo scope, nhà thầu không thấy.',
    1
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000002',
    'RLS-LEGAL-02',
    'Bước pháp lý dự án không phân công',
    'blocked',
    '20000000-0000-4000-8000-000000000002',
    current_date + 21,
    'Dùng để kiểm tra dữ liệu ngoài scope.',
    1
  )
on conflict (project_id, step_code) do update
set step_name = excluded.step_name,
    status = excluded.status,
    assignee_id = excluded.assignee_id,
    due_date = excluded.due_date,
    notes = excluded.notes,
    order_index = excluded.order_index,
    updated_at = now();
