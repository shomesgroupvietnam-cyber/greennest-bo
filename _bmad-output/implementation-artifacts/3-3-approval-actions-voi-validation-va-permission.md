# Story 3.3: Approval Actions Voi Validation Va Permission

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay them Approval Action Panel va server-side mutations cho Approval Detail tren Proposal/Approval backbone. Pham vi gom approve, reject, return/request changes, forward/escalate, ask for meeting, hold va cancel; validation reason/comment; permission/scope/policy guard; audit/history toi thieu; selected scope preservation va queue/detail regression. Khong tao approval flow rieng, khong lam full configurable approval engine, khong tao real meeting engine, khong lam full audit/version UI cua Story 3.4, khong cho thu ky/tro ly approve thay lanh dao.

## Story

As a nguoi duyet co tham quyen,
I want approve, reject, return, forward/escalate, ask for meeting, hold hoac cancel approval,
so that request duoc xu ly dung policy va co ly do ro rang.

## Tieu Chi Chap Nhan

1. **Approve dung policy/assignment va comment tuy chon**
   - Given approval Truc 1 dang o trang thai cho xu ly va policy/current step xac dinh user co quyen
   - When user approve approval tu Approval Detail
   - Then service cap nhat proposal/current step sang approved
   - And ghi ProposalDecision + audit log voi actor, action, old/new status va comment neu co
   - And item khong con xuat hien trong Approval Center queue.

2. **Reject va return/request changes bat buoc ly do**
   - Given user chon reject hoac return/request changes
   - When submit thieu ly do
   - Then validation chan submit o UI va service/action boundary
   - And loi hien gan field ly do, khong mutate proposal, step, decision hay audit.
   - When submit co ly do hop le
   - Then reject cap nhat final rejected; return cap nhat change_requested va luu ly do vao history/audit.

3. **Forward/escalate, ask for meeting va hold co ket qua persisted ro rang**
   - Given user co quyen xu ly approval
   - When user forward/escalate
   - Then service luu target role/user neu co, tao/doi current step phu hop va giu proposal trong queue dang in_review.
   - When user ask for meeting
   - Then service luu meeting proposal metadata o muc placeholder/generated action, khong tao real meeting engine.
   - When user hold
   - Then approval duoc danh dau on-hold/pending ro rang va comment duoc luu neu co.

4. **Cancel la destructive action co confirmation va audit**
   - Given user co quyen huy/cancel approval
   - When user confirm cancel voi ly do
   - Then service cap nhat approval sang cancelled/khong con trong queue
   - And audit/decision luu ly do, actor va status transition.

5. **Server action truc tiep khong bypass permission/scope**
   - Given user khong du quyen, khong nam trong selected scope, hoac la thu ky/tro ly approve thay
   - When goi server action truc tiep voi FormData hop le
   - Then service tra permission error va khong mutate record
   - And response/DOM/serialized JSON khong leak title, amount, link hay history cua record ngoai scope.

6. **UI action panel permission-aware, responsive va accessible**
   - Given approval detail dang mo o viewport 360/390/768/1280
   - When user co quyen
   - Then hien Approval Action Panel voi action labels, textarea/input dung loai, confirmation cho destructive action, focus order hop ly, button text ro, no horizontal overflow.
   - When user khong co quyen action
   - Then action bi an hoac disabled co ly do theo UX pattern, nhung server-side van la authority.

7. **Regression boundaries duoc bao toan**
   - Given Story 3.1 queue va Story 3.2 read-only detail da hoat dong
   - When story nay hoan thanh
   - Then `/command-center?view=executive-approvals`, `/approvals/proposal/:id?scopeId=...`, `/proposals/[proposalId]`, finance redaction va direct unauthorized behavior van khong bi pha.

## Tasks / Subtasks

