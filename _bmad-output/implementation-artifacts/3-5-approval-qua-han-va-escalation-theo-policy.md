# Story 3.5: Approval Qua Han Va Escalation Theo Policy

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay mo rong Approval Center va executive dashboard sau Story 3.4 de danh dau approval qua han, tinh escalation theo policy, tao mock alert/notification queue du demo nghiem thu va audit khi escalation state thay doi. Khong tao real email/calendar notification, khong tao approval flow rieng, khong tu dong forward/approve/reject thay user, va khong xay Risk & Alert Center cua Epic 5.

## Story

As a lanh dao,
I want approval qua han duoc canh bao va escalate theo policy,
so that request quan trong khong bi ket.

## Tieu Chi Chap Nhan

1. **Approval qua han co severity, reason, owner va next action**
   - Given approval dang mo (`submitted`, `in_review`, `change_requested`, `on_hold` voi proposal hoac pending/revision voi leadership approval) co `dueDate` truoc ngay hien tai
   - When Approval Center, Executive Dashboard, Morning Briefing hoac Common Center tai data
   - Then item duoc danh dau `overdue` voi `daysOverdue`, `severity`, `reason`, `owner` va `nextAction` dang text ro rang.
   - And severity khong chi phu thuoc mau sac; DTO/UI phai co text badge/label de user doc duoc bang keyboard/screen reader.
   - And item khong co `dueDate` hoac khong con pending/final status khong duoc tinh overdue.

2. **Escalation theo policy xac dinh dung target trong scope**
   - Given approval qua han keo dai theo nguong cau hinh policy hoac co risk high/critical phu hop `escalateOnRiskLevels`
   - When escalation resolver chay
   - Then he thong xac dinh current approver (`approverUserId` neu co, neu khong thi `approverRole`/policy role), proposer/requester, owner neu co, Thu ky/Tro ly lien quan tu active delegation trong scope, va escalation target theo policy.
   - And target bi gioi han theo project/module/record scope cua approval; khong dua delegate/target ngoai scope vao DTO.
   - And neu khong tim thay target cu the, DTO van tra fallback role/label va reason de user biet can thao tac tiep, khong crash va khong leak du lieu cam.

3. **Mock alert/notification queue du demo nghiem thu**
   - Given production notification channels chua nam trong scope
   - When escalation duoc tinh la required
   - Then he thong tao hoac cap nhat mot mock notification/outbox/queue item idempotent gom source, severity, reason, recipients/targets, next action, policy va status.
   - And khong gui email, calendar, push notification hoac external integration.
   - And duplicate loads khong tao duplicate alert; cung source + policy + trigger phai upsert cung mot logical item.

4. **Audit khi escalation state thay doi**
   - Given mock notification/outbox item moi duoc tao hoac severity/target/status thay doi
   - When write thanh cong
   - Then `AuditLog` ghi actor/system, entity proposal/approval, old/new escalation state, notification id, severity, trigger, policy id va target summary.
   - And khong ghi audit moi cho moi lan doc neu state khong thay doi.

5. **Approval detail va dashboard hien escalation ro rang**
   - Given user co quyen xem approval detail
   - When mo `/approvals/proposal/:id?scopeId=...`
   - Then detail hien overdue/escalation summary, policy threshold, recipients/targets, mock alert status va history/audit lien quan neu co quyen audit.
   - And Approval Center queue/dashboard/common center hien priority/escalation label ro rang, co link detail neu source la proposal.
   - And mobile 360/390/430 stack hop ly, khong overlap text, action panel van dung keyboard.

6. **Permission, finance redaction va no-leak duoc bao toan**
   - Given user ngoai scope, thieu approval/proposal grant, thieu `finance.view` hoac thieu `audit.view`
   - When goi service hoac route truc tiep
   - Then DTO khong serialize title/source/amount/notification/audit cua record cam.
   - And finance amount van bi an nhu Story 3.1/3.2/3.4.
   - And raw audit oldValue/newValue chi hien khi co `audit.view`.

7. **Policy/config parity mock va Supabase-ready**
   - Given app chay file-backed mode hoac Supabase-ready mode
   - When policy escalation duoc resolve
   - Then long-overdue threshold la config trong policy/settings, khong hardcode role/approver/risk group/threshold trong business logic.
   - And repository/migration/seed co parity cho config va mock notification outbox neu can persist.

