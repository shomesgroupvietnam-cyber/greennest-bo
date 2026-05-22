# 01 - Domain Blueprint

## 1. Core Domain Concept

GreenNest BuildFlow is organized around the `Project` entity. Every important object should belong directly or indirectly to a project unless it is a global configuration, user, role, template or cross-project report.

Core rule:

```text
Project -> Work, Documents, Legal, Design, Construction, Finance, Meetings, Reports, Risks
```

## 2. Main Domains

## 2.1 Project Core

Purpose:

- Create the project container.
- Store basic project identity and ownership.
- Connect every module to one source of truth.

Entities:

- Project.
- ProjectMember.
- ProjectStatusHistory.
- ProjectMilestone.
- ProjectSetting.

Key data:

- Project code.
- Name.
- Location.
- Area.
- Project type.
- Investor.
- Owner.
- Current status.
- Start/end target.
- Tags or classification.

## 2.2 Axis 1 - Investment Formation BuildFlow

Purpose:

- Manage the project formation stage from strategic investment direction to internal approvals, land/legal/design readiness and construction permit readiness.
- Replace the old standalone legal-step menu with five business groups that can expand independently without making users navigate a long flat checklist.
- Keep legacy legal/planning/design steps auditable as workflow/checklist items inside the five groups.
- Make blockers, approvals, budget exposure and decision history visible to executives.

Axis 1 groups:

1. Executive Leadership.
2. Project Search and Development.
3. Legal.
4. Design - Planning - Technical - BIM.
5. Internal Proposal - Meeting - Approval.

Current implementation priority:

- Implement Executive Leadership first.
- Do not implement Project Search and Development, Legal V2, Design/Planning/Technical/BIM V2 or Internal Proposal/Meeting/Approval as new Axis 1 routes until explicitly scheduled.
- Existing legal checklist code remains valid and should not be deleted during this restructuring.

Core entities:

- LegalStep.
- LegalChecklistTemplate.
- LegalStepDependency.
- LegalSubmission.
- AuthorityResponse.
- LegalRisk.
- Meeting.
- Decision.
- Proposal.
- ProposalStep.
- ProposalDecision.
- AuditLog.

Executive Leadership scope:

- Strategic investment plan.
- Area/segment direction.
- Investment budget.
- Executive directives.
- Executive dashboard.
- Leadership meetings.
- Internal investment-principle approval.
- Decision log.
- Mock AI leadership support until production AI workflows are approved.

Legacy 12-step workflow:

The old flow is fixed at 12 steps, not 13. These steps must not become independent top-level menus. They remain configurable checklist/workflow items and are classified into the five Axis 1 groups.

| Legacy step | Primary Axis 1 group | Notes |
| --- | --- | --- |
| Land/site survey | Project Search and Development | Land bank and early project sourcing workflow. |
| Planning analysis | Design - Planning - Technical - BIM | Planning indicators and technical feasibility; legal submission tracking can link from Legal. |
| Investment proposal | Project Search and Development | Internal proposal route and approval history link through Internal Proposal - Meeting - Approval. |
| Investment policy approval | Legal | External/legal procedure; internal principle approval belongs to Executive Leadership and Internal Proposal - Meeting - Approval. |
| 1/500 planning | Design - Planning - Technical - BIM | Technical drawings and planning package; authority submission tracking can link from Legal. |
| Basic design | Design - Planning - Technical - BIM | Technical design package. |
| Feasibility study | Design - Planning - Technical - BIM | Technical part; investment efficiency assumptions can link from Project Search and Development. |
| Environmental approval | Legal | Legal submission and authority response workflow. |
| Fire safety approval | Legal | Legal procedure; MEP/design evidence can link from Design - Planning - Technical - BIM. |
| Land allocation/lease | Legal | Land procedure and authority response workflow. |
| Investor recognition | Legal | Investor acceptance/appointment procedure. |
| Construction permit | Legal | Permit procedure and required document readiness. |

Scalable direction:

- Legal templates must be configurable by project type and province.
- Steps can have dependencies.
- Each step can link to required documents, submissions, authority responses, proposals, meetings, decisions and risks.
- Executive approval gates should reference the underlying workflow records instead of duplicating them.

## 2.3 Task and Work Management

