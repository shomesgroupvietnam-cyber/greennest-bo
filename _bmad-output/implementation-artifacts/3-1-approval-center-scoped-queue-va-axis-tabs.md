# Story 3.1: Approval Center Scoped Queue Va Axis Tabs

Status: review

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay mo Epic 3 va chi tao Approval Center queue/read surface cho Module 1. Pham vi la tabs Truc 1/2/3, scoped queue, category grouping, placeholder ro cho Truc 2/3, permission/no-leak va responsive/a11y co ban. Khong implement approval detail day du, approve/reject/return/forward action, configurable approval engine production-grade, risk CRUD, decision center, meeting engine CRUD hay module chuyen mon sau.

## Story

As a lanh dao co quyen duyet,  
I want xem Approval Center theo Truc 1/2/3 va queue uu tien,  
so that toi xu ly dung request trong pham vi cua minh.

## Tieu Chi Chap Nhan

1. **Approval Center hien tabs Truc 1/2/3 va placeholder ro**
   - Given nguoi dung co quyen vao Approval Center
   - When mo Approval Center tu `/executive/approvals` hoac `/command-center?view=executive-approvals`
   - Then he thong hien tabs `Truc 1`, `Truc 2`, `Truc 3`
   - And Truc 2/3 co the la placeholder/mock nhung phai gan nhan ro la chua co flow chi tiet trong MVP.

2. **Truc 1 queue phan loai approval trong scope**
   - Given Truc 1 co approval trong scope cua nguoi dung
   - When queue tai du lieu
   - Then approval duoc phan loai toi thieu theo `ho_so_van_ban`, `tai_chinh_chi`, `chien_luoc`, `ky_thuat`, `phap_ly`, `hop`
   - And item hien title, code/type, project/scope, requester, owner/approver neu co, deadline/due group, status, priority/risk, policy/threshold label neu co va route/detail affordance an toan neu co.

3. **Service khong tra approval ngoai quyen**
   - Given nguoi dung khong co quyen xem mot approval hoac ngoai scope record
   - When service tao Approval Center DTO
   - Then approval do khong xuat hien trong DTO/DOM/serialized JSON
   - And khong render roi an o frontend; permission/scope phai enforce o service/server layer.

4. **Tai chinh nhay cam trong queue duoc redaction truoc UI**
   - Given approval tai chinh/chi co amount/amountLabel nhay cam
   - When user thieu `finance.view` trong scope do
   - Then service khong tra amount/raw amount/amountLabel nhay cam trong DTO va UI hien no-permission/redacted state neu can.

5. **Responsive va accessibility co ban cho tabs/queue**
   - Given viewport 360/390/768/1280
   - When mo Approval Center
   - Then tabs/filters/queue khong gay horizontal overflow bat thuong; bang rong co compact list alternative tren mobile
   - And tabs/button/link co accessible name, selected tab co state ro, badge co text khong chi dua vao mau, focus order hop ly.

6. **Regression boundaries duoc bao toan**
   - Given Story 2.1-2.7 da tao Command Center, executive DTOs, drill-down metadata va direct unauthorized 403
   - When story nay hoan thanh
   - Then `/command-center?view=executive-dashboard`, `executive-morning-briefing`, `executive-common-center`, `executive-private-workspace`, legacy executive redirect va proposal list/detail finance redaction van hoat dong
   - And khong tao approval flow rieng ngoai Proposal/Approval backbone.

## Tasks / Subtasks

- [x] Thiet ke Approval Center DTO dung chung cho command-center/executive view (AC: 1, 2, 3, 4, 6)
  - [x] Them type moi trong `src/modules/executive/types/index.ts` hoac `src/modules/proposals/types.ts`, vi du `ApprovalCenterData`, `ApprovalAxisTab`, `ApprovalQueueItem`, `ApprovalQueueCategory`, `ApprovalCenterPlaceholder`.
  - [x] Category toi thieu phai map duoc ve 6 nhom nghiep vu: ho so/van ban, tai chinh/chi, chien luoc, ky thuat, phap ly, hop.
  - [x] DTO phai JSON-serializable: ISO string/date-only string, plain object/array, khong function/class instance/Date object song/repository object.
  - [x] DTO khong chua finance-sensitive field neu user thieu `finance.view` hoac scoped finance grant.

