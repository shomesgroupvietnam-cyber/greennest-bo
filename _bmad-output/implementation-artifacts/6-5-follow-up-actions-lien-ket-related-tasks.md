# Story 6.5: Follow-Up Actions Liên Kết Related Tasks

Status: done

Generated: 2026-06-03

Requirements Covered: FR-078, FR-115, NFR-005, NFR-006

Completion Note: Ultimate context engine analysis completed - comprehensive developer guide created.

## Story

As a meeting host hoặc người được giao điều phối sau họp,
I want tạo follow-up actions sau cuộc họp và có thể sinh task liên kết,
so that action items sau họp được theo dõi như công việc thật trong task/dashboard context.

## Acceptance Criteria

1. Given user có quyền `meeting.update` và meeting nằm trong scope, when user tạo hoặc cập nhật trạng thái follow-up action cho meeting ở trạng thái `COMPLETED` hoặc `FOLLOW_UP_PENDING`, then hệ thống lưu `followUpActions` với `id`, `title`, optional `ownerId`, optional `dueDate`, `status`, optional `relatedTaskId`, cập nhật `updatedAt`, append audit actor/time/count/status change an toàn, và từ chối mọi write nếu meeting ngoài scope, thiếu quyền hoặc meeting chưa đến giai đoạn follow-up.
2. Given follow-up action cần được theo dõi như task, when user chọn tạo related task, then mutation validate target project rõ ràng, kiểm tra `task.create` và scoped project trước khi ghi, gọi `createTask` từ task service với `linkedEntityType: "meeting"`, `linkedEntityId: meeting.id`, `createdBy: currentUser.id`, rồi liên kết task mới vào `followUpActions[n].relatedTaskId`, `relatedTasks`, và `relatedRecords` relation `generated_action` mà không làm mất related records có sẵn.
3. Given meeting có đúng một project trong `projectId/projectIds`, when tạo follow-up task mà không gửi `taskProjectId`, then service dùng project đó làm target mặc định; given meeting multi-project hoặc organization-level, when user không chọn target project rõ ràng, then mutation trả lỗi tiếng Việt và không tạo task.
4. Given follow-up action đã có `relatedTaskId`, when user double-submit hoặc cố tạo task lần nữa cho cùng action, then service từ chối trước khi gọi `createTask`, không tạo task trùng, không ghi audit giả, và tests cover sequential duplicate-submit behavior.
5. Given follow-up action có deadline quá hạn và status chưa terminal (`open` hoặc `in_progress`), when executive dashboard, morning briefing, meeting list hoặc meeting detail loads, then item xuất hiện trong overdue/priority context theo quyền; status terminal (`done` hoặc `cancelled`) không còn bị tính quá hạn.
6. Given user không có quyền tạo task nhưng vẫn có quyền update meeting, when user tạo follow-up action không sinh task, then action vẫn được lưu; when user bật tạo task, then mutation trả lỗi permission rõ ràng và follow-up/task không bị partial write.
7. Given meeting detail page render follow-up actions, when user có hoặc không có quyền update/task-create, then UI chỉ hiển thị action được phép, có form/list/error/empty states tiếng Việt, link task chỉ render qua scoped task visibility, và không serialize task/project ngoài scope.
8. Given repository mode là JSON hoặc Supabase, when follow-up actions và related task links được đọc/ghi, then mapper dùng contract hiện có (`follow_up_actions`, `related_tasks`, `related_records`, task `linked_entity_type/id`) với parity giữa JSON/Supabase; migration mới chỉ được thêm nếu thật sự cần và phải additive.

## Tasks / Subtasks

- [x] Thêm validation và input contracts chuyên biệt cho follow-up actions (AC: 1, 2, 3, 4, 6)
  - [x] Trong `src/modules/meetings/validation.ts`, thêm schema cho create follow-up action, update follow-up status và create related task từ follow-up.
  - [x] Validate `title` non-empty, trim, bounded length; `ownerId` optional trim; `dueDate` là date-only `YYYY-MM-DD`; `status` dùng `DECISION_STATUSES` hiện có (`open`, `in_progress`, `done`, `cancelled`).
  - [x] Validate `taskProjectId` optional nhưng bắt buộc khi meeting không có đúng một project target.
  - [x] Không đưa follow-up actions vào generic meeting edit payload nếu không cần; đây là detail workflow riêng như minutes/attachments của Story 6.4.

