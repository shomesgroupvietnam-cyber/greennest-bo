# Story 7.4: History Export States Va QA Nghiem Thu

Status: done

Generated: 2026-06-04

Requirements Covered: FR-080, FR-082, FR-083, FR-084, NFR-004, UX-DR22, UX-DR26, UX-DR30, UX-DR31, UX-DR32, AC-015, AC-017

Completion Note: Ultimate context engine analysis completed - comprehensive developer guide created.

## Story

As a product owner,
I want History/Archive/Export co loading, empty, error, unauthorized va responsive states,
so that nghiem thu Module 1 bao phu traceability, export va permission mot cach ro rang.

## Acceptance Criteria

1. **Empty state phan biet scope va filter**
   - Given History Center khong co event trong scope, when render, then UI noi ro "khong co du lieu trong scope" va khong goi y action bat kha thi.
   - Given co active filters nhung khong co ket qua, when render, then UI noi ro "khong co ket qua theo filter", co action/link clear filters giu `view=executive-history` va `scopeId`.
   - Empty state khong hien source counts gia, event source, export target khong kha dung, hoac text lam nguoi dung hieu la co du lieu bi an.

2. **Loading state on dinh va accessible**
   - Given Command Center/History dang tai data, when loading state render, then co skeleton/status text accessible, layout khong nhay bat thuong, khong hien stale restricted data va fit mobile 360/390/430px.
   - Loading state khong can tao spinner dependency moi; dung Tailwind/existing UI patterns.

3. **Error state an toan, co duong retry**
   - Given History Center hoac filter option loader loi tam thoi, when UI hien error state, then co retry/reset hoac link quay ve Command Center/workspace phu hop.
   - Error UI khong render stack trace, raw Zod/Supabase/repository message, export payload, audit payload, record title ngoai quyen, hoac "Application error" thieu ngu canh.
   - Filter option loader phu nhu project options co the fail-soft thanh option rong, nhung loi archive chinh phai render state loi ro rang thay vi blank/no-access sai.

4. **Unauthorized/no-view state khong lo du lieu**
   - Given role khong duoc mo deep link `executive-history`, when truy cap truc tiep `/command-center?view=executive-history`, then guard-first 403/redirect hien co van xay ra truoc khi fetch/render History data.
   - Given user co the mo Command Center nhung DTO `archive.permissions.canView === false`, when History Center render, then hien unauthorized state ro rang, khong hien event count, source counts, filter options, source titles, raw ids ngoai quyen, hay export controls.
   - Unauthorized state dung shared component/pattern neu co, voi link quay ve `/command-center` hoac workspace mac dinh phu hop.

5. **Export states allowed/blocked/invalid duoc nghiem thu**
   - Given user co `report.export`, when bam export tu History Center, then request preserve `scopeId`, project/module/type/actor/status/severity/date/query/limit va route tra file voi `no-store`, `private`, `pragma: no-cache`, `x-content-type-options: nosniff`.
   - Given user thieu `report.export`, when UI render, then khong hien export controls; when goi truc tiep `/reports/export`, then tra 403 safe body, khong tao file payload va khong ghi success audit `report.export`.
   - Given user thieu `audit.view`, when UI render, then khong hien `Audit CSV`; when goi truc tiep target `audit_log`, then tra 403 safe body, khong load/serialize audit payload.
   - Given invalid export filter/scope mismatch, when goi route/action, then tra 400/403 safe body, khong widen export va khong ghi success audit.

6. **Responsive va accessibility QA**
   - Given viewport 360, 390, 430, 768, 1280 va 1440px, when render History empty/loading/error/unauthorized/export states, then khong co horizontal overflow, text wrap trong container, controls co accessible names va focus order hop ly: filters -> active chips -> export controls -> timeline/state action.
   - State badge/button khong dua vao color-only; touch targets va buttons giu size on dinh; khong dung hero/marketing layout.

7. **Test coverage day du cho nghiem thu**
   - Component/unit tests bao phu loading, empty scope, empty filtered, error, unauthorized, export hidden, export allowed va audit target hidden.
   - Route/service tests bao phu export allowed, blocked, invalid filter va safe response headers/body.
   - E2E smoke bao phu History responsive state va export blocked/allowed duong chinh.

## Tasks / Subtasks

