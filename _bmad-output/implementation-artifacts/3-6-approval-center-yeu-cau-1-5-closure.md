# Story 3.6: Approval Center Closure Theo Yeu Cau 1.5

Status: done

Ghi chu tao story: Story nay duoc tao sau review yeu cau 1.5 Approval Center de dong cac gap con lai truoc khi sign-off MVP: attachment la metadata bat buoc, deadline bat buoc cho approval dang mo, overdue alert/escalation phai queue that qua mock outbox/audit, va xu ly dut diem `leadership_approval` placeholder/legacy trong Approval Center. Khong tao approval engine rieng, khong them real email/calendar/push notification, khong implement binary Supabase Storage upload, khong mo rong Truc 2/3 ngoai placeholder MVP.

Requirements Covered: FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, FR-038, FR-039, FR-040, FR-041, FR-042, FR-043, NFR-005, NFR-006, NFR-008, UX-DR11, UX-DR13, UX-DR15, UX-DR21, UX-DR22.

## Story

As a lanh dao hoac nguoi duyet co tham quyen,
I want Approval Center dap ung day du metadata bat buoc, attachment, deadline, alert qua han va source type nhat quan,
so that MVP 1.5 co the nghiem thu ma khong con placeholder gay nham lan hoac approval thieu du lieu dieu hanh.

## Tieu Chi Chap Nhan

1. **Attachment la truong bat buoc trong approval Truc 1**
   - Given user tao hoac submit approval Truc 1 tren Proposal/Approval backbone
   - When request khong co attachment metadata hop le
   - Then validation chan submit vao Approval Center va hien loi tieng Viet gan truong attachment.
   - And attachment hop le gom toi thieu `name` va mot trong `documentId` scoped hoac `externalUrl`/`url` hop le; binary upload that tra loi ro rang vi Supabase Storage upload chua trong scope.
   - And approval detail/queue/history expose `attachments`/`attachmentCount` bang DTO serializable, khong chi la `linkedSources`.
   - And attachment/document ngoai scope hoac thieu quyen khong duoc serialize title/url; UI hien permission/empty state ro rang.

2. **Deadline bat buoc cho approval dang mo**
   - Given proposal co the vao approval queue (`submitted`, `in_review`, `change_requested`, `on_hold`)
   - When tao, submit, forward, return hoac hold approval
   - Then `dueDate` la bat buoc va phai la date-only hop le `YYYY-MM-DD`.
   - And Approval Center khong con hien open approval hop le voi label `No due date`.
   - And legacy/mock record dang mo thieu deadline phai duoc danh dau "Thieu deadline" va khong duoc coi la approval dat chuan sign-off cho den khi duoc backfill hoac sua.
   - And final statuses (`approved`, `rejected`, `cancelled`, `archived`) khong bi ep mutate deadline khi chi render read-only history.

3. **Overdue alert va escalation queue that tren duong Approval Center**
   - Given approval dang mo qua deadline hoac cham nguong escalation policy
   - When user load `/command-center?view=executive-approvals` hoac `/approvals/proposal/:id`
   - Then service queue/upsert mock notification outbox idempotent voi source, policy, trigger, severity, recipients, next action va status.
   - And audit chi ghi khi outbox moi hoac state thay doi, khong ghi moi tren moi lan GET neu state khong doi.
   - And recipients toi thieu gom current approver, proposer/requester, Thu ky/Tro ly lien quan trong scope, va escalation target theo policy neu co.
   - And dashboard proposal-backed approval escalation phai truyen `currentApprover` tu current approval step de khong mat nguoi duyet hien tai.

4. **`leadership_approval` legacy duoc xu ly dut diem**
   - Given MVP Approval Center Truc 1 dung Proposal/Approval backbone
   - When build queue/detail/action cho Approval Center
   - Then `leadership_approval` khong xuat hien nhu mot actionable Truc 1 approval.
   - And route `/approvals/[sourceType]/[sourceId]` chi chap nhan source type co detail/action duoc support; source type legacy phai bi redirect/404/empty state ro rang, khong tao queue item khong mo duoc.
   - And neu van can mock leadership approval cho dashboard demo khac, no phai duoc tach khoi Approval Center actionable queue hoac gan nhan placeholder read-only o dung khu vuc, khong tron voi Truc 1 approvals.
   - And tests cover queue khong con item `sourceType: "leadership_approval"` trong Approval Center Truc 1.

