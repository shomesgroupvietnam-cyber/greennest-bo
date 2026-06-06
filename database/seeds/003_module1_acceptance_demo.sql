-- Module 1 acceptance demo seed.
--
-- Local/staging/demo only. Do not load this file into production.
-- Apply after core migrations, 001_roles_permissions.sql, policy settings,
-- scope assignments and leadership delegation migrations.
--
-- Auth mapping note: public.users.auth_user_id is intentionally null. For live
-- manual Supabase Auth tests, create matching auth.users rows and update
-- public.users.auth_user_id to those IDs.

insert into public.workspaces (id, name, slug, owner_id)
values (
  '10000000-0000-4000-8000-000000000101',
  'GreenNest Module 1 Demo',
  'greennest-module-1-demo',
  null
)
on conflict (id) do update
set name = excluded.name,
    slug = excluded.slug,
    updated_at = now();

insert into public.users (id, auth_user_id, full_name, email, role, status)
values
  ('20000000-0000-4000-8000-000000000101', null, 'Nguyen Thanh Binh', 'chairman@greennest.vn', 'chu_tich', 'active'),
  ('20000000-0000-4000-8000-000000000111', null, 'Tran Quan Tri He Thong', 'super.admin@greennest.vn', 'super_admin', 'active'),
  ('20000000-0000-4000-8000-000000000102', null, 'Nguyen Minh Anh', 'admin@greennest.vn', 'admin', 'active'),
  ('20000000-0000-4000-8000-000000000103', null, 'Dang Quoc Bao', 'ceo@greennest.vn', 'tong_giam_doc', 'active'),
  ('20000000-0000-4000-8000-000000000104', null, 'Hoang Gia Khanh', 'director@greennest.vn', 'giam_doc_du_an', 'active'),
  ('20000000-0000-4000-8000-000000000105', null, 'Le Quang Huy', 'department.head@greennest.vn', 'to_truong', 'active'),
  ('20000000-0000-4000-8000-000000000106', null, 'Trinh Mai Anh', 'assistant@greennest.vn', 'thu_ky_tro_ly', 'active'),
  ('20000000-0000-4000-8000-000000000107', null, 'Nguoi xem demo', 'viewer@greennest.vn', 'viewer', 'active'),
  ('20000000-0000-4000-8000-000000000108', null, 'Dinh Tai Chinh', 'finance.manager@greennest.vn', 'quan_ly_tai_chinh', 'active'),
  ('20000000-0000-4000-8000-000000000109', null, 'Pham Thu Ha', 'legal@greennest.vn', 'phap_ly', 'active'),
  ('20000000-0000-4000-8000-000000000110', null, 'Ngo Thanh Tam', 'pm@greennest.vn', 'quan_ly_du_an', 'active')
on conflict (id) do update
set auth_user_id = coalesce(public.users.auth_user_id, excluded.auth_user_id),
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role,
    status = excluded.status,
    updated_at = now();

update public.workspaces
set owner_id = '20000000-0000-4000-8000-000000000101'
where id = '10000000-0000-4000-8000-000000000101';

