-- Seed scalable roles and permissions from blueprint/12-auth-roles-permissions.md.
-- Safe to re-run in local/staging. Review before production.

insert into public.roles (key, label_vi, description, scope)
values
  ('super_admin', 'Super Admin', 'Technical/system owner, emergency administration', 'system'),
  ('admin', 'Admin', 'System configuration, users, roles and master data', 'system'),
  ('tong_giam_doc', 'Tổng giám đốc', 'Executive control across company/project portfolio', 'system'),
  ('pho_tong_giam_doc', 'Phó tổng giám đốc', 'Executive oversight for assigned domains/projects', 'system'),
  ('giam_doc_du_an', 'Giám đốc dự án', 'Full project delivery ownership', 'system'),
  ('quan_ly_du_an', 'Quản lý dự án', 'Daily project management and coordination', 'system'),
  ('to_truong', 'Tổ trưởng', 'Team/work package execution lead', 'project'),
  ('phap_ly', 'Pháp lý', 'Legal checklist, submissions and authority responses', 'system'),
  ('ke_toan', 'Kế toán', 'Finance, payment, cost and contract financial records', 'system'),
  ('thiet_ke', 'Thiết kế', 'Design package, drawings, design review and changes', 'system'),
  ('ky_thuat', 'Kỹ thuật', 'Technical tasks, site/design coordination and quality inputs', 'system'),
  ('thi_cong', 'Thi công', 'Construction schedule, site diary, acceptance and contractor coordination', 'system'),
  ('mua_hang', 'Mua hàng', 'Procurement, material planning and supplier coordination', 'system'),
  ('thu_ky_tro_ly', 'Thư ký/Trợ lý', 'Data entry, meetings, documents and reporting support', 'system'),
  ('kiem_soat_noi_bo', 'Kiểm soát nội bộ', 'Audit, compliance and read/review access', 'system'),
  ('nha_thau', 'Nhà thầu', 'External contractor limited project/package access', 'external'),
  ('tu_van', 'Tư vấn', 'External consultant limited document/review access', 'external'),
  ('viewer', 'Chỉ xem', 'Read-only access to allowed data', 'system')
on conflict (key) do update
set label_vi = excluded.label_vi,
    description = excluded.description,
    scope = excluded.scope,
    updated_at = now();

