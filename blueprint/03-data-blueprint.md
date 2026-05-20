# 03 - Data Blueprint

## 1. Data Philosophy

GreenNest BuildFlow must be data-centered. The product succeeds only if project data is structured enough to power dashboards, reports, warnings, decisions and AI assistance.

Rules:

- Data should be entered once and reused.
- Important records need owner, status, timeline and history.
- Project data should not live only in free text.
- Documents must have metadata, not just file storage.
- Dashboard metrics must be derived from structured records.

## 2. Data Ownership

| Data Area | Owner Role | Primary Use |
| --- | --- | --- |
| Project profile | Owner/Admin/PM | Identity and portfolio control |
| Legal steps | Legal/Admin/PM | Legal readiness |
| Tasks | PM/Member | Execution and accountability |
| Documents | Assistant/Document controller/Admin | Evidence and workflow readiness |
| Meetings | PM/Assistant | Decisions and follow-up |
| Design | Design manager/Engineer | Design readiness and change control |
| Construction | Construction manager/Site supervisor | Progress, quality and site control |
| Finance | Accountant/Finance manager | Budget and cash flow control |
| Reports | PM/Founder | Executive visibility |

## 3. Entity Groups

### Identity and Access

- users.
- roles.
- permissions.
- role_permissions.
- workspaces.
- workspace_members.
- project_members.
- permission_overrides.

MVP can keep `users.role` as a shortcut, but scalable design should use role and permission tables plus workspace/project membership. See `12-auth-roles-permissions.md`.

### Project Core

- projects.
- project_status_history.
- project_milestones.
- project_settings.

### Work

- tasks.
- task_comments.
- task_dependencies.
- task_attachments.
- task_activity.

### Documents

- documents.
- document_versions.
- document_types.
- document_requirements.
- document_approvals.
- document_relations.

### Legal

- legal_steps.
- legal_checklist_templates.
- legal_step_templates.
- legal_submissions.
- authority_responses.
- legal_risks.

### Meetings

- meetings.
- meeting_participants.
- decisions.
- action_items.

### Design

- design_packages.
- drawings.
- design_reviews.
- design_issues.
- design_changes.

### Construction

- contractors.
- contracts.
- construction_packages.
- schedule_items.
- site_diaries.
- quality_checklists.
- inspections.
- acceptance_records.
- change_orders.
- safety_observations.

### Finance

- budgets.
- budget_lines.
- commitments.
- payment_requests.
- invoices.
- cost_actuals.
- cash_flow_plans.
- financial_risks.

### Reporting and Intelligence

- dashboard_metric_snapshots.
- report_templates.
- report_runs.
- risk_register.
- notifications.
- audit_logs.
- ai_insights.

## 4. Core Data Rules

- Use `uuid` primary keys.
- Use `created_at` and `updated_at` on operational tables.
- Use `created_by` and `updated_by` where accountability matters.
- Use `archived_at` instead of hard deletion for main records.
- Use `project_id` on all project-scoped tables.
- Use stable enum keys and translated labels in UI.
- Use `jsonb` for snapshots and metadata, not as a substitute for core relational fields.

## 5. Naming Rules

Database:

- Tables: snake_case, plural.
- Columns: snake_case.
- Foreign keys: `{entity}_id`.
- Join tables: `{left}_{right}` or domain-specific names.

TypeScript:

- Types/interfaces: PascalCase.
- Constants: SCREAMING_SNAKE_CASE or named objects.
- Files: use one consistent convention per repo.

## 6. Status Strategy

Statuses should use stable internal keys.

Example:

```ts
{
  key: "blocked",
  labelVi: "Bị vướng",
  severity: "danger"
}
```

Benefits:

- Easy localization.
- Easy dashboard grouping.
- Avoid duplicated strings.
- Easier future configuration.

## 7. Audit Model

Minimum `audit_logs` fields:

- id.
- actor_id.
- entity_type.
- entity_id.
- action.
- old_value.
- new_value.
- created_at.

Audit priority:

1. User/role changes.
2. Project updates.
3. Legal status changes.
4. Document version/status changes.
5. Task status/assignee/deadline changes.
6. Finance records when finance module is introduced.

## 8. Dashboard Data Model

Initial dashboard can query live tables.

Metrics:

- total_projects.
- active_projects.
- overdue_tasks.
- upcoming_tasks.
- missing_documents.
- blocked_legal_steps.
- project_progress.
- legal_progress.

As system grows:

- Create SQL views for common metrics.
- Create materialized views for expensive portfolio metrics.
- Store metric snapshots for historical reporting.

## 9. Reporting Snapshots

Reports should preserve data at the time of generation.

Example:

- Weekly report generated on Monday should not silently change when task data changes on Wednesday.
- Store report run metadata, generated summary and source metric snapshot.

## 10. AI Data Readiness

AI works best when data has structure and source links.

Prepare:

- Stable project IDs.
- Document metadata.
- Task status and ownership.
- Legal step notes.
- Meeting decisions.
- Audit trail.

AI context builders should retrieve only data the user can access and should include source references.

## 11. Migration Strategy

- Use migrations from the first database version.
- Never edit old migrations after they are applied to shared environments.
- Add indexes with feature growth.
- Keep seed data realistic enough for demos and tests.

## 12. Initial Index Candidates

- `projects(code)`.
- `projects(status)`.
- `tasks(project_id)`.
- `tasks(assignee_id)`.
- `tasks(status, due_date)`.
- `documents(project_id)`.
- `documents(status)`.
- `legal_steps(project_id)`.
- `legal_steps(status, due_date)`.
- `audit_logs(entity_type, entity_id)`.
- `notifications(user_id, is_read)`.