- [x] Tao Approval Center service tren Proposal/Approval backbone (AC: 2, 3, 4, 6)
  - [x] Tao service moi, uu tien `src/modules/proposals/services/approval-center-service.ts` hoac `src/modules/executive/services/approval-center-service.ts`, nhung khong duplicate approval flow.
  - [x] Load proposal-backed approvals tu `src/modules/proposals/services/proposal-service.ts`/repository contract va leadership mock approvals hien co neu can bridge cho legacy executive data.
  - [x] Reuse permission helpers `can`, `resolveAccessScope`, `filterProposalsForScope`, `canAccessScopedAction`, `hasAnyScopedActionGrant`, `selectScopeAssignmentsForUser` khi can scope-aware behavior.
  - [x] Chi dua approval `submitted`/`in_review`/`change_requested`/pending-equivalent vao queue theo rule ro; draft/archive khong duoc len queue mac dinh.
  - [x] Tinh due group/priority/order deterministic: overdue truoc, high/urgent/risk cao tiep, deadline gan hon tiep, updatedAt moi hon sau do.
  - [x] Truc 2/3 tra placeholder/mock summary ro rang, khong gia lap data chi tiet nhu da production-ready.

- [x] Tich hop route va Command Center view (AC: 1, 3, 6)
  - [x] Giu `/executive/approvals` redirect ve `/command-center?view=executive-approvals` qua `renderExecutivePage`.
  - [x] Cap nhat `src/modules/command-center/services/command-center-service.ts` de tra `approvalCenter`/equivalent DTO khi user co executive/proposal approval access.
  - [x] Cap nhat `src/modules/command-center/types.ts` de expose DTO moi cho Client Component.
  - [x] Cap nhat `src/modules/command-center/components/command-center-dashboard.tsx` de render Approval Center moi cho `executive-approvals` thay vi list legacy action buttons.
  - [x] Neu can, cap nhat executive nav label nhung khong doi route canonical.

- [x] Xay UI Approval Center tabs va scoped queue (AC: 1, 2, 4, 5)
  - [x] Tao component gan domain, vi du `src/modules/executive/components/approval-center.tsx` hoac `src/modules/proposals/components/approval-center.tsx`.
  - [x] Tabs Truc 1/2/3 phai co role/aria selected hoac semantic buttons ro; selected tab co visual va a11y state.
  - [x] Truc 1 hien queue uu tien + category filters/sections; moi item co status, category, scope, requester, due date, risk/priority va read/detail affordance neu safe.
  - [x] Truc 2/3 hien placeholder/mock label ro: "Placeholder MVP" hoac copy tuong duong, khong lam nguoi dung tuong flow da san sang.
  - [x] Mobile `<768px` dung compact list; khong ep table min-width trong workflow chinh; text tieng Viet wrap tot.
  - [x] Empty/no-access state noi ro `khong co approval trong scope` vs `khong co quyen Approval Center`.

- [x] Harden permission, no-leak va finance redaction (AC: 3, 4, 6)
  - [x] Module/workspace-level unauthorized tiep tuc dung `requireWorkspaceRoute("/executive")` cho direct executive view; khong downgrade ve UI-only hiding.
  - [x] Record-level service filtering phai loai approval ngoai scope truoc khi tra DTO.
  - [x] Finance amount sentinel phai khong xuat hien trong `JSON.stringify(dto)` va DOM khi user thieu `finance.view`.
  - [x] Admin/settings roles khong co business approval permission khong duoc thay queue/action nhu nguoi duyet nghiep vu.
  - [x] Khong cho thu ky/tro ly approve thay lanh dao; story nay chi xem/queue, action mutation de Story 3.3.

