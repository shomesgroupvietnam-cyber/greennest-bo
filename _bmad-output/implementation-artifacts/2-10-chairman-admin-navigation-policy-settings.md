# Story 2.10: Thiết Lập Chính Sách Điều Hướng Chủ Tịch Và Super Admin

Status: done

Ghi chú tạo story: Ultimate context engine analysis completed - comprehensive developer guide created. Story này là follow-up trực tiếp của Story 1.6 và 2.9 để đóng chặt ranh giới `chu_tich` business leadership với `super_admin`/BO admin surfaces. Trong scope này không thêm role mới; mục tiêu là làm rõ policy, guard-before-fetch và audit cho các route `/admin`, `/settings`, `/users`.

## Story

As a người quản lý RBAC và navigation Module 1,
I want chính sách điều hướng Chủ tịch/admin được enforce tập trung cho `chu_tich` và `super_admin`,
so that Chủ tịch chỉ thấy leadership surfaces, Super Admin thấy leadership + BO/system, và direct BO route access được deny/audit đúng trước khi fetch dữ liệu quản trị.

## Tiêu Chí Chấp Nhận

1. **Chu tich chi thay Command Center va leadership surfaces**
   - Given user role = `chu_tich`
   - When sidebar renders
   - Then user sees Command Center / Leadership surfaces: `/command-center` va `/command-center?view=executive-dashboard`
   - And user does not see BO Settings, Users, Admin, Role Permission Settings
   - And hidden labels/hrefs include `/admin`, `/settings`, `/users`, "BO Settings", "Nguoi dung", "Quan tri he thong", and any role-permission settings entry/panel reachable from navigation.

2. **Super Admin thay full Chairman + BO/system navigation**
   - Given user role = `super_admin`
   - When sidebar renders
   - Then user sees everything `chu_tich` sees
   - And also sees BO Settings, Users, Admin/system configuration
   - And tests prove `super_admin` navigation is a superset of `chu_tich` leadership navigation plus BO hrefs.

3. **Chu tich bi chan direct BO routes truoc khi fetch admin data**
   - Given user role = `chu_tich`
   - When direct access `/admin`, `/settings`, `/users`
   - Then system returns 403 or redirects before admin data fetch
   - And no BO/admin data service runs before the guard decision
   - And response/body must not render admin-only labels or sensitive BO content such as "Cai dat BO", "Danh sach nguoi dung", "Role Permission Catalog", "Khong gian quan tri".

4. **Super Admin duoc vao BO routes va co audit allowed access**
   - Given user role = `super_admin`
   - When access `/admin`, `/settings`, `/users`
   - Then access is allowed
   - And an audit event is written for successful BO route access with compact safe payload: route, role, status, reason/action
   - And audit failure must not block the page render.

5. **Policy source of truth khong bi tach thanh allowlist song song**
   - Given nav/sidebar, workspace selector, dashboard route policy and direct route guard code
   - When role policy changes in future
   - Then `chu_tich`/`super_admin` BO visibility and route eligibility continue to flow through one central policy/helper layer, not duplicated ad hoc arrays.
   - And tests fail if `chu_tich` gains `settings.manage`, `user.view`, `user.invite`, `user.update_role`, `delegation.manage`, `/admin`, `/settings`, or `/users` through static permissions, scoped grants, delegated permissions, or shell workspace options.

6. **Regression coverage bao phu unit, component/page va e2e**
   - Given test suite chay
   - Then unit tests assert exact chairman/admin navigation policy, direct route guard-before-fetch, and success audit for `super_admin`
   - And e2e covers `chu_tich` no BO nav/direct BO deny and `super_admin` BO route allowed
   - And existing Story 2.8/2.9 external/viewer/specialist Command Center restrictions do not regress.

## Tasks / Subtasks

- [x] Lock the central navigation/BO policy contract (AC: 1, 2, 5)
  - [x] Add or refine a helper in `src/lib/permissions/navigation-policy.ts` for BO/admin route/navigation eligibility, for example `canOpenBoRoute`, `isBoPolicyHref`, or explicit BO href grouping.
  - [x] Ensure `chu_tich` policy row only includes `/command-center` and `/command-center?view=executive-dashboard`.
  - [x] Ensure `super_admin` policy row includes all `chu_tich` leadership hrefs plus `/admin`; normal business nav must continue to include `/settings` and `/users` through permission checks.
  - [x] Keep `/settings` and `/users` controlled by `settings.manage`/`delegation.manage` and `user.view`; do not add these permissions to `chu_tich`.
  - [x] Avoid adding a second hardcoded role allowlist in components or pages; consume the central helper from nav, layout/guard and tests.

