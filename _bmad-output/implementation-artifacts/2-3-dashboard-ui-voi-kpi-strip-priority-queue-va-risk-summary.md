# Story 2.3: Dashboard UI Voi KPI Strip, Priority Queue Va Risk Summary

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay build UI cho Dashboard Tong Quan Module 1 - Lanh dao tren canonical Command Center view, tieu thu `ExecutiveDashboardData` da co tu Story 2.2. Pham vi la UI/dashboard interaction, responsive, empty/no-permission states va tests; khong tao service aggregation moi, khong tao route dashboard thu hai.

## Story

As a lanh dao,  
I want dashboard hien thi KPI, viec khan, approval, risk va quyet dinh moi theo layout de quet,  
so that toi biet nhanh van de quan trong nhat hom nay.

## Tieu Chi Chap Nhan

1. **Dashboard Tong Quan tieu thu DTO chinh thuc** (AC: 1)
   - Given `CommandCenterData.executiveDashboard` co du lieu hop le tu `getExecutiveDashboardData`
   - When nguoi dung mo `/command-center?view=executive-dashboard`
   - Then UI hien thi KPI Strip, Priority Queue, Risk Summary/Map, deadline hom nay va quyet dinh moi tu `ExecutiveDashboardData`
   - And UI khong dung `operationsDashboard`, `data.metrics` overview chung, hoac inline/mock counters de thay cho DTO nay
   - And UI khong hien thi task vi mo, ban ve ky thuat chi tiet, hoac du lieu chuyen mon sau mac dinh.

2. **Drill-down tu KPI/risk/approval/decision giu ngu canh dashboard** (AC: 2)
   - Given mot KPI, risk, approval, deadline hoac decision item co `sourceType` va `sourceId`
   - When nguoi dung chon item
   - Then UI mo drill-down panel/sheet hoac safe `href` theo quyen
   - And drill-down hien thi toi thieu title, source type, status, owner, deadline, reason, project/scope neu co va link nguon neu DTO cung cap `href`
   - And khong tu tao URL tu raw id neu DTO khong cung cap route an toan.

3. **No-permission, empty va sensitive finance state ro rang** (AC: 1, 2)
   - Given `financialSummary.state` la `no_permission`
   - When dashboard render
   - Then UI hien no-permission state cho tai chinh nhay cam va khong render amount/budget/cashflow that
   - And approval/project item co `financialAccess: "no_permission"` khong hien `amount`, `amountLabel`, `cashFlowLabel`
   - And empty state phan biet "khong co du lieu trong scope" voi "khong co quyen" thay vi crash hoac show card rong vo nghia.

4. **Responsive va accessibility dat muc nghiem thu** (AC: 3)
   - Given mobile viewport duoi 768px
   - When dashboard render
   - Then KPI/risk/approval chuyen sang stacked priority layout hoac compact list
   - And bang rong neu co phai co mobile alternative; khong ep user thao tac table min-width lon tren mobile
   - And text tieng Viet trong KPI, badge, button va row khong tran/cat xau
   - And risk/health state khong chi dua vao mau; moi badge/heatmap cell co label text, accessible name va focus state ro.

5. **Bao ton Command Center canonical route va regression boundaries**
   - Given `/executive` va cac route executive legacy dang redirect ve Command Center
   - When story nay hoan thanh
   - Then `/command-center?view=executive-dashboard` van la surface chinh, `/executive*` khong bi phuc hoi thanh dashboard doc lap
   - And `operations-dashboard`, Axis 1 view, shell scope selector va direct unauthorized/403 flow tu Story 2.1 van hoat dong.

## Tasks / Subtasks

