# Story 2.8: External Role Workspace Isolation Va Command Center Guard

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay la follow-up cua Epic 2/Story 2.1 de dong khe ho cho role ben ngoai (`nha_thau`, `tu_van`): default login phai vao cong rieng, sidebar khong hien `Tong quan Truc 1`, va direct `/command-center` khong render Command Center noi bo. Pham vi la route/nav/default-entry/test regression; khong build workspace moi, khong doi data filtering cua projects/tasks/documents ngoai cac regression can thiet.

## Story

As a user co role ben ngoai,  
I want chi thay va vao workspace duoc phep cho nha thau/tu van,  
so that Command Center noi bo va dashboard Truc 1 khong bi lo qua sidebar, default login, hoac direct URL.

## Tieu Chi Chap Nhan

1. **Nha thau login vao cong nha thau va sidebar khong hien Command Center**
   - Given user role = `nha_thau`
   - When login bang mock/Supabase flow
   - Then default route = `/contractor`
   - And sidebar khong hien `Tong quan Truc 1` hoac link `/command-center`
   - And sidebar chi hien `Nha thau` va cac item external duoc phep theo permission/scope hien co, khong hien internal Command Center dashboard.

2. **Nha thau direct `/command-center` khong render dashboard noi bo**
   - Given user role = `nha_thau`
   - When direct access `/command-center`
   - Then system redirect ve `/contractor` hoac tra 403
   - And internal Command Center dashboard khong render
   - And `getCommandCenterData`/service data nhay cam khong duoc fetch truoc khi guard neu chon 403/redirect guard-first.

3. **Tu van co isolation tuong tu**
   - Given user role = `tu_van`
   - When login
   - Then default route = `/consultant`
   - And sidebar khong hien `Tong quan Truc 1` hoac `/command-center`
   - When direct access `/command-center`
   - Then system redirect ve `/consultant` hoac tra 403
   - And internal Command Center dashboard khong render.

4. **Internal roles va scoped navigation khong bi regress**
   - Given user la `super_admin`, `admin`, `tong_giam_doc`, `pho_tong_giam_doc`, hoac user co scoped grant hop le cho Command Center/Axis 1
   - When sidebar va `/command-center` render
   - Then behavior cua Story 2.1-2.7 duoc giu: internal users van thay entry phu hop, executive views van guard-first 403 khi thieu quyen, va `scopeId` khong bi mat.

5. **Regression test cu phai doi expectation**
   - Given existing unit test dang expect `contractorNav` contains `/command-center`
   - When story nay duoc implement
   - Then expectation do phai doi thanh `contractorNav` not contains `/command-center`
   - And them/doi coverage cho `tu_van` de cung khong contains `/command-center`.

## Tasks / Subtasks

- [x] Audit va chot external role entry contract (AC: 1, 2, 3)
  - [x] Xac nhan `ROLE_DEFAULT_SCREENS.nha_thau.href` la `/contractor` va `ROLE_DEFAULT_SCREENS.tu_van.href` la `/consultant`.
  - [x] Xac nhan `loginAction` voi `next=development` khong dua external role vao `/command-center`, `/dashboard`, `/projects`, hoac route noi bo khac truoc defaultScreen.
  - [x] Neu login fallback da dung, chi them regression tests; khong refactor auth flow rong.

- [x] Sua sidebar/navigation permission-aware cho external roles (AC: 1, 3, 4, 5)
  - [x] Cap nhat `src/lib/permissions/navigation.ts` de `common` item `/command-center` khong auto-allow cho external roles.
  - [x] Giu deny-by-default: external roles chi thay item co role external (`/contractor`, `/consultant`) va cac item duoc scoped/permission grant that su cho external use case.
  - [x] Khong hardcode an label o component; sua source of truth trong navigation/filter logic.
  - [x] Kiem tra `src/lib/permissions/navigation-context.ts` vi workspace selector build tu navItems; external workspace options khong duoc co `/command-center`.
  - [x] Neu wrapper `src/components/layout/app-sidebar.tsx` expose `getPermittedNavItems`, giu API/typing hien co va chi thay doi behavior qua navigation source.

- [x] Guard direct `/command-center` cho external roles truoc data fetch (AC: 2, 3, 4)
  - [x] Cap nhat `src/app/command-center/page.tsx` de role `nha_thau` va `tu_van` khong qua duoc top-level `/command-center` bang `requireAuthenticatedSession` roi fetch data.
  - [x] Chon mot contract ro: redirect external role ve default workspace (`/contractor`/`/consultant`) hoac `forbidden()` 403. Story chap nhan ca hai, nhung implementation va tests phai nhat quan.
  - [x] Guard/redirect phai xay ra truoc `getCommandCenterData(session.user, ...)`.
  - [x] Khong chan cac internal roles va khong pha exception da co cho viewer read-only `executive-private-workspace` neu khong lien quan.

