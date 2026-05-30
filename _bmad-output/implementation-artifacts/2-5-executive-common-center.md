# Story 2.5: Executive Common Center

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay tao Executive Common Center nhu mot surface rieng trong Command Center cho thong tin chung cua lanh dao da loc theo scope/permission. Pham vi la service DTO, navigation/view trong `/command-center`, UI common center, priority area cho risk do/nghiem trong va approval qua han nghiem trong, va tests. Khong build Private Workspace, khong build Approval Center actions, khong tao meeting/decision/risk mutations, khong thay the Dashboard Tong Quan hoac Morning Briefing.

## Story

As a lanh dao co quyen,  
I want xem Common Center voi thong tin chung da loc theo permission,  
so that cac van de nghiem trong va thong tin dieu hanh chung khong bi bo sot.

## Tieu Chi Chap Nhan

1. **Common Center DTO dung scope va permission**
   - Given `PermissionUser`, selected `scopeId` va route/view hop le
   - When tai Executive Common Center
   - Then service tra DTO gom thong bao moi, quyet dinh moi, quyet dinh Chu tich neu visible, KPI chung, lich hop, lich su kien, risk tong, chien luoc, deadline he thong, viec vuot nguong va viec qua han trong scope
   - And DTO phai derive tu `ExecutiveDashboardData` va scoped `ExecutiveLeadershipData`, khong doc raw mock data/operations dashboard truc tiep trong UI
   - And item ngoai scope hoac ngoai quyen khong xuat hien trong DTO.

2. **Priority area bat buoc hien risk nghiem trong va approval qua han nghiem trong**
   - Given co risk `red`/`critical`/`high` hoac approval qua han nghiem trong trong scope
   - When Common Center render
   - Then item do xuat hien trong priority area voi `groupLabel`, `priorityLabel`, title, reason, owner, deadline, project/scope va action/drill-down theo quyen
   - And priority sort phai dua severe risk va overdue approval len truoc thong bao chung
   - And duplicate source record chi hien mot lan trong priority area.

3. **Service loai bo du lieu ngoai quyen truoc UI**
   - Given user thieu quyen xem risk/proposal/meeting/decision/finance cua mot record
   - When Common Center DTO duoc tao
   - Then record/field do bi loai bo hoac tra no-permission state tu service truoc khi den component
   - And amount/budget/cashflow that khong xuat hien trong DTO/DOM/metadata neu `financialAccess` la `no_permission`
   - And direct URL/user thieu quyen bi guard/no-access truoc khi protected data render.

4. **Common Center la view rieng trong Command Center**
   - Given user co quyen vao Module 1 - Lanh dao
   - When chon `Executive Common Center`
   - Then URL/view dung `/command-center?view=executive-common-center` va preserve `scopeId`
   - And `/command-center?view=executive-dashboard` van la Dashboard Tong Quan
   - And neu Story 2.4 da them `/command-center?view=executive-morning-briefing`, view do van doc lap va khong bi Common Center override.

5. **UI dense, scan-friendly, responsive va accessible**
   - Given DTO co du lieu hop le
   - When Common Center render
   - Then UI hien cac section scan-friendly: KPI chung, priority area, thong bao moi, quyet dinh moi, lich hop/su kien, risk tong, chien luoc, deadline/vuot nguong/qua han
   - And risk/project health badge co text label, khong chi dua vao mau
   - And mobile duoi 768px dung stacked compact list, khong table rong, text tieng Viet khong tran/cat xau, touch target chinh gan 44px.

6. **Regression boundaries duoc bao toan**
   - Given Story 2.1/2.2/2.3 da hoan thanh va Story 2.4 co the dang song song
   - When story nay hoan thanh
   - Then `ExecutiveDashboardData`, dashboard UI, drill-down panel, shell scope selector, legacy `/executive*` guard-first redirect, operations dashboard va axis-1 overview van hoat dong
   - And story nay khong implement approval approve/reject, risk CRUD, decision creation, meeting creation, Private Workspace, full Executive AI Center hoac AI action proposal mutation.

## Tasks / Subtasks

