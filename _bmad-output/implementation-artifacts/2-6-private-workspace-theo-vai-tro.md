# Story 2.6: Private Workspace Theo Vai Tro

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay tao Private Workspace cho Module 1 - Lanh dao theo role/scope/assignment cua tung user. Pham vi la service DTO, command-center view, role workspace composition, assistant/delegation read/action guardrails, viewer read-only state va tests. Khong build Approval Center actions, Risk CRUD, Meeting Engine CRUD, Decision creation, full AI Center, hay thay the Dashboard Tong Quan/Common Center.

## Story

As a nguoi dung Module 1,  
I want Private Workspace phan anh assignment va scope cua rieng toi,  
so that Chu tich, CEO, Giam doc du an, Truong bo phan, Thu ky/Tro ly va Nguoi xem khong nhin cung mot dashboard.

## Tieu Chi Chap Nhan

1. **Private Workspace DTO dung user, role, assignment va selected scope**
   - Given cac demo users co role/scope assignment khac nhau
   - When tung user mo Private Workspace
   - Then service tra DTO gom du an/co hoi duoc giao, approval can xu ly, risk/blocker lien quan, deadline, quyet dinh gan day, cuoc hop va KPI trong pham vi cua user do
   - And DTO phai duoc filter server/service-side truoc khi den UI, khong render du lieu roi moi an
   - And hai user lanh dao co assignment/scope khac nhau phai nhan DTO khac nhau; khong fallback ve global mock data khi scope khong hop le.

2. **Workspace composition khac nhau theo operating role nhung dung chung pattern**
   - Given user la Chairman/Super Admin, CEO, Giam doc du an, Truong bo phan, Thu ky/Tro ly hoac Viewer
   - When Private Workspace render
   - Then UI hien workspace variant phu hop: executive command, operations control, project war room, department workflow, secretary briefing desk hoac read-only viewer
   - And implementation dung chung service/component patterns va role variant config, khong tao moi role thanh mot page hardcode rieng
   - And cac section co label, owner, status, reason, deadline va drill-down metadata neu co route an toan.

3. **Thu ky/Tro ly chi thay du lieu va action trong delegation/scope duoc uy quyen**
   - Given Thu ky/Tro ly co active delegation mot phan cho mot lanh dao
   - When mo Private Workspace
   - Then workspace chi hien lich lanh dao, ho so trinh, tai lieu hop, task ho tro, reminder va approval pending trong scope duoc uy quyen
   - And cac action on-behalf chi enabled khi `LeadershipDelegation` active, dung action key va match scope
   - And MVP khong hien approve/reject/request-change thay lanh dao; direct server action van bi service chan.

4. **Viewer va user thieu quyen la read-only/no-permission ro rang**
   - Given user la Viewer hoac thieu permission mutation
   - When mo Private Workspace
   - Then action mutation bi an hoac disabled theo UX permission pattern voi ly do ngan gon
   - And direct mutation qua server action/service van bi chan
   - And finance-sensitive fields, amount/cashflow/budget khong xuat hien trong DTO/DOM neu user thieu `finance.view` hoac scoped grant tuong duong.

5. **Private Workspace la view rieng trong Command Center**
   - Given user co quyen vao Module 1 - Lanh dao
   - When chon `Private Workspace`
   - Then URL/view dung `/command-center?view=executive-private-workspace` va preserve `scopeId`
   - And `/command-center?view=executive-dashboard` van la Dashboard Tong Quan
   - And neu Story 2.4/2.5 da hoac dang them `executive-morning-briefing` va `executive-common-center`, cac view do van doc lap va khong bi Private Workspace override.

6. **UI dense, responsive, accessible va co empty/error/no-permission states**
   - Given DTO co du lieu hop le
   - When Private Workspace render
   - Then UI co cac section scan-friendly: KPI theo role, priority queue ca nhan, du an/co hoi duoc giao, approval/risk/deadline, quyet dinh, meeting, assistant support hoac read-only summary
   - And risk/project health badge co text label, khong chi dua vao mau
   - And mobile duoi 768px dung stacked compact list, khong table rong, text tieng Viet khong tran/cat xau, touch target chinh gan 44px.

