# Story 5.4: Override Va Dong Risk/Blocker Co Audit

Status: done

Ghi chu tao story: Ultimate context engine analysis completed. Story nay mo rong official risk records cua Story 5.3 de them human accountability cho do/vang/xanh va dong risk/blocker. Pham vi co y chi lam manual confirm/override status suggestion, close terminal status, reason/audit, dashboard filtering va permission/RLS parity. Khong lam overdue escalation/reminder, AI draft suggestion, AI accepted-suggestion lifecycle, Risk Center route day du, delete/archive/reopen flow cua Story 5.5+.

## Story

As a lanh dao phu trach,  
I want xac nhan/override trang thai do/vang/xanh va dong risk/blocker voi ly do,  
so that he thong khong tu quyet dinh trang thai quan trong ma khong co nguoi chiu trach nhiem.

## Acceptance Criteria

1. **Override/xac nhan do-vang-xanh bat buoc co reason va audit**
   - Given official risk/blocker dang active va he thong dang co suggestion `green | yellow | red`
   - When user co `risk.override` truc tiep/scoped submit manual status `green | yellow | red` voi reason
   - Then service bat buoc reason khong rong, luu override fields tren record, cap nhat `updatedBy/updatedAt`, va ghi audit `risk.status_confirmed` neu manual status bang suggestion hien tai hoac `risk.status_overridden` neu khac suggestion
   - And dashboard/read DTO dung manual status lam effective `statusSuggestion.status`, `labelVi`, `reason`, `confirmationState` (`confirmed` hoac `overridden`) nhung van giu source/system suggestion data an toan de truy vet.

2. **Dong risk/blocker la terminal action rieng, khong phai generic update**
   - Given record co `status` active: `open | monitoring | in_progress | blocked`
   - When user co quyen close hop le submit `closeStatus` la `resolved | closed` voi close reason
   - Then service luu terminal status, `closedReason`, `closedBy`, `closedAt`, cap nhat `updatedBy/updatedAt`, va ghi audit `risk.closed`
   - And generic update khong duoc set `closed/resolved`; record terminal khong duoc update/override/close lai trong story nay.

3. **High/critical risk/blocker can quyen cao hon hoac responsible leader policy**
   - Given record `level` la `high` hoac `critical`, hoac recordType la `blocker`
   - When user close record
   - Then `risk.update` hoac ownerId don thuan khong du; service phai pass high-close policy:
     - direct/scoped `risk.close_high`, hoac
     - responsible leader trong same scope co `risk.close` theo role/scope assignment duoc catalog/policy cong nhan
   - And user thieu policy close phai bi chan truoc repository write va khong ghi success audit.

4. **Closed risk khong con la open blocker tren dashboard nhung van nam trong history/audit**
   - Given risk/blocker da `closed` hoac `resolved`
   - When dashboard, morning briefing, common center, private workspace hoac command center reload
   - Then record terminal khong duoc tinh vao open blocker/riskSummary/riskMap/priority/high-risk KPI active lists
   - And record khong bi delete; repository/service van co du lieu cho history/audit query, va audit trail giu reason/actor/time an toan.

5. **UI action controls ton trong destructive UX va khong leak data**
   - Given user co risk permissions trong current scope
   - When xem risk summary/form hien co
   - Then UI chi render override/close controls khi DTO permissions/per-item actions cho phep; close action co confirmation va required reason
   - And validation fail phai giu input, hien inline/server error tieng Viet, disable pending state, khong render unauthorized project/owner/source options roi chi an bang client.

6. **Supabase/JSON repository parity va rollback dung voi nullable fields**
   - Given override/close mutation persist thanh cong nhung audit write fail
   - When service rollback
   - Then old record duoc restore day du, bao gom viec clear optional/nullable fields nhu `statusOverrideReason`, `closedReason`, `closedAt`
   - And JSON repository, Supabase row mapper, migration constraints, RLS policy asset va verification SQL cung chap nhan cung mot domain contract.

