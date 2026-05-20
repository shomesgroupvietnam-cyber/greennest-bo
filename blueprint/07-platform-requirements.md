# 07 - Platform Requirements

## 1. Scope

This document defines scalable platform requirements for GreenNest BuildFlow beyond MVP V1. MVP-specific requirements remain in root `requirement.md`.

## 2. Functional Requirements

### Project Portfolio

- The system shall support multiple projects.
- The system shall support project members and roles.
- The system shall support company/workspace roles and project-specific roles.
- The system shall support role-specific landing screens.
- The system shall support permission-based navigation.
- The system shall support project status history.
- The system shall support project milestones and important dates.
- The system shall support portfolio-level dashboard views.

### Enterprise Governance and Internal Approvals

- The system shall support a shared Internal Proposal and Approval workflow across modules.
- The system shall support proposal types for investment, legal, document, finance, contract, procurement, design, construction, HR, QA/QC and safety workflows.
- The system shall support draft, submitted, in review, change requested, approved, rejected and archived proposal states.
- The system shall support configurable approval steps by proposal type, amount/risk threshold, project and role.
- The system shall support proposal comments, attachments, linked records and decision history.
- The system shall support AI preliminary checks on proposal completeness, missing evidence, risk and suggested approval route.
- The system shall prevent AI from approving proposals or bypassing human approval.
- The system shall audit every proposal state change and approval decision.

### Investment Development

- The system shall support new opportunity/project lead records.
- The system shall support land bank and early feasibility metadata.
- The system shall support investment proposal review and approval before conversion to an active project.
- The system shall link investment opportunities to legal, planning, finance and document evidence.

### Legal and Planning

- The system shall support configurable legal checklist templates.
- The system shall support project-type-specific and province-specific legal steps.
- The system shall support dependencies between legal steps.
- The system shall support legal submissions and authority responses.
- The system shall support legal risks and blockers.
- The system shall link legal steps to required documents.

### Tasks and Accountability

- The system shall support project-scoped tasks.
- The system shall support task assignment, due date, priority, status and category.
- The system shall support comments, activity and attachments.
- The system shall support task dependencies.
- The system shall allow decisions and risks to generate tasks.

### Documents

- The system shall support file upload and external links.
- The system shall support document types and required document templates.
- The system shall support document versions.
- The system shall support document approval status.
- The system shall support relationships between documents and legal steps, tasks, meetings, contracts and reports.
- The system shall support private storage and access-controlled file retrieval.

### Meetings and Decisions

- The system shall support meeting notes by project.
- The system shall support participants.
- The system shall support decisions.
- The system shall support action items with owner, due date and status.
- The system shall support converting action items to tasks.

### Design Management

- The system shall support design packages.
- The system shall support drawing register and versioning.
- The system shall support design reviews.
- The system shall support design issues and design changes.
- The system shall link design records to documents and tasks.

### Construction Management

- The system shall support construction packages.
- The system shall support contractors and contract scope.
- The system shall support schedule items.
- The system shall support site diary.
- The system shall support quality checklists.
- The system shall support inspections and acceptance records.
- The system shall support change orders and safety observations.
- The system shall support QA/QC quality gates and non-conformance tracking.
- The system shall support safety incidents, observations and corrective actions.

### Finance and Commercial

- The system shall support project budget and budget lines.
- The system shall support contracts and commitments.
- The system shall separate accounting operations from financial management and contract management.
- The system shall support payment requests and invoices.
- The system shall support actual costs.
- The system shall support cash flow plans.
- The system shall support budget variance reporting.

### HR and Administration

- The system shall support HR/admin requests and approvals.
- The system shall support employee or collaborator profiles when HR module is implemented.
- The system shall support document control/filing workflows when văn thư/lưu trữ scope is approved.

### Reporting

- The system shall support dashboard metrics from structured data.
- The system shall support weekly and monthly report generation.
- The system shall support report snapshots.
- The system shall support portfolio comparison.
- The system shall support risk and issue reports.

### AI Assistance

- The system shall support AI-generated project summaries.
- The system shall support AI-generated meeting summaries.
- The system shall support AI-assisted missing document detection.
- The system shall support AI-assisted risk suggestions.
- The system shall support AI-assisted proposal review and approval-route suggestions.
- The system shall require user confirmation before AI mutates records.
- The system shall enforce permission-aware AI context retrieval.

## 3. Non-functional Requirements

### Security

- Authenticated access is required for all app routes except public auth pages.
- Server-side permission checks are required for all mutations.
- Permission checks must use centralized permission keys, not duplicated role checks inside UI components.
- The system shall support at minimum Admin, Tổng giám đốc, Phó tổng giám đốc, Giám đốc dự án, Quản lý dự án, Tổ trưởng, Pháp lý, Kế toán, Thiết kế, Kỹ thuật, Thi công, Thư ký/Trợ lý and Viewer roles.
- Enterprise expansion shall add Đầu tư phát triển, Quản lý tài chính, Hành chính nhân sự, QA/QC chất lượng, An toàn lao động, Kiểm toán nội bộ and Quản lý hợp đồng before implementing the shared Proposal module.
- Sensitive files must use private storage or signed URLs.
- Role changes must be audited.

### Reliability

- Main workflows should not depend on AI availability.
- File metadata must not be lost if upload fails midway.
- Important mutations should be transactional where possible.

### Performance

- Core list pages should respond quickly under expected project team workloads.
- Dashboard queries should use indexes, views or cached summaries as data grows.
- Heavy report generation and AI processing should run asynchronously.

### Scalability

- Module boundaries must support future extraction into dedicated services.
- Data model must support multiple projects and future workspace/team structures.
- Configurable templates should be used for legal steps and document requirements.

### Auditability

- Important changes must be logged.
- Reports should preserve snapshots.
- Status changes should keep actor and timestamp.

### Maintainability

- TypeScript must be used across application code.
- Business logic should live in services/use cases.
- Constants should be centralized.
- Tests should cover permission logic and critical workflows.

### Localization

- Vietnamese is the first UI language.
- Internal enum keys must be language-neutral.
- Labels should be localizable later.

## 4. Compliance and Data Sensitivity

The platform may store legal, financial, contract and personal information. The system should prepare for:

- Least-privilege access.
- Audit trail.
- Private document storage.
- Export controls.
- Backup and recovery.
- User deactivation without deleting historical records.