- [x] Thiet ke action/status contract tren Proposal backbone (AC: 1, 2, 3, 4, 7)
  - [x] Them type ro rang, vi du `ProposalApprovalAction = "approve" | "reject" | "request_change" | "forward" | "ask_meeting" | "hold" | "cancel"`.
  - [x] Mo rong `ProposalDecision["decision"]` de luu toi thieu `forwarded`, `meeting_requested`, `held`, `cancelled`; giu cac value cu.
  - [x] Mo rong `ProposalStatus` voi `on_hold` va `cancelled`; update `PROPOSAL_STATUSES`, status labels, queue status allow-list va tests.
  - [x] Mo rong `ProposalStep["status"]` voi `forwarded`, `meeting_requested`, `held`, `cancelled` neu service ghi cac state nay.
  - [x] Them migration tuong ung cho check constraints `proposals.status`, `proposal_steps.status`, `proposal_decisions.decision`; khong chi sua TypeScript.
  - [x] Khong tao approval repository/flow moi; repository contract hien co (`updateProposal`, `updateStep`, `addDecision`, `addStep`) la source of truth.
  - [x] Neu `ask_meeting` can tao `ProposalLink` generated action tren proposal da ton tai, them `addLink` vao `ProposalRepository` va JSON/Supabase parity thay vi sua store truc tiep.

- [x] Them validation boundary cho approval actions (AC: 2, 3, 4, 5)
  - [x] Mo rong `src/modules/proposals/validation.ts` voi `proposalApprovalActionSchema`/tuong duong bang Zod.
  - [x] Reject, request_change/return va cancel bat buoc reason/comment khong rong.
  - [x] Forward/escalate bat buoc target hop le o muc MVP: `targetRole`, `targetUserId` hoac `targetLabel`; khong hardcode role nguoi duyet.
  - [x] Ask meeting bat buoc meeting intent toi thieu: `meetingType` hoac `agendaDraft`; khong tao meeting record that neu story chua lam One Meeting Engine.
  - [x] Notes/comment trim ve `undefined` neu optional; khong luu string rong.

- [x] Harden service-side mutation va permission/scope guard (AC: 1, 2, 3, 4, 5, 7)
  - [x] Tao service/use-case chinh, vi du `applyProposalApprovalAction(proposalId, actionInput, user, options)`, trong `src/modules/proposals/services/proposal-service.ts` hoac helper gan Proposal module.
  - [x] Reuse `resolveAccessScope`, `canReadProposalInScope`, `canAccessScopedAction`, `hasAnyScopedActionGrant`, `can`, `assertCan`; khong check role string trong UI.
  - [x] Target scope cho action phai gom `axisId: "project_management"`, `moduleId/workstreamId: "proposal"`, `projectId`, `recordId`.
  - [x] Kiem tra record detail ton tai, status co the mutate (`submitted`, `in_review`, `on_hold`) va current step hop le truoc khi ghi.
  - [x] Kiem tra permission theo action va current step policy:
    - approve: `currentStep.requiredPermission ?? "proposal.approve"`.
    - reject/cancel: `proposal.reject` hoac explicit policy permission neu co.
    - request_change/return: `proposal.request_change`.
    - forward/ask_meeting/hold: toi thieu `proposal.approve` hoac current step required permission.
  - [x] Neu user role yeu cau assignment scope hoac selected scope active, record ngoai scope phai bi block truoc mutation.
  - [x] Giu guard `assertNoDelegatedApprovalContext`: MVP khong cho approve/reject/request-change/forward/hold/cancel thay lanh dao.
  - [x] Sau mutation, cap nhat proposal, step, decision theo mot transaction-like order nhat quan trong repository file-backed; neu loi validation/permission thi khong ghi gi.

- [x] Implement action outcomes tren current data model (AC: 1, 2, 3, 4, 7)
  - [x] Approve: current step `approved`, proposal `approved`, decision `approved`.
  - [x] Reject: current step `rejected`, proposal `rejected`, decision `rejected`, reason required.
  - [x] Return/request changes: current step `change_requested`, proposal `change_requested`, decision `change_requested`, reason required.
  - [x] Forward/escalate: current step `forwarded`, new step `in_review` with target role/user metadata, proposal stays `in_review`, decision `forwarded`.
  - [x] Ask meeting: proposal stays `in_review`, decision `meeting_requested`, optional `ProposalLink` with `relationType: "generated_action"` and placeholder `entityType` such as `meeting_request`; do not call meeting service unless a real meeting story already provides contract.
  - [x] Hold: current step `held`, proposal `on_hold`, decision `held`; queue/detail must display on-hold clearly and no final-state leak.
  - [x] Cancel: current step `cancelled`, proposal `cancelled`, decision `cancelled`; item excluded from queue.