- [x] Wire `ExecutiveDashboardData` vao executive dashboard view (AC: 1, 5)
  - [x] Update `CommandCenterDashboard` de truyen `data.executiveDashboard` vao `CommandCenterExecutivePanel` va `ExecutiveCommandCenterView`.
  - [x] Cho `ExecutiveCommandCenterView` nhan ca `executiveDashboard: ExecutiveDashboardData | null` va `executiveWorkspace` legacy neu can giu cac panel/metadata cu.
  - [x] Neu `executiveDashboard` null, render unauthorized/no-access/empty state an toan, khong doc `executiveWorkspace` mock de hien du lieu executive.
  - [x] Giu `executiveWorkspace` state hien co cho cac view/action legacy khac neu con duoc dung; khong xoa field hoac reducer mock khi chua migrate het.

- [x] Build UI pattern cho Dashboard Tong Quan tu DTO moi (AC: 1, 3)
  - [x] Tao hoac tach component trong `src/modules/dashboard/components` hoac `src/modules/executive/components` theo pattern hien co, vi du `ExecutiveDashboardKpiStrip`, `ExecutivePriorityQueue`, `ExecutiveRiskSummary`, `ExecutiveRecentDecisions`, `ExecutiveDrilldownPanel`.
  - [x] KPI Strip lay tu `executiveDashboard.kpis`, `projectPortfolio`, `approvalSummary`, `riskSummary`, `todayDeadlines`, `meetingSnapshot`; khong hardcode so lieu.
  - [x] Hien `financialSummary` rieng: allowed/partial/no-permission; state no-permission khong co amount that.
  - [x] Priority Queue hop nhat cac item dieu hanh tu approval, risk, deadline va decision theo muc do nghiem trong: critical/high, overdue, today, red/amber, sau do moi den informational.
  - [x] Risk Summary/Map dung `riskSummary.critical`, `high`, `byCategory`, `items`; moi o/row co label chu va count, khong chi mau do/vang/xanh.
  - [x] Deadline hom nay va decision moi dung `todayDeadlines.items` va `recentDecisions.items`; khong lay `tasksDueThisWeek` hoac operations task list.

- [x] Drill-down/read-only detail pattern (AC: 2, 4)
  - [x] Them local state `selectedSourceItem` trong component UI de mo side panel desktop va full-screen/stacked sheet mobile neu chua co primitive phu hop.
  - [x] Panel hien source metadata: title, `sourceType`, `sourceId`, projectId/scope neu co, status, tone/severity label, owner, deadline, reason, safe `href`.
  - [x] Neu item co `href`, hien link "Mo nguon" bang `next/link`; neu khong, hien read-only source metadata va thong bao chua co route an toan.
  - [x] Khong implement approval mutations trong story nay. Quick action chi hien neu da ton tai va da co permission guard; action thuc su thuoc Epic 3.

- [x] Responsive, loading/empty/error/no-permission states (AC: 3, 4)
  - [x] Desktop >=1280px: layout scan-friendly gom KPI strip, priority queue, risk summary/map, deadline/decision column va drill-down side panel.
  - [x] Mobile <768px: stack KPI, queue, risk, decision; table neu co chuyen thanh compact list; touch target action chinh gan 44px.
  - [x] Empty state noi ro: khong co item trong scope hien tai, khong co quyen, hoac filter dang loai het du lieu.
  - [x] Loading state neu can tach route/component: dung skeleton giu layout on dinh; khong layout shift lon.
  - [x] Badge/trang thai phai co text tieng Viet ngan; icon button phai co accessible name.

- [x] Preserve routing, shell va view switching behavior (AC: 5)
  - [x] `handleViewSelect` van giu URL `/command-center?view=...` va preserve `scopeId`.
  - [x] `/executive*` tiep tuc redirect/guard-first theo `renderExecutivePage`; khong render `ExecutiveLeadershipDashboard` doc lap cho story nay.
  - [x] `CommandCenterOperationsPanel` van dung `DashboardData` operations components; khong doi semantics cua `/command-center?view=operations-dashboard`.
  - [x] Direct viewer/unauthorized vao `view=executive-dashboard` van bi guard/403 truoc service fetch nhu Story 2.1.

