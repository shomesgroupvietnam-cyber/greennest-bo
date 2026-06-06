# Story 7.3: Export Theo Permission Va Audit

Status: done

Generated: 2026-06-03

Requirements Covered: FR-083, FR-084, NFR-005, NFR-006, NFR-012, AC-015, AC-017

Completion Note: Ultimate context engine analysis completed - comprehensive developer guide created.

## Story

As a nguoi dung co quyen xuat du lieu,
I want export dashboard, approval history hoac audit log theo permission,
so that du lieu dieu hanh duoc chia se co kiem soat va co vet audit.

## Acceptance Criteria

1. Given user co quyen `report.export`, when export dashboard, approval history hoac audit log, then system tao export payload/file chi gom du lieu trong scope va ghi audit log thanh cong voi payload audit an toan.
2. Given export co du lieu nhay cam, when user thieu permission nhay cam rieng nhu `finance.view` hoac `audit.view`, then service phai block target do hoac redact field nhay cam truoc khi tao export. Raw finance amount, raw audit `oldValue/newValue`, meeting minutes, AI text, document URL va provider metadata khong duoc lo trong payload/DOM.
3. Given user thieu `report.export`, when user goi truc tiep export service/action/route, then system tra permission error, khong tao file/export payload va khong ghi audit success `report.export`.
4. Given filter/scope dang ap dung trong History Center hoac Command Center, when user export, then export phai preserve `scopeId`, project/module/type/actor/status/severity/date/query/limit va ap dung permission filtering o service layer truoc khi serialize.
5. Given export thanh cong, when audit log duoc ghi, then audit payload chi gom metadata nhu `exportId`, `target`, `format`, `filters`, `scopeId`, `itemCount`, `total`, `sensitiveIncluded`, `redactedFields` va khong chua noi dung export.

## Tasks / Subtasks

- [x] Them permission `report.export` va tach nghia voi `report.create` (AC: 1, 3)
  - [x] Update `src/lib/permissions/can.ts`: them `report.export` vao `PERMISSIONS`.
  - [x] Cap `report.export` ban dau cho cac role dang co `report.create` de khong regression kha nang xuat bao cao hien tai; read-only roles nhu `viewer` van khong co export.
  - [x] Khong xoa `report.create`; permission nay tiep tuc dai dien cho tao stored report snapshot trong `generateReportAction`.
  - [x] Update `src/modules/settings/services/role-permission-catalog-repository.ts`: label `report.create` nen la tao bao cao/snapshot, label `report.export` nen la xuat du lieu/bao cao, `report.export` co `actionType: "export"` qua rule `.export`.
  - [x] Cap nhat seed/fixture/catalog parity neu co permission list rieng: `database/seeds/001_roles_permissions.sql`, `tests/fixtures/module-one-acceptance.json`, tests catalog/permissions lien quan.

- [x] Tao service export trong Reports module (AC: 1, 2, 3, 4, 5)
  - [x] Them service moi, de xuat `src/modules/reports/services/history-export-service.ts` hoac `src/modules/reports/services/report-export-service.ts`.
  - [x] Input nhan `PermissionUser`, `target`, `format`, history filters, `selectedScopeId?`, dependencies injectable va optional `now`.
  - [x] `target` toi thieu: `dashboard`, `approval_history`, `audit_log`. Neu them `history_archive`, no phai reuse cung History Archive DTO va khong tao scope/filter rieng.
  - [x] `format` toi thieu: `json` va `csv`. Khong them PDF/DOCX/library export moi trong story nay.
  - [x] Guard dau tien: user phai co `can(user, "report.export")` hoac scoped grant `report.export`; fail fast truoc khi load dashboard/history/audit source.
  - [x] Dashboard export phai reuse `getExecutiveDashboardData` hoac DTO sanitized tu dashboard service. Khong doc raw proposal/project/finance repositories rieng de build export.
  - [x] Approval history export phai reuse `getHistoryArchiveData` voi filter type/module phu hop, sau do serialize tu `HistoryArchiveData.items` da duoc scope/permission filter.
  - [x] Audit log export phai yeu cau `audit.view` hoac scoped grant `audit.view`; neu khong co thi block va khong tra payload. Khong cho audit target chi "redact" thanh raw-free audit list rong neu user dang goi truc tiep target audit.
  - [x] Finance-sensitive fields phai di theo redaction hien co cua dashboard/approval DTO: user thieu `finance.view` thay `financialSummary.state = "no_permission"` hoac `financialAccess = "no_permission"`, khong thay amount/amountLabel.
  - [x] Tao `exportId` bang `crypto.randomUUID()` hoac injectable id generator trong service test; filename on dinh theo `target`, timestamp, format.

