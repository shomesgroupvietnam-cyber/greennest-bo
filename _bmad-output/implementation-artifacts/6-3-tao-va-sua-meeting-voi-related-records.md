# Story 6.3: Tạo Và Sửa Meeting Với Related Records

Status: done

Generated: 2026-06-03

Requirements Covered: FR-073, FR-075, FR-114, NFR-005, NFR-006, UX-DR23

## Story

As a người có quyền tạo họp,
I want tạo/sửa meeting với participants, external participants và related records,
so that cuộc họp liên kết đúng project, approval, risk, decision, task hoặc hồ sơ.

## Acceptance Criteria

1. Given user có quyền `meeting.create` trong scope hợp lệ, when submit create meeting form, then hệ thống lưu đầy đủ `title`, `meetingType`, `hostId`, `participants`, `externalParticipants`, `meetingDate/startTime`, `endTime`, `agenda`, `visibility`, `participantScope`, `organizationId`, `projectId/projectIds`, `axisId`, `departmentId`, `roomId` placeholder và `status` hợp lệ.
2. Given user có quyền `meeting.update` và meeting nằm trong scope của user, when submit edit meeting form, then hệ thống cập nhật các field mutable của meeting gồm metadata họp, thời gian, host, participants, external participants, agenda, room placeholder, minutes/summary nếu form còn hiển thị và related records; project/organization/axis/department scope hiện có hiển thị read-only và được giữ nguyên.
3. Given meeting liên quan approval/proposal, risk/blocker, decision, task hoặc document, when user chọn related records, then service lưu liên kết qua meeting service contract, validate từng related record bằng scoped service/helper tương ứng, và component không gọi repository module khác trực tiếp.
4. Given related record không tồn tại hoặc nằm ngoài scope của user, when create/edit meeting submit record id đó, then server action/service từ chối mutation và không ghi meeting partial.
5. Given room booking chưa thuộc MVP, when form hiển thị `roomId`, then field chỉ là placeholder/mock, không bắt buộc và không chặn tạo/sửa meeting.
6. Given validation hoặc permission fail, when form trả lỗi, then UI hiển thị lỗi gần field hoặc action area bằng tiếng Việt rõ ràng, không render dữ liệu ngoài scope, và giữ lại input người dùng khi validation fail. Action state là cách triển khai chấp nhận được.
7. Given create/edit meeting thành công, then meeting audit log ghi actor/action/timestamp tối thiểu cho `meeting.created` và `meeting.updated`, đặc biệt khi participants hoặc related records thay đổi.

## Tasks / Subtasks

- [x] Mở rộng domain contract và persistence cho related records (AC: 1, 2, 3, 7)
  - [x] Thêm `MeetingRelatedRecord` hoặc contract tương đương cho meeting với type tối thiểu: `proposal`/`approval`, `risk`, `decision`, `task`, `document`, `project`, `custom`; mỗi link có `id`, `type`, `relationType`, optional `title`.
  - [x] Thêm `relatedRecords: MeetingRelatedRecord[]` vào `Meeting`, `MeetingInput`, `MeetingUpdateInput`; giữ `relatedApprovals` và `relatedTasks` để tương thích với Story 6.1/6.2.
  - [x] Nếu thêm field mới vào Supabase, tạo migration additive cho `public.meetings.related_records jsonb not null default '[]'::jsonb`; cập nhật JSON repository, Supabase row mapper, patch mapper và normalize mapper.
  - [x] Sync compatibility arrays: approval/proposal links vẫn phản ánh vào `relatedApprovals`, task links vẫn phản ánh vào `relatedTasks`; không xóa hai field này.
  - [x] Document links dùng related record type `document`; không overload `attachments[].documentId` trừ khi user thật sự attach file.

