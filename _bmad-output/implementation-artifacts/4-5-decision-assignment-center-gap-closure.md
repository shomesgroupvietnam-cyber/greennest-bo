# Story 4.5: Decision & Assignment Center Gap Closure

Status: review

Generated: 2026-06-07

Requirements Covered: FR-044, FR-045, FR-046, FR-047, FR-048, FR-050, FR-051, FR-079, FR-116, NFR-001, NFR-005, NFR-006, UX-DR15

Completion Note: Ultimate context engine analysis completed - comprehensive developer guide created.

## Story

As a lanh dao,
I want Decision & Assignment Center co entry point tao decision sau approval, cho phep sua noi dung chi dao co version reason, va quan ly lifecycle assignment/task trong Center,
so that quyet dinh chinh thuc khong chi duoc ghi nhan ma con duoc giao viec, cap nhat va theo doi thuc hien tron ven trong mot workflow van hanh.

## Acceptance Criteria

1. **Tao decision sau approval tu approval detail**
   - Given user doc duoc approval/proposal detail trong scope va co quyen `decision.create` trong scope cua approval
   - When user mo approval detail
   - Then UI hien thi entry point "Tao quyet dinh" phu hop voi trang thai/quyen, khong tron voi action phe duyet request.
   - When user submit decision tu approval detail
   - Then system goi official decision service/action voi `sourceType: "approval"`, `sourceId` la proposal/approval id, scope ke thua tu approval, linked source an toan, audit `decision.created`, va revalidate approval detail, Decision Center, Command Center va project route lien quan.
   - And tao decision tu approval khong tu dong approve/reject/forward proposal, khong mutate approval history ngoai link/audit can thiet, va khong copy raw finance payload vao decision/audit.

2. **Decision Center sua duoc noi dung chi dao co version reason**
   - Given user co quyen cap nhat decision trong scope
   - When user mo selected decision trong Decision & Assignment Center
   - Then update form cho phep sua `decisionText`/noi dung chi dao, `title`, `ownerId`, `dueDate`, `priority`, `status`, `kpi` va `reason`.
   - When user sua `decisionText` hoac field quan trong va submit reason
   - Then system goi `updateDecisionRecordAction`/`updateDecisionRecord`, tao `DecisionVersion` voi changed fields, previous/new values da sanitize, actor, timestamp va reason; timeline hien thi version moi sau revalidate.
   - And UI khong hien raw previous/new `decisionText` trong timeline; chi hien field summary/redacted value theo pattern `DecisionHistoryTimeline`.

3. **Lifecycle assignment/task trong Center**
   - Given selected decision co assignments/tasks trong scope
   - When user co quyen phu hop mo Decision Center
   - Then UI hien thi action lifecycle toi thieu cho assignment/task: chuyen sang dang xu ly, hoan thanh, huy/bo giao, va mo/cap nhat linked task khi task nam trong scope.
   - When user cap nhat assignment lifecycle
   - Then service cap nhat `DecisionAssignment.status` va linked `Task.status` theo mapping ro rang, ghi audit summary an toan, revalidate Decision Center, task/project routes va cac surface lien quan.
   - And direct Server Action call phai bi chan neu user khong co quyen hoac assignment/task ngoai scope; UI disabled state khong phai security gate.

4. **Batch/multi-assignment UX khong lam mat service capability**
   - Given service da ho tro `assignmentsJson` batch
   - When user giao viec trong Center
   - Then UI cho phep them nhieu assignment trong mot submit hoac co flow lap nhieu item ro rang, khong chi phu thuoc vao mot form single-item kho dung.
   - And moi assignment co project target, assignee type/user/department/project, deadline, priority, KPI/description; multi-project/org-level decision bat buoc project target explicit nhu Story 4.2.

5. **Permission, scope va data safety**
   - Given user thieu quyen view/create/update/assign/task update trong scope
   - When user mo UI hoac goi action truc tiep
   - Then service/action tra loi domain error tieng Viet, khong ghi repository/audit success, khong leak title/noi dung/source cua record bi cam.
   - And approval source, linked task, assignment va decision deu duoc doc qua scoped helpers/service DTO truoc khi render hoac mutate.

