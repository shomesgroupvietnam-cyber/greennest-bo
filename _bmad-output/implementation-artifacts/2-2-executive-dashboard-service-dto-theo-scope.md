# Story 2.2: Executive Dashboard Service DTO Theo Scope

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay tao service/DTO contract cho Dashboard Tong Quan Module 1 - Lanh dao theo role/scope/permission. Pham vi la data contract, aggregation, filtering va tests; khong build KPI Strip/Priority Queue/Risk Summary UI cua Story 2.3.

## Story

As a lanh dao,
I want dashboard lay du lieu tong hop da loc quyen tu service,
so that toi chi thay KPI, risk, approval va deadline thuoc pham vi cua minh.

## Tieu Chi Chap Nhan

1. **Executive dashboard DTO tong hop dung scope** (AC: 1)
   - Given service nhan `PermissionUser`, selected scope hien tai va role/scope assignment context
   - When tai `Dashboard Tong Quan` cua Module 1 - Lanh dao
   - Then DTO tra ve toi thieu: tong du an/co hoi trong scope, trang thai do/vang/xanh, KPI dieu hanh, request cho duyet/qua han, risk summary, deadline hom nay va quyet dinh moi.
   - And moi item co metadata du de Story 2.3 drill-down sau nay: `id`, `sourceType`, `sourceId`, `projectId` neu co, `href` neu da co route an toan, `tone/status`, owner/deadline/reason khi co.
   - And DTO khong dua task vi mo, ban ve ky thuat chi tiet hoac du lieu chuyen mon sau len mac dinh.

2. **Financial summary khong lo du lieu khi thieu quyen** (AC: 2)
   - Given user khong co `finance.view` hoac scoped grant tuong duong trong active scope
   - When DTO duoc tao
   - Then `financialSummary` tra state `no_permission` hoac bi loai bo co chu dich tai service
   - And UI khong nhan amount, amountLabel, budget, cashflow hoac count/tong hop tai chinh that tu service.
   - And cac list executive nhu approval/risk/leadership action phai sanitize field tai chinh nhay cam, khong chi an bang CSS/client.
   - And neu user dang xem `scopeId=all` nhung chi co `finance.view` tren mot vai project/scope, service chi duoc tra finance fields cho tung record co scoped grant hop le; cac record ngoai finance scope phai bi sanitize.

3. **Mock/file-backed va Supabase mode giu cung domain DTO** (AC: 3)
   - Given dashboard lay du lieu tu project, proposal/approval, risk, decision va meeting
   - When repository chay mock/file-backed hoac Supabase adapter san co
   - Then service contract tra cung kieu domain DTO camelCase va khong lo DB snake_case ra UI.
   - And neu module chua co Supabase adapter, story phai giu repository boundary ro va them contract tests cho adapter san co, khong viet logic UI phu thuoc mock data.

4. **Integration voi Command Center va shell hien co**
   - Given Story 2.1 da chot `/command-center?view=executive-dashboard` la entry canonical cho leadership
   - When `getCommandCenterData` hoac executive page loader can dashboard data
   - Then data lay tu executive dashboard DTO da loc scope, khong tu dashboard operation chung chua co approval/risk/decision/meeting contract.
   - And `operationsDashboard` hien co van duoc giu de khong pha Command Center/Axis 1 surfaces cho den khi UI migration co story rieng.

5. **Deny-by-default va no-fetch/no-render contract duoc bao toan**
   - Given user khong co Module 1/executive access
   - When truy cap route/view executive dashboard truc tiep
   - Then guard cua Story 2.1 van chan truoc protected service fetch.
   - And service rieng van phai filter theo permission/scope truoc khi tra UI trong truong hop duoc goi boi route hop le.

## Tasks / Subtasks

