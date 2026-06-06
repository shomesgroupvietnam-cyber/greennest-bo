# Story 5.3: Tao Va Cap Nhat Risk/Blocker Theo Quyen

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay la diem dau tien duoc phep tao persistence va mutation chinh thuc cho risk/blocker. Pham vi co y chi lam tao/cap nhat risk/blocker theo quyen, delegation va audit; khong lam close/override risk cua Story 5.4, khong lam overdue escalation/AI draft suggestion cua Story 5.5, khong tao Risk Center route day du neu existing Dashboard/Common/Morning surfaces da du de expose form va DTO.

## Story

As a nguoi co trach nhiem trong scope,  
I want tao va cap nhat risk/blocker voi du lieu bat buoc,  
so that van de dieu hanh duoc ghi nhan day du va co nguoi chiu trach nhiem.

## Acceptance Criteria

1. **Nguoi co quyen tao risk/blocker trong scope submit form thanh cong**
   - Given user co `risk.create` truc tiep hoac qua scope assignment cho target project/module
   - When submit form tao `risk` hoac `blocker`
   - Then service bat buoc co title, category, level, reason/description, related project/module, owner, deadline, next action, status va audit log
   - And record duoc persist qua repository contract chinh thuc, khong chi them vao mock executive action item
   - And Dashboard/Morning/Common Center co the hien risk moi sau reload neu user co `canViewRisk`.

2. **Thu ky/Tro ly duoc uy quyen tao/cap nhat trong pham vi duoc uy quyen**
   - Given Thu ky/Tro ly co active delegation cho `risk.create` hoac `risk.update`
   - When submit risk voi `onBehalfOf` va `delegationId` hop le trong scope delegation
   - Then service cho phep mutation, luu actor thuc te vao `createdBy/updatedBy`, luu principal vao `onBehalfOf`, va audit co `delegationId`
   - And role `thu_ky_tro_ly` khong duoc cap broad `risk.create`/`risk.update` chi de pass AC nay.

3. **Thieu quyen hoac ngoai scope bi chan truoc khi ghi**
   - Given user thieu `risk.create`/`risk.update`, delegation khong hop le, target ngoai scope, project archived, owner khong hop le hoac source record khong doc duoc
   - When goi direct Server Action hoac service mutation
   - Then service throw loi tieng Viet ro rang, repository khong tao/cap nhat record va khong ghi audit success
   - And UI disable/hide action chi la UX; service/action van la authority cuoi cung.

4. **Cap nhat risk/blocker giu history/audit nhung khong dong/override**
   - Given risk/blocker dang mo va user co `risk.update` trong current va next scope
   - When cap nhat title/category/level/reason/project/module/owner/deadline/next action/status mo
   - Then service validate current scope va next scope, persist patch, ghi audit `risk.updated` voi changed fields va old/new safe summary
   - And story nay khong cho status `closed/resolved`, khong implement close reason, khong implement manual red/yellow/green override.

5. **Form UX dung pattern van hanh**
   - Given user co quyen tao/cap nhat risk
   - When mo form tren executive risk surface hien co
   - Then form co label tieng Viet, required indicator, inline validation, giu input khi validation fail, pending/disabled state cho submit, va sticky/footer action neu form dai
   - And form khong render data/option ngoai scope de roi an bang client.

## Tasks / Subtasks

- [x] Dinh nghia domain contract risk/blocker chinh thuc (AC: 1, 4)
  - [x] UPDATE `src/modules/executive/types/index.ts` voi type toi thieu:
    - `ExecutiveRiskRecordType = "risk" | "blocker"`.
    - `ExecutiveRiskRecordStatus = "open" | "monitoring" | "in_progress" | "blocked"`.
    - `ExecutiveRiskRecord` gom `id`, `recordType`, `title`, `categoryKey`, `level`, `reason`, `description?`, `organizationId?`, `projectId?`, `axisId?`, `workstreamId?`, `moduleId?`, `ownerId`, `ownerName?`, `deadline`, `nextAction`, `status`, `sourceType?`, `sourceId?`, `createdBy`, `updatedBy`, `onBehalfOf?`, `delegationId?`, `createdAt`, `updatedAt`.
    - `CreateExecutiveRiskRecordInput` va `UpdateExecutiveRiskRecordInput`; update input phai co `riskId` va khong cho close/override fields.
  - [x] Stable keys dung lowercase/snake_case; label tieng Viet lay tu config/constants/UI, khong luu label lam source of truth.
  - [x] `projectId` hoac `moduleId` bat buoc. Neu khong co `projectId`, service phai co `organizationId/moduleId` du ro de scope-check; khong mac dinh global rong.
  - [x] `ownerId` la required field. `ownerName` chi la denormalized display/safe DTO neu can.