- [x] Chot DTO va service ownership cho Executive Common Center (AC: 1, 2, 3)
  - [x] Them type `ExecutiveCommonCenterData` trong `src/modules/dashboard/types.ts` hoac file type gan dashboard module.
  - [x] Tao `src/modules/dashboard/services/executive-common-center-service.ts`.
  - [x] Service nen nhan `PermissionUser` va options tuong tu `getExecutiveDashboardData`: `selectedScopeId`, `scopeAssignments`, `rolePermissionCatalog`, `repositories`, `today`, `requireScopeAssignments`.
  - [x] Service phai uu tien compose tu `ExecutiveDashboardData` da scope/sanitize va `ExecutiveLeadershipData` da scope; trong `getCommandCenterData`, pass cac DTO da load neu co de tranh goi duplicate.
  - [x] DTO toi thieu gom `generatedAt`, `scope`, `permissions`, `commonKpis`, `priorityItems`, `notifications`, `decisionHighlights`, `calendarItems`, `riskOverview`, `strategyItems`, `systemDeadlines`, `thresholdBreaches`, `sourceCounts`.
  - [x] `permissions` nen expose `canViewProjects`, `canViewProposals`, `canViewMeetings`, `canViewDecisions`, `canViewRisk`, `canViewFinance`, `canDrillDown`.
  - [x] `priorityItems` nen reuse/mirror `ExecutiveDashboardSourceItem` de co drill-down metadata nhat quan voi Story 2.3.

- [x] Build priority va common-section mapping an toan (AC: 1, 2, 3)
  - [x] Priority source bat buoc gom `ExecutiveDashboardData.riskSummary.items` co severity `critical`/`high` hoac tone `red`.
  - [x] Priority source bat buoc gom `ExecutiveDashboardData.approvalSummary.items` co `deadline` qua ngay `today`, tone `red`, riskLevel `critical`/`high` hoac priority `high`/`critical`.
  - [x] `systemDeadlines` lay tu `todayDeadlines.items`; khong dua task vi mo/operations micro task vao Common Center.
  - [x] `decisionHighlights` lay tu `recentDecisions.items`, `executiveData.decisionLog`, va `executiveData.directives` neu visible. Chi gan label `Quyet dinh Chu tich` khi record co source/actor/role ro rang; khong hardcode theo ten nguoi.
  - [x] `calendarItems` lay tu `meetingSnapshot.items`, `executiveData.meetings`, `executiveData.schedule`, `commandCenterSnapshot.meetings`, `commandCenterSnapshot.workCalendar` da scope.
  - [x] `notifications` lay tu `executiveData.notifications` va `commandCenterSnapshot.notes/alerts` da scope.
  - [x] `strategyItems` co the lay tu `executiveData.strategicPlans` va directives chien luoc da scope; khong hien ngan sach/finance neu khong co quyen.
  - [x] `thresholdBreaches` nen derive tu high/critical risk, overdue approval, follow-up qua han, red projects, deadline overdue va rule/threshold metadata neu co; khong hardcode nguong tien trong UI.
  - [x] Dedupe priority/common item bang `sourceType:sourceId`, giu item co severity cao hon.

- [x] Wire Common Center vao Command Center data path (AC: 3, 4, 6)
  - [x] Cap nhat `src/modules/command-center/types.ts` de expose `executiveCommonCenter: ExecutiveCommonCenterData | null`.
  - [x] Cap nhat `src/modules/command-center/services/command-center-service.ts` de load common center khi `canViewExecutive` hop le, dung cung `selectedScopeId`, `effectiveScopeAssignments`, `rolePermissionCatalog`, `requireScopeAssignments` voi dashboard.
  - [x] Them menu item trong `buildAxes` cho `Executive Common Center` voi `viewKey: "executive-common-center"` va href `/command-center?view=executive-common-center`.
  - [x] Prefer them item rieng sau `Ban lanh dao` de giam regression; neu Story 2.4 da chuyen nhom lanh dao thanh children, them Common Center vao cung nhom theo pattern hien tai.
  - [x] Preserve direct `/command-center?view=executive-dashboard` va scope query khi switch view.
  - [x] Invalid/unauthorized selected scope phai tra `executiveCommonCenter: null`, khong fallback sang legacy global/mock data.

