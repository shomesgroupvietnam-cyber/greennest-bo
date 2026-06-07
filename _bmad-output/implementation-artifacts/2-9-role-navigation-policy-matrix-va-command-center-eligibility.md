# Story 2.9: Ma Trận Chính Sách Điều Hướng Theo Vai Trò Và Điều Kiện Vào Command Center

Status: done

Ghi chú tạo story: Ultimate context engine analysis completed - comprehensive developer guide created. Story này là follow-up của Story 2.1 và 2.8 để đóng khe hở còn lại: sidebar/default route/direct URL phải dùng một navigation policy matrix rõ ràng cho từng role, và `/command-center` không được render dựa trên các quyền rộng như `project.view`, route `/executive` hoặc item `common`.

## Story

As a người quản lý Module 1,
I want role navigation và Command Center eligibility được điều khiển bởi một policy matrix tập trung,
so that mỗi role chỉ thấy workspace đúng phạm vi và direct `/command-center` không lộ dashboard nội bộ.

## Tiêu Chí Chấp Nhận

1. **Policy matrix bao phu toan bo role catalog**
   - Given each role in `ROLES`
   - When sidebar renders
   - Then role only sees allowed top-level entries based on navigation policy matrix
   - And test phai fail neu them role moi trong `src/constants/roles.ts` nhung chua co row policy tuong ung
   - And navigation source of truth khong con dua vao `common: true` hay cac role/permission list song song de quyet dinh Command Center eligibility.

2. **Viewer khong duoc vao top-level Command Center neu khong co grant ro rang**
   - Given role is `viewer`
   - When opening `/command-center`
   - Then system redirects to `/viewer` or returns 403 unless explicitly granted command-center scope
   - And top-level internal Command Center dashboard is not rendered
   - And `getCommandCenterData`/dashboard DTO khong duoc fetch truoc khi guard quyet dinh allow/deny
   - And `project.view`, `document.view`, `legal.view`, hoac cac read-only permission san co cua viewer khong duoc tinh la command-center scope.

3. **Thu ky/tro ly can active delegation/scope de thay Command Center**
   - Given role is `thu_ky_tro_ly`
   - When no active delegation/scope exists
   - Then `/command-center` is hidden or denied
   - And default/app entry remains `/assistant-workspace`
   - And neu co active delegation/scope, policy chi mo cac entry duoc delegate/scope cho phep; khong tu dong mo Tong quan Truc 1 hoac Lanh dao.

4. **Specialist roles mac dinh vao specialist workspace**
   - Given role is `ky_thuat`, `thiet_ke`, or `phap_ly`
   - When opening app/login development entry
   - Then default workspace is `/technical-workspace`, `/design-workspace`, or `/legal-workspace` respectively
   - And `/command-center` is shown only if policy allows Axis 1 overview for that role or user has an explicit scoped Command Center/Axis 1 grant
   - And broad `/executive` workspace membership, `project.view`, `document.view`, `legal.view`, `design.view`, or `construction.view` does not accidentally expose the internal Command Center.

5. **Internal leadership/admin behavior va Story 2.8 external isolation khong regress**
   - Given role is `super_admin`, `admin`, `tong_giam_doc`, or `pho_tong_giam_doc`
   - When sidebar and `/command-center` render
   - Then intended Command Center/leadership access continues to work through the same policy matrix
   - And executive deep links continue guard-first behavior before data fetch
   - And `nha_thau`/`tu_van` remain barred from internal `/command-center` even with scoped executive grants, as decided in Story 2.8.

6. **Existing brittle tests are replaced by matrix tests**
   - Given existing tests only check selected role examples
   - When this story is implemented
   - Then tests assert every role policy row, every role's sidebar top-level hrefs, viewer direct `/command-center`, assistant no-delegation behavior, and specialist default routes
   - And any old expectation that external/specialist/viewer roles can see `/command-center` through generic nav behavior is removed or inverted.

## Tasks / Subtasks