- [x] Update server actions for Approval Detail route (AC: 1, 2, 3, 4, 5, 7)
  - [x] Add route-specific actions in `src/modules/proposals/actions.ts`, e.g. `applyApprovalDetailAction`.
  - [x] Actions must load `getCurrentUser`, parse `sourceId`, `sourceType`, `approvalAction`, `scopeId`, reason/comment/target fields.
  - [x] Actions must load active scope assignments and role permission catalog like the detail page before calling service.
  - [x] Preserve selected `scopeId` through hidden form input and redirect/revalidate paths.
  - [x] Revalidate `/command-center`, `/command-center?view=executive-approvals`, `/approvals/proposal/:id`, `/proposals/:id` as applicable.
  - [x] After final approve/reject/cancel, redirect to Approval Center with scope preserved because detail route may no longer return final statuses.
  - [x] Existing `/proposals/[proposalId]` action forms must keep working; preserve wrappers `approveProposal`, `rejectProposal`, `requestProposalChange` or update callers safely.

- [x] Expose action capability in detail DTO (AC: 5, 6, 7)
  - [x] Extend `ApprovalCenterDetailData` or nested `permissions` with action availability, e.g. `availableActions: Array<{ action, label, enabled, reason, requiresReason, destructive }>` or equivalent.
  - [x] Compute action availability in server/service layer, not in component.
  - [x] Do not include actions for unsupported source types or non-mutable statuses.
  - [x] Include disabled reason only after user can view the detail; never leak record data to unauthorized users.
  - [x] Keep DTO serializable: plain objects/arrays, ISO strings/date strings, no functions/classes/Date instances.

- [x] Build Approval Action Panel UI inside detail surface (AC: 1, 2, 3, 4, 6)
  - [x] Add component such as `src/modules/executive/components/approval-action-panel.tsx` or a focused section inside `approval-request-detail.tsx`.
  - [x] Render actions with semantic forms/buttons; use `Button` primitive and lucide icons where helpful.
  - [x] Reject/return/cancel forms show reason textarea with label, required indicator, `required`, `aria-describedby` and inline helper/error area near field.
  - [x] Approve comment is optional.
  - [x] Forward/escalate captures target role/user label and optional comment.
  - [x] Ask meeting captures meeting intent/agenda draft without implying a real meeting record was created.
  - [x] Hold captures optional comment and clear "tam giu" state.
  - [x] Destructive actions reject/cancel require explicit confirmation pattern: at minimum checkbox or typed confirm field before submit.
  - [x] Mobile layout stacks forms; desktop can use compact grouped sections. Avoid nested cards and horizontal overflow.
  - [x] When no action enabled, show concise permission/status state without exposing extra data.

- [x] Audit/history minimum for this story (AC: 1, 2, 3, 4, 7)
  - [x] Every successful action writes `ProposalDecision` with actor, timestamp, action decision, notes/reason and `stepId` when available.
  - [x] Every successful action writes audit log through `createAuditLog` with `entityType: "proposal"`, old status/step and new status/step.
  - [x] Do not build full audit timeline/version UI here; Story 3.4 owns comprehensive history/version/audit display.
  - [x] Ensure failed validation/permission attempts do not write decision or audit success records.

- [x] Unit/component/e2e coverage (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] Add or extend service tests for every outcome: approve, reject, request_change, forward, ask_meeting, hold, cancel.
  - [x] Test validation: reject/return/cancel missing reason throws and does not mutate repository.
  - [x] Test permission block: user without action permission, scoped user outside selected scope, and delegated approval context all fail without mutation.
  - [x] Test DTO action availability: approver sees enabled actions; reviewer/no permission does not get mutation controls.
  - [x] Component tests with Testing Library role/name queries for action panel, required reason fields, disabled/hidden actions and no action controls when not allowed.
- [x] E2E smoke: open Approval Center, drill into approval detail, verify action panel visible for `tong_giam_doc`, submit at least one low-risk action path if mock data reset supports it, and assert no horizontal overflow at 360/390/768/1280.
- [x] Regression: proposal list/detail action forms still work; finance sentinel still redacted; Story 3.1 queue and Story 3.2 detail tests stay green.

### Review Findings