- [x] Them validation schema va type contract cho export (AC: 1, 2, 4)
  - [x] Update `src/modules/reports/types.ts` voi type nhu `ReportExportTarget`, `ReportExportFormat`, `ReportExportRequest`, `ReportExportResult`, `ReportExportSummary`.
  - [x] Update `src/modules/reports/validation.ts` voi schema parse `target`, `format`, history filters va `scopeId`.
  - [x] Reuse `historyArchiveFilterSchema`; khong parse query/date/status bang string ad hoc trong component/action.
  - [x] `limit` ap dung sau permission filtering nhu Story 7.1/7.2; export khong duoc lay raw all-records roi loc client-side.

- [x] Wire server action hoac download route vao Reports surface (AC: 1, 3, 4, 5)
  - [x] Update `src/modules/reports/actions.ts` hoac tao route handler chi neu can browser file response. Moi action/route phai goi service export, khong duplicate permission/audit logic.
  - [x] Dung `getCurrentUser()`/session guard hien co, resolve `scopeId` va scope assignments tu Command Center pattern neu export den tu `executive-history`.
  - [x] Sau export thanh cong, goi `createAuditLog` voi `entityType: "report_export"`, `entityId: exportId`, `action: "report.export"`.
  - [x] Audit `newValue` chi gom safe summary. Khong ghi exported content, raw event summaries dai, raw dashboard DTO, raw audit payload, raw filters object chua duoc normalize.
  - [x] Permission failure phai tra loi ro rang va khong tao payload/file. Neu muon audit denied access, dung action rieng nhu `report.export_denied` theo pattern security hien co, nhung khong tinh la success audit.

- [x] Them control export co ban trong History Center/Command Center (AC: 1, 3, 4)
  - [x] Update `src/modules/reports/components/history-archive-center.tsx` de hien thi export controls chi khi DTO/permission cho biet user co `report.export`.
  - [x] Neu can, mo rong `HistoryArchiveData.permissions` hoac `HistoryArchiveCenterData` voi `canExport` va cac target duoc phep. Gia tri nay phai tinh server-side.
  - [x] Export controls preserve `view=executive-history`, `scopeId`, va cac filter hien tai. Khong reset context khi user export.
  - [x] Hide/disable audit export target neu user thieu `audit.view`; dashboard/approval targets van co the export voi redaction neu `report.export` pass.
  - [x] UI phai compact, dung existing `Button`/Tailwind/lucide icon neu can. Khong tao landing page, hero, modal phuc tap hay state QA day du trong story nay; Story 7.4 xu ly loading/error/QA states.

- [x] Cap nhat Command Center data flow neu can `canExport` server-side (AC: 1, 4)
  - [x] Update `src/modules/reports/services/history-archive-center-service.ts` de gan export permissions vao DTO, reuse rolePermissionCatalog/scopeAssignments da duoc Command Center truyen vao.
  - [x] Update `src/modules/command-center/services/command-center-service.ts` neu can pass selected scope va scoped grants cho export DTO. Khong load history data cho moi view neu user khong o `executive-history`.
  - [x] Update `src/modules/command-center/types.ts` chi neu DTO type thay doi. Khong rewrite `CommandCenterDashboard` ngoai view branch hien co.

- [x] Tests bat buoc (AC: 1-5)
  - [x] Add `tests/unit/history-export-service.test.ts` hoac `tests/unit/report-export-service.test.ts`.
  - [x] Test user co `report.export` export `approval_history` chi nhan visible/scoped events va success audit summary dung.
  - [x] Test user thieu `report.export` bi reject truoc khi load source, khong co payload va audit writer khong duoc goi.
  - [x] Test `audit_log` target voi user thieu `audit.view` bi block, khong tao payload/file.
  - [x] Test finance redaction: dashboard/approval export cho user thieu `finance.view` khong chua sentinel amount, `amountLabel`, raw proposal finance payload.
  - [x] Test CSV/JSON serializer khong dump raw audit `oldValue/newValue`, meeting minutes, AI output, document URL hoac provider metadata.
  - [x] Update `tests/unit/permissions.test.ts` va `tests/unit/role-permission-catalog.test.ts` cho `report.export`.
  - [x] Update `tests/unit/history-archive-center.test.tsx` neu them export controls.
  - [x] Update `tests/unit/command-center-service.test.ts`/`command-center-dashboard.test.tsx` neu Command Center DTO/view thay doi.
  - [x] Run targeted tests: `npm run test -- tests/unit/history-export-service.test.ts tests/unit/history-archive-service.test.ts tests/unit/history-archive-center.test.tsx tests/unit/permissions.test.ts tests/unit/role-permission-catalog.test.ts`.
  - [x] Before mark done: `npm run typecheck`, `npm run lint`, `npm run test`.

