# Story 2.7: Drill-Down, Unauthorized Va Responsive QA Cho Workspace

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay la hardening/QA story cho cac workspace Module 1 da co: Dashboard Tong Quan, Morning Briefing, Executive Common Center va Private Workspace. Pham vi la chuan hoa drill-down metadata, unauthorized/403 behavior, responsive QA va accessibility/focus coverage. Khong xay Approval Center, Risk CRUD, Meeting Engine CRUD, Decision Center, AI Center, hay route workspace moi.

## Story

As a lanh dao,  
I want drill-down tu KPI/risk/approval den nguon du lieu hoac bi chan ro rang khi thieu quyen,  
so that toi co the kiem chung so lieu ma khong bi lo du lieu ngoai scope.

## Tieu Chi Chap Nhan

1. **Drill-down hien day du ngu canh record nguon**
   - Given dashboard/common/private workspace item co linked records
   - When nguoi dung mo drill-down
   - Then panel/sheet hien title, type, scope, owner, deadline, status, reason, linked records, actions theo quyen va timeline/audit neu co
   - And metadata phai den tu service DTO da filter/sanitize, khong lay raw id o component de fetch/ghep URL.

2. **Drill-down chi dieu huong den route nguon an toan khi du quyen**
   - Given item co route chi tiet noi bo hop le va user du quyen record
   - When nguoi dung chon `Mo nguon`
   - Then dieu huong den route detail hop le, preserve context quay lai Command Center neu kha thi
   - And neu DTO khong co route an toan thi panel van read-only va noi ro khong tu tao URL tu raw id.

3. **Unauthorized/403 khong lo payload nhay cam**
   - Given user khong co quyen vao Module 1 hoac record nguon
   - When truy cap drill-down, route nguon, hoac URL truc tiep
   - Then he thong tra forbidden/unauthorized state ro rang theo ngu canh
   - And khong tra DTO/DOM/JSON payload chua finance amount, cashflow, budget, hop dong, hoac field record ngoai scope.

4. **Responsive behavior duoc nghiem thu tren workspace chinh**
   - Given viewport 360/390/768/1280
   - When kiem tra Dashboard Tong Quan, Morning Briefing, Executive Common Center va Private Workspace
   - Then side drill-down panel thanh full-screen sheet tren mobile, table/list rong co compact alternative, khong co horizontal overflow bat thuong
   - And text tieng Viet trong badge/button/card/list wrap tot, khong tran/cat xau.

5. **Accessibility/focus dat muc co ban cho dialog, sheet va action**
   - Given user dung keyboard
   - When mo drill-down, tab trong panel/sheet, bam Escape hoac close
   - Then focus vao close/control dau tien, focus trap khong thoat panel, Escape/close dong panel va focus quay ve trigger hop ly neu implement duoc
   - And button/link/icon action co accessible name; badge/risk/health khong chi dua vao mau.

6. **Regression boundaries duoc bao toan**
   - Given Story 2.1-2.6 da tao shell, DTO, dashboard, morning briefing, common center va private workspace
   - When story nay hoan thanh
   - Then `ExecutiveDashboardData`, `ExecutiveCommonCenterData`, `ExecutivePrivateWorkspaceData`, `ExecutiveDrilldownPanel`, canonical `/command-center` views, viewer read-only private workspace va direct unauthorized executive dashboard 403 van hoat dong
   - And khong downgrade permission enforcement tu service/server layer ve UI-only hiding.

## Tasks / Subtasks

- [x] Chuan hoa source metadata contract cho drill-down (AC: 1, 2, 3, 6)
  - [x] Mo rong `ExecutiveDashboardSourceItem` hoac tao type bo sung dung chung, vi du `ExecutiveDrilldownSourceDetail`, de bieu dien `scopeLabel`, `linkedRecords`, `availableActions`, `timeline`, `auditTrail`, `permissionState`, `deniedReason`.
  - [x] Cap nhat cac DTO producer lien quan: `executive-dashboard-service.ts`, `executive-common-center-service.ts`, `executive-private-workspace-service.ts`.
  - [x] Giu DTO serializable cho Client Components; khong dua function, class instance, Date object song hoac repository object vao prop.
  - [x] Khong dua finance-sensitive fields vao detail metadata neu `canViewFinance`/record finance access khong cho phep.

