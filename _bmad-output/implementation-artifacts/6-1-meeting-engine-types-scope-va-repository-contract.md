# Story 6.1: Meeting Engine Types, Scope Và Repository Contract

Status: done

Ghi chú tạo story: Ultimate context engine analysis completed - comprehensive developer guide created. Story này mở Epic 6 bằng việc chuẩn hóa One Meeting Engine đã có trong codebase: nhiều meeting type, scope động, organization-only/multi-project, visibility/participant scope, mock + Supabase repository parity và RLS tương ứng. Phạm vi là contract, validation, repository, permission/RLS và test; không xây full Meeting Center UI, không triển khai real room booking, real transcript, real AI summary provider, minutes approval flow, follow-up task flow hay decision tracking nâng cao của các story 6.2-6.6.

## Story

As a người dùng có quyền tạo/xem họp,
I want một meeting engine chung hỗ trợ nhiều loại họp và scope động,
so that hệ thống không tạo nhiều module họp riêng cứng cho từng loại họp.

## Acceptance Criteria

1. **Meeting type và status contract ổn định**
   - Given meeting engine được cấu hình
   - When tạo, đọc hoặc map meeting qua service/repository
   - Then meeting hỗ trợ đúng các type `EXECUTIVE_MEETING`, `EXECUTIVE_OPERATIONAL_MEETING`, `DEPARTMENT_INTERNAL_MEETING`, `PROJECT_MEETING`, `EXTERNAL_PARTNER_MEETING`, `GOVERNMENT_MEETING`.
   - And meeting workflow hỗ trợ đúng status `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `FOLLOW_UP_PENDING`, `CLOSED`.
   - And machine keys giữ nguyên ở TypeScript/DB; label tiếng Việt chỉ nằm ở constants/UI.

2. **Scope động và dữ liệu tối thiểu của meeting**
   - Given meeting có scope khác nhau
   - When lưu meeting
   - Then domain record hỗ trợ `organizationId`, `projectId` optional, `projectIds` cho multi-project, `axisId`, `departmentId`, `visibility`, `participantScope`, `hostId`, `participants`, `externalParticipants`, `roomId`, `agenda`, `attachments`, `transcript`, `aiSummary`, `meetingMinutes`, `decisions`, `followUpActions`, `relatedApprovals`, `relatedTasks`, `auditLog`, `status`, `createdBy`, timestamps.
   - And meeting ngoài project cụ thể không bị ép có `projectId`; meeting multi-project phải giữ đủ `projectIds`.
   - And `roomId` chỉ là placeholder MVP; không chặn tạo meeting khi chưa có room booking thật.
   - And `aiSummary.status` mặc định là `DRAFT`; không coi AI summary là official output trong story này.

3. **Mock/file-backed và Supabase repository parity**
   - Given app chạy mock/file-backed hoặc Supabase mode
   - When service gọi `listMeetings`, `getMeeting`, `createMeeting`, `updateMeeting`
   - Then repository trả cùng domain DTO camelCase và không leak DB snake_case ra UI/service.
   - And filter `projectId` phải match cả `projectId` đơn và `projectIds` multi-project trong cả JSON và Supabase.
   - And mapping giữ parity cho arrays/json fields: participants, external participants, attachments, AI summary, decisions, follow-up actions, related approvals/tasks, audit log.

4. **Permission/scope và RLS không leak unauthorized meeting**
   - Given user có/không có `meeting.view` hoặc `meeting.create` trong scope phù hợp
   - When list/get/create meeting qua route/action/service hoặc direct Supabase policy
   - Then unauthorized user không thấy meeting trước rồi mới ẩn ở UI.
   - And host/participant có thể đọc meeting của mình khi có `meeting.view`.
   - And scoped user chỉ đọc/tạo meeting theo project, multi-project, organization/axis/department scope được giao.
   - And RLS phải mirror app-layer scope cho `project_ids` và organization-only meeting; không chỉ kiểm tra `project_id`.

5. **Backward compatibility với decision/action item và Epic 4 records**
   - Given code hiện có đã có official decision record service và legacy meeting action item flow
   - When Story 6.1 harden meeting contract
   - Then `createDecisionAction` vẫn tạo official decision từ source meeting qua `createDecisionRecord`.
   - And `createDecision`/`convertDecisionToTask` legacy regression vẫn hoạt động cho one-task action item gắn một project.
   - And implementation không tạo model/table meeting hoặc decision song song cạnh tranh với `src/modules/meetings` và official decision contract từ Epic 4.

6. **Test coverage chứng minh contract**
   - Given developer hoàn tất story
   - When chạy targeted và full validation
   - Then có unit tests cho type/status contract, validation, scope filtering, repository mapping JSON/Supabase, RLS/policy behavior và legacy decision regression.
   - And required gates pass: `npm run typecheck`, `npm run lint`, `npm run test`; chỉ chạy `npm run test:e2e` nếu có route/navigation/UI behavior mới.

## Tasks / Subtasks

- [x] Chuẩn hóa domain constants, types và validation (AC: 1, 2)
  - [x] Verify `src/modules/meetings/constants.ts` giữ đúng 6 `MEETING_TYPES`, 7 `MEETING_STATUSES`, visibility và participant scope hiện có; không đổi machine key nếu không có migration/test tương ứng.
  - [x] Verify `src/modules/meetings/types.ts` giữ `Meeting` contract đầy đủ: optional `projectId`, `projectIds`, org/axis/department, participants, external participants, room placeholder, agenda, attachments, transcript, draft AI summary, minutes, decisions, follow-up, related approvals/tasks và audit.
  - [x] Update `src/modules/meetings/validation.ts` nếu còn thiếu validation cho multi-project input, projectIds array, visibility/participant scope/status/type, date/time order hoặc empty optional fields.
  - [x] `meetingDate`/`startTime` dùng ISO timestamp; business date-only chỉ dùng cho dueDate/action item, không parse arbitrary localized string.
  - [x] Không thêm dependency hoặc global state; dùng Zod và service/repository hiện có.

- [x] Harden service contract và repository parity (AC: 2, 3)
  - [x] Update `src/modules/meetings/services/meeting-service.ts#createMeeting` để validate mọi `projectIds` được gửi, không chỉ `projectId` đơn; reject archived/missing project trước write.
  - [x] Normalize `projectIds`: dedupe, include `projectId` nếu có, preserve empty array cho organization-only meeting.
  - [x] Preserve defaults: `hostId = input.hostId ?? createdBy`, `aiSummary = { status: "DRAFT" }`, `attachments/decisions/followUpActions/relatedApprovals/relatedTasks/auditLog = []`.
  - [x] Update `updateMeeting` only for fields allowed by story; không để edit flow vô tình xóa immutable project scope nếu UI hiện tại không hỗ trợ sửa projectIds.
  - [x] Verify `JsonMeetingRepository` and `SupabaseMeetingRepository` map all meeting fields both directions, including JSON/array columns.
  - [x] Verify `listMeetings({ projectId })` in both JSON and Supabase matches `projectId` and `projectIds`; add tests for multi-project meeting.
  - [x] Keep robust JSON writes in `JsonMeetingRepository`; do not regress temp-file retry behavior.

