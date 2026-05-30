# Story 3.4: Approval History, Version Va Audit

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay mo rong Approval Detail sau Story 3.3 de hien thi timeline/history/audit day du cho Proposal-backed approvals. Pham vi gom version/transition metadata cho approval decisions, audit timeline permission-aware, read-only final approval detail cho approved/rejected/cancelled, keyboard-accessible history/audit UI va regression no-leak. Khong tao approval flow rieng, khong tao global History Center cua Epic 7, khong tao real storage upload, khong lam overdue/escalation cua Story 3.5.

## Story

As a lanh dao hoac kiem soat vien duoc quyen,
I want xem history/audit cua approval,
so that moi quyet dinh duyet co the truy vet duoc.

## Tieu Chi Chap Nhan

1. **History luu actor, time, note, transition va version**
   - Given approval co submit/action thay doi trang thai
   - When action hoan tat
   - Then Proposal history luu actor, timestamp, decision/action, note/reason neu co, previous status, next status, previous step status, next step status va version.
   - And attachment/link lien quan hien trong timeline neu da ton tai qua `ProposalLink`; khong tao storage upload moi trong story nay.
   - And moi successful approval action tiep tuc ghi `AuditLog` voi old/new value nhu Story 3.3 da bat dau.

2. **Approval Detail co timeline history/audit doc duoc**
   - Given user mo approval detail hop le
   - When xem tab/section History/Audit
   - Then timeline hien decision, step transition, version va audit event theo thu tu thoi gian on dinh.
   - And moi event hien actor, action/status, time, note/reason, version neu co va old/new state neu duoc phep xem.
   - And DOM/focus order doc duoc bang keyboard; khong phu thuoc hover hay mau sac don thuan.

3. **Audit events chi hien khi co quyen audit**
   - Given user xem duoc approval detail nhung khong co `audit.view`
   - When mo History/Audit
   - Then approval history co the hien thong tin decision/step duoc phep xem, nhung raw audit events/oldValue/newValue bi an hoac thay bang permission state.
   - And serialized DTO/DOM khong chua audit action, oldValue, newValue hay chi tiet event audit.

4. **Final approval detail doc duoc de truy vet**
   - Given approval da `approved`, `rejected` hoac `cancelled`
   - When user co quyen truy cap detail/historical audit mo `/approvals/proposal/:id?scopeId=...`
   - Then detail tra read-only data va History/Audit timeline hien duoc.
   - And Approval Action Panel khong hien action enabled cho final statuses.
   - And Approval Center queue van khong hien final statuses.

5. **Permission/scope/no-leak regression duoc bao toan**
   - Given user ngoai scope, thieu `proposal.view`/approval grant, hoac thieu finance permission
   - When goi detail route truc tiep
   - Then service tra unauthorized/undefined truoc khi serialize title, amount, link, history hay audit cua record cam.
   - And user thieu `audit.view` khong thay audit events ngay ca khi co `proposal.view`.

6. **Mock/file-backed va Supabase parity**
   - Given app chay mock/file-backed mode hoac Supabase-ready mode
   - When approval decision/action duoc ghi
   - Then repository contract va migration cung luu duoc version/transition metadata.
   - And tests inject repository/audit data ma khong can Supabase live.

## Tasks / Subtasks

- [x] Thiet ke history/version contract tren Proposal backbone (AC: 1, 2, 6)
  - [x] Mo rong type trong `src/modules/proposals/types.ts` cho `ProposalDecision` hoac type lien quan de co `version`, `previousStatus`, `nextStatus`, `previousStepStatus`, `nextStepStatus`.
  - [x] Neu can attachment hien thi, map tu `ProposalLink` hien co thanh DTO `attachmentLinks`/`linkedSources`; khong tao upload/storage moi.
  - [x] Them type DTO trong `src/modules/executive/types/index.ts` cho timeline item, vi du `kind: "decision" | "step" | "audit" | "version"`, `version`, `previousStatus`, `nextStatus`, `auditLogId`.
  - [x] Giu DTO serializable: plain object/array, ISO string, optional field la `undefined`.