- [x] Them Zod validation cho form/action/service boundary (AC: 1, 3, 5)
  - [x] UPDATE `src/modules/executive/validation.ts` voi `createExecutiveRiskRecordInputSchema` va `updateExecutiveRiskRecordInputSchema`.
  - [x] Required messages tieng Viet cho `title`, `recordType`, `categoryKey`, `level`, `reason`, `projectId/moduleId`, `ownerId`, `deadline`, `nextAction`, `status`.
  - [x] `deadline` la date-only `YYYY-MM-DD`; khong dung localized date string.
  - [x] `level` reuse `ExecutiveRiskLevel`: `low | medium | high | critical`.
  - [x] `status` chi cho open statuses cua story nay: `open | monitoring | in_progress | blocked`; khong them `closed`, `resolved`, `overridden`.
  - [x] Validate category key bang active risk group trong service (`listActiveRiskGroups` hoac injected groups), khong hardcode trong schema.
  - [x] FormData parser trong action phai trim empty strings thanh `undefined` nhu existing action patterns; JSON parse loi phai co message ro.

- [x] Tao service/repository persistence cho official risk records (AC: 1, 3, 4)
  - [x] ADD `src/modules/executive/services/risk-record-repository.ts`.
    - JSON repository dung `.mock-data/executive-risk-records.json`, write atomic/retry theo pattern `JsonTaskRepository`.
    - Supabase repository map snake_case row sang camelCase domain, khong leak raw Supabase errors ra UI.
    - Public contract de xuat: `listRiskRecords(filters)`, `getRiskRecord(id)`, `createRiskRecord(record)`, `updateRiskRecord(id, patch)`.
  - [x] ADD `src/modules/executive/services/risk-record-service.ts`.
    - Public functions de xuat: `createExecutiveRiskRecord`, `updateExecutiveRiskRecord`, `listExecutiveRiskRecordsForDashboard`, `riskRecordAuditValue`, `buildExecutiveRiskItemFromRecord`.
    - Dependencies injectable: repository, riskGroups, users, projects, scope assignments, rolePermissionCatalog, delegation repository/catalog, auditWriter, idGenerator, now.
  - [x] Service phai check permission/scope truoc repository write. Khong dua permission logic vao repository.
  - [x] Service phai validate target project ton tai va chua archived khi co `projectId`.
  - [x] Service phai validate owner user ton tai/active; neu co `projectId`, owner phai co project membership hoac scoped read/write grant lien quan.
  - [x] Neu `sourceType/sourceId` la `task`, `document`, `proposal`, `meeting`, `decision`, `legal` hoac `project`, service phai verify source readable trong scope truoc khi link. Khong cho AI/system suggestion tu dong tao official blocker trong story nay.
  - [x] Neu audit write fail sau khi record write, khong report success gia. Uu tien repository atomic helper; neu chua co atomic helper thi rollback hoac throw loi co thong tin ro.

- [x] Them migration/RLS/seed cho Supabase parity (AC: 1, 3, 4)
  - [x] ADD migration `database/migrations/202606010001_create_executive_risk_records.sql` hoac next timestamp hop le.
  - [x] Tao table `executive_risk_records` voi cac cot snake_case tu domain contract, FK den `projects`, `users`, optional `leadership_delegations`, trigger `set_updated_at`, indexes cho `project_id`, `status`, `level`, `category_key`, `deadline`, `owner_id`.
  - [x] Check constraints:
    - `record_type in ('risk','blocker')`
    - `level in ('low','medium','high','critical')`
    - `status in ('open','monitoring','in_progress','blocked')`
    - `title`, `reason`, `next_action`, `category_key`, `owner_id`, `deadline` non-empty/non-null
    - at least one scope dimension (`project_id` or `module_id` or `organization_id`) present.
  - [x] UPDATE `database/policies/001_mvp_rls.sql` hoac add dedicated policy asset theo repo pattern:
    - read requires `risk.view` va project/scope readability.
    - insert requires `risk.create`, actor/scope match va `created_by = current_app_user_id()`.
    - update requires `risk.update` va current/next scope match.
    - audit_logs policy remains current-user/audit-users; do not rely on RLS as only guard.
  - [x] UPDATE `database/seeds/001_roles_permissions.sql` va `tests/fixtures/module-one-acceptance.json` neu permission fixture tracks catalog.
  - [x] ADD/UPDATE verification SQL, e.g. `database/verification/007_executive_risk_records_rls.sql`, for table/policy presence and basic allow/deny smoke if pattern supports it.

