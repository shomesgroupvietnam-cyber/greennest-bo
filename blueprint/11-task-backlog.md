# 11 - Task Backlog

This backlog is high-level and scalable. Sprint execution should still use `milestone.md` for MVP V1.

## 1. Foundation Tasks

- Initialize Next.js + TypeScript app.
- Configure Tailwind CSS.
- Add shadcn/ui.
- Build app shell with sidebar/header.
- Create auth skeleton.
- Create module folder structure.
- Create status and role constants.
- Create shared table/form patterns.
- Create mock data repository.
- Create README with local run instructions.

## 2. Project Core Tasks

- Define Project type.
- Define Project status constants.
- Build project service contract.
- Build project repository.
- Build project list page.
- Build create/edit project form.
- Build project detail page.
- Add project archive behavior.
- Generate project code.
- Initialize legal checklist when creating project.
- Add project seed data.

## 3. Task Management Tasks

- Define Task type.
- Define task status and priority constants.
- Build task service contract.
- Build task list page.
- Build create/edit task form.
- Build project task tab.
- Add overdue task calculation.
- Add upcoming task filter.
- Add task status update.
- Add task seed data.

## 4. Document Center Tasks

- Define Document and DocumentVersion types.
- Define document type/status constants.
- Build document service contract.
- Build document list page.
- Build document form.
- Support external URL document.
- Support file upload when storage is ready.
- Add version display.
- Add missing document filter.
- Add project document tab.

## 5. Legal Checklist Tasks

- Define legal step constants.
- Define LegalStep type.
- Build legal service contract.
- Build legal checklist page.
- Build project legal tab.
- Add legal step update flow.
- Require notes when blocked.
- Link legal step to documents.
- Add blocked legal dashboard metric.

## 6. Dashboard Tasks

- Define dashboard summary DTO.
- Build dashboard service.
- Calculate total projects.
- Calculate overdue tasks.
- Calculate missing documents.
- Calculate blocked legal steps.
- Calculate overall progress.
- Build KPI cards.
- Build priority alert section.
- Build upcoming task table.
- Link KPI cards to filtered pages.

## 7. Users and Permissions Tasks

- Define User type.
- Define scalable roles and permissions from `blueprint/12-auth-roles-permissions.md`.
- Build `can(user, action, resource)`.
- Add route/page guards.
- Add server-side mutation guards.
- Build basic users page.
- Add role update flow.
- Audit role changes.
- Add role-specific default dashboard routing.
- Add permission-based sidebar navigation.
- Add tests for admin, phó tổng giám đốc, tổ trưởng, kế toán, thiết kế and viewer.

## 7.1 Role Workspace Tasks

- Define role-to-default-route mapping.
- Define permission-to-navigation mapping.
- Build shared role workspace shell.
- Build Admin Workspace.
- Build Executive Portfolio Dashboard.
- Build Project Director/PM Workbench.
- Build Team Leader Workspace.
- Build Legal Workspace.
- Build Accounting Workspace.
- Build Design Workspace.
- Build Technical Workspace.
- Build Construction Workspace.
- Build Assistant Workspace.
- Build Contractor Portal.
- Build Consultant Portal.
- Build Read-only Viewer Dashboard.
- Add route guards for role workspace routes.
- Add mock role switching coverage for all roles.
- Add contractor data isolation seed data.
- Add tests for navigation visibility by role.
- Add tests for direct route access by role.
- Add tests for contractor-only assigned task/document visibility.

## 7.2 Enterprise RBAC Expansion Tasks

- Add first-wave enterprise roles: `dau_tu_phat_trien`, `quan_ly_tai_chinh`, `hanh_chinh_nhan_su`, `qa_qc_chat_luong`, `an_toan_lao_dong`, `kiem_toan_noi_bo`, `quan_ly_hop_dong`.
- Keep planned roles documented only: `quy_hoach`, `quan_he_doi_ngoai`, `van_thu_luu_tru`, `compliance`, `doi_tac`.
- Add proposal, investment, contract, HR, QA, safety, compliance and internal audit permission keys.
- Add default workspace routes for first-wave roles.
- Add permission tests for new roles.
- Update seed data and mock role switching for new roles.

## 7.3 Internal Proposal and Approval Tasks

- Define proposal types and statuses.
- Build proposal repository/service.
- Build proposal list/create/detail pages.
- Add proposal steps.
- Add comments, attachments and linked records.
- Add submit, request-change, approve and reject actions.
- Add audit logs for every state transition.
- Add AI preliminary review action that cannot approve.
- Add tests for approval permissions, workflow transitions and audit records.

## 8. Meeting and Decision Tasks

- Define Meeting and Decision types.
- Build meeting list by project.
- Build meeting note form.
- Add participants.
- Add decisions.
- Convert decision/action item to task.
- Link meeting to documents.

## 9. Design Management Tasks

- Define DesignPackage type.
- Define Drawing type.
- Build design package list.
- Build drawing register.
- Add design review workflow.
- Add design issue tracking.
- Add design change tracking.
- Link design records to documents/tasks.

## 10. Construction Tasks

- Define Contractor type.
- Define ConstructionPackage type.
- Build contractor list.
- Build construction package schedule.
- Add site diary.
- Add quality checklist.
- Add inspection record.
- Add acceptance record.
- Add change order.
- Add safety observation.

## 11. Finance Tasks

- Define Budget and BudgetLine types.
- Define Contract type.
- Define PaymentRequest type.
- Build budget module.
- Build contract module.
- Build payment request flow.
- Track actual costs.
- Build cash flow plan.
- Build budget variance dashboard.

## 12. Reporting Tasks

- Define report template model.
- Define report run model.
- Build weekly report generator.
- Build monthly report generator.
- Add metric snapshots.
- Add export to PDF/docx later.
- Add portfolio comparison.

## 13. AI Tasks

- Build AI service boundary.
- Build permission-aware context retrieval.
- Add project summary generation.
- Add meeting summary generation.
- Add action item extraction.
- Add missing document suggestion.
- Add risk suggestion.
- Require confirmation before AI-created records.

## 14. Quality Tasks

- Add unit tests for permissions.
- Add unit tests for dashboard metrics.
- Add service tests for project creation.
- Add service tests for legal checklist initialization.
- Add E2E create project flow.
- Add E2E create task flow.
- Add E2E dashboard update flow.
- Add responsive visual checks.

## 15. DevOps Tasks

- Add environment variable documentation.
- Add staging environment.
- Add production environment.
- Add database migration workflow.
- Add seed workflow.
- Add CI checks.
- Add deployment checklist.
