# Story 1.6: Tách Vai Trò Chủ Tịch Khỏi Super Admin

Status: done

Ghi chú tạo story: Ultimate context engine analysis completed - comprehensive developer guide created. Story này bổ sung vào Epic 1 vì đây là nền role/RBAC contract, không chỉ là navigation tweak. Phạm vi là tách vai trò Chủ tịch điều hành (`chu_tich`) khỏi `super_admin` kỹ thuật/BO, đồng bộ role catalog, seed/demo user, navigation/default route và test coverage.

## Story

As a người quản lý RBAC Module 1,
I want vai trò Chủ tịch điều hành được tách riêng khỏi Super Admin kỹ thuật/BO,
so that Chủ tịch có quyền điều hành nghiệp vụ nhưng không mặc định nắm giữ quyền quản trị hệ thống, người dùng, settings và role catalog.

## Tiêu Chí Chấp Nhận

1. **Role catalog tách `chu_tich` và `super_admin`**
   - Given static role catalog và role-permission catalog load
   - When hệ thống liệt kê roles
   - Then có role mới `chu_tich` label "Chủ tịch" và default route `/command-center`
   - And `super_admin` được đổi meaning thành technical/business super admin, label/description không còn đồng nghĩa "Chủ tịch/Super Admin"
   - And mọi `Record<Role, ...>`/policy row/default screen/role scope phải exhaustive, compile fail nếu thiếu `chu_tich`.

2. **Chủ tịch có quyền điều hành nhưng không có BO/system permissions**
   - Given user role `chu_tich`
   - When runtime permission check chạy
   - Then role có các quyền điều hành cần thiết cho Module 1: `axis1.view`, dashboard/project/task/document/legal/meeting/decision/proposal approval, risk/approval visibility, `finance.view` và finance-sensitive approval nếu workflow hiện có cần
   - And role không có BO permissions: `settings.manage`, `user.invite`, `user.update_role`, `user.view`, role-permission catalog config, `/admin`, `/settings`, `/users`
   - And `delegation.manage` không được gán cho `chu_tich` nếu vẫn là BO-level permission; nếu cần ủy quyền nghiệp vụ riêng thì tạo/tách permission nghiệp vụ riêng và test deny-list cũ vẫn pass.

3. **Super Admin có toàn bộ quyền Chủ tịch cộng BO/system**
   - Given user role `super_admin`
   - When permission/nav/default route được resolve
   - Then `super_admin` có tất cả quyền của `chu_tich` cộng `settings.manage`, `user.invite`, `user.update_role`, `user.view`, `delegation.manage`, role catalog config, audit/system/AI config permissions
   - And `super_admin` tiếp tục vào `/command-center` theo khuyến nghị, với BO là menu/workspace riêng
   - And role `admin` không bị cấp lại business approval permissions nếu trước đó đã được tách khỏi approval authority.

4. **Seed/demo user va policy threshold dong bo meaning moi**
   - Given `npm run seed:demo` hoac local/staging seed SQL chay
   - When seed output duoc doc
   - Then `chairman-01` co role `chu_tich`
   - And co user moi `super-admin-01` role `super_admin` cho technical/BO/system smoke
   - And mock session/login role mapping, `.mock-data/users.json`, `tests/fixtures/module-one-acceptance.json`, Supabase demo seed va docs khong con map chairman persona vao `super_admin`
   - And approval/policy fixture nao dang dung approver role `super_admin` cho "CHAIRMAN" business approval phai duoc doi sang `chu_tich`, tru khi test ghi ro super admin override/system path.

5. **Navigation và default route đúng ranh giới Chủ tịch vs BO**
   - Given role `chu_tich`
   - When sidebar/workspace selector/default login render
   - Then user thấy "Tổng quan Trục 1" và "Lãnh đạo"
   - And không thấy "Quản trị Chủ tịch"/BO admin entry, `/admin`, `/settings`, `/users`
   - And direct `/admin`, `/settings`, `/users` bị deny/redirect trước khi render BO data
   - Given role `super_admin`
   - Then user thấy các phần Chủ tịch/công cụ lãnh đạo cộng BO/system navigation.

