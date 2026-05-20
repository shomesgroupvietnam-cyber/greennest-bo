# 13 - Role Workspaces and Permission Screens

## 1. Purpose

This document defines the role-specific screens that should be built after the MVP core is stable. It expands the RBAC model from `12-auth-roles-permissions.md` into concrete workspaces, navigation and task scopes for each business role.

## 2. Product Rule

Every role should log in to a screen that answers:

- What do I need to do now?
- What is overdue or blocked in my scope?
- What documents or approvals need my action?
- What am I allowed to see or change?

The app must not show a generic dashboard to every user if their role has a specific operational job.

## 3. Shared Role Workspace Pattern

Each role workspace should include:

- Role-specific KPI strip.
- Action queue.
- Assigned tasks.
- Relevant documents.
- Relevant approvals or blockers.
- Recent activity in that user's scope.
- Links to filtered module pages.

Every screen must be permission-aware:

- Hide modules user cannot access.
- Hide buttons user cannot execute.
- Server actions must reject unauthorized mutations.
- External users must only see assigned projects/packages/documents.

## 4. Internal Role Screens

### Admin Workspace

Route candidate: `/admin`

Purpose:

- Manage system setup, users, roles, permissions and configuration.

Widgets:

- User count and pending invites.
- Role distribution.
- Recent role changes.
- Projects requiring admin action.
- Audit alerts.

Primary actions:

- Invite user.
- Change role.
- Assign user to project.
- Manage master data.

Permissions:

- `user.view`
- `user.invite`
- `user.update_role`
- `settings.manage`
- `audit.view`

### Executive Portfolio Dashboard

Roles:

- `tong_giam_doc`
- `pho_tong_giam_doc`

Route candidate: `/executive`

Purpose:

- See portfolio health and escalations.

Widgets:

- Portfolio health.
- Blocked legal steps.
- Overdue high-priority tasks.
- Budget/payment risks when finance exists.
- Decisions waiting for approval.
- Projects with missing critical documents.

Primary actions:

- Review project.
- Approve decision.
- Assign escalation owner.
- Export executive report.

Permissions:

- `project.view`
- `task.view`
- `document.view`
- `legal.view`
- `decision.approve`
- `finance.view` or `finance.approve` where permitted
- `ai.use`

### Project Director Workspace

Roles:

- `giam_doc_du_an`
- `quan_ly_du_an`

Route candidate: `/project-workbench`

Purpose:

- Manage assigned projects end to end.

Widgets:

- Assigned project health.
- Milestones.
- Overdue tasks.
- Missing documents.
- Legal blockers.
- Team workload.
- Meeting action items.

Primary actions:

- Create/update project work.
- Assign task.
- Update legal/document status.
- Create meeting note.
- Generate weekly report.

Permissions:

- `project.update`
- `task.create`
- `task.update`
- `document.create`
- `document.update`
- `legal.update`
- `meeting.create`
- `decision.create`

### Team Leader Workspace

Role:

- `to_truong`

Route candidate: `/team-workbench`

Purpose:

- Manage team/package execution.

Widgets:

- Team tasks.
- Tasks due this week.
- Blocked team tasks.
- Package progress.
- Documents to submit or review.
- Site issues if construction module exists.

Primary actions:

- Update assigned/team task.
- Add progress note.
- Upload team/package document.
- Raise issue.

Permissions:

- `task.view`
- `task.update_own`
- `document.view`
- `document.create` limited to assigned scope
- `construction.update` for assigned package when construction exists

### Legal Workspace

Role:

- `phap_ly`

Route candidate: `/legal-workspace`

Purpose:

- Manage legal checklist, submissions and legal documents.

Widgets:

- Legal steps by status.
- Steps waiting authority response.
- Blocked legal steps.
- Missing legal documents.
- Legal tasks due soon.

Primary actions:

- Update legal step.
- Add legal note.
- Link document to legal step.
- Create legal task.

Permissions:

- `legal.view`
- `legal.update`
- `document.view`
- `document.create`
- `task.create`
- `task.update_own`

### Accounting Workspace

Role:

- `ke_toan`