- [x] Persist version/transition metadata cho approval decisions (AC: 1, 6)
  - [x] Update `applyProposalApprovalAction` trong `src/modules/proposals/services/proposal-service.ts` de tinh version tiep theo tu existing decisions/history.
  - [x] Khi tao `ProposalDecision`, ghi previous/next proposal status va previous/next step status tu result cua action.
  - [x] `submitProposal` nen tao decision version dau tien hoac fallback version hop ly de timeline khong bi gap.
  - [x] Giu transaction-like write path `repository.applyApprovalMutation`; khong quay lai multi-write step/link/decision/proposal rieng.
  - [x] Existing wrappers `approveProposal`, `rejectProposal`, `requestProposalChange` van dung service chung.

- [x] Update repository va DB parity (AC: 1, 6)
  - [x] Update `ProposalRepository`/`JsonProposalRepository` read/write de preserve new decision metadata.
  - [x] Them migration moi, vi du `database/migrations/YYYYMMDDNNNN_extend_proposal_history_metadata.sql`, de add columns cho `proposal_decisions`: `version integer`, `previous_status text`, `next_status text`, `previous_step_status text`, `next_step_status text`.
  - [x] Them check constraint neu column status co enum-like values; dung snake_case trong DB va map camelCase trong repository neu co Supabase adapter.
  - [x] Khong sua destructive existing migration tru khi bat buoc; them migration incremental.

- [x] Build permission-aware history/audit DTO (AC: 2, 3, 4, 5)
  - [x] Update `getApprovalCenterDetailData` trong `src/modules/proposals/services/approval-center-service.ts` de build timeline tu decisions + steps + audit logs.
  - [x] Add `permissions.canViewAudit` vao `ApprovalCenterDetailData`.
  - [x] Audit source co the la `listAuditLogs`/`UserRepository` injection hoac `auditLogs` option; chi load/include audit details sau permission gate `can(user, "audit.view")` hoac scoped/catalog equivalent neu da co pattern.
  - [x] Filter audit logs theo `entityType: "proposal"` va `entityId: proposal.id`; khong dua audit cua entity khac vao DTO.
  - [x] Neu user thieu audit permission, return permission state/hidden reason thay vi audit events.
  - [x] Cho detail route doc final statuses `approved`, `rejected`, `cancelled` read-only, nhung giu queue status set chi gom mutable/in-queue statuses.
  - [x] Action availability van chi dung `detailActionStatuses` mutable (`submitted`, `in_review`, `on_hold`) va phai disabled/empty tren final statuses.

- [x] Update Approval Detail UI thanh history/audit timeline (AC: 2, 3, 4)
  - [x] Update `src/modules/executive/components/approval-request-detail.tsx` de thay History side card hien tai bang tab/section `History` va `Audit` ro rang.
  - [x] Neu tao component moi, dat trong `src/modules/executive/components/approval-history-timeline.tsx`; khong dat domain UI vao `src/components/ui`.
  - [x] Timeline item phai co accessible heading/text, khong chi icon/mau; use lucide icons neu co san va co `aria-hidden`.
  - [x] Hien old/new state bang text, vi du `in_review -> approved`; hien version badge/text neu co.
  - [x] Neu `canViewAudit=false`, hien concise permission state nhu `Audit events bi an theo quyen` va khong render raw event.
  - [x] Final approval detail nen hien read-only status va khong hien action panel controls.

- [x] Preserve route, scope va no-leak behavior (AC: 3, 4, 5)
  - [x] Update `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx` neu can pass audit logs/options vao detail service.
  - [x] Khong load/render audit data truoc khi detail permission/scope duoc xac nhan.
  - [x] Preserve `scopeId` trong back href va linked proposal href.
  - [x] Direct unauthorized detail phai tiep tuc render `UnauthorizedState` va khong serialize forbidden data.

