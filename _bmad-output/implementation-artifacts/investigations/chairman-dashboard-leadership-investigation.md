# Investigation: Chairman dashboard and leadership surface

## Hand-off Brief

1. **What happened.** User is validating what the Chairman/Super Admin role sees on the overview dashboard and after opening leadership.
2. **Where the case stands.** Evidence shows BRD positions `/command-center` as the canonical leadership/operations surface, but the `super_admin` default screen is currently `/admin`.
3. **What's needed next.** Decide whether Chairman should default to `/command-center?view=executive-dashboard` or keep `/admin` as a technical admin default with explicit leadership entry.

## Case Info

| Field | Value |
| --- | --- |
| Ticket | N/A |
| Date opened | 2026-05-24 |
| Status | Concluded |
| System | Local repo on Windows, Next.js app |
| Evidence sources | BRD/UX artifacts, role config, navigation, command center and executive route code |

## Problem Statement

User asks to re-check BRD and inspect role Chủ tịch: what the overview dashboard shows, and what clicking leadership shows.

## Evidence Inventory

| Source | Status | Notes |
| --- | --- | --- |
| `_bmad-output/planning-artifacts/axis-1-requirement-brd-architecture-draft.md` | Available | Declares `/command-center` as main leadership/aggregate surface. |
| `_bmad-output/planning-artifacts/ux-design-specification.md` | Available | Defines Chairman/CEO command loop and executive dashboard expectations. |
| `src/constants/roles.ts` | Available | Maps `super_admin` to label Chủ tịch/Super Admin but default screen `/admin`. |
| `src/lib/permissions/navigation.ts` | Available | Shows `/command-center` as common "Tổng quan"; no top-level `/executive` nav item for `super_admin`. |
| `src/modules/command-center` | Available | `/command-center` overview and `executive-dashboard` implementation. |
| `src/modules/executive` | Available | Separate `/executive` workspace exists and is accessible to `super_admin`. |

## Confirmed Findings

### Finding 1: BRD says Command Center is the leadership/operations surface

**Evidence:** `_bmad-output/planning-artifacts/axis-1-requirement-brd-architecture-draft.md:48`, `_bmad-output/planning-artifacts/axis-1-requirement-brd-architecture-draft.md:340`.

**Detail:** `/command-center` is the canonical leadership/operations surface; `/command-center?view=executive-dashboard` is the Executive Command Center.

### Finding 2: Chủ tịch/Super Admin default route is currently admin

**Evidence:** `src/constants/roles.ts:2`, `src/constants/roles.ts:128`.

**Detail:** `super_admin` is labeled Chủ tịch/Super Admin but defaults to `/admin`, not `/command-center` or `/executive`.

### Finding 3: "Tổng quan" opens the command center overview

**Evidence:** `src/lib/permissions/navigation.ts:38`, `src/app/command-center/page.tsx:22`, `src/modules/command-center/components/command-center-dashboard.tsx:2584`.

**Detail:** The common nav item `/command-center` renders command-center overview with operational KPIs from dashboard service.

### Finding 4: Clicking "Ban lãnh đạo" in Command Center opens the executive dashboard view

**Evidence:** `src/modules/command-center/services/command-center-service.ts:47`, `src/modules/command-center/components/command-center-dashboard.tsx:1767`.

**Detail:** The leadership item links to `/command-center?view=executive-dashboard` and renders `ExecutiveCommandCenterView`.

## Conclusion

**Confidence:** High

Current behavior is internally consistent in code, but there is a product-positioning mismatch for Chairman default entry: BRD treats Command Center as the leadership operating surface, while `super_admin` defaults to admin. The UI path that matches BRD is sidebar "Tổng quan" -> `/command-center`, then Command Center item "Ban lãnh đạo" -> `/command-center?view=executive-dashboard`.

## Recommended Next Steps

### Fix direction

If Chairman is a business leadership persona, change `super_admin` default screen from `/admin` to `/command-center?view=executive-dashboard` or split the roles/personas between `chu_tich` and technical `super_admin`.

### Diagnostic

Check live UI with mock role `super_admin`: login/default redirect, sidebar "Tổng quan", and Command Center "Ban lãnh đạo" click.

## Reproduction Plan

1. Use mock role `super_admin`.
2. Open default screen after login.
3. Open `/command-center`.
4. Click "Ban lãnh đạo" inside Command Center.
5. Confirm whether the screen matches Executive Command Center expectations.