insert into public.workspace_members (id, workspace_id, user_id, role)
values
  ('21000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000101', 'chu_tich'),
  ('21000000-0000-4000-8000-000000000108', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000111', 'super_admin'),
  ('21000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000103', 'tong_giam_doc'),
  ('21000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000104', 'giam_doc_du_an'),
  ('21000000-0000-4000-8000-000000000104', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000105', 'to_truong'),
  ('21000000-0000-4000-8000-000000000105', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000106', 'thu_ky_tro_ly'),
  ('21000000-0000-4000-8000-000000000106', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000107', 'viewer'),
  ('21000000-0000-4000-8000-000000000107', '10000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000102', 'admin')
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
  ('30000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000101', 'GN-2026-001', 'GreenNest Riverside', 'TP. Thu Duc, TP.HCM', 12500, 'Khu nha o thap tang', 'GreenNest Investment', 'active', 'Hoang Gia Khanh', '20000000-0000-4000-8000-000000000104', '20000000-0000-4000-8000-000000000102'),
  ('30000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000101', 'GN-2026-002', 'GreenNest Garden', 'Binh Duong', 8200, 'Chung cu trung tang', 'GreenNest Investment', 'planning', 'Le Quang Huy', '20000000-0000-4000-8000-000000000105', '20000000-0000-4000-8000-000000000102'),
  ('30000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000101', 'GN-2026-003', 'GreenNest Skyline', 'Da Nang', 16400, 'Can ho cao tang', 'GreenNest Investment', 'active', 'Dang Quoc Bao', '20000000-0000-4000-8000-000000000103', '20000000-0000-4000-8000-000000000102'),
  ('30000000-0000-4000-8000-000000000104', '10000000-0000-4000-8000-000000000101', 'GN-2026-004', 'GreenNest Axis 2/3 Lab', 'Dong Nai', 6200, 'Du an placeholder module sau', 'GreenNest Innovation', 'paused', 'Tran Hoang Nam', null, '20000000-0000-4000-8000-000000000102')
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
  ('31000000-0000-4000-8000-000000000101', '30000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000104', 'giam_doc_du_an'),
  ('31000000-0000-4000-8000-000000000102', '30000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000106', 'thu_ky_tro_ly'),
  ('31000000-0000-4000-8000-000000000103', '30000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000108', 'quan_ly_tai_chinh'),
  ('31000000-0000-4000-8000-000000000104', '30000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000105', 'to_truong'),
  ('31000000-0000-4000-8000-000000000105', '30000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000107', 'viewer')
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
  ('40000000-0000-4000-8000-000000000101', '30000000-0000-4000-8000-000000000101', 'Bo sung ho so chu truong dau tu', 'Blocked legal task cho Module 1 acceptance.', '20000000-0000-4000-8000-000000000109', date '2026-05-21', 'blocked', 'urgent', 'Phap ly', '20000000-0000-4000-8000-000000000102'),
  ('40000000-0000-4000-8000-000000000102', '30000000-0000-4000-8000-000000000101', 'Theo doi action item sau hop dieu hanh Riverside', 'Follow-up task linked to decision tracking.', '20000000-0000-4000-8000-000000000106', date '2026-05-25', 'todo', 'high', 'Follow-up', '20000000-0000-4000-8000-000000000106'),
  ('40000000-0000-4000-8000-000000000103', '30000000-0000-4000-8000-000000000104', 'Chuan bi placeholder Approval Center Axis 2/3', 'Fixture cho cac module sau.', '20000000-0000-4000-8000-000000000110', date '2026-05-30', 'waiting', 'medium', 'Approval Center', '20000000-0000-4000-8000-000000000102')
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
  classification,
  version,
  external_url,
  status,
  owner_id,
  approval_status,
  reviewer_id,
  reviewed_at,
  approval_notes,
  created_by
)
values
  ('50000000-0000-4000-8000-000000000101', '30000000-0000-4000-8000-000000000101', 'Ho so de xuat dau tu Riverside', 'legal_submission', 'RESTRICTED', 'v2', 'https://example.com/greennest/riverside/de-xuat-dau-tu', 'needs_update', '20000000-0000-4000-8000-000000000109', 'rejected', '20000000-0000-4000-8000-000000000104', timestamp with time zone '2026-05-22T00:00:00Z', 'Can bo sung phan phap ly.', '20000000-0000-4000-8000-000000000102'),
  ('50000000-0000-4000-8000-000000000102', '30000000-0000-4000-8000-000000000102', 'Tai lieu phap ly quy dat Garden', 'land_record', 'INTERNAL', 'v1', null, 'missing', '20000000-0000-4000-8000-000000000109', 'not_submitted', null, null, null, '20000000-0000-4000-8000-000000000102'),
  ('50000000-0000-4000-8000-000000000103', '30000000-0000-4000-8000-000000000101', 'Bang tong hop ngan sach Riverside', 'finance_budget', 'CONFIDENTIAL', 'v1', 'https://example.com/greennest/riverside/ngan-sach', 'complete', '20000000-0000-4000-8000-000000000108', 'approved', '20000000-0000-4000-8000-000000000103', timestamp with time zone '2026-05-22T00:00:00Z', 'Finance-sensitive fixture.', '20000000-0000-4000-8000-000000000102')
on conflict (id) do update
set project_id = excluded.project_id,
    title = excluded.title,
    doc_type = excluded.doc_type,
    classification = excluded.classification,
    version = excluded.version,
    external_url = excluded.external_url,
    status = excluded.status,
    owner_id = excluded.owner_id,
    approval_status = excluded.approval_status,
    reviewer_id = excluded.reviewer_id,
    reviewed_at = excluded.reviewed_at,
    approval_notes = excluded.approval_notes,
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
  related_document_ids,
  order_index
)
values
  ('60000000-0000-4000-8000-000000000101', '30000000-0000-4000-8000-000000000101', 'investment_policy', 'Chu truong dau tu', 'blocked', '20000000-0000-4000-8000-000000000109', date '2026-05-22', 'Legal risk fixture: can bo sung ho so truoc khi trinh lai.', array['50000000-0000-4000-8000-000000000101']::uuid[], 1),
  ('60000000-0000-4000-8000-000000000102', '30000000-0000-4000-8000-000000000102', 'land_survey', 'Khao sat quy dat', 'waiting_authority', '20000000-0000-4000-8000-000000000109', date '2026-05-27', 'Missing land record fixture.', array['50000000-0000-4000-8000-000000000102']::uuid[], 1)
on conflict (project_id, step_code) do update
set step_name = excluded.step_name,
    status = excluded.status,
    assignee_id = excluded.assignee_id,
    due_date = excluded.due_date,
    notes = excluded.notes,
    related_document_ids = excluded.related_document_ids,
    order_index = excluded.order_index,
    updated_at = now();

insert into public.meetings (
  id,
  organization_id,
  project_id,
  project_ids,
  axis_id,
  title,
  meeting_type,
  visibility,
  participant_scope,
  status,
  meeting_date,
  start_time,
  host_id,
  participants,
  agenda,
  ai_summary,
  meeting_minutes,
  decisions,
  follow_up_actions,
  related_approvals,
  related_tasks,
  summary,
  created_by
)
values
  (
    '70000000-0000-4000-8000-000000000101',
    'org-greennest',
    '30000000-0000-4000-8000-000000000101',
    array['30000000-0000-4000-8000-000000000101']::uuid[],
    'axis-1',
    'Hop dieu hanh Riverside Module 1',
    'EXECUTIVE_OPERATIONAL_MEETING',
    'executive',
    'project_team',
    'FOLLOW_UP_PENDING',
    timestamp with time zone '2026-05-23T02:00:00Z',
    timestamp with time zone '2026-05-23T02:00:00Z',
    '20000000-0000-4000-8000-000000000103',
    array['20000000-0000-4000-8000-000000000103','20000000-0000-4000-8000-000000000104','20000000-0000-4000-8000-000000000106']::uuid[],
    'Review legal risk, overdue approval and finance-sensitive data.',
    '{"status":"DRAFT","content":"Riverside co legal risk va approval qua han."}'::jsonb,
    'Draft minutes: tach follow-up thanh task va bao cao CEO.',
    '[{"id":"decision-track-riverside-follow-up","decisionText":"Theo doi action item","ownerId":"20000000-0000-4000-8000-000000000106","dueDate":"2026-05-25","status":"open","relatedTaskId":"40000000-0000-4000-8000-000000000102"}]'::jsonb,
    '[{"id":"follow-up-riverside-legal","title":"Theo doi bo sung ho so phap ly","ownerId":"20000000-0000-4000-8000-000000000106","dueDate":"2026-05-25","relatedTaskId":"40000000-0000-4000-8000-000000000102","status":"open"}]'::jsonb,
    array['proposal-demo-overdue-approval']::text[],
    array['40000000-0000-4000-8000-000000000102']::uuid[],
    'Meeting fixture cho minutes, AI summary draft, follow-up va decision tracking.',
    '20000000-0000-4000-8000-000000000106'
  )
on conflict (id) do update
set organization_id = excluded.organization_id,
    project_id = excluded.project_id,
    project_ids = excluded.project_ids,
    axis_id = excluded.axis_id,
    title = excluded.title,
    meeting_type = excluded.meeting_type,
    visibility = excluded.visibility,
    participant_scope = excluded.participant_scope,
    status = excluded.status,
    meeting_date = excluded.meeting_date,
    start_time = excluded.start_time,
    host_id = excluded.host_id,
    participants = excluded.participants,
    agenda = excluded.agenda,
    ai_summary = excluded.ai_summary,
    meeting_minutes = excluded.meeting_minutes,
    decisions = excluded.decisions,
    follow_up_actions = excluded.follow_up_actions,
    related_approvals = excluded.related_approvals,
    related_tasks = excluded.related_tasks,
    summary = excluded.summary,
    created_by = excluded.created_by,
    updated_at = now();

insert into public.decisions (
  id,
  meeting_id,
  project_id,
  decision_text,
  owner_id,
  due_date,
  status,
  task_id
)
values (
  '71000000-0000-4000-8000-000000000101',
  '70000000-0000-4000-8000-000000000101',
  '30000000-0000-4000-8000-000000000101',
  'Thu ky theo doi action item va cap nhat truoc buoi hop sau.',
  '20000000-0000-4000-8000-000000000106',
  date '2026-05-25',
  'open',
  '40000000-0000-4000-8000-000000000102'
)
on conflict (id) do update
set meeting_id = excluded.meeting_id,
    project_id = excluded.project_id,
    decision_text = excluded.decision_text,
    owner_id = excluded.owner_id,
    due_date = excluded.due_date,
    status = excluded.status,
    task_id = excluded.task_id,
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
)
values
  ('policy-approval-under-20m', 'approval_under_20m', 'Duoi 20 trieu', 'general', 0, 19999999.99, 'VND', 'DEPARTMENT_HEAD', 'dau_tu_phat_trien', 'proposal.review', array['high','critical']::text[], true, 100),
  ('policy-approval-20m-200m', 'approval_20m_200m', '20 trieu den 200 trieu', 'general', 20000000, 199999999.99, 'VND', 'PROJECT_DIRECTOR', 'quan_ly_tai_chinh', 'proposal.approve', array['high','critical']::text[], true, 110),
  ('policy-approval-200m-2b', 'approval_200m_2b', '200 trieu den 2 ty', 'general', 200000000, 1999999999.99, 'VND', 'CEO', 'tong_giam_doc', 'proposal.approve', array['critical']::text[], true, 120),
  ('policy-approval-over-2b', 'approval_over_2b', 'Tren 2 ty', 'general', 2000000000, null, 'VND', 'CHAIRMAN', 'chu_tich', 'proposal.approve', array['high','critical']::text[], true, 130)
on conflict (policy_key) do update
set label_vi = excluded.label_vi,
    target_type = excluded.target_type,
    amount_min = excluded.amount_min,
    amount_max = excluded.amount_max,
    currency = excluded.currency,
    approval_level = excluded.approval_level,
    approver_role_key = excluded.approver_role_key,
    required_permission_key = excluded.required_permission_key,
    escalate_on_risk_levels = excluded.escalate_on_risk_levels,
    is_active = excluded.is_active,
    priority = excluded.priority,
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
)
values
  ('risk-group-legal', 'legal', 'Phap ly', 'Rui ro phap ly, ho so dat, chap thuan va tranh chap.', 'high', 'legal', 10, true, true),
  ('risk-group-approval', 'approval', 'Approval', 'Rui ro cham hoac vuot nguong phe duyet.', 'medium', 'proposal', 30, true, true),
  ('risk-group-finance', 'finance', 'Tai chinh', 'Rui ro dong tien, ngan sach, thanh toan hoac vuot chi phi.', 'high', 'finance', 50, true, true),
  ('risk-group-missing-document', 'missing_document', 'Ho so thieu', 'Rui ro thieu ho so, tai lieu hoac bang chung bat buoc.', 'medium', 'document', 60, true, true)
