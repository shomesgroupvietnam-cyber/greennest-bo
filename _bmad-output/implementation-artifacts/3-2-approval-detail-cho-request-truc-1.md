# Story 3.2: Approval Detail Cho Request Truc 1

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay tao approval detail read-only cho request Truc 1 tren Proposal/Approval backbone. Pham vi la detail DTO, scoped route/detail UI, request summary, policy, linked sources/attachments placeholder, existing history, finance redaction va responsive/a11y. Khong implement approve/reject/return/forward/ask-meeting/hold/cancel actions, full audit/version engine, module chuyen mon sau, Supabase schema moi hay approval flow rieng.

## Story

As a nguoi duyet,
I want xem approval detail voi request summary, policy, ho so va context Truc 1,
so that toi du thong tin truoc khi quyet dinh.

## Tieu Chi Chap Nhan

1. **Detail hien day du context Truc 1**
   - Given mot approval Truc 1 thuoc loai ho so, chi phi, phap ly, ky thuat, chien luoc hoac hop
   - When nguoi duyet mo detail tu Approval Center
   - Then he thong hien request summary, scope, proposer/requester, owner neu co, status, priority, deadline, amount neu duoc phep, policy ap dung, attachments/source links, linked project/module va history hien co.

2. **Linked sources dung placeholder/read-only cho Module 2-5**
   - Given request co lien ket toi project/document/meeting/module chuyen mon chua trien khai sau
   - When mo detail
   - Then he thong hien linked source o muc read-only hoac placeholder ro rang neu module chua co detail route
   - And khong tao repository/service logic chuyen mon sau ngoai scope Module 1.

3. **Finance-sensitive amount duoc redaction tu service**
   - Given user thieu quyen xem tai chinh nhay cam
   - When detail co amount nhay cam
   - Then service khong tra raw `amount`, `amountLabel` bi an hoac state `no_permission`
   - And DOM/serialized JSON khong chua finance sentinel.

4. **Record scope va direct access khong leak**
   - Given user khong co quyen xem approval hoac record nam ngoai selected scope
   - When user truy cap detail URL truc tiep
   - Then route/service tra unauthorized/not-found state theo pattern hien co va khong render/serialize title, amount, link hay history cua record do.

5. **Detail UI read-only, responsive va accessible**
   - Given viewport 360/390/768/1280
   - When mo approval detail
   - Then summary, policy, linked sources va history khong horizontal overflow bat thuong
   - And headings/regions/links co accessible name, focus order hop ly, badges co text khong chi dua vao mau.

6. **Regression boundaries duoc bao toan**
   - Given Story 3.1 da tao Approval Center queue va Story 2.x da tao Command Center/direct 403/no-leak behavior
   - When story nay hoan thanh
   - Then Approval Center queue van filter dung scope/category, `/command-center?view=executive-approvals` van hoat dong, `/proposals/[proposalId]` proposal detail/action flow hien co khong bi pha
   - And Story 3.3 action mutations van chua duoc expose trong approval detail.

## Tasks / Subtasks

- [x] Thiet ke detail DTO va type dung chung cho service/UI (AC: 1, 2, 3, 4, 5)
  - [x] Them type detail trong `src/modules/executive/types/index.ts` hoac `src/modules/proposals/types.ts` theo local pattern, vi du `ApprovalCenterDetailData`, `ApprovalCenterDetailSource`, `ApprovalCenterDetailPolicy`, `ApprovalCenterDetailHistoryItem`.
  - [x] DTO phai JSON-serializable: string/date ISO, plain object/array, khong `Date`, function, class instance hoac raw repository object.
  - [x] DTO khong chua raw numeric amount; neu duoc phep thi dung `amountLabel`, neu khong thi `financialAccess: "no_permission"` va copy trung tinh.
  - [x] DTO phai gom section ro: `requestSummary`, `policy`, `attachments`/`linkedSources`, `history`, `permissions`, `backHref`.

