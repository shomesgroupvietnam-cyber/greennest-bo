# 12 - Auth, Roles and Permissions

## 1. Purpose

This document defines scalable authentication, role-based access control and role-specific screens for GreenNest BuildFlow.

It replaces the early MVP-only role set of `owner/admin/member/viewer` with a business-oriented role model suitable for a housing development and construction investment company.

## 2. Auth Model

Recommended implementation:

- Supabase Auth for login, password reset, session and invitation.
- Application profile table for business role, department and project membership.
- Server-side permission checks for every mutation.
- UI hides unavailable actions but does not rely on hiding for security.
- Audit all role changes and sensitive data changes.

Authentication states:

- Anonymous: can only access login/password reset.
- Authenticated without active workspace: redirected to workspace/project selection or onboarding.
- Authenticated active user: can access role-specific dashboard and assigned project data.
- Suspended user: cannot access app, but historical records remain.

## 3. Role Architecture

Use two layers:

1. System/company role: defines broad authority.
2. Project membership role: defines access inside a specific project.

This allows a user to be `pho_tong_giam_doc` at company level but only oversee selected projects, or a `to_truong` in one project and viewer in another.

## 4. System Roles

| Key | Vietnamese Label | Purpose |
| --- | --- | --- |
| `super_admin` | Super Admin | Technical/system owner, emergency administration |
| `admin` | Admin | System configuration, users, roles, master data |
| `tong_giam_doc` | Tổng giám đốc | Executive control across company/project portfolio |
| `pho_tong_giam_doc` | Phó tổng giám đốc | Executive oversight for assigned domains/projects |
| `giam_doc_du_an` | Giám đốc dự án | Full project delivery ownership |
| `quan_ly_du_an` | Quản lý dự án | Daily project management and coordination |
| `to_truong` | Tổ trưởng | Team/work package execution lead |
| `phap_ly` | Pháp lý | Legal checklist, submissions, authority responses |
| `ke_toan` | Kế toán | Finance, payment, cost and contract financial records |
| `thiet_ke` | Thiết kế | Design package, drawings, design review and changes |
| `ky_thuat` | Kỹ thuật | Technical tasks, site/design coordination, quality inputs |
| `thi_cong` | Thi công | Construction schedule, site diary, acceptance, contractor coordination |
| `mua_hang` | Mua hàng | Procurement, material planning and supplier coordination |
| `thu_ky_tro_ly` | Thư ký/Trợ lý | Data entry, meetings, documents, reporting support |
| `kiem_soat_noi_bo` | Kiểm soát nội bộ | Audit, compliance, read/review access |
| `nha_thau` | Nhà thầu | External contractor limited project/package access |
| `tu_van` | Tư vấn | External consultant limited document/review access |
| `viewer` | Chỉ xem | Read-only access to allowed data |

## 4.1 Enterprise RBAC Expansion

The new business authorization direction expands GreenNest from project operations into an AI ERP operating system. The following roles should be added first because they represent clear business blocks and near-term module boundaries.

| Key | Vietnamese Label | Purpose | Recommended Default Workspace |
| --- | --- | --- | --- |
| `dau_tu_phat_trien` | Đầu tư phát triển | Find, analyze and prepare new project/investment opportunities | `/investment-workspace` |
| `quan_ly_tai_chinh` | Quản lý tài chính | Manage cash flow, budgets, financial control and investment efficiency | `/finance-management-workspace` |
| `hanh_chinh_nhan_su` | Hành chính nhân sự | Manage HR, administration, recruiting/KPI and internal HR requests | `/hr-workspace` |
| `qa_qc_chat_luong` | QA/QC chất lượng | Control construction quality, inspections and acceptance quality gates | `/quality-workspace` |
| `an_toan_lao_dong` | An toàn lao động | Monitor site safety observations, incidents and safety compliance | `/safety-workspace` |
| `kiem_toan_noi_bo` | Kiểm toán nội bộ | Audit finance/process compliance and investigate control exceptions | `/audit-workspace` |
| `quan_ly_hop_dong` | Quản lý hợp đồng | Manage contracts, appendices, commercial obligations and contract documents | `/contract-workspace` |

