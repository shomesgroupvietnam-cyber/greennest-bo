# Story 2.1: PermissionAwareShell Va Workspace Entry

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay tao contract cho workspace entry, shell permission-aware, default workspace theo vai tro/scope, va IA correction giua `Tong quan Truc 1`, `Lanh dao` / Module 1, va `Quan tri Chu tich` / BO Settings. Pham vi la shell/navigation/guard/default-route contract; khong build KPI/dashboard content cua Story 2.2/2.3.

## Story

As a nguoi dung sau dang nhap,  
I want duoc dua vao workspace mac dinh theo vai tro va scope,  
so that toi bat dau o dung be mat dieu hanh thay vi dashboard chung.

## Tieu Chi Chap Nhan

1. **PermissionAwareShell cho user co Module 1 assignment**
   - Given user da dang nhap va co assignment Module 1
   - When user truy cap executive entry route
   - Then PermissionAwareShell render sidebar permission-aware, topbar, workspace selector va scope selector
   - And current workspace/scope duoc hien thi ro trong shell, khong chi trong noi dung page.

2. **Direct URL unauthorized khong fetch/render data Module 1**
   - Given user khong co quyen Module 1
   - When user mo truc tiep URL Module 1 hoac executive workspace
   - Then he thong tra 403/forbidden state
   - And khong fetch, render, hoac flash du lieu Module 1 truoc khi block.

3. **Switch workspace/scope reload dung service DTO**
   - Given user co nhieu role hoac nhieu scope
   - When user doi workspace hoac scope
   - Then dashboard/workspace reload dua tren service DTO cua scope moi
   - And navigation chi hien modules/workspaces ma user duoc phep truy cap trong scope do.

4. **Phan biet Truc 1 Command Center voi Module 1 Dashboard Tong Quan**
   - Given user co quyen Truc 1
   - When sidebar hoac entry point render
   - Then UI phan biet ro `Tong quan Truc 1` / Command Center voi `Dashboard Tong Quan` cua Module 1 - Lanh dao
   - And `Tong quan Truc 1` chi la entry cho 5 MVP modules, khong thay the Module 1 dashboard 1.1.

5. **Chu tich/leadership khong mac dinh vao admin settings**
   - Given Chairman/leadership persona co ca operational permissions va admin permissions
   - When user dang nhap hoac mo default workspace
   - Then system dua user vao operational workspace phu hop theo role/scope
   - And `Quan tri Chu tich` / BO Settings la khu vuc rieng, khong phai default daily workspace.

## Tasks / Subtasks

- [x] Audit IA/default-route contract hien tai (AC: 4, 5)
  - [x] Review `src/constants/roles.ts`, role catalog seed, mock session va default screen fallback de xac dinh source of truth cho default workspace.
  - [x] Review current route behavior cua `/command-center`, `/executive`, `/admin`, `/settings`, `/dashboard` va cac redirect/guard lien quan.
  - [x] Doi chieu voi sprint change proposal de chot label va route interim it disruptive.

- [x] Cap nhat default workspace va route semantics (AC: 1, 4, 5)
  - [x] Dam bao `super_admin` / Chairman daily default khong la `/admin`; route mac dinh nen la operational workspace phu hop voi role/scope.
  - [x] Dam bao `tong_giam_doc` / leadership user mo vao Module 1 leadership workspace hoac Command Center view da duoc chot, khong vao dashboard chung mo ho.
  - [x] Giu `/admin` hoac `/settings` la BO Settings / Quan tri Chu tich rieng, chi hien khi user co admin/settings permission.
  - [x] Neu giu `/executive` la legacy/compat route, guard phai chay truoc data fetch va redirect/render phai nhat quan voi Command Center unification spec.

