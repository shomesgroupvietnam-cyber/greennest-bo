# Story 6.4: Minutes, Attachments Và AI Summary Draft

Status: done

Generated: 2026-06-03

Requirements Covered: FR-076, FR-077, FR-108, FR-117, NFR-006, NFR-009, NFR-010, UX-DR16, UX-DR34

Completion Note: Ultimate context engine analysis completed - comprehensive developer guide created.

## Story

As a meeting host hoặc người được quyền,
I want upload tài liệu, cập nhật biên bản và dùng AI summary draft,
so that meeting có hồ sơ đầy đủ nhưng biên bản chính thức vẫn cần được duyệt.

## Acceptance Criteria

1. Given user có quyền `meeting.update` và meeting nằm trong scope của user, when user cập nhật minutes/summary cho existing meeting, then hệ thống lưu nội dung mới, reset trạng thái duyệt minutes về draft nếu nội dung thay đổi, append audit có actor/time/previous/new state ngắn gọn, và không ghi raw minutes vào audit payload.
2. Given user có quyền `meeting.update` và attachment hợp lệ, when user thêm hoặc gỡ attachment, then meeting lưu `attachments` an toàn với metadata tối thiểu (`id`, `name`, optional `url`, optional `documentId`), validate scoped document nếu có `documentId`, giữ mock/Supabase repository parity, revalidate meeting/project routes và append audit actor/time/attachment count change.
3. Given production Supabase Storage upload chưa hoàn chỉnh, when user cần attachment trong Story 6.4, then implementation chỉ hỗ trợ external URL hoặc link tới scoped document hiện có; nếu binary upload được submit thì trả lỗi tiếng Việt rõ ràng, không partial write và không dựng storage provider mới ngoài `src/lib/storage`.
4. Given AI summary được tạo hoặc cập nhật, when draft được lưu vào meeting, then `aiSummary.status` luôn là `DRAFT`, clear `approvedBy/approvedAt` nếu content đổi, UI hiển thị nhãn Draft/Gợi ý AI rõ ràng, và AI content không được coi là biên bản chính thức.
5. Given user được phép duyệt, when user approve official minutes hoặc AI summary draft, then trạng thái tương ứng chuyển sang `APPROVED`, lưu `approvedBy`/`approvedAt`, audit ghi actor/time/previous/new status, và action từ chối nếu meeting ngoài scope hoặc thiếu quyền.
6. Given AI output có thể đến từ AI Gateway/action proposal, when implementation dùng AI service hiện có, then AI chỉ tạo draft/proposal có human confirmation; không tự mutate official minutes, không bypass permission, không thêm provider/library mới, không lưu prompt/raw transcript/AI output nhạy cảm vào audit.
7. Given meeting detail page render minutes, attachments và AI summary, when user có/không có quyền update, then UI chỉ hiển thị actions được phép, có empty/error states tiếng Việt, text không tràn trên mobile, và không serialize hoặc render attachment/document ngoài scope.
8. Given repository mode là JSON hoặc Supabase, when meeting có minutes approval metadata, attachments và AI summary state, then mapper đọc/ghi cùng một contract, migration nếu cần phải additive, default legacy records an toàn, và tests cover mapper parity.

## Tasks / Subtasks

- [x] Mở rộng domain contract cho minutes approval và attachment metadata (AC: 1, 2, 4, 5, 8)
  - [x] Giữ `meetingMinutes?: string` làm content để không phá consumer hiện có.
  - [x] Thêm metadata duyệt minutes theo hướng additive, ví dụ `meetingMinutesApproval?: { status: "DRAFT" | "APPROVED"; approvedBy?: EntityId; approvedAt?: string }`; default legacy là `DRAFT` khi chưa có approval metadata.
  - [x] Giữ `MeetingAiSummary` hiện có (`status`, `content`, `approvedBy`, `approvedAt`) và đảm bảo status chỉ dùng `DRAFT`/`APPROVED` từ `AI_SUMMARY_STATUSES`.
  - [x] Mở rộng `MeetingAttachment` nếu cần bằng optional metadata an toàn như `uploadedBy`, `uploadedAt`, `source`, nhưng không đổi shape bắt buộc hiện tại (`id`, `name`, `url?`, `documentId?`).
  - [x] Nếu thêm field Supabase mới cho minutes approval, tạo migration additive trong `database/migrations/YYYYMMDDNNNN_*.sql`; JSON repo và Supabase mapper phải cùng default.