- [x] Unit/component tests cho service, tabs, category, no-leak (AC: 1, 2, 3, 4, 5, 6)
  - [x] Them `tests/unit/approval-center-service.test.ts` hoac mo rong test phu hop cho scoped query/category/due ordering.
  - [x] Test Truc 1 category mapping day du 6 nhom, Truc 2/3 placeholder label ro.
  - [x] Test user ngoai scope khong thay approval sentinel trong DTO/DOM/JSON.
  - [x] Test user thieu finance permission khong thay sentinel amount/amountLabel.
  - [x] Test component bang Testing Library role queries cho tabs, selected state, queue region, empty/no-access state.
  - [x] Regression tests khong lam hong `tests/unit/command-center-dashboard.test.tsx`, `tests/unit/executive-service.test.ts`, `tests/unit/proposal-service.test.ts`.

- [x] E2E/responsive smoke cho Approval Center (AC: 1, 3, 5, 6)
  - [x] Cap nhat `tests/e2e/mvp-smoke.spec.ts` de mo `/command-center?view=executive-approvals` voi leadership user.
  - [x] Assert heading Approval Center, tabs Truc 1/2/3, Truc 2/3 placeholder, va queue Truc 1 hien item/empty state dung.
  - [x] Them viewport toi thieu 360, 390, 768, 1280 cho Approval Center; assert `document.documentElement.scrollWidth <= window.innerWidth + 8`.
  - [x] Assert viewer/direct unauthorized executive approvals flow 403 va khong render approval title/finance sentinel.
  - [x] Chay `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`.

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 3 xay Approval Center tren Proposal/Approval backbone. Story 3.1 chi tao surface doc/queue: xem dung approval trong scope, grouped theo truc/category va co placeholder Truc 2/3.
- Approval Center khac Dashboard drill-down: day la work queue cua nguoi duyet, nhung mutation approve/reject/return/forward/ask meeting/hold/cancel thuoc Story 3.3.
- Truc 1 la detailed MVP; Truc 2/3 duoc phep placeholder/mock nhung phai gan nhan ro va khong tao expectation sai.
- Data approval co the den tu hai nguon hien co:
  - Proposal module (`src/modules/proposals`) la backbone that cho proposal/approval.
  - Executive mock approvals (`src/modules/executive/mock-data/executive-mock-data.ts`) dang cap legacy leadership view. Neu bridge, phai sanitize va scope filter nhu DTO service, khong coi mock UI la authority.

### Current Code State (Read Before Editing)

- `/executive/approvals` hien redirect qua `src/app/executive/_lib/render-executive-page.tsx` sang `/command-center?view=executive-approvals`. Giu pattern nay.
- `src/app/command-center/page.tsx` dung `requireWorkspaceRoute("/executive")` cho moi `executive-*` view tru `executive-private-workspace`; viewer read-only private workspace la exception tu Story 2.6. Khong doi guard nay neu khong co ly do rat ro.
- `src/modules/command-center/components/command-center-dashboard.tsx` co `knownExecutiveViewKeys` da include `executive-approvals`. Branch `activeView === "executive-approvals"` hien dang render legacy list `data.approvals` va mock local action buttons. Story nay nen thay bang Approval Center read/queue component, khong mo mutation action that.
- `src/modules/command-center/services/command-center-service.ts` dang lay `executiveData.approvals` vao `executiveWorkspace.approvals`. Co the them `approvalCenter` DTO song song de tranh pha legacy types trong mot lan.
- `src/modules/executive/services/executive-service.ts` dang scope-filter executive mock data qua `forExecutiveScope`, role visibility va finance sanitizer. Logic nay co the reuse/bridge, nhung khong nen lam source duy nhat cho Proposal backbone.
- `src/modules/executive/types/index.ts` co `LeadershipApproval`, `ExecutiveLeadershipActionItem`, `ExecutiveAxisDefinition` va category/risk types. Axis definitions da co 3 truc: `project_management`, `build_management`, `operations_analytics`; approvalCategories dang granular va can map ve 6 nhom story yeu cau.
- `src/modules/proposals/types.ts` co `Proposal`, `ProposalStep`, `ProposalDecision`, `ProposalLink`. Status hien co: `draft`, `submitted`, `in_review`, `change_requested`, `approved`, `rejected`, `archived`.
- `src/modules/proposals/services/proposal-service.ts` da co `listProposals`, `getProposalDetail`, `submitProposal`, `approveProposal`, `rejectProposal`, `requestProposalChange`; finance redaction cho users thieu `finance.view` da duoc patch tu Story 2.7. Khong bypass service/repository boundary.
- `src/lib/permissions/access-scope.ts` co `resolveAccessScope`, `filterProposalsForScope`, `canReadProposalInScope`, `canAccessScopedAction`, `hasAnyScopedActionGrant`. Reuse de filter proposal queue.
- `src/lib/permissions/can.ts` co permission keys `proposal.view`, `proposal.review`, `proposal.approve`, `proposal.reject`, `proposal.request_change`, `finance.view`, etc. Admin role bi tach khoi business approval permissions; khong hardcode admin la nguoi duyet.
- Existing tests co coverage quan trong: `tests/unit/executive-service.test.ts`, `tests/unit/proposal-service.test.ts`, `tests/unit/command-center-dashboard.test.tsx`, `tests/e2e/mvp-smoke.spec.ts`.
- Worktree hien co rat nhieu changed/untracked files tu cac story truoc. Doc file truoc khi sua; khong reset/revert thay doi khong lien quan.