The following roles are recognized as future/planned roles but should not be added to code until their module scope is clearer:

| Planned Key | Vietnamese Label | Reason to Defer |
| --- | --- | --- |
| `quy_hoach` | Quy hoạch | May belong under legal/investment/design depending on operating model |
| `quan_he_doi_ngoai` | Quan hệ đối ngoại | Needs clear boundary with legal/investment/executive communication |
| `van_thu_luu_tru` | Văn thư lưu trữ | Needs document-control workflow before separate role is useful |
| `compliance` | Compliance | May overlap with `kiem_soat_noi_bo` and `kiem_toan_noi_bo` until compliance module exists |
| `doi_tac` | Đối tác | Needs external partner portal and scope model distinct from contractor/consultant |

Business blocks after expansion:

- System: `super_admin`, `admin`.
- Executive: `tong_giam_doc`, `pho_tong_giam_doc`, `thu_ky_tro_ly`.
- Investment and development: `dau_tu_phat_trien`, `phap_ly`, planned `quy_hoach`, planned `quan_he_doi_ngoai`.
- Project delivery: `giam_doc_du_an`, `quan_ly_du_an`, `to_truong`.
- Design, technical and construction: `thiet_ke`, `ky_thuat`, `thi_cong`, `qa_qc_chat_luong`, `an_toan_lao_dong`.
- Finance, accounting and contracts: `quan_ly_tai_chinh`, `ke_toan`, `mua_hang`, `quan_ly_hop_dong`.
- HR and administration: `hanh_chinh_nhan_su`, planned `van_thu_luu_tru`.
- Control and audit: `kiem_soat_noi_bo`, `kiem_toan_noi_bo`, planned `compliance`.
- External: `nha_thau`, `tu_van`, planned `doi_tac`, `viewer`.

## 5. Permission Actions

Use permission keys instead of hardcoding role names inside feature code.

Project: `project.view`, `project.create`, `project.update`, `project.archive`, `project.assign_member`.

Task: `task.view`, `task.create`, `task.update`, `task.update_own`, `task.archive`.

Document: `document.view`, `document.create`, `document.update`, `document.approve`, `document.archive`.

Legal: `legal.view`, `legal.update`, `legal.approve`, `legal.configure_template`.

Meeting: `meeting.view`, `meeting.create`, `meeting.update`, `decision.create`, `decision.approve`.

Design: `design.view`, `design.create`, `design.update`, `design.review`, `design.approve_change`.

Construction: `construction.view`, `construction.update`, `site_diary.create`, `quality.update`, `acceptance.approve`.

Finance: `finance.view`, `finance.create`, `finance.update`, `finance.approve`, `payment.request`, `payment.approve`.

Proposal and Approval: `proposal.view`, `proposal.create`, `proposal.update`, `proposal.review`, `proposal.approve`, `proposal.reject`, `proposal.request_change`, `proposal.configure_flow`, `proposal.archive`.

Investment: `investment.view`, `investment.create`, `investment.update`, `investment.review`, `investment.approve`.

Contract: `contract.view`, `contract.create`, `contract.update`, `contract.review`, `contract.approve`, `contract.archive`.

HR/Admin Operations: `hr.view`, `hr.create`, `hr.update`, `hr.review`, `hr.approve`.

Quality and Safety: `qa.view`, `qa.update`, `qa.approve`, `safety.view`, `safety.update`, `safety.approve`.

Compliance and Internal Audit: `compliance.view`, `compliance.review`, `internal_audit.view`, `internal_audit.review`.

Admin: `user.view`, `user.invite`, `user.update_role`, `settings.manage`, `audit.view`.

Knowledge: `knowledge.view`, `knowledge.create`, `knowledge.create_candidate`, `knowledge.promote`, `knowledge.review`, `knowledge.approve`, `knowledge.manage_source_registry`, `knowledge.archive`.