- [x] Them permission keys va catalog labels cho risk mutation (AC: 1, 2, 3)
  - [x] UPDATE `src/lib/permissions/can.ts` add `risk.create` va `risk.update` gan `risk.view`.
  - [x] UPDATE `ROLE_PERMISSIONS` carefully:
    - Grant direct create/update cho leadership/project roles co business authority: `chu_tich`, `tong_giam_doc`, `pho_tong_giam_doc`, `giam_doc_du_an`, `quan_ly_du_an` neu tests xac nhan.
    - Department/module responsible roles nen duoc cap qua scope assignment/catalog neu "if permissioned"; khong grant broad mutation mac dinh neu khong co ly do ro.
    - `thu_ky_tro_ly` khong nhan broad `risk.create`/`risk.update`; delegation handles on-behalf.
    - `viewer`, `pending`, external roles khong co mutation default.
    - `admin` khong nen nhan business risk mutation mac dinh chi vi `allPermissions`; neu `allPermissions` lam admin co `risk.create/update`, cap nhat filter va tests theo separation chairman/admin.
  - [x] UPDATE `src/modules/settings/services/role-permission-catalog-repository.ts` labels:
    - `risk.create`: "Tao risk/blocker dieu hanh"
    - `risk.update`: "Cap nhat risk/blocker dieu hanh"
  - [x] Ensure `isDelegationActionAllowed` cho phep `risk.create`/`risk.update` neu permission catalog actionType la create/update va khong sensitive/admin/approve.
  - [x] UPDATE `tests/unit/permissions.test.ts`, `tests/unit/role-permission-catalog.test.ts`, `tests/unit/module-one-seed-fixtures.test.ts` neu permission expectations doi.

- [x] Xu ly direct va delegated authorization trong service (AC: 1, 2, 3, 4)
  - [x] Reuse `can`, `canAccessScopedAction`, `hasAnyScopedActionGrant`, `requiresAssignmentScopeForRole`, `listActiveScopeAssignments`, `listRolePermissionCatalog`.
  - [x] Direct mutation:
    - For non-assignment full roles, require `can(actor, "risk.create/update")` and target project/source readable.
    - For assignment-model/scoped users, require `canAccessScopedAction(actor, "risk.create/update", targetScope, { scopeAssignments, rolePermissionCatalog })`.
  - [x] Delegated mutation:
    - If input co `onBehalfOf`, call `assertDelegatedActionAllowed` voi `actor`, `principalUserId: onBehalfOf`, action `risk.create`/`risk.update`, `delegationId?`, va same target scope.
    - Still validate target source/project/owner. Delegation khong bypass data validity.
    - Save `onBehalfOf` va `delegationId` in record and audit.
  - [x] Update mutation must check both current record scope and next input scope. Neu move project/module ngoai quyen, reject.
  - [x] Do not implement `risk.close`, `risk.override`, `risk.confirm_status` or AI accepted suggestion in this story.

- [x] Ghi audit compact va safe cho create/update (AC: 1, 2, 4)
  - [x] Use `createAuditLog` from `src/modules/users/services/user-service` by default, injected `auditWriter` in tests.
  - [x] Entity/action conventions:
    - `entityType: "risk"`
    - `action: "risk.created"` on create
    - `action: "risk.updated"` on update
  - [x] Audit new/old values only include compact safe summary: record type, title, categoryKey, level, status, projectId, moduleId, ownerId, deadline, nextAction, onBehalfOf, delegationId, changedFields.
  - [x] Do not store raw finance payload, document body, meeting transcript/minutes, AI output, unscoped source record or full form dump in audit payload.
  - [x] Failed permission/validation should not write success audit log.

- [x] Wire Server Actions va form state (AC: 1, 2, 3, 5)
  - [x] UPDATE `src/modules/executive/actions.ts`; preserve existing decision actions.
  - [x] Add `createExecutiveRiskRecordAction`, `updateExecutiveRiskRecordAction`, and state-action variants for forms.
  - [x] State action should return serializable form state with `status`, `message`, `fieldErrors`, and `fields` so input is preserved on validation fail. Do not use redirect-only action for the main risk form.
  - [x] `revalidatePath` after success:
    - `/command-center`
    - `/executive`
    - `/executive/decision-log` only if a linked decision is affected
    - `/projects/${projectId}` when projectId exists
  - [x] Server Action tests must mock `getCurrentUser`, service calls and `revalidatePath`; direct FormData call without permission must fail via service.