- [x] Build UI component Executive Common Center (AC: 2, 4, 5, 6)
  - [x] Tao component trong `src/modules/dashboard/components`, vi du `executive-common-center.tsx`.
  - [x] `CommandCenterExecutivePanel` render component moi khi `activeView === "executive-common-center"`.
  - [x] Header hien `Executive Common Center`, scope label, `generatedAt`, va no-permission guard state neu DTO null.
  - [x] Content nen gom cac section compact: `KPI chung`, `Priority area`, `Thong bao moi`, `Quyet dinh moi`, `Lich hop & su kien`, `Risk tong`, `Chien luoc`, `Deadline/vuot nguong/qua han`.
  - [x] Reuse `ExecutiveDrilldownPanel` hoac source item pattern tu Story 2.3; neu `canDrillDown` false, render read-only item va ly do khong co quyen.
  - [x] Reuse `ExecutivePriorityQueue` only if type phu hop; neu tao component rieng, giu same accessibility pattern: button accessible name, read-only article when drill-down denied, metadata visible.
  - [x] Finance no-permission render message ngan; amount/cashflow/budget khong render.

- [x] Empty, no-permission, responsive va accessibility states (AC: 3, 5)
  - [x] Empty state phan biet `khong co du lieu trong scope`, `khong co quyen`, va `filter/scope khong hop le`.
  - [x] Badge risk/project health co text (`Do`, `Vang`, `Xanh`, `Critical`, `High`, `Qua han`) va khong chi mau.
  - [x] Mobile <768px: stacked list, khong wide table, text wrap tot, buttons/list items co accessible name.
  - [x] Neu dung dialog/sheet drill-down, giu focus/Escape behavior da co trong `ExecutiveDrilldownPanel`.
  - [x] Common Center khong hien `CommandCenterGlobalStatusStrip` nhu nguon du lieu duy nhat; strip co the la context, nhung AC phai duoc dap ung boi DTO/component moi.

- [x] Tests va nghiem thu (AC: 1, 2, 3, 4, 5, 6)
  - [x] Them `tests/unit/executive-common-center-service.test.ts` cho scoped DTO, selected scope, priority critical/high risk, overdue severe approval, decisions, notifications, calendar va empty state.
  - [x] Test finance no-permission bang `JSON.stringify(commonCenter)` khong chua amount/budget/cashflow cua hidden finance records.
  - [x] Test priority dedupe bang duplicated risk/approval/deadline source.
  - [x] Cap nhat `tests/unit/command-center-service.test.ts` de verify `executiveCommonCenter` duoc load/null dung voi executive access va invalid scope.
  - [x] Cap nhat `tests/unit/command-center-dashboard.test.tsx` cho view `executive-common-center`: render heading, priority area, notifications, decisions, calendar, no-permission va khong leak operations micro tasks.
  - [x] Cap nhat `tests/e2e/mvp-smoke.spec.ts` cho `/command-center?view=executive-common-center` desktop va mobile 390px.
  - [x] Chay `npm run typecheck`, `npm run lint`, `npm run test`; chay `npm run test:e2e` vi story them UI/view route.

### Review Findings

- [x] [Review][Patch] Gate ExecutiveLeadershipData-derived Common Center sections by DTO permissions before returning notifications, decisions, calendar, strategy and finance-sensitive copy [src/modules/dashboard/services/executive-common-center-service.ts:534]
- [x] [Review][Patch] Resolve effective scope inside standalone Common Center service so invalid selectedScopeId cannot fallback to the first assignment [src/modules/dashboard/services/executive-common-center-service.ts:525]
- [x] [Review][Patch] Preserve requested executive view for invalid/no-access scope so direct Common Center URL renders no-access instead of overview fallback [src/modules/command-center/components/command-center-dashboard.tsx:638]
- [x] [Review][Patch] Render systemDeadlines in the deadline/vuot nguong section instead of only thresholdBreaches [src/modules/dashboard/components/executive-common-center.tsx:493]
- [x] [Review][Patch] Compute threshold breach reasons from the actual trigger instead of labeling every proposal/approval breach as overdue [src/modules/dashboard/services/executive-common-center-service.ts:483]
- [x] [Review][Patch] Open the executive sidebar child group when the active view is a child view [src/modules/command-center/components/command-center-dashboard.tsx:453]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 2 yeu cau lanh dao vao dung workspace theo role/scope va co 4 surface rieng: Dashboard Tong Quan, Morning Briefing, Executive Common Center va Private Workspace.
- Common Center khac Dashboard Tong Quan: Dashboard la so lieu/queue tong quan cua Module 1; Common Center la dong thong tin chung cua lanh dao gom thong bao, quyet dinh, KPI chung, lich hop/su kien, risk tong, chien luoc, deadline va item vuot nguong/qua han.
- Common Center khac Private Workspace: Common Center la phan chung da loc quyen; Private Workspace la view ca nhan theo assignment tung nguoi, thuoc Story 2.6.
- Risk do/nghiem trong va approval qua han nghiem trong phai noi len trong priority area neu user co quyen xem.
- Common Center van phai scope-aware: khong vi la "common" ma hien global data ngoai assignment.