- [x] Tao/hoan thien route-safe source resolver neu can (AC: 1, 2, 3)
  - [x] Uu tien helper/service trong `src/modules/dashboard/services` hoac `src/lib/permissions` de map `sourceType/sourceId/projectId` sang route noi bo an toan va permission state.
  - [x] Support cac source hien co: `project`, `proposal`, `leadership_approval`, `executive_action`, `meeting`, `decision`, `risk`.
  - [x] Neu source chua co detail route that, tra read-only detail metadata thay vi tu tao URL.
  - [x] Href chi duoc la internal path bat dau bang `/`, khong `//`, khong absolute external URL, khong ghep query tu raw id chua validate.

- [x] Harden `ExecutiveDrilldownPanel` thanh pattern dung chung cho desktop/mobile (AC: 1, 2, 4, 5)
  - [x] Cap nhat `src/modules/dashboard/components/executive-drilldown-panel.tsx` de hien linked records, actions theo quyen, timeline/audit neu DTO co.
  - [x] Desktop giu side panel; mobile `<768px` render full-screen sheet hoac CSS tuong duong, khong ep 2 cot.
  - [x] Giu safe href validation, focus on open, Escape close va focus trap hien co.
  - [x] Bo sung return-focus ve trigger neu practical voi current caller; neu khong, document reason trong dev notes va test close behavior hien co.
  - [x] Khong de panel fetch raw source detail client-side.

- [x] Kiem tra va sua unauthorized/403 direct access (AC: 2, 3, 6)
  - [x] Audit `src/app/command-center/page.tsx`, `src/lib/permissions/guard.ts`, `src/lib/permissions/scoped-resources.ts` va cac route detail source (`projects/[projectId]`, `proposals/[proposalId]`, `meetings/[meetingId]`, `documents/[documentId]` neu linked).
  - [x] Module-level unauthorized vao `executive-*` view phai dung guard/403 truoc data render; viewer read-only vao `executive-private-workspace` van duoc phep.
  - [x] Record-level out-of-scope direct URL phai khong render record payload; neu dung `UnauthorizedState` thay vi HTTP 403, test phai chung minh body khong co title/amount/metadata cua record bi chan. Neu yeu cau HTTP 403 duoc ap dung, dung `forbidden()` qua guard phu hop va giu `next.config.ts` `experimental.authInterrupts`.
  - [x] Permission audit khong duoc mask access decision.

- [x] Responsive QA tren cac workspace Module 1 (AC: 4, 6)
  - [x] Kiem tra Dashboard Tong Quan: KPI Strip, Priority Queue, Risk Summary, drill-down panel/sheet.
  - [x] Kiem tra Morning Briefing: AI Summary draft, KPI hom nay, top risk, approval qua han, project health.
  - [x] Kiem tra Executive Common Center: priority area, notification, decision, calendar, risk, threshold/system deadlines.
  - [x] Kiem tra Private Workspace: variant header, KPI, priority, assigned portfolio, assistant/viewer/read-only sections.
  - [x] Loai bo table/min-width gay overflow hoac them compact list alternative; khong chi dua vao horizontal scroll cho mobile core workflow.

- [x] Component/unit tests cho metadata, permission va focus (AC: 1, 2, 3, 5, 6)
  - [x] Cap nhat `tests/unit/command-center-dashboard.test.tsx` cho drill-down detail co scope, linked records, actions, timeline/audit va no-permission reason.
  - [x] Them test unsafe href/external href van read-only; test internal href chi hien khi DTO cho phep.
  - [x] Them test finance redaction trong drill-down: `JSON.stringify(dto)` va DOM khong chua sentinel amount/budget/cashflow khi user thieu quyen.
  - [x] Them/bo sung service tests cho source resolver neu tao helper moi.
  - [x] Test direct unauthorized executive dashboard van 403; viewer private workspace read-only van 200.

- [x] E2E/responsive smoke (AC: 2, 3, 4, 5, 6)
  - [x] Cap nhat `tests/e2e/mvp-smoke.spec.ts` cho drill-down open/close bang click va keyboard tren `/command-center?view=executive-dashboard`.
  - [x] Them viewport checks toi thieu 360, 390, 768, 1280 cho cac workspace chinh hoac tach helper loop de tranh duplication qua muc.
  - [x] Assert `document.documentElement.scrollWidth <= window.innerWidth + 8` o mobile/tablet.
  - [x] Assert direct forbidden/no-access flow khong render text source nhay cam.
  - [x] Chay `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`.

### Review Findings

