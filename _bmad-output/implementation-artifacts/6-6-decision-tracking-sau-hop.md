# Story 6.6: Decision Tracking Sau Họp

Status: done

Generated: 2026-06-03

Requirements Covered: FR-079, FR-116, FR-117, NFR-006, UX-DR15

Completion Note: Ultimate context engine analysis completed - comprehensive developer guide created.

## Story

As a lãnh đạo hoặc host cuộc họp,
I want cuộc họp liên kết với official decisions và trạng thái thực hiện sau họp,
so that quyết định sau họp được theo dõi trong Decision & Assignment Center mà không tạo mô hình decision thứ hai.

## Acceptance Criteria

1. Given user đọc được meeting trong scope, when mở meeting detail, then hệ thống hiển thị tất cả official decisions liên quan tới meeting, gồm decisions có `sourceType: "meeting"`/`meetingId` hoặc decisions được link qua `relatedRecords` type `decision`, đã lọc quyền trước khi render và không dùng raw `Meeting.decisions` placeholder làm nguồn chính.
2. Given user có `decision.create` trong scope meeting, when tạo decision từ meeting, then service dùng `createDecisionRecord`/official `Decision` contract với `sourceType: "meeting"`, `sourceId/meetingId`, scope kế thừa từ meeting, linked source an toàn, audit `decision.created`, và meeting detail/Decision Center/Command Center được revalidate.
3. Given user có `meeting.update` và đọc được decision, when link existing decision vào meeting, then hệ thống merge relation `{ type: "decision", relationType: "context" }` vào `relatedRecords`/`relatedDecisions` không trùng lặp, ghi audit `meeting.decision_tracking_updated` với safe summary, và không mutate source/lifecycle của decision đó.
4. Given meeting hoặc decision là multi-project/organization-level, when tạo hoặc link decision, then service không yêu cầu một `projectId` duy nhất; nếu cần tạo assignment/task từ decision sau đó, project target phải explicit theo contract Story 4.2.
5. Given decision sau họp có assignments/tasks, when meeting detail render tracking panel, then UI hiển thị status decision, priority, owner, due date, assignment count, execution/task status, overdue/due-soon signal và task link chỉ khi task nằm trong scope; task ngoài scope chỉ hiển thị neutral state không leak title.
6. Given decision có versions/audit history, when panel hiển thị timeline, then timeline dùng safe history DTO hoặc `DecisionHistoryTimeline` pattern, có actor/time/action/reason/field summary, không render raw decision body, proposal finance payload, meeting transcript/minutes, raw AI output hoặc audit old/new JSON nhạy cảm.
7. Given user thiếu quyền create/link/update, when mở panel hoặc gọi Server Action trực tiếp, then action bị chặn server-side trước write, UI không hiển thị action không được phép, và lỗi tiếng Việt không leak title/nội dung/scope của record bị cấm.
8. Given repository mode là JSON hoặc Supabase, when decision tracking data được đọc/ghi, then implementation reuse existing `decisions`, `decision_assignments`, `decision_versions`, task linked entity fields và meeting `related_records`; không thêm migration/model mới trừ khi phát hiện thiếu field thật và migration phải additive/parity.

## Tasks / Subtasks

- [x] Tạo DTO/service đọc decision tracking cho meeting detail (AC: 1, 5, 6, 7)
  - [x] Thêm service nhỏ, ví dụ `src/modules/meetings/services/meeting-decision-tracking-service.ts`, hoặc helper rõ ràng cạnh meeting service nếu repo muốn giữ trong module hiện tại.
  - [x] Input nhận `PermissionUser` + scoped `meeting` hoặc `meetingId`; service phải gọi `getScopedMeeting`/`listScopedDecisions`/`getScopedDecision` trước khi trả DTO.
  - [x] Gom decisions từ hai nguồn: direct source (`meetingId` hoặc `sourceType/sourceId === meeting.id`) và linked records (`meeting.relatedRecords`/`relatedDecisions` type `decision`); dedupe theo id.
  - [x] Không dùng `Meeting.decisions` JSONB placeholder làm nguồn chính; chỉ giữ legacy list nếu cần hiển thị backward-compatible với nhãn rõ hoặc bỏ qua nếu official decisions đã có.
  - [x] Load assignments qua `repository.listDecisionAssignments({ decisionId })`, versions qua `repository.listDecisionVersions(decisionId)`, audit qua `listAuditLogs({ entityType: "decision", entityId })` khi user có quyền audit.
  - [x] Join task execution bằng scoped tasks (`getScopedTask` hoặc `listScopedTasks`), không bằng raw task repository; task ngoài scope không có title/href.
  - [x] Trả DTO compact như `MeetingDecisionTrackingData`/`MeetingDecisionTrackingItem` đã sanitize: decision summary, source relation, assignments, visible task links, history summaries, permissions.