- [x] Bao ton workspace route va data filtering hien co (AC: 1, 3, 4)
  - [x] Giu `/contractor` va `/consultant` dung `WorkspaceRoutePage` + `requireWorkspaceRoute` truoc `getRoleWorkspaceData`.
  - [x] Khong doi `applyWorkspaceScope` external filtering tru khi test phat hien leak lien quan truc tiep.
  - [x] Khong xoa direct access `/projects`, `/tasks`, `/documents` neu external roles dang duoc phep va data da filtered; story nay chi cam internal Command Center exposure.

- [x] Cap nhat unit tests (AC: 1, 2, 3, 4, 5)
  - [x] Sua `tests/unit/workspaces.test.ts`: `contractorNav` must not contain `/command-center`; van contain `/contractor`.
  - [x] Them `consultantNav` assertion: not contain `/command-center`; contain `/consultant`.
  - [x] Them/doi test default route neu can cho `ROLE_DEFAULT_SCREENS.nha_thau` va `ROLE_DEFAULT_SCREENS.tu_van`.
  - [x] Them `tests/unit/command-center-page.test.tsx` case external direct `/command-center` redirect/403 truoc `getCommandCenterData`.
  - [x] Giu existing tests cho CEO/admin/executive `/command-center` pass.

- [x] Cap nhat e2e smoke cho external isolation (AC: 1, 2, 3)
  - [x] Trong `tests/e2e/mvp-smoke.spec.ts`, them login smoke cho `nha_thau` -> `/contractor`.
  - [x] Them login smoke cho `tu_van` -> `/consultant`.
  - [x] Them direct `/command-center` smoke cho `nha_thau` va `tu_van`: assert redirect/403 theo contract da chot va body khong co text internal nhu `Command Center`, `Dashboard Tong Quan`, `Ban lanh dao`, hoac module overview nhay cam.
  - [x] Tai su dung helper `useMockRole`; tranh test brittle vao DOM shell neu route-level status/URL da du ro.

- [x] Kiem thu (AC: 1, 2, 3, 4, 5)
  - [x] Chay focused unit: `npm run test -- tests/unit/workspaces.test.ts tests/unit/command-center-page.test.tsx`.
  - [x] Chay focused e2e hoac full smoke neu dev server san sang: `npm run test:e2e`.
  - [x] Chay minimum gate truoc review: `npm run typecheck`, `npm run lint`, `npm run test`.

### Review Findings

- [x] [Review][Patch] External scoped Command Center grants must not expose a dead leadership link [src/lib/permissions/navigation.ts:342] — Decision: external roles are always barred from internal Command Center, even with scoped `/executive` grants. `src/lib/permissions/navigation.ts` can still expose `/command-center?view=executive-dashboard` through `scopedWorkspaceRoutes`, while `src/app/command-center/page.tsx:41` redirects every `nha_thau`/`tu_van` away before data fetch.

## Dev Notes

### Boi Canh Nghiep Vu

- `nha_thau` va `tu_van` la external roles. Ho co cong rieng de xem task/document/review duoc giao; ho khong phai user noi bo dieu hanh Truc 1.
- `Tong quan Truc 1` / `/command-center` la entry noi bo cho Command Center Truc 1 va cac view Module 1. Sidebar item nay khong duoc xem la "common" voi external roles.
- UI hiding khong du la security. Direct `/command-center` phai bi redirect/403 truoc khi internal Command Center data render/fetch.
- Story nay khong thay doi yeu cau external users van bi filter server-side khi vao `/projects`, `/tasks`, `/documents`; cac e2e external record-isolation hien co phai tiep tuc pass.

### Current Code State (Read Before Editing)