- [x] [Review][Patch] Approve can bypass current step required permission via `proposal.approve` fallback [src/modules/proposals/services/proposal-service.ts:344]
- [x] [Review][Patch] Approval action can mutate proposal when current approval step is missing [src/modules/proposals/services/proposal-service.ts:386]
- [x] [Review][Patch] Approval Detail action does not pass delegated context into service guard [src/modules/proposals/actions.ts:253]
- [x] [Review][Patch] Forward schema rejects targetLabel-only target despite story allowing `targetRole`, `targetUserId` or `targetLabel` [src/modules/proposals/validation.ts:47]
- [x] [Review][Patch] Forwarded approver role/user metadata is not enforced when acting on the next step [src/modules/proposals/services/proposal-service.ts:380]
- [x] [Review][Patch] Supabase migration omits `proposal_steps` policy metadata columns written by the service [database/migrations/202605290001_extend_proposal_approval_actions.sql:20]
- [x] [Review][Patch] Audit log omits comment/reason and old/new step transition [src/modules/proposals/actions.ts:283]
- [x] [Review][Patch] Audit action names use imperative forms instead of required dot-case outcome names [src/modules/proposals/actions.ts:67]
- [x] [Review][Patch] Approval action writes step/link/decision/proposal as separate operations that can leave partial mutations [src/modules/proposals/services/proposal-service.ts:549]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 3 cho phep lanh dao xu ly approval trong Module 1 qua Approval Center chung, nhung tat ca phai dung Proposal/Approval backbone, khong tao flow rieng. [Source: _bmad-output/planning-artifacts/epics.md:371]
- Story 3.3 la buoc mutation sau Story 3.1 queue va Story 3.2 read-only detail. No phai bien Approval Detail thanh noi xu ly action co validation/permission, khong thay the `/proposals/[proposalId]` workflow hien co.
- PRD yeu cau: approve direct theo policy/assignment, workflow tuan tu co ban, outcomes approve/reject/return/forward/ask meeting/hold/cancel, reject/return bat buoc reason, approve comment tuy chon, audit cho mutation quan trong. [Source: _bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:241]
- UX spec goi pattern nay la Approval Action Panel: request summary, policy, amount, attachments, history va decision actions; reject/return bat buoc ly do. [Source: _bmad-output/planning-artifacts/ux-design-specification.md:711]

### Current Code State (Read Before Editing)

- `src/modules/proposals/services/proposal-service.ts` da co `approveProposal`, `rejectProposal`, `requestProposalChange`, `submitProposal`; cac ham nay cap nhat proposal/step/decision nhung chua scope-aware theo Approval Detail, chua validate reason bat buoc, chua co forward/ask_meeting/hold/cancel va wrappers action redirect ve `/proposals`.
- `src/modules/proposals/actions.ts` da co Server Actions cho proposal detail cu, load `getCurrentUser`, goi service, ghi audit qua `createAuditLog`, revalidate `/proposals` va redirect `/proposals/:id`. Story nay nen reuse/cau truc lai, khong copy paste mat audit.
- `src/modules/proposals/validation.ts` moi co `proposalInputSchema` va `proposalDecisionSchema` voi notes optional. Story nay can action-specific schema.
- `src/modules/proposals/types.ts` hien co status: `draft`, `submitted`, `in_review`, `change_requested`, `approved`, `rejected`, `archived`; decision: `submitted`, `approved`, `rejected`, `change_requested`, `archived`; step status: `pending`, `in_review`, `approved`, `rejected`, `change_requested`, `skipped`.
- `database/migrations/202605190001_create_proposals.sql` co check constraints cho proposal status, step status va decision value. Neu TypeScript enum/value duoc mo rong, migration check constraint phai duoc cap nhat de giu Supabase parity.
- `src/modules/proposals/services/proposal-repository.ts` la repository file-backed hien co, contract gom `updateProposal`, `addStep`, `updateStep`, `addDecision`; no chua co `addLink` cho proposal da ton tai. Khong co transaction that; service phai validate het truoc khi ghi de tranh partial mutation.
- `src/modules/proposals/services/approval-center-service.ts` da tao `getApprovalCenterDetailData`, queue/detail filter theo `queueProposalStatuses`, preserve `scopeId`, redact finance va build history. Story nay nen extend DTO/action capability tai day hoac helper gan service, khong duplicate detail loader.
- `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx` load session, selected scope assignments, role catalog va pass vao detail service. Approval action server action phai lam tuong tu de direct FormData khong bypass scope.
- `src/modules/executive/components/approval-request-detail.tsx` hien render summary, linked sources, policy, history va khong co mutation controls. Day la noi tu nhien de them action panel hoac compose component moi.
- `src/app/(dashboard)/proposals/[proposalId]/page.tsx` va `src/modules/proposals/components/proposal-detail.tsx` hien co action forms cu. Preserve behavior hoac migrate wrappers ma khong lam hong tests.
- `src/lib/permissions/can.ts` co permission keys `proposal.approve`, `proposal.reject`, `proposal.request_change`, `proposal.review`; `admin` da bi loai khoi business approval permissions. Khong hardcode admin la approver.
- `src/lib/permissions/access-scope.ts` co `resolveAccessScope`, `canReadProposalInScope`, `canAccessScopedAction`, `hasAnyScopedActionGrant`; use these for selected scope/action guard.
- `src/modules/users/services/user-service.ts#createAuditLog` tao audit log file-backed/Supabase-ready. Existing actions already call it; new approval route actions must also call it or centralize audit in service.