- [x] Thêm service mutations nhỏ trong meeting service (AC: 1, 2, 3, 4, 6, 8)
  - [x] Trong `src/modules/meetings/services/meeting-service.ts`, thêm use-case rõ tên, ví dụ `addMeetingFollowUpAction`, `updateMeetingFollowUpActionStatus`, `createMeetingFollowUpTask` hoặc một combined use-case nếu dễ test hơn.
  - [x] Mỗi mutation nhận `actorId` bắt buộc và dùng cùng pattern `assertMeetingActor`/audit safe note của Story 6.4.
  - [x] Chỉ cho phép tạo/update follow-up action khi `meeting.status` là `COMPLETED` hoặc `FOLLOW_UP_PENDING`.
  - [x] Khi tạo related task, resolve target project từ meeting scope: exactly-one project auto default; multi-project/org-level phải có `taskProjectId` rõ ràng.
  - [x] Gọi `createTask` service contract, không gọi task repository trực tiếp từ UI/action và không route qua `createTaskAction` vì action đó redirect và không nhận linkage metadata.
  - [x] Task sinh ra nên dùng `title` từ follow-up action, `description` gồm meeting title/id và follow-up action id, `assigneeId` từ `ownerId`, `dueDate` từ follow-up, `status` mặc định `todo`, `priority` mặc định `medium`, `category: "meeting"`.
  - [x] Sau khi task được tạo, update meeting bằng cách set `followUpActions[n].relatedTaskId`, merge task id vào `relatedTasks`, merge `relatedRecords` `{ type: "task", id: task.id, relationType: "generated_action", title: task.title }`.
  - [x] Không xóa hoặc cập nhật task khi follow-up bị `done/cancelled`; task lifecycle vẫn thuộc task module.

- [x] Thêm Server Actions permission-aware cho meeting detail (AC: 1, 2, 3, 4, 6, 7)
  - [x] Trong `src/modules/meetings/actions.ts`, thêm actions cho add follow-up, update follow-up status, create follow-up task.
  - [x] Luôn gọi `getScopedMeeting(currentUser, meetingId)` rồi `assertCan(currentUser, "meeting.update", scopedMeeting)` trước khi ghi meeting.
  - [x] Nếu tạo task, gọi `assertCan(currentUser, "task.create")` và `getScopedProject(currentUser, taskProjectId)` trước khi gọi service; nếu target project không scoped hoặc không thuộc target hợp lệ của meeting thì trả lỗi trước write.
  - [x] Không dùng client-provided visible related fields để quyết định xóa related task/record trong flow này.
  - [x] Revalidate `"/meetings"`, `"/meetings/{meeting.id}"`, từng `"/projects/{projectId}"`, `"/tasks"`, `"/command-center"` và legacy redirect surfaces liên quan như `"/executive"` hoặc `"/executive/meetings"` nếu implementation hiện tại dùng chúng cho meeting snapshot.
  - [x] Dùng action-state pattern như Story 6.4 để validation/permission fail giữ lại input và hiển thị lỗi tiếng Việt.

- [x] Cập nhật meeting detail UI bằng panel follow-up riêng (AC: 1, 2, 3, 5, 6, 7)
  - [x] Thêm component trong `src/modules/meetings/components`, ưu tiên mở rộng `meeting-detail-panels.tsx` hoặc file panel mới cùng style.
  - [x] `src/app/(dashboard)/meetings/[meetingId]/page.tsx` chỉ load scoped data, tính `canUpdateMeeting`, `canCreateTask`, resolve scoped task links, bind actions và truyền DTO an toàn.
  - [x] Panel hiển thị danh sách action với title, owner, due date, status badge, task link nếu task scoped, overdue badge nếu quá hạn và chưa terminal.
  - [x] Form tạo follow-up gồm title, owner, due date, status mặc định `open`, checkbox hoặc submit option tạo task, và project selector/input chỉ khi meeting không có đúng một target project.
  - [x] Button tạo task chỉ hiển thị/enabled khi `canCreateTask`; nếu user thiếu quyền, UI vẫn cho tạo follow-up action không task.
  - [x] Không lồng card trong card; dùng panel compact giống minutes/attachments/AI summary của Story 6.4, text tiếng Việt wrap ổn trên mobile.