- [x] Integrate official records into existing risk DTO/read surfaces (AC: 1, 4)
  - [x] UPDATE `src/modules/executive/services/risk-status-service.ts` to add a mapper for official records, reusing existing `normalizeRiskLevel`, `mapRiskCategoryToConfiguredGroup`, `buildRiskStatusSuggestion`, `buildExecutiveRiskMap`, safe text and safe href behavior. Avoid duplicate sanitizer.
  - [x] UPDATE `src/modules/dashboard/services/executive-dashboard-service.ts`:
    - Extend `ExecutiveDashboardOptions.repositories` or add a risk repository option for tests.
    - Only load/list risk records when `permissions.canViewRisk` is true.
    - Filter persisted records by same access scope before DTO serialization.
    - Merge official records with derived risk action items before `buildExecutiveRiskMap`.
    - Keep `items` capped if UI needs it, but aggregate map/counts over full merged list.
  - [x] UPDATE `src/modules/dashboard/types.ts` if needed with `canCreateRisk`, `canUpdateRisk`, form options, or official risk source metadata.
  - [x] UPDATE `src/modules/dashboard/services/executive-morning-briefing-service.ts`, `executive-common-center-service.ts`, and `src/modules/workspaces/services/executive-private-workspace-service.ts` only as needed so created red/critical risks appear consistently via shared `ExecutiveRiskItem`.
  - [x] `sourceType` remains `"risk"`; use stable ids like `risk-record-${record.id}` to avoid collision with derived `risk-${action.id}`.
  - [x] Drill-down links/actions must continue through `safeInternalHref`; if no safe edit route exists, use inline form/modal or read-only action state, not handcrafted URLs from raw id.

- [x] Add risk create/update form to existing executive risk surface (AC: 1, 2, 5)
  - [x] ADD component in existing module boundary, e.g. `src/modules/executive/components/risk-record-form.tsx` or `src/modules/dashboard/components/executive-risk-record-form.tsx`; choose the location that avoids cross-module repository calls from UI.
  - [x] Integrate into `src/modules/dashboard/components/executive-risk-summary.tsx` or parent `CommandCenterDashboard` as a compact create/edit panel/sheet. Do not create a new full Risk Center route unless necessary.
  - [x] Render create/update actions only when DTO permissions say user can mutate in current scope. Do not render unauthorized project/owner options.
  - [x] Required Vietnamese labels:
    - "Loai ban ghi" (`risk`/`blocker`)
    - "Tieu de"
    - "Nhom risk"
    - "Muc do"
    - "Ly do / mo ta"
    - "Du an / module lien quan"
    - "Nguoi phu trach"
    - "Deadline xu ly"
    - "Hanh dong tiep theo"
    - "Trang thai"
  - [x] Inline validation near field; summary error at top allowed but not enough by itself.
  - [x] For delegated flow, show on-behalf option only from active delegations in scope; if no delegation, do not show fake on-behalf selector.
  - [x] UI must remain dense, operational, responsive, no nested cards, no hero/landing pattern.

- [x] Testing va verification (AC: 1, 2, 3, 4, 5)
  - [x] ADD `tests/unit/risk-record-service.test.ts`:
    - required field validation and date-only deadline
    - direct `risk.create` allow in scope
    - deny missing permission/out-of-scope/project archived
    - delegated create/update with `onBehalfOf` and audit
    - update checks current and next scope
    - no close/override status accepted
    - audit payload safe/compact
  - [x] ADD `tests/unit/risk-record-repository.test.ts` for JSON + Supabase row mapping parity if repository adds new row mapper.
  - [x] UPDATE `tests/unit/executive-dashboard-service.test.ts`:
    - persisted risk records appear in risk summary/riskMap
    - no-permission user does not load/serialize official risk source data
    - merged derived + official risks aggregate over full list
    - finance/raw source leakage regression remains green.
  - [x] UPDATE `tests/unit/risk-status-service.test.ts` for official record mapper and sanitizer.
  - [x] UPDATE `tests/unit/executive-actions.test.ts` for FormData parser/state action/revalidate behavior.
  - [x] UPDATE `tests/unit/command-center-dashboard.test.tsx` or add focused component test for create/update form labels, inline validation, input preservation, pending state, and permission-hidden action.
  - [x] UPDATE permission/catalog/seed/RLS tests as needed: `permissions.test.ts`, `role-permission-catalog.test.ts`, `module-one-seed-fixtures.test.ts`, `decision-rls-policy.test.ts` or a new `risk-record-rls-policy.test.ts`.
  - [x] Run `npm run typecheck`, `npm run lint`, `npm run test`.
  - [x] Run targeted tests during implementation, e.g. `npm run test -- tests/unit/risk-record-service.test.ts tests/unit/risk-status-service.test.ts tests/unit/executive-dashboard-service.test.ts tests/unit/executive-actions.test.ts`.
  - [x] Run `npm run test:e2e` only if adding a route/navigation flow or if component tests do not cover the new form behavior.