- [x] Implement Approval Detail service tren Proposal/Approval backbone (AC: 1, 2, 3, 4, 6)
  - [x] Mo rong `src/modules/proposals/services/approval-center-service.ts` voi function moi, vi du `getApprovalCenterDetailData({ sourceType, sourceId }, user, options)`.
  - [x] Reuse `proposalRepository.getProposalDetail` va current queue helpers/category mapping; khong tao approval repository/flow moi.
  - [x] Enforce read permission bang `resolveAccessScope`, `canReadProposalInScope`, `canAccessScopedAction`, `hasAnyScopedActionGrant` va role permission catalog/scope assignments nhu Story 3.1.
  - [x] Khong rely truc tiep vao `getProposalDetail` neu path do co the bypass selected scope; detail service phai scope-check record truoc khi tra DTO.
  - [x] Chi support proposal-backed detail trong MVP. Neu `sourceType` khac `proposal`, tra no-detail/not-supported state ro hoac khong tao href tu queue.
  - [x] Map policy tu `ProposalStep` hien co: current step, `thresholdLabel`, `thresholdPolicyId`, `requiredPermission`, `approverRole`, `approvalLevel`, `status`, `decidedBy`, `decidedAt`.
  - [x] Map history tu `ProposalDecision[]` va step decisions hien co theo thu tu deterministic; full audit/version chi de Story 3.4.

- [x] Build safe linked source/attachment projection (AC: 1, 2, 4)
  - [x] Convert `ProposalLink[]` thanh DTO source item voi `entityType`, `entityId`, `relationType`, label, state va optional safe internal href.
  - [x] Chi tao href cho route noi bo da ton tai hoac duoc san pham ky vong, vi du `/projects/:id`, `/documents/:id`, `/meetings/:id`, `/tasks/:id`; unknown/future modules phai la placeholder khong href.
  - [x] Href builder nam trong service/helper, khong ghep URL tu raw id trong component; href neu co phai bat dau bang `/` va khong bat dau bang `//`.
  - [x] Khong import documents/projects repositories neu chi can placeholder/read-only metadata; tranh tao dependency sau vao Module 2-5.

- [x] Tich hop route va Approval Center queue href (AC: 1, 4, 6)
  - [x] Tao route read-only moi, uu tien `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx`, de khong tron voi proposal edit/action detail hien co.
  - [x] Route load `currentUser`, active scope assignments, role permission catalog va `scopeId` tu query neu co; pass vao detail service giong command-center selected scope behavior.
  - [x] Cap nhat queue item href trong `approval-center-service.ts` tu proposal source sang `/approvals/proposal/${encodeURIComponent(proposal.id)}` va preserve `scopeId` query khi Approval Center dang o selected scope.
  - [x] Giu `/proposals/[proposalId]` va `ProposalDetail` hien co hoat dong cho proposal workflow; neu bat buoc dung chung component thi them prop mode read-only co default khong doi behavior cu.
  - [x] Unauthorized direct access phai dung `UnauthorizedState`/`notFound`/403 pattern hien co va khong leak payload.

- [x] Xay UI Approval Request Detail read-only (AC: 1, 2, 3, 5, 6)
  - [x] Tao component gan domain, vi du `src/modules/executive/components/approval-request-detail.tsx` hoac `src/modules/proposals/components/approval-request-detail.tsx`.
  - [x] Render summary header, status/category/priority/due badges, proposer/requester, scope/project/module, finance state, policy section, linked sources section va history section.
  - [x] Dung section/region/headings co accessible name: `Request summary`, `Policy`, `Linked sources`, `History` hoac copy Viet khong dau tuong duong.
  - [x] Khong render forms/buttons mutation `approve`, `reject`, `return`, `request changes`, `forward`, `hold`, `cancel`; Story 3.3 moi them action panel.
  - [x] Mobile dung stacked sections/cards; desktop co the dung two-column detail/sidebar nhung khong dat card trong card va khong overflow text.

- [x] Harden permission, no-leak va finance redaction (AC: 3, 4, 6)
  - [x] Detail service phai tra sanitized DTO sau permission/scope filtering; component khong tu an secret.
  - [x] User co `proposal.view` global nhung selected scope khong gom record phai bi block trong approval-detail context.
  - [x] User thieu `finance.view` va scoped finance grant khong thay amount sentinel trong `JSON.stringify(dto)`, DOM, test failure output.
  - [x] Secretary/assistant delegation khong duoc xem nhu approver thay lanh dao neu khong co approval/read scope phu hop.
  - [x] Admin/settings roles khong duoc auto coi la business approver neu permission catalog khong cap grant tuong ung.

