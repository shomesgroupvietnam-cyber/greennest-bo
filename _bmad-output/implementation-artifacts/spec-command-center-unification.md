---
title: 'Unify executive work into Command Center'
type: 'feature'
created: '2026-05-22'
status: 'done'
context: []
baseline_commit: 'a8162e3'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The app currently exposes multiple overlapping work surfaces at `/command-center`, `/executive`, `/axis-1`, and `/dashboard`, causing leadership users to see duplicated dashboard metrics, executive actions, and portfolio summaries.

**Approach:** Make `/command-center` the single leadership operating surface. Legacy/direct routes should redirect into `/command-center?view=...`, and Command Center should render real executive, operations dashboard, and Axis 1 content instead of placeholder panels or duplicated hardcoded summaries.

## Boundaries & Constraints

**Always:** Preserve existing role and permission semantics; reuse existing module services/components where practical; keep `/command-center` as the canonical URL; avoid reverting unrelated dirty worktree changes.

**Ask First:** Removing entire modules, deleting historical route folders, or changing the underlying authorization model beyond what is required to access the unified surface.

**Never:** Keep four separate top-level dashboards for the same leadership workflow; introduce new mock datasets when a current service already exists; rewrite unrelated domain modules.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Unified leadership route | User opens `/executive` or an executive subpage | User lands on `/command-center?view=executive-*` with the matching executive panel selected | Existing command center role guard still applies |
| Unified Axis 1 route | User opens `/axis-1` | User lands on `/command-center?view=axis1-search-development` and sees the real Axis 1 dashboard content | Axis 1 permission is still enforced by command center/module permissions |
| Unified operations route | User opens `/dashboard` | User lands on `/command-center?view=operations-dashboard` and sees repository-backed dashboard KPI/alerts/lists | Authenticated session is still required |
| In-page navigation | User chooses a view in Command Center sidebar or quick switch | URL stays on `/command-center`, selected panel changes, and no duplicate top-level workspace opens | Invalid query view falls back to overview |

</frozen-after-approval>

## Code Map

- `src/app/command-center/page.tsx` -- canonical route, loads unified data and passes initial view.
- `src/modules/command-center/services/command-center-service.ts` -- command center aggregator and menu model.
- `src/modules/command-center/types.ts` -- data/view type contract for unified modules.
- `src/modules/command-center/components/command-center-dashboard.tsx` -- client shell and in-page view switching.
- `src/app/executive/**/page.tsx`, `src/app/(dashboard)/axis-1/page.tsx`, `src/app/(dashboard)/dashboard/page.tsx` -- legacy/direct route redirects.
- `tests/unit/command-center-service.test.ts`, `tests/unit/workspaces.test.ts`, `tests/unit/permissions.test.ts` -- expected route/nav assertions.

## Tasks & Acceptance

**Execution:**
- [x] `src/modules/command-center/services/command-center-service.ts` -- replace hardcoded duplicate KPI/summary data with calls to executive, dashboard, and Axis 1 services.
- [x] `src/modules/command-center/types.ts` -- extend data types for operations dashboard and Axis 1 embedded panels.
- [x] `src/modules/command-center/components/command-center-dashboard.tsx` -- initialize from query view, render real Axis 1 and operations dashboard panels, and keep in-page navigation canonical.
- [x] `src/app/command-center/page.tsx` -- accept `searchParams`, allow executive roles, and pass user-aware data.
- [x] Legacy route pages -- redirect `/executive*`, `/axis-1`, and `/dashboard` into `/command-center?view=...`.
- [x] Tests -- update assertions around command center nav/data and legacy defaults.

**Acceptance Criteria:**
- Given a leadership user, when they open `/command-center`, then they can access overview, executive, operations dashboard, and Axis 1 views from one screen.
- Given a user opens `/executive/approvals`, when the route loads, then the browser resolves to `/command-center?view=executive-approvals`.
- Given a user opens `/axis-1`, when the route loads, then the browser resolves to `/command-center?view=axis1-search-development` and the Axis 1 dashboard is visible.
- Given a user opens `/dashboard`, when the route loads, then the browser resolves to `/command-center?view=operations-dashboard` and repository-backed dashboard sections are visible.
- Given invalid `view`, when `/command-center?view=bad` loads, then the overview is selected.

## Verification

**Commands:**
- `npm run typecheck` -- expected: no TypeScript errors from the unified routing/component contract.
- `npm test -- command-center-service workspaces permissions axis-one-service dashboard-service` -- expected: targeted tests pass.

## Suggested Review Order

**Canonical Entry**

- Command Center now accepts query-selected views and loads user-aware aggregate data.
  [`page.tsx:19`](../../../src/app/command-center/page.tsx#L19)

- Aggregator replaces duplicate hardcoded dashboard values with existing module services.
  [`command-center-service.ts:421`](../../../src/modules/command-center/services/command-center-service.ts#L421)

**Embedded Views**

- Operations dashboard is rendered inside the Command Center shell.
  [`command-center-dashboard.tsx:1055`](../../../src/modules/command-center/components/command-center-dashboard.tsx#L1055)

- Axis 1 dashboard is embedded instead of placeholder content.
  [`command-center-dashboard.tsx:1108`](../../../src/modules/command-center/components/command-center-dashboard.tsx#L1108)

- Types carry the embedded operations and Axis 1 payloads.
  [`types.ts:120`](../../../src/modules/command-center/types.ts#L120)

**Legacy Routes**

- Executive legacy pages redirect into matching Command Center views.
  [`page.tsx:6`](../../../src/app/executive/approvals/page.tsx#L6)

- Dashboard and Axis 1 direct routes redirect into Command Center views.
  [`page.tsx:4`](../../../src/app/(dashboard)/dashboard/page.tsx#L4)

**Tests**

- Command Center service expectations now cover the unified aggregator contract.
  [`command-center-service.test.ts:11`](../../../tests/unit/command-center-service.test.ts#L11)

- Role/default-screen tests now expect Command Center as the leadership target.
  [`workspaces.test.ts:23`](../../../tests/unit/workspaces.test.ts#L23)