- [x] Thêm mutation link existing decision vào meeting (AC: 3, 4, 7, 8)
  - [x] Thêm validation schema cho link decision: `decisionId` bắt buộc, optional relation label/reason nếu cần; giữ id bounded như related record schemas hiện có.
  - [x] Thêm service mutation như `linkMeetingDecisionTracking(meetingId, input, actorId, repository)` hoặc tên tương đương.
  - [x] Action gọi `getWritableScopedMeeting(currentUser, meetingId)` và `getScopedDecision(currentUser, decisionId)` trước write; permission UI không được là guard duy nhất.
  - [x] Validate scope compatibility tối thiểu: actor đọc được cả hai record; nếu meeting có projectIds cụ thể, decision project scope phải intersect hoặc decision source/link phải được business-allowed. Không link unrelated record chỉ vì user gửi id.
  - [x] Merge server-side vào `relatedRecords` và `relatedTasks/relatedApprovals` hiện có mà không phụ thuộc client-controlled `__visible` fields.
  - [x] Reject duplicate link trước write; không ghi audit giả.
  - [x] Append meeting audit entry `meeting.decision_tracking_updated` với actor/time/decisionId/relation count; không log raw decision content.
  - [x] Revalidate `/meetings`, `/meetings/{id}`, `/executive/decision-log`, `/executive/decisions`, `/command-center`, và project routes liên quan.

- [x] Nâng cấp create decision từ meeting để dùng đúng official contract và action-state (AC: 2, 4, 7)
  - [x] Giữ `createDecisionRecord` trong `src/modules/executive/services/decision-record-service.ts` là đường tạo official decision; không quay lại legacy `createDecision` trừ regression tests cho one-task conversion.
  - [x] Cập nhật `createDecisionAction` hoặc thay bằng state action trong `src/modules/meetings/actions.ts` để parse FormData/Zod, trả inline error như các panel 6.4/6.5, và không throw raw lỗi trên UI.
  - [x] Không chặn tạo decision chỉ vì `meeting.projectId` rỗng; org-level/multi-project meetings phải tạo được decision nếu meeting scope hợp lệ và actor có `decision.create`.
  - [x] Khi create thành công, ensure decision có `meetingId`, `sourceType: "meeting"`, `sourceId: meeting.id`, linked source `{ type: "meeting", relationType: "source" }`, scope từ meeting, audit `decision.created` qua existing service.
  - [x] Nếu create action cũng thêm related record vào meeting, merge server-side và audit meeting tracking; nếu không, DTO vẫn phải tìm được direct source decision qua `meetingId/sourceId`.
  - [x] Revalidate Decision Center/Command Center cùng meeting/project routes.

- [x] Build/replace meeting detail decision tracking panel (AC: 1, 5, 6, 7)
  - [x] Thêm component như `MeetingDecisionTrackingPanel` trong `src/modules/meetings/components/meeting-detail-panels.tsx` hoặc file sibling nếu component lớn.
  - [x] `src/app/(dashboard)/meetings/[meetingId]/page.tsx` chỉ load scoped DTO, bind actions và truyền permissions; không tự join raw assignments/tasks/audit trong JSX.
  - [x] Replace lightweight `DecisionList` section hoặc keep it only as legacy fallback; panel mới phải show official decision + assignment execution status.
  - [x] Reuse `DecisionStatusBadge`, `TaskPriorityBadge` và `DecisionHistoryTimeline`/redaction pattern từ Epic 4 where practical.
  - [x] Panel hiển thị direct-source vs linked-context decisions rõ nhưng gọn; có link sang `/executive/decisions` hoặc command-center selected decision nếu user có quyền.
  - [x] Form tạo decision từ meeting và form/link existing decision chỉ hiển thị khi đủ quyền; validation fail giữ input.
  - [x] Assignment rows hiển thị assignee/project/deadline/KPI/status/task status; task title/href chỉ khi scoped.
  - [x] Mobile stack ổn định, text tiếng Việt wrap trong container, không card lồng card, không horizontal page overflow.