## Tasks / Subtasks

- [x] Thiet ke overdue va escalation contract (AC: 1, 2, 5, 6)
  - [x] Them type DTO vao `src/modules/executive/types/index.ts` cho overdue state, escalation state, escalation targets va optional notification/outbox summary.
  - [x] Mo rong `ApprovalCenterQueueItem`, `ApprovalCenterDetailData`, `ExecutiveApprovalItem` va `ExecutiveCommonCenterPriorityItem` bang metadata can thiet, giu serializable plain objects.
  - [x] Giu field hien co (`dueGroup`, `dueLabel`, `priority`, `reason`, `financialAccess`) de khong break existing UI/tests.
  - [x] Khong dua finance amount/audit raw value vao escalation DTO neu user khong co quyen.

- [x] Them policy config cho long-overdue escalation (AC: 2, 7)
  - [x] Mo rong `ApprovalThresholdPolicy`/`ApprovalPolicyInput` trong `src/modules/settings/types.ts` voi field configurable, vi du `escalateAfterDays?: number`.
  - [x] Update `src/modules/settings/validation.ts`, `src/modules/settings/actions.ts`, `src/modules/settings/components/policy-settings-panel.tsx` va `src/modules/settings/services/policy-settings-repository.ts` de read/write field nay.
  - [x] Them migration incremental cho `approval_threshold_policies.escalate_after_days` va map snake_case/camelCase dung pattern hien co.
  - [x] Seed/default policy co gia tri ro rang, vi du default 3 ngay, nhung business logic khong hardcode nguong nay.
  - [x] Preserve existing `escalateOnRiskLevels` va resolver ordering hien co.

- [x] Tao pure overdue/escalation resolver (AC: 1, 2, 6, 7)
  - [x] Tao module service nho, uu tien `src/modules/proposals/services/approval-escalation-service.ts`, de gom pure helpers thay vi nhan ban logic trong dashboard va Approval Center.
  - [x] Extract/centralize date-only comparison tu logic `resolveDueGroup` hien co; tat ca tests phai inject `now`/`today`.
  - [x] `resolveApprovalOverdueState` tinh `daysOverdue`, `severity`, `reason`, `owner`, `nextAction`.
  - [x] `resolveApprovalEscalationState` dung current step, policy, risk signal neu co, `escalateAfterDays`, `escalateOnRiskLevels`, proposal scope va delegation.
  - [x] Support proposal-backed approvals truoc; leadership approval mock data co risk/dueDate thi map duoc metadata doc-only.
  - [x] Khong tu dong thay doi `currentStepId`, status, approver, decision hay link. Escalation story nay la alert/queue/audit, khong la auto-forward.

- [x] Resolve Thu ky/Tro ly va target trong scope (AC: 2, 6)
  - [x] Dung existing leadership delegation services/repository de list active delegations khi can, khong tao module delegation moi.
  - [x] Match delegation theo principal lien quan (`approverUserId` neu co, `requestedBy`, `submittedBy`, `onBehalfOf`, `ownerId` neu co) va scope (`projectId`, `moduleId`, `recordId`) cua approval.
  - [x] Neu approval chi co `approverRole` ma khong co user, target DTO phai la role-based target thay vi fake user.
  - [x] Tests phai cover delegate trong scope duoc included, delegate ngoai scope bi loai, va missing delegate khong crash.

- [x] Implement mock notification/outbox persistence hoac queue item (AC: 3, 4, 7)
  - [x] Vi `src/lib/notifications/README.md` dang la placeholder, tao minimal notification/outbox code tai `src/lib/notifications/*` neu can persist mock alert.
  - [x] Suggested files: `types.ts`, `notification-repository.ts`, `notification-service.ts`.
  - [x] File-backed repository co stable id/upsert key de duplicate reads khong tao duplicate.
  - [x] Neu tao Supabase parity, them migration `database/migrations/YYYYMMDDNNNN_create_notification_outbox.sql` voi snake_case columns va RLS/pham vi toi thieu.
  - [x] Khong implement real channel adapter. Channel/status nen la `mock`, `queued`, `acknowledged` hoac tuong tu.