### Review Findings

- [x] [Review][Patch] Dashboard export must apply full History Center filters before serialization [src/modules/reports/services/report-export-service.ts:375]
- [x] [Review][Patch] Scoped export grants are treated as global and `scopeId` is not enforced for approval/audit export [src/modules/reports/services/report-export-service.ts:394]
- [x] [Review][Patch] Inactive users can pass export guards through scoped grants because `roleActive` is dropped [src/lib/permissions/access-scope.ts:263]
- [x] [Review][Patch] CSV export does not neutralize formula injection cells [src/modules/reports/services/report-export-service.ts:306]
- [x] [Review][Patch] Invalid export filters are swallowed and can widen exported data [src/modules/reports/validation.ts:58]
- [x] [Review][Patch] Export keeps event summaries verbatim, allowing free-text meeting/audit details into payload/CSV [src/modules/reports/services/report-export-service.ts:200]
- [x] [Review][Patch] Export download responses lack no-store/nosniff headers for sensitive files [src/app/(dashboard)/reports/export/route.ts:46]
- [x] [Review][Patch] Route/action duplicate export filter parsing instead of sharing schema-backed boundary parsing [src/app/(dashboard)/reports/export/route.ts:11]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 7 yeu cau History, Archive, Export va Audit Visibility. Story 7.3 la diem kiem soat export: dashboard, approval history, audit log phai duoc xuat theo permission va co audit log. [Source: `_bmad-output/planning-artifacts/epics/epic-7-history-archive-export-v-audit-visibility.md`]
- PRD FR-083 yeu cau export dashboard, audit log va approval history bi gioi han boi quyen `Xuat du lieu`; FR-084 yeu cau sensitive export can permission rieng va audit log. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]
- NFR-005/NFR-006/NFR-012 yeu cau mutation/export quan trong phai check permission o server/service, ghi audit va khong lo du lieu nhay cam. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`; `docs/context/permissions-audit.md`]

### Current Code State

- `src/lib/permissions/can.ts` hien chua co `report.export`; chi co `report.view` va `report.create`. Do not use `report.create` lam export guard cho Story 7.3. [Source: `src/lib/permissions/can.ts`]
- `src/modules/settings/services/role-permission-catalog-repository.ts` hien label `report.create` la "Xuat du lieu/bao cao" va `inferActionType` xem `report.create` nhu `export`. Story nay can tach semantics de catalog khong nhap nhang. [Source: `src/modules/settings/services/role-permission-catalog-repository.ts`]
- `src/modules/settings/services/leadership-delegation-service.ts` da chan `actionType: "export"` khoi delegation. Neu `report.export` duoc infer actionType export thi khong can them rule rieng tru khi test yeu cau. [Source: `src/modules/settings/services/leadership-delegation-service.ts`]
- `src/modules/reports/actions.ts` hien co `generateReportAction`, guard `report.create`, tao stored report snapshot va audit `report.create`. Khong doi thanh `report.export`; export la action rieng. [Source: `src/modules/reports/actions.ts`]
- `src/modules/reports/services/report-service.ts` build/persist stored `ReportRun` snapshots. History/Export live aggregate khong duoc lam vo behavior "detail pages read stored snapshot, not recompute live data". [Source: `src/modules/reports/services/report-service.ts`; `src/modules/reports/README.md`]
- Story 7.1/7.2 da tao `getHistoryArchiveData`, `getHistoryArchiveCenterData`, `HistoryArchiveCenter`, Command Center view `executive-history`, URL filters va permission-safe DTO. Export phai reuse nhung contract nay thay vi aggregate lai tu repositories. [Source: `src/modules/reports/services/history-archive-service.ts`; `src/modules/reports/services/history-archive-center-service.ts`; `src/modules/reports/components/history-archive-center.tsx`; `_bmad-output/implementation-artifacts/7-1-history-archive-center-service.md`; `_bmad-output/implementation-artifacts/7-2-search-filter-va-timeline-ui.md`]
- `getCommandCenterData` da ap dung selected `scopeId` vao history filters qua `applySelectedScopeProjectFilter` va truyen `rolePermissionCatalog`/`scopeAssignments` vao History Center data. Reuse duong nay cho `canExport` hoac export context. [Source: `src/modules/command-center/services/command-center-service.ts`]
- `getExecutiveDashboardData` da co finance redaction bang `finance.view`/scoped grants: `financialSummary.state = "no_permission"` va approval/project items co `financialAccess`. Dashboard export phai serialize DTO nay, khong lay raw amount tu repository. [Source: `src/modules/dashboard/services/executive-dashboard-service.ts`; `src/modules/dashboard/types.ts`]
- `createAuditLog` va `listAuditLogs` nam trong `src/modules/users/services/user-service.ts`; audit payload la `oldValue/newValue` free-form nen Story 7.3 phai chu dong giu audit value gon va safe. [Source: `src/modules/users/services/user-service.ts`; `src/modules/users/types.ts`]

### Suggested Export Contract

```ts
export type ReportExportTarget = "dashboard" | "approval_history" | "audit_log";
export type ReportExportFormat = "json" | "csv";

