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

## 2.2 Legal, Planning and Investment

Purpose:

- Track readiness from land review to construction permit.
- Make legal blockers visible to executives.

Entities:

- LegalStep.
- LegalChecklistTemplate.
- LegalStepDependency.
- LegalSubmission.
- AuthorityResponse.
- LegalRisk.

Default legal flow:

1. Land/site survey.
2. Planning analysis.
3. Investment proposal.
4. Investment policy approval.
5. 1/500 planning.
6. Basic design.
7. Feasibility study.
8. Environmental approval.
9. Fire safety approval.
10. Land allocation/lease.
11. Investor recognition.
12. Construction permit.

Scalable direction:

- Legal templates must be configurable by project type and province.
- Steps can have dependencies.
- Each step can link to required documents, submissions, authority responses and risks.

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