- [x] Integrate Approval Center data (AC: 1, 2, 3, 5, 6)
  - [x] Update `src/modules/proposals/services/approval-center-service.ts` de build proposal queue item voi overdue/escalation metadata.
  - [x] Reuse `detail.steps` da load trong `buildProposalItems`; dung current step/policy label hien co.
  - [x] Update leadership approval item mapping de co overdue/escalation metadata read-only tu mock leadership approvals.
  - [x] Update `getApprovalCenterDetailData` de include overdue/escalation summary trong detail, policy card va history/audit context.
  - [x] Bao toan scope/permission gate hien co: `canViewApprovalCenter`, `resolveAccessScope`, `canReadProposalInScope`, `canViewFinanceForRecord`, `canViewAuditForRecord`.

- [x] Integrate dashboard/common center/morning briefing (AC: 1, 3, 5, 6)
  - [x] Update `src/modules/dashboard/services/executive-dashboard-service.ts` de proposal/leadership approval items carry `overdueSeverity`, `daysOverdue`, `nextAction`, `escalation`.
  - [x] Update `buildApprovalSummary`, deadline summary va risk/high-priority logic neu can de severe overdue approvals surface before lower-priority items.
  - [x] Update `src/modules/dashboard/services/executive-common-center-service.ts` de priority label/score phan biet `Qua han`, `Escalation`, `Critical` bang field moi thay vi string sniffing.
  - [x] Update `src/modules/dashboard/services/executive-morning-briefing-service.ts` neu summary/citation can mention escalation without leaking finance.
  - [x] Update `src/modules/command-center/services/command-center-service.ts` options neu can truyen notification/delegation/audit dependencies vao Approval Center.

- [x] Update UI cho Approval Center/detail/dashboard (AC: 1, 5, 6)
  - [x] `src/modules/executive/components/approval-center.tsx`: hien severity badge, reason, owner va next action; use lucide icons co san neu can, text luon hien.
  - [x] `src/modules/executive/components/approval-request-detail.tsx`: them section/rows cho overdue/escalation va mock alert status; khong lam nested cards phuc tap.
  - [x] `src/modules/dashboard/components/executive-priority-queue.tsx`, `executive-common-center.tsx`, `executive-morning-briefing.tsx` update label neu metadata moi can render.
  - [x] Responsive: badges/actions wrap, no overlap, touch target >= 44px cho controls moi.
  - [x] Hien permission state concise neu audit/notification details bi an.

- [x] Audit escalation state changes (AC: 4, 6)
  - [x] Dung `createAuditLog`/`AuditLog` pattern hien co hoac injection de service test duoc.
  - [x] Audit action suggested: `proposal.escalation_queued`, `proposal.escalation_updated`, `proposal.escalation_cleared` neu co clear.
  - [x] Audit old/new value khong chua finance amount neu user/current context khong can.
  - [x] Khong audit moi cho every GET; only audit khi outbox/queue state tao moi hoac thay doi.

- [x] Seed/demo data va migrations (AC: 1, 2, 3, 5, 7)
  - [x] Update demo seed neu can de `proposal-demo-overdue-approval` co policy/step/delegation/outbox deterministic.
  - [x] Update verification seed/test fixtures neu story them DB column/table.
  - [x] Preserve old migration files; add incremental migration only.

- [x] Test coverage (AC: 1-7)
  - [x] Unit tests cho overdue calculation: no due date, today, 1 day overdue, long overdue threshold, invalid date fallback.
  - [x] Unit tests cho escalation policy: risk level match, long overdue match, no escalation before threshold, policy fallback.
  - [x] Unit tests cho target resolver: approver user, role-based approver, proposer, owner, active delegate in scope, out-of-scope delegate filtered.
  - [x] Unit tests cho mock notification/outbox idempotent upsert va audit only on change.
  - [x] Unit tests cho `getApprovalCenterData` va `getApprovalCenterDetailData` metadata/no-leak.
  - [x] Unit tests cho dashboard/common-center priority ordering and labels.
  - [x] Component tests cho badges/labels/permission state/responsive-safe text.
  - [x] E2E smoke optional but recommended cho `/command-center?view=executive-approvals` va `/approvals/proposal/proposal-demo-overdue-approval` o 360/390/768/1280 neu mock data deterministic.

### Review Findings