- [x] Define a central navigation policy matrix (AC: 1, 2, 3, 4, 5)
  - [x] Add or refactor into a single source such as `src/lib/permissions/navigation-policy.ts`.
  - [x] Policy must be exhaustive over `Role` from `src/constants/roles.ts`.
  - [x] Each row must declare default workspace intent and allowed top-level hrefs/categories, including Command Center eligibility.
  - [x] Represent Command Center access explicitly, for example `none`, `axis1Overview`, `executiveDashboard`, `privateWorkspace`, or `scopedOnly`; exact shape can follow local style.
  - [x] Keep external roles (`nha_thau`, `tu_van`) as command-center denied regardless of scoped `/executive` route grants unless product explicitly changes Story 2.8.

- [x] Refactor sidebar filtering to use the matrix (AC: 1, 3, 4, 5, 6)
  - [x] Update `src/lib/permissions/navigation.ts` so `getPermittedNavItems` consults the matrix before permission checks for top-level workspace/Command Center items.
  - [x] Remove Command Center exposure caused by `common: true`, `/executive` workspace route mapping, or broad permissions.
  - [x] Preserve normal permission-based business links (`/projects`, `/tasks`, `/documents`, etc.) only where policy allows them for that role/scope.
  - [x] Ensure `src/lib/permissions/navigation-context.ts` workspace selector cannot reintroduce `/command-center` if nav policy denied it.

- [x] Add Command Center route eligibility guard before data fetch (AC: 2, 3, 4, 5)
  - [x] Update `src/app/command-center/page.tsx` to use the same policy decision before `getCommandCenterData`.
  - [x] For top-level `/command-center`, deny/redirect `viewer`, `thu_ky_tro_ly` without active delegation/scope, external roles, and specialists without Axis 1 policy/grant.
  - [x] Keep `executive-*` deep link guard-first semantics from `requireWorkspaceRoute("/executive")`, but do not let broad `/executive` membership override the Command Center matrix.
  - [x] Preserve Story 2.6/2.7 viewer private workspace exception only if the matrix explicitly keeps `executive-private-workspace` allowed for viewer; do not let that exception imply top-level Command Center access.

- [x] Align login/default route resolution with the matrix (AC: 3, 4, 5)
  - [x] Update `src/lib/auth/actions.ts` if `resolvePostLoginHref(next="development")` sends specialists to `/command-center?view=executive-dashboard` before their specialist workspace.
  - [x] Specialist workspace checks for `phap_ly`, `thiet_ke`, and `ky_thuat` must win over generic `/executive` route access unless the policy row explicitly says their default is Command Center.
  - [x] `thu_ky_tro_ly` default remains `/assistant-workspace` when no delegation/scope is active.
  - [x] `viewer` default remains `/viewer` unless explicit policy/scope says otherwise.

- [x] Rationalize executive/workspace route semantics without broad regressions (AC: 1, 4, 5)
  - [x] Audit `src/modules/executive/constants/index.ts` and `src/modules/workspaces/config.ts`: current `EXECUTIVE_ROUTE_ROLES` includes specialist roles as `department_head`.
  - [x] Decide whether specialist `/executive` access should remain for non-Command-Center pages. If it remains, Command Center matrix must still block sidebar/direct `/command-center` where AC says so.
  - [x] Do not remove specialist private workspaces or existing executive service behavior unless required by tests and policy.

- [x] Unit tests for matrix, nav, route guard, and defaults (AC: 1, 2, 3, 4, 5, 6)
  - [x] Add focused policy test, for example `tests/unit/navigation-policy.test.ts`, that iterates `Object.keys(ROLES)` and asserts each role has a policy row.
  - [x] Update `tests/unit/workspaces.test.ts` so role nav assertions are parameterized from policy, not selected examples only.
  - [x] Add tests for `viewer` top-level `/command-center` redirect/403 before `getCommandCenterData`.
  - [x] Add tests for `thu_ky_tro_ly` no active delegation/scope hidden/denied.
  - [x] Add tests for `phap_ly`, `thiet_ke`, `ky_thuat` default workspace and no Command Center unless Axis 1 policy/grant exists.
  - [x] Keep Story 2.8 tests proving `nha_thau`/`tu_van` do not see or enter `/command-center`.

