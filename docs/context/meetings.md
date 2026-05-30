# Context Pack: Meetings

Use this when a story touches meeting engine, meeting visibility, meeting decisions, follow-up actions, AI summaries, minutes, related records or meeting-to-task flows.

## Current Contract

- `src/modules/meetings/types.ts` defines `Meeting`, `Decision`, meeting attachments, AI summary, follow-up actions and audit entries.
- `Meeting` supports `organizationId`, `projectId`, `projectIds`, `axisId`, `departmentId`, `visibility`, `participantScope`, participants, related approvals/tasks and audit log.
- `src/modules/meetings/services/meeting-service.ts` owns meeting CRUD plus legacy meeting `createDecision` and `convertDecisionToTask`.
- `src/modules/meetings/services/meeting-repository.ts` maps JSON and Supabase meetings/decisions.
- `src/modules/meetings/actions.ts` performs session permission checks, scoped meeting checks, revalidation and redirects.
- `database/migrations/202605230001_add_meeting_engine_fields.sql` added richer meeting fields.

## Rules

- Meeting visibility is enforced server/service side; do not rely on UI filters alone.
- Organization or portfolio meetings may not have a single `projectId`; code must handle `projectIds` or organization-level scope where supported.
- Related approvals/tasks/decisions are links, not automatic state transitions.
- Meeting AI summaries are drafts until approved; do not treat raw AI summary as authoritative.
- Meeting decision/action item conversion to task is legacy one-task behavior; do not overload it for official multi-assignment decisions.
- Revalidate meeting, project, task and executive routes when mutations affect visible lists.
- Keep meeting route/page components thin; business logic belongs in meeting services/actions.

## Files To Inspect Before Editing

- `src/modules/meetings/types.ts`
- `src/modules/meetings/validation.ts`
- `src/modules/meetings/services/meeting-service.ts`
- `src/modules/meetings/services/meeting-repository.ts`
- `src/modules/meetings/actions.ts`
- `src/modules/meetings/components/meeting-form.tsx`
- `src/modules/meetings/components/decision-list.tsx`
- `src/lib/permissions/access-scope.ts`
- `src/lib/permissions/scoped-resources.ts`
- `database/migrations/202605230001_add_meeting_engine_fields.sql`

## Test Focus

- `tests/unit/meeting-service.test.ts`
- Supabase row to camelCase mapping.
- Meeting without `projectId` where story scope allows it.
- Permission/scoped access for direct meeting and decision reads.
- Regression for `convertDecisionToTask`.