- [x] Harden permission, scoped resource helpers và Server Actions (AC: 4)
  - [x] Update `src/lib/permissions/access-scope.ts#canReadMeetingInScope` tests for project-bound, multi-project, organization-only, host-created, participant and assignment-model cases.
  - [x] Ensure assignment-model users require `meeting.view` against the right target: organization, project, axis, department/workstream and record id where applicable.
  - [x] Ensure limited/external roles only see meeting when assigned project matches, host/createdBy matches, or participant list contains the user; organization-only meetings must not leak globally.
  - [x] Update `src/lib/permissions/scoped-resources.ts` only if helper dependencies need additional meeting context; keep filtering server/service-side before UI render.
  - [x] Update `src/modules/meetings/actions.ts#createMeetingAction` to validate all selected `projectIds` with `getScopedProject`, not only `projectId`, if form/action accepts multi-project input.
  - [x] For organization-only meeting create, require a valid scoped assignment or internal `meeting.create`; do not allow user to create broad org meeting just because `projectId` is blank.
  - [x] Preserve `createDecisionAction` using `createDecisionRecord({ sourceType: "meeting" })` and current revalidation paths.

- [x] Align DB migration and RLS policy assets (AC: 2, 3, 4)
  - [x] Do not edit old migrations unless already required by the repo pattern; add an incremental migration if schema or production RLS changes are needed.
  - [x] Review `database/migrations/202605230001_add_meeting_engine_fields.sql`: it already adds most meeting engine fields and drops `meetings.project_id not null`; build on it.
  - [x] Update `database/policies/001_mvp_rls.sql` and/or a new migration so meeting SELECT/INSERT checks support `project_ids` and organization-only scope in addition to `project_id`.
  - [x] Avoid duplicate contradictory policy definitions when touching the RLS asset.
  - [x] Add or update SQL/RLS tests/verification if direct policy behavior changes; RLS must not rely on UI hiding.
  - [x] Keep DB row names snake_case and domain DTO names camelCase.