- [x] E2E smoke coverage for role entry behavior (AC: 2, 3, 4, 5)
  - [x] Extend `tests/e2e/mvp-smoke.spec.ts` where existing role smoke tests live.
  - [x] Cover `viewer` direct `/command-center` -> `/viewer` or 403 and no internal dashboard text.
  - [x] Cover `thu_ky_tro_ly` no delegation/scope -> `/assistant-workspace` default and no Command Center sidebar/direct render.
  - [x] Cover `phap_ly`, `thiet_ke`, `ky_thuat` login/default route to specialist workspaces.
  - [x] Keep external role smoke from Story 2.8.

- [x] Validation (AC: 1, 2, 3, 4, 5, 6)
  - [x] Run focused unit tests for changed files.
  - [x] Run `npm run typecheck`.
  - [x] Run `npm run lint`.
  - [x] Run `npm run test`.
  - [x] Run `npm run test:e2e` because login/direct route behavior changes.

### Review Findings

- [x] [Review][Patch] Command Center view policy fails open for non-Axis-1 views [src/lib/permissions/navigation-policy.ts:299]
- [x] [Review][Patch] Command Center policy ignores inactive role templates [src/lib/permissions/navigation-policy.ts:286]
- [x] [Review][Patch] Delegated permissions are flattened without selected-scope matching [src/lib/permissions/navigation-policy-context.ts:60]
- [x] [Review][Patch] Scoped Axis 1 users can still open internal overview/operations views client-side [src/modules/command-center/services/command-center-service.ts:660]
- [x] [Review][Patch] Delegated Axis 1 access is not converted into a scoped data boundary [src/lib/permissions/navigation-policy-context.ts:113]
- [x] [Review][Patch] Delegated permissions are ignored by normal navigation item filtering [src/lib/permissions/navigation.ts:306]
- [x] [Review][Patch] Axis 1 Command Center href is omitted from workspace selector allowlist [src/lib/permissions/navigation-context.ts:23]
- [x] [Review][Patch] External scoped users can regain broad internal business navigation through base role permissions [src/lib/permissions/navigation.ts:400]
- [x] [Review][Patch] Inactive role templates can redirect back to protected Command Center defaults [src/app/command-center/page.tsx:71]
- [x] [Review][Patch] Executive Command Center access still fails open for unrecognized view keys [src/lib/permissions/navigation-policy.ts:336]

## Dev Notes

### Required Policy Baseline

Use this baseline unless product changes it during implementation:

- `super_admin`, `admin`, `tong_giam_doc`, `pho_tong_giam_doc`: Command Center allowed as today; leadership/admin behavior must stay working.
- Roles with explicit Axis 1 overview policy/grant may see `/command-center` only for the allowed Axis 1 overview surface. Do not infer this from `/executive` route membership alone.
- `viewer`: `/viewer` default; `/command-center` hidden/denied unless explicit scoped Command Center/Axis 1 grant exists.
- `thu_ky_tro_ly`: `/assistant-workspace` default; `/command-center` hidden/denied when no active delegation/scope exists.
- `phap_ly`, `thiet_ke`, `ky_thuat`: specialist defaults; `/command-center` hidden unless policy row or scoped grant explicitly allows Axis 1 overview.
- `nha_thau`, `tu_van`: `/contractor` and `/consultant`; internal Command Center always hidden/denied per Story 2.8.
- `pending`: only pending access surface.

The implementation may expose the matrix as role rows, role groups, or generated rows, but tests must prove every `Role` has an intentional policy.

### Current Code State (Read Before Editing)