- [x] Giữ repository/parity và không tạo mô hình mới (AC: 1, 3, 8)
  - [x] Reuse existing fields: `Decision.meetingId`, `sourceType/sourceId`, `linkedRecords`, `DecisionAssignment`, `DecisionVersion`, task `linkedEntityType/id`, meeting `relatedRecords/relatedDecisions/auditLog`.
  - [x] Không thêm `meeting_decisions` table, không tạo executive decision tracker riêng, không dùng `Decision.taskId` legacy để biểu diễn multi-assignment.
  - [x] Nếu Supabase/JSON mapping phải đổi, update cả `JsonMeetingRepository` và `SupabaseMeetingRepository` plus tests. Add migration only if a real missing column is discovered.
  - [x] Do not fix broad deferred issues in this story unless directly necessary: client-controlled related `__visible` removal, Supabase `.or()` hardening, or broad optimistic locking can be referenced as residual risks.

- [x] Tests bắt buộc (AC: 1-8)
  - [x] `tests/unit/meeting-decision-tracking-service.test.ts` hoặc equivalent: direct meeting-source decision + linked decision được dedupe, out-of-scope decision không leak, assignments/tasks/history được sanitize.
  - [x] `tests/unit/meeting-actions.test.ts`: create decision from project, multi-project và organization-level meetings; link existing decision; permission/scope fail no partial write; duplicate link rejected; route revalidation includes meeting, Decision Center and Command Center.
  - [x] `tests/unit/meeting-detail-panels.test.tsx`: panel list/empty/error states, create/link form gating, assignment execution status, hidden task neutral state, audit/history redaction visible.
  - [x] `tests/unit/decision-assignment-center-service.test.ts` only if shared DTO/helper is extended for meeting-source filtering.
  - [x] `tests/unit/meeting-service.test.ts`: repository mapper parity if `relatedRecords`, decision filters, assignments or versions mapping changes.
  - [x] Run `npm run typecheck`, `npm run lint`, `npm run test`.
  - [x] Run targeted or full `npm run test:e2e` because meeting detail UI changes route-visible behavior; at minimum cover `/meetings/{id}` desktop/mobile no overflow and decision tracking panel visible for scoped leadership user.

### Review Findings

- [x] [Review][Patch] Decision body is serialized into the client DTO even though the panel does not render it [src/modules/meetings/services/meeting-decision-tracking-service.ts:331] — patched
- [x] [Review][Patch] Decision tracking is missing the required due-soon signal for open assignments [src/modules/meetings/services/meeting-decision-tracking-service.ts:42] — patched
- [x] [Review][Patch] Decision create/link controls are gated by role-level permission instead of meeting-scope permission [src/modules/meetings/services/meeting-decision-tracking-service.ts:403] — patched
- [x] [Review][Patch] Linked existing decision scope compatibility allows unrelated sparse-scope records [src/modules/meetings/actions.ts:543] — patched
- [x] [Review][Patch] Decision tracking items do not deep-link to the official Decision & Assignment Center [src/modules/meetings/components/meeting-detail-panels.tsx:648] — patched
- [x] [Review][Patch] Overdue assignment counts derive today's date from UTC ISO text instead of local/business date [src/modules/meetings/services/meeting-decision-tracking-service.ts:143] — patched
- [x] [Review][Patch] Required meeting-detail E2E and service-level link mutation coverage is missing [tests/unit/meeting-actions.test.ts:217] — patched
- [x] [Review][Defer] Partial meeting update actions can wipe omitted mutable fields [src/modules/meetings/actions.ts:501] — deferred, pre-existing
- [x] [Review][Defer] Related-record removal still depends on client-controlled `__visible` metadata [src/modules/meetings/services/meeting-service.ts:170] — deferred, pre-existing
- [x] [Review][Defer] Attachment input accepts both `documentId` and external `url`, creating contradictory source semantics [src/modules/meetings/validation.ts:353] — deferred, pre-existing
- [x] [Review][Defer] Follow-up task creation can race and orphan duplicate tasks [src/modules/meetings/services/meeting-service.ts:1041] — deferred, pre-existing
- [x] [Review][Defer] Meeting minutes/AI approval flows lack content-version preconditions for concurrent edits [src/modules/meetings/services/meeting-service.ts:864] — deferred, pre-existing
- [x] [Review][Defer] Generic meeting action error state can expose raw service/repository exception messages [src/modules/meetings/actions.ts:176] — deferred, pre-existing