- [x] Build hoac extend PermissionAwareShell surface (AC: 1, 3, 4)
  - [x] Extend shell hien co (`AppSidebar`, `AppHeader`, `RoleWorkspaceShell` hoac abstraction phu hop) de hien current workspace, role, scope va available workspaces.
  - [x] Sidebar labels phai phan biet `Tong quan Truc 1` / `Command Center Truc 1`, `Lanh dao` / Module 1, va `Quan tri Chu tich` / BO Settings.
  - [x] Topbar/header co workspace selector va scope selector khi user co nhieu option; single-option state khong gay nhieu.
  - [x] Mobile state khong overflow; neu dung drawer/compact menu, giu labels ngan va khong overlap.

- [x] Lam navigation permission-aware va scope-aware (AC: 1, 3, 4)
  - [x] Cap nhat `getPermittedNavItems` hoac tao server-side nav DTO de khong chi dua vao static `can()` va role list.
  - [x] Scoped grants tu active scope assignments phai co the lam hien workspace/module tuong ung khi user khong co static role-wide permission.
  - [x] Navigation phai deny-by-default: khong hien module/workspace neu user thieu permission va thieu scoped grant hop le.
  - [x] Workspace/scope switch nen di qua URL/search param, server action, hoac loader pattern ro rang de service reload DTO theo scope moi.

- [x] Dam bao 403/no-fetch behavior cho Module 1 (AC: 2)
  - [x] Giu hoac them guard server-side truoc moi call service lay executive/workspace data.
  - [x] Verify direct URL unauthorized khong goi `getRoleWorkspaceData`, executive dashboard service, proposal/finance/document loaders lien quan.
  - [x] Audit access denied van la best-effort va khong block forbidden response neu audit fail.
  - [x] Unauthorized UI state khong tiet lo data nhay cam, ID noi bo, hoac counters truoc khi deny.

- [x] Bao ton service filtering va data contracts (AC: 2, 3)
  - [x] Dung `resolveAccessScope`, active scope assignments, role permission catalog va delegation summary hien co thay vi hardcode role-only logic.
  - [x] Khong duplicate dashboard/KPI aggregation cua Story 2.2 trong shell.
  - [x] Khong filter sensitive data bang CSS/client-only; permission phai duoc enforce o server/service DTO.
  - [x] Neu them DTO cho selectors, type phai ro rang va nam o module/shared boundary phu hop.

- [x] Cap nhat tests (AC: 1, 2, 3, 4, 5)
  - [x] Update unit tests cho `ROLE_DEFAULT_SCREENS`, route labels, permitted nav items va default workspace cua Chairman/leadership.
  - [x] Them test cho scoped nav grant neu user co active assignment nhung khong co static role-wide permission.
  - [x] Them test guard/no-fetch cho direct unauthorized route neu co the mock service call.
  - [x] Them component tests cho shell labels/selectors/unauthorized/loading states neu Testing Library pattern hien co phu hop.
  - [x] Update e2e smoke: Chairman/leadership default operational workspace, `/admin` khong la daily default, direct unauthorized Module 1 tra 403, label Command Center vs Module 1 khong nham lan.

- [x] Kiem thu
  - [x] Chay `npm run typecheck`.
  - [x] Chay `npm run lint`.
  - [x] Chay `npm run test`.
  - [x] Chay `npm run test:e2e` neu route/navigation/default login flow thay doi.
  - [x] Ghi ro bat ky lenh nao khong chay duoc trong Dev Agent Record.

### Review Findings