- [x] Chot DTO contract va ownership (AC: 1, 2, 3)
  - [x] Tao hoac mo rong type cho `ExecutiveDashboardData` trong `src/modules/dashboard/types.ts` hoac file type rieng duoc export ro.
  - [x] DTO toi thieu co: `generatedAt`, `scope`, `permissions`, `projectPortfolio`, `kpis`, `financialSummary`, `approvalSummary`, `riskSummary`, `todayDeadlines`, `recentDecisions`, `meetingSnapshot`, `sourceCounts`.
  - [x] Dinh nghia union cho financial summary: `allowed` vs `no_permission`; khong dung optional mo ho de UI doan quyen.
  - [x] Chot `sourceType` union toi thieu: `"project" | "proposal" | "leadership_approval" | "executive_action" | "meeting" | "decision" | "risk"`; chi them type moi khi co source service ro.
  - [x] Moi list item dung camelCase domain fields va co `sourceType`, `sourceId`, `projectId` neu co, `href` neu route an toan, `tone/status`, owner/deadline/reason phuc vu drill-down sau nay.

- [x] Implement executive dashboard aggregation service (AC: 1, 2, 3)
  - [x] Tao `getExecutiveDashboardData(user, options)` trong `src/modules/dashboard/services` hoac tach `executive-dashboard-service.ts` neu file hien co qua lon.
  - [x] `options` phai nhan `selectedScopeId`, `scopeAssignments`, `rolePermissionCatalog`, repository injection va `today?: Date` de test overdue/today deadlines deterministic.
  - [x] Reuse `resolveAccessScope`, `hasAnyScopedActionGrant`, `filterProjectsForScope`, `filterTasksForScope`, `filterMeetingsForScope`, `filterDecisionsForScope`.
  - [x] Them `canReadProposalInScope` / `filterProposalsForScope` va `listScopedProposals` neu service lay tu proposal repository. Pattern nen nam trong `src/lib/permissions/access-scope.ts` va `src/lib/permissions/scoped-resources.ts` de tai su dung, khong filter ad hoc trong UI.
  - [x] Khi lay proposals, khong goi `listProposals` neu no chi assert static `proposal.view` va lam fail scoped-only user; dung repository sau permission check hoac tao scoped-aware service method.
  - [x] Risk summary tam thoi co the derive tu `ExecutiveLeadershipActionItem`/mock executive data va configured risk groups cho den Epic 5 co risk repository rieng, nhung moi item phai dung `sourceType` phu hop trong union da chot.
  - [x] Deadline hom nay chi gom item dieu hanh: overdue/today approvals, leadership action items, decisions, meeting follow-ups lien quan. Khong dua toan bo task list vi mo len dashboard.

- [x] Enforce financial permission va sanitize sensitive fields (AC: 2)
  - [x] Dung `can(user, "finance.view")` cho full finance access va `canAccessScopedAction(user, "finance.view", target)` cho tung record/project khi active scope la scoped hoac `all`.
  - [x] Neu thieu quyen, tra `financialSummary: { state: "no_permission", reason: ... }` hoac state tuong duong.
  - [x] Xoa/sanitize `amount`, `amountLabel`, `cashFlowLabel`, `budgetRange`, `budgetLabel`, `allocatedBudget`, `committedBudget`, amountMin/amountMax va count/tong hop tai chinh trong approval/action item/project/strategic plan/escalation rule neu user thieu finance permission voi record do.
  - [x] Neu `getCommandCenterData` van expose `executiveWorkspace` cu song song voi DTO moi, phai sanitize finance fields trong `executiveWorkspace` hoac chi expose safe projection cho UI hien tai.
  - [x] Test user co proposal/risk access nhung thieu finance khong nhan so tien that.

- [x] Wire DTO vao Command Center/executive data path (AC: 4, 5)
  - [x] Cap nhat `src/modules/command-center/types.ts` de expose executive dashboard DTO o vi tri ro, vi du `executiveWorkspace.dashboard` hoac top-level `executiveDashboard`.
  - [x] Cap nhat `src/modules/command-center/services/command-center-service.ts` de load DTO voi same `selectedScopeId`, `scopeAssignments`, `rolePermissionCatalog` logic cua Story 2.1.
  - [x] Giu `operationsDashboard` va cac fields hien co de tranh regression cho view operations/Axis 1.
  - [x] Neu `getExecutiveLeadershipData` van duoc dung cho sections khac, khong thay no bang DTO moi mot cach lam mat `leadershipTeam`, `authorityMatrix`, `directives`, `meetings`, `approvals`, `decisionLog` hien co.