- [x] Cập nhật overdue/dashboard integration (AC: 5, 7)
  - [x] Trong `src/modules/dashboard/services/executive-dashboard-service.ts`, update priority queue và meeting snapshot để bỏ qua follow-up terminal (`done`, `cancelled`) khi tính overdue/today.
  - [x] Meeting list hiện đã có helper bỏ qua terminal follow-up; giữ behavior đó và chỉ sửa nếu cần reuse helper.
  - [x] Ensure created related task là task thật nên tự xuất hiện trong task overdue/upcoming contexts qua `listTasks/getOverdueTasks`; không tạo dashboard-only phantom item.
  - [x] Meeting detail chỉ render task link sau khi `getScopedTask` pass, tương tự related records hiện có.

- [x] Giữ repository/migration parity (AC: 1, 2, 8)
  - [x] `MeetingFollowUpAction` và `TaskLinkedEntityType = "meeting"` đã tồn tại; ưu tiên dùng lại thay vì tạo type/model mới.
  - [x] `database/migrations/202605230001_add_meeting_engine_fields.sql` đã có `follow_up_actions jsonb` và `related_tasks uuid[]`; `tasks` đã có `linked_entity_type/id` từ core schema. Không thêm migration nếu chỉ dùng các field này.
  - [x] Nếu phải mở rộng shape trong JSONB, đảm bảo `normalizeMeeting` default legacy records an toàn và Supabase patch mapper ghi `follow_up_actions` đúng như JSON repo.
  - [x] Không làm mất `attachments`, `aiSummary`, `meetingMinutesApproval`, `relatedRecords`, `relatedApprovals`, `relatedTasks` đã được Story 6.3/6.4 ổn định.

- [x] Tests bắt buộc (AC: 1-8)
  - [x] `tests/unit/meeting-service.test.ts`: create follow-up lifecycle, status/date validation, actor required, meeting status gate, audit safe summary, JSON/Supabase mapper parity nếu mapper đổi.
  - [x] `tests/unit/meeting-service.test.ts`: create related task via `createTask`, target project default/explicit rules, link `relatedTaskId`, merge `relatedTasks/relatedRecords`, reject duplicate related task before calling task service.
  - [x] `tests/unit/meeting-actions.test.ts`: scoped meeting required, `meeting.update`, `task.create`, scoped project check, validation fail preserves values, permission fail no partial write, revalidate task/meeting/project/executive paths.
  - [x] `tests/unit/meeting-detail-panels.test.tsx` hoặc file component tương đương: list/empty/error state, can-update/can-create-task gating, terminal status not overdue, scoped task link rendering.
  - [x] `tests/unit/executive-dashboard-service.test.ts` và/hoặc `tests/unit/executive-morning-briefing-service.test.ts`: open/in-progress follow-up overdue counted; done/cancelled follow-up ignored.
  - [x] `tests/unit/task-service.test.ts`: add meeting-linked metadata case if no existing test covers `linkedEntityType: "meeting"`.
  - [x] Chạy `npm run typecheck`, `npm run lint`, `npm test`. Nếu chỉ chạy targeted vì thời gian, ghi rõ command và lý do trong Dev Agent Record.

## Dev Notes

### Current Implementation Snapshot

- `src/modules/meetings/types.ts` đã có `MeetingFollowUpAction { id, title, ownerId?, dueDate?, relatedTaskId?, status? }` và `Meeting.followUpActions`.
- `src/modules/tasks/types.ts` đã có `TaskLinkedEntityType = "decision" | "meeting" | "proposal" | "document" | "risk" | "custom"`; không cần thêm enum/type mới cho meeting-linked task.
- `src/modules/tasks/services/task-service.ts` `createTask(input, repository?, projects?, metadata?)` validate project tồn tại/không archived và nhận metadata `{ linkedEntityType, linkedEntityId, createdBy }`.
- `src/modules/meetings/services/meeting-repository.ts` đã map `follow_up_actions`, `related_tasks`, `related_records` cho Supabase và JSON parity.
- `src/modules/meetings/actions.ts` đã có helper `getWritableScopedMeeting`, `meetingActionErrorState`, `revalidateMeetingMutationPaths`; reuse thay vì viết flow permission/error mới.
- `src/app/(dashboard)/meetings/[meetingId]/page.tsx` đã resolve `visibleRelatedRecords` và `visibleAttachments` bằng scoped helpers; follow-up task links nên làm cùng pattern với `getScopedTask`.
- `src/modules/dashboard/services/executive-dashboard-service.ts` đã đọc `meeting.followUpActions` trong priority queue và meeting snapshot, nhưng cần bỏ qua terminal statuses để không count action đã xong.
- `src/modules/meetings/components/meeting-list-table.tsx` đã có terminal follow-up guard cho overdue badge; dùng làm behavioral reference.