- [x] Unit/component/e2e coverage tap trung vao detail (AC: 1, 2, 3, 4, 5, 6)
  - [x] Them `tests/unit/approval-center-detail-service.test.ts` hoac mo rong `approval-center-service.test.ts` cho detail DTO.
  - [x] Test detail cho it nhat proposal-backed category ho so, tai chinh, phap ly, ky thuat, chien luoc va meeting-linked request.
  - [x] Test linked source placeholder: unknown/future module khong co href nhung hien label/read-only state.
  - [x] Test out-of-scope direct detail khong tra title/amount/link/history sentinel.
  - [x] Test finance redaction trong DTO/JSON khi user thieu `finance.view`.
  - [x] Component test bang Testing Library role queries cho summary/policy/linked sources/history va assert khong co action buttons.
  - [x] Cap nhat e2e smoke neu route moi duoc them: tu `/command-center?view=executive-approvals` click detail link, assert detail sections va no horizontal overflow 360/390/768/1280.

### Review Findings

- [x] [Review][Patch] Linked proposal source href drops selected scope and can bypass scoped detail filtering [src/modules/proposals/services/approval-center-service.ts:340]
- [x] [Review][Patch] Approval detail service returns proposal statuses that are not Approval Center queue requests [src/modules/proposals/services/approval-center-service.ts:757]
- [x] [Review][Patch] Detail UI date formatting can throw or misrender unvalidated proposal dates [src/modules/executive/components/approval-request-detail.tsx:23]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 3 xay Approval Center tren Proposal/Approval backbone. Story 3.1 da tao queue/tabs. Story 3.2 la drill-down read-only truoc khi quyet dinh. Story 3.3 moi them action mutations.
- Truc 1 detail can phu hop 6 nhom approval: ho so/van ban, tai chinh/chi, chien luoc, ky thuat, phap ly, hop.
- Detail can giup nguoi duyet hieu request, policy, source context va history hien co; khong can tao module chuyen mon sau hoac full audit engine.

### Current Code State (Read Before Editing)

- `src/modules/proposals/services/approval-center-service.ts` da co `getApprovalCenterData`, category mapping 6 nhom, due/priority sorting, finance redaction va queue href proposal-backed dang la `/proposals/${id}`. `ApprovalCenterServiceOptions` hien la internal type; story nay co the export/extend neu route/test can inject scope/options.
- Queue service dang scope-filter proposals bang `resolveAccessScope` + `canReadProposalInScope` va bridge `LeadershipApproval` mock chi de display. Detail story nen reuse pattern nay, khong copy logic thanh flow moi.
- `src/modules/executive/types/index.ts` da co `ApprovalCenterData`, `ApprovalCenterQueueItem`, `ApprovalCenterSourceType`, `ApprovalCenterFinancialAccess`. Them detail types gan cac type nay de tranh DTO song song khac ten.
- `src/modules/executive/components/approval-center.tsx` la Client Component read-only, co tabs, queue cards va `Open source` link. Update link label/href duoc, nhung khong them action controls.
- `src/modules/command-center/services/command-center-service.ts` truyen `leadershipApprovals`, scope assignments, role catalog va `scopeLabel` vao `getApprovalCenterData`; chua truyen `selectedScopeId`. Neu detail href can preserve selected scope, them option `selectedScopeId`.
- `src/app/(dashboard)/proposals/[proposalId]/page.tsx` hien render `ProposalDetail` voi submit/request-change/approve/reject props dua tren global `can(...)`. Khong dung page nay lam approval detail neu no expose action ngoai scope story.
- `src/modules/proposals/components/proposal-detail.tsx` hien co action forms va chua render `detail.links`. Neu reuse thi phai co explicit read-only mode va default behavior cu khong doi.
- `src/modules/proposals/services/proposal-service.ts#getProposalDetail` allow read khi user co `proposal.view` hoac la submittedBy/requestedBy va chi redact finance theo global `finance.view`; no khong enforce selected Approval Center scope. Approval detail service phai them scope check rieng.
- `src/modules/proposals/types.ts` co `Proposal`, `ProposalStep`, `ProposalLink`, `ProposalDecision`; dung cac type nay lam source of truth cho detail DTO.
- Existing tests quan trong: `tests/unit/approval-center-service.test.ts`, `tests/unit/command-center-dashboard.test.tsx`, `tests/unit/command-center-service.test.ts`, `tests/unit/proposal-service.test.ts`, `tests/e2e/mvp-smoke.spec.ts`.

### File Targets