### Review Findings

- [x] [Review][Patch] Supabase audit rollback cannot clear optional fields that were originally empty [src/modules/executive/services/risk-record-repository.ts:271]
- [x] [Review][Patch] Owner validation accepts broad project viewers without project membership or scoped grant [src/modules/executive/services/risk-record-service.ts:376]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 5 yeu cau lanh dao xem risk/blocker theo nhom, muc do, trang thai do/vang/xanh, ly do, deadline va owner; tao/cap nhat/dong risk phai theo quyen; system/AI chi duoc dua goi y/draft cho toi khi nguoi co quyen xac nhan. [Source: `_bmad-output/planning-artifacts/epics/epic-5-risk-alert-center-cho-iu-hnh.md`]
- Story 5.3 cover FR-063, FR-069, NFR-005, NFR-006, UX-DR23. [Source: `_bmad-output/planning-artifacts/epics/epic-5-risk-alert-center-cho-iu-hnh.md`; `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-063: nguoi duoc tao risk/blocker gom lanh dao trong scope, giam doc du an, truong bo phan/nguoi phu trach module, task/document owners neu permissioned, va Thu ky/Tro ly neu duoc uy quyen. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-069: moi blocker can title, group, level, reason/description, related project/module, owner, deadline, next action, status va audit log. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-064/Story 5.5 chua nam trong scope: AI/system suggestion khong duoc thanh official blocker neu chua co human confirmation. Story 5.3 chi xu ly explicit human form submission.
- FR-065/FR-066/Story 5.4 chua nam trong scope: dong risk/blocker, override trang thai do/vang/xanh va close reason se lam sau.

### Current Code State

- `src/modules/executive/actions.ts` hien co Server Actions cho decision record va decision assignment. Neu them risk actions, giu helpers hien co va khong pha decision flows.
- `src/modules/executive/validation.ts` hien co schema cho investment/leadership/directive/approval/decision log, chua co official risk create/update schema.
- `src/modules/executive/types/index.ts` da co risk read-side types: `ExecutiveRiskLevel`, `RiskStatusKey`, `RiskStatusSuggestion`, `RiskStatusSourceData`, `RiskSignalSourceType`; chua co official persisted risk record type.
- `src/modules/executive/services/risk-status-service.ts` da co `normalizeRiskLevel`, `mapRiskCategoryToConfiguredGroup`, `buildRiskStatusSuggestion`, `buildExecutiveRiskItem`, `buildExecutiveRiskMap`; service da sanitize source href va top-level title/reason/nextAction. Reuse thay vi tao risk DTO builder song song.
- `src/modules/dashboard/types.ts` da co `ExecutiveRiskItem` voi `severity`, `severityLabel`, `likelihood`, `impact`, `matrixCellLabel`, `nextAction`, `categoryKey`, `categoryLabel`, `statusSuggestion`, `riskMap`.
- `src/modules/dashboard/services/executive-dashboard-service.ts` hien build risk summary tu `executiveData.leadershipActionItems`, gate bang `permissions.canViewRisk`, return empty risk summary khi user thieu quyen. Story 5.3 phai preserve behavior nay va chi load official risk records sau khi canViewRisk true.
- `src/modules/dashboard/services/executive-drilldown-source.ts` da co `safeInternalHref`, linked records, available actions, timeline, auditTrail va permissionState. Risk form/update links/actions phai tiep tuc dung guard nay.
- `src/lib/permissions/can.ts` hien chi co `risk.view`, chua co `risk.create`/`risk.update`. `admin` hien dung allPermissions-filter, nen khi them risk mutation phai test chairman/admin separation.
- `src/modules/settings/services/leadership-delegation-service.ts` da co `assertDelegatedActionAllowed`, `resolveDelegatedAction`, deny-list approval/admin va scope match. Risk create/update nen di qua helper nay cho on-behalf.
- `src/lib/audit` chi co README; audit writer thuc te hien la `createAuditLog` trong `src/modules/users/services/user-service.ts`, backed by `UserRepository.createAuditLog`.
- Chua co official risk repository/table. Story 5.1/5.2 co y tranh tao table vi read-only; Story 5.3 la story duoc phep tao persistence toi thieu cho official records.

### Previous Story Intelligence

- Story 5.1 review fixes phai giu:
  - `material_risk -> finance`, `land_risk -> planning_technical`, `compliance_risk -> system_permission`.
  - `RiskStatusSourceData` phai co safe title/reason/severity; optional safe href va permissionState.
  - Khong build/serialize risk DTO khi `canViewRisk` false.
  - High risk urgent categories `finance`, `legal`, `planning_technical` co the goi y red.
- Story 5.2 review fixes phai giu:
  - Risk map aggregate o service, khong tinh ad hoc trong UI.
  - Dashboard, Morning Briefing va Common Center dung cung `ExecutiveRiskItem` contract.
  - `statusSuggestion.sourceData.href` va top-level risk display text phai sanitize truoc khi serialization.
  - Khong them close/override hoac AI draft lifecycle.
- Story 1.4 delegation foundation da co `risk.create`/`risk.update`-compatible pattern neu permission catalog coi chung la create/update action an toan. Khong cap approval/admin action qua delegation.

### Architecture Guardrails

- Domain modules nam trong `src/modules/*`; service orchestration trong `services/*-service.ts`; repository adapters trong `services/*-repository.ts`; cross-cutting auth/permissions/audit trong `src/lib/*`. [Source: `_bmad-output/project-context.md`; `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- Internal mutations dung Next.js Server Actions trong `src/modules/*/actions.ts`, route handler chi cho external/public API. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`]
- Permission enforce deny-by-default o action/service truoc repository writes va truoc sensitive DTO serialization. UI hide/disable khong phai security. [Source: `docs/context/permissions-audit.md`; `_bmad-output/project-context.md`]
- Repository parity bat buoc: khi them persistence, update migration, JSON repository, Supabase mapper, RLS/policy assets, seeds/verification neu applicable va tests cung luc. [Source: `_bmad-output/project-context.md`]
- DB rows snake_case; domain DTO camelCase. Missing optional domain fields la `undefined`; repository map sang DB `null`. [Source: `_bmad-output/project-context.md`]
- Audit payload compact/safe; khong dump raw sensitive source data. [Source: `docs/context/permissions-audit.md`; `_bmad-output/project-context.md`]
- Khong them dependency moi, khong them global store. Stack hien tai: Next.js `^15.3.2`, React `^19.0.0`, TypeScript `^5.8.3`, Supabase JS `^2.49.4`, Zod `^3.24.4`, Vitest `^3.1.3`. [Source: `package.json`; `_bmad-output/project-context.md`]