5. **Approval detail dap ung contract bat buoc cua yeu cau 1.5**
   - Given user co quyen xem approval detail
   - When mo detail
   - Then detail co proposer, reviewer/current approver, status, deadline, comment/notes, attachments, result/outcome, audit/history va workflow tiep theo.
   - And `workflow tiep theo` phai ro: available action neu user co quyen, disabled/readonly reason neu khong co quyen hoac status final, va next step/policy neu approval con dang mo.
   - And finance amount, attachment URL, audit raw old/new value van bi redact theo permission hien co.

6. **Repository, migration va mock/Supabase parity**
   - Given app chay file-backed mode hoac Supabase-ready mode
   - When proposal approval co attachments, required deadline va notification outbox
   - Then JSON repository va Supabase mapper dung cung contract/domain defaults.
   - And migration moi la additive, khong sua migration cu; DB naming snake_case, TypeScript camelCase.
   - And notification outbox source type/RLS phai khop voi code thuc te, bao gom khong tao source type code khong duoc DB chap nhan.

7. **Regression va UX**
   - Given viewport 360/390/430/768/1280
   - When xem Approval Center va Approval Detail
   - Then attachment/deadline/overdue/escalation labels wrap dung, khong overlap, khong phu thuoc mau sac de hieu severity.
   - And server validation loi attachment/deadline hien gan field lien quan thay vi chi throw/redirect mat ngu canh.
   - And cac regression Story 3.1-3.5 van giu: scope filter, finance redaction, action permission, delegated approval guard, audit timeline va idempotent escalation.

## Tasks / Subtasks

- [x] Mo rong approval attachment contract tren Proposal backbone (AC: 1, 5, 6)
  - [x] Them type `ProposalAttachment` hoac contract tuong duong trong `src/modules/proposals/types.ts` voi fields toi thieu: `id`, `proposalId`, `name`, optional `url`/`externalUrl`, optional `documentId`, optional `source`, `uploadedBy`, `uploadedAt`, `createdAt`.
  - [x] Them `attachments: ProposalAttachment[]` vao `ProposalDetail` va attachment summary vao `ApprovalCenterQueueItem`/`ApprovalCenterDetailData`.
  - [x] Neu can gan attachment voi decision/action history, them optional `attachmentIds` vao `ProposalDecision` hoac event DTO thay vi dump raw file data vao audit.
  - [x] Reuse document/meeting attachment pattern: external URL hoac scoped `documentId`; khong implement binary upload provider moi.

- [x] Them repository va migration parity cho proposal attachments (AC: 1, 6)
  - [x] Cap nhat `src/modules/proposals/services/proposal-repository.ts` JSON store de read/write attachments cung proposal detail.
  - [x] Them migration additive, vi du `database/migrations/YYYYMMDDNNNN_add_proposal_attachments.sql`, voi table/column snake_case, FK cascade theo proposal va index theo `proposal_id`.
  - [x] Supabase mapper phai default legacy attachments ve `[]` va khong lam mat `links`, `steps`, `decisions`.
  - [x] Neu dung `proposal_links` de lien ket document, van can attachment metadata rieng hoac mapper enrich an toan; khong coi `linkedSources` hien co la du thay cho file dinh kem.

- [x] Validation deadline va attachment khi tao/submit approval (AC: 1, 2, 7)
  - [x] Cap nhat `src/modules/proposals/validation.ts` de `dueDate` bat buoc cho approval submit/open-state mutations; date-only hop le va trim input.
  - [x] Them schema attachment input voi `name` bat buoc, `documentId` hoac URL hop le, va binary file/blob unsupported message.
  - [x] Cap nhat `src/modules/proposals/actions.ts` va proposal/approval forms lien quan de tra validation state gan field, khong chi `parse()` roi throw neu user submit thieu attachment/deadline.
  - [x] Legacy/draft proposal co the thieu deadline/attachment, nhung khong duoc submit vao queue dang mo neu thieu hai truong nay.