- [x] [Review][Patch] Dashboard/Common/Morning bypass policy config and mock outbox [src/modules/dashboard/services/executive-dashboard-service.ts:303]
- [x] [Review][Patch] Final and cancelled approvals can still be treated as overdue/escalated [src/modules/proposals/services/approval-center-service.ts:115]
- [x] [Review][Patch] Supabase notification_outbox RLS is not source-scope safe [database/migrations/202605290003_add_approval_escalation_policy_and_notification_outbox.sql:13]
- [x] [Review][Patch] Escalation target resolver misses submittedBy/onBehalfOf and leadership approverId [src/modules/proposals/services/approval-escalation-service.ts:35]
- [x] [Review][Patch] Leadership escalation falls back to the first unrelated policy [src/modules/proposals/services/approval-center-service.ts:872]
- [x] [Review][Patch] Escalation audit payload omits target summary and full state [src/modules/proposals/services/approval-center-service.ts:975]
- [x] [Review][Patch] Detail first-load history misses the escalation audit it just creates [src/modules/proposals/services/approval-center-service.ts:1407]
- [x] [Review][Patch] Acknowledged mock alert status is lost in escalation DTOs [src/modules/executive/types/index.ts:652]
- [x] [Review][Patch] Date-only overdue math is timezone-dependent and inconsistent with dashboard day math [src/modules/proposals/services/approval-escalation-service.ts:54]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 3 objective la Approval Center tren Proposal/Approval backbone, co process actions, policy/assignment, history/audit va overdue escalation. Khong tao approval flow rieng. [Source: _bmad-output/planning-artifacts/epics.md:821]
- Story 3.5 cover FR-043, NFR-006, UX-DR11, UX-DR22: approval qua han can canh bao approver, proposer, Thu ky/Tro ly lien quan va escalate theo policy neu qua han keo dai hoac risk cao. [Source: _bmad-output/planning-artifacts/epics.md:957]
- PRD FR-043 yeu cau canh bao nguoi duyet, nguoi de xuat, Thu ky/Tro ly lien quan va escalate theo policy. [Source: _bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:255]
- NFR-006 yeu cau approval/decision/risk va mutation quan trong co audit log. [Source: _bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:491]
- NFR-008 cam hardcode role, approver, threshold, risk group. Long-overdue threshold phai nam trong policy/config. [Source: _bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:505]
- UX spec yeu cau status badge co text, reason cho risk/overdue/escalation, owner/deadline/next step ro rang, va audit/history sau action. [Source: _bmad-output/planning-artifacts/ux-design-specification.md:340]

### Current Code State (Read Before Editing)

- `src/modules/proposals/services/approval-center-service.ts` hien co `resolveDueGroup` private: date qua han tra `dueGroup: "overdue"` va `dueLabel: "Overdue Nd"`. Hien chua co `daysOverdue`, severity, nextAction, escalation target hoac notification.
- `buildProposalItems` dang load proposal details de lay links/steps, map `reason: proposal.summary`, `ownerName: proposal.ownerId`, `policyLabel` tu current step, va sort bang `dueGroupRank`/`priorityRank`.
- `proposalPriority` chi nang priority len `urgent` neu overdue va proposal priority khong phai urgent. Khong co `critical` cho proposal-backed overdue hien tai.
- `buildLeadershipItems` map mock `LeadershipApproval` co `riskLevel`, `dueDate`, `approvalLevel`; day la source co risk signal san co cho read-only escalation metadata.
- `getApprovalCenterDetailData` da co scope gate, finance redaction, audit permission gate, linked sources, action availability va history/audit timeline tu Story 3.4. Khong load forbidden audit neu thieu `audit.view`.
- `src/modules/executive/types/index.ts` hien co `ApprovalCenterQueueItem` voi `dueGroup`, `dueLabel`, `reason`, `ownerName`, `reviewerLabel`, `policyLabel`; `ApprovalCenterDetailData` chua co overdue/escalation fields.
- `src/modules/executive/components/approval-center.tsx` hien render priority, due label, status va reason. Can them overdue/escalation text ma khong phu thuoc mau.
- `src/modules/executive/components/approval-request-detail.tsx` hien render Request summary, Linked sources, Policy, ApprovalActionPanel, History/Audit. Them escalation vao summary/policy/history context, khong break final read-only detail.
- `src/modules/dashboard/services/executive-dashboard-service.ts` hien `proposalToApprovalItem` set `tone: red` neu overdue va `buildApprovalSummary` count overdue/highRisk; chua co severity/nextAction/escalation metadata.
- `src/modules/dashboard/services/executive-common-center-service.ts` hien build priority item voi label `Approval qua han`, score theo overdue/risk, va threshold breach bang priority/risk/deadline. Nen replace/augment bang metadata moi de tranh string sniffing.
- `src/modules/settings/services/policy-settings-service.ts#resolveApprovalPolicyForProposal` da co `riskScore` tu `escalateOnRiskLevels`; policy type/repository/DB hien co `escalate_on_risk_levels` nhung chua co overdue-day threshold.
- `src/lib/notifications/README.md` chi la placeholder. Neu can "luu alert/mock notification", tao minimal outbox code o day thay vi tron vao proposal repository.
- `src/modules/settings/services/leadership-delegation-service.ts` co APIs list active delegations for delegate/principal va scope matching helpers; dung lai de tim Thu ky/Tro ly lien quan.
- `src/modules/users/services/user-service.ts` co `createAuditLog` va `listAuditLogs`; `AuditLog` co `actorId`, `entityType`, `entityId`, `action`, `oldValue`, `newValue`, `createdAt`.