Expected NEW:
- `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx`
- `src/modules/executive/components/approval-request-detail.tsx` hoac `src/modules/proposals/components/approval-request-detail.tsx`
- `tests/unit/approval-center-detail-service.test.ts`
- `tests/unit/approval-request-detail.test.tsx` neu component logic du lon

Expected UPDATE:
- `src/modules/executive/types/index.ts`
- `src/modules/proposals/services/approval-center-service.ts`
- `src/modules/executive/components/approval-center.tsx`
- `src/modules/command-center/services/command-center-service.ts`
- `tests/unit/approval-center-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts` neu route/detail e2e duoc them

Possible UPDATE:
- `src/modules/command-center/types.ts` neu `ApprovalCenterData` hoac selected scope contract thay doi.
- `src/app/(dashboard)/proposals/[proposalId]/page.tsx` va `src/modules/proposals/components/proposal-detail.tsx` chi neu quyet dinh reuse read-only mode; khong pha proposal action flow hien co.
- `src/modules/proposals/services/proposal-service.ts` chi neu can export sanitizer/helper; khong mo rong global read logic de bypass scope.

Avoid unless truly needed:
- Khong tao approval action UI/mutation cua Story 3.3.
- Khong tao audit/version storage cua Story 3.4.
- Khong tao repository/service rieng cho documents/projects/meetings neu chi can placeholder source metadata.
- Khong them dependency UI/state moi; dung React, Next App Router, Tailwind, lucide-react va patterns hien co.
- Khong hardcode role name thanh approver authority; permission helpers va scope assignments la authority.
- Khong expose raw secret field roi an bang CSS/client.

### Suggested DTO Shape

Co the dieu chinh ten theo local style, nhung phai giu cac guarantee:

```ts
export type ApprovalCenterDetailSourceState =
  | "linked"
  | "placeholder"
  | "no_permission";

export type ApprovalCenterDetailSource = {
  id: string;
  entityType: string;
  entityId: string;
  relationType: string;
  label: string;
  helper: string;
  state: ApprovalCenterDetailSourceState;
  href?: string;
};

export type ApprovalCenterDetailPolicy = {
  currentStepId?: string;
  stepOrder?: number;
  thresholdPolicyId?: string;
  thresholdLabel?: string;
  requiredPermission?: string;
  approverRole?: string;
  approvalLevel?: string;
  status?: string;
};

export type ApprovalCenterDetailHistoryItem = {
  id: string;
  kind: "decision" | "step";
  label: string;
  actorId?: string;
  occurredAt: string;
  status?: string;
  notes?: string;
};

export type ApprovalCenterDetailData = {
  generatedAt: string;
  backHref: string;
  source: {
    sourceType: "proposal";
    sourceId: string;
    code: string;
    title: string;
    axisKey: "axis_1";
    category: ApprovalCenterQueueCategory;
    categoryLabel: string;
    status: string;
    statusLabel: string;
  };
  permissions: {
    canView: true;
    canViewFinance: boolean;
  };
  requestSummary: {
    summary?: string;
    scopeLabel: string;
    proposer: string;
    submittedBy?: string;
    ownerName?: string;
    projectId?: string;
    projectName?: string;
    module: string;
    priority: string;
    dueDate?: string;
    financialAccess: ApprovalCenterFinancialAccess;
    amountLabel?: string;
  };
  policy: ApprovalCenterDetailPolicy | null;
  linkedSources: ApprovalCenterDetailSource[];
  history: ApprovalCenterDetailHistoryItem[];
};
```

Guardrails:
- `amountLabel` only exists when finance access is allowed; do not include numeric `amount`.
- `history` must be sorted deterministic, newest-first or oldest-first but documented/tested.
- `backHref` should return to `/command-center?view=executive-approvals` and preserve `scopeId` if available.
- Unsupported `sourceType` should not create fake data. Return `undefined`, `notSupported`, or `notFound` with no record leak.

### Architecture Compliance

- Expected flow: route guard/current user -> scope selection/catalog load -> Approval Detail service -> sanitized DTO -> read-only component.
- Permission enforcement stays server/service layer. UI renders only filtered DTO.
- Component must not import repositories, permission services, Supabase clients, policy repositories or scope assignment services.
- Repository boundary stays stable: tests can inject `ProposalRepository`.
- Use existing permission helpers from `src/lib/permissions/*`; do not duplicate RBAC logic in component.
- Keep internal DTO camelCase and serializable for Client Component props.
- Proposal/Internal Approval remains workflow backbone. Executive mock approvals are not authority for detail.