- `src/constants/roles.ts` defines all roles and `ROLE_DEFAULT_SCREENS`. Specialist defaults already point to `/legal-workspace`, `/design-workspace`, and `/technical-workspace`; Story 2.9 must make login/navigation honor those defaults.
- `src/lib/auth/actions.ts` currently checks `canAccessWorkspaceRoute(session.user, "/executive")` before specialist workspace checks during `next === "development"`. Because `/executive` includes several specialists, login can land them in Command Center instead of their specialist workspaces.
- `src/modules/executive/constants/index.ts` maps `phap_ly`, `thiet_ke`, `ky_thuat`, `thi_cong`, `qa_qc_chat_luong`, `an_toan_lao_dong`, and other department roles into `EXECUTIVE_ACCESS_BY_ROLE` as `department_head`; `EXECUTIVE_ROUTE_ROLES` is derived from this map.
- `src/modules/workspaces/config.ts` sets `/executive.roles = EXECUTIVE_ROUTE_ROLES`; `canAccessWorkspaceRoute(user, "/executive")` therefore returns true for those department roles.
- `src/lib/permissions/navigation.ts` maps `/command-center?view=executive-dashboard` to workspace route `/executive`; this can expose the "Lanh dao" item if only `/executive` route access is checked.
- `src/lib/permissions/navigation.ts` has `/command-center` as a top-level `common` item. Story 2.8 added external-role blocking, but internal roles like `viewer`, `thu_ky_tro_ly`, and specialists still need matrix-level eligibility.
- `src/lib/permissions/navigation-context.ts` builds workspace options from filtered nav items and a workspace href allowlist. If `/command-center` still appears after the policy filter, audit this builder.
- `src/app/command-center/page.tsx` uses `requireWorkspaceRoute("/executive")` for most `executive-*` views and `requireAuthenticatedSession({ route: "/command-center" })` for top-level/private-workspace paths. That is not sufficient for Story 2.9 because authenticated viewers/specialists can reach top-level before policy guard unless explicitly denied.
- `src/lib/permissions/guard.ts` already has server-side patterns: `requireAuthenticatedSession`, `requirePermission`, `requireWorkspaceRoute`, audit, and `forbidden()`. Reuse or extend these patterns; do not create client-only security.
- `tests/unit/workspaces.test.ts` currently has role default and selected sidebar assertions. Convert/add tests so the matrix is exhaustive over roles.
- `tests/unit/command-center-page.test.tsx` already checks guard-before-fetch for executive deep links and Story 2.8 external redirect. Add viewer/assistant/specialist cases here.
- `tests/e2e/mvp-smoke.spec.ts` already contains command-center and role smoke coverage; extend this file instead of creating an overlapping e2e suite unless there is a clear reason.

### Implementation Guardrails

- Do not rely on UI hiding alone. Direct `/command-center` must be denied/redirected server-side before internal DTO fetch.
- Do not use generic read permissions (`project.view`, `task.view`, `document.view`, `legal.view`, `design.view`, `construction.view`) as Command Center eligibility.
- Do not let `/executive` workspace route access automatically imply `/command-center` access. Treat Command Center as its own policy surface.
- Do not duplicate role allowlists in `navigation.ts`, `actions.ts`, and `page.tsx`. Put eligibility in one helper/module and consume it from nav, login, and route guard paths.
- Do not break Story 2.8: external roles stay out of internal Command Center even if scoped route assignments include `/executive`.
- Do not remove record-level filtering for external/viewer roles while changing entry policy.
- Do not introduce new dependencies, API routes, or a new app shell for this story.

### Architecture Compliance

- Follow Next.js App Router server guard pattern. Route authorization belongs in server components/actions/services, not only in React component visibility.
- Permission-sensitive DTOs must not be fetched before authorization completes.
- Keep source organization under current modules: permissions logic in `src/lib/permissions/*`, role constants in `src/constants/*`, workspace definitions in `src/modules/workspaces/*`, route page in `src/app/command-center/page.tsx`.
- Keep TypeScript strict: avoid stringly typed role/href rows where `Role`, `PermissionAction`, or `WorkspaceRoute` types can enforce coverage.
- If adding policy helpers, export small functions such as `getNavigationPolicyForRole`, `canOpenCommandCenter`, or `getDefaultWorkspaceForRole` only where they are consumed.