### File Targets

Expected NEW:
- `src/modules/proposals/services/approval-center-service.ts` hoac `src/modules/executive/services/approval-center-service.ts`
- `src/modules/executive/components/approval-center.tsx` hoac `src/modules/proposals/components/approval-center.tsx`
- `tests/unit/approval-center-service.test.ts`

Expected UPDATE:
- `src/modules/executive/types/index.ts`
- `src/modules/command-center/types.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

Possible UPDATE:
- `src/modules/executive/mock-data/executive-mock-data.ts` only neu can bo sung axis/category/placeholder fixture.
- `src/modules/proposals/types.ts` only neu DTO dat gan Proposal module hop ly hon.
- `src/modules/proposals/services/proposal-service.ts` only neu can export helper read/sanitizer; khong lam regression finance redaction.
- `src/modules/executive/constants/index.ts` only neu navigation label/path can alignment nho.

Avoid unless truly needed:
- Khong tao approval flow moi ngoai `src/modules/proposals`.
- Khong implement Story 3.2 approval detail page.
- Khong implement Story 3.3 approve/reject/return/forward/ask meeting/hold/cancel mutation UI.
- Khong hardcode role name de quyet dinh access; service/permission helpers la authority.
- Khong them Redux/Zustand/global store.
- Khong them dependency UI moi; dung React/Tailwind/lucide va patterns hien co.
- Khong expose Truc 2/3 nhu data production neu chi la placeholder.

### Data Contract Guardrails

Suggested DTO shape, co the dieu chinh theo local patterns:

```ts
export type ApprovalAxisKey = "axis_1" | "axis_2" | "axis_3";
export type ApprovalQueueCategory =
  | "ho_so_van_ban"
  | "tai_chinh_chi"
  | "chien_luoc"
  | "ky_thuat"
  | "phap_ly"
  | "hop";

export type ApprovalCenterQueueItem = {
  id: string;
  sourceType: "proposal" | "leadership_approval";
  sourceId: string;
  code: string;
  title: string;
  axisKey: ApprovalAxisKey;
  category: ApprovalQueueCategory;
  projectId?: string;
  projectName?: string;
  scopeLabel: string;
  requester: string;
  ownerName?: string;
  approverLabel?: string;
  status: string;
  priority: "low" | "normal" | "high" | "urgent" | "critical";
  riskLevel?: string;
  dueDate?: string;
  dueGroup: "overdue" | "today" | "this_week" | "later" | "none";
  reason?: string;
  policyLabel?: string;
  amountLabel?: string;
  financialAccess?: "allowed" | "no_permission" | "not_applicable";
  href?: string;
};