- [x] Test coverage (AC: 1-6)
  - [x] Unit tests cho `applyProposalApprovalAction`: version tang, previous/next status/step status persisted, submit/action history khong gap.
  - [x] Unit tests cho `getApprovalCenterDetailData`: timeline merges decisions/steps/audit, sorts stable, includes audit only with `audit.view`, hides audit without leak.
  - [x] Unit tests cho final status detail: `approved/rejected/cancelled` detail returns read-only data but available actions disabled/empty; queue excludes final statuses.
  - [x] Component tests cho timeline/tab permission state, keyboard-readable DOM, no raw audit when `canViewAudit=false`.
  - [x] Regression tests for finance redaction, out-of-scope direct URL, linked source `scopeId`, existing action panel.
  - [x] Consider E2E smoke for `/approvals/proposal/:id` history/audit at 360/390/768/1280 if mock data is deterministic.

### Review Findings

- [x] [Review][Patch] Submit audit log omits old/new transition metadata and decision version [src/modules/proposals/actions.ts:149]
- [x] [Review][Patch] Existing decision rows are migrated with duplicate/non-monotonic version values [database/migrations/202605290002_extend_proposal_history_metadata.sql:3]
- [x] [Review][Patch] Final approval actions still redirect away from the now-readable final detail [src/modules/proposals/actions.ts:311]
- [x] [Review][Patch] Proposal links are rendered outside the History/Audit timeline [src/modules/proposals/services/approval-center-service.ts:717]
- [x] [Review][Defer] Delegated proposal creation bypasses domain-specific create guards [src/modules/proposals/services/proposal-service.ts:216] - deferred, pre-existing
- [x] [Review][Defer] Approval action writes can be stale under concurrent approvers [src/modules/proposals/services/proposal-repository.ts:174] - deferred, pre-existing

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 3 yeu cau Approval Center chung tren Proposal/Approval backbone, co xu ly action, policy/assignment, history/audit va overdue escalation. [Source: _bmad-output/planning-artifacts/epics.md:821]
- Story 3.4 la phan comprehensive history/audit sau Story 3.3. Story 3.3 chi ghi decision + audit toi thieu va deliberately khong lam full history UI.
- PRD FR-042 yeu cau Approval History luu actor, time, note, attachment, old/new status, version va audit log. [Source: _bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:255]
- NFR-006 yeu cau approval va cac mutation quan trong phai ghi audit log. [Source: _bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:491]
- UX spec dinh nghia Activity Timeline / Audit Trail gom actor, action, timestamp, previous/new state, comment va attachment. [Source: _bmad-output/planning-artifacts/ux-design-specification.md:729]

### Current Code State (Read Before Editing)

- `src/modules/proposals/services/proposal-service.ts` hien co `applyProposalApprovalAction`, validate scope/permission/current step, ghi `ProposalDecision`, update step/link/proposal qua `repository.applyApprovalMutation`, va return previous/next status/step metadata cho audit.
- `src/modules/proposals/actions.ts#applyApprovalDetailAction` hien tao audit log sau khi service action thanh cong voi event dot-case (`proposal.approved`, `proposal.forwarded`, ...) va old/new status/step trong audit payload.
- `src/modules/proposals/types.ts#ProposalDecision` hien co `decision`, `decidedBy`, `decidedAt`, `notes`, `stepId`; chua co `version`, previous/next status hoac attachment metadata.
- `src/modules/proposals/services/proposal-repository.ts` file-backed store co `proposals`, `steps`, `links`, `decisions`; `applyApprovalMutation` ghi all related approval mutation trong mot `writeStore`. File nay dang co mot so message loi bi mojibake; neu cham vao, sua gon va khong refactor ngoai story.
- `src/modules/proposals/services/approval-center-service.ts#buildHistory` hien chi merge decisions + decided steps, sort newest-first, va khong co audit logs/permission gate.
- `src/modules/proposals/services/approval-center-service.ts#getApprovalCenterDetailData` hien reject non-queue statuses qua `queueProposalStatuses`. Story nay can tach `queueProposalStatuses` va `detailProposalStatuses` de final statuses doc duoc read-only.
- `src/modules/executive/types/index.ts#ApprovalCenterDetailHistoryItem` hien chi co `kind: "decision" | "step"`, label, actorId, occurredAt, status, notes; can mo rong cho audit/version.
- `src/modules/executive/components/approval-request-detail.tsx` hien render Request summary, Linked sources, Policy, ApprovalActionPanel va mot History card don gian; chua co tab/section audit.
- `src/modules/executive/components/approval-action-panel.tsx` chi render enabled actions tu DTO; neu detail final status co `availableActions` disabled/empty thi panel se khong hien.
- `src/modules/users/services/user-service.ts` co `createAuditLog` va `listAuditLogs`; `src/modules/users/services/user-repository.ts` co JSON/Supabase repositories cho `audit_logs`.
- `src/modules/users/types.ts#AuditLog` co `actorId`, `entityType`, `entityId`, `action`, `oldValue`, `newValue`, `createdAt`; no actor name enrichment hien chua co.
- DB `audit_logs.entity_id` la uuid, trong khi `proposals.id` la text nhung cac id moi dung `randomUUID()`. Khong doi id strategy trong story nay.