- [x] Preserve decision/action item compatibility (AC: 5)
  - [x] Run regression around `createDecision`, `createDecisionAction`, `convertDecisionToTask`, `DecisionList`, `DecisionForm`.
  - [x] `convertDecisionToTask` must continue to reject decision without a single `projectId` with a clear Vietnamese domain error.
  - [x] Do not use legacy `Decision.taskId` for multi-assignment; that belongs to Epic 4 assignment service already implemented.
  - [x] Do not mutate proposal/approval, risk or task state when only creating/hardening a meeting record.

- [x] Tests and validation (AC: 1-6)
  - [x] Add/update `tests/unit/meeting-service.test.ts` for type/status defaults, multi-project create validation, organization-only meeting create, room placeholder and AI summary draft default.
  - [x] Add/update repository mapping tests for JSON and Supabase rows so serialized domain output has no `meeting_id`, `project_ids`, `meeting_type`, `participant_scope`, `created_at`, etc.
  - [x] Add/update `tests/unit/access-scope.test.ts` for meeting scope filtering, including multi-project and organization-only no-leak behavior.
  - [x] Add/update `tests/unit/meeting-actions.test.ts` for create action project/multi-project scope guard if action input changes.
  - [x] Add/update RLS/policy test if SQL helper/policy is changed.
  - [x] Run targeted tests first:

    ```bash
    npm run test -- tests/unit/meeting-service.test.ts tests/unit/meeting-actions.test.ts tests/unit/access-scope.test.ts tests/unit/meeting-repository-decision-version.test.ts
    ```

  - [x] Run full gates:

    ```bash
    npm run typecheck
    npm run lint
    npm run test
    ```

### Review Findings

- [x] [Review][Patch] `createMeetingAction` authorizes project-bound create with `project.view` instead of scoped `meeting.create` [src/modules/meetings/actions.ts:85]
- [x] [Review][Patch] Meeting RLS still has broad internal read/create bypasses instead of mirroring assignment scope [database/migrations/202606020003_harden_meeting_scope_rls.sql:20]
- [x] [Review][Patch] Repeated `projectIds` FormData entries are dropped because `readArrayField` uses `get()` instead of `getAll()` [src/modules/meetings/actions.ts:24]
- [x] [Review][Patch] Organization-only create grants can fail when blank `departmentId` bypasses the `meeting` workstream default [src/lib/permissions/scoped-resources.ts:188]
- [x] [Review][Patch] Meeting create can write an unscoped record when both project scope and `organizationId` are empty [src/lib/permissions/scoped-resources.ts:176]
- [x] [Review][Patch] Legacy `convertDecisionToTask` still converts multi-project decisions when a primary `projectId` exists [src/modules/meetings/services/meeting-service.ts:169]
- [x] [Review][Patch] Meeting RLS tests assert SQL substrings instead of proving allow/deny policy behavior [tests/unit/meeting-rls-policy.test.ts:14]