- [x] Thêm validation schema chuyên biệt cho minutes, attachments và AI summary (AC: 1, 2, 3, 4, 5)
  - [x] Thêm schema input trong `src/modules/meetings/validation.ts`: update minutes, add attachment, remove attachment, update AI summary draft, approve minutes, approve AI summary.
  - [x] Bound text input: trim, empty thành `undefined` khi hợp lệ; đặt giới hạn hợp lý cho `name`, `url`, `documentId`, AI draft/minutes content để tránh payload cực lớn.
  - [x] Validate `url` là URL hợp lệ nếu có; attachment phải có `name` và ít nhất một nguồn `url` hoặc `documentId`.
  - [x] Binary file upload hiện chưa được hỗ trợ: nếu FormData có file/blob thật, action phải trả lỗi thân thiện thay vì gọi storage upload giả.

- [x] Thêm service mutations nhỏ, không nhồi thêm vào edit form tổng quát (AC: 1-6, 8)
  - [x] Trong `src/modules/meetings/services/meeting-service.ts`, thêm các use-case rõ tên: `updateMeetingMinutes`, `addMeetingAttachment`, `removeMeetingAttachment`, `updateMeetingAiSummaryDraft`, `approveMeetingMinutes`, `approveMeetingAiSummary` hoặc tên tương đương theo pattern hiện có.
  - [x] Mỗi mutation nhận `actorId` bắt buộc; throw lỗi nếu actor rỗng như pattern `updateMeeting`.
  - [x] `updateMeetingMinutes` set content mới, reset approval về `DRAFT` khi content đổi, append audit action như `meeting.minutes_updated`.
  - [x] `addMeetingAttachment` dedupe theo `documentId` hoặc normalized `url/name`, sinh `id`, append audit action như `meeting.attachment_added`, không sửa document record.
  - [x] `removeMeetingAttachment` chỉ gỡ metadata khỏi meeting, không xóa document/storage object.
  - [x] `updateMeetingAiSummaryDraft` luôn set `aiSummary.status = "DRAFT"` và clear approval metadata khi content đổi.
  - [x] `approveMeetingMinutes` và `approveMeetingAiSummary` chỉ đổi approval/status metadata, không tự tạo decision/task/document.
  - [x] Audit note chỉ ghi field/status/count change, ví dụ `minutes DRAFT->APPROVED`, `attachments 1->2`; không log raw minutes, transcript, AI text, prompt hoặc URL nhạy cảm đầy đủ.

- [x] Thêm Server Actions có permission, scope và action-state rõ ràng (AC: 1-7)
  - [x] Trong `src/modules/meetings/actions.ts`, thêm actions cho minutes, attachments, AI draft và approval, dùng `getCurrentUser`.
  - [x] Luôn gọi `getScopedMeeting(currentUser, meetingId)` trước khi gọi service mutation; nếu không có scope thì trả lỗi/unauthorized trước write.
  - [x] Dùng `assertCan(currentUser, "meeting.update", scopedMeeting)` làm permission canonical hiện có. Không invent `meeting.approve` nếu không cập nhật `can.ts`, catalog, seeds và tests đồng bộ.
  - [x] Nếu draft được sinh qua AI Gateway/action proposal, require thêm permission AI hiện có phù hợp (`ai.create_draft` cho draft hoặc `ai.confirm_action` nếu accept proposal), nhưng vẫn không được bypass `meeting.update`.
  - [x] Nếu attachment có `documentId`, validate bằng `getScopedDocument(currentUser, documentId)` trước mutation; không render hoặc lưu title tài liệu ngoài scope.
  - [x] Sau mutation, `revalidatePath("/meetings")`, `revalidatePath(`/meetings/${meeting.id}`)` và revalidate từng `/projects/${projectId}` trong `projectId/projectIds`.
  - [x] Actions dùng action-state cho panel/form inline; validation/permission fail giữ input người dùng và hiện lỗi tiếng Việt.

