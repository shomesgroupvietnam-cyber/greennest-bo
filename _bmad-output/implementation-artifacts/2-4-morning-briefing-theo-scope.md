# Story 2.4: Morning Briefing Theo Scope

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay tao Morning Briefing dau ngay cho Module 1 - Lanh dao, dung cung scope/permission voi `ExecutiveDashboardData` da co tu Story 2.2/2.3. Pham vi la service DTO, UI briefing trong Command Center, AI Summary draft/placeholder co citation noi bo va tests; khong build Executive AI Center day du, khong goi provider AI truc tiep tu UI, khong tao approval/risk/decision mutations moi.

## Story

As a Chairman/CEO,  
I want Morning Briefing tom tat dau ngay tu du lieu trong scope,  
so that toi biet risk lon, approval qua han, viec can quyet va KPI hom nay trong 1-2 phut.

## Tieu Chi Chap Nhan

1. **Morning Briefing DTO dung scope va permission**
   - Given `PermissionUser`, selected `scopeId` va route/view hop le
   - When tai Morning Briefing
   - Then service tra DTO gom AI Summary draft/placeholder, top risk, viec can quyet hom nay, KPI hom nay, approval qua han va trang thai du an do/vang/xanh
   - And DTO phai derive tu `ExecutiveDashboardData` hoac cung service filtering helpers voi Story 2.2, khong doc raw mock data/operations dashboard truc tiep trong UI
   - And item ngoai scope hoac ngoai quyen khong xuat hien trong DTO.

2. **AI Summary la draft/goi y, co citation hoac insufficient-context state**
   - Given briefing co du lieu visible trong scope
   - When AI Summary render
   - Then summary hien nhu draft/goi y voi timestamp va citation toi internal source records (`sourceType`, `sourceId`, title)
   - And neu chua co AI Gateway/citation path san sang cho briefing, service tao summary placeholder deterministic tu visible DTO va gan `status: "draft"` hoac `"placeholder"`
   - And neu khong co du lieu duoc phep xem, UI hien `insufficient_context`/empty state thay vi bia noi dung.

3. **Morning Briefing UI la surface rieng trong Command Center**
   - Given user co quyen vao Module 1 - Lanh dao
   - When chon `Morning Briefing` trong Command Center
   - Then URL/view dung `/command-center?view=executive-morning-briefing` va preserve `scopeId`
   - And UI hien briefing theo layout de quet: summary, KPI hom nay, top risks, overdue approvals, decisions today, project health va meeting/next context neu co
   - And `/command-center?view=executive-dashboard` van la Dashboard Tong Quan, khong bi thay the.

4. **Khong lo du lieu tai chinh hoac du lieu ngoai quyen**
   - Given user thieu `finance.view` voi mot record/project
   - When briefing render
   - Then amount/budget/cashflow that khong co trong DTO/DOM/citation text
   - And summary/citation khong nhac du lieu bi sanitize
   - And direct URL/user thieu quyen van bi guard/no-access truoc khi protected data render.

5. **Responsive, empty va accessibility dat muc nghiem thu**
   - Given viewport mobile duoi 768px
   - When Morning Briefing render
   - Then cac block chuyen thanh stacked compact list, touch target chinh gan 44px, text tieng Viet khong tran/cat xau
   - And risk/project health khong chi dua vao mau; badge phai co label text
   - And empty/no-permission states noi ro "khong co du lieu trong scope" hoac "khong co quyen" tuy truong hop.

6. **Regression boundaries duoc bao toan**
   - Given Story 2.1/2.2/2.3 da hoan thanh
   - When story nay hoan thanh
   - Then `ExecutiveDashboardData`, dashboard UI, drill-down panel, shell scope selector, legacy `/executive*` guard-first redirect va operations dashboard van hoat dong
   - And story nay khong implement approval actions, risk CRUD, Decision & Assignment Center, full Executive AI Center hoac AI action proposal mutation.

## Tasks / Subtasks