7. **Regression boundaries duoc bao toan**
   - Given Story 2.1/2.2/2.3 da done va Story 2.4/2.5 co the chua implement
   - When story nay hoan thanh
   - Then shell scope selector, canonical Command Center route, `ExecutiveDashboardData`, dashboard UI, drill-down panel, generic role workspace routes, assistant-workspace foundation, delegation service va proposal on-behalf guard van hoat dong
   - And story nay khong implement approval approve/reject, risk CRUD, decision creation, meeting creation, full Executive AI Center hoac AI action proposal mutation.

## Tasks / Subtasks

- [x] Chot DTO va service ownership cho Private Workspace (AC: 1, 2, 3, 4)
  - [x] Them types trong `src/modules/workspaces/types.ts`: `ExecutivePrivateWorkspaceData`, `ExecutivePrivateWorkspaceVariant`, `PrivateWorkspacePermissions`, `PrivateWorkspaceSectionItem`, `PrivateWorkspaceAction`, `AssistantDelegationWorkspaceSummary`.
  - [x] Tao `src/modules/workspaces/services/executive-private-workspace-service.ts`.
  - [x] Service nen expose `getExecutivePrivateWorkspaceData(user, options)` voi `selectedScopeId`, `scopeAssignments`, `rolePermissionCatalog`, `delegations`, `repositories`, `today`, `requireScopeAssignments`.
  - [x] DTO toi thieu gom `generatedAt`, `scope`, `variant`, `permissions`, `kpis`, `priorityItems`, `assignedProjects`, `approvalItems`, `riskItems`, `deadlineItems`, `decisionItems`, `meetingItems`, `assistantSupport`, `sourceCounts`, `emptyState`.
  - [x] `variant` nen derive tu executive operating role/effective assignment role: `chairman`, `ceo`, `project_director`, `department_head`, `secretary_assistant`, `viewer`.
  - [x] `permissions` phai expose `canViewProjects`, `canViewProposals`, `canViewMeetings`, `canViewDecisions`, `canViewRisk`, `canViewFinance`, `canCreateProposal`, `canCreateMeeting`, `canDrillDown`, `mutationMode`.

- [x] Compose data tu service DTO san co, khong doc raw mock data trong UI (AC: 1, 2, 4, 7)
  - [x] Reuse `getExecutiveDashboardData` cho portfolio, approval, risk, deadline, decision, meeting snapshot va finance sanitizer.
  - [x] Reuse `getExecutiveLeadershipData` cho scope label, accessible scope, schedule, notifications, directives, decision log, meetings va leadership action items da scope.
  - [x] Reuse `getRoleWorkspaceData` hoac helpers trong `workspace-service.ts` cho task/document/legal support neu can, nhung khong dua operations micro task len workspace lanh dao mac dinh.
  - [x] Khong goi repository tu React component. Moi source vao UI phai qua service DTO camelCase.
  - [x] Neu selected scope invalid, tra DTO `null` hoac `emptyState.kind = "invalid_scope"` va khong fallback global.
  - [x] Finance fields phai tuan `ExecutiveDashboardData.financialSummary` va item-level `financialAccess`; khong doc amount/budget tu legacy `executiveWorkspace` de bypass sanitizer.

- [x] Build role workspace composition va priority mapping (AC: 1, 2, 6)
  - [x] Tao role variant config trong workspaces module, vi du `src/modules/workspaces/private-workspace-variants.ts`.
  - [x] Chairman/Super Admin variant uu tien portfolio KPI, high/critical risk, overdue approval, strategic decisions, finance summary neu co quyen va audit/BO links neu duoc cap.
  - [x] CEO variant uu tien operation KPI, approval queue, escalation, meeting/follow-up va cross-project deadlines trong scope.
  - [x] Project Director variant uu tien assigned projects, project health, approval can xu ly, risk/blocker, project deadlines, meetings va decisions lien quan project.
  - [x] Department Head variant uu tien workstream/module scope, ho so/task chuyen mon, approval chuyen mon, risk chuyen mon va department meetings.
  - [x] Secretary/Assistant variant uu tien schedule, submission dossiers, meeting documents, support tasks, reminders, pending approvals in delegated scope va on-behalf create actions duoc phep.
  - [x] Viewer variant chi hien read-only summary va source links allowed; mutation actions hidden/disabled.
  - [x] Priority sort: critical/high risk, overdue severe approval, deadline overdue/today, assigned decision follow-up, meeting follow-up overdue, sau do informational.
  - [x] Dedupe item bang `sourceType:sourceId`, giu item co severity/priority cao hon.