export type ApprovalCenterData = {
  generatedAt: string;
  scopeLabel: string;
  tabs: Array<{
    key: ApprovalAxisKey;
    label: string;
    state: "available" | "placeholder";
    helper: string;
    total: number;
    categories: Array<{ key: ApprovalQueueCategory; label: string; total: number }>;
    items: ApprovalCenterQueueItem[];
  }>;
};
```

Guardrails:
- `href` neu co phai la internal path bat dau bang `/`, khong `//`, khong absolute URL, khong tao URL tu raw id o component.
- Amount numeric raw khong can vao queue DTO; neu user co finance access thi `amountLabel` da sanitized la du cho queue.
- `financialAccess: "no_permission"` phai di kem copy hien thi "Tai chinh han che quyen" hoac tuong duong, khong kem secret.
- Map category tu Proposal:
  - `document` -> `ho_so_van_ban`
  - `finance`, `contract`, `procurement` -> `tai_chinh_chi`
  - `investment`, `general` voi strategy signal/policy -> `chien_luoc`
  - `design`, `construction`, `quality`, `safety` -> `ky_thuat`
  - `legal` -> `phap_ly`
  - meeting-linked proposal/link type `meeting` -> `hop`
- Map category tu `ExecutiveApprovalCategory`:
  - legal/planning -> `phap_ly`
  - design/feasibility/material/progress/variation/acceptance -> `ky_thuat`
  - investment/strategy/kpi/permission -> `chien_luoc`
  - payment/budget/executive_payment/contractor -> `tai_chinh_chi`
  - document/source attachment context -> `ho_so_van_ban`
  - meeting proposal -> `hop`

### Architecture Compliance

- Expected flow: route guard -> `getCommandCenterData` -> Approval Center service DTO -> Client Component render.
- Permission enforcement stays server/service layer. UI only presents filtered DTO and disabled/read-only labels.
- React components must not import repositories, Supabase clients, policy repositories, or permission catalog services directly.
- Repository boundary stays stable: services can accept injected repository in tests.
- Internal DTO fields use camelCase. DB snake_case remains in repository/migration layer.
- Use Zod only at input/action boundaries if new input exists; story 3.1 should mostly be read/DTO, not mutation.
- Keep `Command Center` canonical route; preserve `scopeId` behavior and selected scope filtering.
- Proposal/Approval backbone remains source of truth for approval workflow. Executive mock data can seed/bridge display only.

### UX Guardrails

- Approval Center should feel like an enterprise work queue, not a marketing page. Dense, scannable, restrained layout.
- First viewport should show title, scope context, tabs Truc 1/2/3, quick counts and start of queue.
- Tabs must be obvious and keyboard accessible. If manually implemented, use button semantics with `aria-pressed` or tablist pattern consistently.
- Queue items need visible text badges for status/category/risk/priority; color alone is insufficient.
- Do not show action buttons that imply Story 3.3 is implemented. For Story 3.1, use read/view/detail affordances only, or disabled explanatory action if necessary.
- Truc 2/3 placeholder copy must be explicit: "Placeholder MVP" / "Chua co flow chi tiet" / "Mock de nghiem thu phan vung".
- Empty states distinguish:
  - No approval in current scope.
  - Missing Approval Center permission.
  - Axis placeholder.
  - Finance redacted.
- On mobile, use compact cards/list; avoid table-only core workflow and assert no horizontal overflow.

### Previous Story Intelligence