### File Targets

Expected UPDATE:
- `src/modules/proposals/types.ts`
- `src/modules/proposals/services/proposal-service.ts`
- `src/modules/proposals/services/proposal-repository.ts`
- `src/modules/proposals/services/approval-center-service.ts`
- `src/modules/proposals/actions.ts` only if audit linking/payload needs adjustment; preserve existing action behavior.
- `src/modules/executive/types/index.ts`
- `src/modules/executive/components/approval-request-detail.tsx`
- `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx` if audit options must be loaded at route level.
- `tests/unit/proposal-approval-actions-service.test.ts`
- `tests/unit/approval-center-detail-service.test.ts`
- `tests/unit/approval-request-detail.test.tsx`
- `tests/unit/proposal-actions.test.ts` if action audit payload changes.

Expected NEW:
- `database/migrations/YYYYMMDDNNNN_extend_proposal_history_metadata.sql`
- `src/modules/executive/components/approval-history-timeline.tsx` if separating UI keeps `approval-request-detail.tsx` readable.
- Optional focused test file only if current files become too broad.

Avoid unless truly needed:
- Khong tao `approval-service` rieng ngoai Proposal module.
- Khong tao global History/Archive Center; Epic 7 owns cross-entity history/search/export.
- Khong tao real attachment upload/storage; Storage hardening la story rieng.
- Khong mo queue cho final statuses. Chi mo detail read-only/history.
- Khong hien audit old/new values cho user thieu `audit.view`.
- Khong add global state store, chart lib, table lib, tabs dependency moi.

### Suggested Data Contract

```ts
export type ProposalDecision = {
  id: EntityId;
  proposalId: EntityId;
  stepId?: EntityId;
  decision: "submitted" | "approved" | "rejected" | "change_requested" | "forwarded" | "meeting_requested" | "held" | "cancelled" | "archived";
  decidedBy: EntityId;
  decidedAt: string;
  notes?: string;
  version?: number;
  previousStatus?: ProposalStatus;
  nextStatus?: ProposalStatus;
  previousStepStatus?: ProposalStep["status"];
  nextStepStatus?: ProposalStep["status"];
};

export type ApprovalCenterDetailHistoryItem = {
  id: string;
  kind: "decision" | "step" | "audit" | "version";
  label: string;
  actorId?: string;
  occurredAt: string;
  notes?: string;
  version?: number;
  previousStatus?: string;
  nextStatus?: string;
  previousStepStatus?: string;
  nextStepStatus?: string;
  auditAction?: string;
  auditLogId?: string;
};
```

Implementation notes:
- Existing decisions without version should fallback to chronological index so old mock data still renders.
- Version should be monotonic per proposal, not global.
- Audit events are display-only in this story; `AuditLog` remains cross-cutting source for old/new raw payloads.

### Architecture Compliance