- [x] Bao toan repository/service boundary (AC: 3, 5)
  - [x] Component/page khong duoc query repository/Supabase truc tiep.
  - [x] DB row snake_case phai duoc map trong repository adapter; service/DTO chi tra camelCase.
  - [x] Khong them Redux/Zustand/global store cho story nay.
  - [x] Khong upgrade dependency hoac doi repository mode.

- [x] Cap nhat tests (AC: 1, 2, 3, 4, 5)
  - [x] Mo rong `tests/unit/dashboard-service.test.ts` cho executive DTO: project health, approval summary, risk summary, deadline today, recent decisions.
  - [x] Them test financial no-permission: user co scope view dashboard nhung thieu `finance.view` khong nhan amount/budget/cashflow.
  - [x] Them test finance scoped-mixed: user o `scopeId=all` co `finance.view` cho project A nhung khong co project B; DTO chi giu finance fields cho project A va sanitize project B.
  - [x] Them test scoped-only executive assignment van nhan DTO dung project va khong thay project khac.
  - [x] Them test proposal scoped helper: scoped-only `proposal.view` doc duoc proposal trong project duoc giao va khong doc proposal ngoai scope, khong phu thuoc static role permission.
  - [x] Them contract test cho repository injection/mock vs Supabase adapter san co neu module co adapter (meeting/decision hien co mock + Supabase).
  - [x] Cap nhat `tests/unit/command-center-service.test.ts` de verify `getCommandCenterData` expose executive dashboard DTO da scoped.
  - [x] Cap nhat `tests/unit/executive-service.test.ts` neu sanitize tai chinh hoac source data executive bi thay doi; deep assert `JSON.stringify(dto)` khong chua amount labels/so tien/budget/cashflow cua record hidden finance scope.

- [x] Kiem thu
  - [x] Chay `npm run typecheck`.
  - [x] Chay `npm run lint`.
  - [x] Chay `npm run test`.
  - [x] Chi chay `npm run test:e2e` neu route/default navigation hoac UI surface thay doi.
  - [x] Ghi ro lenh nao khong chay duoc trong Dev Agent Record.

### Review Findings

#### Chunk 1 - DTO service va permission helpers

- [x] [Review][Patch] `listScoped*` helpers can hide all resources for full-access roles without explicit scope assignments [src/lib/permissions/scoped-resources.ts:13]
- [x] [Review][Patch] Invalid `selectedScopeId` can fall back to global executive mock data for direct executive roles [src/modules/dashboard/services/executive-dashboard-service.ts:696]
- [x] [Review][Patch] `todayDeadlines` is built from the already capped approval queue and can miss due approvals beyond the top 10 [src/modules/dashboard/services/executive-dashboard-service.ts:808]
- [x] [Review][Patch] Scoped `decision.approve` grants make `canViewDecisions` true but scoped decision filtering still requires `meeting.view` [src/lib/permissions/access-scope.ts:566]
- [x] [Review][Patch] Draft proposals are counted as pending approvals because every non-final proposal status is treated as open [src/modules/dashboard/services/executive-dashboard-service.ts:383]

#### Chunk 2 - Command Center va executive integration

- [x] [Review][Patch] Invalid `selectedScopeId` still lets `executiveWorkspace` load global legacy executive data in Command Center [src/modules/command-center/services/command-center-service.ts:608]

#### Chunk 3 - Test coverage