Purpose:

- Track work execution across all modules.
- Turn decisions, legal blockers, document gaps and construction issues into accountable tasks.

Entities:

- Task.
- TaskComment.
- TaskDependency.
- TaskAttachment.
- TaskActivity.

Key rules:

- Task belongs to a project.
- Task may optionally link to legal step, document, meeting, construction package, finance item or risk.
- Every important task should have owner, status, priority and due date.

## 2.4 Document Center

Purpose:

- Manage files, links, drawings, approvals, contracts and official records.

Entities:

- Document.
- DocumentVersion.
- DocumentType.
- DocumentRequirement.
- DocumentApproval.
- DocumentRelation.

Key rules:

- Documents belong to a project.
- Documents can be linked to legal steps, tasks, meetings, contracts and reports.
- Version history must be preserved.
- Missing/expired documents must feed dashboard alerts.

Scalable direction:

- Support structured approval flows.
- Support required document templates by project type.
- Support private storage and signed URLs.

## 2.5 Meetings and Decisions

Purpose:

- Preserve decisions and turn discussion into action.

Entities:

- Meeting.
- MeetingParticipant.
- Decision.
- ActionItem.
- MeetingAttachment.

Key rules:

- Meeting belongs to a project or portfolio.
- Decision can create tasks.
- Action items must have owner and due date.
- Important decisions should appear in project history.

## 2.6 Design Management

Purpose:

- Manage design package readiness, review and changes.

Entities:

- DesignPackage.
- Drawing.
- DesignReview.
- DesignIssue.
- DesignChange.

Key rules:

- Design packages link to documents and legal requirements.
- Changes must have reason, approval status and impact.
- Design issues can create tasks.

## 2.7 Construction Execution

Purpose:

- Track site execution, contractors, work packages, quality and acceptance.

Entities:

- ConstructionPackage.
- Contractor.
- Contract.
- ScheduleItem.
- SiteDiary.
- QualityChecklist.
- Inspection.
- AcceptanceRecord.
- ChangeOrder.
- SafetyObservation.

Key rules:

- Construction schedule rolls up to project progress.
- Delays feed dashboard.
- Quality/acceptance records link to documents and payments.
- Contractors have scope, contract and performance status.

## 2.8 Finance and Commercial

Purpose:

- Track financial control from budget to actual cost and cash flow.

Entities:

- Budget.
- BudgetLine.
- Contract.
- Commitment.
- PaymentRequest.
- Invoice.
- CostActual.
- CashFlowPlan.
- FinancialRisk.

Key rules:

- Finance data belongs to project and optionally work package/contractor.
- Dashboard should show budget variance and cash pressure.
- Payment can depend on acceptance records.

## 2.9 Risk and Issue Management

Purpose:

- Make risks visible before they become crises.

Entities:

- Risk.
- Issue.
- MitigationPlan.
- RiskActivity.

Risk sources:

- Legal blocked steps.
- Overdue tasks.
- Missing critical documents.
- Budget variance.
- Schedule delay.
- Quality failures.
- Contractor performance.

## 2.10 Reporting and Analytics

Purpose:

- Generate operational and executive views from structured data.

Entities:

- ReportTemplate.
- ReportRun.
- MetricSnapshot.
- DashboardWidgetConfig.

Report types:

- Weekly project report.
- Monthly executive report.
- Legal status report.
- Document readiness report.
- Construction progress report.
- Budget variance report.

## 2.11 AI Assistance

Purpose:

- Support users by analyzing structured project data and documents.

Capabilities:

- Summarize project status.
- Detect missing documents.
- Suggest priority tasks.
- Draft weekly report.
- Extract meeting action items.
- Highlight legal bottlenecks.
- Answer questions about a project.

Guardrails:

- AI should recommend, not decide.
- AI output must cite source data when possible.
- AI actions that mutate data require user confirmation.

## 3. Cross-Domain Rules

- Every operational entity needs `project_id` unless intentionally global.
- Critical entities need `created_at`, `updated_at`, `created_by`, and audit history.
- Status values use stable keys and Vietnamese labels.
- Deleting should usually mean archive/soft delete.
- Dashboard must derive from structured data.
- Files should be related to domain entities, not just uploaded into a generic bucket.