### Architecture And Boundary Rules

- Meeting module owns meeting state and follow-up action storage. Task module owns task lifecycle. A follow-up task link is a cross-module reference, not a second task model.
- UI/component không gọi repository trực tiếp. Server Actions enforce permission/scope, service owns business logic, repositories only persist.
- Permission before writes: `meeting.update` for follow-up action mutation; `task.create` plus `getScopedProject` for task creation. UI hiding is not security.
- Related task creation must use task service contract, not duplicate task construction logic in meeting action/component.
- Audit logs must be compact and safe: counts, ids/status transitions, actor/time. Do not log raw minutes, transcript, AI content, full task description or hidden related record titles.
- Repository parity is required. JSON mock and Supabase row/patch mapping must preserve the same domain contract.
- No new dependency/library. Stack baseline: Next `^15.3.2`, React `^19.0.0`, TypeScript `^5.8.3`, Zod `^3.24.4`, Vitest `^3.1.3`, Supabase JS `^2.49.4`.

### Previous Story Intelligence

- Story 6.4 added separate detail panels and action-state mutations for minutes/attachments/AI summary. Follow that pattern instead of expanding the generic meeting edit form.
- Story 6.4 review fixed generic minutes approval reset, Supabase explicit clears, http/https attachment URL validation and zero-byte upload rejection. Do not regress those code paths.
- Story 6.3 related-record edit has a deferred risk around client-controlled `__visible` removal. Follow-up task linking should merge task records server-side and must not depend on visible fields to remove records.
- Legacy `convertDecisionToTask` is one-task-per-decision and has a deferred duplicate/concurrency risk. Do not reuse it for follow-up actions; implement a follow-up-specific guard around `relatedTaskId`.
- Story 6.6 owns official decision tracking after meeting. This story owns follow-up actions and task linkage only.

### Implementation Guidance

- Prefer service functions that operate on one follow-up action at a time. This keeps tests direct and prevents generic meeting update from accidentally overwriting `followUpActions`.
- Generate the follow-up action id in service before optional task creation so task description can cite the follow-up action id.
- Validate all permission/scope/project/status requirements before calling `createTask`; this prevents partial task writes on common failure paths.
- After task creation, update meeting once with merged follow-up/task link data and audit event such as `meeting.follow_up_task_created`.
- Sequential duplicate-submit protection is mandatory: re-read meeting state inside the task creation use-case and reject if the follow-up action already has `relatedTaskId`.
- Full transactional compare-and-set may not exist in current repository contract. If implementation cannot guarantee concurrent-request atomicity across JSON/Supabase, document the residual risk in Dev Agent Record rather than pretending it is solved.

### UX Requirements

- Vietnamese labels/errors, concise helper text, no feature-explainer copy blocks.
- Status labels must use text, not color only: `Chưa xử lý`, `Đang xử lý`, `Đã xong`, `Hủy`.
- Overdue indicator appears only for non-terminal follow-ups with due date before today.
- Task link should show task title when scoped; otherwise show a neutral "Task liên kết ngoài phạm vi hiển thị" state without leaking title.
- Keep panel compact and operational. No nested cards, no landing/hero treatment, no decorative graphics.

### Out Of Scope