- [x] Harden sidebar and workspace selector assertions (AC: 1, 2, 5)
  - [x] Update `tests/unit/navigation-policy.test.ts` to assert exact forbidden href/label list for `chu_tich`: `/admin`, `/settings`, `/users`, `BO Settings`, `Nguoi dung`, `Quan tri he thong`.
  - [x] Update `tests/unit/workspaces.test.ts` or a focused shell test so `shellContext.workspaceOptions` for `chu_tich` also excludes the BO hrefs, not just `navItems`.
  - [x] Assert `super_admin` nav contains all Chairman leadership hrefs plus `/admin`, `/settings`, `/users`.
  - [x] Include "Role Permission Settings" as a settings-panel concern: no nav/workspace option should route `chu_tich` to the settings page where `RolePermissionCatalogPanel` is mounted.

- [x] Guard `/admin`, `/settings`, `/users` before protected data fetch (AC: 3)
  - [x] Audit `src/app/(dashboard)/layout.tsx` route policy order: `/admin` role guard, `/settings` any-permission guard, `/users` `user.view` guard.
  - [x] Add page/route unit tests that mock page data loaders and prove `chu_tich` denial happens before data functions:
    - `/admin`: `WorkspaceRoutePage({ route: "/admin" })` or layout policy path rejects before `getRoleWorkspaceData`.
    - `/settings`: `SettingsPage` rejects before `listRolePermissionCatalog`, `listUsers`, `listProjects`, policy/settings loaders.
    - `/users`: `UsersPage` rejects before `listUsers`, `listRoles`, `listProjects`, `listAuditLogs`.
  - [x] Keep denial behavior compatible with Next `forbidden()` or redirect; tests should assert no protected data fetch, not only status.

- [x] Add successful BO route access audit for `super_admin` (AC: 4)
  - [x] Add a small guard/audit helper in `src/lib/permissions/guard.ts` or `src/app/(dashboard)/layout.tsx`, for example `recordBoRouteAccess` / `auditBoRouteAccess`.
  - [x] Trigger success audit only for BO routes `/admin`, `/settings`, `/users` after authorization succeeds and before or immediately around page data fetch.
  - [x] Use safe compact audit payload via `createAuditLog`: `entityType: "access"`, fixed safe entity id, action such as `access.allowed`, and `newValue` with `route`, `reason: "bo_route_allowed"`, `role`, `status`.
  - [x] Catch audit writer failures so BO page render is not blocked by audit persistence errors.
  - [x] Unit test `super_admin` allowed access produces audit events for `/admin`, `/settings`, `/users`; also test audit failure does not block allowed render.

- [x] Preserve role permission and BO mutation boundaries (AC: 1, 3, 5, 6)
  - [x] Confirm `src/lib/permissions/can.ts` still denies `chu_tich` for `settings.manage`, `user.view`, `user.invite`, `user.update_role`, `delegation.manage`, `knowledge.manage_source_registry`, `ai.configure`.
  - [x] Keep existing direct mutation tests from Story 1.6: `tests/unit/user-actions.test.ts`, `tests/unit/role-permission-catalog.test.ts`, `tests/unit/policy-settings-service.test.ts`.
  - [x] Add a regression assertion that scoped/delegated context cannot make `chu_tich` see `/settings` or `/users` unless product creates a separate explicit business delegation permission in a future story.

- [x] E2E smoke for final behavior (AC: 1, 2, 3, 4, 6)
  - [x] Extend `tests/e2e/mvp-smoke.spec.ts` existing "Permission-aware workspace entry" block.
  - [x] For `chu_tich`: login to `/command-center`, assert no BO nav/link text, and direct `/admin`, `/settings`, `/users` returns 403/redirect with no BO content.
  - [x] For `super_admin`: login to `/command-center`, assert BO navigation exists, and direct `/admin`, `/settings`, `/users` returns allowed status.
  - [x] Keep timeout handling for cold Next compile where this suite already needed per-test timeout for BO routes.

- [x] Validation (AC: 1, 2, 3, 4, 5, 6)
  - [x] Run focused tests for `navigation-policy`, `workspaces`, app-shell/layout/page guard tests, settings/users/admin route tests, role-permission catalog, policy settings, user actions.
  - [x] Run `npm run typecheck`.
  - [x] Run `npm run lint`.
  - [x] Run `npm run test`.
  - [x] Run `npm run test:e2e` because route/navigation behavior changes.