export type ReportExportRequest = {
  target: ReportExportTarget;
  format: ReportExportFormat;
  filters?: HistoryArchiveFilters;
  scopeId?: string;
};

export type ReportExportResult = {
  exportId: string;
  target: ReportExportTarget;
  format: ReportExportFormat;
  filename: string;
  mimeType: string;
  content: string;
  generatedAt: string;
  summary: {
    itemCount: number;
    total?: number;
    sensitiveIncluded: boolean;
    redactedFields: string[];
    filters?: HistoryArchiveFilters;
    scopeId?: string;
  };
};
```

Implementation notes:

- JSON export can serialize the sanitized DTO/result envelope. CSV export should use a small local escaping helper; do not add CSV/PDF/DOCX packages.
- Audit log should store `summary`, not `content`.
- `sensitiveIncluded` should be `true` only when the exported payload actually includes sensitive fields allowed by separate permission, not merely because the target is sensitive.
- For audit export, prefer block without `audit.view`; for dashboard finance, prefer redaction because dashboard DTO already supports no-permission state.

### Architecture Guardrails

- Required flow: route/action -> session/permission/scope -> Reports export service -> sanitized DTO/serializer -> optional UI download. Components must not import repositories or Supabase clients. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- Permission/scope filtering must happen before serialization. Do not export raw arrays then filter CSV rows in client code. [Source: `_bmad-output/project-context.md`; `docs/context/permissions-audit.md`]
- Keep data contracts camelCase in app/service code; repository/Supabase snake_case mapping stays inside adapters. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`]
- Do not add new global store, event bus, export persistence table, archive table, cache layer, PDF/DOCX/CSV dependency, or background job queue for this story. [Source: `_bmad-output/project-context.md`; `package.json`]
- If a browser download route is needed, keep it thin and Reports-owned: auth/parse/call service/return response. The service remains the testable source of truth.

### UX Guardrails