## Tasks / Subtasks

- [x] Mo rong domain contract cho manual status va terminal close (AC: 1, 2, 4, 6)
  - [x] UPDATE `src/modules/executive/types/index.ts`:
    - `RiskConfirmationState = "suggested" | "confirmed" | "overridden"`.
    - `ExecutiveRiskRecordStatus = "open" | "monitoring" | "in_progress" | "blocked" | "resolved" | "closed"`.
    - Add helpers/constants for active statuses vs terminal statuses; do not treat `overridden` as record status.
    - Add record fields: `statusOverride?`, `statusOverrideReason?`, `statusOverrideBy?`, `statusOverrideAt?`, `statusOverrideSourceStatus?`, `closedReason?`, `closedBy?`, `closedAt?`.
    - Add `OverrideExecutiveRiskStatusInput` and `CloseExecutiveRiskRecordInput`; generic update input must not accept close/override fields.
  - [x] UPDATE `src/modules/executive/validation.ts` with Zod schemas:
    - `overrideExecutiveRiskStatusInputSchema`: `riskId`, `statusOverride`, `reason`, optional `onBehalfOf/delegationId` only if supported for override.
    - `closeExecutiveRiskRecordInputSchema`: `riskId`, `closeStatus`, `reason`, optional `resolution/nextAction` only if stored safely.
    - Required messages tieng Viet, trim empty strings, no localized dates.
  - [x] Keep status keys lowercase stable. Labels stay in UI/status service, not persisted.

- [x] Them permission keys, catalog labels, seeds va RLS parity (AC: 1, 2, 3, 5, 6)
  - [x] UPDATE `src/lib/permissions/can.ts` add `risk.override`, `risk.close`, `risk.close_high`.
  - [x] Role guidance:
    - Grant direct `risk.override`/`risk.close` cho `chu_tich`, `tong_giam_doc`, `pho_tong_giam_doc`, `giam_doc_du_an` neu tests xac nhan business authority.
    - Grant direct `risk.close_high` cho system leadership (`chu_tich`, `tong_giam_doc`, `pho_tong_giam_doc`) by default; project director/department leader chi co high-close khi co scoped assignment/catalog policy ro rang.
    - `quan_ly_du_an` co the giu `risk.update`, nhung khong duoc auto-close high/critical chi vi update.
    - `admin`, `viewer`, `pending`, external roles va `thu_ky_tro_ly` khong nhan broad close/override default.
  - [x] UPDATE `src/modules/settings/services/role-permission-catalog-repository.ts` labels/action types:
    - `risk.override`: "Xac nhan/override trang thai risk"
    - `risk.close`: "Dong risk/blocker dieu hanh"
    - `risk.close_high`: "Dong risk/blocker high critical"
    - Explicit actionType should be `update`; mark close/high-close sensitive or otherwise non-delegatable by default so delegation cannot infer `.close` as read-only/view.
  - [x] UPDATE `database/seeds/001_roles_permissions.sql`, `tests/fixtures/module-one-acceptance.json`, permission/catalog/unit fixture tests.
  - [x] UPDATE `database/policies/001_mvp_rls.sql` and `database/verification/007_executive_risk_records_rls.sql` so policy assets mention `risk.override`, `risk.close`, `risk.close_high` and terminal status checks. RLS is a coarse database guard; app service must remain the precise policy authority.
  - [x] UPDATE dashboard/private workspace permission surfaces: `executiveScopedPermissions`, `ExecutiveDashboardPermissions`, `PrivateWorkspacePermissions`, delegated action filters, action labels, and empty dashboard defaults.