- [x] Chot DTO va service ownership cho Morning Briefing (AC: 1, 2, 4)
  - [x] Them type `ExecutiveMorningBriefingData` trong `src/modules/dashboard/types.ts` hoac file type gan dashboard module.
  - [x] Tao `src/modules/dashboard/services/executive-morning-briefing-service.ts`.
  - [x] Service nen nhan `PermissionUser` va options giong `getExecutiveDashboardData`: `selectedScopeId`, `scopeAssignments`, `rolePermissionCatalog`, `repositories`, `today`.
  - [x] Service phai reuse `getExecutiveDashboardData(user, options)` truoc, roi compose briefing tu DTO da loc scope; chi goi repository rieng neu co ly do ro va van qua service/repository boundary.
  - [x] DTO toi thieu gom `generatedAt`, `scope`, `permissions`, `summary`, `kpisToday`, `topRisks`, `decisionsToday`, `overdueApprovals`, `projectHealth`, `meetingSnapshot`, `sourceCounts`.
  - [x] `summary` nen co union ro: `draft` | `placeholder` | `insufficient_context`, `text`, `citations`, `generatedFrom`, `updatedAt`.
  - [x] Citation nhe cho UI nen gom `id`, `sourceType`, `sourceId`, `projectId?`, `title`, `href?`; khong can tao `AiCitation` persisted record trong story nay neu chua co flow AI Gateway cho briefing.

- [x] Build summary logic draft/placeholder an toan (AC: 1, 2, 4)
  - [x] Summary text chi duoc tong hop tu source items visible trong `ExecutiveDashboardData`: high/critical risks, overdue approvals, today deadlines, recent decisions, project health.
  - [x] Neu `data.riskSummary.items`, `approvalSummary.items`, `todayDeadlines.items`, `recentDecisions.items` deu rong thi tra `insufficient_context` va empty labels thay vi noi "khong co rui ro" mot cach khang dinh qua muc.
  - [x] Giu label ro: `AI Summary draft` hoac `Ban tom tat goi y`; khong hien nhu ket luan chinh thuc.
  - [x] Khong goi `askAi`/provider tu client component. Neu dev chon dung AI Gateway, phai goi o server/service voi permission context va citation; fallback mock/placeholder phai duoc test.
  - [x] Khong tao task/risk/decision/approval tu AI summary. Bat ky action proposal that su nao thuoc Epic 8 hoac story rieng.

- [x] Wire Morning Briefing vao Command Center data path (AC: 3, 6)
  - [x] Cap nhat `src/modules/command-center/types.ts` de expose `executiveMorningBriefing: ExecutiveMorningBriefingData | null`.
  - [x] Cap nhat `src/modules/command-center/services/command-center-service.ts` de load briefing khi `canViewExecutive` hop le, dung cung `selectedScopeId`, `effectiveScopeAssignments`, `rolePermissionCatalog` voi `executiveDashboard`.
  - [x] Them menu item trong `buildAxes` cho `Morning Briefing` voi `viewKey: "executive-morning-briefing"` va href `/command-center?view=executive-morning-briefing`.
  - [x] Giu `operationsDashboard`, `executiveDashboard` va `executiveWorkspace` hien co de tranh regression.
  - [x] Dam bao invalid/unauthorized selected scope tra null/no-access, khong fallback sang global legacy data.

- [x] Build UI component Morning Briefing (AC: 2, 3, 4, 5)
  - [x] Tao component trong `src/modules/dashboard/components`, vi du `executive-morning-briefing.tsx` va cac subcomponent neu can.
  - [x] `CommandCenterExecutivePanel` render component moi khi `activeView === "executive-morning-briefing"`.
  - [x] Header phai hien workspace/scope, `generatedAt`, `summary.status` va label draft/goi y.
  - [x] Content nen gom cac section scan-friendly: `AI Summary draft`, `KPI hom nay`, `Top risk`, `Approval qua han`, `Viec can quyet hom nay`, `Du an do/vang/xanh`, `Lich hop/meeting snapshot`.
  - [x] Neu `canDrillDown` true, reuse `ExecutiveDrilldownPanel`/source item pattern tu Story 2.3; neu false, render read-only item va ly do khong co quyen.
  - [x] Finance no-permission phai render state giai thich ngan; amount/cashflow/budget khong render.