insert into public.permissions (key, module, description)
values
  ('project.view', 'project', 'View projects'),
  ('project.create', 'project', 'Create projects'),
  ('project.update', 'project', 'Update projects'),
  ('project.archive', 'project', 'Archive projects'),
  ('project.assign_member', 'project', 'Assign project members'),
  ('task.view', 'task', 'View tasks'),
  ('task.create', 'task', 'Create tasks'),
  ('task.update', 'task', 'Update tasks'),
  ('task.update_own', 'task', 'Update assigned/owned tasks'),
  ('task.archive', 'task', 'Archive tasks'),
  ('document.view', 'document', 'View documents'),
  ('document.create', 'document', 'Create documents'),
  ('document.update', 'document', 'Update documents'),
  ('document.approve', 'document', 'Approve documents'),
  ('document.archive', 'document', 'Archive documents'),
  ('legal.view', 'legal', 'View legal checklist'),
  ('legal.update', 'legal', 'Update legal checklist'),
  ('legal.approve', 'legal', 'Approve legal steps'),
  ('legal.configure_template', 'legal', 'Configure legal templates'),
  ('meeting.view', 'meeting', 'View meetings'),
  ('meeting.create', 'meeting', 'Create meetings'),
  ('meeting.update', 'meeting', 'Update meetings'),
  ('decision.create', 'meeting', 'Create decisions'),
  ('decision.approve', 'meeting', 'Approve decisions'),
  ('report.view', 'report', 'View report snapshots'),
  ('report.create', 'report', 'Create report snapshots'),
  ('knowledge.view', 'knowledge', 'View governed Knowledge Center items'),
  ('knowledge.create', 'knowledge', 'Create or import knowledge sources'),
  ('knowledge.create_candidate', 'knowledge', 'Create Knowledge Candidates from chat, search, upload, meetings, reports, documents or manual input'),
  ('knowledge.promote', 'knowledge', 'Submit or promote Knowledge Candidates for governed review'),
  ('knowledge.review', 'knowledge', 'Review knowledge sources'),
  ('knowledge.approve', 'knowledge', 'Approve knowledge sources for RAG eligibility'),
  ('knowledge.manage_source_registry', 'knowledge', 'Manage allowed source registry and intake defaults'),
  ('design.view', 'design', 'View design module'),
  ('design.create', 'design', 'Create design records'),
  ('design.update', 'design', 'Update design records'),
  ('design.review', 'design', 'Review design records'),
  ('design.approve_change', 'design', 'Approve design changes'),
  ('construction.view', 'construction', 'View construction module'),
  ('construction.update', 'construction', 'Update construction records'),
  ('site_diary.create', 'construction', 'Create site diaries'),
  ('quality.update', 'construction', 'Update quality records'),
  ('acceptance.approve', 'construction', 'Approve acceptance records'),
  ('finance.view', 'finance', 'View finance module'),
  ('finance.create', 'finance', 'Create finance records'),
  ('finance.update', 'finance', 'Update finance records'),
  ('finance.approve', 'finance', 'Approve finance records'),
  ('payment.request', 'finance', 'Request payments'),
  ('payment.approve', 'finance', 'Approve payments'),
  ('user.view', 'admin', 'View users'),
  ('user.invite', 'admin', 'Invite users'),
  ('user.update_role', 'admin', 'Update user roles'),
  ('settings.manage', 'admin', 'Manage settings'),
  ('audit.view', 'admin', 'View audit logs'),
  ('ai.use', 'ai', 'Use AI assistant'),
  ('ai.ask', 'ai', 'Ask AI questions within permitted scope'),
  ('ai.use_rag', 'ai', 'Use approved RAG retrieval within permitted scope'),
  ('ai.view_insight', 'ai', 'View AI insights'),
  ('ai.create_draft', 'ai', 'Create AI-assisted drafts'),
  ('ai.propose_action', 'ai', 'Create AI action proposals'),
  ('ai.confirm_action', 'ai', 'Confirm AI actions'),
  ('ai.configure', 'ai', 'Configure AI providers, policies and defaults')
on conflict (key) do update
set module = excluded.module,
    description = excluded.description;