on conflict (risk_key) do update
set label_vi = excluded.label_vi,
    description = excluded.description,
    default_severity = excluded.default_severity,
    module_id = excluded.module_id,
    sort_order = excluded.sort_order,
    is_default = excluded.is_default,
    is_active = excluded.is_active,
    updated_at = now();

insert into public.proposals (
  id,
  code,
  title,
  type,
  project_id,
  module,
  requested_by,
  submitted_by,
  on_behalf_of,
  delegation_id,
  owner_id,
  current_step_id,
  status,
  priority,
  amount,
  due_date,
  summary,
  ai_review_status,
  ai_review_summary
)
values
  ('proposal-demo-overdue-approval', 'DX-OVERDUE-DEMO', 'De xuat phe duyet ngan sach bo sung Riverside qua han', 'finance', '30000000-0000-4000-8000-000000000101', 'finance', '20000000-0000-4000-8000-000000000108', '20000000-0000-4000-8000-000000000108', null, null, '20000000-0000-4000-8000-000000000103', 'proposal-step-demo-overdue-approval', 'in_review', 'urgent', 2100000000, date '2026-05-22', 'Approval qua han de verify queue, escalation va finance visibility.', 'warning', 'Vuot nguong 2 ty, can Chu tich phe duyet.'),
  ('proposal-axis-2-placeholder', 'DX-AXIS2-DEMO', 'Placeholder approval Axis 2', 'general', '30000000-0000-4000-8000-000000000104', 'axis-2', '20000000-0000-4000-8000-000000000110', '20000000-0000-4000-8000-000000000110', null, null, null, null, 'draft', 'normal', 10000000, null, 'Fixture placeholder cho Approval Center Axis 2.', 'not_checked', null),
  ('proposal-axis-3-placeholder', 'DX-AXIS3-DEMO', 'Placeholder approval Axis 3', 'general', '30000000-0000-4000-8000-000000000104', 'axis-3', '20000000-0000-4000-8000-000000000110', '20000000-0000-4000-8000-000000000110', null, null, null, null, 'draft', 'normal', 15000000, null, 'Fixture placeholder cho Approval Center Axis 3.', 'not_checked', null),
  ('proposal-demo-on-behalf-ceo', 'DX-ONBEHALF-DEMO', 'Thu ky tao de xuat thay CEO trong scope Riverside', 'general', '30000000-0000-4000-8000-000000000101', 'proposal', '20000000-0000-4000-8000-000000000103', '20000000-0000-4000-8000-000000000106', '20000000-0000-4000-8000-000000000103', '33000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000103', null, 'draft', 'high', 18000000, null, 'Fixture positive delegation: assistant duoc tao proposal thay CEO nhung khong duoc approve.', 'not_checked', null)