- [x] Bo sung shared state primitives nhe, dung lai duoc (AC: 1, 2, 3, 4, 6)
  - [x] Tao `src/components/shared/error-state.tsx` neu chua co component tuong duong. Props toi thieu: `title`, `description`, optional `action`, optional `backHref/backLabel`; khong render raw `error.message` mac dinh.
  - [x] Tao skeleton/status component nhe neu can, vi du `src/components/shared/loading-state.tsx` hoac module-specific `HistoryArchiveCenterSkeleton`. Khong them dependency/spinner library.
  - [x] Can nhac cap nhat `src/components/shared/empty-state.tsx` de ho tro action/link clear filters neu component hien tai chua du; giu API backward-compatible.
  - [x] Can nhac cap nhat `src/components/shared/unauthorized-state.tsx` neu can action/back label ro hon, nhung khong lam vo cac page dang dung component nay.

- [x] Harden History Center state rendering (AC: 1, 2, 3, 4, 5, 6)
  - [x] Update `src/modules/reports/components/history-archive-center.tsx`.
  - [x] Empty filtered state phai co action/link clear filters dung `buildHref(preservedParams, {}, [])` hoac helper tuong duong, giu `scopeId` va `view`.
  - [x] Empty scope state phai text rieng va khong hien action export neu `canExport` false hoac target rong.
  - [x] Unauthorized branch phai dung shared unauthorized state va khong render header total/source counts/filter form/export controls truoc branch.
  - [x] Them loading/skeleton exportable component cho History Center, de `loading.tsx`/tests co the reuse ma khong duplicate markup.
  - [x] Neu them error state component trong Reports module, no phai la state UI thuan, khong bat loi bang client-side data fetch moi.
  - [x] Kiem tra long labels/source ids dung `break-words`/responsive constraints, khong tao fixed-width controls gay overflow.

- [x] Them App Router loading/error boundaries dung pham vi (AC: 2, 3, 6)
  - [x] Vi `src/app/command-center` hien chi co `page.tsx`, them `src/app/command-center/loading.tsx` de render skeleton operational an toan cho route Command Center. Loading khong can biet `view` nhung phai hop voi History view va khong lo data.
  - [x] Them `src/app/command-center/error.tsx` (client component) voi `reset()` retry va link `/command-center`; UI hien generic safe message, khong render raw error detail.
  - [x] Neu them boundary rieng cho `/executive/history` khong co tac dung vi route redirect qua `renderExecutivePage`, ghi ro trong Completion Notes va uu tien boundary Command Center.
  - [x] Khong doi guard-first behavior cua `requireWorkspaceRoute("/executive")` va existing 403 tests cho viewer deep link.

- [x] Harden export route/action failure states (AC: 3, 5)
  - [x] Update `src/app/(dashboard)/reports/export/route.ts` de map loi thanh safe user-facing body. 403: permission/export denied text chung; 400: invalid export request text chung. Khong tra raw Zod issue JSON, stack, repository message, scope internals, event summary hay export content.
  - [x] Response loi phai co `cache-control: no-store, private`, `pragma: no-cache`, `x-content-type-options: nosniff`, va `content-type: text/plain; charset=utf-8`.
  - [x] Confirm `exportReportData` van la source of truth cho permission/scope/audit; route/action khong duplicate guard logic ngoai parse/call/map response.
  - [x] Confirm failure path khong goi `createAuditLog` success `report.export`; neu them denied audit rieng thi dung action key rieng va test rieng, khong tinh la success export.

- [x] Bo sung tests component/route/state (AC: 1, 2, 3, 4, 5, 6, 7)
  - [x] Extend `tests/unit/history-archive-center.test.tsx` cho:
    - [x] empty scope state text va no fake export/source counts;
    - [x] filtered empty state text va clear filters preserves `scopeId`;
    - [x] unauthorized state khong render total, source counts, filters, export buttons;
    - [x] export controls hidden khi `canExport` false;
    - [x] audit export hidden khi `canViewAudit` false;
    - [x] loading/skeleton component accessible va responsive-safe classes/basic structure;
    - [x] error state has retry/back action and no raw sentinel error text.
  - [x] Add route test, vi du `tests/unit/report-export-route.test.ts`, mock `getCurrentUser` va `exportReportData` de assert allowed headers/body, 403 safe body, 400 safe body, invalid filters khong leak raw issues.
  - [x] Extend `tests/unit/command-center-page.test.tsx`/`command-center-dashboard.test.tsx` neu loading/error/no-access branch hoac DTO handling thay doi.
  - [x] Keep existing `tests/unit/report-export-service.test.ts` green; chi them service tests neu phat hien state/guard gap that su nam trong service.