- [x] Cập nhật validation và service mutation (AC: 1, 2, 3, 4, 7)
  - [x] Extend `meetingInputSchema` và `meetingUpdateSchema` để parse repeated FormData hoặc comma-separated arrays cho `relatedApprovals`, `relatedTasks`, `relatedDecisions`, `relatedRisks`, `relatedDocuments`.
  - [x] Dedupe related ids theo type, trim empty values, reject malformed link objects hoặc unsupported relation type.
  - [x] `createMeeting` lưu related records thay vì luôn khởi tạo `relatedApprovals: []` và `relatedTasks: []`.
  - [x] `updateMeeting` cập nhật full mutable meeting fields hiện có; hiện `updateMeetingAction` chỉ gửi `title`, `meetingDate`, `summary`, cần sửa để không làm edit form thành lưu thiếu.
  - [x] Append audit entry `meeting.updated` khi update thành công; ghi summary ngắn cho participants/related record changes, không log raw sensitive payload.
  - [x] Không tạo/sửa proposal, risk, decision, task hoặc document khi chỉ link meeting; related records là link metadata.

- [x] Enforce permission và scoped related-record validation server-side (AC: 1, 2, 3, 4, 6)
  - [x] Tiếp tục dùng `assertCan(currentUser, "meeting.create")`, `canCreateProjectMeeting`, `canCreateOrganizationMeeting` trong create action.
  - [x] Tiếp tục dùng `getScopedMeeting(currentUser, meetingId)` và `assertCan(currentUser, "meeting.update", meeting)` trong update action.
  - [x] Validate related proposal/approval ids bằng `getScopedProposal`; validate task ids bằng `getScopedTask`; validate document ids bằng `getScopedDocument`; validate decision ids bằng `getScopedDecision`.
  - [x] Cho risk/blocker, thêm scoped wrapper trong `src/lib/permissions/scoped-resources.ts` hoặc dùng `listExecutiveRiskRecordsForDashboard` + `filterExecutiveRiskRecordsForScope`/`canReadExecutiveRiskRecordInScope`; không expose risk ngoài scope.
  - [x] Trong Story 6.3, project/org/axis/department scope ở edit là immutable: render read-only và update action không nhận hidden scope field làm mutation. Nếu cần đổi scope meeting, tạo story riêng với scoped target validation và RLS parity.

- [x] Cập nhật create/edit pages và MeetingForm UX (AC: 1, 2, 3, 5, 6)
  - [x] `src/app/(dashboard)/meetings/new/page.tsx` load scoped picker data cần thiết qua service/helper, chỉ truyền DTO an toàn cho form.
  - [x] `src/app/(dashboard)/meetings/[meetingId]/edit/page.tsx` load existing meeting qua `getScopedMeeting`, load scoped picker options, preselect existing related records.
  - [x] `MeetingForm` hiển thị create/edit fields cho participants nội bộ, external participants, host, agenda, start/end, visibility, participant scope, room placeholder và related record pickers.
  - [x] Related picker có label tiếng Việt, helper text ngắn, empty state theo scope, và không hiển thị option user không có quyền xem.
  - [x] Scope hiện có ở edit phải rõ ràng bằng read-only display; không đưa control/hidden input có thể đổi project/org/axis/department scope trong story này.
  - [x] Form dài dùng action area rõ ràng hoặc sticky action area theo pattern hiện có; text tiếng Việt không tràn container trên mobile.

- [x] Cập nhật detail/list surface nếu cần để thấy related records (AC: 3, 6)
  - [x] Meeting detail page hiển thị summary related records đã chọn bằng DTO an toàn, có link chỉ khi user có quyền xem record.
  - [x] Không hiển thị raw financial amount, raw transcript/minutes hoặc nội dung tài liệu nhạy cảm trong related record preview.
  - [x] Giữ list/filter của Story 6.2 ổn định; không làm regress multi-project table, empty states hoặc date filters.