## Dev Notes

### Current Implementation Snapshot

- `src/modules/meetings/types.ts` already has official `Decision`, `DecisionAssignment`, `DecisionVersion`, `DecisionLinkedRecord`, meeting `relatedRecords`, `relatedTasks`, `followUpActions`, and legacy `MeetingDecisionTracking[]`.
- `src/modules/executive/services/decision-record-service.ts` already implements `createDecisionRecord` and `updateDecisionRecord` with scoped source resolution, source/linked-record validation, versioning, safe audit and rollback/transaction support.
- `src/modules/executive/services/decision-assignment-service.ts` already creates multiple assignment records and linked tasks from official decisions; it requires explicit project target for multi-project/org-level decisions.
- `src/modules/executive/services/decision-assignment-center-service.ts` already builds sanitized Decision & Assignment Center data with assignments, task links, versions, audit summaries and guarded linked-source hrefs. Reuse its ideas/helpers instead of reimplementing unsafe joins.
- `src/modules/meetings/actions.ts` currently has `createDecisionAction(meetingId, formData)` that calls `createDecisionRecord`, but it is not action-state based and current meeting detail only shows the form when `canCreateDecision && meeting.projectId`.
- `src/app/(dashboard)/meetings/[meetingId]/page.tsx` currently loads `listScopedDecisions(currentUser, { meetingId })`, renders `DecisionList`, and does not show `DecisionAssignment` execution/task status for those decisions.
- `src/modules/meetings/components/decision-list.tsx` is a lightweight list with legacy one-task conversion via `convertDecisionToTaskAction`; it is not enough for official multi-assignment decision tracking.
- `src/modules/meetings/components/meeting-detail-panels.tsx` already contains minutes, attachments, AI summary and follow-up panels using `useActionState`; decision tracking should follow this panel/action-state pattern.
- Meeting edit/create can link `relatedDecisions`, but the generic related-record update path has a deferred risk around client-controlled visible fields. A dedicated server-side link mutation is safer for Story 6.6.

### Architecture And Boundary Rules

- One Meeting Engine only. Do not create separate meeting-decision modules or duplicate tracking tables.
- Official decisions live in the existing `Decision` repository/contract; meeting detail is a scoped view over that contract.
- Server Actions enforce permissions before write. UI hiding is only UX.
- Cross-module flow goes through service contracts: meeting actions/services call executive decision services or meeting repository methods, not direct Supabase or raw task/assignment repositories from components.
- Audit payloads must be compact and safe: ids, counts, status transitions, actor/time. Do not store raw minutes, transcript, raw AI output, proposal finance payload or full decision body in meeting audit.
- JSON/mock and Supabase mode must remain contract-equivalent if persistence mapping changes.
- No new libraries or stack upgrades. Current stack: Next.js 15.3.2, React 19.0.0, TypeScript 5.8.3, Zod 3.24.4, Supabase JS 2.49.4, Vitest 3.1.3.

### Previous Story Intelligence