- [x] [Review][Patch] AC 3 is marked complete but no test exercises Supabase meeting/decision adapter camelCase contract parity [tests/unit/meeting-service.test.ts:29]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 2 tao Workspace Dieu Hanh va Dashboard Module 1 cho lanh dao/delegated users. Story 2.2 la contract data cho Dashboard Tong Quan; Story 2.3 moi la UI KPI Strip/Priority Queue/Risk Summary.
- Dashboard Tong Quan phai phuc vu lanh dao xem nhanh: project health do/vang/xanh, KPI dieu hanh, approval, risk, deadline hom nay, decision moi va financial summary neu co quyen.
- Dashboard khong phai noi nhap lieu vi mo va khong phai dashboard chung cho moi vai tro. Moi so lieu phai den tu service DTO da loc scope.
- Module 2-5 chi duoc dung placeholder/mock khi can hien thi nguon du lieu trong Command Center; khong build nghiep vu chuyen sau cua cac module do trong story nay.

### Current Code State (Read Before Editing)

- `src/modules/dashboard/types.ts` hien chi co `DashboardData` cho operations dashboard: projects, tasks, documents, legal steps, summary/progress. Chua co approval/risk/decision/meeting/financial summary contract cho Module 1 leadership dashboard.
- `src/modules/dashboard/services/dashboard-service.ts` hien co `getDashboardData` load project/task/document/legal repositories, tinh progress va filter scope bang `resolveAccessScope`. Ham nay da co `permissions.canViewFinance` nhung chua tra `financialSummary` va chua sanitize finance trong list item vi chua co list item tai chinh.
- `src/modules/command-center/services/command-center-service.ts` hien dung `getDashboardData` cho `operationsDashboard` va dung `getExecutiveLeadershipData` cho `executiveWorkspace`. `buildKpis` dang dua tren operations summary, khong phai executive dashboard DTO cua Story 2.2.
- `src/modules/executive/services/executive-service.ts` hien filter executive mock data bang `resolveAccessibleScope` va `forExecutiveScope`. `buildMetrics` dang tra metric `"Dong tien tong"` voi value mock `"186 ty"` ma khong guard theo `finance.view`; dev phai sua hoac khong reuse raw metric nay cho user thieu finance permission.
- `src/modules/executive/types/index.ts` da co rich executive types: `ExecutiveAccessibleScope`, `ExecutiveDashboardMetric`, `ExecutiveLeadershipActionItem`, `LeadershipApproval`, `LeadershipMeeting`, `ExecutiveDecisionLogItem`. Co the map sang DTO moi thay vi invent type hoan toan khong lien quan.
- `src/modules/command-center/components/command-center-dashboard.tsx` va `src/modules/executive/components/executive-leadership-dashboard.tsx` hien co render finance fields tu executive data nhu `amountLabel`, `budgetLabel`, `cashFlowLabel`/budget plan. Story 2.2 la service/DTO story nen khong can UI migration, nhung service path cap data cho UI khong duoc de cac fields nay lot qua khi thieu quyen.
- `src/lib/permissions/access-scope.ts` da co filter cho projects, tasks, documents, legal steps, meetings va decisions. Chua co proposal/approval filter; neu DTO can proposal summary, them helper tuong duong o day.
- `src/lib/permissions/scoped-resources.ts` da co `listScopedProjects/Documents/Meetings/Decisions` nhung chua co proposal helper; neu them proposal summary nen them helper tai day de cac module sau tai su dung.
- `src/modules/proposals/services/proposal-service.ts` co `listProposals(filters, user)` nhung `assertProposalReadable` dua vao static `proposal.view`. Scoped-only users co the bi chan sai neu goi ham nay truc tiep. Dashboard service can permission-check va repository boundary dung cach.
- `src/modules/proposals/services/proposal-repository.ts` hien la JSON repository, chua co Supabase adapter trong file nay. Khong duoc viet test "Supabase parity" gia neu adapter chua ton tai.
- `src/modules/meetings/services/meeting-repository.ts` co `JsonMeetingRepository` va `SupabaseMeetingRepository`, map DB snake_case sang domain camelCase. Day la vi tri tot cho contract parity tests neu dashboard summary dung meetings/decisions.
- `src/modules/workspaces/services/workspace-service.ts` hien goi `getDashboardData` trong `getRoleWorkspaceData` va da truyen selected scope logic. Neu them executive DTO vao workspace data, phai giu guard/scope model cua Story 2.1.