- [x] Xu ly Thu ky/Tro ly va delegation dung contract Story 1.4 (AC: 3, 4, 7)
  - [x] Load active delegations bang `listActiveDelegationsForDelegate(user.id)` hoac options injection trong service.
  - [x] Map delegation summary vao DTO voi `principalUserId`, `delegationId`, `actionKeys`, scope snapshot, validity window va `canActOnBehalf`.
  - [x] Neu dung delegation de hien record support, chi hien record trong delegation scope va label ro `thay lanh dao/principal`; khong bien delegation thanh global role permission.
  - [x] Reuse `resolveDelegatedAction`/`assertDelegatedActionAllowed` semantics cho action enablement. UI chi la presentation; service/action la authority.
  - [x] Khong add `proposal.approve`, `proposal.reject`, `proposal.request_change`, `decision.approve`, `settings.manage`, `audit.view`, export/admin actions vao delegation-capability UI.
  - [x] Add no-permission reason neu assistant co delegation expired/inactive/out-of-scope.

- [x] Wire Private Workspace vao Command Center (AC: 5, 7)
  - [x] Cap nhat `src/modules/command-center/types.ts` de expose `executivePrivateWorkspace: ExecutivePrivateWorkspaceData | null`.
  - [x] Cap nhat `src/modules/command-center/services/command-center-service.ts` de load private workspace khi `canViewExecutive` hop le, dung cung `selectedScopeId`, `effectiveScopeAssignments`, `rolePermissionCatalog`, `requireScopeAssignments`.
  - [x] Them menu item trong `buildAxes` cho `Private Workspace` voi `viewKey: "executive-private-workspace"` va href `/command-center?view=executive-private-workspace`.
  - [x] Preserve `executive-dashboard`; neu Story 2.4/2.5 branch da ton tai trong worktree, khong ghi de `executive-morning-briefing` hoac `executive-common-center`.
  - [x] `handleViewSelect` phai preserve `scopeId` nhu Story 2.1.
  - [x] Invalid/unauthorized selected scope phai tra private workspace null/empty state, khong dung legacy global/mock data.

- [x] Build UI component Private Workspace (AC: 2, 3, 4, 5, 6)
  - [x] Tao `src/modules/workspaces/components/executive-private-workspace.tsx`.
  - [x] `CommandCenterExecutivePanel` render component nay khi `activeView === "executive-private-workspace"`.
  - [x] Header hien `Private Workspace`, variant label, role/scope label, generatedAt va no-permission/invalid-scope state neu DTO null.
  - [x] Content dung section compact theo variant: KPI, priority queue, assigned projects, approvals, risks, deadlines, decisions, meetings, assistant support/read-only summary.
  - [x] Reuse `ExecutiveDrilldownPanel` hoac source item pattern tu Story 2.3 cho source metadata. Khong tu tao unsafe URL tu raw id.
  - [x] Reuse accessible button/read-only article pattern tu `ExecutivePriorityQueue`; neu tao component moi, giu accessible names cho item actions.
  - [x] Finance no-permission render message ngan; amount/cashflow/budget khong render.

- [x] Empty, no-permission, responsive va accessibility states (AC: 4, 6)
  - [x] Empty state phan biet `khong co du lieu trong scope`, `khong co quyen`, `delegation khong hop le`, `selected scope khong hop le`.
  - [x] Badge risk/project health/status co text (`Do`, `Vang`, `Xanh`, `Critical`, `High`, `Qua han`, `Read-only`) va khong chi mau.
  - [x] Mobile <768px: stacked list, khong wide table, text wrap tot, buttons/list items co accessible name.
  - [x] Neu dung dialog/sheet drill-down, giu focus/Escape behavior da co trong `ExecutiveDrilldownPanel`.
  - [x] Action disabled phai co visible reason hoac tooltip accessible; khong hien action neu no se lam lo workflow ngoai quyen.