- [x] Cập nhật repository/migration parity (AC: 2, 4, 5, 8)
  - [x] `src/modules/meetings/services/meeting-repository.ts` đã map `attachments`, `ai_summary`, `meeting_minutes`; mở rộng patch mapper cho metadata mới nếu có.
  - [x] Supabase row mapper phải default `attachments: []`, `aiSummary: { status: "DRAFT" }`, minutes approval draft nếu column null/missing.
  - [x] JSON repository update phải merge patch an toàn, giữ audit log hiện có, không làm mất `relatedRecords`, `relatedApprovals`, `relatedTasks` từ Story 6.3.
  - [x] Nếu migration thêm JSONB field, thêm default `not null` hợp lý và backfill legacy records.

- [x] Cập nhật meeting detail UI bằng các panel nhỏ, permission-aware (AC: 1-7)
  - [x] Ưu tiên thêm component trong `src/modules/meetings/components`, ví dụ `MeetingMinutesPanel`, `MeetingAttachmentsPanel`, `MeetingAiSummaryPanel`.
  - [x] `src/app/(dashboard)/meetings/[meetingId]/page.tsx` vẫn mỏng: load scoped meeting, tính `canUpdateMeeting`, bind actions, truyền DTO an toàn vào component.
  - [x] Minutes panel hiển thị status Draft/Approved, approved actor/time nếu có, textarea/edit action khi có quyền, approve action tách riêng.
  - [x] Attachments panel hiển thị danh sách tên, link external URL hoặc document route chỉ khi scoped; empty state "Chưa có attachment trong scope được phép xem".
  - [x] AI panel luôn có badge "Bản nháp AI" khi chưa approved; approve button chỉ hiện khi có quyền; không dùng wording khiến AI draft thành biên bản chính thức.
  - [x] Dùng `Button`/Tailwind pattern hiện có, labels tiếng Việt, focus/error states rõ, mobile stack ổn định và không lồng card trong card.

- [x] Không phá regressions từ Story 6.1-6.3 (AC: 1-8)
  - [x] Không đổi One Meeting Engine thành module mới.
  - [x] Không làm mất organization-only/multi-project meeting.
  - [x] Không regress meeting list filters, executive visibility, room placeholder, related record picker và preserve-hidden-related-links behavior.
  - [x] Không gọi repository module khác trực tiếp từ component.
  - [x] Không tự động tạo follow-up tasks hoặc official decision; Story 6.5/6.6 sở hữu phần đó.

- [x] Tests bắt buộc (AC: 1-8)
  - [x] Mở rộng `tests/unit/meeting-service.test.ts` cho update minutes reset draft, approve minutes, add/remove attachment, AI draft update, approve AI summary, actor required và audit safe summary.
  - [x] Mở rộng `tests/unit/meeting-actions.test.ts` cho scoped meeting required, `meeting.update` permission, out-of-scope `documentId` rejection, binary upload unsupported, validation fail preserving values, no partial write.
  - [x] Thêm component tests trong `tests/unit/*meeting*test.tsx` cho draft badge, approved metadata, attachment empty/list state, approve button visibility và error rendering.
  - [x] Mở rộng repository mapper tests trong `tests/unit/meeting-service.test.ts` hoặc file dedicated nếu thêm migration/field mới: JSON/Supabase row-to-domain và patch mapper parity.
  - [x] Chạy `npm run typecheck`, `npm run lint`, `npm test`. Nếu chỉ targeted vì thời gian, ghi rõ command và lý do trong Dev Agent Record.

### Review Findings