- [x] Hien attachment va deadline compliance trong Approval Center/detail (AC: 1, 2, 5, 7)
  - [x] Update `src/modules/proposals/services/approval-center-service.ts` de build queue/detail co `attachments`, `attachmentCount`, `deadlineCompliance` hoac field tuong duong.
  - [x] `resolveDueGroup` khong duoc tra "No due date" cho open approval dat chuan; record thieu deadline phai co state rieng de UI/noi dung nghiem thu nhan ra.
  - [x] Update `src/modules/executive/components/approval-center.tsx` va `approval-request-detail.tsx` de hien attachment list/count, missing states, deadline required state va no-leak permission states.
  - [x] History timeline hien file dinh kem lien quan den approval/action neu co, nhung khong hien URL/title ngoai scope.

- [x] Queue overdue notification/outbox that tren Approval Center paths (AC: 3, 6)
  - [x] Trong `src/modules/command-center/services/command-center-service.ts`, truyen `queueEscalationNotifications: true`, `notificationRepository` va `auditWriter`/audit dependency phu hop khi goi `getApprovalCenterData`.
  - [x] Trong `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx`, goi `getApprovalCenterDetailData` voi dependency de detail first-load cung upsert outbox/audit idempotent.
  - [x] Giu `maybeQueueEscalationNotification` pure/idempotent: khong duplicate outbox, khong audit moi neu state khong doi.
  - [x] Sua `src/modules/dashboard/services/executive-dashboard-service.ts` de proposal-backed escalation truyen `currentApprover` tu current step, giong pattern trong Approval Center service.
  - [x] Sua migration/contract `notification_outbox.source_type` neu code co source type khong nam trong DB check constraint, hoac khong emit source type do.

- [x] Remove/tach `leadership_approval` khoi Approval Center actionable queue (AC: 4, 5, 7)
  - [x] Quyet dinh implementation trong code: Approval Center Truc 1 queue chi dung `sourceType: "proposal"`; bo `buildLeadershipItems` khoi `getApprovalCenterData` hoac chi render thanh placeholder read-only khong co href/action.
  - [x] Cap nhat `ApprovalCenterSourceType`, route guard va tests de khong co queue item mo detail/action nhung service detail lai reject.
  - [x] Neu dashboard/executive mock approvals van can `leadership_approval`, giu no trong dashboard DTO rieng va label placeholder ro, khong tron voi Approval Center Truc 1 sign-off data.
  - [x] Update seed/demo data de Truc 1 acceptance dung proposal-backed approvals cho tat ca category: ho so/van ban, finance, legal, technical, strategic, meeting.

- [x] Dam bao required approval detail contract va workflow tiep theo (AC: 5, 7)
  - [x] `ApprovalCenterDetailData` phai co proposer, reviewer/current approver, status, deadline, comment/notes, attachments, result/outcome, audit/history va workflow next state/action.
  - [x] `availableActions`/disabled reason can hien du state cho user co quyen xem detail nhung khong co quyen action; khong leak data cho unauthorized user.
  - [x] Action outcomes reject/return/cancel van bat buoc reason; approve comment optional; hold/forward/ask meeting comment recommended, giu server authority.

- [x] Tests bat buoc (AC: 1-7)
  - [x] Unit tests attachment contract/repository mapper: JSON + Supabase row parity, scoped document attachment allowed, out-of-scope document hidden/rejected, external URL validation, binary upload unsupported.
  - [x] Unit tests deadline required: create/submit/open-state mutation thieu dueDate fail; legacy final record thieu dueDate van render read-only; open record thieu deadline duoc flag.
  - [x] Unit tests Approval Center data/detail: attachments hien dung, `No due date` khong xuat hien cho open compliant approvals, no-leak finance/attachment/audit.
  - [x] Unit tests notification/outbox: command center Approval Center load and detail load upsert idempotent; dashboard proposal escalation includes current approver; audit only on change.
  - [x] Unit/component tests `leadership_approval`: khong con actionable Truc 1 queue item, detail unsupported co empty/404 behavior ro.
  - [x] Component tests Approval Center/detail responsive-safe labels for attachment, missing deadline, overdue/escalation.
  - [x] Chay `npm run typecheck`, `npm run lint`, `npm run test`; chay `npm run test:e2e` neu route/UI Approval Center thay doi.