- `src/constants/roles.ts` hien da map `nha_thau` -> `/contractor` va `tu_van` -> `/consultant` trong `ROLE_DEFAULT_SCREENS`. Neu login sai, kha nang nam o `resolvePostLoginHref` trong `src/lib/auth/actions.ts`, khong phai role constants.
- `src/lib/auth/actions.ts` voi `next=development` chi special-case leadership/admin/workspace/project permissions roi fallback `session.defaultScreen.href`. External roles nen roi ve `/contractor` hoac `/consultant`; them test de khoa behavior.
- `src/lib/permissions/navigation.ts` co `externalRoles = ["nha_thau", "tu_van"]`, nhung `getPermittedNavItems` return true cho `item.common` truoc external-role branch. Vi `NAV_ITEMS` mark `/command-center` la `common: true`, contractor/consultant sidebar hien internal entry. Day la regression can sua.
- `src/lib/permissions/navigation-context.ts` build `workspaceOptions` tu navItems va danh sach workspace hrefs co `/command-center`. Khi navigation filter dung, external shell selector tu dong khong con `/command-center`; neu van con, audit context builder.
- `src/app/command-center/page.tsx` chi dung `requireWorkspaceRoute("/executive")` cho `executive-*` views tru `executive-private-workspace`; top-level `/command-center` dung `requireAuthenticatedSession({ route: "/command-center" })`. External roles vi vay co the vao route va goi `getCommandCenterData`.
- `src/modules/command-center/services/command-center-service.ts` goi `getDashboardData` unconditionally trong `Promise.all`. Khong dua vao service null-check de bao ve top-level direct route; route guard phai chan truoc.
- `src/app/(dashboard)/contractor/page.tsx` va `src/app/(dashboard)/consultant/page.tsx` deu dung `WorkspaceRoutePage`, trong do `WorkspaceRoutePage` goi `requireWorkspaceRoute(route)` truoc `getRoleWorkspaceData`. Day la pattern dung can giu.
- `tests/unit/workspaces.test.ts` hien co regression sai: `expect(contractorNav).toContain("/command-center")`. Doi assertion nay, khong xoa test.
- `tests/unit/command-center-page.test.tsx` da cover executive deep-link guard-before-fetch va viewer private-workspace exception. Them external top-level `/command-center` guard/redirect case vao day.
- `tests/e2e/mvp-smoke.spec.ts` da co describe `External role isolation` cho record filtering; mo rong de cover sidebar/default/direct command-center thay vi tao file e2e moi neu khong can.
- Worktree dang co thay doi khac trong command-center/approval tests. Doc file truoc khi sua va khong revert/reset cac thay doi khong lien quan.

### File Targets