- [x] Responsive, empty, no-permission va accessibility states (AC: 4, 5)
  - [x] Mobile <768px: stacked layout, no wide table, text wrap tot, buttons/list items co accessible names.
  - [x] Risk/project health badges co chu (`Do`, `Vang`, `Xanh`, `Critical`, `High`), khong chi mau.
  - [x] Empty state phan biet: khong co data trong scope, thieu permission, insufficient context cho AI summary.
  - [x] Draft/placeholder badge phai doc duoc bang screen reader va khong chi la color.
  - [x] Neu co dialog/sheet drill-down, giu focus/Escape behavior da patch o Story 2.3.

- [x] Tests va nghiem thu (AC: 1, 2, 3, 4, 5, 6)
  - [x] Them `tests/unit/executive-morning-briefing-service.test.ts` cho scoped DTO, selected scope, top risk, overdue approval, project health va insufficient-context.
  - [x] Test finance no-permission bang deep stringify DTO: khong chua amount/budget/cashflow cua hidden finance records.
  - [x] Test summary draft/placeholder co citation source visible, khong citation den record ngoai scope.
  - [x] Cap nhat `tests/unit/command-center-service.test.ts` de verify `executiveMorningBriefing` duoc load/null dung voi executive access.
  - [x] Cap nhat `tests/unit/command-center-dashboard.test.tsx` cho view `executive-morning-briefing`: render summary draft, KPI hom nay, top risk, overdue approvals, empty states va khong leak operations micro tasks.
  - [x] Cap nhat `tests/e2e/mvp-smoke.spec.ts` cho `/command-center?view=executive-morning-briefing` desktop va mobile 390px.
  - [x] Chay `npm run typecheck`, `npm run lint`, `npm run test`; chay `npm run test:e2e` vi story them UI/view route.

### Review Findings

- [x] [Review][Patch] Scoped Axis One risk alerts are filtered by alert id instead of stage id [src/modules/command-center/services/command-center-service.ts:346]
- [x] [Review][Patch] `decisionsToday` admits non-decision and stale recent records [src/modules/dashboard/services/executive-morning-briefing-service.ts:102]
- [x] [Review][Patch] Summary can report `insufficient_context` when visible project or meeting data exists [src/modules/dashboard/services/executive-morning-briefing-service.ts:122]
- [x] [Review][Patch] Summary overstates high/critical risk counts by counting all top risks [src/modules/dashboard/services/executive-morning-briefing-service.ts:187]
- [x] [Review][Patch] Meeting citations use wall-clock `generatedAt` instead of the briefing business date [src/modules/dashboard/services/executive-morning-briefing-service.ts:172]
- [x] [Review][Patch] Rendered AI summary citations omit required `sourceType` and `sourceId` metadata [src/modules/dashboard/components/executive-morning-briefing.tsx:182]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 2 yeu cau lanh dao vao dung workspace va xem Dashboard Tong Quan, Morning Briefing, Common Center va Private Workspace theo role/scope.
- Morning Briefing khac Dashboard Tong Quan: briefing la ban tom tat dau ngay trong 1-2 phut; Dashboard Tong Quan la man so lieu/queue day du hon; Common Center la luong thong tin chung.
- Morning Briefing phai gom AI Summary buoi sang, top risk lon nhat, viec can quyet hom nay, KPI hom nay, approval qua han va du an do/vang/xanh.
- AI Summary trong story nay la draft/goi y. Khong duoc trinh bay nhu quyet dinh chinh thuc, khong duoc mutate record, khong duoc doc ngoai scope.

### Current Code State (Read Before Editing)