### UX Guardrails

- Form phai co label tieng Viet, required indicator, inline validation, giu input khi validation fail, sticky action neu form dai. [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`; `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]
- Badge/status risk phai co text, khong chi dung mau. [Source: `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]
- Operational UI can dense but readable; khong dung landing/hero pattern trong app surface. [Source: `_bmad-output/planning-artifacts/ux-design-specification/design-system-foundation.md`]
- Drill-down/risk actions phai co title, scope, owner, deadline, status, reason, linked records, action theo quyen, timeline/audit neu co. [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`]
- Permission/403 state khong render du lieu roi moi an; empty/no-permission states phai tach bach. [Source: `docs/context/permissions-audit.md`; `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`]

### Suggested Contract Sketch

Ten file/type co the dieu chinh theo code style, nhung intent phai giu: official record, scoped mutation, audit, dashboard integration, no close/override.

```ts
export type ExecutiveRiskRecordType = "risk" | "blocker";
export type ExecutiveRiskRecordStatus =
  | "open"
  | "monitoring"
  | "in_progress"
  | "blocked";

export type ExecutiveRiskRecord = {
  id: string;
  recordType: ExecutiveRiskRecordType;
  title: string;
  categoryKey: string;
  level: ExecutiveRiskLevel;
  reason: string;
  description?: string;
  organizationId?: string;
  projectId?: string;
  axisId?: string;
  workstreamId?: string;
  moduleId?: string;
  ownerId: string;
  ownerName?: string;
  deadline: string;
  nextAction: string;
  status: ExecutiveRiskRecordStatus;
  sourceType?: RiskSignalSourceType;
  sourceId?: string;
  createdBy: string;
  updatedBy?: string;
  onBehalfOf?: string;
  delegationId?: string;
  createdAt: string;
  updatedAt: string;
};
```