- [x] [Review][Patch] Proposal source links can expose redacted finance amounts by routing no-finance users to `/proposals/{id}` detail, which renders `proposal.amount`; make direct proposal detail finance-safe or suppress the drill-down href until it is safe. [`src/modules/dashboard/services/executive-drilldown-source.ts:130`]
- [x] [Review][Patch] Drill-down linked record/action links use generic accessible names (`Mo record`, `Thuc hien`) when multiple targets exist; include the record/action label in text or `aria-label`. [`src/modules/dashboard/components/executive-drilldown-panel.tsx:237`]

## Dev Notes

### Boi Canh Nghiep Vu

- Story 2.7 la "trust hardening" cho Module 1: lanh dao phai kiem chung KPI/risk/approval qua drill-down, nhung he thong khong duoc lo du lieu ngoai scope.
- Drill-down khong phai mutation flow. Moi action hien trong panel chi la action affordance theo quyen; mutation that van phai qua server action/service guard.
- Unauthorized co hai ngu canh:
  - Module/workspace-level: user khong co quyen vao Module 1 hoac executive view -> 403 truoc data render.
  - Record-level: user thay item aggregate nhung khong co quyen record detail hoac truy cap URL truc tiep -> khong render record payload; co the 403 hoac UnauthorizedState theo pattern duoc chot trong code, nhung phai co test khong leak.

### Current Code State (Read Before Editing)

- `src/modules/dashboard/components/executive-drilldown-panel.tsx` da la Client Component dung chung cho dashboard/common/private workspace. Hien co safe internal href validation, focus close button khi open, Escape close va focus trap. Hien metadata toi thieu: source type/id, project/scope, status, owner, deadline, reason. Chua co linked records, available actions, timeline/audit, mobile full-screen sheet class rieng, hay return-focus ve trigger.
- `ExecutiveDashboardSourceItem` trong `src/modules/dashboard/types.ts` hien chi co `id`, `sourceType`, `sourceId`, `projectId`, `href`, `title`, `status`, `tone`, `owner`, `deadline`, `reason`. AC1 yeu cau bo sung metadata detail ma khong pha cac DTO hien co.
- `src/modules/dashboard/services/executive-dashboard-service.ts` tao source items tu project/proposal/leadership approval/executive action/risk/decision/meeting. Nhieu item chua co `href`; proposal/project detail route ton tai nhung href can permission-aware, khong ghep raw id trong component.
- `src/modules/dashboard/services/executive-common-center-service.ts` merge/dedupe priority items tu dashboard DTO va reuse source metadata. Neu contract source item thay doi, common center phai propagate an toan va khong dua finance text khi no-permission.
- `src/modules/workspaces/services/executive-private-workspace-service.ts` compose private workspace tu dashboard/executive data, co finance sanitizer va delegation guardrails. Neu them detail metadata, phai giu sanitizer va `mutationMode` semantics.
- `src/modules/command-center/components/command-center-dashboard.tsx` branch cac `executive-*` views tai `CommandCenterExecutivePanel`; known executive view keys da include dashboard, morning briefing, common center, private workspace va legacy executive tabs. Khong de unknown `executive-*` render blank/unsafe legacy panel.
- `src/app/command-center/page.tsx` dung `requireWorkspaceRoute("/executive")` cho executive views tru `executive-private-workspace`; viewer private workspace la read-only exception. Dung pattern nay, khong vo tinh chan viewer private workspace.
- `src/lib/permissions/guard.ts` da dung `forbidden()` va audit access denied; `next.config.ts` da bat `experimental.authInterrupts: true`.
- `src/lib/permissions/scoped-resources.ts` co `getScopedProject`, `getScopedProposal`, `getScopedMeeting`, `getScopedDecision`, `getScopedDocument` va list scoped helpers. Reuse cac helper nay cho source resolver/direct URL behavior; khong duplicate scope filtering trong component.
- Detail pages hien co (`projects/[projectId]`, `proposals/[proposalId]`, `meetings/[meetingId]`, `documents/[documentId]`) co UnauthorizedState/read scoped helper patterns. Can audit payload leak va test expected HTTP/body behavior truoc khi doi sang `forbidden()`.
- `tests/unit/command-center-dashboard.test.tsx` da cover open read-only drill-down, no drill-down permission, unsafe href read-only, Escape close, finance no-permission DOM redaction, common/private workspace render.
- `tests/e2e/mvp-smoke.spec.ts` da cover direct viewer 403 cho executive dashboard, viewer read-only private workspace, desktop/mobile smoke cho dashboard/morning/common/private va horizontal fit o 390px.
- Worktree dang co nhieu thay doi/untracked artifacts tu story truoc. Doc file truoc khi sua; khong revert/reset/checkout thay doi khong lien quan.