6. **Regression tests va e2e bao phu role split**
   - Given test suite chay
   - Then unit tests verify `chu_tich` permission allow/deny matrix, `super_admin` superset, role catalog defaults, navigation policy exhaustive, seed persona mapping, default route va direct-route deny
   - And e2e cover `chu_tich` login vao `/command-center`, khong thay/khong vao `/admin`/`/settings`/`/users`, va `super_admin` login vao `/command-center` nhung co BO navigation
   - And existing external/viewer/specialist Command Center guards tu Story 2.8/2.9 khong regress.

## Tasks / Subtasks

- [x] Update static role foundation (AC: 1, 2, 3)
  - [x] Add canonical role key `chu_tich` in `src/constants/roles.ts`; use this key, not `chairman`, to match existing Vietnamese snake_case role catalog.
  - [x] Update `ROLES`, `Role`, `BASIC_ROLE_GROUPS`, `ROLE_DEFAULT_SCREENS`, labels and descriptions so `super_admin` means technical/business super admin rather than Chairman.
  - [x] Update `src/lib/permissions/can.ts` so `ROLE_PERMISSIONS.chu_tich` has business/executive permissions but excludes BO deny-list: `settings.manage`, `user.invite`, `user.update_role`, `user.view`, `delegation.manage` unless split into a new non-BO permission.
  - [x] Keep `ROLE_PERMISSIONS.super_admin` as all permissions or explicit superset of `chu_tich` + BO/system.
  - [x] Update tests that import/iterate `Role` so adding `chu_tich` is covered everywhere.

- [x] Update role-permission catalog and persistence seeds (AC: 1, 2, 3, 4)
  - [x] Update `src/modules/settings/services/role-permission-catalog-repository.ts` role scopes/default templates for `chu_tich`.
  - [x] Update `database/seeds/001_roles_permissions.sql` to insert `chu_tich`, adjust `super_admin` label/description, and seed role permissions with the same allow/deny matrix as TypeScript.
  - [x] Search migrations/seeds/verification for hardcoded `super_admin` as Chairman approver and update business approval rows to `chu_tich` where the semantic role is Chairman.
  - [x] Preserve catalog mutation guard where only `super_admin` can change business approval mappings, because `chu_tich` must not manage the role catalog.
  - [x] Update role/user guide docs/scripts if they describe `super_admin` as Chairman.

- [x] Update mock/demo persona contract (AC: 4)
  - [x] Update `tests/fixtures/module-one-acceptance.json`: `chairman-01.role = "chu_tich"`, add `super-admin-01` role `super_admin`, and update scope assignments/role-permission catalog entries.
  - [x] Update `scripts/seed-demo.mjs` so generated `.mock-data/users.json`, `role-permission-catalog.json`, `scope-assignments.json`, `policy-settings.json`, and `proposals.json` reflect the new roles.
  - [x] Update `src/lib/auth/mock-session.ts` so selecting mock role `chu_tich` returns `chairman-01`, and selecting `super_admin` returns `super-admin-01`.
  - [x] Update `database/seeds/003_module1_acceptance_demo.sql` and related verification SQL/docs for the two personas.
  - [x] Run `npm run seed:demo` after changes and include generated `.mock-data` files in the File List if they change.

- [x] Update navigation, workspaces and command-center eligibility (AC: 5)
  - [x] Update `src/lib/permissions/navigation-policy.ts`: add `chu_tich` row with `executiveDashboard` Command Center access and no `/admin`; keep `super_admin` with leadership + BO workspace hrefs.
  - [x] Update `src/lib/permissions/navigation.ts` so BO/admin nav roles use `super_admin`/`admin` as intended, while `chu_tich` only gets leadership entries by policy/permissions.
  - [x] Update `src/modules/workspaces/config.ts` and `src/modules/executive/constants/index.ts` so `chu_tich` has executive owner access, but not `/admin`; `super_admin` retains owner/BO access.
  - [x] Update `src/lib/auth/post-login-routing.ts` operational-owner/default lists so `chu_tich` and `super_admin` route to `/command-center`/operations as intended.
  - [x] Audit `src/modules/command-center/services/command-center-service.ts`, executive dashboard/common-center services and any hardcoded `["super_admin", "admin", "tong_giam_doc"]` leadership bypass lists; include `chu_tich` where business leadership is intended and keep `super_admin` where system override is intended.
  - [x] Rename or clarify BO navigation label if needed so `super_admin` BO menu is not mislabeled as a Chairman-only admin surface.