AI: `ai.use`, `ai.ask`, `ai.use_rag`, `ai.view_insight`, `ai.create_draft`, `ai.propose_action`, `ai.confirm_action`, `ai.configure`.

AI and Knowledge governance rules:

- AI cannot bypass role, project membership, resource ownership or external-user scope.
- An AI answer request requires `ai.use` plus the relevant module read permission, such as `project.view`, `document.view`, `legal.view` or `report.view`.
- Authoritative RAG retrieval requires `ai.use_rag`, `knowledge.view` and access to the knowledge item's module/access level.
- Drafting or insight actions require the relevant source-data permission before context is sent to an AI provider.
- AI-proposed mutations require `ai.propose_action`; executing the mutation requires `ai.confirm_action` and the normal domain mutation permission, such as `task.create`, `document.approve` or `legal.update`.
- Knowledge Candidate submission requires `knowledge.create_candidate`.
- Promoting a candidate into governed Knowledge Center review requires `knowledge.promote`.
- Reviewing requires `knowledge.review`; approving for authoritative RAG requires `knowledge.approve`; source-registry configuration requires `knowledge.manage_source_registry`.
- AI configuration, model/provider settings and source-registry configuration require `ai.configure` or `settings.manage`.
- AI can support proposal review, compliance checks and approval-route suggestions, but cannot approve proposals. Final approval requires the human user to hold the relevant proposal/domain approval permission.

## 6. Permission Matrix

Legend: `Full` means manage/approve, `Write` means create/update, `Own` means assigned records only, `Read` means view allowed data, `None` means no access.

| Role | Projects | Tasks | Documents | Legal | Meetings | Design | Construction | Finance | Users/Settings | Audit | AI |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Super Admin | Full | Full | Full | Full | Full | Full | Full | Full | Full | Full | Full |
| Admin | Full | Full | Full | Full | Full | Full | Full | Read | Full | Full | Full |
| Tổng giám đốc | Full | Full | Read | Approve | Full | Read | Read | Approve | Read | Read | Full |
| Phó tổng giám đốc | Write assigned | Full assigned | Read assigned | Approve assigned | Full assigned | Read assigned | Read assigned | Read assigned | None | Read assigned | Full assigned |
| Giám đốc dự án | Full assigned | Full assigned | Full assigned | Write assigned | Full assigned | Write assigned | Write assigned | Read assigned | Assign project | Read assigned | Full assigned |
| Quản lý dự án | Write assigned | Full assigned | Write assigned | Write assigned | Full assigned | Write assigned | Write assigned | Read assigned | None | Read assigned | Full assigned |
| Tổ trưởng | Read assigned | Write team | Read assigned | None | Read assigned | Own | Write team/package | None | None | None | AI limited |
| Pháp lý | Read assigned | Own/Write legal tasks | Write legal docs | Full assigned | Write legal meetings | Read | None | None | None | Read own domain | AI legal |
| Kế toán | Read assigned | Own finance tasks | Read finance docs | None | Read assigned | None | Read acceptance | Full assigned | None | Read finance | AI finance |
| Thiết kế | Read assigned | Own/Write design tasks | Write design docs | Read legal docs | Read assigned | Full assigned | Read | None | None | Read own domain | AI design |
| Kỹ thuật | Read assigned | Own/Write technical tasks | Write technical docs | Read | Read assigned | Write assigned | Write quality inputs | None | None | Read own domain | AI limited |
| Thi công | Read assigned | Own/Write site tasks | Write construction docs | None | Read assigned | Read | Write assigned | None | None | Read own domain | AI limited |
| Mua hàng | Read assigned | Own/Write procurement tasks | Write procurement docs | None | Read assigned | None | Read material needs | Read procurement cost | None | Read own domain | AI limited |
| Thư ký/Trợ lý | Read assigned | Write assigned | Write assigned docs | Update checklist notes | Create/update notes | Read | Read | None | None | None | AI report draft |
| Kiểm soát nội bộ | Read | Read | Read | Read | Read | Read | Read | Read | None | Full | AI audit |
| Nhà thầu | Read limited | Own package tasks | Upload package docs | None | Read invited | Read package | Update package/site inputs | None | None | None | None |
| Tư vấn | Read limited | Own review tasks | Upload/review docs | Read invited | Read invited | Review assigned | None | None | None | None | None |
| Viewer | Read allowed | Read allowed | Read allowed | Read allowed | Read allowed | Read allowed | Read allowed | Read allowed if allowed | None | None | None |