- [x] [Review][Patch] General edit path can change approved minutes/summary without resetting approval or using minutes audit [`src/modules/meetings/services/meeting-service.ts:510`]
- [x] [Review][Patch] Summary-only updates keep minutes approval as APPROVED [`src/modules/meetings/services/meeting-service.ts:547`]
- [x] [Review][Patch] Clearing minutes/summary is skipped in Supabase but applied in JSON mock [`src/modules/meetings/services/meeting-repository.ts:796`]
- [x] [Review][Patch] Attachment URL validation allows non-http schemes rendered as links [`src/modules/meetings/validation.ts:109`]
- [x] [Review][Patch] Binary upload detection ignores zero-byte file/blob values [`src/modules/meetings/actions.ts:217`]
- [x] [Review][Patch] New meeting mutation errors contain mojibake instead of readable Vietnamese [`src/modules/meetings/actions.ts:239`]
- [x] [Review][Patch] Legacy minutes approval mapper default lacks required parity tests [`tests/unit/meeting-service.test.ts:1009`]
- [x] [Review][Defer] Client-controlled related `__visible` fields can remove out-of-scope related records [`src/modules/meetings/actions.ts:329`] — deferred, pre-existing
- [x] [Review][Defer] Supabase decision project filter interpolates raw `.or()` input [`src/modules/meetings/services/meeting-repository.ts:1002`] — deferred, pre-existing
- [x] [Review][Defer] Approval actions have no content/version precondition for concurrent edits [`src/modules/meetings/services/meeting-service.ts:580`] — deferred, broader optimistic-locking hardening
- [x] [Review][Defer] Decision-to-task conversion is not atomic under concurrent submits [`src/modules/meetings/services/meeting-service.ts:837`] — deferred, pre-existing

## Dev Notes

### Current Implementation Snapshot

- `src/modules/meetings/types.ts` hiện có `MeetingAttachment { id, name, url?, documentId? }`, `MeetingAiSummary { status, content?, approvedBy?, approvedAt? }`, `meetingMinutes?: string`, `summary?: string`, `attachments: []`, `auditLog`.
- `src/modules/meetings/constants.ts` có `AI_SUMMARY_STATUSES = { DRAFT, APPROVED }`; không có minutes approval constants riêng.
- `src/modules/meetings/validation.ts` hiện parse create/update meeting core fields và related records; chưa có schema riêng cho attachment/minutes/AI approval.
- `src/modules/meetings/actions.ts` hiện có `createMeetingAction`, `updateMeetingAction`, decision actions. Update action đã dùng `getScopedMeeting` trước `assertCan` và action-state lỗi tiếng Việt.
- `src/modules/meetings/services/meeting-service.ts` hiện `createMeeting` khởi tạo `attachments: []`, `aiSummary: { status: "DRAFT" }`; `updateMeeting` cập nhật form tổng quát và append `meeting.updated`.
- `src/modules/meetings/services/meeting-repository.ts` đã map `attachments`, `transcript`, `ai_summary`, `meeting_minutes` cho JSON/Supabase và patch mapper.
- `src/app/(dashboard)/meetings/[meetingId]/page.tsx` hiện hiển thị agenda, minutes/summary, AI summary placeholder, transcript placeholder, related records và decision list; chưa có form/panel thao tác minutes/attachments/AI approval.
- `src/lib/storage/document-storage.ts` chỉ định bucket/path convention và có `assertStorageUploadNotImplemented()`. README nói production upload/download chưa hoàn chỉnh; callers nên dùng external URL cho tới khi có signed upload/download actions.
- `src/modules/ai/services/ai-gateway-service.ts` hiện tạo AI interaction/job mock qua gateway; action proposal acceptance có human confirmation riêng. Không cần thêm provider hoặc thư viện AI mới cho story này.

### Architecture And Boundary Rules

- Next.js App Router Server Actions cho mutations nội bộ; route/page compose UI, service owns business logic.
- Modular monolith: meeting module owns meeting state; AI, documents, permissions, storage chỉ được gọi qua service/helper contract.
- Permission enforce server/service-side trước write và trước serialization nhạy cảm. UI hiding không phải security.
- Central permission key hiện có cho meeting approval/update là `meeting.update`; nếu thêm permission mới phải cập nhật `src/lib/permissions/can.ts`, role permission catalog, seeds/fixtures, navigation nếu liên quan và tests.
- AI mutation rules: AI output là draft/proposal; official domain mutation cần human confirmation. Không mutate official minutes trực tiếp từ worker/provider.
- Repository parity bắt buộc: JSON và Supabase mapper cùng domain field, cùng default legacy, cùng patch behavior.
- Không thêm library mới. Stack baseline từ `package.json`: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, Zod `^3.24.4`, Supabase JS `^2.49.4`, Vitest `^3.1.3`, Testing Library React `^16.3.0`.