### File Targets

Expected UPDATE:
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/dashboard-service.ts` hoac NEW `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/lib/permissions/access-scope.ts`
- `src/lib/permissions/scoped-resources.ts` neu them proposal scoped read helper
- `src/modules/command-center/types.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/executive/services/executive-service.ts` neu can sanitize/reuse executive source data
- `tests/unit/dashboard-service.test.ts`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/executive-service.test.ts` neu executive data shape/sanitize thay doi
- `tests/unit/access-scope.test.ts` hoac `tests/unit/proposal-service.test.ts` neu them proposal scoped helper

Possible UPDATE:
- `src/modules/workspaces/types.ts`
- `src/modules/workspaces/services/workspace-service.ts`
- `src/modules/proposals/services/proposal-service.ts` neu them scoped-aware read method thay vi repository direct
- `src/modules/proposals/types.ts` neu can source metadata type cho approval dashboard item
- `src/modules/meetings/types.ts` chi neu can expose existing fields, khong doi schema tuy tien
- `tests/unit/workspaces.test.ts` neu workspace DTO duoc mo rong

Avoid unless truly needed:
- Khong build `src/modules/dashboard/components/*` UI cua Story 2.3.
- Khong tao route/page moi cho dashboard.
- Khong thay `/command-center?view=executive-dashboard` bang route moi.
- Khong hardcode so KPI/risk/approval trong component.
- Khong them approval workflow rieng ngoai proposals backbone.
- Khong viet Supabase adapter moi cho proposals chi de pass story neu scope khong yeu cau.
- Khong upgrade Next/React/Supabase/Vitest dependencies.

### Data Contract Guardrails

- `scope` trong DTO nen gom `selectedScopeId`, `scopeLabel`, `organizationIds`, `projectIds`, `axisIds`, `moduleIds` neu co, va `operatingRole` neu derive duoc tu executive access.
- `permissions` nen gom `canViewProjects`, `canViewProposals`, `canViewMeetings`, `canViewDecisions`, `canViewRisk`, `canViewFinance`, `canDrillDown`; neu finance co scoped-only grant thi item-level finance decision phai dung target-specific helper, khong dua vao boolean global de expose so tien cho tat ca item.
- `sourceType` nen la union stable toi thieu: `"project" | "proposal" | "leadership_approval" | "executive_action" | "meeting" | "decision" | "risk"`.
- `projectPortfolio` nen tinh `total`, `active`, `red`, `yellow`, `green`, va optional `items` ngan gon. Neu project domain chua co health, co the derive tu executive project `health` hoac risk/document/legal signals va ghi ro trong code/test.
- `approvalSummary` nen tinh pending/overdue/high-risk tu proposals hoac `LeadershipApproval` hien co. Overdue dung `dueDate < today` va status chua final.
- `riskSummary` nen dem critical/high/byCategory va top items; khong phu thuoc mau duy nhat, item phai co label/severity.
- `todayDeadlines` nen gom due today/overdue cua approval, decision, meeting follow-up/action item dieu hanh. Neu lay tasks, chi lay task category/metadata phu hop executive context, khong show toan bo micro tasks.
- `recentDecisions` nen lay decision/action item moi nhat theo `decidedAt`, `createdAt` hoac `updatedAt` tuy source co san, va giu source metadata.
- `meetingSnapshot` nen dem upcoming/today/overdue follow-ups neu meeting service co du lieu; khong build full Meeting Center.
- `generatedAt` dung ISO string.

### Architecture Compliance

- Next.js App Router + TypeScript modular monolith. Page/layout chi compose, business logic nam trong service.
- Permission enforcement o server/service layer, deny-by-default. UI hiding khong phai security boundary.
- Data flow dung pattern: route/layout guard -> service -> repository -> DTO -> component.
- Service/repository boundary phai giu mock/file-backed va Supabase-ready parity. Repository map DB snake_case sang domain camelCase.
- Dashboard data phai derive tu structured records/service DTO, khong hardcode trong UI.
- Proposal/Approval la workflow backbone; khong tao approval flow rieng cho dashboard.
- AI khong lien quan story nay, tru khi source co AI summary label. Khong mutate AI output.