### File Targets

Expected UPDATE:
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/components/executive-drilldown-panel.tsx`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/services/executive-common-center-service.ts`
- `src/modules/workspaces/types.ts`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

Possible UPDATE:
- `src/lib/permissions/scoped-resources.ts` or new helper near it if source detail resolution needs centralized permission checks.
- `src/app/command-center/page.tsx` only if guard behavior for `executive-*` views needs correction.
- `src/app/(dashboard)/projects/[projectId]/page.tsx`, `proposals/[proposalId]/page.tsx`, `meetings/[meetingId]/page.tsx`, `documents/[documentId]/page.tsx` only to align direct unauthorized behavior or add no-leak tests.
- `src/components/shared/unauthorized-state.tsx` only if shared copy/encoding/accessibility needs cleanup; avoid broad visual refactor.

Avoid unless truly needed:
- Khong tao global store, Redux/Zustand, API route wrapper hay client-side fetcher cho drill-down.
- Khong upgrade dependencies.
- Khong tao source detail routes moi neu read-only panel du dap ung AC cho source chua co route.
- Khong implement approval approve/reject, risk CRUD, decision creation, meeting creation, export, AI action proposal.
- Khong hardcode role names de quyet dinh du lieu; permission/scope service la authority.

### Data Contract Guardrails

- Prefer adding optional fields so existing source item consumers do not break:
  - `scopeLabel?: string`
  - `linkedRecords?: Array<{ id: string; type: ExecutiveDashboardSourceType | "document" | "task" | "legal"; title: string; status?: string; href?: string; permissionState: "allowed" | "read_only" | "denied"; reason?: string }>`
  - `availableActions?: Array<{ id: string; label: string; href?: string; actionKey?: PermissionAction; enabled: boolean; reason?: string }>`
  - `timeline?: Array<{ id: string; label: string; timestamp?: string; actor?: string; status?: string }>`
  - `auditTrail?: Array<{ id: string; action: string; actor?: string; timestamp?: string; reason?: string }>`
  - `permissionState?: "allowed" | "read_only" | "denied"`
  - `deniedReason?: string`
- Any href on item, linked record or action must be safe internal route; keep or extract `safeInternalHref`.
- Data passed into Client Components must be JSON-serializable.
- Finance redaction must happen before UI. Do not rely on CSS, conditional rendering after receiving secret values, or "hide text" in component.
- If adding source detail helper, return sanitized detail DTO, not raw Project/Proposal/Meeting/Decision entity.

### Architecture Compliance

- Expected flow: route guard -> `getCommandCenterData` -> scoped service DTOs -> client component render -> optional safe link to detail route guarded by scoped helper/service.
- Permission enforcement stays in route/service/server action layer. UI permission labels are presentation only.
- Service/repository boundary stays intact; React components must not import repositories or call Supabase.
- Internal DTOs use camelCase. DB snake_case remains inside repository/migration layer.
- Use existing `can`, `hasAnyScopedActionGrant`, `canAccessScopedAction`, `selectScopeAssignmentsForUser`, `resolveAccessScope` and `getScoped*` helpers instead of inventing a second permission model.
- Keep `Command Center` canonical route and preserve `scopeId` behavior from Story 2.1.

### UX Guardrails

- Drill-down panel title: clear record title, source type/status/scope visible above detail sections.
- Desktop can remain side panel; mobile must behave as full-screen sheet or equivalent (`w-full`, no two-column dependency, close button reachable).
- Badge/status must include text such as `Critical`, `High`, `Qua han`, `Read-only`, `No permission`; color alone is insufficient.
- Action disabled state must include reason visible or accessible; do not show action if it hints at unauthorized workflow or leaks hidden record.
- Empty/no-permission/error states must explain whether there is no data in scope, no permission, invalid scope, or source route unavailable.
- Touch targets for important close/open/source actions should be about 44px on mobile.
- Do not use hero/marketing layout. Keep dense enterprise workspace composition.

### Previous Story Intelligence