### Suggested Data Contract

Use exact names only if they fit implementation; keep semantic fields equivalent if naming changes.

```ts
export type ApprovalOverdueSeverity =
  | "none"
  | "warning"
  | "overdue"
  | "critical";

export type ApprovalEscalationTrigger =
  | "none"
  | "long_overdue"
  | "risk_policy"
  | "critical_overdue";

export type ApprovalEscalationTarget = {
  kind: "current_approver" | "proposer" | "owner" | "delegate" | "policy_escalation";
  label: string;
  userId?: string;
  roleKey?: string;
  delegationId?: string;
  scopeMatched: boolean;
};

export type ApprovalOverdueState = {
  isOverdue: boolean;
  daysOverdue: number;
  severity: ApprovalOverdueSeverity;
  reason: string;
  ownerLabel: string;
  nextAction: string;
};

export type ApprovalEscalationState = {
  required: boolean;
  trigger: ApprovalEscalationTrigger;
  policyId?: string;
  policyLabel?: string;
  thresholdDays?: number;
  targets: ApprovalEscalationTarget[];
  notificationId?: string;
  status: "none" | "queued" | "updated" | "hidden";
  reason?: string;
};
```

Contract guidance:
- Add `overdue?: ApprovalOverdueState` va `escalation?: ApprovalEscalationState` to queue/detail/dashboard DTOs.
- `severity="warning"` nen dung cho due today/near due neu UI muon hien warning; AC1 focus overdue, nen tests can cover overdue first.
- `critical` nen duoc driven by policy threshold/risk config, not hardcoded role.
- `status: "hidden"` co the dung khi user co quyen xem approval nhung khong co quyen xem full notification/audit details.

### File Targets