- [x] Tests bắt buộc (AC: 1-7)
  - [x] Mở rộng `tests/unit/meeting-service.test.ts` cho create/update với participants, external participants, room placeholder, related records, audit update và JSON/Supabase mapper parity.
  - [x] Mở rộng hoặc thêm `tests/unit/meeting-actions.test.ts` cho repeated FormData values, permission create/update, unauthorized related record rejection và no partial write.
  - [x] Thêm component tests cho `MeetingForm` create/edit: render options đúng scope, preserve default values, room placeholder optional, edit scope read-only.
  - [x] Nếu thêm migration/RLS/policy, mở rộng `tests/unit/meeting-rls-policy.test.ts` hoặc policy test tương ứng để kiểm tra `related_records` không làm yếu meeting scope RLS.
  - [x] Chạy `npm run typecheck`, `npm run lint`, `npm test`. Nếu chỉ chạy targeted vì thời gian, ghi rõ targeted command và lý do trong Dev Agent Record.

### Review Findings

- [x] [Review][Patch] Fix `related_records` migration backfill for legacy `related_approvals` text arrays and guard JSON shape [database/migrations/202606030001_add_meeting_related_records.sql:16]
- [x] [Review][Patch] Preserve existing related links on edit instead of dropping or blocking non-visible, legacy, project, or custom links [src/modules/meetings/services/meeting-service.ts:257]
- [x] [Review][Patch] Return validation/permission failures to `MeetingForm` with Vietnamese action-state errors and preserved input [src/modules/meetings/actions.ts:165]
- [x] [Review][Patch] Use `getScopedMeeting` before `assertCan`/raw meeting reads on update and route access decisions [src/modules/meetings/actions.ts:207]
- [x] [Review][Patch] Make `meeting.updated` audit actor required and summarize participant/related-record changes safely [src/modules/meetings/services/meeting-service.ts:247]
- [x] [Review][Patch] Bound related-record inputs and canonicalize approval/proposal duplicates before validation/persistence [src/modules/meetings/validation.ts:72]
- [x] [Review][Patch] Add negative action tests for out-of-scope related records and no partial meeting write [tests/unit/meeting-actions.test.ts:177]
- [x] [Review][Defer] Supabase decision schema/RPC additions in `meeting-repository.ts` need matching prior migrations outside Story 6.3 [src/modules/meetings/services/meeting-repository.ts:604] — deferred, pre-existing
- [x] [Review][Defer] Existing executive risk scope helper does not grant non-assignment organization-level risk visibility without project ownership [src/modules/executive/services/risk-record-service.ts:610] — deferred, pre-existing

## Dev Notes

### Current Implementation Snapshot

- `src/modules/meetings/types.ts` hiện có `Meeting.relatedApprovals` và `Meeting.relatedTasks`, `MeetingAttachment.documentId`, nhưng chưa có generic meeting related-record contract cho risk/decision/document. `DecisionLinkedRecord` có type union đủ rộng nhưng đang thuộc decision domain.
- `src/modules/meetings/validation.ts` hiện parse participants/externalParticipants/projectIds bằng string hoặc array; chưa parse related ids cho meeting.
- `src/modules/meetings/actions.ts` hiện `formDataToMeetingInput` đọc core fields, `createMeetingAction` đã check `meeting.create` + scoped create. `formDataToMeetingUpdateInput` hiện chỉ trả `title`, `meetingDate`, `summary`, nên edit form đang có nguy cơ hiển thị nhiều field nhưng chỉ lưu ba field.
- `src/modules/meetings/services/meeting-service.ts` hiện `createMeeting` khởi tạo `relatedApprovals: []`, `relatedTasks: []`; `updateMeeting` patch nhiều field nếu input có, nhưng action chưa truyền đủ input.
- `src/modules/meetings/services/meeting-repository.ts` đã map JSON/Supabase cho `related_approvals`, `related_tasks`, `attachments`, nhưng chưa có `related_records` generic.
- `src/modules/meetings/components/meeting-form.tsx` hiện là form server-friendly đơn giản, có participants/external participants dạng comma-separated, chưa có related picker và edit chưa có project selector nhưng vẫn render org/axis/department inputs.
- `src/app/(dashboard)/meetings/[meetingId]/page.tsx` hiện hiển thị metadata, participants, agenda, minutes/summary và decision list; chưa hiển thị related records tổng hợp.
- Database migration `database/migrations/202605230001_add_meeting_engine_fields.sql` đã thêm `related_approvals uuid[]`, `related_tasks uuid[]`, `attachments jsonb`; `database/migrations/202606020003_harden_meeting_scope_rls.sql` harden scope theo `project_id/project_ids`, host, participants, organization/axis/department.

