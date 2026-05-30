---
title: "One Meeting Engine - Types, Schema, Mock, UI Placeholder"
type: "feature"
created: "2026-05-23"
status: "done"
baseline_commit: "484589acef52da9266963b442df3185cb9a82fce"
context:
  - "../planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md"
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Current meetings are project-bound meeting notes, so the app would need refactoring later to support executive, department, partner, and government meetings. The user wants the extensible structure locked now without implementing real video call, real AI summary, real transcript, or deep workflow.

**Approach:** Extend the existing `meetings` module into one shared Meeting Engine with dynamic meeting types, scope metadata, lifecycle status, follow-up/decision placeholders, mock data, DB migration, and UI placeholders. Keep existing meeting routes and decision-to-task behavior working.

## Boundaries & Constraints

**Always:** Use one `meetings` module/engine; preserve current pages and service APIs where practical; enforce visibility through existing scoped-resource filtering plus new meeting metadata; keep AI summary and transcript as placeholders/draft fields only.

**Ask First:** Any real video integration, real AI/transcription provider, deep workflow automation, new hardcoded meeting modules, or destructive DB rewrite.

**Never:** Do not build separate meeting modules per type. Do not implement video call, real AI summary, real transcript, or full workflow engine in this change.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create typed meeting | Form submits a `PROJECT_MEETING` with project, visibility, status, agenda, participants | Meeting is stored with type/scope metadata and visible in list/detail placeholders | Invalid dates/type/status rejected by validation |
| Org-level meeting placeholder | Form submits an executive/department meeting without project | Meeting is allowed and displayed without project link | Follow-up task conversion still requires a project-backed decision |
| Scoped visibility | Limited user lists meetings | User sees assigned-project meetings or meetings where they are host/participant | Direct access outside scope returns unauthorized state |

</frozen-after-approval>

## Code Map

- `src/modules/meetings/constants.ts` -- new canonical meeting types, statuses, visibility labels.
- `src/modules/meetings/types.ts` -- Meeting Engine domain types and filters.
- `src/modules/meetings/validation.ts` -- Zod schema for type/scope/status placeholder fields.
- `src/modules/meetings/services/meeting-repository.ts` -- JSON/Supabase mapping, filters, and backward-compatible old mock rows.
- `src/modules/meetings/services/meeting-service.ts` -- creation/update defaults and optional project handling.
- `src/modules/meetings/actions.ts` -- form parsing and optional project permission guard.
- `src/lib/permissions/access-scope.ts` -- meeting visibility scope predicate.
- `database/migrations/202605230001_add_meeting_engine_fields.sql` -- additive schema migration.
- `.mock-data/meetings-decisions.json` -- representative meeting type mock data.
- `src/modules/meetings/components/*` and meeting pages -- placeholders and filters.

## Tasks & Acceptance

**Execution:**
- [x] `src/modules/meetings/constants.ts`, `types.ts`, `validation.ts` -- add Meeting Engine enums, fields, and schemas.
- [x] `src/modules/meetings/services/meeting-repository.ts`, `meeting-service.ts`, `actions.ts` -- persist fields, handle optional project/global meetings, keep decision-to-task path.
- [x] `src/lib/permissions/access-scope.ts` -- enforce project/participant/host scope for meetings.
- [x] `database/migrations/202605230001_add_meeting_engine_fields.sql`, `.mock-data/meetings-decisions.json` -- add additive schema and mock meetings across types.
- [x] `src/modules/meetings/components/*`, `src/app/(dashboard)/meetings/*` -- add filters, badges, metadata placeholders, AI draft/transcript placeholder.

**Acceptance Criteria:**
- Given existing meeting code, when the app lists or opens meetings, then old rows still render through defaults.
- Given a meeting type/status/visibility, when the user creates or edits a meeting, then the metadata is saved and displayed.
- Given a meeting has follow-up decisions, when needed, then the existing task conversion path remains available.
- Given no real AI/video/transcript is implemented, when viewing a meeting, then those sections appear only as placeholders/draft metadata.

## Spec Change Log

## Design Notes

Meeting Engine fields are intentionally additive and mostly optional/defaulted so existing JSON mock stores and database rows remain readable.

## Verification

**Commands:**
- `npm run typecheck` -- passed.
- `npm test -- tests/unit/meeting-service.test.ts` -- passed.
- `npm test -- tests/unit/workspaces.test.ts tests/unit/ai-coordinator-service.test.ts tests/unit/ai-action-proposal-service.test.ts` -- passed.
- `npm run lint` -- passed.