Route candidate: `/finance-workspace`

Purpose:

- Manage finance tasks, payment documents and future budget/payment workflows.

Widgets:

- Finance tasks.
- Payment documents requiring review.
- Contracts/payment requests when finance module exists.
- Documents missing for payment.
- Acceptance records waiting for payment processing.

Primary actions:

- Update finance task.
- Upload finance document.
- Review payment-related document.
- Create payment request when finance module exists.

Permissions:

- `finance.view`
- `finance.create`
- `finance.update`
- `payment.request`
- `document.view`
- `document.create`
- `task.update_own`

### Finance Management Workspace

Role:

- `quan_ly_tai_chinh`

Route candidate: `/finance-management-workspace`

Purpose:

- Manage cash flow, budget control, financial approvals and investment efficiency.

Widgets:

- Finance proposals awaiting review.
- Cash flow risks.
- Budget variance.
- Payment approvals.
- Investment efficiency signals.

Permissions:

- `finance.view`
- `finance.update`
- `finance.approve`
- `payment.approve`
- `proposal.review`
- `proposal.approve`
- `ai.use`

### Contract Workspace

Role:

- `quan_ly_hop_dong`

Route candidate: `/contract-workspace`

Purpose:

- Manage contracts, appendices, obligations and contract-related proposal workflows.

Widgets:

- Contracts needing review.
- Expiring contracts.
- Contract proposals.
- Documents missing for payment/acceptance.

Permissions:

- `contract.view`
- `contract.create`
- `contract.update`
- `contract.review`
- `contract.approve`
- `proposal.create`
- `proposal.review`

### Design Workspace

Role:

- `thiet_ke`

Route candidate: `/design-workspace`

Purpose:

- Manage design packages, drawings, design tasks and review issues.

Widgets:

- Design packages.
- Drawings needing update.
- Design review comments.
- Design tasks due soon.
- Linked legal/design documents.

Primary actions:

- Upload design document.
- Update design task.
- Create design issue.
- Submit drawing revision.

Permissions:

- `design.view`
- `design.create`
- `design.update`
- `design.review`
- `document.create`
- `document.update`
- `task.update_own`

### Technical Workspace

Role:

- `ky_thuat`

Route candidate: `/technical-workspace`

Purpose:

- Handle technical coordination, quality items and project technical tasks.

Widgets:

- Technical tasks.
- Quality issues.
- Documents needing technical review.
- Construction/design coordination items.

Permissions:

- `task.view`
- `task.update_own`
- `document.view`
- `document.create`
- `design.view`
- `construction.view`
- `quality.update`

### Construction Workspace

Role:

- `thi_cong`

Route candidate: `/construction-workspace`

Purpose:

- Track site execution, schedule, diary, quality and acceptance.

Widgets:

- Assigned construction packages.
- Site tasks.
- Site diary queue.
- Quality checklist.
- Acceptance requests.

Permissions:

- `construction.view`
- `construction.update`
- `site_diary.create`
- `quality.update`
- `task.update_own`
- `document.create`

### Quality Workspace

Role:

- `qa_qc_chat_luong`

Route candidate: `/quality-workspace`

Purpose:

- Manage quality checks, non-conformance, inspections and acceptance quality gates.

Permissions:

- `qa.view`
- `qa.update`
- `qa.approve`
- `construction.view`
- `document.view`
- `proposal.create`
- `proposal.review`

### Safety Workspace

Role:

- `an_toan_lao_dong`

Route candidate: `/safety-workspace`

Purpose:

- Manage site safety observations, incidents, corrective actions and safety compliance.

Permissions:

- `safety.view`
- `safety.update`
- `safety.approve`
- `construction.view`
- `document.view`
- `proposal.create`
- `proposal.review`

### Investment Workspace

Role:

- `dau_tu_phat_trien`

Route candidate: `/investment-workspace`

Purpose:

- Track opportunities, land bank, early feasibility and investment proposal approvals before a project is created.

Permissions:

- `investment.view`
- `investment.create`
- `investment.update`
- `investment.review`
- `proposal.create`
- `proposal.review`
- `document.view`
- `ai.use`