### Architecture And Boundary Rules

- Use Next.js App Router Server Actions for internal mutations; components must not call Supabase or repositories directly.
- Keep modular monolith boundaries: meeting module owns meeting mutation; proposal/task/document/risk/decision modules are accessed via services or scoped helpers only.
- Permission is server/service-side, deny-by-default. UI hiding is not security.
- Preserve repository parity: JSON repository and Supabase repository must map the same camelCase domain fields.
- No new library is needed. Current baseline from `package.json`: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Zod `^3.24.4`, Vitest `^3.1.3`, Testing Library React `^16.3.0`, Playwright `^1.52.0`.

### Related Record Contract Guidance

- Approval/proposal: current safe path is `getScopedProposal` from `src/lib/permissions/scoped-resources.ts`; existing `relatedApprovals` can store proposal approval ids for compatibility.
- Task: use `getScopedTask`; tasks already support `linkedEntityType`, but this story only links existing tasks to meeting metadata.
- Document: use `getScopedDocument`; store as meeting related record type `document`, not as attachment unless there is an uploaded/attached file.
- Decision: use `getScopedDecision`; do not create official decisions in this story. Story 6.6 owns decision tracking after meeting.
- Risk/blocker: risk service exposes `canReadExecutiveRiskRecordInScope` and `filterExecutiveRiskRecordsForScope`; add a small scoped helper if needed so form/action code does not duplicate access-scope logic.
- Related records must be immutable links unless user explicitly edits the link set. Selecting a related record must not transition approval/risk/task/decision status.

### Previous Story Intelligence

- Story 6.1 established the Meeting contract, organization-only and multi-project scope, repository parity, scoped create checks and RLS parity. Build on that instead of creating a second meeting module.
- Story 6.1 also made `projectIds` repeated FormData important; keep `formData.getAll()` behavior for multi-project scope and related record arrays.
- Story 6.2 added meeting list filters and executive visibility. Do not regress URL filter parsing, business-day date handling, multi-project project display or unauthorized empty states.
- Review note carried forward from Story 6.2: decision scope immutability had been flagged in `src/modules/meetings/services/meeting-repository.ts`. If this story touches decision update or decision linked records, preserve existing decision project scope and do not widen it accidentally.
- The current worktree is already dirty with many uncommitted Story 4/5/6 changes. Do not reset or revert unrelated files; read current local code before editing.

### UX Requirements

- Labels, helper text and validation messages must be Vietnamese-first.
- Required fields need visible markers; validation errors should be close to the field or action area.
- Empty related picker state must distinguish "không có record trong scope" from permission denial without leaking hidden record names.
- Permission denial must not render sensitive data then hide it.
- Use existing Tailwind/shadcn-style primitives. Buttons use clear hierarchy; one primary submit per form action area.
- Mobile layout must stack cleanly; no fixed-width text containers for Vietnamese labels.

### Out Of Scope