### UX Guardrails

- Sidebar must be role-first and sparse when a role has limited scope. It is acceptable for viewer/assistant/external users to have fewer top-level entries.
- Denial/redirect page must not display internal Command Center headings, KPI names, leadership tabs, or dashboard data.
- Specialist users should land directly in their operational workspace; avoid a leadership dashboard first hop unless policy explicitly grants Axis 1 overview.
- Do not add visible explanatory copy to the app just to explain this policy. The behavior should be encoded in nav/default route/guard.

### Previous Story Intelligence

- Story 2.1 established PermissionAwareShell, route-aware navigation, and direct unauthorized guard-before-fetch behavior.
- Story 2.6/2.7 introduced viewer read-only private workspace behavior. Top-level `/command-center` denial must not accidentally delete a still-required private-workspace exception; make the distinction explicit in policy/tests.
- Story 2.8 completed external isolation and made a review decision: external roles are always barred from internal Command Center even with scoped `/executive` grants.
- Story 2.8 changed old `contractorNav contains /command-center` expectations. Story 2.9 generalizes that fix to all roles through a policy matrix.

### Testing Guidance

- Start with a failing policy/nav unit test that iterates all `ROLES`.
- Add guard-before-fetch tests in `tests/unit/command-center-page.test.tsx` before editing the route page.
- Prefer table-driven tests for role defaults and Command Center visibility.
- Include negative assertions for dashboard data fetch, not only URL/status.
- If route denies with 403, assert status/body does not render internal headings. If redirecting, assert target route (`/viewer`, `/assistant-workspace`, or specialist workspace) and no data fetch.

### Latest Tech Notes

- Project baseline from context: Next.js 15.3.2 App Router, React 19, TypeScript strict, Vitest 3.1.3, Testing Library React 16.3.0, Playwright 1.52.0.
- No web research or package upgrade is needed. Use existing local permission, workspace, and test patterns.

### References

- `_bmad-output/implementation-artifacts/2-1-permission-aware-shell-va-workspace-entry.md` - permission-aware shell and direct route guard precedent.
- `_bmad-output/implementation-artifacts/2-6-private-workspace-theo-vai-tro.md` - viewer/private workspace behavior to preserve if still covered by policy.
- `_bmad-output/implementation-artifacts/2-7-drill-down-unauthorized-va-responsive-qa-cho-workspace.md` - unauthorized/403 no-leak patterns.
- `_bmad-output/implementation-artifacts/2-8-external-role-workspace-isolation-va-command-center-guard.md` - external role isolation and review decision.
- `_bmad-output/planning-artifacts/epics/epic-2-workspace-iu-hnh-v-dashboard-module-1.md` - Epic 2 workspace/dashboard requirements.
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md` - permission checks before protected data and route/service consistency.
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md` - App Router/module boundaries.
- `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md` - permission-aware sidebar and workspace selector expectations.
- `docs/context/permissions-audit.md` - no UI-only security, direct URL guard, no render-then-hide.
- `docs/context/testing.md` - route/navigation changes need unit and e2e smoke coverage.
- `src/constants/roles.ts` - role catalog and role default screens.
- `src/lib/permissions/navigation.ts` - current nav item/filter source.
- `src/lib/permissions/navigation-context.ts` - shell workspace/scope option builder.
- `src/lib/auth/actions.ts` - login/default route resolution.
- `src/app/command-center/page.tsx` - direct route guard before Command Center DTO fetch.
- `src/modules/executive/constants/index.ts` - current executive role/access mapping.
- `src/modules/workspaces/config.ts` - workspace route access definitions.
- `tests/unit/workspaces.test.ts` - role default/sidebar regression tests.
- `tests/unit/command-center-page.test.tsx` - guard-before-fetch route tests.
- `tests/e2e/mvp-smoke.spec.ts` - login/direct route smoke coverage.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-30: Confirmed fail-first unit coverage for missing `navigation-policy`, top-level `/command-center` guard gaps, and development login default gaps.
- 2026-05-30: Implemented central role navigation policy, connected sidebar/nav shell, route guard, login default routing, and Command Center DTO eligibility.
- 2026-05-30: First `npm run test:e2e` attempt timed out after surfacing Next Server Action export restriction for a sync helper in `actions.ts`; fixed by moving post-login routing to a non-server-action module.
- 2026-05-30: Final validation passed: focused unit tests, `npm run typecheck`, `npm run lint`, full `npm run test`, and `npm run test:e2e`.
- 2026-05-30: Added fail-first coverage for `giam_doc_du_an` Axis 1 Command Center landing, direct `/command-center` redirect, role workspace return link, inactive role blocking, and selected-scope delegation filtering.
- 2026-05-30: Addressed review follow-ups and user P1/P2 cases; validation passed with focused unit tests, `npm run typecheck`, `npm run lint`, full `npm run test`, and `npm run test:e2e`.