- [x] Tests va nghiem thu (AC: 1, 2, 3, 4, 5)
  - [x] Them component test cho `CommandCenterDashboard`/component moi: khi active view la `executive-dashboard`, UI render KPI/approval/risk/deadline tu `executiveDashboard`.
  - [x] Test component khong render operations micro task labels trong executive dashboard.
  - [x] Test no-permission finance state: khong co amount/cashflow/budget trong DOM khi `financialSummary.state = "no_permission"`.
  - [x] Test click/keyboard open drill-down panel va focus/accessibility name co y nghia.
  - [x] Cap nhat/bo sung e2e smoke cho `/command-center?view=executive-dashboard` desktop va mobile 390px: thay KPI Strip, Priority Queue, Risk Summary, khong overflow text co ban.
  - [x] Giu existing tests cho service DTO, command center guard, unauthorized direct access, operations dashboard va Axis 1.

- [x] Kiem thu
  - [x] Chay focused component tests moi.
  - [x] Chay `npm run typecheck`.
  - [x] Chay `npm run lint`.
  - [x] Chay `npm run test`.
  - [x] Chay `npm run test:e2e` vi story thay doi UI/route surface.
  - [x] Ghi ro lenh nao khong chay duoc trong Dev Agent Record.

### Review Findings

- [x] [Review][Patch] Drill-down ignores `ExecutiveDashboardData.permissions.canDrillDown` [src/modules/dashboard/components/executive-dashboard-overview.tsx:316]
- [x] [Review][Patch] Non-finance empty states do not distinguish no-permission from no-data [src/modules/dashboard/components/executive-dashboard-overview.tsx:334]
- [x] [Review][Patch] Drill-down dialog opens without focus management or Escape close [src/modules/dashboard/components/executive-drilldown-panel.tsx:33]
- [x] [Review][Patch] Drill-down source link renders DTO `href` without safe-route validation [src/modules/dashboard/components/executive-drilldown-panel.tsx:76]
- [x] [Review][Patch] Priority Queue can duplicate the same source across approval, risk, deadline and decision summaries [src/modules/dashboard/components/executive-dashboard-overview.tsx:108]
- [x] [Review][Patch] Risk priority fallback labels medium/low risk items as High [src/modules/dashboard/components/executive-dashboard-overview.tsx:89]
- [x] [Review][Patch] Deadline priority fallback can label overdue items as Hom nay [src/modules/dashboard/components/executive-dashboard-overview.tsx:112]

## Dev Notes

### Boi Canh Nghiep Vu

- Story 2.3 la UI layer cho Dashboard Tong Quan Module 1 - Lanh dao. Story 2.2 da tao service/DTO contract; story nay phai tieu thu contract do.
- Dashboard phai giup Chairman/CEO/lanh dao biet trong 1-2 phut: KPI quan trong, du an do/vang/xanh, approval qua han, risk cao/nghiem trong, deadline hom nay va quyet dinh moi.
- Dashboard khong phai noi nhap lieu vi mo, khong hien task chuyen mon sau mac dinh, khong phai dashboard chung cua toan app.
- Moi so lieu/pham vi/href phai da duoc server/service filter. UI khong co trach nhiem bao mat bang cach an CSS.

### Current Code State (Read Before Editing)