### UX Guardrails

- Approval detail should be dense, scannable and operational, not a landing page.
- First viewport should show title/code/status, scope/project, requester/proposer, deadline/priority and start of policy/source context.
- Use visible text badges for category/status/finance state; color alone is insufficient.
- Linked sources need clear states: linked route, placeholder read-only, or no permission.
- Empty history/source states should be explicit and not imply a load failure.
- No visible instructional copy about shortcuts/features. Labels should describe the record, not explain the app.
- Mobile uses stacked sections; desktop may use main/detail sidebar. Avoid nested cards and table-only layouts.

### Previous Story Intelligence

- Story 3.1 added `ApprovalCenterData`, six category queue mapping, scoped queue filtering, finance redaction, Truc 2/3 placeholders and safe read-only queue UI. Build detail from that service/DTO pattern.
- Story 3.1 queue has proposal-backed hrefs and leadership mock items without href. Do not create fake detail for mock leadership approvals unless backed by real proposal data.
- Story 2.7 hardened safe href/no-leak/responsive behavior. Service-side href building and JSON no-leak tests are required for detail too.
- Story 1.2 introduced scope assignments; selected scope must matter for direct detail access.
- Story 1.3 introduced approval threshold policy and proposal steps contain policy labels. Surface policy from existing step data; do not hardcode thresholds.
- Story 1.4 delegation rules block delegated approval in MVP. Do not allow secretary/assistant detail/action behavior to imply approval authority.
- Worktree has many existing modified/untracked files from prior stories. Read before editing and do not reset/revert unrelated changes.

### Git / Recent Work Intelligence

- Git log is sparse (`484589a 2205`, `a8162e3 first fcm`); most BMad work is in the working tree rather than commits.
- Treat current files as source of truth. Do not rely on commit history to discover Story 3.1 implementation details.
- Story 3.1 is currently `review` in sprint status, not `done`. Story 3.2 can be created because it depends on the implemented Story 3.1 artifacts, but dev should re-run relevant Story 3.1 regression tests.

### Latest Tech Notes

- Project baseline from `package.json`: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Vitest `^3.1.3`, Testing Library React `^16.3.0`, Playwright `^1.52.0`. No dependency upgrade needed for this story.
- Verified 2026-05-29: Next `forbidden()` renders a 403 authorization error and requires `experimental.authInterrupts`; this repo already uses the existing forbidden/unauthorized route guard pattern from prior stories. Source: https://nextjs.org/docs/app/api-reference/functions/forbidden
- Verified 2026-05-29: Props passed from Server Components to Client Components need to be serializable by React. Keep approval detail DTO plain. Source: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- Verified 2026-05-29: Testing Library role queries support accessible name and selected state filters; use `getByRole`/`queryByRole` for sections, links and absence of action buttons. Source: https://testing-library.com/docs/queries/byrole
- Verified 2026-05-29: Playwright supports viewport testing with `page.setViewportSize`; use it if adding responsive e2e for detail. Source: https://playwright.dev/docs/emulation

### Testing Guidance

- Red phase first:
  - `npm run test -- tests/unit/approval-center-detail-service.test.ts`
  - `npm run test -- tests/unit/approval-request-detail.test.tsx`
- Targeted regression:
  - `npm run test -- tests/unit/approval-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/command-center-service.test.ts`
  - `npm run test -- tests/unit/proposal-service.test.ts`