### Completion Notes List

- Added an exhaustive `Role` keyed navigation policy matrix with explicit Command Center access modes: `none`, `axis1Overview`, `executiveDashboard`, `privateWorkspace`, and `scopedOnly`.
- Refactored sidebar filtering and navigation shell context so top-level workspace entries, Command Center, and scoped/delegated visibility flow through the matrix before permission checks.
- Added server-side `/command-center` eligibility guard before `getCommandCenterData`; viewer/assistant/specialist/external denials redirect before DTO fetch, while viewer private workspace remains explicit.
- Moved development post-login routing to policy-backed defaults, preserving leadership/admin Command Center entry and sending `phap_ly`, `thiet_ke`, `ky_thuat`, `thu_ky_tro_ly`, and `viewer` to their intended workspaces.
- Kept `/executive` workspace route semantics intact for non-Command-Center pages, but stopped `/executive` membership and generic read permissions from granting Command Center/dashboard DTOs.
- Added matrix/unit/E2E coverage for exhaustive policy rows, sidebar workspace hrefs, scoped Axis 1 behavior, top-level guard-before-fetch, specialist defaults, assistant no-command-center behavior, viewer redirect, and external isolation.
- Resolved Command Center view fail-open by restricting Axis 1 grants to `/command-center?view=axis1-search-development` and keeping unrelated views such as `operations-dashboard` leadership-only.
- Redirected direct `/command-center` for Axis 1 overview users to the Axis 1 view before `getCommandCenterData`, preserving `/project-workbench` as the `giam_doc_du_an` login default.
- Added a role default workspace return link in Command Center for project/specialist-style roles, e.g. `Quay lai Ban du an` for `giam_doc_du_an`.
- Resolved review findings for inactive role templates and selected-scope delegation filtering in the centralized Command Center access context.

### File List

- `_bmad-output/implementation-artifacts/2-9-role-navigation-policy-matrix-va-command-center-eligibility.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/command-center/page.tsx`
- `src/lib/auth/actions.ts`
- `src/lib/auth/post-login-routing.ts`
- `src/lib/permissions/navigation.ts`
- `src/lib/permissions/navigation-context.ts`
- `src/lib/permissions/navigation-policy.ts`
- `src/lib/permissions/navigation-policy-context.ts`
- `src/modules/axis-1/components/axis-one-badges.tsx`
- `src/modules/axis-1/components/axis-one-dashboard.tsx`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `src/modules/command-center/services/command-center-service.ts`
- `tests/e2e/mvp-smoke.spec.ts`
- `tests/unit/auth-actions.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/command-center-page.test.tsx`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/navigation-policy.test.ts`
- `tests/unit/workspaces.test.ts`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-30 | 1.0 | Created Story 2.9 implementation guide for role navigation policy matrix and Command Center eligibility. | Codex |
| 2026-05-30 | 1.1 | Implemented role navigation policy matrix, Command Center eligibility guards, default route alignment, and regression coverage. | Codex |
| 2026-05-30 | 1.2 | Resolved Command Center Axis 1 landing, direct-route normalization, workspace return link, and review follow-up patches. | Codex |