- Follow architecture flow: route -> permission/auth -> service DTO -> component; mutation -> action -> service validation -> repository -> audit/history -> revalidate. [Source: _bmad-output/planning-artifacts/architecture.md:413]
- Internal UI mutations stay in Server Actions; do not create REST endpoints for this story. [Source: _bmad-output/planning-artifacts/architecture.md:160]
- Domain code stays under `src/modules/proposals`; executive detail UI stays under `src/modules/executive/components`; shared primitives only under `src/components/ui/shared` if truly reusable. [Source: _bmad-output/planning-artifacts/architecture.md:223]
- DB uses snake_case; TypeScript DTO/domain uses camelCase; repository maps between them. [Source: _bmad-output/planning-artifacts/architecture.md:204]
- Permission/scope filtering must happen before DTO returns UI data. [Source: _bmad-output/planning-artifacts/architecture.md:50]
- Dot-case audit/action names remain (`proposal.approved`, `proposal.change_requested`, etc.). [Source: _bmad-output/planning-artifacts/architecture.md:252]

### UX Guardrails

- Timeline/audit is operational UI, not a marketing section. Keep it dense, scannable, and tied to the current approval.
- Use visible text for actor/action/status/version; do not rely on color alone.
- Use stable dimensions/responsive constraints so timeline items do not overlap action panel/detail content.
- Desktop may keep timeline in right rail or detail section; mobile stacks under summary/actions.
- `Timeline/audit phai doc duoc bang thu tu DOM hop ly.` [Source: _bmad-output/planning-artifacts/ux-design-specification.md:1081]
- If implementing tabs, tab labels must be keyboard reachable and have accessible names. If using a static section instead, it must still satisfy the History/Audit discoverability in AC2.

### Previous Story Intelligence

- Story 3.1: created scoped Approval Center queue and finance redaction. Do not leak out-of-scope records or finance amounts while adding history.
- Story 3.2: created read-only Approval Detail; review patches fixed selected `scopeId` preservation, non-queue status rejection, and invalid date fallback. Story 3.4 intentionally changes final status detail behavior; preserve no-leak and invalid date fallback.
- Story 3.3: created Approval Action Panel and Proposal-backed mutations. Code review patches fixed strict current-step permission, required current step, delegated context guard, forwarded approver enforcement, audit payload, migration metadata, and single approval mutation path.
- Story 3.3 final action redirects to Approval Center because final detail was unavailable. Story 3.4 should make final detail read-only available for traceability, but not re-enable mutation controls.
- Worktree is dirty with many unrelated files. Read current files before editing and do not revert unrelated changes.

### Git / Recent Work Intelligence

- Recent git log is sparse (`484589a 2205`, `a8162e3 first fcm`); local BMad story files and dirty worktree are the reliable source of truth.
- Current Story 3.3 changes are not necessarily committed. Use local files, not commit history, to infer current code.

### Latest Tech Notes

- Project baseline from `package.json`: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Zod `^3.24.4`, Vitest `^3.1.3`, Testing Library React `^16.3.0`, Playwright `^1.52.0`.
- No dependency upgrade is needed for this story.
- Prefer native Server Component/Server Action data flow and simple React local state for tabs. Do not introduce a new tabs or timeline package.

### Testing Guidance

- Red phase focused:
  - `npm run test -- tests/unit/proposal-approval-actions-service.test.ts tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx`
- Targeted regression:
  - `npm run test -- tests/unit/proposal-actions.test.ts tests/unit/approval-center-service.test.ts tests/unit/command-center-dashboard.test.tsx`
  - `npm run test -- tests/unit/proposal-service.test.ts`
- Static validation:
  - `npm run typecheck`
  - `npm run lint`
- Full validation before dev marks complete:
  - `npm run test`
  - `npm run test:e2e` if Approval Detail DOM/action/history behavior changes e2e-visible routes.

### References