### Previous Story Intelligence

- Story 6.1 established One Meeting Engine, organization-only/multi-project scope, repository contract, RLS parity, placeholder room and default draft AI summary.
- Story 6.2 added list filters and executive visibility. Do not regress URL filters, date parsing, multi-project display or unauthorized empty states.
- Story 6.3 added related-record create/edit, full edit payload, scoped related validation, preserved hidden related links and action-state errors. Preserve `relatedRecords`, `relatedApprovals`, `relatedTasks` when adding new meeting patch functions.
- Story 6.3 review patches made `updatedBy` mandatory and audit notes safe. Follow that standard for all 6.4 mutations.
- Current worktree is dirty with many uncommitted Story 4/5/6 changes. Read current local files before editing; do not reset or revert unrelated files.

### Implementation Guidance

- Prefer separate action panels on meeting detail over expanding `MeetingForm`; minutes/attachments/AI approval are detail workflows, while `MeetingForm` remains create/edit metadata.
- The cleanest minutes approval design is additive metadata, not changing `meetingMinutes` from string to object. This avoids breaking list/detail/forms/tests that already read `meetingMinutes ?? summary`.
- If AI draft content is copied into official minutes, require an explicit user action label such as "Dùng bản nháp AI làm biên bản" and still set minutes approval to `DRAFT` until approved.
- Attachment `documentId` means "meeting references an existing scoped document"; it must not create/update/delete the document.
- Attachment `url` means external URL metadata. Do not attempt Supabase signed upload/download in this story unless existing storage actions already exist by the time dev starts.
- Audit event names should be dot-case, e.g. `meeting.minutes_updated`, `meeting.minutes_approved`, `meeting.attachment_added`, `meeting.attachment_removed`, `meeting.ai_summary_draft_updated`, `meeting.ai_summary_approved`.

### UX Requirements

- Vietnamese-first labels, helper text and validation errors.
- Badge/status text must be explicit: "Bản nháp", "Đã duyệt", "Bản nháp AI"; do not rely on color only.
- Permission denial must not reveal hidden attachment names, document titles, raw minutes, raw transcript or AI draft outside scope.
- One primary action per panel. Secondary actions such as remove/download/open document should be lower emphasis.
- Mobile layout stacks panels cleanly; long Vietnamese labels/content wrap within container.
- Empty state distinguishes "chưa có attachment/minutes" from "không có quyền".

### Out Of Scope