Mapper to `ExecutiveRiskItem` should produce:

- `sourceType: "risk"`
- `sourceId: record.id`
- `id: risk-record-${record.id}`
- `severity/impact` from `record.level`
- `categoryKey/categoryLabel` from active risk group config
- `owner` from safe `ownerName ?? ownerId`
- `deadline`, `nextAction`, `statusSuggestion`
- optional linked project/module records with permission state

### File Targets

Expected ADD:
- `src/modules/executive/services/risk-record-repository.ts`
- `src/modules/executive/services/risk-record-service.ts`
- `src/modules/executive/components/risk-record-form.tsx` or scoped dashboard equivalent
- `database/migrations/202606010001_create_executive_risk_records.sql`
- `database/verification/007_executive_risk_records_rls.sql` if verification numbering fits
- `tests/unit/risk-record-service.test.ts`
- `tests/unit/risk-record-repository.test.ts`

Expected UPDATE:
- `src/modules/executive/types/index.ts`
- `src/modules/executive/validation.ts`
- `src/modules/executive/actions.ts`
- `src/modules/executive/services/risk-status-service.ts`
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/services/executive-common-center-service.ts` if risk overview consumes copied summary
- `src/modules/dashboard/services/executive-morning-briefing-service.ts` if top risks need official records
- `src/modules/dashboard/services/executive-drilldown-source.ts` only if new linked/action metadata needs sanitizer support
- `src/modules/dashboard/components/executive-risk-summary.tsx`
- `src/modules/command-center/components/command-center-dashboard.tsx` if parent owns modal/form state
- `src/lib/permissions/can.ts`
- `src/modules/settings/services/role-permission-catalog-repository.ts`
- `database/seeds/001_roles_permissions.sql`
- `database/policies/001_mvp_rls.sql`
- `tests/unit/risk-status-service.test.ts`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/executive-actions.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/permissions.test.ts`
- `tests/unit/role-permission-catalog.test.ts`
- `tests/unit/module-one-seed-fixtures.test.ts`

Avoid:
- Khong tao `src/modules/risks` rieng neu `src/modules/executive` du cho Epic 5 boundary.
- Khong tao full `/risks` hay Risk Center route moi neu Dashboard/Common/Morning surfaces du cho AC.
- Khong them `risk.close`, `risk.override`, status `closed/resolved`, manual red/yellow/green confirmation.
- Khong tao AI/system accepted suggestion lifecycle.
- Khong render unauthorized records/options va hide bang CSS/client.
- Khong store raw source payload trong audit/risk DTO.
- Khong add charting/form state/global-store dependencies.

### Testing Guidance

- Service tests nen inject temp JSON repository, fake audit writer, fake user/project repositories, fake delegations va fixed `now`.
- Permission tests phai cover both static role permission va scoped assignment/delegation paths.
- Repository tests phai assert Supabase row mapping converts `null` to `undefined` and date-only fields stay `YYYY-MM-DD`.
- Dashboard tests phai assert serialized output with `canViewRisk=false` khong chua title/sourceData cua official risk record.
- Component tests phai assert user-visible label/validation, not private implementation. Use Testing Library.
- For migration/RLS tests, follow existing SQL policy test style; do not require live Supabase unless repo has smoke script path.

### Latest Tech Notes

- Theo workflow customization cua project, story noi bo nay dung package.json va project-context; khong can web research vi khong dung API/library ben ngoai moi hoac bat on.
- Validation baseline bat buoc sau implement: `npm run typecheck`, `npm run lint`, `npm run test`. [Source: `docs/context/testing.md`; `package.json`]

### Git / Worktree Notes

- Recent commits: `d4db6c7 4.1 done`, `9696080 Module 1: story 4.1`, `484589a 2205`, `a8162e3 first fcm`.
- Worktree dang dirty voi nhieu thay doi/untracked tu Epic 4/5 va sprint artifacts. Dev agent khong duoc revert thay doi khong thuoc story; neu cham file dirty, doc current content va patch toi thieu.

## Project Structure Notes