### UX Guardrails Cho DTO

- DTO phai giup Story 2.3 render enterprise dashboard dense but readable: KPI Strip, Priority Queue, Risk Summary/Map, deadline list va recent decisions.
- DTO phai co state cho loading/empty/no-permission/error o UI, nhung Story 2.2 chi can data shape va tests.
- Financial no-permission state phai ro de UI hien "khong co quyen" thay vi nhan so lieu roi an.
- Moi KPI/risk/approval can co drill-down metadata neu co source; neu khong co route an toan thi de `href` undefined va giu `sourceType/sourceId`.
- Text/labels tieng Viet co the duoc UI xu ly o Story 2.3; service nen uu tien ids/keys on dinh va label ngan neu can.

### Previous Story Intelligence

- Story 2.1 da tao PermissionAwareShell, scoped navigation, selected scope switching va canonical command-center route. Story 2.2 phai tai su dung `selectedScopeId`, `selectScopeAssignmentsForUser`, `requiresAssignmentScopeForRole`, `rolePermissionCatalog`, `scopeAssignments`.
- Story 2.1 da fix direct executive legacy routes thanh guard-first compatibility path. Khong goi executive dashboard data truoc route guard.
- Story 1.2 tao scope assignments va service filtering. Dashboard service phai tinh scoped grants, khong chi static role permissions.
- Story 1.5 tao seed personas/mock data cho Chairman/Super Admin, CEO, Giam doc du an, Truong bo phan, Thu ky/Tro ly va Viewer. Unit tests nen dung persona/scope nay de chung minh hai lanh dao khac scope nhin khac du lieu.

### Git / Recent Work Intelligence

- Recent git history chi co `484589a 2205` va `a8162e3 first fcm`; nhieu thay doi Story 1.x/2.1 dang nam trong dirty worktree/untracked artifacts. Dev khong duoc revert cac thay doi nay.
- Worktree hien co nhieu file modified/untracked trong app, modules, tests, database va `_bmad-output`. Khi implement story nay, chi sua file lien quan va khong reset/checkout.
- Tests da duoc Story 2.1 cap nhat quanh command-center, executive service, scoped navigation va shell. Neu test fail, doc failure truoc khi sua, dung revert.

### Testing Guidance

- Unit tests nen bat dau tu `tests/unit/dashboard-service.test.ts` vi da co temp JSON repositories va scope assignment helpers.
- Them fixture data nho cho proposals/meetings/decisions neu can. Neu dung repository temp file, inject repository vao service thay vi dung `.mock-data` global.
- Truyen `today: new Date("2026-05-24T00:00:00.000Z")` hoac date co dinh tu test vao executive dashboard service; khong test overdue/today dua tren clock that.
- Voi scoped-only user, test phai chung minh project B/proposal B/meeting B/decision B khong xuat hien trong DTO.
- Voi finance-denied user, assert deep: stringify DTO khong chua amount labels/so tien nhay cam cua hidden finance source.
- Voi finance mixed-scope user, assert project/approval trong finance-granted scope van co state/amount hop le, con project/approval ngoai finance scope co `no_permission`/sanitized field.
- Voi command-center, assert `executiveDashboard` duoc populate khi `view=executive-dashboard` compatible data duoc load, va empty/no-access state khi non-leadership user.
- Chay full `npm run test` sau khi focused tests xanh vi service DTO co the anh huong command-center/workspace tests.

### Latest Tech Notes