- Story 1.1 created role/permission catalog and separated admin permissions from business approval permissions. Do not make `admin` a business approver by default.
- Story 1.2 created scope assignments by organization/project/axis/workstream/module. Approval Center must honor selected `scopeId` and assignment grants.
- Story 1.3 created policy/threshold settings. Queue can surface `thresholdLabel`/`policyLabel`; do not hardcode money thresholds as business rules.
- Story 1.4 created delegation guardrails. Secretary/assistant can support/create within delegation, but MVP does not allow approving on behalf.
- Story 1.5 added Module 1 acceptance demo seed data. Use demo coverage pattern for scoped queue tests.
- Story 2.1 established `/command-center?view=executive-dashboard` as canonical leadership route and direct unauthorized executive access as 403. Preserve this for `executive-approvals`.
- Story 2.2/2.3 created executive dashboard DTO/UI with scope filtering, finance sanitizer and drill-down patterns. Reuse service-derived DTO approach.
- Story 2.4/2.5/2.6 added Morning Briefing, Common Center and Private Workspace. Story 3.1 must not regress these views.
- Story 2.7 hardened drill-down metadata, safe hrefs, no-leak finance behavior and responsive tests. Reuse the same no raw client fetch/no URL synthesis/no leak principles for queue source links.

### Git / Recent Work Intelligence

- Git log has only `484589a 2205` and `a8162e3 first fcm`; most BMad work is dirty/untracked in the current worktree.
- Treat existing modified/untracked files as user/story work. Do not reset/revert/check out files.
- Story 3.1 is the first story in Epic 3; `sprint-status.yaml` should have `epic-3: in-progress` and this story `ready-for-dev` after create-story.

### Latest Tech Notes

- Project baseline from `package.json`: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Vitest `^3.1.3`, Testing Library React `^16.3.0`, Playwright `^1.52.0`. No dependency upgrade needed for this story.
- Verified 2026-05-25: Next `forbidden()` renders 403 for authorization errors and requires `experimental.authInterrupts`, already enabled in this repo per Story 2.7. Use existing guard, do not invent a separate 403 mechanism. Source: https://nextjs.org/docs/app/api-reference/functions/forbidden
- Verified 2026-05-25: Next Server Components fetch server-side and pass serializable props to Client Components; props passed to Client Components need to be serializable. Keep Approval Center DTO plain. Source: https://nextjs.org/docs/app/building-your-application/rendering/server-components
- Verified 2026-05-25: Playwright supports viewport/device emulation and `page.setViewportSize`; use this for 360/390/768/1280 responsive smoke. Source: https://playwright.dev/docs/emulation
- Verified 2026-05-25: Testing Library `getByRole(..., { name })` is preferred for accessible UI queries and supports selected/name filters. Use role queries for tabs/buttons/regions. Source: https://testing-library.com/docs/queries/byrole

### Testing Guidance

- Red phase first:
  - `npm run test -- tests/unit/approval-center-service.test.ts`
  - `npm run test -- tests/unit/command-center-dashboard.test.tsx`
- Then service/component green, then regression:
  - `npm run test -- tests/unit/executive-service.test.ts tests/unit/proposal-service.test.ts tests/unit/command-center-service.test.ts`
  - `npm run test`
- E2E:
  - Update `tests/e2e/mvp-smoke.spec.ts` with `/command-center?view=executive-approvals`.
  - Reuse `useMockRole(page, "tong_giam_doc")` for allowed leadership user and `viewer` for direct 403.
  - Add viewport loop only for Approval Center if full suite gets too slow; keep assertions high-signal.