Expected UPDATE:
- `src/lib/permissions/navigation.ts`
- `src/app/command-center/page.tsx`
- `tests/unit/workspaces.test.ts`
- `tests/unit/command-center-page.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

Possible UPDATE:
- `src/lib/auth/actions.ts` only if login fallback does not route external roles to role default.
- `src/lib/permissions/navigation-context.ts` only if workspace selector still exposes `/command-center` after nav filtering.
- `src/components/layout/app-sidebar.tsx` only if wrapper behavior has to mirror source navigation export.
- `tests/unit/permissions.test.ts` if sidebar wrapper import has separate assertions affected by the nav behavior.

Avoid unless truly needed:
- Khong doi permission catalog/role defaults neu default `/contractor` va `/consultant` da dung.
- Khong tao route moi cho contractor/consultant.
- Khong refactor `getCommandCenterData` hoac dashboard DTO de giai quyet route guard.
- Khong chan external direct `/projects`, `/tasks`, `/documents` neu data filtering dang pass.
- Khong implement new UI shell, global store, API route, hay dependency moi.

### Architecture Compliance

- Auth/route decision phai nam server-side: `page.tsx`, guard helper, hoac redirect/forbidden truoc data service.
- Navigation source of truth phai nam trong `src/lib/permissions/navigation.ts`; component chi render DTO da filter.
- Permission-sensitive route changes can tests: unit guard-before-fetch + e2e direct URL smoke.
- DTO/data filtering tiep tuc qua service/scope helpers; khong client-side hide protected data.
- Giu Next.js App Router pattern hien co va `forbidden()` contract da duoc Story 2.1/2.7 su dung voi `experimental.authInterrupts`.

### UX Guardrails

- External sidebar can be sparse. It is better to show only `Nha thau`/`Tu van` plus allowed external work items than expose internal Truc 1 concepts.
- Direct denial/redirect copy/status phai ro nhung khong tiet lo internal dashboard data. Neu 403, body khong nen co noi dung Command Center noi bo.
- Neu redirect, target phai la workspace default cua role (`/contractor` hoac `/consultant`), khong `/dashboard`/`/projects` tru khi product explicitly doi.
- Khong them explanatory marketing/help text in-app; keep operational shell concise.

### Previous Story Intelligence

- Story 2.1 established PermissionAwareShell, route-aware nav, `Tong quan Truc 1` vs `Lanh dao`, and guard-before-fetch for executive views. Story nay tightens the same contract for external roles.
- Story 2.6/2.7 allowed viewer read-only private workspace as a special Command Center view. Do not accidentally remove that exception unless tests/product say otherwise.
- Existing e2e external isolation proves record-level filtering for contractor/consultant. This story adds entry/nav/direct-route isolation, not a replacement for record filtering.
- Review findings in Story 2.1 already called out scoped nav grants vs route guards. When changing navigation, preserve scoped internal grants and route guard alignment.

### Testing Guidance

- Preferred unit checks:
  - `getPermittedNavItems(user("nha_thau")).map(href)` excludes `/command-center`, includes `/contractor`.
  - `getPermittedNavItems(user("tu_van")).map(href)` excludes `/command-center`, includes `/consultant`.
  - Internal roles still include `/command-center` where expected.
  - `CommandCenterPage` external top-level access does not call `getCommandCenterData`.
- Preferred e2e checks:
  - Login `nha_thau` with `next=development` lands on `/contractor`.
  - Login `tu_van` with `next=development` lands on `/consultant`.
  - Direct `/command-center` as each external role redirects/403s and body does not render internal headings.
- Validation gates: `npm run typecheck`, `npm run lint`, `npm run test`; run `npm run test:e2e` because route/login behavior changes.

### Latest Tech Notes

- Project baseline from project context: Next.js 15.3.2 App Router, React 19, TypeScript strict, Vitest 3.1.3, Testing Library React 16.3.0, Playwright 1.52.0.
- No external library or web research is needed. This story uses existing Next route guard/redirect, permission navigation, and test stack.

### References

- `_bmad-output/implementation-artifacts/2-1-permission-aware-shell-va-workspace-entry.md` - permission-aware shell, Command Center route semantics, guard-before-fetch precedent.
- `_bmad-output/implementation-artifacts/2-7-drill-down-unauthorized-va-responsive-qa-cho-workspace.md` - unauthorized/403 no-leak and e2e guard patterns.
- `_bmad-output/planning-artifacts/epics/epic-2-workspace-iu-hnh-v-dashboard-module-1.md` - Epic 2 workspace entry and unauthorized route requirements.
- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-05-24-module-1-navigation-ia.md` - distinguishes `Tong quan Truc 1`, `Lanh dao`, and BO Settings.
- `docs/context/permissions-audit.md` - permission-sensitive routes require both navigation gating and direct URL/server guard behavior.
- `docs/context/testing.md` - route/navigation changes need focused unit and e2e smoke coverage.
- `src/lib/permissions/navigation.ts` - current nav filtering bug source for common `/command-center`.
- `src/app/command-center/page.tsx` - current top-level route allows authenticated external users before service data fetch.
- `src/modules/workspaces/config.ts` - workspace definitions and `/contractor` `/consultant` route access.
- `tests/unit/workspaces.test.ts` - existing `contractorNav` expectation to change.
- `tests/unit/command-center-page.test.tsx` - guard-before-fetch unit pattern.
- `tests/e2e/mvp-smoke.spec.ts` - existing external role smoke area to extend.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-30: RED `npm run test -- tests/unit/workspaces.test.ts tests/unit/command-center-page.test.tsx` failed as expected: external nav still contained `/command-center`; external top-level Command Center access rendered data instead of redirecting.
- 2026-05-30: GREEN focused unit `npm run test -- tests/unit/workspaces.test.ts tests/unit/command-center-page.test.tsx` passed: 2 files, 15 tests.
- 2026-05-30: Validation passed: `npm run typecheck`, `npm run lint`, `npm run test` -> 58 files / 365 tests passed.
- 2026-05-30: E2E passed: `npm run test:e2e` -> 51 Playwright tests passed.

### Implementation Plan

- Lock external roles to their configured default workspace during login before generic `project.view` fallback can route them to `/dashboard`.
- Remove `common` Command Center visibility for external roles at the navigation source of truth while preserving internal/scoped navigation behavior.
- Redirect `nha_thau` and `tu_van` away from top-level `/command-center` before `getCommandCenterData` runs.
- Add unit and e2e regression coverage for contractor and consultant default route, sidebar/nav isolation, direct URL redirect, and existing internal role behavior.

### Completion Notes List

- `nha_thau` and `tu_van` login now resolve to `/contractor` and `/consultant` before generic development-entry fallbacks.
- `getPermittedNavItems` no longer exposes the common `/command-center` item to external roles; contractor/consultant nav keeps their own workspace entries.
- Top-level `/command-center` redirects external users to their default workspace before fetching Command Center data.
- Added focused unit coverage for external nav and guard-before-fetch behavior, plus Playwright smoke coverage for external login and direct Command Center redirects.

### File List

- `_bmad-output/implementation-artifacts/2-8-external-role-workspace-isolation-va-command-center-guard.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/command-center/page.tsx`
- `src/lib/auth/actions.ts`
- `src/lib/permissions/navigation.ts`
- `tests/e2e/mvp-smoke.spec.ts`
- `tests/unit/command-center-page.test.tsx`
- `tests/unit/workspaces.test.ts`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-05-30 | 1.0 | Created Story 2.8 implementation guide for external role sidebar/default route isolation and direct Command Center guard. | Codex |
| 2026-05-30 | 1.1 | Implemented external role login, navigation and direct Command Center isolation with unit/e2e coverage. | Codex |