- [x] [Review][Patch] Command Center canonical entry bypasses PermissionAwareShell [src/app/command-center/page.tsx:35]
- [x] [Review][Patch] Proposal create/detail routes lost route-level guard and can fetch before deny [src/app/(dashboard)/layout.tsx:39]
- [x] [Review][Patch] Scoped nav grants can show routes that dashboard layout still 403s [src/app/(dashboard)/layout.tsx:63]
- [x] [Review][Patch] Workspace nav uses broad permissions for routes guarded by workspace-role policy [src/lib/permissions/navigation.ts:311]
- [x] [Review][Patch] Scoped-only executive access fetches data but cannot open executive view [src/modules/command-center/services/command-center-service.ts:545]
- [x] [Review][Patch] Direct Axis 1 permission users receive empty scoped Axis 1 dashboard [src/modules/command-center/services/command-center-service.ts:282]
- [x] [Review][Patch] Selected executive scope is ignored for direct leadership roles [src/modules/executive/services/executive-service.ts:592]
- [x] [Review][Patch] All-scope workspace loading forces assignment mode and can empty direct-role data [src/modules/workspaces/services/workspace-service.ts:190]
- [x] [Review][Patch] ScopeId is not preserved or sanitized across executive redirects/view switches [src/app/executive/_lib/render-executive-page.tsx:18]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 2 tao Workspace Dieu Hanh va Dashboard Module 1 cho lanh dao/delegated users: user phai vao dung workspace theo role/scope, thay KPI/status/approval/risk/meeting/decision data theo permission, va co drill-down/403 dung cach.
- Story 2.1 la IA va shell foundation cho Epic 2. Cac story dashboard sau se dua vao entry/shell/guard nay de tranh build nhieu dashboard trung nhau.
- Sprint change proposal da ghi ro confusion hien tai: menu `Quan tri`/`Tong quan` lam Chu tich bi lan giua daily operational persona va admin/settings persona; `Tong quan` hien 5 modules lam user nham Command Center Truc 1 voi `Dashboard Tong Quan` cua Module 1.
- Required naming model:
  - `Tong quan Truc 1` hoac `Command Center Truc 1`: entry tong cho 5 MVP modules.
  - `Lanh dao`: Module 1 workspace, chua cac man hinh 1.1-1.11.
  - `Dashboard Tong Quan`: section 1.1 ben trong Module 1, khong phai top-level Command Center.
  - `Quan tri Chu tich` hoac `BO Settings`: admin/settings area rieng, khong la daily default.
- Story nay khong yeu cau build dashboard KPI/service aggregation moi. KPI DTO va dashboard content thuoc Story 2.2/2.3.

### Current Code State (Read Before Editing)