- Official decision tracking sau họp and multi-assignee decision assignment. Story 6.6 owns this.
- Real calendar/task notification scheduling.
- Deleting linked tasks when follow-up is cancelled/done.
- New permission keys such as `meeting.follow_up.create` unless permission catalog, seeds, role matrix and tests are updated together.
- Full distributed transaction/RPC rewrite for meeting-task creation unless required to make Supabase parity safe.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-6-one-meeting-engine-cho-iu-hnh.md`]
- [Source: `_bmad-output/implementation-artifacts/spec-one-meeting-engine-types-schema-mock-ui.md`]
- [Source: `_bmad-output/project-context.md`]
- [Source: `docs/context/meetings.md`]
- [Source: `docs/context/tasks.md`]
- [Source: `docs/context/decision-assignment.md`]
- [Source: `docs/context/permissions-audit.md`]
- [Source: `docs/context/testing.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`]
- [Source: `_bmad-output/implementation-artifacts/6-4-minutes-attachments-va-ai-summary-draft.md`]
- [Source: `_bmad-output/implementation-artifacts/deferred-work.md`]
- [Source: `src/modules/meetings/types.ts`]
- [Source: `src/modules/meetings/constants.ts`]
- [Source: `src/modules/meetings/validation.ts`]
- [Source: `src/modules/meetings/actions.ts`]
- [Source: `src/modules/meetings/services/meeting-service.ts`]
- [Source: `src/modules/meetings/services/meeting-repository.ts`]
- [Source: `src/modules/meetings/components/meeting-detail-panels.tsx`]
- [Source: `src/modules/meetings/components/meeting-list-table.tsx`]
- [Source: `src/app/(dashboard)/meetings/[meetingId]/page.tsx`]
- [Source: `src/modules/tasks/types.ts`]
- [Source: `src/modules/tasks/validation.ts`]
- [Source: `src/modules/tasks/services/task-service.ts`]
- [Source: `src/modules/tasks/services/task-repository.ts`]
- [Source: `src/modules/dashboard/services/executive-dashboard-service.ts`]
- [Source: `src/lib/permissions/can.ts`]
- [Source: `src/lib/permissions/scoped-resources.ts`]
- [Source: `database/migrations/202605230001_add_meeting_engine_fields.sql`]
- [Source: `database/migrations/202605160001_create_mvp_core_schema.sql`]
- [Source: `tests/unit/meeting-service.test.ts`]
- [Source: `tests/unit/meeting-actions.test.ts`]
- [Source: `tests/unit/meeting-detail-panels.test.tsx`]
- [Source: `tests/unit/task-service.test.ts`]
- [Source: `tests/unit/executive-dashboard-service.test.ts`]
- [Source: `tests/unit/executive-morning-briefing-service.test.ts`]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm test -- tests/unit/meeting-service.test.ts tests/unit/meeting-actions.test.ts tests/unit/meeting-detail-panels.test.tsx tests/unit/executive-dashboard-service.test.ts tests/unit/task-service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm test`

### Completion Notes List

- Added dedicated follow-up action validation, meeting service mutations, and server actions with meeting/task permission gates.
- Added related task creation through task service metadata, project target resolution, duplicate task guard, audit entries, and safe related task/record merging.
- Added meeting detail follow-up panel with permission-aware, follow-up-stage-aware create/update/task controls and scoped task link rendering.
- Sanitized meeting detail client-panel DTOs so hidden related task ids/titles/project arrays are not serialized to the browser.
- Added compensation rollback for generated follow-up tasks when the meeting link update fails.
- Updated executive dashboard follow-up overdue calculations to ignore terminal statuses.
- Added unit coverage for service lifecycle, server actions, detail panel behavior, executive dashboard filtering, and meeting-linked task metadata.
- Residual risk: related task creation and meeting link update are still two repository operations. Sequential duplicate submit and update-failure cleanup are covered, but concurrent double-submit or failed rollback cleanup would need a future transactional Supabase RPC or compare-and-set repository contract.

### Change Log

- 2026-06-03: Implemented Story 6.5 follow-up actions linked to related tasks and moved story to review after full validation.

### File List

- `src/modules/meetings/types.ts`
- `src/modules/meetings/validation.ts`
- `src/modules/meetings/services/meeting-service.ts`
- `src/modules/meetings/actions.ts`
- `src/modules/meetings/components/meeting-detail-panels.tsx`
- `src/app/(dashboard)/meetings/[meetingId]/page.tsx`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `tests/unit/meeting-service.test.ts`
- `tests/unit/meeting-actions.test.ts`
- `tests/unit/meeting-detail-panels.test.tsx`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/task-service.test.ts`