- [x] Bo sung e2e smoke cho nghiem thu (AC: 4, 5, 6, 7)
  - [x] Update `tests/e2e/mvp-smoke.spec.ts` cho History responsive state o 360/390/430/768/1280/1440 neu chua cover 430/1440.
  - [x] Test blocked export: role thieu `report.export` goi route/direct UI path, expect 403 hoac no button va body khong chua sentinel data.
  - [x] Test allowed export: role co export goi `/reports/export` voi target/filter/scope hop le, expect 200, headers no-store/nosniff va content khong chua sentinel raw finance/audit strings.
  - [x] Khong dua e2e vao brittle file-download UI neu route response assertion du; neu click form, dung Playwright download/request pattern on dinh.

- [x] Verification bat buoc (AC: 1-7)
  - [x] Run targeted unit tests: `npm run test -- tests/unit/history-archive-center.test.tsx tests/unit/report-export-route.test.ts tests/unit/report-export-service.test.ts tests/unit/command-center-page.test.tsx tests/unit/command-center-dashboard.test.tsx`.
  - [x] Run `npm run typecheck`.
  - [x] Run `npm run lint`.
  - [x] Run `npm run test`.
  - [x] Run targeted e2e/smoke for History/export states because story touches route/UI/responsive behavior.

### Review Findings

- [x] [Review][Patch] Export route defaults missing direct request target/format instead of rejecting incomplete requests [src/app/(dashboard)/reports/export/route.ts:27]
- [x] [Review][Patch] Export route classifies errors by raw message text and masks unexpected server failures as 400/403 [src/app/(dashboard)/reports/export/route.ts:5]
- [x] [Review][Patch] Export buttons submit stale server-side filters instead of current visible filter edits [src/modules/reports/components/history-archive-center.tsx:222]
- [x] [Review][Patch] Export controls render before filters, violating required focus order filters -> chips -> export controls -> timeline/state action [src/modules/reports/components/history-archive-center.tsx:380]
- [x] [Review][Patch] Empty scope state still exposes a global Clear filters action when no filters are active [src/modules/reports/components/history-archive-center.tsx:412]
- [x] [Review][Patch] Long event summary/source/actor/chip text lacks wrapping constraints for mobile and long ids [src/modules/reports/components/history-archive-center.tsx:260]
- [x] [Review][Patch] Empty-scope unit coverage is missing as a distinct case from filtered empty [tests/unit/history-archive-center.test.tsx:190]
- [x] [Review][Patch] Shared ErrorState omits optional backHref/backLabel props required by the story task [src/components/shared/error-state.tsx:4]
- [x] [Review][Patch] Invalid export route test does not assert invalid input is rejected before calling exportReportData [tests/unit/report-export-route.test.ts:86]
- [x] [Review][Defer] Forbidden E2E helper accepts HTTP 200 for Next dev authInterrupts forbidden UI [tests/e2e/mvp-smoke.spec.ts:63] - deferred, framework dev-mode limitation; current smoke still asserts 403 UI and no data leakage
- [x] [Review][Defer] Risk-region smoke assertions were broadened to a generic /risk/i matcher [tests/e2e/mvp-smoke.spec.ts:371] - deferred, pre-existing e2e brittleness from earlier dirty-worktree changes

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 7 yeu cau History, Archive, Export va Audit Visibility. Story 7.4 la story QA/state cuoi epic: loading, empty, error, unauthorized va responsive states cho History/Export. [Source: `_bmad-output/planning-artifacts/epics/epic-7-history-archive-export-v-audit-visibility.md`]
- PRD FR-080/FR-082 yeu cau History Center/timeline/search/filter theo permission; FR-083/FR-084 yeu cau export dashboard/audit/approval history gioi han boi `Xuat du lieu`, sensitive export can permission rieng va audit. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`]
- NFR-004 yeu cau user khong co permission record/data thi khong thay data va direct access tra 403. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`; `docs/context/permissions-audit.md`]

### Current Code State