on conflict (id) do update
set code = excluded.code,
    title = excluded.title,
    type = excluded.type,
    project_id = excluded.project_id,
    module = excluded.module,
    requested_by = excluded.requested_by,
    submitted_by = excluded.submitted_by,
    on_behalf_of = excluded.on_behalf_of,
    delegation_id = excluded.delegation_id,
    owner_id = excluded.owner_id,
    current_step_id = excluded.current_step_id,
    status = excluded.status,
    priority = excluded.priority,
    amount = excluded.amount,
    due_date = excluded.due_date,
    summary = excluded.summary,
    ai_review_status = excluded.ai_review_status,
    ai_review_summary = excluded.ai_review_summary,
    archived_at = null,
    updated_at = now();

insert into public.proposal_steps (
  id,
  proposal_id,
  step_order,
  approver_role,
  status
)
values (
  'proposal-step-demo-overdue-approval',
  'proposal-demo-overdue-approval',
  1,
  'chu_tich',
  'in_review'
)
on conflict (id) do update
set proposal_id = excluded.proposal_id,
    step_order = excluded.step_order,
    approver_role = excluded.approver_role,
    status = excluded.status,
    updated_at = now();

insert into public.proposal_decisions (
  id,
  proposal_id,
  step_id,
  decision,
  decided_by,
  decided_at,
  notes
)
values (
  'proposal-decision-demo-overdue-submitted',
  'proposal-demo-overdue-approval',
  'proposal-step-demo-overdue-approval',
  'submitted',
  '20000000-0000-4000-8000-000000000108',
  timestamp with time zone '2026-05-20T00:00:00Z',
  'Trinh approval qua han de demo escalation.'
)
on conflict (id) do update
set proposal_id = excluded.proposal_id,
    step_id = excluded.step_id,
    decision = excluded.decision,
    decided_by = excluded.decided_by,
    decided_at = excluded.decided_at,
    notes = excluded.notes;