- `src/modules/command-center/types.ts` da co `executiveDashboard: ExecutiveDashboardData | null` tren `CommandCenterData`.
- `src/modules/command-center/services/command-center-service.ts` da goi `getExecutiveDashboardData(user, ...)` khi `canViewExecutive` hop le va tra ve `executiveDashboard` trong aggregate.
- `src/modules/command-center/components/command-center-dashboard.tsx` hien chua doc `data.executiveDashboard`. `CommandCenterExecutivePanel` chi nhan `executiveWorkspace`; `ExecutiveCommandCenterView` dang render tu legacy `executiveWorkspace.overviewCards`, `commandCenterSnapshot`, `leadershipActionItems`, `decisionLog`, `auditLog`.
- `ExecutiveCommandCenterView` hien co table min-width `1320px` cho leadership action items. Story 2.3 can mobile alternative/compact priority layout, khong chi horizontal table cho mobile.
- `CommandCenterOperationsPanel` dung `DashboardKpiGrid`, `DashboardPriorityAlerts`, `DashboardQuickLists` voi `DashboardData` operations. Cac component nay la operations dashboard, khong duoc reuse unmodified cho Module 1 executive dashboard vi chung hien micro tasks/documents/legal operations.
- `src/modules/dashboard/types.ts` la source of truth cho `ExecutiveDashboardData`: `projectPortfolio`, `kpis`, `financialSummary`, `approvalSummary`, `riskSummary`, `todayDeadlines`, `recentDecisions`, `meetingSnapshot`, `sourceCounts`.
- `src/modules/dashboard/services/executive-dashboard-service.ts` da sanitize finance, cap approval queue, build deadline summary, risk summary va source metadata. UI nen tin DTO state, khong parse lai raw executive mock data.
- `src/app/command-center/page.tsx` la canonical route va guard executive deep link bang `requireWorkspaceRoute("/executive")` neu query view bat dau `executive-`.
- `src/app/executive/_lib/render-executive-page.tsx` hien redirect `/executive*` ve `/command-center?view=executive-*` sau guard. `ExecutiveLeadershipDashboard` ton tai nhung khong la surface chinh cho story nay.
- `tests/unit/command-center-page.test.tsx` da cover guard-before-fetch cho executive deep link. `tests/unit/executive-dashboard-service.test.ts` da cover DTO shape/finance/scope; khong lap lai service assertions o component test neu khong can.
- `tests/e2e/mvp-smoke.spec.ts` da co direct unauthorized executive command center case. Story 2.3 nen mo rong e2e smoke cho UI executive dashboard render/mobile thay vi thay the guard test.

### File Targets

Expected UPDATE:
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `tests/unit/command-center-dashboard.test.tsx` hoac component test tuong duong neu dat ten khac
- `tests/e2e/mvp-smoke.spec.ts`

Expected NEW or UPDATE:
- `src/modules/dashboard/components/executive-dashboard-kpi-strip.tsx`
- `src/modules/dashboard/components/executive-priority-queue.tsx`
- `src/modules/dashboard/components/executive-risk-summary.tsx`
- `src/modules/dashboard/components/executive-drilldown-panel.tsx`
- Hoac cac component tuong duong trong `src/modules/executive/components` neu dev chon ownership executive UI. Chon mot module ownership ro, khong duplicate hai noi.

Possible UPDATE:
- `src/modules/command-center/types.ts` neu can type alias/presenter prop, nhung khong doi DTO service contract tuy tien.
- `src/modules/dashboard/types.ts` chi neu UI can type bo sung that su can thiet; tranh doi service contract da test o Story 2.2.
- `tests/unit/command-center-service.test.ts` neu UI change lam can fixture helper cho `executiveDashboard`, nhung khong rewrite service behavior.

Avoid unless truly needed:
- Khong tao route moi cho dashboard.
- Khong phuc hoi `/executive` thanh page doc lap.
- Khong goi repository/Supabase tu component.
- Khong hardcode KPI/risk/approval count trong UI.
- Khong hien raw amount tai chinh khi DTO bao `no_permission`.
- Khong them Redux/Zustand/global store.
- Khong upgrade dependency.

### Architecture Compliance

- Next.js App Router + TypeScript modular monolith: page load data server-side, client component chi render/tuong tac local.
- Data flow expected: route guard -> `getCommandCenterData` -> `getExecutiveDashboardData` -> `CommandCenterDashboard` -> executive dashboard components.
- Permission enforcement da nam o guard/service. UI phai ton trong DTO da filter, khong thay the guard.
- Service/repository boundary khong doi trong story nay.
- Component moi nen nhan props typed tu `ExecutiveDashboardData`, khong nhan raw mock-data objects neu khong can.
- Use `next/link` cho safe `href`; neu item khong co `href`, dung panel read-only.

### UX Guardrails