- Story 2.1 established `/command-center?view=executive-dashboard` as canonical leadership route and direct unauthorized executive access as guard-first 403. Preserve this.
- Story 2.2 created `ExecutiveDashboardData`, selected-scope handling, scoped filtering and finance sanitizer. Reuse it; do not reintroduce legacy global mock data.
- Story 2.3 built dashboard UI, `ExecutiveDrilldownPanel`, safe href validation, focus/Escape handling, no-permission empty states, priority dedupe and e2e smoke. This story should extend/harden those patterns, not replace them.
- Story 2.4 added Morning Briefing as an adjacent executive view. Include it in responsive smoke because Story 2.7 covers workspace QA, but do not change AI behavior beyond display/a11y hardening.
- Story 2.5 added Common Center and explicitly reused dashboard source metadata/drill-down patterns. Any source contract change must keep common center render/tests green.
- Story 2.6 added Private Workspace with role variants, viewer read-only state, delegation guardrails and private workspace e2e smoke. Do not break viewer's allowed read-only route.

### Git / Recent Work Intelligence

- Git log only shows `484589a 2205` and `a8162e3 first fcm`; most BMad story/code work is currently dirty/untracked in the worktree.
- Treat existing modified/untracked files as user/story work. Do not reset or revert.
- `sprint-status.yaml` before this story had `2-7-drill-down-unauthorized-va-responsive-qa-cho-workspace: backlog`; create-story updates it to `ready-for-dev`.

### Latest Tech Notes

- Project baseline from `package.json`: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Vitest `^3.1.3`, Testing Library React `^16.3.0`, Playwright `^1.52.0`. No dependency upgrade needed.
- Verified 2026-05-25: Next `forbidden()` renders a 403 page and is intended for authorization errors; it requires `experimental.authInterrupts`, already enabled in this repo. Source: https://nextjs.org/docs/app/api-reference/functions/forbidden
- Verified 2026-05-25: Next Server Components should fetch data server-side and pass serializable props to Client Components; keep drill-down detail DTO serializable. Source: https://nextjs.im/docs/app/getting-started/server-and-client-components/
- Verified 2026-05-25: Playwright can emulate mobile/tablet/desktop viewports/devices; use this for 360/390/768/1280 responsive smoke. Source: https://playwright.dev/docs/emulation
- Verified 2026-05-25: Testing Library `getByRole(..., { name })` targets accessible names and is preferred for semantic component tests. Source: https://testing-library.com/docs/queries/byrole/

### Testing Guidance