- Full validation before dev marks complete:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run test:e2e` if e2e route/responsive coverage is added or existing smoke is changed.

### References

- `_bmad-output/planning-artifacts/epics.md` - Epic 3 overview and Story 3.2 requirements/AC/files/dependencies.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-029 to FR-034, NFR-001, NFR-004.
- `_bmad-output/planning-artifacts/architecture.md` - Proposal/Internal Approval backbone, modular monolith, service/repository boundary, server/service permission enforcement, testing stack.
- `_bmad-output/planning-artifacts/ux-design-specification.md` - Approval Action Panel, record drilldown/detail, source links, history/timeline and responsive/a11y expectations.
- `_bmad-output/implementation-artifacts/3-1-approval-center-scoped-queue-va-axis-tabs.md` - current Approval Center queue implementation notes, tests and file list.
- `src/modules/proposals/services/approval-center-service.ts` - Story 3.1 queue service to extend.
- `src/modules/executive/types/index.ts` - existing Approval Center queue DTO types.
- `src/modules/executive/components/approval-center.tsx` - existing Approval Center read-only queue UI.
- `src/modules/command-center/services/command-center-service.ts` - selected scope and Approval Center composition.
- `src/app/(dashboard)/proposals/[proposalId]/page.tsx` - existing proposal detail route with action forms; preserve behavior.
- `src/modules/proposals/components/proposal-detail.tsx` - existing proposal detail component with action forms and no link rendering.
- `src/modules/proposals/services/proposal-service.ts` - proposal detail finance redaction but no selected-scope approval detail guard.
- `src/modules/proposals/types.ts` - Proposal/step/link/decision source types.
- `src/lib/permissions/access-scope.ts` - scope filtering helpers.
- `src/lib/permissions/can.ts` - permission checks and business approval permission behavior.
- `tests/unit/approval-center-service.test.ts` - queue category/scope/finance tests to extend or mirror.
- `tests/unit/proposal-service.test.ts` - proposal workflow and finance redaction regression tests.
- `tests/unit/command-center-dashboard.test.tsx` - Approval Center component/regression tests.
- `tests/e2e/mvp-smoke.spec.ts` - command center, forbidden and responsive smoke suite.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-29: Red phase `npm run test -- tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx` failed on missing `getApprovalCenterDetailData`, old proposal href and missing `ApprovalRequestDetail`, as expected.
- 2026-05-29: New detail tests green: `npm run test -- tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx` => 10 passed.
- 2026-05-29: Targeted regression green: `npm run test -- tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx tests/unit/approval-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/command-center-service.test.ts tests/unit/proposal-service.test.ts` => 46 passed.
- 2026-05-29: Static validation green: `npm run typecheck`, `npm run lint`.
- 2026-05-29: Full unit green: `npm run test` => 53 files, 317 tests passed.
- 2026-05-29: Full e2e green: `npm run test:e2e` => 46 passed.
- 2026-05-29: Code review patches green: `npm run test -- tests/unit/approval-center-detail-service.test.ts tests/unit/approval-request-detail.test.tsx` => 16 passed.
- 2026-05-29: Code review regression green: `npm run typecheck`, `npm run lint`, `npm run test -- tests/unit/approval-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/command-center-service.test.ts tests/unit/proposal-service.test.ts` => 36 passed.
- 2026-05-29: Post-review e2e green: `npm run test:e2e` => 46 passed.

### Completion Notes List

- Added serializable `ApprovalCenterDetailData` DTO types with request summary, policy, linked sources, history, permission state and finance redaction.
- Extended `approval-center-service` with proposal-backed `getApprovalCenterDetailData`, service-side source href building, selected-scope checks, safe queue detail hrefs and no raw amount in detail DTOs.
- Added read-only `/approvals/proposal/[sourceId]` route that loads scope assignments/catalog, preserves `scopeId`, renders unauthorized state without payload leaks, and keeps `/proposals/[proposalId]` behavior untouched.
- Added `ApprovalRequestDetail` UI with accessible request summary, policy, linked sources and history regions, responsive stacked layout and no mutation action controls.
- Added unit/component/e2e coverage for categories, linked source placeholders, out-of-scope no-leak, finance redaction, read-only UI, detail drill-down and responsive viewport fit.
- Resolved code review findings: linked proposal source hrefs preserve selected scope, approval detail route rejects non-queue proposal statuses, and detail date formatting falls back safely on invalid dates.

### File List

- `src/app/(dashboard)/approvals/[sourceType]/[sourceId]/page.tsx`
- `src/modules/executive/components/approval-request-detail.tsx`
- `src/modules/executive/components/approval-center.tsx`
- `src/modules/executive/types/index.ts`
- `src/modules/proposals/services/approval-center-service.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `tests/unit/approval-center-detail-service.test.ts`
- `tests/unit/approval-request-detail.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`
- `_bmad-output/implementation-artifacts/3-2-approval-detail-cho-request-truc-1.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-29 | 1.0 | Created Story 3.2 implementation guide for read-only Approval Detail, scoped access, linked source placeholders and finance no-leak. | Codex |
| 2026-05-29 | 1.1 | Implemented Approval Detail DTO/service/route/UI with scoped no-leak, finance redaction, linked source placeholders and tests. | Codex |
| 2026-05-29 | 1.2 | Resolved code review patches for selected-scope source links, queue-status filtering and date fallback handling. | Codex |