### Review Findings

- [x] [Review][Patch] [High] Attachment name and field-level validation can be bypassed through Server Action parsing [src/modules/proposals/actions.ts:69]
- [x] [Review][Patch] [High] Document attachment scope/redaction is not enforced end-to-end for create, approval detail, and proposal detail [src/modules/proposals/services/approval-center-service.ts:599]
- [x] [Review][Patch] [High] Supabase proposal attachment mapper/runtime parity is missing despite adding the DB table [src/modules/proposals/services/proposal-repository.ts:281]
- [x] [Review][Patch] [Critical] `proposal_attachments` RLS and source/reference constraints are too broad for scoped attachment data [database/migrations/202606070002_add_proposal_attachments.sql:56]
- [x] [Review][Patch] [High] Notification outbox source-type migration adds `risk` without source-specific RLS parity [database/migrations/202606070001_align_notification_outbox_source_types.sql:4]
- [x] [Review][Patch] [Medium] Archived approval details are excluded instead of rendering read-only history [src/modules/proposals/services/approval-center-service.ts:116]
- [x] [Review][Patch] [Medium] Approval history DTO still omits attachment linkage despite adding attachmentIds [src/modules/proposals/services/approval-center-service.ts:948]
- [x] [Review][Patch] [Medium] `externalUrl`/`external_url` contract is migrated but not supported by TS validation or service mapping [src/modules/proposals/types.ts:52]
- [x] [Review][Patch] [Medium] Legacy unsafe attachment URLs can still render as clickable hrefs [src/modules/proposals/services/approval-center-service.ts:572]
- [x] [Review][Patch] [Low] Disabled Approval Action Panel branch renders mojibake heading and aria label [src/modules/executive/components/approval-action-panel.tsx:155]
- [x] [Review][Patch] [Low] E2E evidence remains failing after Approval Center/detail route and UI changes [_bmad-output/implementation-artifacts/3-6-approval-center-yeu-cau-1-5-closure.md:298]

## Dev Notes

### Current Code State (Read Before Editing)

- `src/modules/proposals/services/approval-center-service.ts` da co `queueEscalationNotifications?: boolean`, nhung `maybeQueueEscalationNotification` no-op khi option nay false. `getApprovalCenterData` tu Command Center hien chua truyen option/dependencies nay, nen Approval Center path chua tao outbox/audit that.
- `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx` dang reject non-proposal source type som va goi `getApprovalCenterDetailData` khong truyen notification repository/audit writer. Detail source type khac queue item se khong mo duoc.
- `src/modules/proposals/services/approval-center-service.ts` hien co `buildLeadershipItems` tao queue item `sourceType: "leadership_approval"`, trong khi `getApprovalCenterDetailData` chi support `sourceType === "proposal"`. Day la gap legacy/placeholder can xu ly dut diem.
- `src/modules/dashboard/services/executive-dashboard-service.ts` proposal-backed escalation queue dang resolve recipients nhung thieu `currentApprover` trong mot path; Approval Center service da co pattern truyen `currentApprover` tu current step.
- `src/modules/executive/types/index.ts#ApprovalCenterDetailData` hien co `linkedSources` va `history`, chua co `attachments` first-class cho approval detail. File nay co `attachments: string[]` o contract executive/leadership khac, khong phai proposal approval detail.
- `src/modules/proposals/types.ts#ProposalLink` chi co `entityType`, `entityId`, `relationType`, `createdAt`; khong co ten file, URL, document metadata, uploadedBy/uploadedAt. Khong nen coi `ProposalLink` hien tai la du de dap ung "file dinh kem".
- `src/modules/proposals/types.ts` va `src/modules/proposals/validation.ts` dang de `dueDate?: string`/`dueDate: optionalText`; can thay doi co dieu kien de draft/legacy an toan nhung approval dang mo khong thieu deadline.
- `src/modules/executive/components/approval-action-panel.tsx` dang render direct Server Action forms va filter `enabledActions`; neu them validation attachment/deadline, can hien error gan field/action state thay vi chi throw server error.
- `src/lib/notifications/types.ts` co source type `"risk"` trong code, nhung migration `202605290003_add_approval_escalation_policy_and_notification_outbox.sql` check constraint hien chi cho `proposal`, `leadership_approval`, `executive_action`. Neu story cham notification schema, sua parity nay hoac dam bao code khong emit source type bi DB reject.
- `src/lib/storage/document-storage.ts` co `assertStorageUploadNotImplemented()`. Pattern hien tai la metadata/external URL/scoped document, khong real binary upload.
- `src/modules/meetings/types.ts` co `MeetingAttachment { id, name, url?, documentId?, source?, uploadedBy?, uploadedAt? }` va Story 6.4 da xu ly attachment metadata + external URL/scoped document. Reuse semantic pattern, khong copy meeting service vao proposals.