- [x] Tests va nghiem thu (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] Them `tests/unit/executive-private-workspace-service.test.ts` cho DTO per role/scope, selected scope, invalid scope, priority sort/dedupe, finance sanitizer va source metadata.
  - [x] Test 2 demo users khac assignment nhan projects/approval/risk/deadline khac nhau; khong assert bang snapshot lon.
  - [x] Test assistant active delegation chi hien/on-behalf actions trong scope; expired/out-of-scope delegation khong enable action.
  - [x] Test viewer/read-only khong co mutation actions va `JSON.stringify(dto)` khong chua amount/cashflow/budget hidden.
  - [x] Cap nhat `tests/unit/command-center-service.test.ts` de verify `executivePrivateWorkspace` duoc load/null dung voi executive access va invalid scope.
  - [x] Cap nhat `tests/unit/command-center-dashboard.test.tsx` cho view `executive-private-workspace`: heading, role variant, priority area, assigned projects, assistant support, read-only/no-permission state va khong leak operations micro tasks.
  - [x] Cap nhat `tests/unit/workspaces.test.ts` neu `RoleWorkspaceData`/delegation summary contract thay doi.
  - [x] Cap nhat `tests/e2e/mvp-smoke.spec.ts` cho `/command-center?view=executive-private-workspace` desktop va mobile 390px.
  - [x] Chay `npm run typecheck`, `npm run lint`, `npm run test`; chay `npm run test:e2e` vi story them UI/view route.

### Review Findings

- [x] [Review][Patch] Command Center dang render long hai app shell/sidebar/header [src/app/command-center/page.tsx:46]
- [x] [Review][Patch] Delegation match trong selected scope dung assignment dimension lam expected nen delegation project-level bi reject khi assignment co axis/module bo sung [src/modules/workspaces/services/executive-private-workspace-service.ts:181]
- [x] [Review][Patch] Secretary Briefing Desk chua render cac nhom schedule, ho so trinh, tai lieu hop, reminders, pending approvals rieng [src/modules/workspaces/components/executive-private-workspace.tsx:378]
- [x] [Review][Patch] Cac role variants dung cung composition section co dinh, khac label la chinh [src/modules/workspaces/components/executive-private-workspace.tsx:298]
- [x] [Review][Patch] Private Workspace DTO load duoc cho viewer/thu_ky_tro_ly nhung menu chi hien khi canViewExecutive [src/modules/command-center/services/command-center-service.ts:65]
- [x] [Review][Patch] Delegations truyen qua options khong duoc re-bind theo current user delegateUserId [src/modules/workspaces/services/executive-private-workspace-service.ts:770]
- [x] [Review][Patch] Missing permission catalog item van cho delegated create action enabled [src/modules/workspaces/services/executive-private-workspace-service.ts:462]
- [x] [Review][Patch] Invalid selected scope van co the serialize mutationMode/canCreate action la allowed [src/modules/workspaces/services/executive-private-workspace-service.ts:803]
- [x] [Review][Patch] Assistant delegation summary serialize raw actionKeys nen co the leak action bi deny nhu approve/reject [src/modules/workspaces/services/executive-private-workspace-service.ts:568]
- [x] [Review][Patch] Non-secretary variants co the hien delegated action cards qua emptyAssistantSupport(delegatedActions) [src/modules/workspaces/services/executive-private-workspace-service.ts:929]
- [x] [Review][Patch] Delegation expired/inactive/out-of-scope bi loc mat nen DTO khong co disabled reason/no-permission reason [src/modules/workspaces/services/executive-private-workspace-service.ts:773]
- [x] [Review][Patch] Unknown executive-* query duoc chap nhan va co the render blank executive panel [src/modules/command-center/components/command-center-dashboard.tsx:656]
- [x] [Review][Patch] Priority scoring append T00:00:00Z vao deadline nen ISO datetime bi parse invalid [src/modules/workspaces/services/executive-private-workspace-service.ts:360]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 2 can bon surface rieng trong Module 1: Dashboard Tong Quan, Morning Briefing, Common Center va Private Workspace.
- Private Workspace khac Dashboard Tong Quan: Dashboard la tong quan Module 1; Private Workspace la workspace ca nhan theo assignment/scope/action cua user hien tai.
- Private Workspace khac Common Center: Common Center la thong tin chung da loc quyen; Private Workspace la viec cua toi/duoc giao/duoc uy quyen.
- Yeu cau cot loi: khong gia dinh hai lanh dao nhin giong nhau neu assignment/scope khac nhau.
- Thu ky/Tro ly chi thay du lieu/action duoc lanh dao uy quyen va MVP khong cho approve thay.