### Review Findings

- [x] [Review][Patch] BO route helper still trusts raw role/catalog permissions for `/settings` and `/users` [src/lib/permissions/navigation-policy.ts:363] — `canOpenBoRoute` denies default `chu_tich`, but if role catalog/session permissions ever grant `settings.manage`, `delegation.manage`, or `user.view` to `chu_tich`, `/settings` or `/users` become allowed because those routes do not require an explicit BO policy boundary. AC5 says tests should fail if `chu_tich` gains BO permissions through static permissions. Add a central BO eligibility boundary, at minimum an explicit chairman deny plus tests using `permissionsMode: "replace"`.
- [x] [Review][Patch] Workspace selector still keeps a separate policy href allowlist [src/lib/permissions/navigation-context.ts:24] — `navigation-context.ts` defines local `workspaceHrefs` while `navigation-policy.ts` owns `POLICY_WORKSPACE_HREFS`. This violates AC5's single source-of-truth intent and can make future policy changes diverge between sidebar and workspace selector. Reuse `POLICY_WORKSPACE_HREFS`/`isPolicyWorkspaceHref` or a policy-exported selector predicate.
- [x] [Review][Patch] BO success audit tests do not cover every BO route and boundary variant [tests/unit/bo-route-guard.test.ts:56] — success audit payload is asserted for `/settings` only; `/admin`, `/users`, trailing slash, subpath, and query variants are not covered. Parameterize guard tests over `BO_POLICY_HREFS` plus route variants so AC4/AC6 fail if any allowed BO route loses audit behavior.
- [x] [Review][Patch] Layout BO guard integration is not directly unit-tested [src/app/(dashboard)/layout.tsx:71] — page tests prove page-level guard-before-fetch and isolated guard tests prove audit, but no focused layout test proves `/admin`, `/settings`, and `/users` all call `requireBoRoute` before `getNavigationShellData`. Add a dashboard layout test mocking `headers`, `requireBoRoute`, and `getNavigationShellData`.

## Dev Notes

### Product Decision

- `chu_tich` is a business/executive role. It owns Command Center / Leadership surfaces and business approvals, but does not own BO/system administration.
- `super_admin` is the technical/business super admin. It has everything `chu_tich` has plus BO/system surfaces and role/user/settings powers.
- `admin` may keep BO/system navigation according to current product behavior, but must not regain business approval powers while touching this story.
- "Role Permission Settings" is not a separate route today; it is `RolePermissionCatalogPanel` inside `/settings`. For `chu_tich`, the correct behavior is to deny `/settings` before the page fetches/renders the panel.

### Current Code State (Read Before Editing)

- `src/lib/permissions/navigation-policy.ts` already has an exhaustive `NAVIGATION_POLICY_BY_ROLE`.
  - `chu_tich` row: `commandCenterAccess: "executiveDashboard"`, `defaultHref: "/command-center"`, `hrefs: leadershipWorkspaceHrefs`.
  - `super_admin` row: `commandCenterAccess: "executiveDashboard"`, `defaultHref: "/command-center"`, `hrefs: ["/admin", ...leadershipWorkspaceHrefs]`.
  - `canOpenCommandCenter` and `getCommandCenterLandingHref` are the current central Command Center helpers.
- `src/lib/permissions/navigation.ts` currently defines:
  - `/admin` nav item label `"Quan tri he thong"`, roles `["super_admin", "admin"]`, permissions `["settings.manage", "delegation.manage", "user.view", "audit.view"]`.
  - `/settings` nav item label `"BO Settings"`, permissions `["settings.manage", "delegation.manage"]`.
  - `/users` nav item label `"Nguoi dung"`, permission `"user.view"`.
  - `getPermittedNavItems` applies navigation policy first for policy workspace hrefs and then permission checks for business nav.
- `src/lib/permissions/navigation-context.ts` builds `shellContext.workspaceOptions` from filtered nav items. A nav fix is incomplete unless workspace selector options are also clean for `chu_tich`.
- `src/app/(dashboard)/layout.tsx` has route policies:
  - `/admin`: roles `["super_admin", "admin", "kiem_soat_noi_bo"]`.
  - `/settings`: permissions `["settings.manage", "delegation.manage"]`.
  - `/users`: permission `"user.view"`.
  The guard is in the dashboard layout before child pages render, but page-level tests should still prove protected data loaders do not run when page guard rejects.