with role_permission_seed(role_key, permission_keys) as (
  values
    ('super_admin', array[
      'project.view','project.create','project.update','project.archive','project.assign_member',
      'task.view','task.create','task.update','task.update_own','task.archive',
      'document.view','document.create','document.update','document.approve','document.archive',
      'legal.view','legal.update','legal.approve','legal.configure_template',
      'meeting.view','meeting.create','meeting.update','decision.create','decision.approve',
      'report.view','report.create',
      'knowledge.view','knowledge.create','knowledge.review','knowledge.approve',
      'design.view','design.create','design.update','design.review','design.approve_change',
      'construction.view','construction.update','site_diary.create','quality.update','acceptance.approve',
      'finance.view','finance.create','finance.update','finance.approve','payment.request','payment.approve',
      'user.view','user.invite','user.update_role','settings.manage','audit.view',
      'ai.use','ai.view_insight','ai.confirm_action'
    ]),
    ('admin', array[
      'project.view','project.create','project.update','project.archive','project.assign_member',
      'task.view','task.create','task.update','task.update_own','task.archive',
      'document.view','document.create','document.update','document.approve','document.archive',
      'legal.view','legal.update','legal.approve','legal.configure_template',
      'meeting.view','meeting.create','meeting.update','decision.create','decision.approve',
      'report.view','report.create',
      'knowledge.view','knowledge.create','knowledge.review','knowledge.approve',
      'design.view','design.create','design.update','design.review','design.approve_change',
      'construction.view','construction.update','site_diary.create','quality.update','acceptance.approve',
      'finance.view','payment.request',
      'user.view','user.invite','user.update_role','settings.manage','audit.view',
      'ai.use','ai.view_insight','ai.confirm_action'
    ]),
    ('tong_giam_doc', array[
      'project.view','project.create','project.update','project.archive','project.assign_member',
      'task.view','task.create','task.update','task.archive',
      'document.view','legal.view','legal.approve',
      'meeting.view','meeting.create','meeting.update','decision.create','decision.approve',
      'report.view','report.create',
      'knowledge.view','knowledge.create','knowledge.review','knowledge.approve',
      'design.view','construction.view','finance.view','finance.approve','payment.approve',
      'user.view','audit.view','ai.use','ai.view_insight','ai.confirm_action'
    ]),
    ('pho_tong_giam_doc', array[
      'project.view','project.create','project.update',
      'task.view','task.create','task.update','task.archive',
      'document.view','legal.view','legal.approve',
      'meeting.view','meeting.create','meeting.update','decision.create','decision.approve',
      'report.view','report.create',
      'knowledge.view','knowledge.create','knowledge.review','knowledge.approve',
      'design.view','construction.view','finance.view','audit.view','ai.use','ai.view_insight','ai.confirm_action'
    ]),
    ('giam_doc_du_an', array[
      'project.view','project.create','project.update','project.archive','project.assign_member',
      'task.view','task.create','task.update','task.archive',
      'document.view','document.create','document.update','document.archive',
      'legal.view','legal.update','meeting.view','meeting.create','meeting.update','decision.create',
      'report.view','report.create',
      'knowledge.view','knowledge.create','knowledge.review','knowledge.approve',
      'design.view','design.create','design.update','construction.view','construction.update',
      'finance.view','audit.view','ai.use','ai.view_insight','ai.confirm_action'
    ]),
    ('quan_ly_du_an', array[
      'project.view','project.create','project.update',
      'task.view','task.create','task.update',
      'document.view','document.create','document.update',
      'legal.view','legal.update','meeting.view','meeting.create','meeting.update','decision.create',
      'report.view','report.create',
      'knowledge.view','knowledge.create','knowledge.review','knowledge.approve',
      'design.view','design.create','design.update','construction.view','construction.update',
      'finance.view','audit.view','ai.use','ai.view_insight'
    ]),
    ('to_truong', array[
      'project.view','task.view','task.create','task.update_own','document.view','meeting.view','report.view','knowledge.view',
      'design.view','construction.view','construction.update','site_diary.create','quality.update','ai.use'
    ]),
    ('phap_ly', array[
      'project.view','task.view','task.create','task.update_own',
      'document.view','document.create','document.update',
      'legal.view','legal.update','legal.approve',
      'meeting.view','meeting.create','report.view','knowledge.view','knowledge.create','knowledge.review','knowledge.approve','ai.use','ai.view_insight'
    ]),
    ('ke_toan', array[
      'project.view','task.view','task.create','task.update_own','document.view',
      'finance.view','finance.create','finance.update','finance.approve','payment.request','payment.approve',
      'report.view','knowledge.view','knowledge.create','knowledge.review','knowledge.approve',
      'audit.view','ai.use','ai.view_insight'
    ]),
    ('thiet_ke', array[
      'project.view','task.view','task.create','task.update_own',
      'document.view','document.create','document.update',
      'legal.view','meeting.view','report.view',
      'knowledge.view','knowledge.create','knowledge.review','knowledge.approve',
      'design.view','design.create','design.update','design.review','design.approve_change',
      'audit.view','ai.use','ai.view_insight'
    ]),
    ('ky_thuat', array[
      'project.view','task.view','task.create','task.update_own',
      'document.view','document.create','document.update',
      'legal.view','meeting.view','report.view','knowledge.view','knowledge.create','knowledge.review','design.view','design.update',
      'construction.view','quality.update','audit.view','ai.use'
    ]),
    ('thi_cong', array[
      'project.view','task.view','task.create','task.update_own',
      'document.view','document.create','document.update',
      'meeting.view','report.view','knowledge.view','knowledge.create','knowledge.review','design.view','construction.view','construction.update',
      'site_diary.create','quality.update','audit.view','ai.use'
    ]),
    ('mua_hang', array[
      'project.view','task.view','task.create','task.update_own',
      'document.view','document.create','document.update',
      'meeting.view','report.view','knowledge.view','knowledge.create','knowledge.review','construction.view','finance.view','audit.view','ai.use'
    ]),
    ('thu_ky_tro_ly', array[
      'project.view','task.view','task.create','task.update',
      'document.view','document.create','document.update',
      'legal.view','legal.update',
      'meeting.view','meeting.create','meeting.update','decision.create','report.view','report.create','knowledge.view','knowledge.create',
      'design.view','construction.view','ai.use','ai.view_insight'
    ]),
    ('kiem_soat_noi_bo', array[
      'project.view','task.view','document.view','legal.view','meeting.view','report.view','knowledge.view',
      'design.view','construction.view','finance.view','audit.view','ai.use','ai.view_insight'
    ]),
    ('nha_thau', array[
      'project.view','task.view','task.update_own','document.view','document.create','meeting.view','report.view',
      'knowledge.view','design.view','construction.view','construction.update','site_diary.create'
    ]),
    ('tu_van', array[
      'project.view','task.view','task.update_own','document.view','document.create','document.update',
      'legal.view','meeting.view','report.view','knowledge.view','design.view','design.review'
    ]),
    ('viewer', array[
      'project.view','task.view','document.view','legal.view','meeting.view','report.view','knowledge.view','design.view','construction.view','finance.view'
    ])
)
insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from role_permission_seed
join public.roles on roles.key = role_permission_seed.role_key
join public.permissions on permissions.key = any(role_permission_seed.permission_keys)
on conflict (role_id, permission_id) do nothing;