do $$
begin
  if to_regclass('public.access_scope_assignments') is not null then
    insert into public.access_scope_assignments (
      id,
      user_id,
      role_key,
      organization_id,
      project_id,
      axis_id,
      workstream_id,
      module_id,
      permission_keys,
      scope_type,
      is_active,
      created_by,
      updated_by
    )
    values
      ('32000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000101', 'chu_tich', null, null, null, null, null, array['axis1.view','project.view','project.create','project.update','project.archive','project.assign_member','task.view','task.create','task.update','task.archive','document.view','document.create','document.update','document.approve','document.archive','legal.view','legal.update','legal.approve','meeting.view','meeting.create','meeting.update','decision.create','decision.approve','knowledge.view','knowledge.create','knowledge.review','knowledge.approve','report.view','report.create','report.export','design.view','design.review','construction.view','finance.view','finance.approve','payment.approve','proposal.view','proposal.create','proposal.update','proposal.review','proposal.approve','proposal.reject','proposal.request_change','proposal.archive','investment.view','investment.create','investment.update','investment.review','investment.approve','contract.view','contract.create','contract.update','contract.review','contract.approve','contract.archive','hr.view','hr.review','hr.approve','qa.view','qa.update','qa.approve','safety.view','safety.update','safety.approve','compliance.view','compliance.review','internal_audit.view','internal_audit.review','audit.view','ai.use','ai.view_insight','ai.confirm_action','knowledge.create_candidate','knowledge.promote','ai.ask','ai.use_rag','ai.create_draft','ai.propose_action'], 'global', true, '20000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102'),
      ('32000000-0000-4000-8000-000000000108', '20000000-0000-4000-8000-000000000111', 'super_admin', null, null, null, null, null, array['axis1.view','project.view','project.create','project.update','project.archive','project.assign_member','task.view','task.create','task.update','task.update_own','task.archive','document.view','document.create','document.update','document.approve','document.archive','legal.view','legal.update','legal.approve','legal.configure_template','meeting.view','meeting.create','meeting.update','decision.create','decision.approve','knowledge.view','knowledge.create','knowledge.create_candidate','knowledge.promote','knowledge.review','knowledge.approve','knowledge.manage_source_registry','report.view','report.create','report.export','design.view','design.create','design.update','design.review','design.approve_change','construction.view','construction.update','site_diary.create','quality.update','acceptance.approve','finance.view','finance.create','finance.update','finance.approve','payment.request','payment.approve','proposal.view','proposal.create','proposal.update','proposal.review','proposal.approve','proposal.reject','proposal.request_change','proposal.configure_flow','proposal.archive','investment.view','investment.create','investment.update','investment.review','investment.approve','contract.view','contract.create','contract.update','contract.review','contract.approve','contract.archive','hr.view','hr.create','hr.update','hr.review','hr.approve','qa.view','qa.update','qa.approve','safety.view','safety.update','safety.approve','compliance.view','compliance.review','internal_audit.view','internal_audit.review','user.view','user.invite','user.update_role','settings.manage','delegation.manage','audit.view','ai.use','ai.ask','ai.use_rag','ai.view_insight','ai.create_draft','ai.propose_action','ai.confirm_action','ai.configure'], 'global', true, '20000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102'),
      ('32000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000103', 'tong_giam_doc', null, null, 'axis-1', null, null, array['project.view','task.view','document.view','legal.view','finance.view','proposal.view','proposal.approve'], 'scoped', true, '20000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102'),
      ('32000000-0000-4000-8000-000000000103', '20000000-0000-4000-8000-000000000104', 'giam_doc_du_an', null, '30000000-0000-4000-8000-000000000101', 'axis-1', null, null, array['project.view','task.view','document.view','legal.view','finance.view','proposal.view','proposal.create','proposal.review'], 'scoped', true, '20000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102'),
      ('32000000-0000-4000-8000-000000000104', '20000000-0000-4000-8000-000000000105', 'to_truong', null, '30000000-0000-4000-8000-000000000102', 'axis-1', null, null, array['project.view','task.view','document.view','legal.view'], 'scoped', true, '20000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102'),
      ('32000000-0000-4000-8000-000000000105', '20000000-0000-4000-8000-000000000106', 'thu_ky_tro_ly', null, '30000000-0000-4000-8000-000000000101', 'axis-1', null, null, array['project.view','task.view','document.view','meeting.view','meeting.create'], 'scoped', true, '20000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102'),
      ('32000000-0000-4000-8000-000000000106', '20000000-0000-4000-8000-000000000107', 'viewer', null, '30000000-0000-4000-8000-000000000102', 'axis-1', null, null, array['project.view','task.view','document.view','legal.view','meeting.view'], 'scoped', true, '20000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102'),
      ('32000000-0000-4000-8000-000000000107', '20000000-0000-4000-8000-000000000102', 'admin', null, null, null, null, null, array['project.view','task.view','document.view','legal.view','meeting.view','finance.view','proposal.view','settings.manage','delegation.manage','audit.view'], 'global', true, '20000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102')
    on conflict (id) do update
    set role_key = excluded.role_key,
        organization_id = excluded.organization_id,
        project_id = excluded.project_id,
        axis_id = excluded.axis_id,
        workstream_id = excluded.workstream_id,
        module_id = excluded.module_id,
        permission_keys = excluded.permission_keys,
        scope_type = excluded.scope_type,
        is_active = excluded.is_active,
        updated_by = excluded.updated_by,
        updated_at = now();
  end if;

  if to_regclass('public.leadership_delegations') is not null then
    insert into public.leadership_delegations (
      id,
      principal_user_id,
      delegate_user_id,
      project_id,
      module_id,
      action_keys,
      is_active,
      starts_at,
      ends_at,
      note,
      created_by,
      updated_by
    )
    values
      ('33000000-0000-4000-8000-000000000101', '20000000-0000-4000-8000-000000000103', '20000000-0000-4000-8000-000000000106', '30000000-0000-4000-8000-000000000101', 'proposal', array['proposal.create'], true, timestamp with time zone '2026-05-01T00:00:00Z', null, 'Thu ky tao/submit de xuat thay CEO trong scope Riverside.', '20000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102'),
      ('33000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000103', '20000000-0000-4000-8000-000000000106', '30000000-0000-4000-8000-000000000102', 'proposal', array['proposal.create'], true, timestamp with time zone '2026-01-01T00:00:00Z', timestamp with time zone '2026-03-31T23:59:59Z', 'Negative fixture: expired delegation.', '20000000-0000-4000-8000-000000000102', '20000000-0000-4000-8000-000000000102')
    on conflict (id) do update
    set principal_user_id = excluded.principal_user_id,
        delegate_user_id = excluded.delegate_user_id,
        project_id = excluded.project_id,
        module_id = excluded.module_id,
        action_keys = excluded.action_keys,
        is_active = excluded.is_active,
        starts_at = excluded.starts_at,
        ends_at = excluded.ends_at,
        note = excluded.note,
        updated_by = excluded.updated_by,
        updated_at = now();
  end if;
end $$;