- Enterprise operational UI: quiet, dense, scan-friendly; khong tao hero/marketing section.
- KPI Strip: label, value, trend/status/reason, permission state, drill-down affordance.
- Priority Queue: title, type/source, severity, owner, deadline, reason, next action/read-only detail.
- Risk Summary/Map: category, count, severity, affected projects/items, label text; khong chi mau.
- Drill-down: desktop side panel, mobile full-screen/stacked sheet; focus state va close action ro.
- Badge trang thai phai co chu; khong dung mau lam signal duy nhat.
- Vietnamese text phai wrap tot, khong scale font theo viewport width.
- Mobile <768px phai la stacked/compact list, khong table rong bat buoc.

### Previous Story Intelligence

- Story 2.1 da chot `/command-center?view=executive-dashboard` la canonical leadership route va `/executive*` la guard-first redirect. Story 2.3 phai tiep tuc chot nay.
- Story 2.1 da them shell/scope selector va guard no-fetch. Neu story nay thay doi view switching, phai preserve `scopeId` va guard behavior.
- Story 2.2 da tao `ExecutiveDashboardData` va wire vao `CommandCenterData`, nhung UI chua tieu thu. Story 2.3 la noi migrate UI sang DTO moi.
- Story 2.2 da sua finance sanitizer. UI khong duoc doc `executiveWorkspace` legacy amount/budget/cashflow de bypass sanitizer.
- Story 1.5 da tao seed personas cho Chairman/Super Admin, CEO, Giam doc du an, Truong bo phan, Thu ky/Tro ly va Viewer. E2E/component fixtures nen phan anh cac persona/scope nay.

### Git / Recent Work Intelligence

- Worktree hien co rat nhieu modified/untracked files tu cac story truoc. Dev khong duoc reset/checkout/revert cac thay doi khong lien quan.
- Recent git log chi co `484589a 2205` va `a8162e3 first fcm`; nhieu implementation artifacts va code story 1.x/2.1/2.2 dang o dirty worktree.
- Story file 2.3 chua ton tai luc tao story. Sprint status truoc do de `2-3-dashboard-ui-voi-kpi-strip-priority-queue-va-risk-summary: backlog`.

### Testing Guidance

- Component test nen dung Testing Library semantic queries (`getByRole`, accessible name) thay vi assert CSS class.
- Nen tao minimal `CommandCenterData` fixture co `executiveDashboard` ro rang va `operationsDashboard` chua micro task labels de assert executive view khong leak operations dashboard.
- Test no-permission finance bang DOM text: amount/cashflow/budget fixture khong xuat hien khi DTO no-permission.
- Test drill-down bang click va keyboard focus: item co button/link accessible name, panel co heading/close button.
- E2E smoke nen login leadership role hoac set mock cookie tu pattern hien co, vao `/command-center?view=executive-dashboard`, kiem tra text KPI/Risk/Priority va mobile 390px khong co `Application error`.
- Run full `npm run test` sau focused tests vi `CommandCenterDashboard` la component lon co the anh huong command center/route tests.

### Latest Tech Notes

- Project baseline hien tai: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Vitest `^3.1.3`, Testing Library React `^16.3.0`, Playwright `^1.52.0`. Story nay khong can dependency moi.
- Verified 2026-05-24: Next App Router server/client component guidance van phu hop: giu data loading o server/page/service, pass serializable props vao client component interactive; chi dung `"use client"` o subtree can state/event handlers. Source: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Verified 2026-05-24: Testing Library uu tien semantic/accessibility queries, dac biet `getByRole` voi accessible name cho button/link/panel tests. Source: https://testing-library.com/docs/queries/byrole/
- Verified 2026-05-24: Playwright ho tro screenshot/visual comparison qua `expect(page).toHaveScreenshot()` neu can lock responsive layout sau khi UI on dinh; e2e smoke toi thieu van nen assert content/viewport. Source: https://playwright.dev/docs/test-snapshots
- Verified 2026-05-24: Vitest component testing guidance nhan manh test component contract, user interactions, edge/error states va accessibility; neu repo chua dung Browser Mode, tiep tuc pattern Testing Library/jsdom hien co thay vi doi config lon trong story nay. Source: https://vitest.dev/guide/browser/component-testing