- `src/modules/reports/components/history-archive-center.tsx` hien co form filter, active chips, timeline, basic empty state, basic unauthorized state va export buttons. Empty filtered/scope da co text rieng nhung chua co clear action trong empty body; unauthorized branch da dat truoc header nen khong render event counts/export. [Source: `src/modules/reports/components/history-archive-center.tsx`]
- `src/components/shared/empty-state.tsx` va `src/components/shared/unauthorized-state.tsx` la shared state components duy nhat hien co. Khong co shared error/loading component. [Source: `src/components/shared/empty-state.tsx`; `src/components/shared/unauthorized-state.tsx`]
- Khong co `src/app/command-center/loading.tsx` hoac `src/app/command-center/error.tsx` hien tai; loi route co nguy co roi vao default boundary/`Application error`. [Source: `src/app/command-center`]
- `src/app/command-center/page.tsx` parse history filters bang `historyArchiveFilterSchema`, guard executive deep links bang `requireWorkspaceRoute("/executive")`, va chi truyen `historyArchiveFilters` khi `requestedView === "executive-history"`. [Source: `src/app/command-center/page.tsx`]
- `src/modules/command-center/services/command-center-service.ts` chi load `getHistoryArchiveCenterData` khi `canViewExecutive && historyArchiveFilters`; selected scope duoc truyen qua `selectedScopeId` va preserved params. [Source: `src/modules/command-center/services/command-center-service.ts`]
- `src/modules/reports/services/history-archive-center-service.ts` fail-soft project filter options bang `loadOrEmpty`, nhung archive loader chinh van co the throw. Story 7.4 can error boundary/state cho loi chinh thay vi state no-access sai. [Source: `src/modules/reports/services/history-archive-center-service.ts`]
- `src/app/(dashboard)/reports/export/route.ts` hien catch loi va tra `error.message` lam body voi status 403 neu message match permission, con lai 400. Can sanitize body de khong lo raw validation/repository details. [Source: `src/app/(dashboard)/reports/export/route.ts`]
- `src/modules/reports/services/report-export-service.ts` da co permission/scope guard, audit target `audit.view`, filter normalization, redaction, CSV formula neutralization va success audit summary. Story 7.4 khong nen rebuild service nay; chi them state/route QA neu gap. [Source: `src/modules/reports/services/report-export-service.ts`; `_bmad-output/implementation-artifacts/7-3-export-theo-permission-va-audit.md`]

### Previous Story Intelligence

- Story 7.2 da tao `executive-history` view, URL filters, active chips, safe timeline, empty/no-access basic states va responsive smoke. Review fixes quan trong: invalid filters normalized, selected `scopeId` applied, task-linked assignment leak fixed, actor search/display added, limit clearable va source counts visible. Khong regress cac behavior nay. [Source: `_bmad-output/implementation-artifacts/7-2-search-filter-va-timeline-ui.md`]
- Story 7.3 da tach `report.export`, them route `/reports/export`, preserve filters/scope, block unauthorized export, redact sensitive fields, safe audit summary va no-store/nosniff headers. Story 7.4 chi harden states/QA quanh behavior nay. [Source: `_bmad-output/implementation-artifacts/7-3-export-theo-permission-va-audit.md`]
- Existing e2e da co test viewer direct history archive view is forbidden before data render va responsive Command Center views o 360/390/768/1280. Khi mo rong, giu test cu xanh va them 430/1440/export states neu can. [Source: `tests/e2e/mvp-smoke.spec.ts`]

### Architecture Guardrails

- Required flow: route/server loader -> auth/permission/scope -> Reports service DTO -> UI. Components khong import repositories, Supabase clients, hoac tu refetch raw data client-side. [Source: `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`; `_bmad-output/project-context.md`]
- Permission/scope filtering phai xay ra truoc UI serialization. Do not render unauthorized data then hide. [Source: `_bmad-output/project-context.md`; `docs/context/permissions-audit.md`]
- Export route/action phai goi `exportReportData`; khong duplicate serializer/permission/audit logic trong component/route. [Source: `src/modules/reports/services/report-export-service.ts`; `src/modules/reports/actions.ts`]
- Khong them dependency UI/export moi, global store, archive/export persistence table, cache layer, PDF/DOCX flow, background job queue, hay route History song song. [Source: `_bmad-output/project-context.md`; `package.json`; `_bmad-output/implementation-artifacts/7-3-export-theo-permission-va-audit.md`]

### UX Guardrails

- History/Export la operational surface: dense, scan-friendly, khong hero/landing/marketing copy. [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`]
- Loading/empty/error/unauthorized phai co text ro, action co y nghia, focus visible, accessible names va khong color-only. [Source: `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`; `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`]
- Mobile target viewports: 360, 390, 430; tablet 768/820; desktop 1024/1280/1440; wide 1536. Khong dung viewport-scaled font, khong horizontal overflow. [Source: `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]

### Project Structure Notes

- Expected NEW:
  - `src/components/shared/error-state.tsx`
  - `src/app/command-center/loading.tsx`
  - `src/app/command-center/error.tsx`
  - `tests/unit/report-export-route.test.ts`
- Possible NEW:
  - `src/components/shared/loading-state.tsx` or `src/modules/reports/components/history-archive-center-states.tsx`