- Story 6.5 explicitly left official decision tracking after meeting to Story 6.6. Do not fold follow-up action logic into official decisions or vice versa.
- Story 6.5 added safe follow-up task links and hidden-task neutral state; reuse that pattern for decision assignment tasks.
- Story 6.4 added action-state detail panels and safe scoped attachment/document rendering; decision tracking panel should follow the same route-page-thin pattern.
- Story 6.3 added related records but left a deferred risk that client-controlled visible related ids can remove out-of-scope links. Story 6.6 link mutation should merge server-side and avoid that path.
- Story 4.1-4.4 already built official decisions, multi-assignment, version/history and Decision & Assignment Center UI. Story 6.6 should integrate meeting detail with those contracts, not rebuild them.
- Story 4.2 learned that organization/multi-project decisions need explicit assignment target project. Preserve this rule.
- Story 4.3 learned update + version + audit consistency needs transactional/rollback behavior. If Story 6.6 adds a combined create/link mutation, do not pretend it is atomic unless the repository actually guarantees it.

### UX Requirements

- Vietnamese-first labels and errors.
- Decision tracking panel should be dense and operational: summary, status badges, assignment/task status, timeline teaser, links/actions by permission.
- Badge/status text must include words, not color only.
- Show no-access/empty states without leaking hidden decision/task/source titles.
- Avoid nested cards. Existing meeting detail uses bordered panels; keep the new panel consistent and compact.
- Mobile layout must stack cleanly; long Vietnamese decision titles/KPI/reasons wrap within the container.
- Full Decision & Assignment Center remains the rich workspace; meeting detail should expose enough tracking context and deep links without overbuilding a second center.

### Out Of Scope

- Replacing the Decision & Assignment Center or duplicating its full filter/table/detail UI.
- Implementing assignment update/acknowledgement lifecycle beyond existing Story 4.2 contracts.
- Replacing legacy `convertDecisionToTask` one-task flow; keep regression coverage but do not use it for official multi-assignment tracking.
- Broad optimistic locking or Supabase RPC rewrite unless needed for this story's own combined mutation.
- Fixing all deferred related-record/Supabase `.or()` hardening items unless directly touched.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-6-one-meeting-engine-cho-iu-hnh.md`]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]
- [Source: `_bmad-output/project-context.md`]
- [Source: `docs/context/meetings.md`]
- [Source: `docs/context/decision-assignment.md`]
- [Source: `docs/context/tasks.md`]
- [Source: `docs/context/permissions-audit.md`]
- [Source: `docs/context/testing.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]
- [Source: `_bmad-output/implementation-artifacts/4-1-decision-record-tu-approval-meeting-hoac-doc-lap.md`]
- [Source: `_bmad-output/implementation-artifacts/4-2-assignment-task-tu-decision-cho-nhieu-nguoi.md`]
- [Source: `_bmad-output/implementation-artifacts/4-3-version-history-khi-sua-decision-quan-trong.md`]
- [Source: `_bmad-output/implementation-artifacts/4-4-decision-assignment-center-ui.md`]
- [Source: `_bmad-output/implementation-artifacts/6-4-minutes-attachments-va-ai-summary-draft.md`]
- [Source: `_bmad-output/implementation-artifacts/6-5-follow-up-actions-lien-ket-related-tasks.md`]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md`]
- [Source: `src/modules/meetings/types.ts`]
- [Source: `src/modules/meetings/validation.ts`]
- [Source: `src/modules/meetings/actions.ts`]
- [Source: `src/modules/meetings/services/meeting-service.ts`]
- [Source: `src/modules/meetings/services/meeting-repository.ts`]
- [Source: `src/modules/meetings/components/decision-list.tsx`]
- [Source: `src/modules/meetings/components/decision-form.tsx`]
- [Source: `src/modules/meetings/components/meeting-detail-panels.tsx`]
- [Source: `src/app/(dashboard)/meetings/[meetingId]/page.tsx`]
- [Source: `src/modules/executive/services/decision-record-service.ts`]
- [Source: `src/modules/executive/services/decision-assignment-service.ts`]
- [Source: `src/modules/executive/services/decision-assignment-center-service.ts`]
- [Source: `src/modules/executive/actions.ts`]
- [Source: `tests/unit/meeting-service.test.ts`]
- [Source: `tests/unit/meeting-actions.test.ts`]
- [Source: `tests/unit/meeting-detail-panels.test.tsx`]
- [Source: `tests/unit/decision-assignment-center-service.test.ts`]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm test -- tests/unit/meeting-decision-tracking-service.test.ts tests/unit/meeting-actions.test.ts tests/unit/meeting-detail-panels.test.tsx tests/unit/meeting-service.test.ts` - PASS, 73 tests.
- `npm run typecheck` - PASS.
- `npm run lint` - PASS.
- `npx playwright test tests/e2e/mvp-smoke.spec.ts -g "meeting detail renders decision tracking"` - PASS, 1 test.
- `npm test` - PASS, 86 test files / 622 tests.
- `npx playwright test tests/e2e/mvp-smoke.spec.ts -g "leadership executive dashboard renders DTO sections|leadership executive dashboard has mobile compact layout|leadership morning briefing renders scoped summary sections|leadership morning briefing has mobile compact layout|leadership executive common center renders scoped sections|executive workspace views fit responsive QA viewports"` - PASS, 6 tests after aligning Command Center risk-region smoke expectations with current risk section accessible names.
- `npm run test:e2e` - PASS, 61/61 tests.