### Suggested Data Contract

Names co the dieu chinh theo codebase, nhung semantic phai du:

```ts
export type ProposalAttachment = {
  id: EntityId;
  proposalId: EntityId;
  name: string;
  url?: string;
  externalUrl?: string;
  documentId?: EntityId;
  source?: "document" | "external_url";
  uploadedBy?: EntityId;
  uploadedAt?: string;
  createdAt: string;
};

export type ApprovalDeadlineCompliance =
  | "valid"
  | "missing_required"
  | "invalid"
  | "not_applicable";
```

DTO guidance:
- `ProposalDetail.attachments: ProposalAttachment[]`.
- `ApprovalCenterQueueItem.attachmentCount`, optional `attachmentsHiddenReason`, optional `deadlineCompliance`.
- `ApprovalCenterDetailData.attachments: ApprovalCenterDetailAttachment[]`.
- Audit/history chi nen luu/count/link safe summary, khong raw URL/title ngoai scope.

### Architecture Compliance

- Flow dung pattern route/action -> permission/auth -> service -> repository -> DTO. Components khong goi Supabase/repository truc tiep.
- Internal mutations dung Server Actions trong `src/modules/proposals/actions.ts`; khong tao REST endpoint moi.
- Proposal/Approval backbone la source of truth cho Approval Center Truc 1; khong tao `approval-service` doc lap hoac parallel workflow.
- Permission/scope filter phai chay truoc DTO serialization, dac biet attachment URL/document title, finance amount va audit old/new values.
- DB dung snake_case, TypeScript dung camelCase; migrations additive trong `database/migrations/YYYYMMDDNNNN_*.sql`.
- Mock/file-backed va Supabase-ready mapper phai parity. Khi them field domain, test ca JSON va Supabase mapping.
- NFR-008: khong hardcode role, approver, threshold, risk group. Deadline required la rule cua approval contract; escalation threshold van lay tu policy/config.

### UX Guardrails

- Approval Center la operational UI: dense, scan nhanh, khong hero/landing/card redesign.
- Attachment, missing deadline, overdue severity, escalation target/status phai co text label; khong dua vao mau sac.
- Vietnamese-first labels and validation: "File dinh kem la bat buoc.", "Deadline la bat buoc.", "Storage upload chua duoc ho tro trong MVP." hoac wording tuong duong.
- Mobile 360/390/430: badges/actions/list attachment wrap, khong horizontal overflow, button/form target giu ergonomic.
- Permission hidden state phai phan biet "khong co file", "thieu file bat buoc", va "khong co quyen xem file".

### Previous Story Intelligence

- Story 3.1 established scoped queue, axis tabs, category mapping va finance redaction. Khong pha Truc 2/3 placeholder.
- Story 3.2 established proposal detail route/DTO, selected `scopeId` preservation, direct URL unauthorized behavior va linked source placeholder.
- Story 3.3 established Approval Action Panel, action validation/permission guard, delegated approval guard va action outcomes. Do not bypass service guards.
- Story 3.4 established history/version/audit timeline va raw audit redaction. Attachment audit phai follow safe-summary pattern.
- Story 3.5 established overdue/escalation resolver, policy threshold, delegation target resolver va mock notification outbox, nhung review phat hien Approval Center route chua queue outbox that va dashboard proposal path thieu current approver.
- Current worktree co the dang dirty. Read current local files before editing and do not revert unrelated changes.