### References

- `_bmad-output/planning-artifacts/epics.md` - Epic 2, Story 2.3 requirements, acceptance criteria, files/modules and dependencies.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-001..FR-012, NFR-001..NFR-011, dashboard/permission/finance requirements.
- `_bmad-output/planning-artifacts/architecture.md` - frontend architecture, component strategy, service/repository boundaries, testing standards.
- `_bmad-output/planning-artifacts/ux-design-specification.md` - KPI Strip, Priority Queue, Risk Map, Record Drilldown Panel, loading/empty/error/unauthorized, responsive and accessibility rules.
- `_bmad-output/implementation-artifacts/2-1-permission-aware-shell-va-workspace-entry.md` - canonical route, guard/no-fetch and scope selector learnings.
- `_bmad-output/implementation-artifacts/2-2-executive-dashboard-service-dto-theo-scope.md` - DTO contract, finance sanitizer, Command Center integration and testing learnings.
- `_bmad-output/implementation-artifacts/spec-command-center-unification.md` - canonical `/command-center` and legacy route boundaries.
- `_bmad-output/implementation-artifacts/spec-executive-dashboard-command-center.md` - existing Executive Dashboard in Command Center intent and constraints.
- `src/modules/dashboard/types.ts` - `ExecutiveDashboardData` shape.
- `src/modules/dashboard/services/executive-dashboard-service.ts` - service DTO builder and sanitizer.
- `src/modules/command-center/services/command-center-service.ts` - aggregate loads `executiveDashboard`.
- `src/modules/command-center/components/command-center-dashboard.tsx` - current UI surface to migrate.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Focused RED/GREEN component test: `npm run test -- tests/unit/command-center-dashboard.test.tsx`
- Type validation: `npm run typecheck`
- Lint validation: `npm run lint`
- Full regression: `npm run test`
- E2E smoke: `npm run test:e2e`

### Completion Notes List

- Wired `CommandCenterDashboard` -> `CommandCenterExecutivePanel` -> `ExecutiveCommandCenterView` to consume `data.executiveDashboard` for `view=executive-dashboard`.
- Added DTO-driven Executive Dashboard UI with KPI Strip, Priority Queue, Risk Summary, finance permission state, deadlines, recent decisions, meeting snapshot and read-only drill-down panel.
- Preserved legacy executive workspace state and action handlers for non-dashboard executive views; `executiveDashboard: null` now renders a no-access state instead of legacy/mock executive metrics.
- Added component tests for DTO render, no-permission finance redaction and accessible drill-down behavior.
- Added e2e smoke coverage for desktop and 390px mobile `/command-center?view=executive-dashboard`; all required validation commands ran successfully.
- Code review patches applied: drill-down permission gating, no-permission empty states, dialog focus/Escape handling, safe href validation, unique priority queue sources and corrected risk/deadline priority labels.

### File List

- `src/modules/command-center/components/command-center-dashboard.tsx`
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`
- `src/modules/dashboard/components/executive-dashboard-kpi-strip.tsx`
- `src/modules/dashboard/components/executive-priority-queue.tsx`
- `src/modules/dashboard/components/executive-risk-summary.tsx`
- `src/modules/dashboard/components/executive-drilldown-panel.tsx`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/2-3-dashboard-ui-voi-kpi-strip-priority-queue-va-risk-summary.md`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-24 | 1.2 | Applied code review patches and re-ran unit/type/lint/e2e validation. | Codex |
| 2026-05-24 | 1.1 | Implemented Executive Dashboard UI from `ExecutiveDashboardData`, added drill-down, permission states, responsive smoke tests and validation record. | Codex |
| 2026-05-24 | 1.0 | Created Story 2.3 implementation guide for Executive Dashboard UI consuming `ExecutiveDashboardData`. | Codex |