- [x] Update route guards and settings/users access tests (AC: 2, 5, 6)
  - [x] Ensure `/admin`, `/settings`, `/users` deny `chu_tich` before protected BO data render.
  - [x] Ensure `/command-center`, executive dashboard/approval/decision/meeting views allow `chu_tich`.
  - [x] Ensure `super_admin` can access both leadership surfaces and BO routes.
  - [x] Keep Story 2.8/2.9 restrictions for external roles, viewer, assistant no-scope and specialists.

- [x] Update unit/component/e2e coverage (AC: 1, 2, 3, 4, 5, 6)
  - [x] Update `tests/unit/constants.test.ts`, `tests/unit/permissions.test.ts`, `tests/unit/role-permission-catalog.test.ts`, `tests/unit/navigation-policy.test.ts`, `tests/unit/workspaces.test.ts`, and `tests/unit/auth-actions.test.ts`.
  - [x] Update `tests/unit/module-one-seed-fixtures.test.ts` to assert `chairman-01` uses `chu_tich`, `super-admin-01` exists, and `chu_tich` lacks BO deny-list permissions.
  - [x] Update command-center/executive service tests where Chairman/Super Admin behavior was previously represented by `super_admin`.
  - [x] Update `tests/e2e/mvp-smoke.spec.ts` for `chu_tich` and `super_admin` login/navigation/direct-route smoke.
  - [x] Add negative assertions that `chu_tich` does not see `/admin`, `/settings`, `/users`, and cannot mutate role/user/settings config through direct server action tests where existing patterns allow.

- [x] Validation (AC: 1, 2, 3, 4, 5, 6)
  - [x] Run targeted tests for permissions, role catalog, navigation policy, workspaces, auth actions, seed fixtures, command-center/executive services and route guards.
  - [x] Run `npm run typecheck`.
  - [x] Run `npm run lint`.
  - [x] Run `npm run test`.
  - [x] Run `npm run test:e2e` because login/default route/navigation behavior changes.

### Review Findings

- [x] [Review][Patch] DB migration/seed policy rows can leave `approval_over_2b` routed to stale `super_admin` or skip `chu_tich` when the role/permission is not already present [database/migrations/202605230004_create_policy_settings.sql:227]
- [x] [Review][Patch] SQL `super_admin` role seed is not a full `chu_tich` superset; it omits Chairman approval permissions such as `document.approve`, `legal.approve`, and `decision.approve` [database/seeds/001_roles_permissions.sql:117]
- [x] [Review][Patch] Mock/file-backed role catalogs and scope assignments diverge from SQL/static permissions for `chu_tich` and `super_admin`, so mock mode and Supabase mode can disagree on approvals/AI/admin powers [tests/fixtures/module-one-acceptance.json:268]
- [x] [Review][Patch] `admin` still has executive approval authority through executive access policy and Command Center action-role checks despite the permission matrix removing business approval powers [src/modules/executive/constants/index.ts:45]
- [x] [Review][Patch] BO deny-list assertions for `chu_tich` are too weak because `not.toEqual(expect.arrayContaining(...))` can pass when only one forbidden permission leaks, and the checks omit `user.view` [tests/unit/role-permission-catalog.test.ts:61]
- [x] [Review][Patch] Generated policy/verification coverage does not assert the required `CHAIRMAN -> chu_tich` approver mapping or exact chairman/super-admin email and scope role mappings [tests/unit/module-one-seed-fixtures.test.ts:184]
- [x] [Review][Patch] Direct deny coverage is incomplete for `/settings`, `/users`, and BO mutation/action paths; `/admin` is covered more strongly than the rest of the deny-list surface [tests/unit/workspaces.test.ts:235]
- [x] [Review][Patch] App-shell test fixture uses a `chu_tich` session while injecting an `/admin` navigation item, which can normalize the exact BO navigation leak the story is meant to prevent [tests/unit/app-shell.test.tsx:24]

## Dev Notes

### Product Decision