- Focused unit first: `npm run test -- tests/unit/command-center-dashboard.test.tsx`.
- If adding source resolver/service, add focused tests such as `tests/unit/executive-drilldown-source.test.ts` or extend existing dashboard service tests.
- Component tests should use semantic queries for dialog, close button, source link, linked record list, action labels and no-permission messages.
- Use sentinel secret values in tests (`9,999,000,000 VND`, `SECRET_BUDGET_SENTINEL`) and assert not present in DOM and serialized DTO when permission denied.
- E2E can reuse `useMockRole` helper in `tests/e2e/mvp-smoke.spec.ts`.
- For responsive loops, keep assertions high-signal: heading visible, key region visible, no `Application error`, no horizontal overflow. Avoid brittle visual pixel tests unless layout keeps regressing.
- Full validation expected before marking implementation done: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`.

### References

- `_bmad-output/planning-artifacts/epics.md` - Epic 2, Story 2.7 requirements, AC, files/modules and dependencies.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-011, FR-012, NFR-003, NFR-004, NFR-011.
- `_bmad-output/planning-artifacts/architecture.md` - App Router modular monolith, service/repository boundary, server/service permission enforcement, 403, audit, testing standards.
- `_bmad-output/planning-artifacts/ux-design-specification.md` - drill-down pattern, unauthorized state, responsive breakpoints, mobile sheet, WCAG/focus/accessibility rules.
- `_bmad-output/implementation-artifacts/2-3-dashboard-ui-voi-kpi-strip-priority-queue-va-risk-summary.md` - current drill-down panel, safe href, focus/Escape and dashboard responsive learnings.
- `_bmad-output/implementation-artifacts/2-5-executive-common-center.md` - common center reuse of source metadata and no-permission/drill-down patterns.
- `_bmad-output/implementation-artifacts/2-6-private-workspace-theo-vai-tro.md` - private workspace variants, viewer read-only route and delegation/finance guardrails.
- `src/modules/dashboard/components/executive-drilldown-panel.tsx` - current reusable panel to extend.
- `src/modules/dashboard/types.ts` - source item and dashboard/common center DTO contracts.
- `src/modules/workspaces/types.ts` - private workspace DTO contract.
- `src/modules/dashboard/services/executive-dashboard-service.ts` - source item producer and finance sanitizer.
- `src/modules/dashboard/services/executive-common-center-service.ts` - priority/common source propagation.
- `src/modules/workspaces/services/executive-private-workspace-service.ts` - private workspace source propagation and finance/delegation sanitizer.
- `src/lib/permissions/guard.ts` - route/server permission guard and audit denied access.
- `src/lib/permissions/scoped-resources.ts` - scoped direct record helpers.
- `src/app/command-center/page.tsx` - executive view guard and private workspace exception.
- `tests/unit/command-center-dashboard.test.tsx` - existing drill-down/no-permission component coverage.
- `tests/e2e/mvp-smoke.spec.ts` - existing command center unauthorized/responsive smoke coverage.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-25: Red phase `npm run test -- tests/unit/executive-drilldown-source.test.ts tests/unit/command-center-dashboard.test.tsx` failed on missing source helper, missing enriched metadata render and missing return-focus.
- 2026-05-25: Targeted unit green after implementation: `npm run test -- tests/unit/executive-drilldown-source.test.ts tests/unit/command-center-dashboard.test.tsx` -> 2 files, 21 tests passed.
- 2026-05-25: Full validation green: `npm run typecheck`, `npm run lint`, `npm run test` -> 50 files, 302 tests passed, `npm run test:e2e` -> 41 passed.
- 2026-05-25: E2E first exposed hydration/cold-compile timing in smoke tests; fixed by waiting for `networkidle` before hydrated interactions and increasing one cold dynamic-route timeout locally.
- 2026-05-25: Code review patches applied; `npm run typecheck`, `npm run lint`, targeted unit tests and `npm run test` -> 50 files, 303 tests passed.

### Implementation Plan

- Extend the shared dashboard source contract with drill-down metadata, linked records, action affordances, timeline/audit and permission state.
- Add a source enrichment helper that validates internal hrefs, refuses unsafe provided hrefs, derives only supported safe routes, redacts finance fields before client DTO usage and builds read-only metadata defaults.
- Apply enrichment at dashboard, common center and private workspace DTO boundaries while preserving existing scope/finance/delegation behavior.
- Expand the reusable drill-down panel into a mobile-safe read-only sheet with safe source links, linked records, permission actions, timeline/audit, focus trap and return-focus.
- Cover metadata, unsafe href, finance redaction, 403/viewer read-only, keyboard close and responsive viewport smoke in unit/e2e tests.

### Completion Notes List

- Added optional drill-down metadata fields to `ExecutiveDashboardSourceItem` and related typed records/actions/timeline/audit types.
- Added `executive-drilldown-source` enrichment helper; unsafe external/absolute hrefs stay read-only and no route is derived from an unsafe provided href.
- Dashboard, Common Center and Private Workspace now propagate enriched source metadata from service DTOs, with finance fields stripped before UI payloads when finance access is denied.
- `ExecutiveDrilldownPanel` now renders metadata, linked records, allowed/blocked actions, timeline, audit trail, no-route/no-permission reasons, mobile full-width sheet styling, focus trap and return-focus.
- Priority Queue duplicate source dedupe now preserves richer drill-down metadata when the same source appears from multiple aggregates.
- E2E smoke now covers drill-down keyboard close and responsive fit across 360/390/768/1280 for the Module 1 workspace views.
- Code review patch redacts proposal `amount` in proposal list/detail DTOs for users without `finance.view`, while leaving raw repository data available for server-side policy workflows.
- Code review patch gives linked record/action links unique accessible names through record/action labels.

### File List

- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-drilldown-source.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/services/executive-common-center-service.ts`
- `src/modules/dashboard/components/executive-drilldown-panel.tsx`
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `src/modules/proposals/services/proposal-service.ts`
- `tests/unit/executive-drilldown-source.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/proposal-service.test.ts`
- `tests/e2e/mvp-smoke.spec.ts`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-25 | 1.0 | Created Story 2.7 implementation guide for drill-down metadata, unauthorized/403 hardening, responsive QA and accessibility coverage. | Codex |
| 2026-05-25 | 1.1 | Implemented drill-down metadata enrichment, safe source resolver, panel hardening, focus return, responsive/e2e QA and validation. | Codex |
| 2026-05-25 | 1.2 | Applied code review patches for proposal finance redaction and drill-down link accessible names. | Codex |