6. **Regression va responsive**
   - Given existing `/command-center?view=executive-decision-log`, `/executive/decisions`, approval detail, meeting decision tracking va legacy meeting decision action item
   - When story duoc implement
   - Then cac route/view cu van hoat dong, meeting decision tracking khong bi doi semantics, legacy `Decision.taskId` one-task conversion van regression pass.
   - And mobile viewport khong horizontal overflow; Vietnamese labels/long IDs/KPI/reason wrap trong container.

## Tasks / Subtasks

- [x] Them approval-to-decision entry point (AC: 1, 5, 6)
  - [x] Xac dinh vi tri UI trong `src/modules/executive/components/approval-request-detail.tsx` hoac component sibling moi, gan canh `ApprovalActionPanel` nhung label ro "Tao quyet dinh" de phan biet voi approve/reject request.
  - [x] Khong them action key vao approval workflow neu khong can; tao panel/form rieng co permission gate dua tren DTO permission moi nhu `canCreateDecisionFromApproval`.
  - [x] Mo rong `ApprovalCenterDetailData`/service `getApprovalCenterDetailData` neu can de tra `decisionEntryPoint` da server-filtered: source id, title goi y, scope, projectId, selectedScopeId, permissions.
  - [x] Form submit qua existing `createDecisionRecordAction` hoac state action wrapper, voi hidden `sourceType="approval"`, `sourceId`, optional `projectId/projectIds`, title/content/owner/priority/dueDate/kpi.
  - [x] Sau create thanh cong, hien success state va link sang Decision Center selected decision neu co id; revalidate `/approvals/proposal/{id}`, `/command-center`, `/executive/decision-log`, `/executive/decisions`, project route lien quan.
  - [x] Khong mutate proposal status/step/history. Neu can audit link, audit payload chi chua source id/type, decision id, actor/time, khong co raw amount/finance payload.

- [x] Nang cap update decision trong Center de sua noi dung chi dao (AC: 2, 5, 6)
  - [x] Cap nhat `src/modules/executive/components/decision-assignment-center.tsx` update form de co textarea cho `decisionText`/noi dung chi dao va input title neu can.
  - [x] Require hoac khuyen khich `reason` khi sua `decisionText`, `dueDate`, `ownerId`, `priority`, `status`, `kpi` hoac scope; neu business khong bat buoc reason thi UI van phai hien ro field reason.
  - [x] Dung `updateDecisionRecordStateAction`/`updateDecisionRecordAction`; khong tao action/repository rieng cho decision update.
  - [x] Sau update, preserve selected decision query param va refresh timeline/version trong Center.
  - [x] Component tests phai assert `decisionText` submit duoc va timeline khong render raw previous/new body.

- [x] Them lifecycle service/action cho decision assignment (AC: 3, 5)
  - [x] Kiem tra existing `MeetingRepository` da co update method cho `decision_assignments` chua. Neu chua, them method toi thieu, update ca JSON va Supabase mapping/RLS parity neu can.
  - [x] Tao service trong `src/modules/executive/services`, vi du `updateDecisionAssignmentLifecycle`, nhan actor + assignment id + next status + optional task status/reason.
  - [x] Load assignment theo repository, load decision qua `getScopedDecision`, load linked task qua scoped task helper/service truoc khi mutate.
  - [x] Permission: actor phai co scoped decision write/assignment permission va quyen task update trong target project neu sync task status. Neu chua co permission key `decision.assign`, dung permission hien co theo Story 4.2 (`decision.create` + task permission) va document ro; khong invent key moi neu khong update catalog/seeds/tests.
  - [x] Define mapping toi thieu:
    - `assigned` -> task co the giu `todo`.
    - `in_progress` -> linked task `in_progress` neu task visible/writable.
    - `done` -> linked task `done`.
    - `cancelled` -> linked task cancel/archival behavior theo existing task statuses; neu task khong co `cancelled`, giu task status va audit reason, khong invent status.
  - [x] Audit action de xuat `decision.assignment_lifecycle_updated` voi safe summary: decisionId, assignmentId, taskId, previous/next assignment status, previous/next task status, projectId, reasonProvided.
  - [x] Rollback/transaction: neu assignment update thanh cong nhung task/audit fail trong JSON mode, compensate best-effort hoac dung repository transactional method neu co. Supabase path can parity/RLS.