- Expected UPDATE:
  - `src/modules/reports/components/history-archive-center.tsx`
  - `src/components/shared/empty-state.tsx`
  - `src/components/shared/unauthorized-state.tsx` only if API-compatible improvement is needed
  - `src/app/(dashboard)/reports/export/route.ts`
  - `tests/unit/history-archive-center.test.tsx`
  - `tests/unit/command-center-page.test.tsx` / `tests/unit/command-center-dashboard.test.tsx` if behavior changes
  - `tests/e2e/mvp-smoke.spec.ts`
- Avoid:
  - Do not touch report export permission semantics unless a test exposes a real bug.
  - Do not change `/executive/history` redirect architecture.
  - Do not make route error bodies include `error.message`.
  - Do not add a separate `history.view` permission.

### References

- `_bmad-output/planning-artifacts/epics/epic-7-history-archive-export-v-audit-visibility.md` - Epic 7 and Story 7.4 AC.
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md` - FR-080, FR-082, FR-083, FR-084, NFR-004, AC-015, AC-017.
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md` - route/service/component flow and no parallel systems.
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md` - module boundaries.
- `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md` - operational UX and state patterns.
- `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md` - responsive and accessibility requirements.
- `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md` - shared state and timeline patterns.
- `_bmad-output/project-context.md` - stack, security, testing commands and no-new-dependency guidance.
- `docs/context/permissions-audit.md` - permission/audit safety rules.
- `docs/context/testing.md` - verification expectations.
- `_bmad-output/implementation-artifacts/7-2-search-filter-va-timeline-ui.md` - current History UI learnings and review fixes.
- `_bmad-output/implementation-artifacts/7-3-export-theo-permission-va-audit.md` - current export service/route learnings and review fixes.
- `src/modules/reports/components/history-archive-center.tsx` - current History UI.
- `src/modules/reports/services/history-archive-center-service.ts` - current History Center DTO wrapper.
- `src/modules/reports/services/report-export-service.ts` - current export source of truth.
- `src/app/(dashboard)/reports/export/route.ts` - current download route.
- `tests/unit/history-archive-center.test.tsx` - current History UI tests.
- `tests/unit/report-export-service.test.ts` - current export service tests.
- `tests/e2e/mvp-smoke.spec.ts` - current Command Center/History smoke tests.

## Dev Agent Record

### Agent Model Used

Codex (GPT-5)

### Debug Log References

- 2026-06-04: Red/green unit tests added for History state rendering and export route safe errors.
- 2026-06-04: Added Command Center route state tests for loading/error boundaries.
- 2026-06-04: Extended Playwright smoke for export blocked/allowed and 430/1440 responsive viewports.

### Completion Notes List

- Implemented reusable shared `ErrorState` and `LoadingState` components with safe, non-leaking copy.
- Added `HistoryArchiveCenterSkeleton` and filtered-empty clear action that preserves `view=executive-history` and `scopeId`.
- Added Command Center `loading.tsx` and `error.tsx` boundaries; error retry uses `reset()` and does not render raw error detail.
- Sanitized `/reports/export` failure responses so permission and validation errors return safe text, no-store/no-cache/nosniff headers, and no raw exception content.
- Extended component, route and e2e coverage for loading, empty, error, unauthorized, export blocked/allowed and responsive QA. Note: in Next dev with `authInterrupts`, forbidden UI can render with HTTP 200; e2e asserts the 403 UI and no data leakage while allowing either 200 or 403 response status.
- Applied code review patches: direct export downloads now require explicit target/format, unexpected export failures return safe 500, export controls submit current visible filter form values, focus order matches AC6, empty-scope avoids impossible clear actions, long state text wraps, and review test gaps are covered.

### File List

- `src/components/shared/error-state.tsx`
- `src/components/shared/loading-state.tsx`
- `src/components/shared/empty-state.tsx`
- `src/modules/reports/components/history-archive-center.tsx`
- `src/modules/reports/components/history-export-submit-button.tsx`
- `src/app/command-center/loading.tsx`
- `src/app/command-center/error.tsx`
- `src/app/(dashboard)/reports/export/route.ts`
- `tests/unit/history-archive-center.test.tsx`
- `tests/unit/report-export-route.test.ts`
- `tests/unit/command-center-route-states.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

### Change Log

- 2026-06-04: Implemented Story 7.4 History/Export states and QA coverage; all required validation passed.
- 2026-06-04: Applied code-review patches and promoted Story 7.4 to done after validation.