- Real Supabase Storage binary upload, signed upload URL, signed download URL and production storage hardening.
- Real video call, transcript ingestion, speech-to-text or meeting recording pipeline.
- New AI provider integration or hosted AI/search jobs.
- Automatic follow-up task creation; Story 6.5 owns follow-up actions linked to tasks.
- Official decision tracking after meeting; Story 6.6 owns decision tracking.
- Broad redesign of meeting form, dashboard, command center or approval workflow.

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-6-one-meeting-engine-cho-iu-hnh.md`]
- [Source: `_bmad-output/implementation-artifacts/spec-one-meeting-engine-types-schema-mock-ui.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/design-system-foundation.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]
- [Source: `docs/context/meetings.md`]
- [Source: `docs/context/permissions-audit.md`]
- [Source: `docs/context/testing.md`]
- [Source: `_bmad-output/implementation-artifacts/6-1-meeting-engine-types-scope-va-repository-contract.md`]
- [Source: `_bmad-output/implementation-artifacts/6-2-meeting-list-filters-va-executive-visibility.md`]
- [Source: `_bmad-output/implementation-artifacts/6-3-tao-va-sua-meeting-voi-related-records.md`]
- [Source: `src/modules/meetings/types.ts`]
- [Source: `src/modules/meetings/constants.ts`]
- [Source: `src/modules/meetings/validation.ts`]
- [Source: `src/modules/meetings/actions.ts`]
- [Source: `src/modules/meetings/services/meeting-service.ts`]
- [Source: `src/modules/meetings/services/meeting-repository.ts`]
- [Source: `src/app/(dashboard)/meetings/[meetingId]/page.tsx`]
- [Source: `src/lib/permissions/can.ts`]
- [Source: `src/lib/permissions/scoped-resources.ts`]
- [Source: `src/lib/storage/README.md`]
- [Source: `src/lib/storage/document-storage.ts`]
- [Source: `src/modules/ai/services/ai-gateway-service.ts`]
- [Source: `src/modules/ai/services/ai-action-proposal-service.ts`]
- [Source: `database/migrations/202605230001_add_meeting_engine_fields.sql`]
- [Source: `tests/unit/meeting-service.test.ts`]
- [Source: `tests/unit/meeting-actions.test.ts`]
- [Source: `tests/unit/meeting-form.test.tsx`]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-06-03: RED targeted tests failed as expected for missing 6.4 service/action/component contracts.
- 2026-06-03: `npm test -- tests/unit/meeting-service.test.ts tests/unit/meeting-actions.test.ts tests/unit/meeting-detail-panels.test.tsx` -> passed 44 tests.
- 2026-06-03: `npm run typecheck` -> passed.
- 2026-06-03: `npm run lint` -> passed.
- 2026-06-03: `npm test` -> passed 85 test files / 591 tests.
- 2026-06-03: `git diff --check` for touched story/code/test/migration paths -> no whitespace errors; Git emitted LF/CRLF warnings only.
- 2026-06-03: Code review patches applied for all 7 patch findings.
- 2026-06-03: `npm test -- tests/unit/meeting-service.test.ts tests/unit/meeting-actions.test.ts tests/unit/meeting-detail-panels.test.tsx` -> passed 3 files / 50 tests.
- 2026-06-03: `npm run typecheck` -> passed after review patches.
- 2026-06-03: `npm run lint` -> passed after review patches.
- 2026-06-03: `npm test` -> passed 85 test files / 597 tests after review patches.
- 2026-06-03: `git diff --check` for touched story/code/test paths -> no whitespace errors; Git emitted LF/CRLF warnings only.
- 2026-06-03: `npm test -- tests/unit/meeting-actions.test.ts` -> passed 1 file / 16 tests after final action message cleanup.
- 2026-06-03: `npm run lint` -> passed after final action message cleanup.
- 2026-06-03: final `git diff --check` for touched story/code/test paths -> no whitespace errors; Git emitted LF/CRLF warnings only.

### Completion Notes List

- Added additive meeting minutes approval metadata with default `DRAFT`, Supabase JSONB migration, JSON/Supabase mapper and patch parity.
- Added focused meeting service mutations for minutes update/approval, attachment add/remove, AI summary draft update and AI summary approval with actor-required guards and safe audit notes.
- Added Server Actions that enforce scoped meeting access, `meeting.update`, scoped document validation, binary upload rejection and route revalidation without inventing new permissions.
- Added meeting detail panels for official minutes, attachments and AI summary draft/approval, while filtering document-backed attachments through scoped document access before render.
- Added service, action and component tests covering draft/approved states, audit safety, unsupported binary upload, out-of-scope document rejection, mapper parity and permission-aware UI.
- Review patches now reset minutes approval for summary-only and generic-edit content changes, write explicit Supabase clears as null, reject unsafe attachment URL schemes and zero-byte binary uploads, and cover legacy minutes approval defaults.

### File List

- _bmad-output/implementation-artifacts/6-4-minutes-attachments-va-ai-summary-draft.md
- _bmad-output/implementation-artifacts/deferred-work.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- database/migrations/202606030002_add_meeting_minutes_approval.sql
- src/app/(dashboard)/meetings/[meetingId]/page.tsx
- src/modules/meetings/actions.ts
- src/modules/meetings/components/meeting-detail-panels.tsx
- src/modules/meetings/services/meeting-repository.ts
- src/modules/meetings/services/meeting-service.ts
- src/modules/meetings/types.ts
- src/modules/meetings/validation.ts
- tests/unit/meeting-actions.test.ts
- tests/unit/meeting-detail-panels.test.tsx
- tests/unit/meeting-service.test.ts

### Change Log

- 2026-06-03: Story created and marked ready-for-dev.
- 2026-06-03: Implemented minutes approval, attachment metadata, AI summary draft approval flow and marked ready for review.
- 2026-06-03: Applied code review patches, validated full suite and marked story done.