## Dev Notes

### Business Context

- Epic 6 objective: một Meeting System chung với nhiều meeting type, visibility/scope động, participants bên ngoài, attachments, agenda, minutes, AI summary draft, follow-up actions, related tasks/approvals, decision tracking và audit. Story 6.1 chỉ chốt nền contract và persistence/scope parity để các story sau xây list/filter, form related records, minutes/AI, follow-up và decision tracking. [Source: `_bmad-output/planning-artifacts/epics/epic-6-one-meeting-engine-cho-iu-hnh.md`]
- FR-070/FR-071 yêu cầu One Meeting Engine, không tạo nhiều module họp riêng cứng. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-072 quy định room booking chỉ là placeholder MVP. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-074/FR-108/FR-109 yêu cầu meeting type/scope/minimum fields/status lifecycle. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-118/FR-119 yêu cầu meeting ngoài project cụ thể và meeting gắn nhiều project. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]

### Current Code State

- `src/modules/meetings/types.ts`
  - Đã có `Meeting` với `organizationId`, optional `projectId`, `projectIds`, `axisId`, `departmentId`, `meetingType`, `visibility`, `participantScope`, `status`, `hostId`, `participants`, `externalParticipants`, `roomId`, `agenda`, attachments/transcript/AI summary/minutes/decisions/follow-up/related records/audit.
  - Đã có official `Decision`, `DecisionAssignment`, version/history types từ Epic 4; Story 6.1 không được tạo model decision song song.

- `src/modules/meetings/constants.ts`
  - Đã có đúng 6 meeting types và 7 statuses theo Epic 6.
  - Label hiện là UI/display concern; không dùng label làm DB/service machine key.

- `src/modules/meetings/validation.ts`
  - Đã có Zod enum cho meeting type/visibility/participant/status và time ordering.
  - Cần kiểm tra thêm multi-project form/action input nếu story mở `projectIds` từ UI/action.

- `src/modules/meetings/services/meeting-service.ts`
  - `createMeeting` đã validate `projectId` đơn, normalize default fields, set `aiSummary` draft và audit `meeting.created`.
  - Gap cần chú ý: nếu `projectIds` multi-project được gửi, service phải validate từng project thay vì chỉ kiểm tra `projectId`.
  - `createDecision`/`convertDecisionToTask` là legacy one-task action item path; giữ regression.

- `src/modules/meetings/services/meeting-repository.ts`
  - JSON store `meetings-decisions.json` đang chứa `meetings`, `decisions`, `decisionAssignments`, `decisionVersions`.
  - Supabase mapping đã map many meeting fields and projectIds; verify tests cover all fields and no snake_case leak.
  - JSON write already uses temp file + retry; preserve this because previous stories found Windows/parallel Vitest write race risk.

- `src/lib/permissions/access-scope.ts` and `src/lib/permissions/scoped-resources.ts`
  - `canReadMeetingInScope` already handles assignment-model, projectIds, host/createdBy/participants and limited-scope checks.
  - Add/strengthen tests around organization-only no-leak and multi-project matching.

- `database/migrations/202605230001_add_meeting_engine_fields.sql`
  - Already adds Meeting Engine fields and relaxes `meetings.project_id`.
  - Existing RLS in this migration and `database/policies/001_mvp_rls.sql` appears project-centric in some branches; story should harden project_ids and organization-only policy behavior.