### File Targets

Expected NEW:
- `src/modules/executive/components/approval-action-panel.tsx` if action UI is split from detail component.
- `tests/unit/approval-actions-service.test.ts` or equivalent focused service test file if `proposal-service.test.ts` would become too broad.
- `database/migrations/YYYYMMDDNNNN_extend_proposal_approval_actions.sql` if status/decision/check constraint values are extended.

Expected UPDATE:
- `src/modules/proposals/types.ts`
- `src/modules/proposals/validation.ts`
- `src/modules/proposals/services/proposal-service.ts`
- `src/modules/proposals/actions.ts`
- `src/modules/proposals/services/approval-center-service.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/executive/components/approval-request-detail.tsx`
- `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx` if action props/context need route-level wiring.
- `tests/unit/proposal-service.test.ts`
- `tests/unit/approval-center-detail-service.test.ts`
- `tests/unit/approval-request-detail.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

Possible UPDATE:
- `src/modules/proposals/components/proposal-detail.tsx` if wrappers are refactored to shared action service.
- `src/modules/proposals/services/proposal-repository.ts` only if the repository contract needs link creation after proposal creation; prefer existing `addDecision`/`addStep`/`update*` first.
- `src/modules/executive/components/approval-center.tsx` only if queue labels/status need `on_hold` support.
- `database/seeds` or `.mock-data` seeding scripts if e2e needs deterministic action target data.

Avoid unless truly needed:
- Khong tao `approval-service` rieng tach khoi Proposal module.
- Khong tao real meeting CRUD cho `ask_meeting`; Story 6 owns One Meeting Engine.
- Khong lam full history/version/audit UI; Story 3.4 owns comprehensive timeline.
- Khong them dependency UI/state moi. Existing React, Server Actions, Tailwind, lucide-react, Button primitive la du.
- Khong chi hide action tren UI ma bo qua server/service permission.
- Khong render raw finance amount/title/link cua record ma user khong duoc xem roi moi an.

### Suggested Action Contract

```ts
export type ProposalApprovalAction =
  | "approve"
  | "reject"
  | "request_change"
  | "forward"
  | "ask_meeting"
  | "hold"
  | "cancel";

