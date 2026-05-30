# Context Pack: Decision And Assignment

Use this when a story touches official decisions, decision source linking, assignments, decision-created tasks, Decision & Assignment Center, meeting decision tracking or approval-to-decision flows.

## Current State

- Story 4.1 defines official decision records but may not be implemented yet. Verify code before building later Epic 4 stories.
- `src/modules/meetings/types.ts` currently has a legacy `Decision` for meeting action items: `meetingId?`, required `projectId`, `decisionText`, `ownerId`, `dueDate`, `status`, `taskId?`.
- `src/modules/meetings/services/meeting-service.ts` has `createDecision` for meeting-scoped action items and `convertDecisionToTask` for one task per decision.
- `src/modules/meetings/services/meeting-repository.ts` maps the current `decisions` table fields only; source/scope/official decision fields may be added by Story 4.1.
- `src/modules/tasks` owns actual tasks. Do not create task-like records in executive UI only.
- Proposal approval actions live in `src/modules/proposals`; do not mutate proposal status when creating an official decision unless the story explicitly says so.

## Rules

- Do not create a second incompatible decision model. Extend/reuse the established official decision contract once Story 4.1 lands.
- Keep meeting action item behavior backward compatible unless a migration story explicitly replaces it.
- Do not use legacy `Decision.taskId` to represent multiple assignments/tasks. Multi-assignment needs child relation or equivalent queryable contract.
- Official decision source links should store source metadata (`sourceType`, `sourceId`, linked records), not duplicate full source content.
- Permission checks for creating decisions/assignments must validate actor permission, source readability and target scope before writes.
- For multi-project or organization-level decisions, require explicit target project for assignment/task creation unless exactly one project default is unambiguous.
- Audit decision mutations with safe summaries only.
- UI for full Decision & Assignment Center belongs to Story 4.4; service/data contracts should be ready for it but not overbuild UI early.

## Files To Inspect Before Editing

- `_bmad-output/implementation-artifacts/4-1-decision-record-tu-approval-meeting-hoac-doc-lap.md`
- `_bmad-output/implementation-artifacts/4-2-assignment-task-tu-decision-cho-nhieu-nguoi.md`
- `src/modules/meetings/types.ts`
- `src/modules/meetings/services/meeting-service.ts`
- `src/modules/meetings/services/meeting-repository.ts`
- `src/modules/meetings/actions.ts`
- `src/modules/tasks/types.ts`
- `src/modules/tasks/services/task-service.ts`
- `src/lib/permissions/scoped-resources.ts`
- `database/migrations/202605160001_create_mvp_core_schema.sql`
- `database/policies/001_mvp_rls.sql`

## Test Focus

- Official decision creation and source linking.
- Permission block before write.
- Multi-assignment all-or-nothing behavior.
- Task linkage from decision assignment.
- Regression for legacy meeting `createDecision` and `convertDecisionToTask`.