## 6.1 Enterprise Permission Matrix Addendum

The current matrix covers implemented roles. The expansion roles should start with conservative permissions and gain write/approve permissions only when their modules are implemented.

| Role | Proposal | Investment | Contract | Finance | HR | QA | Safety | Audit/Compliance | AI |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Đầu tư phát triển | Create/review investment proposals | Write | Read linked contracts | Read investment finance | None | None | None | None | AI investment |
| Quản lý tài chính | Review/approve finance proposals | Read investment | Read contracts | Full finance control | None | None | None | Read finance audit | AI finance |
| Hành chính nhân sự | Create/review HR proposals | None | None | None | Write/review | None | None | Read HR audit | AI HR |
| QA/QC chất lượng | Create/review quality proposals | None | Read package contracts | None | None | Write/approve quality gates | Read safety | Read own domain | AI QA |
| An toàn lao động | Create/review safety proposals | None | Read site contracts | None | None | Read QA | Write/approve safety | Read own domain | AI safety |
| Kiểm toán nội bộ | Review audit proposals | Read | Read | Read/review | Read | Read | Read | Internal audit review | AI audit |
| Quản lý hợp đồng | Create/review contract proposals | Read | Full contract control | Read payment linkage | None | Read acceptance linkage | None | Read contract audit | AI contract |

Rules:

- Proposal access is cross-module but must still respect project/resource scope.
- Financial approval should be separated between `quan_ly_tai_chinh`, `ke_toan` and executive roles.
- Contract approval should be separated from contract preparation when value or risk thresholds require it.
- QA/QC and safety roles can approve domain checks, but cannot approve payment unless finance permissions also allow it.

## 7. Role-specific Home Screens

| Role | Default Screen | Main Widgets |
| --- | --- | --- |
| Admin | System Admin Dashboard | Users, roles, projects, configuration, audit alerts |
| Tổng giám đốc | Executive Portfolio Dashboard | Portfolio health, blocked legal, overdue work, budget risk, decisions awaiting approval |
| Phó tổng giám đốc | Assigned Portfolio Dashboard | Assigned projects, domain risks, approvals, escalations |
| Giám đốc dự án | Project Director Dashboard | Assigned project health, milestones, blockers, decision log, team workload |
| Quản lý dự án | PM Workbench | Tasks, documents, legal progress, meetings, weekly report |
| Tổ trưởng | Team Execution Board | Team tasks, package progress, site issues, upcoming deadlines |
| Pháp lý | Legal Workspace | Legal checklist, submissions, authority responses, legal documents, blockers |
| Kế toán | Finance Workspace | Budget, payments, contracts, invoices, cash flow, finance tasks |
| Quản lý tài chính | Finance Management Workspace | Cash flow, budget control, financial approvals, investment efficiency |
| Quản lý hợp đồng | Contract Workspace | Contracts, appendices, obligations, contract-related proposals |
| Thiết kế | Design Workspace | Design packages, drawings, design issues, review tasks |
| Kỹ thuật | Technical Workspace | Technical tasks, quality items, design coordination, project documents |
| Thi công | Construction Workspace | Schedule, site diary, quality checklist, acceptance records |
| QA/QC chất lượng | Quality Workspace | Quality checklist, inspections, non-conformance, acceptance quality gates |
| An toàn lao động | Safety Workspace | Safety observations, incidents, toolbox meetings, site safety compliance |
| Mua hàng | Procurement Workspace | Purchase tasks, material needs, supplier documents, procurement deadlines |
| Đầu tư phát triển | Investment Workspace | Opportunities, land bank, investment proposals, early feasibility |
| Hành chính nhân sự | HR/Admin Workspace | Employee records, HR requests, recruitment/KPI, admin proposals |
| Thư ký/Trợ lý | Assistant Workspace | Data entry queue, meetings, missing documents, report drafts |
| Kiểm soát nội bộ | Audit Workspace | Audit logs, compliance checklist, read-only project review |
| Kiểm toán nội bộ | Internal Audit Workspace | Audit reviews, finance/process exceptions, compliance evidence |
| Nhà thầu | Contractor Portal | Assigned packages, upload documents, package tasks, site submissions |
| Tư vấn | Consultant Portal | Assigned reviews, documents to review, comments and submissions |
| Viewer | Read-only Dashboard | Allowed project summaries and reports |