- Full validation before dev marks complete:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run test:e2e`

### References

- `_bmad-output/planning-artifacts/epics.md` - Epic 3 overview and Story 3.1 requirements/AC/files/dependencies.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-025 to FR-028, permission requirements, NFR-001/NFR-002/NFR-004/NFR-005/NFR-006.
- `_bmad-output/planning-artifacts/architecture.md` - modular monolith, service/repository boundary, server/service permission enforcement, Proposal/Approval backbone, testing standards.
- `_bmad-output/planning-artifacts/ux-design-specification.md` - Approval Action Panel, priority queue, tabs/filter/list patterns, unauthorized states, responsive/accessibility.
- `_bmad-output/implementation-artifacts/1-1-role-template-va-permission-catalog-cho-module-1.md` - role/permission catalog and admin-vs-business-approval separation.
- `_bmad-output/implementation-artifacts/1-2-scope-assignment-theo-organization-project-axis-va-workstream.md` - scope assignment model.
- `_bmad-output/implementation-artifacts/1-3-policy-co-ban-cho-nguong-duyet-tien-va-nhom-risk.md` - approval threshold policy model.
- `_bmad-output/implementation-artifacts/1-4-delegation-cho-thu-ky-tro-ly-theo-lanh-dao.md` - delegation guardrails.
- `_bmad-output/implementation-artifacts/1-5-seed-data-dieu-hanh-cho-nghiem-thu-module-1.md` - demo seed/acceptance data.
- `_bmad-output/implementation-artifacts/2-7-drill-down-unauthorized-va-responsive-qa-cho-workspace.md` - safe href/no-leak/responsive learnings.
- `src/app/executive/approvals/page.tsx` - existing executive approvals route.
- `src/app/executive/_lib/render-executive-page.tsx` - executive route redirect mapping.
- `src/app/command-center/page.tsx` - executive view guard.
- `src/modules/command-center/services/command-center-service.ts` - Command Center DTO composition and selected scope handling.
- `src/modules/command-center/components/command-center-dashboard.tsx` - current `executive-approvals` render branch to replace.
- `src/modules/executive/types/index.ts` - executive approval/axis/category types.
- `src/modules/executive/services/executive-service.ts` - scoped executive data filtering and finance sanitizer.
- `src/modules/executive/mock-data/executive-mock-data.ts` - legacy approvals and axis definitions.
- `src/modules/proposals/types.ts` - Proposal/step/link/decision types.
- `src/modules/proposals/services/proposal-service.ts` - proposal service and finance redaction.
- `src/lib/permissions/access-scope.ts` - scope filtering helpers including proposals.
- `src/lib/permissions/can.ts` - permission keys and role permission behavior.
- `tests/unit/executive-service.test.ts` - executive scoping/finance/schema regression tests.
- `tests/unit/proposal-service.test.ts` - proposal workflow and finance redaction tests.
- `tests/unit/command-center-dashboard.test.tsx` - command center component tests.
- `tests/e2e/mvp-smoke.spec.ts` - current command center/forbidden/responsive e2e smoke.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-29: Red phase `npm test -- tests/unit/approval-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/command-center-service.test.ts` failed on missing Approval Center service/DTO/nav, as expected.
- 2026-05-29: Targeted unit green: `npm test -- tests/unit/approval-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/command-center-service.test.ts` => 29 passed.
- 2026-05-29: Static validation green: `npm run typecheck`, `npm run lint`.
- 2026-05-29: Full unit green: `npm test` => 51 files, 307 tests passed.
- 2026-05-29: Full e2e green: `npm run test:e2e` => 43 passed.

### Completion Notes List

- Added a serializable `ApprovalCenterData` DTO with axis tabs, six Truc 1 categories, scoped queue items, due grouping, priority ordering, and finance access state.
- Added `approval-center-service` on the Proposal repository contract, bridging existing leadership approvals only as sanitized display data and filtering records in the service before DTO return.
- Integrated `approvalCenter` into Command Center data, executive nav, and the `executive-approvals` view while preserving `/executive/approvals` redirect behavior and existing executive 403 guard.
- Added a read-only Approval Center UI with accessible tabs, Truc 2/3 explicit placeholders, compact queue cards, safe source links, no mutation buttons, no-access and empty states.
- Added unit/component/e2e coverage for category mapping, scoped no-leak, finance redaction, tab state, route 403, and responsive viewport overflow.

### File List

- `src/modules/executive/types/index.ts`
- `src/modules/proposals/services/approval-center-service.ts`
- `src/modules/executive/components/approval-center.tsx`
- `src/modules/command-center/types.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `tests/unit/approval-center-service.test.ts`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`
- `_bmad-output/implementation-artifacts/3-1-approval-center-scoped-queue-va-axis-tabs.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-25 | 1.0 | Created Story 3.1 implementation guide for Approval Center scoped queue, axis tabs, placeholder axes, permission/no-leak and responsive QA. | Codex |
| 2026-05-29 | 1.1 | Implemented Approval Center DTO/service/UI integration with scoped filtering, finance redaction, tests and e2e responsive QA. | Codex |