- `src/constants/roles.ts` hien dat `ROLE_DEFAULT_SCREENS.super_admin` va `admin` la `/admin`; `tong_giam_doc` la `/executive`. AC5 yeu cau Chairman/Super Admin daily default khong la admin/settings.
- `src/lib/auth/session.ts` resolve default screen tu role catalog va fallback constants. Neu role catalog seed co defaultScreen cu, code co the van dua user vao `/admin`; can audit seed/mock `.mock-data/role-permission-catalog.json` va tests.
- `src/lib/permissions/navigation.ts` hien co `NAV_ITEMS` voi labels nhu `Quan tri`, `Tong quan`, va `getPermittedNavItems(user)` dua vao static `can()`, role list va common item. No chua tinh active scoped assignments, nen user co scoped grant co the khong thay nav can thiet.
- `src/components/layout/app-sidebar.tsx` render desktop sidebar tu `getPermittedNavItems`; `src/components/layout/app-header.tsx` render topbar/mobile nav va default screen label. Ca hai chua co workspace selector/scope selector.
- `src/app/(dashboard)/layout.tsx` doc pathname tu middleware header, require session, enforce mot so route policies, roi wrap `AppSidebar`/`AppHeader`. Neu them server-side nav DTO/scope, layout la diem tich hop co the phu hop.
- `src/middleware.ts` set `x-greennest-pathname`; giu pattern nay neu route policy van can pathname trong layout server component.
- `src/lib/permissions/guard.ts` da dung `forbidden()` va `redirect()`; `requireWorkspaceRoute(route)` authenticate, check `canAccessWorkspaceRoute` hoac `canAccessWorkspaceRouteByScope`, audit deny, roi `forbidden()`.
- `next.config.ts` da bat `experimental.authInterrupts: true`, nen `forbidden()` dang la contract chu dich.
- `src/modules/workspaces/config.ts` dinh nghia workspace routes. Current `canAccessWorkspaceRoute` allow `super_admin` vao moi route va `tong_giam_doc` vao nhieu route tru contractor/consultant; can kiem tra co qua rong so voi scope-aware contract khong.
- `src/modules/workspaces/components/workspace-route-page.tsx` hien goi `requireWorkspaceRoute(route)` truoc `getRoleWorkspaceData(session.user, route)`. Day la pattern dung cho AC2; neu refactor phai giu guard-before-fetch.
- `src/modules/workspaces/services/workspace-service.ts` load active scope assignments, role permission catalog, delegations, dashboard/domain data, sau do `applyWorkspaceScope`. Shell/selectors nen tai su dung contract nay hoac service DTO server-side, khong doc mock data truc tiep tu component.
- `src/modules/workspaces/components/role-workspace-shell.tsx` render page shell, KPI/action item/data-scope summary va co `UnauthorizedWorkspace` component, nhung route guard hien dang dung `forbidden()`. Neu them unauthorized state, tranh tao duong render data roi moi an.
- `src/app/command-center/page.tsx` load `getCommandCenterData(session.user)` va render `CommandCenterDashboard`; current `/command-center` la canonical Command Center surface.
- `src/modules/command-center/services/command-center-service.ts` build axes/menu va conditional executive data. No co logic `hasAnyScopedActionGrant` cho Axis 1, nhung can verify labels/default workspace/scope selector van dung.
- `src/app/executive/**` hien render executive pages qua `src/app/executive/_lib/render-executive-page.tsx`, goi `requireWorkspaceRoute("/executive")` roi `getExecutiveLeadershipData`. Cac spec gan day lai noi legacy `/executive*` nen redirect vao `/command-center?view=executive-dashboard`. Story 2.1 phai reconcile mismatch nay thay vi de hai entry doc lap lam user nham lan.
- `src/modules/executive/constants/index.ts` cho admin/super_admin/tong_giam_doc executive access theo policy hien tai. Neu doi default route, can giu behavior co chu dich va update tests.

### File Targets

### Project Structure Notes

- Shell/layout changes nen o existing app shell boundary (`src/components/layout/*`, `src/app/(dashboard)/layout.tsx`) hoac workspace shell boundary (`src/modules/workspaces/*`), khong tao shell song song moi.
- Command Center changes nen reuse `src/app/command-center/page.tsx` va `src/modules/command-center/*`. Khong tao top-level dashboard moi cho cung mot purpose.
- Route compatibility changes cho `/executive/**` nen nam trong existing route files hoac `_lib/render-executive-page.tsx`; guard/redirect phai xay ra truoc data service call.
- Permission/navigation logic nen nam trong `src/lib/permissions/*` hoac service DTO server-side, khong hardcode trong client component.
- Selector DTO/type neu dung chung giua shell va workspace service nen nam trong `src/modules/workspaces/types.ts` hoac module-specific service file, theo pattern hien co.

### File Targets