- Use `chu_tich` as the canonical new role key. This matches existing role naming (`tong_giam_doc`, `pho_tong_giam_doc`, `thu_ky_tro_ly`) and avoids mixing English `chairman` into the role catalog.
- `chu_tich` is a business/executive role. It should approve/decide/see sensitive business data, but must not manage BO/system configuration.
- `super_admin` is a technical/business super admin. It should keep all business powers of `chu_tich` plus BO/system permissions.
- Treat `delegation.manage` as BO-level for this story. If product later needs Chairman-owned delegation configuration, add a separate business permission instead of granting `delegation.manage` to `chu_tich`.

### Current Code State (Read Before Editing)

- `src/constants/roles.ts` currently has no `chu_tich`; `super_admin` is labeled "Chu tich/Super Admin" and defaults to `/command-center`.
- Adding `chu_tich` to `ROLES` will require updates to exhaustive `Record<Role, ...>` objects: `ROLE_DEFAULT_SCREENS`, `ROLE_PERMISSIONS`, `roleScopes`, `NAVIGATION_POLICY_BY_ROLE`, and tests iterating `ROLES`.
- `src/lib/permissions/can.ts` currently sets `super_admin: allPermissions`; `admin` filters business approval permissions. Add `chu_tich` explicitly rather than deriving from `super_admin`, so BO deny-list is visible in tests.
- `src/modules/settings/services/role-permission-catalog-service.ts` guards catalog mutations with `settings.manage` and only `super_admin` can change business approval mappings. Keep that behavior; `chu_tich` should not have `settings.manage`.
- `src/modules/settings/components/role-permission-catalog-panel.tsx` uses `currentRole === "super_admin"` to allow editing business approval mappings. That should remain system-admin only unless product decides otherwise.
- `src/lib/permissions/navigation-policy.ts` currently treats `super_admin`, `admin`, `tong_giam_doc`, `pho_tong_giam_doc` as static Command Center leadership roles. Add `chu_tich` intentionally; decide whether `admin` remains leadership-visible or only BO based on current tests/product expectations.
- `src/lib/permissions/navigation.ts` has `/admin` nav roles `["super_admin", "admin"]`; `chu_tich` must not be added there.
- `src/modules/workspaces/config.ts` grants `/admin` to `super_admin`, `admin`, `kiem_soat_noi_bo`; keep `chu_tich` out. It returns true for all routes when `user.role === "super_admin"`; that is acceptable for technical super admin, not for `chu_tich`.
- `src/modules/executive/constants/index.ts` maps `super_admin` to `owner`; `chu_tich` should also map to owner-level executive access.
- `src/lib/auth/post-login-routing.ts` has operational owner roles `["super_admin", "tong_giam_doc", "pho_tong_giam_doc"]`; include `chu_tich` where leadership operations access is intended.
- `src/modules/command-center/services/command-center-service.ts`, `executive-dashboard-service.ts`, and `executive-common-center-service.ts` contain hardcoded leadership/global-scope role arrays including `super_admin`, `admin`, `tong_giam_doc`. Audit each: add `chu_tich` for business leadership bypass, keep `super_admin` for system override, avoid widening `admin` accidentally.
- `src/app/(dashboard)/layout.tsx` protects `/users` by `user.view` and `/settings` by `settings.manage`/`delegation.manage`. Since `chu_tich` lacks those permissions, direct access should deny before data render.

### Seed And Demo State

- `tests/fixtures/module-one-acceptance.json` currently maps `chairman-01` to role `super_admin` and uses role label "Chu tich/Super Admin".
- `src/lib/auth/mock-session.ts` currently maps mock role `super_admin` to `chairman-01`.
- `.mock-data/users.json`, `.mock-data/role-permission-catalog.json`, `.mock-data/scope-assignments.json` mirror that old mapping.
- `database/seeds/003_module1_acceptance_demo.sql` currently creates chairman email with role `super_admin`; add separate super admin demo user and update workspace membership/scope assignment.
- `database/seeds/001_roles_permissions.sql`, `database/verification/006_module1_acceptance_seed.sql`, and policy settings fixtures currently use `super_admin` for "CHAIRMAN" approval threshold. Change business approver role to `chu_tich` so the data model reflects the new business role.

### Implementation Guardrails