- [x] Build lifecycle UI trong Center (AC: 3, 4, 6)
  - [x] Trong assignment list/detail, them controls ro rang cho status lifecycle bang buttons/select/menu co icon lucide neu phu hop; khong lam UI roi mat hoac nested cards.
  - [x] Neu task nam ngoai scope, hien neutral text "Cong viec bi gioi han quyen" va khong render task action/href.
  - [x] Batch assignment UX: cho phep them/xoa nhieu draft assignment rows truoc submit, hoac tao dialog/list editor toi thieu; fallback single item van duoc nhung khong duoc lam mat service batch path.
  - [x] Form states can co pending/success/error tieng Viet; validation fail giu input.
  - [x] Long Vietnamese text, IDs, KPI va reason phai wrap tren mobile; khong horizontal page overflow.

- [x] Revalidate va link surfaces (AC: 1, 2, 3, 6)
  - [x] Decision create/update/assignment lifecycle phai revalidate `/command-center`, `/executive/decision-log`, `/executive/decisions`, relevant approval detail, meeting detail neu `meetingId`, task/project routes.
  - [x] Deep link tu approval detail sau create sang `/command-center?view=executive-decision-log&decisionId={id}` va preserve `scopeId` neu co.
  - [x] Meeting decision tracking sau Story 6.6 van deep-link va hien execution status dung; neu lifecycle service thay doi DTO, cap nhat tests lien quan.

- [x] Tests bat buoc (AC: 1-6)
  - [x] `tests/unit/approval-request-detail.test.tsx`: render entry point tao decision sau approval khi co quyen; khong render khi khong co quyen; form hidden source fields dung; financial payload khong leak.
  - [x] `tests/unit/approval-center-detail-service.test.ts`: DTO permission/source cho decision entry point da scoped; out-of-scope/no permission khong tra raw source.
  - [x] `tests/unit/executive-actions.test.ts`: create decision from approval form data goi service voi `sourceType: "approval"`, revalidate approval/Decision Center/Command Center/project routes.
  - [x] `tests/unit/decision-record-service.test.ts`: regression create source-linked approval decision va update `decisionText` tao version reason.
  - [x] `tests/unit/decision-assignment-lifecycle-service.test.ts` hoac file tuong duong: status transitions, permission denied, out-of-scope task hidden, audit safety, rollback/partial write.
  - [x] `tests/unit/decision-assignment-center.test.tsx`: update decision body form, assignment lifecycle controls, batch assignment draft rows, error/success states.
  - [x] `tests/unit/decision-assignment-center-service.test.ts`: selected detail neu lifecycle DTO fields thay doi; no raw audit/source leak.
  - [x] Regression: `tests/unit/meeting-decision-tracking-service.test.ts`, `tests/unit/meeting-detail-panels.test.tsx`, `tests/unit/meeting-service.test.ts` neu task/assignment status DTO thay doi.
  - [x] E2E targeted: approval detail -> create decision entry visible; Decision Center mobile no overflow; assignment lifecycle action visible/executable in seeded/mock path neu feasible.
  - [x] Run `npm run typecheck`, `npm run lint`, `npm run test`; run targeted/full `npm run test:e2e` vi story thay doi route-visible UI/forms.

## Dev Notes

### Current Implementation Snapshot

- `src/modules/executive/services/decision-record-service.ts` already supports official decision creation for `independent`, `meeting`, `proposal` and `approval` sources through scoped source resolution. Use this path; do not create another decision service.
- `src/modules/executive/actions.ts` already has `createDecisionRecordAction`, `createDecisionRecordStateAction`, `updateDecisionRecordAction`, `updateDecisionRecordStateAction`, `createDecisionAssignmentsAction`, and `createDecisionAssignmentsStateAction`.
- `src/modules/executive/components/decision-assignment-center.tsx` currently exposes create independent decision, single visible assignment form, and update fields for owner/dueDate/priority/status/kpi/reason, but not `decisionText`.
- `src/modules/executive/services/decision-assignment-center-service.ts` already returns scoped/sanitized Center DTO with decisions, assignments, linked tasks, versions and audit summaries.
- `src/modules/meetings/types.ts` contains `Decision`, `DecisionAssignment`, `DecisionVersion`, `DecisionHistoryEvent`, and assignment status union `assigned | in_progress | done | cancelled`.
- `src/modules/proposals/services/approval-center-service.ts` owns approval detail DTO. Approval detail page is `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx` and component is `src/modules/executive/components/approval-request-detail.tsx`.
- `src/modules/executive/components/approval-action-panel.tsx` handles approval workflow actions via `applyApprovalDetailAction`; do not overload it if a separate decision entry panel is clearer.
- Story 6.6 added meeting decision tracking using official decisions, assignments, versions and task execution status. Keep it compatible.