### Current Code State (Read Before Editing)

- `src/modules/dashboard/types.ts` da co `ExecutiveDashboardData`, `ExecutiveDashboardSourceItem`, `ExecutiveDashboardPermissions`, `ExecutiveApprovalItem`, `ExecutiveRiskItem`, `ExecutiveMeetingSnapshot`, `ExecutiveRecentDecisions`. Day la contract tot nhat de reuse cho Common Center metadata va drill-down.
- `src/modules/dashboard/services/executive-dashboard-service.ts` da co `getExecutiveDashboardData(user, options)` voi selected scope, scope assignments, role permission catalog, repository injection, finance sanitizer va deterministic `today`. Common Center nen reuse DTO nay thay vi doc raw repositories trong component.
- `src/modules/executive/services/executive-service.ts` da co `getExecutiveLeadershipData(user, options)`, `resolveAccessibleScope`, `forExecutiveScope`, `scopeCommandCenterSnapshot`, `sanitizeExecutiveFinance`. `notifications`, `schedule`, `meetings`, `approvals`, `decisionLog`, `directives`, `strategicPlans`, `auditLog`, `aiInsights` deu duoc scope trong service.
- Can chu y: `scopeCommandCenterSnapshot` hien filter `notes`, `meetings`, `workCalendar`, `approvalQueue`, `alerts`, nhung `quickReports` dang giu nguyen; `sanitizeExecutiveFinance` chi loai finance copy khi user thieu finance. Common Center khong nen coi `quickReports` la scoped source neu chua bo sung scope metadata/filter.
- `src/modules/command-center/types.ts` hien expose `executiveDashboard: ExecutiveDashboardData | null` va `executiveWorkspace: CommandCenterExecutiveWorkspaceData`; chua co `executiveCommonCenter`.
- `src/modules/command-center/services/command-center-service.ts` dang load `operationsDashboard`, `executiveData`, `executiveDashboard` trong `Promise.all`. Story nay nen them `executiveCommonCenter` vao cung data path va pass DTO da load vao common service de tranh duplicate fetch.
- `buildAxes` hien them item `Ban lanh dao` voi href `/command-center?view=executive-dashboard`, `viewKey: "executive-dashboard"`. Them Common Center phai preserve view dashboard va update tests dang expect `children` undefined neu chuyen sang children.
- `src/modules/command-center/components/command-center-dashboard.tsx` render moi `activeView.startsWith("executive-")` qua `CommandCenterExecutivePanel`. Branch `executive-dashboard` dang render `ExecutiveDashboardOverview`; cac view executive khac hien legacy sections. Them branch `executive-common-center` truoc legacy sections.
- `CommandCenterGlobalStatusStrip` dang render cho executive views khac dashboard. No co the tiep tuc hien nhu context, nhung khong du AC Common Center neu DTO moi null/khong co data.
- `src/modules/dashboard/components/executive-dashboard-overview.tsx` da co pattern cho header, KPI Strip, Priority Queue, Risk Summary, finance no-permission, SourceList, MeetingSnapshot va drill-down panel. Common Center nen reuse pattern/thinking, khong duplicate raw data logic.
- `src/modules/dashboard/components/executive-priority-queue.tsx` hien co accessible buttons/read-only articles, amount render chi khi `financialAccess === "allowed"`, va label no-permission. Reuse neu fit.
- `src/modules/dashboard/components/executive-drilldown-panel.tsx` da co safe internal href validation, focus on open, Escape close va focus trap. Reuse de tranh tao panel moi kem an toan.
- Worktree hien dang dirty voi nhieu thay doi/untracked tu cac story truoc; dev khong duoc reset/checkout/revert thay doi khong lien quan.