### Current Code State (Read Before Editing)

- `src/modules/workspaces/services/workspace-service.ts` da co `getRoleWorkspaceData`, `applyWorkspaceScope`, `buildDelegationSummary`, active scope assignments, role permission catalog va active delegation loading. Hien no build generic workspace KPI/action queue tu projects/tasks/documents/legal/meetings/decisions; Story 2.6 can tao richer executive private DTO thay vi dua generic shell len Module 1.
- `src/modules/workspaces/components/role-workspace-shell.tsx` la generic workspace UI. No dung duoc lam reference cho guard/data scope summary, nhung chua du cho role-specific Private Workspace.
- `src/modules/workspaces/config.ts` da co `/assistant-workspace`, `/viewer`, `/project-workbench`; day la generic workspace routes. Private Workspace cua Module 1 nen la Command Center executive view de giu canonical route.
- `src/modules/dashboard/types.ts` da co `ExecutiveDashboardData`, `ExecutiveDashboardSourceItem`, permissions, portfolio, approval/risk/deadline/decision/meeting DTO. Day la source tot nhat de reuse cho private workspace source metadata.
- `src/modules/dashboard/services/executive-dashboard-service.ts` da scope/filter/sanitize finance va handle selected scope. Private Workspace khong nen lap lai raw aggregation neu co the compose DTO nay.
- `src/modules/executive/services/executive-service.ts` da co `getExecutiveLeadershipData`, `resolveAccessibleScope`, `forExecutiveScope`, `scopeCommandCenterSnapshot`, `sanitizeExecutiveFinance`. Can chu y `commandCenterSnapshot.quickReports` da tung la risk vi scope filtering khong day du; khong dung lam source chinh neu chua co scope metadata.
- `src/modules/command-center/services/command-center-service.ts` dang load `operationsDashboard`, `executiveData`, `executiveDashboard` trong `Promise.all`; Story 2.6 nen them `executivePrivateWorkspace` vao cung data path va pass DTO da load neu co de tranh duplicate fetch.
- `src/modules/command-center/types.ts` hien expose `executiveDashboard` va `executiveWorkspace`, chua co `executivePrivateWorkspace`.
- `src/modules/command-center/components/command-center-dashboard.tsx` chi branch DTO moi cho `executive-dashboard`; cac `executive-*` view khac van render legacy executive sections. Them `executive-private-workspace` branch truoc legacy sections.
- `src/modules/settings/services/leadership-delegation-service.ts` da co active delegation, scope match, action deny-list va `assertDelegatedActionAllowed`. Reuse contract nay; khong tu viet delegation grant logic moi trong component.
- `src/modules/proposals/services/proposal-service.ts` da support on-behalf create/submit va block delegated approve/reject/request-change. Private Workspace action buttons phai align voi service nay.
- `tests/unit/workspaces.test.ts` da cover role mapping, scoped navigation, workspace route access, scope filtering va delegation summary. Add tests here only if generic workspace contract changes; do not break existing generic routes.
- Worktree co nhieu thay doi/story artifacts tu cac story truoc. Dev phai doc file truoc khi sua va khong revert thay doi khong lien quan.

### File Targets

Expected NEW:
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `src/modules/workspaces/components/executive-private-workspace.tsx`
- `tests/unit/executive-private-workspace-service.test.ts`