export type ProposalApprovalActionInput = {
  action: ProposalApprovalAction;
  notes?: string;
  reason?: string;
  targetRole?: string;
  targetUserId?: string;
  meetingType?: string;
  agendaDraft?: string;
  selectedScopeId?: string;
};
```

Guardrails:
- Use `reason` for required destructive/return paths; map to `ProposalDecision.notes` and `ProposalStep.decisionNotes`.
- Use `notes` for optional approve/hold/forward comments.
- Keep all returned DTOs serializable and camelCase.
- If an action is not supported for current status, return/throw a typed domain error before any repository write.

### Architecture Compliance

- Expected mutation flow: detail route/form -> Server Action -> current user + scope/catalog load -> Zod validation -> Proposal service permission/scope check -> repository mutation -> decision/audit -> revalidate/redirect.
- Permission enforcement is server/service layer. UI `availableActions` only improves UX.
- Service/repository boundary remains stable; tests should inject in-memory or JSON repository.
- Existing Proposal/Internal Approval remains workflow backbone. Executive mock approvals are not mutation authority.
- Missing optional fields use `undefined`; date/time as ISO string; date-only fields remain `YYYY-MM-DD`.
- Event/audit naming should use dot-case such as `proposal.approved`, `proposal.forwarded`, `proposal.meeting_requested`, `proposal.held`, `proposal.cancelled`. Architecture permits dot-case event names. [Source: _bmad-output/planning-artifacts/architecture.md:252]
- Keep direct URL no-leak behavior: unauthorized detail/action must not serialize forbidden payload.

### UX Guardrails

- Action panel should be operational and compact, not a wizard or landing page.
- Primary action: approve. Destructive actions: reject and cancel. Secondary actions: return, forward, ask meeting, hold.
- Destructive/critical mutation needs confirmation. UX spec explicitly marks reject/cancel/destructive action as requiring confirmation. [Source: _bmad-output/planning-artifacts/ux-design-specification.md:825]
- Button/field labels must be self-explanatory; do not use visible instructional text about keyboard shortcuts/features.
- Use visible text states; do not rely on color alone.
- Approval action must be keyboard-accessible and not hover-dependent. [Source: _bmad-output/planning-artifacts/ux-design-specification.md:1081]
- Validation/error messages should be near the affected field and specific enough to fix. [Source: _bmad-output/planning-artifacts/ux-design-specification.md:851]

### Previous Story Intelligence

- Story 3.1 created scoped queue and finance redaction. Its status remains `review`; re-run regression around `approval-center-service`, `command-center-dashboard`, and e2e Approval Center.
- Story 3.2 created read-only detail and then code-review patches:
  - linked proposal source href preserves selected `scopeId`;
  - approval detail rejects non-queue proposal statuses;
  - invalid date values fallback safely.
- Story 3.2 intentionally kept mutation controls out; Story 3.3 is the first place action buttons may appear in Approval Detail.
- Story 3.2 detail service filters `submitted`/`in_review`/`change_requested`; update this allow-list to include `on_hold` only. Do not re-open approved/rejected/cancelled detail.
- Story 1.4 delegation guard blocks delegated approval. Keep `assertNoDelegatedApprovalContext` semantics.
- Worktree has many existing modified/untracked files from prior stories. Read before editing and do not revert unrelated changes.

### Git / Recent Work Intelligence

- Recent git log is sparse (`484589a 2205`, `a8162e3 first fcm`); current working tree is the real source of BMad story work.
- Do not rely on commits to infer current state. Use local files and story records.

### Latest Tech Notes

- Project baseline from `package.json`: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Zod `^3.24.4`, Vitest `^3.1.3`, Testing Library React `^16.3.0`, Playwright `^1.52.0`.
- No dependency upgrade is needed for this story.
- Existing code mostly uses native Server Action forms. Do not introduce React Hook Form unless the implementation has a clear reason; Zod at server/action boundary is enough.

### Testing Guidance

- Red phase first:
  - `npm run test -- tests/unit/proposal-service.test.ts tests/unit/approval-center-detail-service.test.ts`
  - `npm run test -- tests/unit/approval-request-detail.test.tsx`
- Targeted regression:
  - `npm run test -- tests/unit/approval-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/command-center-service.test.ts`
  - `npm run test -- tests/unit/proposal-service.test.ts`
- E2E:
  - Reuse `useMockRole(page, "tong_giam_doc")` for allowed approval action panel.
  - Use a deterministic seeded approval that can be mutated without breaking later assertions, or isolate e2e order carefully.
  - Verify viewer/direct action cannot leak or mutate.
  - Keep viewport loop for Approval Detail at 360/390/768/1280.
- Full validation before dev marks complete:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run test:e2e` because this story changes mutation UI/routes.

### References