- Project hien dung Next `^15.3.2`, React `^19.0.0`, Supabase JS `^2.49.4`, Vitest `^3.1.3`, Testing Library va Playwright tu `package.json`. Story nay khong can dependency moi.
- Verified 2026-05-24: Next App Router guidance van phu hop voi pattern server-side mutation/refresh/revalidate, nhung story nay chu yeu la server-loaded DTO, khong can Server Action moi neu khong mutate data: https://nextjs.org/docs/app/getting-started/mutating-data
- Verified 2026-05-24: Supabase JS `select()` la API fetch data cap repository; neu them/doi Supabase query, map row trong repository adapter va khong tra snake_case len service DTO: https://supabase.com/docs/reference/javascript/select
- Verified 2026-05-24: Vitest `vi.mock` duoc hoist va module mocking co ESM pitfalls; voi service DTO, uu tien repository injection/fixture temp repositories hon mock same-file helper: https://vitest.dev/guide/mocking/modules.html

### References

- `_bmad-output/planning-artifacts/epics.md` - Epic 2, Story 2.2 requirements, AC, dependencies, files/modules and test expectations.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-001..FR-012, NFR-001, NFR-002, NFR-007, NFR-011, financial permission and acceptance data.
- `_bmad-output/planning-artifacts/architecture.md` - service/repository boundary, server/service permission enforcement, DTO camelCase, testing standards.
- `_bmad-output/planning-artifacts/ux-design-specification.md` - dashboard drill-down, KPI Strip, Priority Queue, Risk Map, no-permission and responsive states for later UI story.
- `_bmad-output/implementation-artifacts/2-1-permission-aware-shell-va-workspace-entry.md` - canonical route, selected scope handling, previous story guard/no-fetch learnings.
- `src/modules/dashboard/services/dashboard-service.ts` - existing operations dashboard service to preserve/extend carefully.
- `src/modules/executive/services/executive-service.ts` - existing executive source data, scope filtering and financial metric risk.
- `src/modules/command-center/services/command-center-service.ts` - command-center integration point for executive dashboard DTO.
- `src/lib/permissions/access-scope.ts` - existing scope filtering helpers and expected place for proposal filter extension.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- RED: `npm run test -- tests/unit/executive-dashboard-service.test.ts tests/unit/command-center-service.test.ts tests/unit/executive-service.test.ts tests/unit/access-scope.test.ts` failed as expected before implementation because executive dashboard service/helper/wiring/sanitizer were missing.
- GREEN focused: same focused test command passed after implementing DTO service, proposal scope helper, Command Center wiring, and finance sanitizer.
- `npm run typecheck` initially caught a literal `tone` type issue in meeting/deadline DTO mapping; fixed and reran successfully.
- Final validation passed: `npm run typecheck`, `npm run lint`, `npm run test`.
- `npm run test:e2e` not run because this story changed service/type/test contracts only and did not change route/default navigation or UI surface.

### Completion Notes List

- Added `ExecutiveDashboardData` domain DTO contract with explicit scope, permissions, source metadata, project portfolio, KPI, finance, approval, risk, deadline, decision, meeting, and source count sections.
- Implemented `getExecutiveDashboardData(user, options)` with selected scope, scope assignments, role permission catalog, repository injection, deterministic `today`, scoped proposal loading through repository boundary, and item-level finance permission decisions.
- Added proposal scope helpers in shared permission utilities and scoped resource helpers so proposal visibility is reusable outside the dashboard service.
- Wired `executiveDashboard` into Command Center while preserving `operationsDashboard` and the existing `executiveWorkspace` sections.
- Sanitized sensitive finance fields from executive service output when the user lacks full or target-scoped `finance.view`, including legacy `executiveWorkspace` data paths.
- Added unit coverage for DTO shape, financial no-permission, mixed scoped finance, scoped-only proposals, Command Center exposure, executive sanitizer, and proposal scope filtering.

### File List

- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/lib/permissions/access-scope.ts`
- `src/lib/permissions/scoped-resources.ts`
- `src/modules/command-center/types.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/executive/services/executive-service.ts`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/access-scope.test.ts`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/executive-service.test.ts`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-24 | 1.1 | Implemented executive dashboard scoped service DTO, finance sanitizer, Command Center integration, and unit coverage. | Codex |
| 2026-05-24 | 1.0 | Created Story 2.2 implementation guide and acceptance contract. | Codex |