-- Enterprise Governance expansion: first-wave business-block roles and shared proposal permissions.
insert into public.roles (key, label_vi, description, scope)
values
  ('dau_tu_phat_trien', 'Dau tu phat trien', 'Investment sourcing, feasibility and land-bank opportunity proposals', 'system'),
  ('quan_ly_tai_chinh', 'Quan ly tai chinh', 'Cash flow, budget, investment return and finance approvals', 'system'),
  ('hanh_chinh_nhan_su', 'Hanh chinh nhan su', 'HR, administration, recruiting, KPI and internal request coordination', 'system'),
  ('qa_qc_chat_luong', 'QA/QC chat luong', 'Quality assurance, quality control and acceptance readiness', 'system'),
  ('an_toan_lao_dong', 'An toan lao dong', 'Site safety, incident tracking and corrective action coordination', 'system'),
  ('kiem_toan_noi_bo', 'Kiem toan noi bo', 'Internal audit, compliance review and control exceptions', 'system'),
  ('quan_ly_hop_dong', 'Quan ly hop dong', 'Contracts, appendices, obligations and commercial proposal review', 'system')
on conflict (key) do update
set label_vi = excluded.label_vi,
    description = excluded.description,
    scope = excluded.scope,
    updated_at = now();

insert into public.permissions (key, module, description)
values
  ('proposal.view', 'proposal', 'View internal proposals'),
  ('proposal.create', 'proposal', 'Create internal proposals'),
  ('proposal.update', 'proposal', 'Update draft or change-requested proposals'),
  ('proposal.review', 'proposal', 'Review internal proposals'),
  ('proposal.approve', 'proposal', 'Approve internal proposals'),
  ('proposal.reject', 'proposal', 'Reject internal proposals'),
  ('proposal.request_change', 'proposal', 'Request changes on internal proposals'),
  ('proposal.configure_flow', 'proposal', 'Configure proposal approval flows'),
  ('proposal.archive', 'proposal', 'Archive internal proposals'),
  ('investment.view', 'investment', 'View investment development workspace'),
  ('investment.create', 'investment', 'Create investment development records'),
  ('investment.update', 'investment', 'Update investment development records'),
  ('investment.review', 'investment', 'Review investment development records'),
  ('investment.approve', 'investment', 'Approve investment development records'),
  ('contract.view', 'contract', 'View contract workspace'),
  ('contract.create', 'contract', 'Create contract records'),
  ('contract.update', 'contract', 'Update contract records'),
  ('contract.review', 'contract', 'Review contract records'),
  ('contract.approve', 'contract', 'Approve contract records'),
  ('contract.archive', 'contract', 'Archive contract records'),
  ('hr.view', 'hr', 'View HR/admin workspace'),
  ('hr.create', 'hr', 'Create HR/admin records'),
  ('hr.update', 'hr', 'Update HR/admin records'),
  ('hr.review', 'hr', 'Review HR/admin records'),
  ('hr.approve', 'hr', 'Approve HR/admin records'),
  ('qa.view', 'qa', 'View QA/QC workspace'),
  ('qa.update', 'qa', 'Update QA/QC records'),
  ('qa.approve', 'qa', 'Approve QA/QC records'),
  ('safety.view', 'safety', 'View safety workspace'),
  ('safety.update', 'safety', 'Update safety records'),
  ('safety.approve', 'safety', 'Approve safety records'),
  ('compliance.view', 'compliance', 'View compliance workspace'),
  ('compliance.review', 'compliance', 'Review compliance records'),
  ('internal_audit.view', 'internal_audit', 'View internal audit workspace'),
  ('internal_audit.review', 'internal_audit', 'Review internal audit records')