- `src/modules/dashboard/types.ts` da co `ExecutiveDashboardData` voi `projectPortfolio`, `kpis`, `financialSummary`, `approvalSummary`, `riskSummary`, `todayDeadlines`, `recentDecisions`, `meetingSnapshot`, `sourceCounts`. Day la source tot nhat de compose Morning Briefing.
- `src/modules/dashboard/services/executive-dashboard-service.ts` da co `getExecutiveDashboardData(user, options)` voi selected scope, scope assignments, role permission catalog, repository injection, finance sanitizer va deterministic `today`.
- `src/modules/command-center/types.ts` hien expose `executiveDashboard: ExecutiveDashboardData | null`, chua co briefing DTO.
- `src/modules/command-center/services/command-center-service.ts` load `operationsDashboard`, `executiveData`, `executiveDashboard` trong `getCommandCenterData`. Story nay nen them `executiveMorningBriefing` o cung data path, khong tao loader rieng trong client.
- `src/modules/command-center/components/command-center-dashboard.tsx` da render `ExecutiveDashboardOverview` khi `activeView === "executive-dashboard"` va co `ExecutiveDashboardNoAccessState`. Story nay can them branch rieng cho `executive-morning-briefing`.
- `src/modules/dashboard/components/executive-dashboard-overview.tsx` da co helper UI cho drill-down, finance no-permission, priority queue, risk summary, deadlines va meeting snapshot. Reuse pattern/thinking, khong duplicate raw data logic.
- `src/modules/ai/types.ts` da co `AI_WORKFLOW_STATUSES` va labels draft/review/approved/rejected; `src/modules/ai/services/ai-gateway-service.ts` co `askAi`; `src/modules/ai/services/ai-coordinator-service.ts` co permission-aware retrieval/citations. Nhung Story 8.1 moi chot AI Gateway permission+citation day du, nen Story 2.4 khong nen phu thuoc provider AI de pass AC.
- `src/modules/executive/services/executive-service.ts` da scope `aiLeadershipSummary` va `aiInsights`, dong thoi sanitize finance. Co the dung lam secondary source neu can, nhung briefing should prefer `ExecutiveDashboardData` de tranh mismatch voi Story 2.3.
- Worktree hien dang dirty voi nhieu thay doi/untracked tu cac story truoc; dev khong duoc reset/checkout/revert thay doi khong lien quan.

### File Targets

Expected NEW:
- `src/modules/dashboard/services/executive-morning-briefing-service.ts`
- `src/modules/dashboard/components/executive-morning-briefing.tsx`
- `tests/unit/executive-morning-briefing-service.test.ts`