Expected UPDATE:
- `src/modules/proposals/services/approval-center-service.ts`
- `src/modules/proposals/services/proposal-service.ts` only if approval submit/action needs pass risk/policy metadata; avoid unrelated action refactor.
- `src/modules/proposals/types.ts` only if adding optional proposal risk signal is necessary; do not build full Risk module.
- `src/modules/executive/types/index.ts`
- `src/modules/executive/components/approval-center.tsx`
- `src/modules/executive/components/approval-request-detail.tsx`
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/services/executive-common-center-service.ts`
- `src/modules/dashboard/services/executive-morning-briefing-service.ts` if briefing surfaces escalation.
- `src/modules/command-center/services/command-center-service.ts` if new dependencies/options must be passed.
- `src/modules/settings/types.ts`
- `src/modules/settings/validation.ts`
- `src/modules/settings/actions.ts`
- `src/modules/settings/services/policy-settings-service.ts`
- `src/modules/settings/services/policy-settings-repository.ts`
- `src/modules/settings/components/policy-settings-panel.tsx`
- Tests under `tests/unit/*approval*`, `tests/unit/executive-dashboard-service.test.ts`, `tests/unit/executive-common-center-service.test.ts`, `tests/unit/command-center-dashboard.test.tsx`.

Expected NEW:
- `src/modules/proposals/services/approval-escalation-service.ts`
- `src/lib/notifications/types.ts`
- `src/lib/notifications/notification-repository.ts`
- `src/lib/notifications/notification-service.ts`
- `tests/unit/approval-escalation-service.test.ts`
- `tests/unit/notification-outbox-service.test.ts` if mock outbox is persisted.
- `database/migrations/YYYYMMDDNNNN_add_approval_escalation_policy.sql`
- `database/migrations/YYYYMMDDNNNN_create_notification_outbox.sql` if outbox persists in DB parity.

Avoid unless truly needed:
- Khong tao real notification channel adapters (`email`, `calendar`, `push`, external provider).
- Khong tao `approval-service` rieng ngoai Proposal module.
- Khong auto-forward current approval step. Manual `forward` action da ton tai tu Story 3.3.
- Khong tao Risk & Alert Center, risk CRUD, heatmap, risk override, hoac AI risk suggestions cua Epic 5.
- Khong hardcode target roles nhu `super_admin`/`tong_giam_doc` lam escalation default. Dung policy/step/role catalog.
- Khong leak finance amount trong alert text/notification title neu `finance.view` khong co.
- Khong add UI libraries/dependencies moi.

### Architecture Compliance

- Follow architecture flow: route -> action/loader -> permission/auth -> service -> repository -> DTO; mutation -> service validation -> repo -> audit/history -> revalidate. [Source: _bmad-output/planning-artifacts/architecture.md:413]
- Internal mutations stay in Server Actions or service/repository calls; khong tao REST API moi. [Source: _bmad-output/planning-artifacts/architecture.md:160]
- Domain logic stays under `src/modules/proposals`; executive UI under `src/modules/executive/components`; dashboard aggregation under `src/modules/dashboard`; notification placeholder under `src/lib/notifications`. [Source: _bmad-output/planning-artifacts/architecture.md:364]
- DB snake_case, TypeScript camelCase. Repository maps between both. [Source: _bmad-output/planning-artifacts/architecture.md:204]
- Permission/scope filtering must happen before DTO returns UI data. [Source: _bmad-output/planning-artifacts/architecture.md:50]
- Keep mock/file-backed behavior and Supabase-ready repository boundary; tests should inject repositories instead of requiring live Supabase. [Source: _bmad-output/planning-artifacts/architecture.md:108]

### UX Guardrails

- Operational UI: dense, scannable, no marketing/hero/card-heavy redesign.
- Overdue/escalation must show text labels: severity, reason, owner, next action, target/status. Do not rely on red/amber color only.
- Use existing lucide icons if helpful; icons must be `aria-hidden` when decorative and paired with text.
- Mobile stacks queue/detail sections; badges wrap; no text overlap in 360/390/430 widths.
- Button/action controls in Approval Action Panel remain >= 44px touch target and keyboard reachable.
- If notification/audit details hidden by permission, show short state text instead of empty/ambiguous blank.

### Previous Story Intelligence

- Story 3.1 created scoped Approval Center queue and finance redaction. Preserve no-leak, scope filtering and finance hidden state.
- Story 3.2 created read-only Approval Detail with linked sources and scopeId preservation. Preserve direct URL unauthorized behavior.
- Story 3.3 created Approval Action Panel, strict current-step permissions, delegated approval guard, forwarded approver enforcement, audit payload and single approval mutation path. Do not bypass these guards.
- Story 3.4 added version/history/audit timeline, final status read-only detail, submit audit metadata, final action redirect back to detail, and ProposalLink events in timeline.
- Deferred review items from Story 3.4: delegated proposal creation domain guard and concurrent approval action stale writes. Do not expand Story 3.5 to solve these unless directly required.

### Git / Recent Work Intelligence

- Git log is sparse (`484589a 2205`, `a8162e3 first fcm`); local BMad story files and dirty worktree are the reliable source of truth.
- Worktree contains many unrelated modified/untracked files. Read current files before editing and do not revert unrelated changes.

### Latest Tech Notes

- Project baseline from `package.json`: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Zod `^3.24.4`, Vitest `^3.1.3`, Testing Library React `^16.3.0`, Playwright `^1.52.0`.
- No dependency upgrade is needed for this story.
- Use existing Server Components/Server Actions/service modules and simple React rendering. Do not introduce new notification, date, tabs, queue, or state libraries.

### Testing Guidance

Suggested red/green focused commands:

```bash
npm run test -- tests/unit/approval-escalation-service.test.ts tests/unit/approval-center-service.test.ts tests/unit/approval-center-detail-service.test.ts
npm run test -- tests/unit/executive-dashboard-service.test.ts tests/unit/executive-common-center-service.test.ts tests/unit/command-center-dashboard.test.tsx
npm run test -- tests/unit/policy-settings-service.test.ts tests/unit/settings-actions.test.ts
```

Static and broad validation before dev marks complete:

```bash
npm run typecheck
npm run lint
npm run test
```

E2E recommended if UI route behavior changes:

```bash
npm run test:e2e
```

### Checklist Validation Notes

- Story has explicit ACs mapped to tasks.
- Current code state and exact file targets are documented.
- Architecture/UX/security/testing constraints are included.
- Risky ambiguity addressed: long-overdue threshold must be configurable policy, notification is mock/outbox only, escalation does not auto-forward, no finance/audit leaks.
- No unresolved clarification required before dev-story.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/approval-escalation-service.test.ts tests/unit/notification-outbox-service.test.ts tests/unit/policy-settings-service.test.ts tests/unit/settings-actions.test.ts tests/unit/approval-center-service.test.ts tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx tests/unit/executive-dashboard-service.test.ts tests/unit/executive-common-center-service.test.ts tests/unit/command-center-dashboard.test.tsx` - 83 tests passed.
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm run test` - 349 tests passed.
- `npm run test:e2e` - 47 Playwright smoke tests passed.

### Completion Notes List

- Added serializable overdue/escalation DTOs, pure resolver helpers, scoped target resolution, and configurable `escalateAfterDays` policy support.
- Added mock notification outbox repository/service with stable idempotent upsert, Supabase-ready migration, and audit writes only when outbox state changes.
- Integrated proposal and leadership approval metadata into Approval Center queue/detail, Executive Dashboard, Common Center, and Morning Briefing while preserving finance redaction and scope/audit permission gates.
- Updated UI to show text severity, reason, owner, next action, escalation trigger/status, targets, and mock alert ids with wrapped responsive layouts.
- Fixed concurrent escalation side effects by serializing notification/audit writes during Approval Center data builds.

### File List

- `_bmad-output/implementation-artifacts/3-5-approval-qua-han-va-escalation-theo-policy.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `database/migrations/202605290003_add_approval_escalation_policy_and_notification_outbox.sql`
- `src/lib/notifications/types.ts`
- `src/lib/notifications/notification-repository.ts`
- `src/lib/notifications/notification-service.ts`
- `src/modules/proposals/services/approval-escalation-service.ts`
- `src/modules/proposals/services/approval-center-service.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/executive/components/approval-center.tsx`
- `src/modules/executive/components/approval-request-detail.tsx`
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/services/executive-common-center-service.ts`
- `src/modules/dashboard/services/executive-morning-briefing-service.ts`
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`
- `src/modules/dashboard/components/executive-priority-queue.tsx`
- `src/modules/dashboard/components/executive-common-center.tsx`
- `src/modules/dashboard/components/executive-morning-briefing.tsx`
- `src/modules/settings/types.ts`
- `src/modules/settings/validation.ts`
- `src/modules/settings/actions.ts`
- `src/modules/settings/services/policy-settings-service.ts`
- `src/modules/settings/services/policy-settings-repository.ts`
- `src/modules/settings/components/policy-settings-panel.tsx`
- `tests/unit/approval-escalation-service.test.ts`
- `tests/unit/notification-outbox-service.test.ts`
- `tests/unit/policy-settings-service.test.ts`
- `tests/unit/settings-actions.test.ts`
- `tests/unit/approval-center-service.test.ts`
- `tests/unit/approval-center-detail-service.test.ts`
- `tests/unit/approval-request-detail.test.tsx`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/executive-common-center-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`

### Change Log

- 2026-05-29: Implemented approval overdue/escalation policy handling, mock outbox/audit integration, dashboard/detail UI surfacing, tests, and full validation. Status set to review.