### File Targets

Expected UPDATE:
- `src/modules/proposals/types.ts`
- `src/modules/proposals/validation.ts`
- `src/modules/proposals/actions.ts`
- `src/modules/proposals/services/proposal-service.ts`
- `src/modules/proposals/services/proposal-repository.ts`
- `src/modules/proposals/services/approval-center-service.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/executive/components/approval-center.tsx`
- `src/modules/executive/components/approval-request-detail.tsx`
- `src/modules/executive/components/approval-action-panel.tsx`
- `src/modules/command-center/services/command-center-service.ts`
- `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/lib/notifications/types.ts`
- `src/lib/notifications/notification-service.ts`
- `database/migrations/202605290003_add_approval_escalation_policy_and_notification_outbox.sql` only if an additive follow-up migration cannot solve source type parity; prefer new migration where possible.

Expected NEW:
- `database/migrations/YYYYMMDDNNNN_add_proposal_attachments.sql`
- Tests under `tests/unit/approval-center-service.test.ts`, `tests/unit/approval-center-detail-service.test.ts`, `tests/unit/proposal-service.test.ts`, `tests/unit/proposal-actions.test.ts`, `tests/unit/notification-outbox-service.test.ts`, `tests/unit/executive-dashboard-service.test.ts`, and component tests for Approval Center/detail.

Avoid unless truly needed:
- Real Supabase Storage binary upload, signed upload/download URL or storage provider adapter.
- Real email/calendar/push notification channel.
- New global state library, notification library or form library.
- Broad refactor of Executive Dashboard, Risk Center, Meeting Engine or Decision Center.
- Keeping `leadership_approval` as a silent actionable item in Truc 1 queue.

### Testing Guidance

Targeted red/green suggestions:

```bash
npm run test -- tests/unit/proposal-service.test.ts tests/unit/proposal-actions.test.ts
npm run test -- tests/unit/approval-center-service.test.ts tests/unit/approval-center-detail-service.test.ts
npm run test -- tests/unit/notification-outbox-service.test.ts tests/unit/executive-dashboard-service.test.ts
npm run test -- tests/unit/approval-request-detail.test.tsx
```

Full validation before dev marks complete:

```bash
npm run typecheck
npm run lint
npm run test
```

Run E2E if route/UI behavior changes materially:

```bash
npm run test:e2e
```

### References