Expected UPDATE:
- `src/modules/dashboard/types.ts`
- `src/modules/command-center/types.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

Possible UPDATE:
- `src/modules/ai/types.ts` only if reusing `AiWorkflowStatus`/labels cleanly helps typing; do not move AI workflow ownership into dashboard.
- `src/modules/executive/services/executive-service.ts` only if a scoped source field needed by briefing is missing/sanitized incorrectly.
- `src/modules/dashboard/components/executive-drilldown-panel.tsx` only if briefing needs a safe presentation prop; preserve Story 2.3 behavior.

Avoid unless truly needed:
- Khong tao route moi ngoai Command Center.
- Khong phuc hoi `/executive` thanh page doc lap.
- Khong goi Supabase/repository tu component.
- Khong goi AI provider tu client.
- Khong them Redux/Zustand/global store.
- Khong implement approval actions, risk CRUD, decision creation, meeting creation.
- Khong upgrade dependencies.

### Data Contract Guardrails

- `ExecutiveMorningBriefingData.scope` nen reuse `ExecutiveDashboardScope` hoac mirror field tu `ExecutiveDashboardData.scope`.
- `ExecutiveMorningBriefingData.permissions` nen expose `canViewRisk`, `canViewProposals`, `canViewMeetings`, `canViewDecisions`, `canViewFinance`, `canDrillDown`.
- `summary.status` phai ro: `draft`, `placeholder`, hoac `insufficient_context`.
- `summary.citations` chi duoc tao tu item visible trong DTO. Neu item khong co `href`, citation van co `sourceType/sourceId/title` de panel read-only.
- `kpisToday` co the lay tu `data.kpis`; khong hardcode so KPI trong component.
- `topRisks` lay tu `data.riskSummary.items` sap xep critical/high truoc.
- `overdueApprovals` lay tu `data.approvalSummary.items` co deadline qua han hoac tone red; khong dua draft/final approval nhu Story 2.2 da loai.
- `decisionsToday`/`thingsToDecideToday` nen lay tu `todayDeadlines.items` va `recentDecisions.items` co source decision/executive_action, khong dua task vi mo.
- `projectHealth` phai co total/red/yellow/green va item labels; khong chi mau.
- Finance fields trong briefing/citation text phai tuan `financialAccess`; neu no-permission thi khong dua amount vao text summary.

### Architecture Compliance

- Data flow expected: route/layout guard -> `getCommandCenterData` -> `getExecutiveMorningBriefingData` -> client component render.
- Permission enforcement o server/service layer. UI no-permission la presentation sau khi DTO da sanitize, khong phai security boundary.
- Service/repository boundary phai giu mock/file-backed va Supabase-ready parity; khong import repository vao React component.
- Internal AI output la draft/goi y. Neu co future action proposal, phai qua AI action proposal + human confirmation va domain permission re-check, khong nam trong story nay.
- DTO/domain fields dung camelCase; DB snake_case khong duoc lo ra UI.

### UX Guardrails

- Morning Briefing phai quiet, dense, scan-friendly; khong lam hero/marketing section.
- H1/header nen la `Morning Briefing`, khong doi brand/app shell.
- Draft AI Summary nen nam dau briefing nhung khong che khu KPI/risk; show citations gan summary.
- Cac section can dung layout on dinh va compact: KPI hom nay, Top risk, Approval qua han, Viec can quyet, Project health.
- Mobile dung stacked cards/list, khong table rong.
- Badge status co text; risk/project health khong phu thuoc mau.
- Text tieng Viet phai wrap; khong scale font theo viewport width.

### Previous Story Intelligence

- Story 2.1 da chot `/command-center?view=executive-dashboard` la canonical leadership route va `/executive*` la guard-first redirect. Story nay phai tiep tuc dung Command Center view, preserve `scopeId`.
- Story 2.2 da tao `ExecutiveDashboardData` va finance sanitizer. Briefing phai consume/summarize DTO nay, khong quay lai `executiveWorkspace` legacy amount/budget/cashflow de bypass sanitizer.
- Story 2.3 da tao dashboard UI, no-access state, drill-down permission gating, safe href validation, priority dedupe va e2e smoke. Briefing UI nen reuse these patterns and not regress dashboard.
- Story 1.5 da tao seed personas cho Chairman/Super Admin, CEO, Giam doc du an, Truong bo phan, Thu ky/Tro ly va Viewer. Tests nen dung persona/scope de chung minh briefing khac nhau theo scope.

### Git / Recent Work Intelligence

- Current git log chi co `484589a 2205` va `a8162e3 first fcm`; nhieu implementation artifacts/code tu Story 1.x/2.x dang nam trong dirty worktree/untracked files.
- Dev phai doc file truoc khi sua va khong revert thay doi khong lien quan.
- `sprint-status.yaml` truoc khi tao story co `2-4-morning-briefing-theo-scope: backlog`; create-story da update story nay thanh `ready-for-dev`.

### Testing Guidance

- Unit service tests nen pass `today: new Date("2026-05-24T00:00:00.000Z")` de overdue/today deterministic.
- De tranh mock ESM phuc tap, uu tien repository injection va fixture DTO tu `getExecutiveDashboardData` hon `vi.mock` same-file helpers.
- Test no-permission finance bang `JSON.stringify(briefing)` khong chua amount/budget/cashflow hidden.
- Test citation source visible: moi citation source id nam trong mot section item cua DTO.
- Component tests nen dung Testing Library semantic queries (`getByRole`, accessible name) cho summary region, section headings, buttons, close panel.
- E2E smoke nen vao `/command-center?view=executive-morning-briefing`, verify label `Morning Briefing`, draft/placeholder AI label, Top risk/Approval qua han/Project health, va mobile 390px khong co application error/overflow co ban.

### Latest Tech Notes

- Project baseline hien tai: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Vitest `^3.1.3`, Testing Library React `^16.3.0`, Playwright `^1.52.0`. Story nay khong can dependency moi.
- Verified 2026-05-24: Next App Router guidance van phu hop voi server data -> client interactive subtree pattern; keep data loading in server/service, pass serializable props to `"use client"` briefing component. Source: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Verified 2026-05-24: Testing Library uu tien semantic/accessibility queries nhu `getByRole(..., { name })`; dung cho buttons, headings, regions va dialog tests. Source: https://testing-library.com/docs/queries/byrole/
- Verified 2026-05-24: Playwright supports screenshot assertions via `expect(page).toHaveScreenshot()` if visual lock is needed; minimum smoke can still assert content at desktop/mobile viewports. Source: https://playwright.dev/docs/test-snapshots
- Verified 2026-05-24: Vitest component testing/browser mode co the dung Playwright/WebdriverIO/preview, nhung repo hien dung jsdom + Testing Library; do not change test runner config for this story. Source: https://main.vitest.dev/guide/browser/component-testing

### References

- `_bmad-output/planning-artifacts/epics.md` - Epic 2, Story 2.4 requirements, AC, dependencies, files/modules and test expectations.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-013..FR-015, FR-085, FR-087, FR-088, FR-090, NFR-001, NFR-009, NFR-010.
- `_bmad-output/planning-artifacts/architecture.md` - App Router modular monolith, service/repository boundary, server/service permission enforcement, AI citation/action proposal guardrails and testing standards.
- `_bmad-output/planning-artifacts/ux-design-specification.md` - Morning Briefing, contextual AI panel, AI draft/citation, priority queue, responsive/accessibility and empty/no-permission states.
- `_bmad-output/implementation-artifacts/2-1-permission-aware-shell-va-workspace-entry.md` - canonical Command Center route, selected scope handling and guard/no-fetch learnings.
- `_bmad-output/implementation-artifacts/2-2-executive-dashboard-service-dto-theo-scope.md` - `ExecutiveDashboardData`, finance sanitizer, scope filtering and Command Center integration.
- `_bmad-output/implementation-artifacts/2-3-dashboard-ui-voi-kpi-strip-priority-queue-va-risk-summary.md` - DTO-driven executive dashboard UI, drill-down/no-permission states and responsive/e2e learnings.
- `src/modules/dashboard/types.ts` - current `ExecutiveDashboardData` shape.
- `src/modules/dashboard/services/executive-dashboard-service.ts` - existing scoped dashboard DTO builder and sanitizer.
- `src/modules/command-center/services/command-center-service.ts` - Command Center aggregate integration point.
- `src/modules/command-center/components/command-center-dashboard.tsx` - current view-switching and executive dashboard UI branch.
- `src/modules/ai/README.md`, `src/modules/ai/types.ts`, `src/modules/ai/services/ai-gateway-service.ts`, `src/modules/ai/services/ai-coordinator-service.ts` - AI draft/citation/provider boundaries.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/executive-morning-briefing-service.test.ts`
- `npm run test -- tests/unit/command-center-service.test.ts`
- `npm run test -- tests/unit/command-center-dashboard.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`

### Completion Notes List

- Added `ExecutiveMorningBriefingData` DTO and service that composes briefing data from scoped `ExecutiveDashboardData`.
- Added deterministic placeholder/insufficient-context summary logic with citations only to visible DTO source records.
- Wired `executiveMorningBriefing` through Command Center data, menu, URL view, and no-access handling.
- Added Morning Briefing UI with summary, KPI, top risk, overdue approval, decisions today, project health, meeting snapshot, no-permission, empty, and read-only drill-down states.
- Added unit/component/e2e coverage for service scope/finance/citation behavior, Command Center integration, and desktop/mobile route smoke.

### File List

- `_bmad-output/implementation-artifacts/2-4-morning-briefing-theo-scope.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-morning-briefing-service.ts`
- `src/modules/dashboard/components/executive-morning-briefing.tsx`
- `src/modules/command-center/types.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `tests/unit/executive-morning-briefing-service.test.ts`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-24 | 1.1 | Implemented scoped Morning Briefing DTO, Command Center view, UI, and tests. | Codex |
| 2026-05-24 | 1.0 | Created Story 2.4 implementation guide for scoped Morning Briefing. | Codex |