on conflict (key) do update
set module = excluded.module,
    description = excluded.description;

with enterprise_role_permission_seed(role_key, permission_keys) as (
  values
    ('super_admin', array[
      'proposal.view','proposal.create','proposal.update','proposal.review','proposal.approve','proposal.reject','proposal.request_change','proposal.configure_flow','proposal.archive',
      'investment.view','investment.create','investment.update','investment.review','investment.approve',
      'contract.view','contract.create','contract.update','contract.review','contract.approve','contract.archive',
      'hr.view','hr.create','hr.update','hr.review','hr.approve',
      'qa.view','qa.update','qa.approve','safety.view','safety.update','safety.approve',
      'compliance.view','compliance.review','internal_audit.view','internal_audit.review'
    ]),
    ('admin', array[
      'proposal.view','proposal.create','proposal.update','proposal.review','proposal.approve','proposal.reject','proposal.request_change','proposal.configure_flow','proposal.archive',
      'investment.view','investment.create','investment.update','investment.review','investment.approve',
      'contract.view','contract.create','contract.update','contract.review','contract.approve','contract.archive',
      'hr.view','hr.create','hr.update','hr.review','hr.approve',
      'qa.view','qa.update','qa.approve','safety.view','safety.update','safety.approve',
      'compliance.view','compliance.review','internal_audit.view','internal_audit.review'
    ]),
    ('dau_tu_phat_trien', array[
      'project.view','document.view','task.view','meeting.view','knowledge.view','report.view',
      'proposal.view','proposal.create','proposal.update','proposal.review',
      'investment.view','investment.create','investment.update','investment.review',
      'finance.view','contract.view','ai.use','ai.view_insight'
    ]),
    ('quan_ly_tai_chinh', array[
      'project.view','task.view','document.view','meeting.view','knowledge.view','report.view',
      'proposal.view','proposal.create','proposal.update','proposal.review','proposal.approve','proposal.reject','proposal.request_change',
      'finance.view','finance.create','finance.update','finance.approve','payment.request','payment.approve',
      'investment.view','contract.view','contract.review','audit.view','ai.use','ai.view_insight','ai.confirm_action'
    ]),
    ('hanh_chinh_nhan_su', array[
      'task.view','task.create','task.update_own','document.view','document.create','knowledge.view','report.view',
      'proposal.view','proposal.create','proposal.update','proposal.review',
      'hr.view','hr.create','hr.update','hr.review','ai.use','ai.view_insight'
    ]),
    ('qa_qc_chat_luong', array[
      'project.view','task.view','task.create','task.update_own','document.view','document.create','construction.view','quality.update','acceptance.approve',
      'proposal.view','proposal.create','proposal.review','qa.view','qa.update','qa.approve','safety.view','knowledge.view','report.view','ai.use','ai.view_insight'
    ]),
    ('an_toan_lao_dong', array[
      'project.view','task.view','task.create','task.update_own','document.view','document.create','construction.view',
      'proposal.view','proposal.create','proposal.review','qa.view','safety.view','safety.update','safety.approve','knowledge.view','report.view','ai.use','ai.view_insight'
    ]),
    ('kiem_toan_noi_bo', array[
      'project.view','task.view','document.view','legal.view','meeting.view','knowledge.view','report.view','design.view','construction.view','finance.view','contract.view',
      'proposal.view','proposal.review','audit.view','compliance.view','compliance.review','internal_audit.view','internal_audit.review','ai.use','ai.view_insight'
    ]),
    ('quan_ly_hop_dong', array[
      'project.view','task.view','task.create','task.update_own','document.view','document.create','document.update','meeting.view','knowledge.view','report.view',
      'proposal.view','proposal.create','proposal.update','proposal.review','proposal.approve',
      'contract.view','contract.create','contract.update','contract.review','contract.approve','contract.archive',
      'finance.view','payment.request','audit.view','ai.use','ai.view_insight'
    ]),
    ('kiem_soat_noi_bo', array[
      'proposal.view','proposal.review','contract.view','compliance.view','compliance.review','internal_audit.view','internal_audit.review'
    ])
)
insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from enterprise_role_permission_seed
join public.roles on roles.key = enterprise_role_permission_seed.role_key
join public.permissions on permissions.key = any(enterprise_role_permission_seed.permission_keys)
on conflict (role_id, permission_id) do nothing;