- Export controls belong in the existing History Center operational surface, not a new landing page. [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`]
- Controls must preserve active filters and scope. A user should not have to reselect `scopeId`, project, module, date, type or query after export. [Source: `_bmad-output/implementation-artifacts/7-2-search-filter-va-timeline-ui.md`]
- Hide/disable unavailable targets with clear button labels. Do not show raw permission internals in user-facing text. Story 7.4 will add richer export states/QA; Story 7.3 only needs basic usable controls and access behavior.

### Previous Story Intelligence

- Story 7.1 established the safe live aggregate DTO. Important review fixes: scoped grants affect source loading, limit applies after filtering, audit summaries cannot expose free text, and document version notes are sanitized. Do not bypass those fixes during export. [Source: `_bmad-output/implementation-artifacts/7-1-history-archive-center-service.md`]
- Story 7.2 integrated `executive-history` into Command Center and fixed URL scope/filter behavior. Export must preserve the same URL/query context. [Source: `_bmad-output/implementation-artifacts/7-2-search-filter-va-timeline-ui.md`]
- After Story 7.2 review patches, the baseline verification passed: `npm run typecheck`, `npm run lint`, and `npm run test` with 89 test files and 640 tests. Keep this baseline green.
- Git history is sparse (`4.1 done`, `Module 1: story 4.1`, older bootstrap commits) and the current worktree is heavily dirty from generated story/code artifacts. Do not revert unrelated files while implementing this story.

### Project Structure Notes

- Expected NEW:
  - `src/modules/reports/services/history-export-service.ts` or `src/modules/reports/services/report-export-service.ts`
  - `tests/unit/history-export-service.test.ts` or `tests/unit/report-export-service.test.ts`
- Possible NEW:
  - Thin route handler for file response only if needed by implementation.
- Expected UPDATE:
  - `src/lib/permissions/can.ts`
  - `src/modules/settings/services/role-permission-catalog-repository.ts`
  - `database/seeds/001_roles_permissions.sql`
  - `src/modules/reports/types.ts`
  - `src/modules/reports/validation.ts`
  - `src/modules/reports/actions.ts`
  - `src/modules/reports/services/history-archive-center-service.ts`
  - `src/modules/reports/components/history-archive-center.tsx`
  - `src/modules/command-center/services/command-center-service.ts` only if export permission/scope DTO needs wiring
  - Relevant unit tests listed above
- Avoid:
  - No new history/export persistence table.
  - No broad rewrite of dashboard/history aggregation.
  - No raw `listAuditLogs()` export outside History Archive permission filtering.
  - No use of `report.create` as export permission.

### References

- `_bmad-output/planning-artifacts/epics/epic-7-history-archive-export-v-audit-visibility.md` - Epic 7 and Story 7.3 AC.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-083, FR-084, NFR-005, NFR-006, NFR-012, AC-015, AC-017.
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md` - service/action flow, DTO, no new global state/deps.
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md` - module boundary guidance.
- `_bmad-output/project-context.md` - stack versions, permission filtering, testing commands.
- `docs/context/permissions-audit.md` - permission/audit safety rules.
- `docs/context/testing.md` - expected verification commands.
- `src/lib/permissions/can.ts` - current permission constants and role permissions.
- `src/modules/reports/services/history-archive-service.ts` - current permission-safe history aggregate.
- `src/modules/reports/services/history-archive-center-service.ts` - current History Center DTO wrapper.
- `src/modules/dashboard/services/executive-dashboard-service.ts` - dashboard permission/sensitive finance redaction.
- `src/modules/users/services/user-service.ts` - audit writer contract.

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Implementation Plan

- Follow task order with red-green-refactor.
- Keep export logic in Reports services/actions, reuse sanitized dashboard/history DTOs, and avoid new export dependencies.
- Preserve server-side permission/scope filtering before serialization and audit only safe export metadata.

### Debug Log References

- `npm run test -- tests/unit/permissions.test.ts tests/unit/role-permission-catalog.test.ts`
- `npm run test -- tests/unit/permissions.test.ts tests/unit/role-permission-catalog.test.ts tests/unit/module-one-seed-fixtures.test.ts`
- `npm run test -- tests/unit/report-export-service.test.ts tests/unit/history-archive-service.test.ts tests/unit/history-archive-center.test.tsx tests/unit/permissions.test.ts tests/unit/role-permission-catalog.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run test -- tests/unit/report-export-service.test.ts`
- `npm run test -- tests/unit/report-export-service.test.ts tests/unit/history-archive-service.test.ts tests/unit/history-archive-center.test.tsx tests/unit/permissions.test.ts tests/unit/role-permission-catalog.test.ts`
- `npm run test` (90 test files, 652 tests)

### Completion Notes List

- Added `report.export` as a distinct permission, granted it to existing `report.create` roles only, kept `report.create` for stored report snapshot creation, and updated catalog/seed/fixture parity.
- Added Reports export service with JSON/CSV serializers, fail-fast `report.export` guard, `audit.view` gate for audit exports, dashboard/history DTO reuse, safe redaction, stable filenames, injectable dependencies and safe success audit summaries.
- Added `/reports/export` download route and `exportReportAction` adapter; History Center now receives server-computed `canExport`/target permissions and renders compact export controls preserving current scope/filter context.

### File List

- `_bmad-output/implementation-artifacts/7-3-export-theo-permission-va-audit.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/app/(dashboard)/reports/export/route.ts`
- `src/lib/permissions/access-scope.ts`
- `src/lib/permissions/can.ts`
- `src/modules/reports/actions.ts`
- `src/modules/reports/components/history-archive-center.tsx`
- `src/modules/reports/services/history-archive-service.ts`
- `src/modules/reports/services/report-export-service.ts`
- `src/modules/reports/types.ts`
- `src/modules/reports/validation.ts`
- `database/seeds/001_roles_permissions.sql`
- `database/seeds/003_module1_acceptance_demo.sql`
- `database/verification/001_staging_validation.sql`
- `src/modules/settings/services/role-permission-catalog-repository.ts`
- `tests/fixtures/module-one-acceptance.json`
- `tests/unit/history-archive-center.test.tsx`
- `tests/unit/permissions.test.ts`
- `tests/unit/report-export-service.test.ts`
- `tests/unit/role-permission-catalog.test.ts`

### Change Log

- 2026-06-03: Implemented permission-scoped Reports export with safe serialization, audit summary, History Center controls, route/action wiring, and regression coverage.
- 2026-06-03: Resolved code review findings for scoped export enforcement, dashboard filter application, strict export validation, CSV hardening, safe summaries, no-cache headers, and shared boundary parsing.