- Do not solve this as navigation-only hiding. Runtime permissions, route guards, seed catalog and policy fixtures must agree.
- Do not leave `chairman-01` with `super_admin` in any mock/session/fixture path.
- Do not grant `settings.manage`, `user.invite`, `user.update_role`, `user.view`, or role catalog config powers to `chu_tich`.
- Do not remove BO/system access from `super_admin`.
- Do not give `admin` broad business approval powers while touching this area.
- Do not rely on `permissionsMode: replace` as the main fix for `chu_tich`; the static role and catalog defaults should be correct.
- Do not introduce a new auth provider, DB schema rewrite, UI shell rewrite or dependency upgrade.
- Preserve mock/file-backed and Supabase seed parity.

### Testing Guidance

- Start with fail-first unit tests for `chu_tich` in `permissions.test.ts`, `navigation-policy.test.ts`, and `module-one-seed-fixtures.test.ts`.
- Add direct route guard coverage for `/admin`, `/settings`, `/users` using the existing guard/action/page test patterns.
- E2E should cover behavior, not implementation details: `chu_tich` login enters Command Center and has no BO nav; direct BO routes do not render BO content; `super_admin` can still reach BO nav.
- Run `npm run seed:demo` before fixture assertions if seed output is committed or tested.

### Latest Tech Notes

- Project baseline from context: Next.js 15.3.2 App Router, React 19, TypeScript strict, Vitest 3.1.3, Testing Library React 16.3.0, Playwright 1.52.0.
- No web research or package upgrade is needed. This story uses local RBAC, seed, navigation and test patterns only.

### References