### Completion Notes List

- Added `getMeetingDecisionTrackingData` to build scoped official meeting decision DTOs from direct meeting source decisions plus linked `relatedRecords` decisions, with assignment/task/history sanitization and permission flags.
- Added server-side link mutation and action-state flows for creating meeting-source decisions and linking existing decisions, including scoped guards, scope compatibility checks, duplicate prevention, safe meeting audit, and revalidation for meeting/Decision Center/Command Center/project routes.
- Replaced the legacy meeting detail decision list/form surface with `MeetingDecisionTrackingPanel`, showing official decision status, priority, assignment execution state, hidden-task neutral state, sanitized history, and gated create/link forms.
- Kept persistence on existing `Decision`, `DecisionAssignment`, `DecisionVersion`, task linked entity fields, and meeting `relatedRecords`; no new decision model/table or migration was added.
- Applied code-review patches: removed raw decision body from the tracking DTO, added due-soon and local business-day overdue counts, added Decision Center deep links, tightened sparse-scope link compatibility, scoped mutation-control permissions, and added service/action/component/E2E coverage.
- Resolved the remaining Command Center risk-region smoke failures by matching the current Vietnamese-first risk section accessible names; full E2E is now green.

### File List

- `src/modules/meetings/services/meeting-decision-tracking-service.ts`
- `src/modules/meetings/types.ts`
- `src/modules/meetings/validation.ts`
- `src/modules/meetings/services/meeting-service.ts`
- `src/modules/meetings/actions.ts`
- `src/modules/meetings/components/meeting-detail-panels.tsx`
- `src/app/(dashboard)/meetings/[meetingId]/page.tsx`
- `tests/unit/meeting-decision-tracking-service.test.ts`
- `tests/unit/meeting-actions.test.ts`
- `tests/unit/meeting-detail-panels.test.tsx`
- `tests/unit/meeting-service.test.ts`
- `tests/e2e/mvp-smoke.spec.ts`
- `_bmad-output/implementation-artifacts/6-6-decision-tracking-sau-hop.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-06-03: Story created and marked ready-for-dev.
- 2026-06-03: Implemented official meeting decision tracking DTO, link/create actions, meeting detail panel, and focused tests; moved story to review.
- 2026-06-03: Applied all code-review patch findings, reran validation, and moved story to done.

### Checklist Validation Notes

- Reinvention prevention: story explicitly reuses official `Decision`, `DecisionAssignment`, `DecisionVersion`, existing executive services/actions, and Decision Center DTO patterns.
- Wrong-file prevention: story identifies concrete update targets in `src/modules/meetings`, `src/modules/executive`, meeting detail route and unit tests.
- Permission prevention: every read/write path requires scoped loaders and server-side permission checks before serialization or write.
- Regression prevention: legacy meeting `DecisionList`/`convertDecisionToTask` is preserved only as backward-compatible one-task flow, not as the official tracking model.
- Data-safety prevention: history/audit/task links must be sanitized and hidden records must not leak titles.
- No unresolved clarification required before dev-story.