- Story aligns with existing modular monolith: risk mutation belongs under `src/modules/executive`, shared dashboard rendering under `src/modules/dashboard`, permission catalog under `src/lib/permissions` and `src/modules/settings`, persistence assets under `database/*`.
- No structural conflict detected, but adding official risk persistence creates a durable pattern. Keep repository/service/test names explicit (`risk-record-*`) to avoid colliding with read-side `risk-status-service`.

### References

- `_bmad-output/planning-artifacts/epics/epic-5-risk-alert-center-cho-iu-hnh.md`
- `_bmad-output/planning-artifacts/epics/requirements-inventory.md`
- `_bmad-output/project-context.md`
- `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
- `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`
- `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`
- `docs/context/permissions-audit.md`
- `docs/context/testing.md`
- `src/modules/executive/actions.ts`
- `src/modules/executive/validation.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/executive/services/risk-status-service.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/services/executive-drilldown-source.ts`
- `src/lib/permissions/can.ts`
- `src/lib/permissions/access-scope.ts`
- `src/modules/settings/services/leadership-delegation-service.ts`
- `src/modules/users/services/user-service.ts`
- `_bmad-output/implementation-artifacts/5-1-risk-levels-categories-va-status-suggestion.md`
- `_bmad-output/implementation-artifacts/5-2-risk-map-va-drill-down-matrix.md`
- `_bmad-output/implementation-artifacts/1-4-delegation-cho-thu-ky-tro-ly-theo-lanh-dao.md`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run typecheck` - passed
- `npm run lint` - passed
- `npm run test -- tests/unit/risk-record-service.test.ts tests/unit/risk-record-repository.test.ts tests/unit/risk-status-service.test.ts tests/unit/executive-dashboard-service.test.ts tests/unit/executive-actions.test.ts tests/unit/risk-record-form.test.tsx tests/unit/risk-record-rls-policy.test.ts tests/unit/permissions.test.ts tests/unit/role-permission-catalog.test.ts tests/unit/module-one-seed-fixtures.test.ts` - passed
- `npm run test` - passed, 80 test files / 501 tests

### Completion Notes List

- Implemented official risk/blocker persistence contract with JSON and Supabase repositories, validation schemas, scoped create/update service, delegated on-behalf handling, rollback on audit failure, and safe compact audit payloads.
- Added `risk.create` / `risk.update` permissions, catalog labels, seed/fixture parity, Supabase migration, RLS policy helpers, and verification SQL.
- Integrated official risk records into executive dashboard risk summary, permissions DTOs, workspace permissions, and existing risk item mapping without adding close/override or AI acceptance lifecycle.
- Added dense operational create/update risk form with Vietnamese labels, field preservation, inline errors, disabled/pending submit state, and in-scope delegation selector.
- Added/updated unit coverage for service, repository, actions, dashboard DTOs, UI form, permissions/catalog/seeds, RLS policy assets, and official risk item mapping. `npm run test:e2e` was not run because no new route/navigation flow was added and component/service tests cover the new form behavior.

### File List

- `_bmad-output/implementation-artifacts/5-3-tao-va-cap-nhat-risk-blocker-theo-quyen.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `database/migrations/202606010001_create_executive_risk_records.sql`
- `database/policies/001_mvp_rls.sql`
- `database/seeds/001_roles_permissions.sql`
- `database/verification/007_executive_risk_records_rls.sql`
- `src/lib/permissions/can.ts`
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`
- `src/modules/dashboard/components/executive-risk-summary.tsx`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/types.ts`
- `src/modules/executive/actions.ts`
- `src/modules/executive/components/risk-record-form.tsx`
- `src/modules/executive/services/risk-record-repository.ts`
- `src/modules/executive/services/risk-record-service.ts`
- `src/modules/executive/services/risk-status-service.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/executive/validation.ts`
- `src/modules/settings/services/role-permission-catalog-repository.ts`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `src/modules/workspaces/types.ts`
- `tests/fixtures/module-one-acceptance.json`
- `tests/unit/executive-actions.test.ts`
- `tests/unit/executive-common-center-service.test.ts`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/executive-drilldown-source.test.ts`
- `tests/unit/module-one-seed-fixtures.test.ts`
- `tests/unit/permissions.test.ts`
- `tests/unit/risk-record-form.test.tsx`
- `tests/unit/risk-record-repository.test.ts`
- `tests/unit/risk-record-rls-policy.test.ts`
- `tests/unit/risk-record-service.test.ts`
- `tests/unit/risk-status-service.test.ts`
- `tests/unit/role-permission-catalog.test.ts`