- `_bmad-output/planning-artifacts/epics.md:926` - Story 3.4 requirements and AC.
- `_bmad-output/planning-artifacts/epics.md:821` - Epic 3 business scope.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:255` - FR-042 approval history fields.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:491` - NFR-006 audit logging.
- `_bmad-output/planning-artifacts/architecture.md:44` - tech stack and repository boundary.
- `_bmad-output/planning-artifacts/architecture.md:50` - permission/scope/audit cross-cutting concerns.
- `_bmad-output/planning-artifacts/architecture.md:223` - module and file structure patterns.
- `_bmad-output/planning-artifacts/architecture.md:413` - data flow.
- `_bmad-output/planning-artifacts/ux-design-specification.md:729` - Activity Timeline / Audit Trail anatomy.
- `_bmad-output/planning-artifacts/ux-design-specification.md:918` - drill-down required fields and timeline/audit.
- `_bmad-output/implementation-artifacts/3-3-approval-actions-voi-validation-va-permission.md` - previous story implementation notes and review fixes.
- `src/modules/proposals/services/proposal-service.ts` - action service and decision creation.
- `src/modules/proposals/services/proposal-repository.ts` - ProposalRepository and `applyApprovalMutation`.
- `src/modules/proposals/services/approval-center-service.ts` - detail DTO and current `buildHistory`.
- `src/modules/proposals/actions.ts` - audit creation after approval actions.
- `src/modules/users/services/user-service.ts` - `createAuditLog` and `listAuditLogs`.
- `src/modules/users/types.ts` - `AuditLog` shape.
- `src/modules/executive/components/approval-request-detail.tsx` - current detail/history UI.
- `tests/unit/approval-center-detail-service.test.ts` - detail DTO no-leak and scope tests.
- `tests/unit/approval-request-detail.test.tsx` - detail component tests.
- `tests/unit/proposal-approval-actions-service.test.ts` - approval action service tests.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-29: Red tests added for decision version/transition metadata, audit permission DTO, final detail read-only, and History/Audit UI.
- 2026-05-29: `npm run test -- tests/unit/proposal-approval-actions-service.test.ts tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx` failed before implementation as expected.
- 2026-05-29: Implemented ProposalDecision metadata, submit/action mutation metadata, permission-aware audit timeline, read-only final detail, route audit loader, UI timeline, migration, and tests.
- 2026-05-29: Targeted unit tests, regression tests, full unit suite, lint, typecheck and E2E smoke all passed.
- 2026-05-29: Applied code review patches for submit audit metadata, legacy version backfill, final-detail redirects, and ProposalLink timeline entries.
- 2026-05-29: `npm run test -- tests/unit/proposal-actions.test.ts tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx tests/unit/proposal-service.test.ts tests/unit/proposal-approval-actions-service.test.ts`, `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run test:e2e` all passed after review patches.

### Completion Notes List

- Added monotonic per-proposal approval decision versions with fallback for legacy decisions and persisted previous/next proposal and step status metadata.
- Approval detail now builds a stable History/Audit timeline from decisions, decided steps and proposal audit logs, with audit data loaded only after detail permission/scope and `audit.view` pass.
- Final `approved`, `rejected` and `cancelled` proposal details are readable as read-only records while queue filtering remains limited to mutable in-queue statuses.
- Approval Detail UI now renders keyboard-focusable timeline items with version and transition text, plus a permission state when audit events are hidden.
- Added incremental DB migration for proposal decision history metadata and updated unit/E2E coverage.
- Review patches added submit audit old/new metadata with decision version, chronological DB version backfill plus uniqueness, final action redirect back to read-only detail, and ProposalLink events in the History/Audit timeline.

### File List

- database/migrations/202605290002_extend_proposal_history_metadata.sql
- src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx
- src/modules/executive/components/approval-request-detail.tsx
- src/modules/executive/types/index.ts
- src/modules/proposals/actions.ts
- src/modules/proposals/services/approval-center-service.ts
- src/modules/proposals/services/proposal-service.ts
- src/modules/proposals/types.ts
- tests/e2e/mvp-smoke.spec.ts
- tests/unit/approval-center-detail-service.test.ts
- tests/unit/approval-request-detail.test.tsx
- tests/unit/proposal-actions.test.ts
- tests/unit/proposal-approval-actions-service.test.ts
- tests/unit/proposal-service.test.ts

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-29 | 1.0 | Created Story 3.4 implementation guide for approval history, version and audit timeline. | Codex |
| 2026-05-29 | 1.1 | Implemented approval decision metadata, permission-aware history/audit timeline, final detail read-only behavior, migration and tests. | Codex |
| 2026-05-29 | 1.2 | Applied code review patches for submit audit metadata, migration backfill, final-detail redirect and ProposalLink timeline visibility. | Codex |