with enterprise_implied_permissions(source_key, implied_key) as (
  values
    ('ai.use', 'ai.ask'),
    ('ai.view_insight', 'ai.use_rag'),
    ('ai.view_insight', 'ai.create_draft'),
    ('ai.confirm_action', 'ai.propose_action')
)
insert into public.role_permissions (role_id, permission_id)
select distinct existing.role_id, implied_permission.id
from public.role_permissions existing
join public.permissions source_permission on source_permission.id = existing.permission_id
join enterprise_implied_permissions on enterprise_implied_permissions.source_key = source_permission.key
join public.permissions implied_permission on implied_permission.key = enterprise_implied_permissions.implied_key
on conflict (role_id, permission_id) do nothing;

with implied_permissions(source_key, implied_key) as (
  values
    ('knowledge.create', 'knowledge.create_candidate'),
    ('knowledge.review', 'knowledge.promote'),
    ('settings.manage', 'knowledge.manage_source_registry'),
    ('ai.use', 'ai.ask'),
    ('ai.view_insight', 'ai.use_rag'),
    ('ai.view_insight', 'ai.create_draft'),
    ('ai.confirm_action', 'ai.propose_action'),
    ('settings.manage', 'ai.configure')
)
insert into public.role_permissions (role_id, permission_id)
select distinct existing.role_id, implied_permission.id
from public.role_permissions existing
join public.permissions source_permission on source_permission.id = existing.permission_id
join implied_permissions on implied_permissions.source_key = source_permission.key
join public.permissions implied_permission on implied_permission.key = implied_permissions.implied_key
on conflict (role_id, permission_id) do nothing;