- `src/app/(dashboard)/settings/page.tsx` calls `requireAnyPermission(["settings.manage", "delegation.manage"], { route: "/settings" })` before starting page data promises. It mounts `RolePermissionCatalogPanel` only when `canManageSettings` and `policySettings` are available.
- `src/app/(dashboard)/users/page.tsx` calls `requirePermission("user.view", { route: "/users" })` before fetching users/roles/projects/audit logs.
- `src/app/(dashboard)/admin/page.tsx` renders `WorkspaceRoutePage route="/admin"`, and `WorkspaceRoutePage` calls `requireWorkspaceRoute` before `getRoleWorkspaceData`.
- `src/lib/permissions/guard.ts` currently audits denied access via `denyWithAudit`, but there is no explicit success audit for allowed BO route access. AC4 requires adding that behavior.
- Existing tests already cover parts of the split:
  - `tests/unit/navigation-policy.test.ts` has `separates chairman leadership navigation from super admin BO navigation`.
  - `tests/unit/workspaces.test.ts` checks selected nav hrefs and direct workspace access.
  - `tests/unit/user-actions.test.ts`, `role-permission-catalog.test.ts`, `policy-settings-service.test.ts` cover direct BO mutation denies.
  - `tests/e2e/mvp-smoke.spec.ts` already has chairman and super admin route smoke; harden rather than duplicate.

### Implementation Guardrails

- Do not re-grant any BO/system permission to `chu_tich`.
- Do not solve this only by hiding sidebar items. Direct URL and direct server/action paths must fail before protected data fetch.
- Do not render `/settings` and hide `RolePermissionCatalogPanel` later for `chu_tich`; deny before page data fetch.
- Do not duplicate role allowlists across `navigation.ts`, layout, tests and pages if a central helper can own the policy.
- Do not weaken Story 2.8/2.9 guards for viewer, assistant, specialist or external roles.
- Do not add new dependencies or a new app shell.
- Audit payloads must be compact and safe; do not include users lists, settings data, role catalog contents, source records or sensitive admin data.

### Architecture Compliance

- App Router routes should enforce permission before page data fetch.
- Permission-sensitive UI must match server-side authorization but cannot be the only control.
- Cross-cutting policy belongs in `src/lib/permissions/*`; route shell logic belongs in `src/app/(dashboard)/layout.tsx`; module data fetch stays in module services.
- Services/actions should remain injectable/testable; page tests can mock guard functions and data loaders.
- Keep TypeScript strict and use `Role`, `PermissionAction`, `PolicyWorkspaceHref`, and `WorkspaceRoute` types where applicable.

### Testing Guidance

- Start fail-first with exact nav tests for `chu_tich` and `super_admin`.
- Add guard-before-fetch tests for `/settings` and `/users`; `/admin` already has a `WorkspaceRoutePage` pattern to extend.
- Add a focused audit test for allowed BO route access. Mock `createAuditLog` and assert action/payload only, not persistence internals.
- E2E should assert visible behavior/status and no sensitive text for `chu_tich`; audit success can stay unit-level.
- Run full e2e because `/settings` and `/users` cold compile can reveal timing and guard regressions.

### Latest Tech Notes

- Project baseline from context: Next.js 15.3.2 App Router, React 19, TypeScript 5.8.3, Vitest 3.1.3, Testing Library React 16.3.0, Playwright 1.52.0.
- No web research or package upgrade is needed. Use existing local permission, route guard and audit patterns.

### References