Expected UPDATE:
- `src/constants/roles.ts`
- `src/lib/auth/session.ts` neu defaultScreen tu catalog/fallback can align
- `src/lib/permissions/navigation.ts`
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/app-header.tsx`
- `src/app/(dashboard)/layout.tsx` neu shell/nav DTO can server-side data
- `src/modules/workspaces/config.ts`
- `src/modules/workspaces/types.ts` neu them workspace/scope selector DTO
- `src/modules/workspaces/services/workspace-service.ts`
- `src/modules/workspaces/components/workspace-route-page.tsx`
- `src/modules/workspaces/components/role-workspace-shell.tsx`
- `src/app/command-center/page.tsx`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `src/app/executive/**/page.tsx` hoac `src/app/executive/_lib/render-executive-page.tsx` neu chot redirect/compat behavior
- `tests/unit/workspaces.test.ts`
- `tests/unit/permissions.test.ts`
- `tests/unit/access-scope.test.ts` neu them nav/scope matrix
- `tests/e2e/mvp-smoke.spec.ts` neu route/default navigation thay doi

Possible UPDATE:
- `.mock-data/role-permission-catalog.json` va `tests/fixtures/module-one-acceptance.json` neu seed defaultScreen dang dua Chairman/Super Admin vao `/admin`.
- `docs/development/README.md` neu manual login/default workspace instructions can update.

Avoid unless truly needed:
- Khong implement dashboard service DTO aggregation cua Story 2.2.
- Khong build full dashboard UI KPI strip/priority queue/risk summary cua Story 2.3.
- Khong them approval workflow moi hoac proposal mutation moi.
- Khong hardcode allow/deny chi bang role name neu permission/scope contract da co.
- Khong nang cap dependencies hoac rewrite design system.
- Khong revert dirty worktree files khong lien quan.

### Rang Buoc Kien Truc

- Next.js App Router + TypeScript modular monolith: routes compose pages/shells, domain logic nam trong `src/modules/*`, cross-cutting auth/permissions/audit trong `src/lib/*`.
- Permission enforcement phai o server/service layer, deny-by-default, theo role + scope + action. Direct invalid access tra 403 truoc khi protected data duoc fetch/render.
- Internal flow nen la Page/Layout -> auth/permission -> service -> repository -> DTO/component. Component khong doc repository hoac mock data truc tiep.
- Data nhay cam phai duoc filter truoc khi return UI. UI hiding chi la presentation, khong la security boundary.
- Permission/scope/403 phai nhat quan qua route, server action, service, repository/RLS.
- Shell state co the la DTO rieng nhung phai derive tu same source of truth: role permission catalog, active scope assignments, workspace definitions, delegation/scope context neu can.

### UX Guardrails

- Operational app nen quiet, utilitarian, scan-friendly; khong tao landing page/marketing hero.
- Sidebar/topbar labels phai ngan, phan cap ro va khong lap nghia:
  - Top-level Truc 1: `Tong quan Truc 1` hoac `Command Center Truc 1`.
  - Module workspace: `Lanh dao`.
  - Module section: `Dashboard Tong Quan`.
  - Admin/settings: `Quan tri Chu tich` hoac `BO Settings`.
- Workspace selector nen dung menu/segmented control/list phu hop voi so option; scope selector nen ro current organization/project/axis/workstream/module.
- Neu user chi co mot workspace/scope, selector co the render disabled/read-only hoac concise label, nhung current workspace/scope van phai nhin thay.
- Mobile layout phai khong co text overflow; menu labels dai can wrap/shorten, khong scale font theo viewport width.
- Unauthorized state nen giai thich thieu permission/scope o muc vua du, khong lo du lieu Module 1.

### Previous Story Intelligence

- Story 1.1 da tao role/permission catalog va sua separation admin/settings vs business approval. Story 2.1 phai tranh bien admin permission thanh daily operational default.
- Story 1.2 da tao scope assignments va server/service filtering. Navigation/shell phai tinh scoped grants, khong chi static role permissions.
- Story 1.3 da tao policy/risk settings; khong lien quan truc tiep, nhung default workspace khong duoc hardcode policy/risk shortcut.
- Story 1.4 da tao leadership delegation; shell co the hien delegated context sau nay, nhung Story 2.1 chi can khong pha permission/scope semantics.
- Story 1.5 da tao seed personas va mock data cho Chu tich/Super Admin, CEO, Giam doc du an, Truong bo phan, Thu ky/Tro ly va Viewer. Manual/e2e acceptance nen dung cac persona nay.

### Git / Spec Intelligence

- Recent implementation specs noi `/command-center` la canonical route va legacy/direct executive routes nen redirect vao `/command-center?view=executive-dashboard` hoac view tuong ung.
- Current code van co `/executive/**` render doc lap qua `renderExecutivePage`. Day la mismatch quan trong: dev can chot va cap nhat tests theo mot huong nhat quan.
- Sprint change proposal de xuat interim route it disruptive:
  - `Tong quan Truc 1` -> `/command-center` hoac `/axis-1` redirect den Command Center Truc 1.
  - `Lanh dao` -> `/command-center?view=executive-dashboard` cho den khi `/axis-1/executive` duoc finalized.
  - `Quan tri Chu tich` -> `/admin` hoac `/settings`, khong la Chairman default.
- Neu route `/executive` duoc giu de backward compatibility, no phai la compat/redirect/guard surface, khong tao dashboard top-level thu hai voi label khac lam user nham.

### Testing Guidance

- Cap nhat tests hien co thay vi chi them snapshots:
  - `tests/unit/workspaces.test.ts` hien dang expect `super_admin` default `/admin`; can update theo AC5.
  - `tests/unit/permissions.test.ts` hien co test ten "routes to command center" nhung expect `/executive`; can sua ten/expectation cho nhat quan.
  - `tests/unit/workspaces.test.ts` hien verify admin/super_admin/executive access broad; can them negative/scope-aware case neu route policy doi.
- Unit tests nen cover:
  - default workspace resolution cho `super_admin`, `tong_giam_doc`, admin/settings-only user, scoped-only user.
  - nav label output khong con ambiguous `Tong quan` cho Truc 1.
  - `getPermittedNavItems` hoac nav DTO tinh active scope assignment.
  - direct unauthorized route khong goi data service neu co mock/spying pattern phu hop.
- Component tests nen cover:
  - shell render sidebar/topbar/workspace selector/scope selector.
  - single-scope vs multi-scope state.
  - unauthorized/loading state khong co protected data.
- E2E smoke nen cover:
  - Chairman/Super Admin login/default khong vao `/admin`.
  - Command Center entry va Module 1 entry co label rieng.
  - Viewer hoac user thieu Module 1 permission mo direct executive/Module 1 URL nhan 403.
- Chay toi thieu `npm run typecheck`, `npm run lint`, `npm run test`. Chay `npm run test:e2e` neu chuyen route/default login/nav visible behavior.

### Latest Tech Notes

- Project hien dung Next `^15.3.2`, React `^19.0.0`, Tailwind CSS, shadcn/Radix, lucide-react, Zod, Vitest, Testing Library va Playwright. Story nay khong can dependency moi.
- Verified 2026-05-24: Next `forbidden()` renders a 403 path and requires `experimental.authInterrupts`; project already has that option enabled. Use it for route-level deny before protected data fetch: https://nextjs.org/docs/app/api-reference/functions/forbidden
- Verified 2026-05-24: For legacy route compatibility redirects, use App Router server-side `redirect()` before protected data service calls: https://nextjs.org/docs/app/building-your-application/routing/redirecting
- Verified 2026-05-24: App Router layouts/pages are the right place to keep shared shell structure and pass server-loaded DTOs into client shell controls when interactivity is needed: https://nextjs.org/docs/app/building-your-application/routing/defining-routes

### References

- `_bmad-output/planning-artifacts/epics.md` - Epic 2, Story 2.1 acceptance criteria, dependencies, files/modules and test expectations.
- `_bmad-output/planning-artifacts/architecture.md` - modular monolith boundaries, App Router flow, server/service permission enforcement and test standards.
- `_bmad-output/planning-artifacts/ux-design-specification.md` - PermissionAwareShell, role-first workspace, scope selector, unauthorized/mobile states.
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-05-24-module-1-navigation-ia.md` - IA correction for Command Center vs Module 1 vs BO Settings.
- `_bmad-output/implementation-artifacts/spec-command-center-unification.md` - canonical `/command-center` intent and legacy route compatibility notes.
- `_bmad-output/implementation-artifacts/spec-executive-command-center-architecture.md` - executive route/view architecture and current mismatch risk.
- `_bmad-output/implementation-artifacts/1-5-seed-data-dieu-hanh-cho-nghiem-thu-module-1.md` - seed personas, scope data and previous story learnings.

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- `npm run test -- tests/unit/workspaces.test.ts tests/unit/permissions.test.ts tests/unit/app-shell.test.tsx tests/unit/workspace-route-page.test.tsx` - RED: default route, nav label, scoped nav, shell selector gaps confirmed.
- `npm run test -- tests/unit/workspaces.test.ts tests/unit/permissions.test.ts tests/unit/app-shell.test.tsx tests/unit/workspace-route-page.test.tsx` - GREEN: focused unit/component guard tests pass.
- `npm run test -- tests/unit/command-center-page.test.tsx tests/unit/workspace-route-page.test.tsx` - GREEN: canonical and workspace no-fetch guard tests pass.
- `npm run typecheck` - PASS.
- `npm run lint` - PASS.
- `npm run test` - PASS, 44 files / 240 tests.
- `npm run test:e2e` - PASS, 30 Playwright tests.
- `npm run test -- tests/unit/command-center-page.test.tsx tests/unit/command-center-service.test.ts tests/unit/executive-service.test.ts tests/unit/workspaces.test.ts tests/unit/app-shell.test.tsx` - GREEN after review patches.
- `npm run typecheck` - PASS after review patches.
- `npm run lint` - PASS after review patches.
- `npm run test` - PASS after review patches, 44 files / 245 tests.
- `npm run test:e2e` - PASS after review patches, 30 Playwright tests.

### Completion Notes

- Audited default route and IA contracts across role defaults, auth login redirects, dashboard shell, workspace guard, command-center entry, executive legacy routes and scoped navigation.
- Updated Chairman/Super Admin default away from `/admin`; leadership defaults now enter `/command-center?view=executive-dashboard`; BO settings/admin labels are explicit and separate.
- Added server-derived navigation/shell context with workspace and scope selectors, scoped-permission nav grants, URL `scopeId` switching, and selected-scope service DTO reload.
- Converted `/executive/**` to guard-first legacy redirects into canonical command-center views; canonical executive deep links now run `requireWorkspaceRoute("/executive")` before command-center data fetch.
- Tightened executive scoped access so broad scoped `project.view` does not unlock Module 1; scoped executive access must come from an assignment role that belongs to the executive workspace.
- Resolved code-review findings: canonical `/command-center` now renders inside PermissionAwareShell, proposal subroutes are guarded before detail fetch, scoped collection routes and workspace nav share route-aware access rules, selected scope is preserved/sanitized, and direct/scoped command-center DTOs no longer collapse or hide authorized views.

### File List

- `_bmad-output/implementation-artifacts/2-1-permission-aware-shell-va-workspace-entry.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/(dashboard)/layout.tsx`
- `src/app/command-center/page.tsx`
- `src/app/executive/_lib/render-executive-page.tsx`
- `src/components/layout/app-header.tsx`
- `src/components/layout/app-sidebar.tsx`
- `src/constants/roles.ts`
- `src/lib/auth/actions.ts`
- `src/lib/permissions/access-scope.ts`
- `src/lib/permissions/guard.ts`
- `src/lib/permissions/navigation.ts`
- `src/lib/permissions/navigation-context.ts`
- `src/middleware.ts`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/dashboard/services/dashboard-service.ts`
- `src/modules/executive/services/executive-service.ts`
- `src/modules/workspaces/components/workspace-route-page.tsx`
- `src/modules/workspaces/services/workspace-service.ts`
- `tests/e2e/mvp-smoke.spec.ts`
- `tests/unit/app-shell.test.tsx`
- `tests/unit/command-center-page.test.tsx`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/executive-service.test.ts`
- `tests/unit/permissions.test.ts`
- `tests/unit/workspace-route-page.test.tsx`
- `tests/unit/workspaces.test.ts`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-24 | 1.0 | Created Story 2.1 implementation guide and acceptance contract. | Codex |
| 2026-05-24 | 1.1 | Implemented permission-aware shell, scoped navigation, command-center executive routing and 403/no-fetch guard coverage. | Codex |