- No real room booking, video call, transcript ingestion or AI summary generation.
- No automatic follow-up task creation; Story 6.5 owns follow-up actions linked to tasks.
- No official decision creation/tracking workflow; Story 6.6 owns decision tracking after meeting.
- No broad refactor of command center, dashboard or approval workflow beyond providing scoped related picker data.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-6-one-meeting-engine-cho-iu-hnh.md`]
- [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]
- [Source: `docs/context/meetings.md`]
- [Source: `docs/context/permissions-audit.md`]
- [Source: `docs/context/testing.md`]
- [Source: `_bmad-output/implementation-artifacts/6-1-meeting-engine-types-scope-va-repository-contract.md`]
- [Source: `_bmad-output/implementation-artifacts/6-2-meeting-list-filters-va-executive-visibility.md`]
- [Source: `src/modules/meetings/types.ts`]
- [Source: `src/modules/meetings/validation.ts`]
- [Source: `src/modules/meetings/actions.ts`]
- [Source: `src/modules/meetings/services/meeting-service.ts`]
- [Source: `src/modules/meetings/services/meeting-repository.ts`]
- [Source: `src/modules/meetings/components/meeting-form.tsx`]
- [Source: `src/lib/permissions/scoped-resources.ts`]
- [Source: `src/modules/executive/services/risk-record-service.ts`]
- [Source: `database/migrations/202605230001_add_meeting_engine_fields.sql`]
- [Source: `database/migrations/202606020003_harden_meeting_scope_rls.sql`]
- [Source: `tests/unit/meeting-service.test.ts`]
- [Source: `tests/unit/meeting-list-filters.test.tsx`]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-06-03: RED targeted tests added for meeting related records; initial run failed on missing scoped validation/full update/form picker support.
- 2026-06-03: `npm test -- tests/unit/meeting-service.test.ts tests/unit/meeting-actions.test.ts tests/unit/meeting-form.test.tsx` -> passed 27 tests.
- 2026-06-03: `npm test -- tests/unit/meeting-rls-policy.test.ts` -> passed 3 tests.
- 2026-06-03: `npm run typecheck` -> passed.
- 2026-06-03: `npm run lint` -> passed.
- 2026-06-03: `npm test` -> passed 84 test files / 571 tests.

### Completion Notes List

- Added generic `MeetingRelatedRecord` support for proposal/approval, risk, decision, task, document, project and custom links while preserving `relatedApprovals` and `relatedTasks` compatibility arrays.
- Added additive Supabase migration for `public.meetings.related_records`, JSON/Supabase mapper parity, normalization and compatibility backfill.
- Updated meeting create/update validation and service mutation so related ids are deduped, full mutable edit fields are saved, immutable scope fields are not accepted on edit, and `meeting.updated` audit entries are appended.
- Enforced server-side scoped validation for proposal/approval, task, document, decision and risk/blocker links before mutation, preventing partial meeting writes for out-of-scope related ids.
- Updated create/edit meeting pages and `MeetingForm` with scoped picker DTOs, repeated FormData related arrays, host/projectIds controls, room placeholder, edit read-only scope display and related defaults.
- Added meeting detail related-record summary that resolves labels/links through scoped helpers and avoids rendering out-of-scope related record data.
- Expanded service/action/form/RLS tests and completed full regression validation.

### File List

- _bmad-output/implementation-artifacts/6-3-tao-va-sua-meeting-voi-related-records.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- database/migrations/202606030001_add_meeting_related_records.sql
- src/app/(dashboard)/meetings/[meetingId]/edit/page.tsx
- src/app/(dashboard)/meetings/[meetingId]/page.tsx
- src/app/(dashboard)/meetings/new/page.tsx
- src/lib/permissions/scoped-resources.ts
- src/modules/meetings/actions.ts
- src/modules/meetings/components/meeting-form.tsx
- src/modules/meetings/services/meeting-related-record-options.ts
- src/modules/meetings/services/meeting-repository.ts
- src/modules/meetings/services/meeting-service.ts
- src/modules/meetings/types.ts
- src/modules/meetings/validation.ts
- tests/unit/meeting-actions.test.ts
- tests/unit/meeting-form.test.tsx
- tests/unit/meeting-rls-policy.test.ts
- tests/unit/meeting-service.test.ts

### Change Log

- 2026-06-03: Story created and marked ready-for-dev.
- 2026-06-03: Implemented related-record create/edit meeting flow and marked ready for review.