- [x] Extend repository and migration without editing Story 5.3 semantics incorrectly (AC: 1, 2, 4, 6)
  - [x] ADD a new migration, e.g. `database/migrations/202606020001_extend_executive_risk_records_close_override.sql` or next valid timestamp. Prefer a new migration over mutating the Story 5.3 migration unless the team explicitly coordinates uncommitted migration replacement.
  - [x] Alter `executive_risk_records` with snake_case columns:
    - `status_override text`
    - `status_override_reason text`
    - `status_override_by uuid references public.users(id)`
    - `status_override_at timestamptz`
    - `status_override_source_status text`
    - `closed_reason text`
    - `closed_by uuid references public.users(id)`
    - `closed_at timestamptz`
  - [x] Update constraints:
    - status check includes `resolved`, `closed`.
    - override status is null or `green/yellow/red`.
    - override reason/by/at required together when override exists.
    - terminal status requires `closed_reason`, `closed_by`, `closed_at`.
    - active status must not require close fields; decide whether active rows may keep close fields null only.
  - [x] UPDATE `src/modules/executive/services/risk-record-repository.ts`:
    - `ExecutiveRiskRecordListFilters` supports `includeClosed?`, terminal `status` filters, and default dashboard helpers can exclude closed records.
    - JSON mapper and Supabase `ExecutiveRiskRecordRow` map all new fields both ways.
    - Patch mapper must preserve the Story 5.3 review fix: own-property `undefined` clears nullable Supabase fields to `null` during rollback.
  - [x] UPDATE `tests/unit/risk-record-repository.test.ts` for JSON + Supabase mapper parity, nullable clear behavior, and active/terminal filters.

- [x] Implement service-level override and close authority (AC: 1, 2, 3, 6)
  - [x] UPDATE `src/modules/executive/services/risk-record-service.ts`.
  - [x] Add public functions:
    - `overrideExecutiveRiskStatus(input, actor, deps?)`
    - `closeExecutiveRiskRecord(input, actor, deps?)`
  - [x] Reuse existing dependency injection pattern: repository, users, projects, riskGroups, scope assignments, rolePermissionCatalog, delegation catalog/repo, auditWriter, idGenerator, now, scoped loaders.
  - [x] Override flow:
    - Load current record, reject missing/terminal/no read scope.
    - Build current system suggestion using existing `buildRiskStatusSuggestion`/record mapper, then compute `confirmed` vs `overridden`.
    - Require `risk.override` direct/scoped in current record scope. If delegation is allowed for override, it must be explicit `risk.override`, active, same scope, and audited with `onBehalfOf/delegationId`; do not infer from `risk.update`.
  - [x] Close flow:
    - Load current record, reject missing/terminal.
    - Low/medium active records require `risk.close` direct/scoped in current scope.
    - High/critical/blocker records require high-close policy from AC3.
    - Do not allow generic `updateExecutiveRiskRecord` to set terminal statuses or mutate terminal records.
  - [x] Audit:
    - `entityType: "risk"`.
    - `risk.status_confirmed`, `risk.status_overridden`, `risk.closed`.
    - Audit values must be compact/safe: ids, type, level, old/new effective status, close status, reason summary, project/module/owner, onBehalfOf/delegationId, changedFields. No raw finance payload, document body, meeting transcript, AI output, or full form dump.
  - [x] If audit write fails after repository update, rollback using previous record snapshot and throw; do not report success.

- [x] Wire Server Actions and form state for override/close (AC: 1, 2, 5)
  - [x] UPDATE `src/modules/executive/actions.ts`:
    - Add `overrideExecutiveRiskStatusAction`, `closeExecutiveRiskRecordAction`.
    - Add state-action variants returning serializable `{ status, message, fieldErrors, fields }`.
    - Preserve decision and create/update risk actions.
    - Revalidate `/command-center`, `/executive`, `/projects/${projectId}` when available, and `/executive/decision-log` only if linked decision data is affected.
  - [x] FormData parser should trim empty strings to `undefined`, keep user fields on validation fail, and include risk id/action fields in preserved field keys.
  - [x] Direct Server Action call without service permission must fail through service guard, not through UI-only checks.