Expected UPDATE:
- `src/modules/workspaces/types.ts`
- `src/modules/command-center/types.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

Possible UPDATE:
- `src/modules/workspaces/services/workspace-service.ts` if sharing helper extraction with the new private service.
- `src/modules/workspaces/components/role-workspace-shell.tsx` only if generic workspace display needs delegation summary cleanup.
- `src/modules/dashboard/components/executive-priority-queue.tsx` only if a reusable private-workspace label/prop is needed; preserve Story 2.3 behavior.
- `src/modules/executive/services/executive-service.ts` only if adding scope metadata/filtering is necessary for source DTO safety.

Avoid unless truly needed:
- Khong tao route moi ngoai Command Center cho Module 1 Private Workspace.
- Khong phuc hoi `/executive` thanh page doc lap.
- Khong goi Supabase/repository tu React component.
- Khong them Redux/Zustand/global store.
- Khong implement approval approve/reject, risk CRUD, decision creation, meeting creation, full AI Center.
- Khong hardcode role name de cap data; role name chi dung de map variant label/config sau khi permission/scope da duoc service resolve.
- Khong upgrade dependencies.

### Data Contract Guardrails

- `ExecutivePrivateWorkspaceData.scope` nen reuse/mirror `ExecutiveDashboardScope`.
- `ExecutivePrivateWorkspaceData.variant` nen la stable key, khong la UI-only title: `chairman | ceo | project_director | department_head | secretary_assistant | viewer`.
- Moi `PrivateWorkspaceSectionItem` nen co `id`, `sourceType`, `sourceId`, `projectId?`, `href?`, `title`, `status`, `tone`, `owner?`, `deadline?`, `reason?`, `groupLabel`, `priorityLabel?`, `readOnlyReason?`.
- `assistantSupport` nen gom `delegations`, `scheduleItems`, `submissionDossiers`, `meetingDocuments`, `supportTasks`, `reminders`, `pendingApprovals`, `allowedActions`.
- `allowedActions` khong duoc bao gom approval/admin/export-sensitive actions. On-behalf actions phai co `delegationId`, `principalUserId`, `actionKey`, scope snapshot.
- `mutationMode` nen la `allowed`, `read_only`, `delegated_only` hoac `none` de UI khong phai doan quyen.
- Finance-sensitive fields khong duoc co trong serialized DTO neu user/record thieu finance permission.

### Architecture Compliance

- Expected data flow: route guard -> `getCommandCenterData` -> `getExecutivePrivateWorkspaceData` -> client component render.
- Permission enforcement o server/service layer. UI no-permission/read-only chi la presentation sau khi DTO da sanitize.
- Common service/repository boundary phai giu mock/file-backed va Supabase-ready parity.
- Module khong goi repository cua module khac truc tiep tu component; neu can meetings/proposals/tasks, dung service contract hoac existing DTO da scoped.
- Domain/DTO fields dung camelCase; DB snake_case khong lo ra UI.
- Proposal/Approval backbone van la source cho pending approval/on-behalf proposals; khong tao approval flow rieng.

### UX Guardrails

- Private Workspace phai quiet, dense, scan-friendly; khong lam hero/marketing section.
- Header nen la `Private Workspace`, co variant/scope/generatedAt. Khong doi brand/app shell.
- Moi variant dung chung layout pattern: workspace header, KPI strip, priority queue, assigned source sections, detail/drill-down affordance.
- Secretary/Assistant Workspace phai doc nhu "Secretary Briefing Desk": lich lanh dao, ho so trinh, tai lieu hop, reminders, support tasks va pending approvals in delegated scope.
- Viewer/read-only Workspace phai ro rang, khong day user vao action khong the thuc hien.
- Badge status co text; risk/project health khong phu thuoc mau.
- Mobile dung stacked compact list, khong table rong.
- Text tieng Viet phai wrap; khong scale font theo viewport width.
- Khong long card trong card; repeated item cards neu dung thi radius <= 8px va section layout gon.

### Previous Story Intelligence

- Story 2.1 da chot `/command-center?view=executive-dashboard` la canonical leadership route va `/executive*` la guard-first redirect. Story nay phai dung Command Center view va preserve `scopeId`.
- Story 2.2 da tao `ExecutiveDashboardData`, selected-scope handling, finance sanitizer va Command Center integration. Private Workspace phai reuse/summarize DTO nay, khong quay lai legacy finance fields de bypass sanitizer.
- Story 2.3 da tao dashboard UI, drill-down permission gating, safe href validation, priority dedupe, no-permission empty states va e2e smoke. Private Workspace UI nen reuse these patterns and not regress dashboard.
- Story 1.4 da tao delegation foundation, on-behalf proposal create/submit va block approve/reject/request-change thay. Story nay chi consume foundation nay cho assistant workspace.
- Story 1.5 da tao seed personas cho Chairman/Super Admin, CEO, Giam doc du an, Truong bo phan, Thu ky/Tro ly va Viewer. Tests nen dung persona/scope de chung minh workspace khac nhau theo role/scope.
- Story 2.4 va Story 2.5 hien `ready-for-dev`, khong phai `done` trong sprint status. Dev khong duoc gia dinh Morning Briefing/Common Center da ton tai; neu code da co trong worktree tai thoi diem implement, preserve view do.

### Git / Recent Work Intelligence

- Current git log chi co `484589a 2205` va `a8162e3 first fcm`; nhieu implementation artifacts/code tu Story 1.x/2.x dang nam trong dirty worktree/untracked files.
- Dev phai doc file truoc khi sua va khong reset/checkout/revert thay doi khong lien quan.
- `sprint-status.yaml` truoc khi tao story co `2-6-private-workspace-theo-vai-tro: backlog`; create-story update story nay thanh `ready-for-dev`.

### Testing Guidance

- Unit service tests nen pass `today: new Date("2026-05-24T00:00:00.000Z")` de deadline deterministic.
- Uu tien repository/service injection va existing fixture persona hon mock ESM phuc tap.
- Test selected scope invalid: `executivePrivateWorkspace` null hoac invalid-scope empty state; khong co legacy fallback data.
- Test two roles/scopes: CEO va Project Director hoac Department Head phai co `assignedProjects`/priority source khac nhau.
- Test assistant: active delegation enables only allowed on-behalf action; expired/out-of-scope delegation disables action va does not leak records.
- Test viewer/read-only: no mutation buttons, direct service/action block covered by existing proposal tests, DOM khong render sensitive finance amount.
- Component tests nen dung Testing Library semantic queries (`getByRole`, accessible name) cho heading, regions, buttons, no-access/empty state va dialog.
- E2E smoke nen vao `/command-center?view=executive-private-workspace`, verify label `Private Workspace`, variant label, `Priority`, `Du an duoc giao` hoac `Assistant`, va mobile 390px khong co application error/overflow co ban.

### Latest Tech Notes

- Project baseline tu `package.json`: Next `^15.3.2`, React `^19.0.0`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Vitest `^3.1.3`, Testing Library React `^16.3.0`, Playwright `^1.52.0`. Story nay khong can dependency moi.
- Verified 2026-05-24: Next App Router docs van yeu cau props pass tu Server Component sang Client Component phai serializable; keep data loading in server/service, pass DTO vao `"use client"` component. Source: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Verified 2026-05-24: Testing Library khuyen semantic/accessibility queries nhu `getByRole(..., { name })`; dung cho heading, region, button, dialog tests. Source: https://testing-library.com/docs/queries/byrole/
- Verified 2026-05-24: Playwright supports screenshot assertions via `expect(page).toHaveScreenshot()` if visual lock is needed; smoke tests can still assert content at desktop/mobile viewports. Source: https://playwright.dev/docs/test-snapshots
- Verified 2026-05-24: Vitest Browser Mode/component testing can use Playwright/WebdriverIO/preview, but repo hien dung jsdom + Testing Library; do not change test runner config for this story. Source: https://vitest.dev/guide/browser/component-testing

### References

- `_bmad-output/planning-artifacts/epics.md` - Epic 2, Story 2.6 requirements, AC, dependencies, files/modules and test expectations.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-020..FR-024, FR-097..FR-101, NFR-001, NFR-002, NFR-007 and acceptance AC-003/AC-014.
- `_bmad-output/planning-artifacts/truc-1-mvp-final-bmad-ready.md` - Section 7.2 Executive Private Workspace and assignment-based leadership permissions.
- `_bmad-output/planning-artifacts/architecture.md` - role-first workspace composition, App Router modular monolith, service/repository boundary, server/service permission enforcement, testing standards.
- `_bmad-output/planning-artifacts/ux-design-specification.md` - role workspace patterns, Secretary Briefing Desk, priority queue, drill-down, responsive/accessibility and empty/no-permission states.
- `_bmad-output/implementation-artifacts/1-4-delegation-cho-thu-ky-tro-ly-theo-lanh-dao.md` - delegation semantics, assistant metadata foundation and no approve-on-behalf rule.
- `_bmad-output/implementation-artifacts/1-5-seed-data-dieu-hanh-cho-nghiem-thu-module-1.md` - seed personas, scope differences, assistant delegation and viewer negative scenarios.
- `_bmad-output/implementation-artifacts/2-1-permission-aware-shell-va-workspace-entry.md` - canonical Command Center route, selected scope handling and guard/no-fetch learnings.
- `_bmad-output/implementation-artifacts/2-2-executive-dashboard-service-dto-theo-scope.md` - `ExecutiveDashboardData`, finance sanitizer, scope filtering and Command Center integration.
- `_bmad-output/implementation-artifacts/2-3-dashboard-ui-voi-kpi-strip-priority-queue-va-risk-summary.md` - DTO-driven dashboard UI, drill-down/no-permission states and responsive/e2e learnings.
- `_bmad-output/implementation-artifacts/2-4-morning-briefing-theo-scope.md` - adjacent planned view; status is ready-for-dev, not proof of implemented code.
- `_bmad-output/implementation-artifacts/2-5-executive-common-center.md` - adjacent planned view; status is ready-for-dev, not proof of implemented code.
- `src/modules/workspaces/services/workspace-service.ts` - current generic workspace service and delegation summary foundation.
- `src/modules/workspaces/types.ts` - current workspace DTO types to extend.
- `src/modules/dashboard/types.ts` - current `ExecutiveDashboardData` and source item shape.
- `src/modules/dashboard/services/executive-dashboard-service.ts` - existing scoped dashboard DTO builder and sanitizer.
- `src/modules/executive/services/executive-service.ts` - existing scoped executive leadership data and finance sanitizer.
- `src/modules/settings/services/leadership-delegation-service.ts` - active delegation and on-behalf action contract.
- `src/modules/command-center/services/command-center-service.ts` - Command Center aggregate integration point.
- `src/modules/command-center/components/command-center-dashboard.tsx` - current view-switching and executive panel branch.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Red phase: `npm run test -- tests/unit/executive-private-workspace-service.test.ts` failed before `executive-private-workspace-service` existed.
- Focused unit: `npm run test -- tests/unit/executive-private-workspace-service.test.ts tests/unit/command-center-service.test.ts tests/unit/command-center-dashboard.test.tsx` passed.
- Type/lint: `npm run typecheck` passed; `npm run lint` passed.
- Full regression: `npm run test` passed with 49 test files and 291 tests.
- E2E smoke: `npm run test:e2e` passed with 39 Playwright tests.
- Review patch verification: focused unit suite passed with 38 tests; `npm run typecheck`, `npm run lint`, full `npm run test` passed with 49 files / 299 tests; `npm run test:e2e` passed with 39 Playwright tests.

### Implementation Plan

- Added a service-owned `ExecutivePrivateWorkspaceData` DTO that composes scoped `ExecutiveDashboardData` and `ExecutiveLeadershipData` instead of reading raw mock data in React.
- Added role variant config and priority mapping/dedupe by `sourceType:sourceId`, with finance-field sanitization inherited from dashboard DTO access flags.
- Added assistant delegation summaries/actions from active delegated scope only, excluding approval/admin/audit/export-sensitive actions.
- Wired Command Center aggregate data, menu child, page guard, and render branch for `/command-center?view=executive-private-workspace`.
- Added compact responsive UI with accessible source item actions and `ExecutiveDrilldownPanel` metadata reuse.

### Completion Notes List

- Implemented Private Workspace variants for chairman, CEO, project director, department head, secretary/assistant, and viewer.
- Invalid selected scope now returns `emptyState.kind = "invalid_scope"` without falling back to global executive data.
- Viewer/private-workspace deep links render read-only state through the authenticated shell while executive dashboard deep links remain guarded.
- Assistant on-behalf UI only exposes active delegated create actions in matching scope; approve/reject/request-change actions are not exposed.
- Finance-sensitive fields are stripped from DTO serialization and DOM when finance access is denied.

### File List

- `_bmad-output/implementation-artifacts/2-6-private-workspace-theo-vai-tro.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/command-center/page.tsx`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/types.ts`
- `src/modules/workspaces/components/executive-private-workspace.tsx`
- `src/modules/workspaces/private-workspace-variants.ts`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `src/modules/workspaces/types.ts`
- `tests/e2e/mvp-smoke.spec.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/command-center-page.test.tsx`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/executive-private-workspace-service.test.ts`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-24 | 1.0 | Created Story 2.6 implementation guide for role/scope-aware Executive Private Workspace. | Codex |
| 2026-05-24 | 1.1 | Implemented role/scope-aware Executive Private Workspace service, Command Center view, UI states, delegation guardrails, and test coverage. | Codex |