### File Targets

Expected NEW:
- `src/modules/dashboard/services/executive-common-center-service.ts`
- `src/modules/dashboard/components/executive-common-center.tsx`
- `tests/unit/executive-common-center-service.test.ts`

Expected UPDATE:
- `src/modules/dashboard/types.ts`
- `src/modules/command-center/types.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

Possible UPDATE:
- `src/modules/executive/services/executive-service.ts` only if adding scope metadata/filtering for `commandCenterSnapshot.quickReports` is necessary.
- `src/modules/executive/types/index.ts` only if Common Center needs explicit scoped fields such as chairman decision marker or event type.
- `src/modules/dashboard/components/executive-priority-queue.tsx` only if a small reusable prop/label is needed; preserve Story 2.3 behavior.

Avoid unless truly needed:
- Khong tao route moi ngoai Command Center.
- Khong phuc hoi `/executive` thanh page doc lap.
- Khong goi Supabase/repository tu React component.
- Khong goi AI provider tu client.
- Khong them Redux/Zustand/global store.
- Khong implement approval actions, risk CRUD, decision creation, meeting creation.
- Khong hardcode role name, KPI so lieu, nguong tien hoac "quyet dinh Chu tich" neu data khong co marker.
- Khong upgrade dependencies.

### Data Contract Guardrails

- `ExecutiveCommonCenterData.scope` nen reuse `ExecutiveDashboardScope` hoac mirror field tu `ExecutiveDashboardData.scope`.
- `ExecutiveCommonCenterData.permissions` nen reuse `ExecutiveDashboardPermissions` neu du; them field moi chi khi service thuc su enforce duoc.
- `priorityItems` nen co `sourceType`, `sourceId`, `projectId?`, `href?`, `title`, `status`, `tone`, `owner?`, `deadline?`, `reason?`, `groupLabel`, `priorityLabel`, `score`.
- `notifications` nen gom `id`, `title`, `description`, `timeLabel?`, `tone`, `sourceType/sourceId?`, `href?`; khong build URL tu raw id trong component.
- `decisionHighlights` nen tach `new`, `chairman`, `directive` bang data marker neu co. Neu khong co marker chairman, render section generic `Quyet dinh moi` va de `chairmanDecisions` rong.
- `calendarItems` nen gom meetings va events trong scope; sort gan nhat/trong ngay truoc.
- `riskOverview` nen co counts `critical`, `high`, byCategory va top items; khong chi gui mau.
- `thresholdBreaches` nen co reason ro: `approval overdue`, `risk critical`, `follow-up overdue`, `project red`, `deadline overdue`.
- Finance fields trong Common Center va drill-down text phai tuan `financialAccess`; neu no-permission thi khong dua amount vao label, reason hoac JSON payload.

### Architecture Compliance

- Data flow expected: route/layout guard -> `getCommandCenterData` -> `getExecutiveCommonCenterData` -> client component render.
- Permission enforcement o server/service layer. UI no-permission la presentation sau khi DTO da sanitize, khong phai security boundary.
- Common Center service phai nhan scoped inputs hoac goi service/repository boundary; component khong import repositories.
- Module khong goi repository cua module khac truc tiep; neu can meetings/proposals/tasks, dung service contract/co san DTO.
- Domain/DTO fields dung camelCase; DB snake_case khong lo ra UI.
- Keep mock/file-backed va Supabase-ready parity: repository injection trong service neu co doc source moi.

### UX Guardrails

- Common Center phai quiet, dense, scan-friendly; khong lam hero/marketing section.
- H1/header nen la `Executive Common Center`, support copy ngan, khong doi brand/app shell.
- Priority area nam gan dau va gom risk/approval/deadline severe; nhung UI khong bien toan man hinh thanh alarm.
- Cac section nen compact: KPI chung, Priority area, Thong bao, Quyet dinh, Lich hop/su kien, Risk tong, Chien luoc, Deadline/vuot nguong.
- Badge status co text; risk/project health khong phu thuoc mau.
- Mobile dung stacked cards/list, khong table rong.
- Text tieng Viet phai wrap; khong scale font theo viewport width.
- Khong long card trong card; neu can repeated item card thi radius <= 8px va section layout gon.

### Previous Story Intelligence

- Story 2.1 da chot `/command-center?view=executive-dashboard` la canonical leadership route va `/executive*` la guard-first redirect. Story nay phai tiep tuc dung Command Center view, preserve `scopeId`.
- Story 2.2 da tao `ExecutiveDashboardData` va finance sanitizer. Common Center phai consume/summarize DTO nay, khong quay lai legacy amount/budget/cashflow de bypass sanitizer.
- Story 2.3 da tao dashboard UI, no-access state, drill-down permission gating, safe href validation, priority dedupe va e2e smoke. Common Center UI nen reuse these patterns and not regress dashboard.
- Story 2.4 dang `ready-for-dev`, khong phai `done`. Dev khong duoc gia dinh `ExecutiveMorningBriefingData` hay view `executive-morning-briefing` da ton tai; neu no ton tai trong worktree tai thoi diem dev, Common Center phai preserve view do.
- Story 1.5 da tao seed personas cho Chairman/Super Admin, CEO, Giam doc du an, Truong bo phan, Thu ky/Tro ly va Viewer. Tests nen dung persona/scope de chung minh Common Center khac nhau theo scope.

### Git / Recent Work Intelligence

- Current git log chi co `484589a 2205` va `a8162e3 first fcm`; nhieu implementation artifacts/code tu Story 1.x/2.x dang nam trong dirty worktree/untracked files.
- Dev phai doc file truoc khi sua va khong revert thay doi khong lien quan.
- `sprint-status.yaml` truoc khi tao story co `2-5-executive-common-center: backlog`; create-story update story nay thanh `ready-for-dev`.

### Testing Guidance

- Unit service tests nen pass `today: new Date("2026-05-24T00:00:00.000Z")` de overdue/today deterministic.
- Uu tien fixture DTO tu `getExecutiveDashboardData` va `getExecutiveLeadershipData` voi repository/service injection hon mock ESM phuc tap.
- Test selected scope invalid: `executiveCommonCenter` null, axis item khong hien, khong co legacy fallback data.
- Test no-permission finance bang `JSON.stringify(commonCenter)` khong chua amount/budget/cashflow hidden.
- Test priority dedupe: cung `sourceType/sourceId` xuat hien trong risk + deadline + approval thi chi hien mot item, chon item score/severity cao hon.
- Component tests nen dung Testing Library semantic queries (`getByRole`, accessible name) cho heading, regions, buttons, no-access/empty state va dialog.
- E2E smoke nen vao `/command-center?view=executive-common-center`, verify label `Executive Common Center`, `Priority area`, `Thong bao`, `Quyet dinh`, `Lich hop`, `Risk tong`, va mobile 390px khong co application error/overflow co ban.

### Latest Tech Notes

- Project baseline hien tai tu `package.json`: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Vitest `^3.1.3`, Testing Library React `^16.3.0`, Playwright `^1.52.0`. Story nay khong can dependency moi.
- Verified 2026-05-24: Next App Router docs van khuyen data/server work trong Server Components va pass serializable props to Client Components; keep data loading in server/service, pass DTO vao `"use client"` Common Center component. Source: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Verified 2026-05-24: Testing Library khuyen semantic/accessibility queries nhu `getByRole(..., { name })`; dung cho heading, region, button, dialog tests. Source: https://testing-library.com/docs/queries/byrole/
- Verified 2026-05-24: Playwright supports screenshot assertions via `expect(page).toHaveScreenshot()` if visual lock is needed; smoke tests can still assert content at desktop/mobile viewports. Source: https://playwright.dev/docs/test-snapshots
- Verified 2026-05-24: Vitest Browser Mode/component testing can use Playwright/WebdriverIO/preview, but repo hien dung jsdom + Testing Library; do not change test runner config for this story. Source: https://vitest.dev/guide/browser/component-testing

### References

- `_bmad-output/planning-artifacts/epics.md` - Epic 2, Story 2.5 requirements, AC, dependencies, files/modules and test expectations.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-016..FR-019, NFR-001, NFR-002, NFR-011 and overall acceptance AC-002.
- `_bmad-output/planning-artifacts/truc-1-mvp-final-bmad-ready.md` - Section 7.1 Executive Common Center, common executive data surface and permission-by-assignment principles.
- `_bmad-output/planning-artifacts/architecture.md` - App Router modular monolith, service/repository boundary, server/service permission enforcement, dashboard DTO and testing standards.
- `_bmad-output/planning-artifacts/ux-design-specification.md` - Common Center opportunity, priority queue, KPI Strip, risk map, drill-down, responsive/accessibility and empty/no-permission states.
- `_bmad-output/implementation-artifacts/2-1-permission-aware-shell-va-workspace-entry.md` - canonical Command Center route, selected scope handling and guard/no-fetch learnings.
- `_bmad-output/implementation-artifacts/2-2-executive-dashboard-service-dto-theo-scope.md` - `ExecutiveDashboardData`, finance sanitizer, scope filtering and Command Center integration.
- `_bmad-output/implementation-artifacts/2-3-dashboard-ui-voi-kpi-strip-priority-queue-va-risk-summary.md` - DTO-driven executive dashboard UI, drill-down/no-permission states and responsive/e2e learnings.
- `_bmad-output/implementation-artifacts/2-4-morning-briefing-theo-scope.md` - adjacent planned view; status is ready-for-dev, not proof of implemented code.
- `src/modules/dashboard/types.ts` - current `ExecutiveDashboardData` and source item shape.
- `src/modules/dashboard/services/executive-dashboard-service.ts` - existing scoped dashboard DTO builder and sanitizer.
- `src/modules/executive/services/executive-service.ts` - existing scoped executive leadership data and finance sanitizer.
- `src/modules/command-center/services/command-center-service.ts` - Command Center aggregate integration point.
- `src/modules/command-center/components/command-center-dashboard.tsx` - current view-switching and executive panel branch.
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`, `executive-priority-queue.tsx`, `executive-risk-summary.tsx`, `executive-drilldown-panel.tsx` - reusable UI patterns and guardrails.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/executive-common-center-service.test.ts tests/unit/command-center-service.test.ts tests/unit/command-center-dashboard.test.tsx` - red before implementation, then 19 tests passed after wiring.
- `npm run typecheck` - fixed `thresholdBreaches` subtype issue, then passed.
- `npm run lint` - passed.
- `npm run test` - 48 files, 276 tests passed.
- `npm run test:e2e` - 36 Playwright smoke tests passed.
- Code review patch verification: `npm run typecheck`, targeted unit tests, `npm run lint`, `npm run test` (48 files, 281 tests passed), and `npm run test:e2e` (36 tests passed).

### Completion Notes List

- Added scoped `ExecutiveCommonCenterData` and service composition from sanitized `ExecutiveDashboardData` plus scoped `ExecutiveLeadershipData`.
- Wired `executiveCommonCenter` through Command Center data, navigation children and `executive-common-center` render branch with no-access fallback.
- Built dense responsive Common Center UI with KPI, priority, notifications, decisions, calendar/events, risk, strategy and threshold breach sections.
- Preserved read-only drill-down behavior and finance no-permission presentation without rendering hidden amount/budget/cashflow fields.
- Code review patches applied: permission-gated Common Center sections, invalid selected scope fallback prevention, direct no-access rendering, system deadline rendering, accurate breach reasons and active sidebar child expansion.

### File List

- `_bmad-output/implementation-artifacts/2-5-executive-common-center.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-common-center-service.ts`
- `src/modules/dashboard/components/executive-common-center.tsx`
- `src/modules/command-center/types.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `tests/unit/executive-common-center-service.test.ts`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-24 | 1.0 | Created Story 2.5 implementation guide for scoped Executive Common Center. | Codex |
| 2026-05-24 | 1.1 | Implemented scoped Executive Common Center DTO, Command Center view, UI and tests. | Codex |
| 2026-05-24 | 1.2 | Applied code review fixes and marked story done. | Codex |