- [x] Update dashboard/read DTOs and UI surfaces (AC: 1, 4, 5)
  - [x] UPDATE `src/modules/executive/services/risk-status-service.ts`:
    - `buildExecutiveRiskItemFromRecord` applies manual override as effective status suggestion.
    - `statusSuggestion.sourceData` remains sanitized and traceable.
    - Tone/status counts use effective override status; severity/impact still come from risk `level`.
  - [x] UPDATE `src/modules/dashboard/services/executive-dashboard-service.ts`:
    - Exclude terminal official records from active risk summary/map/priority/KPI inputs.
    - Add `canOverrideRisk`, `canCloseRisk`, `canCloseHighRisk` and per-item action availability if needed.
    - Keep aggregation over full active merged list, not only capped `items`.
  - [x] UPDATE shared consumers as needed: `executive-common-center-service.ts`, `executive-morning-briefing-service.ts`, `src/modules/workspaces/services/executive-private-workspace-service.ts`, command center service/types/components.
  - [x] UPDATE `src/modules/dashboard/components/executive-risk-summary.tsx` and/or `src/modules/executive/components/risk-record-form.tsx` with compact action controls:
    - override segmented/select control for `green/yellow/red` plus reason.
    - close button with confirmation and required close reason.
    - no new landing page; no new full Risk Center route unless existing surfaces cannot support the workflow.
    - no nested cards; dense operational layout; buttons use lucide icons where appropriate.
  - [x] Do not render close/override controls for terminal records or unauthorized users.

- [x] Testing and verification (AC: 1, 2, 3, 4, 5, 6)
  - [x] UPDATE `tests/unit/risk-record-service.test.ts`:
    - override requires `risk.override`, reason, active record, and writes correct audit.
    - same-status confirm uses `risk.status_confirmed`; changed status uses `risk.status_overridden`.
    - low/medium close with `risk.close`; high/critical/blocker close rejects without high-close policy.
    - `risk.update` alone cannot close or override.
    - terminal records cannot be updated/overridden/closed again.
    - audit failure rolls back nullable override/close fields.
  - [x] UPDATE `tests/unit/risk-status-service.test.ts` for effective manual status, confirmationState, source data sanitization, and tone/statusCounts behavior.
  - [x] UPDATE `tests/unit/executive-dashboard-service.test.ts`:
    - closed official risk excluded from active risk summary/riskMap/KPI.
    - manual override affects effective status counts/tone while severity count remains level-based.
    - no-permission user still cannot serialize official risk source data.
  - [x] UPDATE `tests/unit/executive-actions.test.ts` for FormData parser, state action, errors, and revalidate paths.
  - [x] UPDATE component tests (`risk-record-form.test.tsx`, `command-center-dashboard.test.tsx`, or `executive-risk-summary` tests) for close confirmation, override reason validation, permission-hidden controls, input preservation and pending state.
  - [x] UPDATE `tests/unit/permissions.test.ts`, `tests/unit/role-permission-catalog.test.ts`, `tests/unit/module-one-seed-fixtures.test.ts`, `tests/unit/risk-record-rls-policy.test.ts`, and private workspace tests for new permissions/action labels.
  - [x] Run targeted tests during implementation:
    - `npm run test -- tests/unit/risk-record-service.test.ts tests/unit/risk-record-repository.test.ts tests/unit/risk-status-service.test.ts tests/unit/executive-dashboard-service.test.ts tests/unit/executive-actions.test.ts`
  - [x] Run required gates before review: `npm run typecheck`, `npm run lint`, `npm run test`.
  - [x] Run `npm run test:e2e` only if implementation adds route/navigation behavior not covered by component tests.

### Review Findings

- [x] [Review][Patch] High-close policy ignores blocker records and treats ownerId as responsible leader [src/modules/executive/services/risk-record-service.ts:937]
- [x] [Review][Patch] Override database constraints do not require reason/by/at when status_override exists [database/migrations/202606020001_extend_executive_risk_records_close_override.sql:22]
- [x] [Review][Patch] RLS update policy lets risk.update users set status_override on active records without risk.override [database/policies/001_mvp_rls.sql:1618]

## Dev Notes

### Business Context