- `src/modules/meetings/actions.ts`
  - `createMeetingAction` currently checks `input.projectId` with `getScopedProject`; if multi-project is exposed, validate all selected project ids.
  - `createDecisionAction` already delegates official meeting decision creation to `createDecisionRecord`, which is the correct Epic 4 contract.

### Architecture Guardrails

- Stack baseline: Next.js 15.3.2 App Router, React 19, TypeScript 5.8.3, Tailwind 3.4.17, Zod 3.24.4, Supabase JS 2.49.4, Vitest 3.1.3 and Playwright 1.52.0. Do not upgrade or add new libraries in this story. [Source: `_bmad-output/project-context.md`; `package.json`]
- Domain module stays in `src/modules/meetings`; service orchestration in `services/*-service.ts`; persistence mapping in `services/*-repository.ts`; Server Actions in `actions.ts`; tests under `tests/unit`. [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- Internal mutations use Server Actions + service layer. Components/pages must not call Supabase/repositories directly. [Source: `_bmad-output/project-context.md`]
- Permission-aware UI is not security. Permission and scope filtering must happen before DTO serialization and before repository writes. [Source: `docs/context/permissions-audit.md`]
- Mock/file-backed and Supabase adapters must stay contract-equivalent. DB snake_case stays in repository/SQL only; domain/UI stays camelCase. [Source: `_bmad-output/project-context.md`]

### Implementation Boundaries

- Do not build Story 6.2 Meeting Center filters/UI beyond tests or small contract wiring needed for this story.
- Do not build Story 6.3 create/edit related-record workflow.
- Do not build Story 6.4 minutes approval, attachment storage, real AI summary provider or AI approval.
- Do not build Story 6.5 follow-up task lifecycle.
- Do not build Story 6.6 post-meeting decision tracking panel.
- Do not add room booking/availability logic; `roomId` remains placeholder.
- Do not create a second meeting module/table/model for executive, government or external meetings.

### Previous Story Intelligence

- Epic 4 official decision work extended the existing `src/modules/meetings` decision repository instead of creating a parallel decision model. Meeting decision creation should keep using that direction.
- Story 4.2 established that legacy `Decision.taskId` is only for one-task conversion; multi-assignment uses child assignment records and linked tasks.
- Story 5.5 reinforced a stricter rule: official record visibility should require the feature permission in app-layer services and RLS; do not rely on broad project/proposal permissions when a feature-specific permission is required.
- Recent BMad changes left the worktree dirty. Implementation must be focused and must not revert unrelated artifacts.

### Latest Technical Notes

- No web research is required for this story: all relevant framework/library versions come from `package.json` and `_bmad-output/project-context.md`.
- Keep Next.js App Router Server Action behavior consistent with existing module actions: validate/permission-check first, mutate through service, `revalidatePath` before `redirect` if redirect is used.
- Keep Supabase RLS policy changes explicit: SELECT policies use `using`; INSERT policies use `with check`; UPDATE policies need both when updated.

### References

- `_bmad-output/planning-artifacts/epics/epic-6-one-meeting-engine-cho-iu-hnh.md`
- `_bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
- `_bmad-output/planning-artifacts/ux-design-specification/user-journey-flows.md`
- `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`
- `_bmad-output/project-context.md`
- `docs/context/meetings.md`
- `docs/context/permissions-audit.md`
- `docs/context/testing.md`
- `src/modules/meetings/types.ts`
- `src/modules/meetings/constants.ts`
- `src/modules/meetings/validation.ts`
- `src/modules/meetings/actions.ts`
- `src/modules/meetings/services/meeting-service.ts`
- `src/modules/meetings/services/meeting-repository.ts`
- `src/lib/permissions/access-scope.ts`
- `src/lib/permissions/scoped-resources.ts`
- `database/migrations/202605230001_add_meeting_engine_fields.sql`
- `database/policies/001_mvp_rls.sql`
- `tests/unit/meeting-service.test.ts`
- `tests/unit/meeting-actions.test.ts`
- `tests/unit/access-scope.test.ts`

### Checklist Validation Notes

- Story maps all Epic 6.1 ACs to concrete tasks and keeps later Epic 6 work out of scope.
- Current code state documents every risky update target before implementation.
- Architecture, permission/RLS, mock/Supabase parity and testing constraints are explicit.
- Major ambiguity resolved: this is a hardening/contract story on an existing Meeting Engine, not a greenfield meeting module.
- No unresolved clarification required before `dev-story`.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-06-02T17:29:58+07:00 - Red phase: targeted tests failed for date-only meeting timestamp validation, multi-project `projectIds` dedupe/validation, `createMeetingAction` projectIds guard, and missing meeting RLS helper/migration.
- 2026-06-02T17:33:39+07:00 - Green phase targeted tests passed for meeting service/actions/access-scope/repository-version/RLS policy.
- 2026-06-02T17:34:26+07:00 - Expanded targeted tests passed after JSON repository filter and legacy conversion regression coverage.
- 2026-06-02T17:39:34+07:00 - Final focused validation passed after action revalidate cleanup: `npm run test -- tests/unit/meeting-actions.test.ts`, `npm run typecheck`, `npm run lint`.
- 2026-06-02T17:39:50+07:00 - Final full regression suite passed: `npm run test` (82 files, 547 tests).
- 2026-06-02T18:03:04+07:00 - Code review patches targeted validation passed: `npm run test -- tests/unit/meeting-actions.test.ts tests/unit/meeting-service.test.ts tests/unit/access-scope.test.ts tests/unit/meeting-rls-policy.test.ts` (34 tests).
- 2026-06-02T18:03:24+07:00 - Code review patch gates passed: `npm run typecheck`, `npm run lint`, `npm run test` (82 files, 549 tests).

### Completion Notes List

- Verified the existing meeting type/status constants and Meeting DTO contract, then tightened meeting timestamp validation so `meetingDate`/`endTime` require ISO timestamp values while due dates remain date-only.
- Hardened `createMeeting` to validate every `projectId` in single and multi-project scope, dedupe `projectIds`, preserve organization-only empty scope, and keep MVP defaults for host, AI summary draft, arrays, audit log, and room placeholder.
- Added Server Action and scoped-resource guards for multi-project create and organization-only create, while preserving `createDecisionAction` delegation to the official Epic 4 decision record service.
- Added meeting RLS helper functions, a `project_ids` GIN index, updated meeting SELECT/INSERT policies, and SQL policy tests for `project_ids` plus organization-only behavior.
- Preserved legacy one-task decision conversion behavior and added a clear Vietnamese domain error for decisions without a single `projectId`.
- Resolved code review findings by enforcing scoped `meeting.create` for project-bound create actions, preserving repeated `projectIds` form entries, rejecting unscoped meeting creates, tightening multi-project legacy conversion, and aligning Meeting RLS with assignment-scope helpers.

### File List

- `_bmad-output/implementation-artifacts/6-1-meeting-engine-types-scope-va-repository-contract.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `database/migrations/202606020003_harden_meeting_scope_rls.sql`
- `database/policies/001_mvp_rls.sql`
- `src/lib/permissions/scoped-resources.ts`
- `src/modules/meetings/actions.ts`
- `src/modules/meetings/services/meeting-service.ts`
- `src/modules/meetings/validation.ts`
- `tests/unit/access-scope.test.ts`
- `tests/unit/meeting-actions.test.ts`
- `tests/unit/meeting-rls-policy.test.ts`
- `tests/unit/meeting-service.test.ts`

### Change Log

- 2026-06-02: Implemented Story 6.1 Meeting Engine contract hardening, scope/repository/RLS parity, compatibility coverage, and validation gates. Status moved to `review`.
- 2026-06-02: Applied code review patches, reran full validation, and moved Story 6.1 to `done`.