- `_bmad-output/implementation-artifacts/1-6-separate-chairman-role-from-super-admin.md` - role split, BO deny-list, mock/demo user contract and review patches.
- `_bmad-output/implementation-artifacts/2-9-role-navigation-policy-matrix-va-command-center-eligibility.md` - central navigation policy matrix, guard-before-fetch and review findings.
- `_bmad-output/planning-artifacts/epics/epic-2-workspace-iu-hnh-v-dashboard-module-1.md` - Epic 2 workspace/dashboard requirement context.
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md` - permission checks before protected data and no render-then-hide.
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md` - App Router/module/service boundaries.
- `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md` - permission-aware sidebar, 403 and unauthorized state guidance.
- `docs/context/permissions-audit.md` - no UI-only security and compact safe audit payload guidance.
- `docs/context/testing.md` - route/navigation changes need unit and e2e smoke coverage.
- `src/lib/permissions/navigation-policy.ts` - central role navigation and Command Center policy.
- `src/lib/permissions/navigation.ts` - sidebar item catalog and filtering.
- `src/lib/permissions/navigation-context.ts` - workspace/scope selector context.
- `src/app/(dashboard)/layout.tsx` - dashboard route policy enforcement.
- `src/app/(dashboard)/settings/page.tsx` - settings guard and Role Permission Catalog panel.
- `src/app/(dashboard)/users/page.tsx` - users guard and user/admin data fetch.
- `src/app/(dashboard)/admin/page.tsx` and `src/modules/workspaces/components/workspace-route-page.tsx` - admin workspace guard-before-fetch path.
- `src/lib/permissions/guard.ts` - denied access audit pattern and route guard helpers.
- `tests/unit/navigation-policy.test.ts`, `tests/unit/workspaces.test.ts`, `tests/unit/app-shell.test.tsx`, `tests/unit/workspace-route-page.test.tsx`, `tests/unit/user-actions.test.ts`, `tests/e2e/mvp-smoke.spec.ts` - regression targets.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm test -- tests/unit/navigation-policy.test.ts tests/unit/navigation-shell-policy.test.ts tests/unit/bo-route-guard.test.ts tests/unit/settings-page-policy.test.tsx tests/unit/users-page-policy.test.tsx tests/unit/workspace-route-page.test.tsx` - failed first on missing `canOpenBoRoute`/`requireBoRoute`, then passed after implementation.
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm test` - passed, 65 files / 413 tests.
- `npm run test:e2e` - passed, 58 Playwright tests.
- `npm test -- tests/unit/navigation-policy.test.ts tests/unit/navigation-shell-policy.test.ts tests/unit/bo-route-guard.test.ts tests/unit/dashboard-layout-policy.test.tsx tests/unit/settings-page-policy.test.tsx tests/unit/users-page-policy.test.tsx tests/unit/workspace-route-page.test.tsx` - passed after review patches, 7 files / 31 tests.
- `npm run typecheck` - passed after review patches.
- `npm run lint` - passed after review patches.
- `npm test` - passed after review patches, 66 files / 425 tests.
- `npm run test:e2e` - passed after review patches, 58 Playwright tests. First run hit a cold-compile timeout in project-director e2e; timeout was raised and rerun passed.

### Completion Notes List

- Added central BO route policy helpers in `navigation-policy.ts`: `BO_POLICY_HREFS`, `resolveBoPolicyHref`, `isBoPolicyHref`, and `canOpenBoRoute`.
- Routed sidebar/nav filtering and dashboard layout BO route enforcement through the central helper so `chu_tich` cannot gain BO nav through scoped/delegated context.
- Added `requireBoRoute` to deny unauthorized BO access and audit successful allowed BO route access with compact safe payload; audit write failures are swallowed.
- Added focused unit/page tests for navigation, shell workspace options, guard-before-fetch on `/admin`, `/settings`, `/users`, and BO allowed audit behavior.
- Extended e2e smoke for `chu_tich` BO denial/no BO sidebar links and `super_admin` BO sidebar/direct route access.
- Applied code review patches: explicit `chu_tich` BO deny even with replacement permissions, workspace selector now consumes policy href predicate, BO audit tests cover every BO route/root variant, and layout has focused `requireBoRoute` integration coverage.

### File List

- `_bmad-output/implementation-artifacts/2-10-chairman-admin-navigation-policy-settings.md`
- `_bmad-output/implementation-artifacts/index.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/(dashboard)/layout.tsx`
- `src/lib/permissions/guard.ts`
- `src/lib/permissions/navigation-context.ts`
- `src/lib/permissions/navigation-policy.ts`
- `src/lib/permissions/navigation.ts`
- `tests/e2e/mvp-smoke.spec.ts`
- `tests/unit/bo-route-guard.test.ts`
- `tests/unit/dashboard-layout-policy.test.tsx`
- `tests/unit/navigation-policy.test.ts`
- `tests/unit/navigation-shell-policy.test.ts`
- `tests/unit/settings-page-policy.test.tsx`
- `tests/unit/users-page-policy.test.tsx`
- `tests/unit/workspace-route-page.test.tsx`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-31 | 1.0 | Created Story 2.10 implementation guide for Chairman/Admin navigation policy settings, direct BO route guard-before-fetch, and Super Admin allowed-access audit. | Codex |
| 2026-05-31 | 1.1 | Implemented central BO route policy, sidebar/layout guard integration, allowed-access audit, unit/page coverage and e2e smoke for Story 2.10. | Codex |
| 2026-05-31 | 1.2 | Applied code review patches, added layout/audit boundary coverage, and moved story to done after validation. | Codex |