- `_bmad-output/implementation-artifacts/1-1-role-template-va-permission-catalog-cho-module-1.md` - role/permission catalog foundation and admin-vs-business approval separation.
- `_bmad-output/implementation-artifacts/1-5-seed-data-dieu-hanh-cho-nghiem-thu-module-1.md` - current seed/demo persona contract that still maps chairman to super_admin.
- `_bmad-output/implementation-artifacts/2-9-role-navigation-policy-matrix-va-command-center-eligibility.md` - centralized navigation policy and Command Center eligibility guard.
- `docs/context/permissions-audit.md` - no UI-only security; permission checks before sensitive DTO/mutations.
- `docs/context/testing.md` - route/navigation changes require unit and e2e smoke coverage.
- `src/constants/roles.ts` - static role keys, labels and defaults.
- `src/lib/permissions/can.ts` - canonical permissions and `ROLE_PERMISSIONS`.
- `src/modules/settings/services/role-permission-catalog-repository.ts` - default role templates and role scopes.
- `src/modules/settings/services/role-permission-catalog-service.ts` - catalog mutation permissions and business approval mapping guard.
- `src/lib/permissions/navigation-policy.ts` - role navigation/Command Center source of truth.
- `src/lib/permissions/navigation.ts` - sidebar item catalog and filtering.
- `src/modules/workspaces/config.ts` - direct workspace access definitions.
- `src/modules/executive/constants/index.ts` - executive access level mapping.
- `src/lib/auth/mock-session.ts` - mock role to demo user mapping.
- `src/lib/auth/post-login-routing.ts` - default route resolution.
- `src/app/(dashboard)/layout.tsx` - `/users` and `/settings` route permissions.
- `tests/fixtures/module-one-acceptance.json` - acceptance persona fixture.
- `scripts/seed-demo.mjs` - deterministic mock seed writer.
- `database/seeds/001_roles_permissions.sql` - Supabase/local role-permission baseline.
- `database/seeds/003_module1_acceptance_demo.sql` - Module 1 demo users and assignments.
- `tests/unit/permissions.test.ts`, `tests/unit/role-permission-catalog.test.ts`, `tests/unit/navigation-policy.test.ts`, `tests/unit/workspaces.test.ts`, `tests/unit/module-one-seed-fixtures.test.ts`, `tests/e2e/mvp-smoke.spec.ts` - expected regression test targets.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- RED focused test run failed before implementation: `npm run test -- tests/unit/constants.test.ts tests/unit/permissions.test.ts tests/unit/role-permission-catalog.test.ts tests/unit/navigation-policy.test.ts tests/unit/workspaces.test.ts tests/unit/auth-actions.test.ts tests/unit/module-one-seed-fixtures.test.ts tests/unit/command-center-page.test.tsx tests/unit/executive-service.test.ts tests/unit/app-shell.test.tsx`
- GREEN focused test run passed after implementation: same command above, 10 files / 87 tests.
- Final validation passed: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`.
- Review patch validation passed: `npm run seed:demo`; `npm run test -- tests/unit/role-permission-catalog.test.ts tests/unit/module-one-seed-fixtures.test.ts tests/unit/policy-settings-service.test.ts tests/unit/workspaces.test.ts tests/unit/app-shell.test.tsx tests/unit/user-actions.test.ts tests/unit/executive-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/permissions.test.ts tests/unit/navigation-policy.test.ts tests/unit/command-center-service.test.ts`; `npm run typecheck`; `npm run test:e2e`; `npm run lint`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Implemented `chu_tich` as a separate executive/business role with Command Center, approval, decision, meeting, finance-sensitive and AI action confirmation permissions while excluding BO/system permissions.
- Reframed `super_admin` as technical/BO super admin with full permission superset and separate demo/mock user `super-admin-01`.
- Updated navigation policy, Command Center availability, executive access and `/admin` layout guard so `chu_tich` cannot see or directly open BO surfaces while `super_admin` can.
- Updated mock fixture, seed generator, generated mock-data, SQL seeds/migrations/verification and docs/scripts so chairman business approvals use `chu_tich`.
- Added/updated unit, component and e2e coverage for permission matrix, role catalog, navigation, route guards, seed personas, Command Center settings visibility and approval flows.
- Applied all 8 code-review patches: policy seed conflict update, SQL/static/mock permission parity, admin approval de-authority, stronger BO deny assertions, exact seed/policy verification, direct BO mutation coverage and normalized app-shell fixture.

### File List

- `_bmad-output/implementation-artifacts/1-6-separate-chairman-role-from-super-admin.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `.mock-data/users.json`
- `.mock-data/role-permission-catalog.json`
- `.mock-data/scope-assignments.json`
- `.mock-data/policy-settings.json`
- `.mock-data/proposals.json`
- `database/migrations/202605220003_add_axis1_permission.sql`
- `database/migrations/202605230004_create_policy_settings.sql`
- `database/seeds/001_roles_permissions.sql`
- `database/seeds/003_module1_acceptance_demo.sql`
- `database/verification/006_module1_acceptance_seed.sql`
- `docs/development/README.md`
- `scripts/generate-role-user-guides-docx.ps1`
- `scripts/seed-demo.mjs`
- `scripts/supabase-staging-smoke.mjs`
- `src/app/(dashboard)/layout.tsx`
- `src/constants/roles.ts`
- `src/lib/auth/mock-session.ts`
- `src/lib/auth/post-login-routing.ts`
- `src/lib/permissions/can.ts`
- `src/lib/permissions/navigation-policy.ts`
- `src/lib/permissions/navigation.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/dashboard/services/executive-common-center-service.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/executive/components/executive-leadership-dashboard.tsx`
- `src/modules/executive/constants/index.ts`
- `src/modules/executive/mock-data/executive-mock-data.ts`
- `src/modules/proposals/services/approval-center-service.ts`
- `src/modules/settings/services/policy-settings-repository.ts`
- `src/modules/settings/services/role-permission-catalog-repository.ts`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `src/modules/workspaces/services/workspace-service.ts`
- `tests/e2e/mvp-smoke.spec.ts`
- `tests/fixtures/module-one-acceptance.json`
- `tests/unit/app-shell.test.tsx`
- `tests/unit/auth-actions.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/command-center-page.test.tsx`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/constants.test.ts`
- `tests/unit/executive-service.test.ts`
- `tests/unit/module-one-seed-fixtures.test.ts`
- `tests/unit/navigation-policy.test.ts`
- `tests/unit/permissions.test.ts`
- `tests/unit/policy-settings-service.test.ts`
- `tests/unit/role-permission-catalog.test.ts`
- `tests/unit/user-actions.test.ts`
- `tests/unit/workspaces.test.ts`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-30 | 1.0 | Created Story 1.6 implementation guide for splitting `chu_tich` from `super_admin`. | Codex |
| 2026-05-30 | 1.1 | Implemented `chu_tich`/`super_admin` RBAC split, seed/demo sync, navigation guards and tests. | Codex |
| 2026-05-31 | 1.2 | Applied all code-review patches, hardened parity/deny coverage, reran focused/unit/e2e validation and moved story to done. | Codex |