### HR/Admin Workspace

Role:

- `hanh_chinh_nhan_su`

Route candidate: `/hr-workspace`

Purpose:

- Manage HR/admin requests, recruiting/KPI tasks and internal administration proposals.

Permissions:

- `hr.view`
- `hr.create`
- `hr.update`
- `hr.review`
- `proposal.create`
- `proposal.review`

### Assistant Workspace

Role:

- `thu_ky_tro_ly`

Route candidate: `/assistant-workspace`

Purpose:

- Support data entry, meeting notes, document follow-up and report drafting.

Widgets:

- Data entry queue.
- Missing documents.
- Meeting notes to complete.
- Report drafts.
- Tasks assigned by PM/founder.

Permissions:

- `project.view`
- `task.create`
- `task.update_own`
- `document.create`
- `document.update`
- `meeting.create`
- `ai.use` for report drafts if enabled

### Internal Control Workspace

Role:

- `kiem_soat_noi_bo`

Route candidate: `/audit-workspace`

Purpose:

- Review compliance, audit logs and sensitive activity.

Widgets:

- Recent audit logs.
- Role changes.
- Sensitive document changes.
- Project compliance checklist.

Permissions:

- `audit.view`
- `project.view`
- `task.view`
- `document.view`
- `legal.view`
- `finance.view`

### Internal Audit Workspace

Role:

- `kiem_toan_noi_bo`

Route candidate: `/audit-workspace`

Purpose:

- Review financial/process compliance, audit evidence and control exceptions.

Permissions:

- `internal_audit.view`
- `internal_audit.review`
- `audit.view`
- `finance.view`
- `contract.view`
- `proposal.review`

## 5. External Role Screens

### Contractor Portal

Role:

- `nha_thau`

Route candidate: `/contractor`

Purpose:

- Allow contractors to collaborate only on assigned packages/tasks/documents.

Widgets:

- Assigned packages.
- Assigned tasks.
- Documents required from contractor.
- Uploaded submissions.
- Rejected/needs-update submissions.
- Acceptance requests.
- Notifications.

Allowed actions:

- View assigned package/project summary.
- Update assigned task progress.
- Upload assigned package documents.
- Respond to issue/request.
- Request acceptance when construction module exists.

Denied by default:

- Portfolio dashboard.
- Other contractors' data.
- Internal legal documents.
- Finance/budget.
- User management.
- Audit logs.
- Settings.

Permissions:

- `project.view_limited`
- `task.view_assigned`
- `task.update_own`
- `document.view_assigned`
- `document.create`
- `construction.view_assigned_package`
- `construction.update_assigned_progress`
- `acceptance.request`

### Consultant Portal

Role:

- `tu_van`

Route candidate: `/consultant`

Purpose:

- Let consultants review assigned drawings/documents/tasks.

Widgets:

- Assigned review tasks.
- Documents to review.
- Comments needing response.
- Submitted review results.

Permissions:

- `project.view_limited`
- `task.view_assigned`
- `task.update_own`
- `document.view_assigned`
- `document.create`
- `design.review`

## 6. Implementation Tasks

- Create role-to-workspace route map.
- Create permission-to-navigation map.
- Create shared `RoleWorkspaceShell`.
- Create workspace pages for key roles.
- Add mock role switch support for every role.
- Add demo seed data for role scenarios.
- Add tests for sidebar visibility per role.
- Add tests for direct route access per role.
- Add tests for external contractor data isolation.
- Add server-side guards for role workspace routes.

## 7. Acceptance Criteria

- Each required role has a default route.
- Each required role sees a tailored screen, not just generic dashboard.
- Sidebar navigation changes by permission.
- Direct URL access is blocked for unauthorized roles.
- Contractor cannot see non-assigned projects/tasks/documents.
- Viewer cannot mutate data.
- Admin can access user/role management.
- Phó tổng giám đốc sees executive/assigned portfolio view.
- Tổ trưởng sees team execution view.
- Kế toán sees finance workspace placeholder or finance-ready screen.
- Thiết kế sees design workspace placeholder or design-ready screen.
- Tests cover role route mapping and navigation visibility.