### Architecture Guardrails

- Next.js App Router + Server Actions + service/repository boundary. Components do not call repositories or Supabase directly.
- Permission filtering happens before DTO serialization and before writes. UI hiding/disabled controls are only UX.
- Reuse official `Decision`, `DecisionAssignment`, `DecisionVersion`, task linked entity fields and approval/proposal backbone. Do not add parallel decision, approval or task-like models.
- If adding repository methods for assignment lifecycle, update JSON and Supabase adapters together, plus RLS/policy assets if write contract changes.
- Domain DTOs use camelCase; DB mapping stays in repository adapters.
- Date-only business fields stay `YYYY-MM-DD`.
- Audit payloads must be safe summaries; never dump raw proposal finance amount, meeting minutes/transcript, AI output, raw decision body or raw old/new audit JSON.
- No new library, ORM, tRPC, global store or stack upgrade.

### UX Requirements

- Vietnamese-first labels: "Tạo quyết định", "Nội dung chỉ đạo", "Lý do cập nhật", "Đang xử lý", "Hoàn thành", "Hủy giao việc".
- Approval action and decision action must be visually and semantically distinct: approval duyệt request; decision ban hành chỉ đạo chính thức.
- Keep operational dense layout, compact bordered panels, no landing/hero pattern, no nested cards.
- Use lucide icons for action buttons where helpful; status badges must include text, not color alone.
- Mobile must stack cleanly and preserve readable form controls.

### Previous Story Intelligence

- Story 4.1 established official decision records, source validation, multi-project permission, safe audit and source scope.
- Story 4.2 established child `decision_assignments`, linked tasks, rollback behavior, assignee visibility checks and date-only due dates. Do not use legacy `Decision.taskId` for multi-assignment.
- Story 4.3 established version/history and `DecisionHistoryTimeline`; reuse its redaction/sanitization.
- Story 4.4 built the repository-backed Center and patched selected scope propagation, safe task/source links, action permission gates and form result states.
- Story 6.6 integrated meeting detail with official decisions and decision assignment execution state; do not regress meeting-source decisions or link existing decision behavior.

### Out Of Scope