## 8. Navigation by Role

Global modules:

- Dashboard.
- Projects.
- Tasks.
- Documents.
- Legal.
- Meetings.
- Reports.
- Proposals.

Conditional modules:

- Investment: investment development, executives and permitted PM/project directors.
- Design: design, technical, PM and executives.
- Construction: construction, technical, PM and executives.
- Finance: finance management, accounting, executives, project director and permitted PMs.
- Contracts: contract management, finance, procurement, PM/project directors and executives.
- HR/Admin: HR/admin roles and permitted executives/admins.
- Quality/Safety: QA/QC, safety, construction, technical, PM/project directors and executives.
- Knowledge Center: users with `knowledge.view`; candidate promotion/review actions only when permitted.
- AI Assistant: users with `ai.use`; module AI entry points are still hidden when the user lacks the underlying module permission.
- Users/Settings: admin/super admin only.
- Audit: admin, internal control and executives read-only.
- Contractor Portal: external contractor only.

## 9. Implementation Model

Recommended data model:

- `users`: identity profile.
- `roles`: role definitions.
- `permissions`: permission definitions.
- `role_permissions`: many-to-many mapping.
- `workspaces`: company/workspace.
- `workspace_members`: user role at company/workspace level.
- `project_members`: user role at project level.
- `permission_overrides`: optional future table for exceptional access.

Permission resolution order:

1. Super admin override.
2. Explicit project membership role.
3. Workspace/company role.
4. Resource ownership/assignment.
5. Deny by default.

## 10. Security Rules

- Deny by default.
- Every mutation checks permission on the server.
- Every file access checks project/document permission.
- Every AI request checks permission and scope before retrieving structured data or approved knowledge.
- External users can never access portfolio-wide data by default.
- Finance access is separated from general project access.
- Audit access is separated from admin settings access.
- LLM output is advisory and cannot be treated as persisted knowledge unless it goes through Knowledge Candidate, review, approval and indexing.
- Suspended users cannot log in, but their historical records remain.
- Role and permission changes must create audit logs.

## 11. MVP Implementation Guidance

MVP can start with a simplified implementation, but it must use scalable keys. The already implemented MVP roles remain valid:

- `admin`
- `tong_giam_doc`
- `pho_tong_giam_doc`
- `giam_doc_du_an`
- `quan_ly_du_an`
- `to_truong`
- `phap_ly`
- `ke_toan`
- `thiet_ke`
- `ky_thuat`
- `thi_cong`
- `thu_ky_tro_ly`
- `viewer`

Enterprise expansion should add the seven first-wave role keys from section 4.1 before building the Proposal module. The five planned roles should remain documented only until their module boundaries are approved.

Do not hardcode logic such as `if role === "admin"` across components. Use centralized permission helpers:

```text
can(user, "project.create", resource)
can(user, "finance.view", project)
can(user, "legal.update", legalStep)
```

## 12. Acceptance Criteria for Auth/RBAC Sprint

- Users can sign in and sign out.
- Admin can invite users.
- Admin can assign system role.
- Project director/PM can assign project members if permitted.
- Users see role-specific default dashboard.
- Sidebar only shows modules the user can access.
- Server-side actions enforce permissions.
- Unauthorized access returns clear error or redirect.
- Role changes are audited.
- Permission tests cover at least admin, phó tổng giám đốc, tổ trưởng, kế toán, thiết kế and viewer.