- Epic 5 requires risk/blocker tracking by group, level, red/yellow/green status, reason, deadline and owner; system/AI suggestions must stay proposals until authorized human confirmation. [Source: `_bmad-output/planning-artifacts/epics/epic-5-risk-alert-center-cho-iu-hnh.md`]
- Story 5.4 covers FR-057, FR-065, FR-066, NFR-005, NFR-006 and UX-DR21. [Source: `_bmad-output/planning-artifacts/epics/epic-5-risk-alert-center-cho-iu-hnh.md`; `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-056/FR-057: red/yellow/green combines system suggestion and human confirmation/override; override must require reason and audit. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-065/FR-066: close risk/blocker is limited to owner/project director/responsible leader/appropriate permission, and high/critical close requires higher permission or responsible leader confirmation. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- Story 5.5 is separate: overdue escalation, reminders, and AI draft suggestions are out of scope here.

### Current Code State

- Story 5.3 is done and created official risk persistence, create/update service/actions, form, dashboard merge, Supabase migration/RLS/verification and targeted tests. [Source: `_bmad-output/implementation-artifacts/5-3-tao-va-cap-nhat-risk-blocker-theo-quyen.md`]
- Current open record status union is only `open | monitoring | in_progress | blocked`; 5.3 intentionally rejected `closed/resolved` and did not implement close/override. [Source: `src/modules/executive/types/index.ts`; `_bmad-output/implementation-artifacts/5-3-tao-va-cap-nhat-risk-blocker-theo-quyen.md`]
- `risk-record-service.ts` already has scoped direct/delegated mutation helpers, source/owner/project validation, compact audit values, rollback on audit failure, and dashboard filtering helpers. Reuse these; do not create a parallel risk mutation stack.
- `riskRecordPatchToRow` already handles explicit `undefined` optional fields for Supabase rollback. Preserve that behavior when adding new nullable override/close fields. [Source: `src/modules/executive/services/risk-record-repository.ts`]
- `risk-status-service.ts` currently builds `RiskStatusSuggestion` with `confirmationState: "suggested"` and maps official records through `buildExecutiveRiskItemFromRecord`; extend this mapper instead of duplicating sanitizer/status logic. [Source: `src/modules/executive/services/risk-status-service.ts`]
- `executive-dashboard-service.ts` currently exposes `canCreateRisk/canUpdateRisk`, delegates only `risk.create/risk.update`, and loads official records only when `canViewRisk`. Add close/override permissions consistently across dashboard and private workspace surfaces. [Source: `src/modules/dashboard/services/executive-dashboard-service.ts`; `src/modules/workspaces/services/executive-private-workspace-service.ts`]

### Project Structure Notes

- Keep domain/service/repository code in `src/modules/executive/services` and dashboard DTO aggregation in `src/modules/dashboard/services`; UI components should stay under existing dashboard/executive component boundaries.
- Server Actions remain in `src/modules/executive/actions.ts`; permissions must be enforced in services before repository writes and before sensitive DTO serialization.
- Add database changes under `database/migrations`, update RLS in `database/policies/001_mvp_rls.sql`, update verification SQL in `database/verification`.
- No new dependencies unless unavoidable; use existing Zod, Vitest, React actions, Tailwind and lucide patterns.

### Critical Implementation Boundaries

- `risk.update` must not be enough to close or override. Close/override are explicit permissions and explicit service functions.
- Do not store `overridden` as `ExecutiveRiskRecordStatus`; red/yellow/green is a suggestion/effective display status, not lifecycle status.
- Do not delete closed records. History/audit must remain available.
- Do not let UI permission visibility be the only guard. Direct Server Action/service calls must fail when unauthorized.
- Do not add AI acceptance, reminders, overdue escalation, or notification queue logic in this story.
- Do not leak raw source content or sensitive finance/document/meeting/AI payloads into audit logs or dashboard DTOs.

### Recent Worktree Notes

- The worktree has many existing modified/untracked files from prior story implementation artifacts and code. Treat them as user/team work; do not revert unrelated files.
- Recent commits only show Story 4.1 history, while Stories 4.2 through 5.3 appear as uncommitted implementation artifacts/code in the current workspace. Build on the present files, not only Git history.

### References

- `_bmad-output/planning-artifacts/epics/epic-5-risk-alert-center-cho-iu-hnh.md`
- `_bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `_bmad-output/implementation-artifacts/5-3-tao-va-cap-nhat-risk-blocker-theo-quyen.md`
- `_bmad-output/project-context.md`
- `docs/context/permissions-audit.md`
- `docs/context/testing.md`
- `src/modules/executive/types/index.ts`
- `src/modules/executive/validation.ts`
- `src/modules/executive/services/risk-record-service.ts`
- `src/modules/executive/services/risk-record-repository.ts`
- `src/modules/executive/services/risk-status-service.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `database/migrations/202606010001_create_executive_risk_records.sql`
- `database/policies/001_mvp_rls.sql`
- `database/verification/007_executive_risk_records_rls.sql`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Targeted contract tests initially failed as expected before implementation:
  `npm run test -- tests/unit/risk-record-repository.test.ts tests/unit/risk-record-service.test.ts tests/unit/permissions.test.ts tests/unit/role-permission-catalog.test.ts tests/unit/risk-status-service.test.ts tests/unit/executive-dashboard-service.test.ts tests/unit/executive-actions.test.ts tests/unit/risk-record-form.test.tsx tests/unit/executive-private-workspace-service.test.ts tests/unit/risk-record-rls-policy.test.ts`
- Targeted contract tests passed after implementation: same command, 10 files / 85 tests passed.
- Fixture parity: `npm run test -- tests/unit/module-one-seed-fixtures.test.ts` passed.
- Required gates passed:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test` (80 files / 517 tests passed)

### Completion Notes List

- Added explicit risk lifecycle permissions `risk.override`, `risk.close`, `risk.close_high` with role/catalog/seed/fixture/RLS parity.
- Extended official risk records with manual status override fields and terminal close fields across domain types, Zod validation, JSON repository, Supabase row mapping, rollback patch mapping and a new migration.
- Implemented dedicated service flows for override/confirm and close, with reason-required validation, explicit audit actions, terminal guards and rollback on audit failure.
- Updated dashboard/private workspace DTO permissions and UI forms so override/close controls render only when permitted and terminal records are excluded from active risk summaries/KPIs/maps by default.
- Updated risk status mapping so manual override becomes the effective dashboard red/yellow/green status while preserving sanitized source data.

### File List

- `database/migrations/202606020001_extend_executive_risk_records_close_override.sql`
- `database/policies/001_mvp_rls.sql`
- `database/seeds/001_roles_permissions.sql`
- `database/verification/007_executive_risk_records_rls.sql`
- `src/lib/permissions/can.ts`
- `src/modules/settings/services/role-permission-catalog-repository.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/executive/validation.ts`
- `src/modules/executive/services/risk-record-repository.ts`
- `src/modules/executive/services/risk-record-service.ts`
- `src/modules/executive/services/risk-status-service.ts`
- `src/modules/executive/actions.ts`
- `src/modules/executive/components/risk-record-form.tsx`
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/components/executive-risk-summary.tsx`
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`
- `src/modules/workspaces/types.ts`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `tests/fixtures/module-one-acceptance.json`
- `tests/unit/risk-record-repository.test.ts`
- `tests/unit/risk-record-service.test.ts`
- `tests/unit/risk-status-service.test.ts`
- `tests/unit/risk-record-rls-policy.test.ts`
- `tests/unit/risk-record-form.test.tsx`
- `tests/unit/executive-actions.test.ts`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/executive-private-workspace-service.test.ts`
- `tests/unit/permissions.test.ts`
- `tests/unit/role-permission-catalog.test.ts`
- `tests/unit/executive-common-center-service.test.ts`
- `tests/unit/executive-drilldown-source.test.ts`