- Creating a new approval workflow state or changing proposal approval semantics.
- Adding recipient acknowledgement; FR-049 says MVP does not require acknowledgement.
- Replacing the full task module or inventing new task statuses not present in `TASK_STATUSES`.
- Rebuilding the entire Decision Center layout beyond the missing entry points/lifecycle gaps.
- Broad related-record cleanup or deferred meeting concurrency fixes unless directly touched.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-4-decision-assignment-center.md`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]
- [Source: `_bmad-output/project-context.md`]
- [Source: `docs/context/decision-assignment.md`]
- [Source: `docs/context/permissions-audit.md`]
- [Source: `docs/context/meetings.md`]
- [Source: `docs/context/tasks.md`]
- [Source: `docs/context/testing.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`]
- [Source: `_bmad-output/implementation-artifacts/4-1-decision-record-tu-approval-meeting-hoac-doc-lap.md`]
- [Source: `_bmad-output/implementation-artifacts/4-2-assignment-task-tu-decision-cho-nhieu-nguoi.md`]
- [Source: `_bmad-output/implementation-artifacts/4-3-version-history-khi-sua-decision-quan-trong.md`]
- [Source: `_bmad-output/implementation-artifacts/4-4-decision-assignment-center-ui.md`]
- [Source: `_bmad-output/implementation-artifacts/6-6-decision-tracking-sau-hop.md`]
- [Source: `src/modules/executive/services/decision-record-service.ts`]
- [Source: `src/modules/executive/services/decision-assignment-service.ts`]
- [Source: `src/modules/executive/services/decision-assignment-center-service.ts`]
- [Source: `src/modules/executive/actions.ts`]
- [Source: `src/modules/executive/components/decision-assignment-center.tsx`]
- [Source: `src/modules/executive/components/approval-request-detail.tsx`]
- [Source: `src/modules/executive/components/approval-action-panel.tsx`]
- [Source: `src/modules/proposals/services/approval-center-service.ts`]
- [Source: `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx`]
- [Source: `src/modules/meetings/types.ts`]
- [Source: `src/modules/tasks/types.ts`]
- [Source: `tests/unit/decision-record-service.test.ts`]
- [Source: `tests/unit/decision-assignment-service.test.ts`]
- [Source: `tests/unit/decision-assignment-center-service.test.ts`]
- [Source: `tests/unit/decision-assignment-center.test.tsx`]
- [Source: `tests/unit/approval-request-detail.test.tsx`]
- [Source: `tests/unit/approval-center-detail-service.test.ts`]
- [Source: `tests/unit/executive-actions.test.ts`]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-06-07: Added red tests for approval decision entry, Decision Center body edit/batch/lifecycle, executive actions and assignment lifecycle service; targeted suite failed on missing behavior as expected.
- 2026-06-07: `npm run test -- tests/unit/approval-request-detail.test.tsx tests/unit/approval-center-detail-service.test.ts tests/unit/executive-actions.test.ts tests/unit/decision-assignment-center.test.tsx tests/unit/decision-assignment-lifecycle-service.test.ts` passed: 5 files, 48 tests.
- 2026-06-07: `npm run typecheck` passed.
- 2026-06-07: Regression suite passed: decision record/assignment/center service, meeting decision tracking, meeting detail panels, meeting service, approval detail page.
- 2026-06-07: `npm run lint` passed.
- 2026-06-07: `npm run test` passed: 101 files, 743 tests.
- 2026-06-07: `npm run test:e2e` passed: 65 tests.

### Completion Notes List

- Added permission-filtered approval detail decision entry point with hidden `sourceType="approval"`, approval source id/scope/project inheritance and success deep link back to Decision Center.
- Extended approval detail DTO with `canCreateDecisionFromApproval` and `decisionEntryPoint`; create/update actions now revalidate approval detail and decision/command/project routes.
- Added `updateDecisionAssignmentLifecycle` service/action with scoped decision/task loading, assignment/task status mapping, safe audit payload and JSON rollback on task/audit failure.
- Added JSON and Supabase repository update/get support for `decision_assignments`; no new permission key or task status was introduced.
- Upgraded Decision Center UI for decision title/body/reason updates, multi-row batch assignment drafts through `assignmentsJson`, and per-assignment lifecycle controls.

### File List

- `_bmad-output/implementation-artifacts/4-5-decision-assignment-center-gap-closure.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/modules/executive/actions.ts`
- `src/modules/executive/components/approval-decision-entry-panel.tsx`
- `src/modules/executive/components/approval-request-detail.tsx`
- `src/modules/executive/components/decision-assignment-center.tsx`
- `src/modules/executive/services/decision-assignment-lifecycle-service.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/meetings/services/meeting-repository.ts`
- `src/modules/meetings/validation.ts`
- `src/modules/proposals/services/approval-center-service.ts`
- `tests/unit/approval-request-detail.test.tsx`
- `tests/unit/approval-center-detail-service.test.ts`
- `tests/unit/executive-actions.test.ts`
- `tests/unit/decision-assignment-center.test.tsx`
- `tests/unit/decision-assignment-lifecycle-service.test.ts`

### Change Log

- 2026-06-07: Story created and marked ready-for-dev.
- 2026-06-07: Started development.
- 2026-06-07: Implemented story 4.5 and moved to review.

### Checklist Validation Notes

- Story closes the explicit review gaps from Decision & Assignment Center: approval-to-decision entry point, decision body update/version reason, and assignment/task lifecycle inside the Center.
- Story prevents reinvention by requiring reuse of existing official `Decision`, `DecisionAssignment`, `DecisionVersion`, executive actions/services, approval detail DTO and meeting decision tracking contracts.
- Story includes permission, scope, audit safety, repository parity and responsive QA requirements.
- Story clarifies out-of-scope areas to avoid changing approval semantics, recipient acknowledgement or legacy meeting one-task conversion.