- [Source: `_bmad-output/planning-artifacts/epics/epic-3-approval-center-trn-proposalapproval-backbone.md`]
- [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]
- [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- [Source: `_bmad-output/project-context.md`]
- [Source: `docs/context/permissions-audit.md`]
- [Source: `docs/context/testing.md`]
- [Source: `_bmad-output/implementation-artifacts/3-1-approval-center-scoped-queue-va-axis-tabs.md`]
- [Source: `_bmad-output/implementation-artifacts/3-2-approval-detail-cho-request-truc-1.md`]
- [Source: `_bmad-output/implementation-artifacts/3-3-approval-actions-voi-validation-va-permission.md`]
- [Source: `_bmad-output/implementation-artifacts/3-4-approval-history-version-va-audit.md`]
- [Source: `_bmad-output/implementation-artifacts/3-5-approval-qua-han-va-escalation-theo-policy.md`]
- [Source: `_bmad-output/implementation-artifacts/6-4-minutes-attachments-va-ai-summary-draft.md`]
- [Source: `src/modules/proposals/services/approval-center-service.ts`]
- [Source: `src/modules/proposals/services/proposal-repository.ts`]
- [Source: `src/modules/proposals/types.ts`]
- [Source: `src/modules/proposals/validation.ts`]
- [Source: `src/modules/executive/types/index.ts`]
- [Source: `src/modules/command-center/services/command-center-service.ts`]
- [Source: `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx`]
- [Source: `src/modules/dashboard/services/executive-dashboard-service.ts`]
- [Source: `src/lib/notifications/types.ts`]
- [Source: `src/lib/storage/document-storage.ts`]
- [Source: `src/modules/meetings/types.ts`]

### Checklist Validation Notes

- Story maps the four priority gaps to ACs and tasks: attachment, required deadline, real overdue outbox/audit, and `leadership_approval` closure.
- Current code state and risky files are documented to prevent duplicate approval flow or wrong module edits.
- Architecture, permission/audit, storage, notification and testing guardrails are included.
- Scope boundaries are explicit: mock outbox yes, real notification no; attachment metadata yes, binary upload no; Truc 2/3 placeholder yes, actionable legacy source no.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/proposal-service.test.ts tests/unit/proposal-actions.test.ts tests/unit/proposal-approval-actions-service.test.ts tests/unit/approval-center-service.test.ts tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx tests/unit/executive-dashboard-service.test.ts tests/unit/notification-outbox-service.test.ts tests/unit/approval-detail-page.test.tsx` - PASS, 9 files / 74 tests.
- `npm run typecheck` - PASS.
- `npm run lint` - PASS.
- `npm run test` - PASS, 100 files / 733 tests.
- `npm run test:e2e` - PASS, 65 tests.

### Completion Notes List

- Added first-class proposal attachment metadata contract, JSON repository persistence/defaults, proposal form input, detail rendering, queue attachment counts and detail attachment DTOs with scoped document redaction.
- Enforced required date-only deadline and at least one valid attachment before proposals enter or mutate through open approval states; unsupported binary uploads return explicit MVP messaging.
- Wired Approval Center command-center and detail loads to queue mock overdue escalation notifications/audit idempotently, and passed current approver into dashboard proposal escalation context.
- Removed legacy `leadership_approval` from the actionable Approval Center queue and service input contract; Axis 1 queue is proposal-backed, while Truc 2/3 remain MVP placeholders and non-proposal detail routes 404.
- Added additive migrations for proposal attachments and notification outbox source-type parity.
- Applied all 11 code-review patches: attachment validation/redaction, Supabase mapper parity, RLS/source constraints, notification outbox RLS parity, archived detail/read-only history, attachment-linked audit DTOs, externalUrl handling, safe href rendering, disabled action panel copy, and E2E selector evidence.

### File List

- `database/migrations/202606070001_align_notification_outbox_source_types.sql`
- `database/migrations/202606070002_add_proposal_attachments.sql`
- `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/executive/components/approval-action-panel.tsx`
- `src/modules/executive/components/approval-center.tsx`
- `src/modules/executive/components/approval-request-detail.tsx`
- `src/modules/executive/types/index.ts`
- `src/modules/proposals/actions.ts`
- `src/modules/proposals/components/proposal-detail.tsx`
- `src/modules/proposals/components/proposal-form.tsx`
- `src/modules/proposals/services/approval-center-service.ts`
- `src/modules/proposals/services/proposal-repository.ts`
- `src/modules/proposals/services/proposal-service.ts`
- `src/modules/proposals/types.ts`
- `src/modules/proposals/validation.ts`
- `tests/unit/ai-action-proposal-service.test.ts`
- `tests/unit/ai-approval-assistant-service.test.ts`
- `tests/unit/approval-center-detail-service.test.ts`
- `tests/unit/approval-center-service.test.ts`
- `tests/unit/approval-detail-page.test.tsx`
- `tests/unit/approval-request-detail.test.tsx`
- `tests/unit/decision-record-service.test.ts`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/history-archive-service.test.ts`
- `tests/unit/notification-outbox-service.test.ts`
- `tests/unit/proposal-actions.test.ts`
- `tests/unit/proposal-approval-actions-service.test.ts`
- `tests/unit/proposal-service.test.ts`
- `tests/e2e/mvp-smoke.spec.ts`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-06-07 | 1.2 | Applied all code-review patches and restored full typecheck/lint/unit/E2E green evidence. | Codex |
| 2026-06-07 | 1.1 | Implemented Story 3.6 attachment/deadline contract, real overdue outbox wiring, proposal-backed Approval Center cleanup and validation coverage. | Codex |
| 2026-06-07 | 1.0 | Created closure story for Approval Center 1.5 attachment, required deadline, real overdue alert/outbox and leadership approval legacy cleanup. | Codex |