- `_bmad-output/planning-artifacts/epics.md:889` - Story 3.3 requirements and AC.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:241` - FR-035 to FR-042 approval action requirements.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md:489` - NFR-005/NFR-006 mutation permission and audit.
- `_bmad-output/planning-artifacts/architecture.md:46` - Proposal/Internal Approval backbone and cross-cutting permission/audit concerns.
- `_bmad-output/planning-artifacts/architecture.md:220` - naming/service/action/file structure patterns.
- `_bmad-output/planning-artifacts/architecture.md:413` - action/service/repository/audit data flow.
- `_bmad-output/planning-artifacts/ux-design-specification.md:711` - Approval Action Panel anatomy.
- `_bmad-output/planning-artifacts/ux-design-specification.md:875` - approval form validation fields.
- `_bmad-output/implementation-artifacts/3-1-approval-center-scoped-queue-va-axis-tabs.md` - queue/status/category/no-leak implementation notes.
- `_bmad-output/implementation-artifacts/3-2-approval-detail-cho-request-truc-1.md` - read-only detail DTO/route/UI and review patches.
- `src/modules/proposals/services/proposal-service.ts` - existing proposal actions to extend/refactor.
- `src/modules/proposals/actions.ts` - existing Server Actions and audit/revalidate pattern.
- `src/modules/proposals/validation.ts` - Zod boundary to extend.
- `src/modules/proposals/types.ts` - Proposal status/step/decision contracts.
- `src/modules/proposals/services/proposal-repository.ts` - repository contract and file-backed behavior.
- `src/modules/proposals/services/approval-center-service.ts` - queue/detail DTO, scope filtering, finance redaction, selected scope preservation.
- `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx` - Approval Detail route and selected scope loading.
- `src/modules/executive/components/approval-request-detail.tsx` - detail UI surface to compose action panel.
- `src/lib/permissions/can.ts` - permission keys and role behavior.
- `src/lib/permissions/access-scope.ts` - scoped action/read helpers.
- `src/modules/users/services/user-service.ts` - `createAuditLog`.
- `tests/unit/proposal-service.test.ts` - existing proposal action tests.
- `tests/unit/approval-center-detail-service.test.ts` - detail DTO no-leak/scope tests.
- `tests/unit/approval-request-detail.test.tsx` - detail component tests.
- `tests/e2e/mvp-smoke.spec.ts` - Approval Center/detail responsive smoke.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-29: Red phase `npm run test -- tests/unit/proposal-approval-actions-service.test.ts tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx` failed as expected on missing `applyProposalApprovalAction`, missing `availableActions` DTO data and missing Approval Action Panel.
- 2026-05-29: Focused green `npm run test -- tests/unit/proposal-approval-actions-service.test.ts tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx` => 22 passed.
- 2026-05-29: Static validation green: `npm run typecheck`, `npm run lint`.
- 2026-05-29: Targeted regression green: `npm run test -- tests/unit/proposal-service.test.ts tests/unit/proposal-approval-actions-service.test.ts tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx tests/unit/approval-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/command-center-service.test.ts` => 58 passed.
- 2026-05-29: Full unit green: `npm run test` => 54 files, 329 tests passed.
- 2026-05-29: First `npm run test:e2e` run passed new approval detail/action panel smoke tests but hit 2 pre-existing external-role route flakes; rerun passed all 47 Playwright tests.

### Completion Notes List

- Added a single Proposal-backed approval action use-case with Zod validation, status guards, scoped permission checks and delegated-approval blocking.
- Extended proposal status/step/decision contracts for forward, meeting request, hold and cancel outcomes, plus DB check-constraint migration and JSON repository `addLink`.
- Added Approval Detail action availability in the server DTO and rendered permission-aware action forms with required reason/confirmation fields and selected scope preservation.
- Added route-specific Server Action with audit logging, revalidation and redirects back to Approval Center for final statuses.
- Preserved existing proposal detail workflow wrappers while enforcing required reasons for return/reject paths.

### File List

- database/migrations/202605290001_extend_proposal_approval_actions.sql
- src/components/ui/button.tsx
- src/modules/executive/components/approval-action-panel.tsx
- src/modules/executive/components/approval-request-detail.tsx
- src/modules/executive/types/index.ts
- src/modules/proposals/actions.ts
- src/modules/proposals/components/proposal-detail.tsx
- src/modules/proposals/components/proposal-status-badge.tsx
- src/modules/proposals/services/approval-center-service.ts
- src/modules/proposals/services/proposal-repository.ts
- src/modules/proposals/services/proposal-service.ts
- src/modules/proposals/types.ts
- src/modules/proposals/validation.ts
- tests/e2e/mvp-smoke.spec.ts
- tests/unit/approval-center-detail-service.test.ts
- tests/unit/approval-center-service.test.ts
- tests/unit/approval-request-detail.test.tsx
- tests/unit/proposal-approval-actions-service.test.ts

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-29 | 1.0 | Created Story 3.3 implementation guide for approval actions, validation, permission/scope guards and audit on Proposal backbone. | Codex |
| 2026-05-29 | 1.1 | Implemented Proposal-backed approval actions, validation, permission/scope guards, action panel UI, audit/server action wiring and regression coverage. | Codex |
