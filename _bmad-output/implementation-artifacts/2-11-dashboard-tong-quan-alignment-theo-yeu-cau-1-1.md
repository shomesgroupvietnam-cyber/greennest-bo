# Story 2.11: Căn Chỉnh Dashboard Tổng Quan Theo Yêu Cầu 1.1

Status: in-progress

Ghi chú tạo story: Ultimate context engine analysis completed - comprehensive developer guide created. Story này là follow-up sau Correct Course ngày 2026-06-06 để căn chỉnh Dashboard Tổng Quan với yêu cầu 1.1. Phạm vi là sửa Dashboard hiện hữu trong Command Center, không tạo dashboard mới, không mở rộng sang Risk Center/Approval Center/Decision Center mutation.

## Story

As a lãnh đạo đang xem Command Center,
I want Dashboard Tổng Quan chỉ hiển thị dữ liệu tổng quan theo scope và permission hiện tại,
so that tôi thấy nhanh danh mục dự án/cơ hội, KPI điều hành, tài chính được phép xem, approval/risk/deadline/decision ưu tiên và drill-down an toàn mà không bị lẫn task vi mô hoặc form thao tác chi tiết.

## Tiêu Chí Chấp Nhận

1. **Tổng số dự án/cơ hội trong scope được hiển thị rõ**
   - Given user có quyền xem dự án và/hoặc proposal trong executive scope
   - When Dashboard Tổng Quan render
   - Then first-screen KPI/supporting metric hiển thị tổng "Dự án / Cơ hội" từ DTO đã lọc scope
   - And phần split hiển thị số dự án và số cơ hội/proposal/request riêng biệt
   - And không hardcode số liệu hoặc đọc dữ liệu ngoài `ExecutiveDashboardData`.

2. **Tài chính nhạy cảm chỉ hiện khi có quyền và thể hiện như dòng tiền/chi phí tổng quan**
   - Given `financialSummary.state = "allowed"`
   - When Dashboard Tổng Quan render
   - Then UI hiển thị nhãn "Dòng tiền / Chi phí tổng quan" hoặc tương đương rõ nghĩa
   - And hiển thị tổng giá trị được phép xem, số bản ghi tài chính được phép xem và trạng thái full/partial nếu DTO có
   - And không hiển thị bảng chi tiết, khoản mục nhạy cảm hoặc dữ liệu ngoài quyền.
   - Given `financialSummary.state = "no_permission"`
   - Then mọi amount/amountLabel trong approval item bị che, chỉ hiển thị reason an toàn từ DTO.

3. **Risk map/summary là read-only trên Dashboard Tổng Quan**
   - Given user có quyền risk create/update/override/close
   - When Dashboard Tổng Quan render
   - Then Dashboard vẫn hiển thị tổng hợp rủi ro, bản đồ rủi ro, ma trận rủi ro, rủi ro cần xem và drill-down nếu có quyền
   - And Dashboard không render `RiskRecordForm` hoặc các panel tạo/cập nhật/override/đóng risk trực tiếp
   - And thao tác mutation risk vẫn thuộc Risk Center hoặc màn hình record chuyên trách, không nằm trong Dashboard Tổng Quan.

4. **Drill-down đúng quyền và không sở hữu mutation của module chuyên trách**
   - Given user có `canDrillDown`
   - When chọn KPI/source/risk/deadline/decision
   - Then panel chi tiết chỉ hiển thị metadata, linked records, timeline, available action link an toàn hoặc link mở record nếu được phép
   - And Dashboard không gọi trực tiếp action tạo/sửa/duyệt/đóng approval, risk, decision, meeting
   - Given user không có `canDrillDown`
   - Then UI hiển thị trạng thái không có quyền xem chi tiết và không render link/metadata bị cấm.

5. **Không hiển thị mặc định task vi mô, dữ liệu kỹ thuật chi tiết hoặc bản vẽ chi tiết**
   - Given operations/private task data tồn tại trong `CommandCenterData`
   - When Dashboard Tổng Quan render
   - Then task vi mô, dữ liệu kỹ thuật chi tiết, bản vẽ chi tiết không xuất hiện mặc định
   - And các sentinel operations/private task hiện có trong test vẫn bị ẩn khỏi Dashboard Tổng Quan.

## Tasks / Subtasks

- [x] Confirm baseline and scope before editing (AC: 1, 2, 3, 4, 5)
  - [x] Read `_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-06-dashboard-tong-quan-alignment.md` and this story before code changes.
  - [x] Keep the current Command Center entry and `ExecutiveDashboardOverview`; do not add a parallel dashboard route, route param, global store, or data fetch path.
  - [x] Use only `ExecutiveDashboardData` returned by `getExecutiveDashboardData`; do not import repositories or Supabase into components.

- [x] Expose combined project/opportunity metric from existing DTO (AC: 1)
  - [x] In `src/modules/dashboard/components/executive-dashboard-kpi-strip.tsx`, display a first-screen metric labeled "Dự án / Cơ hội" using `data.sourceCounts.projects` and `data.sourceCounts.proposals`.
  - [x] Show combined total as `projects + proposals` and helper split like `Dự án X | Cơ hội Y`.
  - [x] Preserve existing red/yellow/green project health summary from `data.projectPortfolio`.
  - [x] If adjusting service-level KPI labels in `src/modules/dashboard/services/executive-dashboard-service.ts`, pass proposal count deliberately and update `tests/unit/executive-dashboard-service.test.ts`; otherwise keep the service DTO stable.

- [x] Clarify finance summary without leaking sensitive data (AC: 2)
  - [x] In `ExecutiveDashboardKpiStrip`, change finance supporting metric label/helper so it reads as dòng tiền/chi phí tổng quan, not a generic finance placeholder.
  - [x] In `FinancialSummary` inside `src/modules/dashboard/components/executive-dashboard-overview.tsx`, update allowed-state heading to "Dòng tiền / Chi phí tổng quan" or equivalent.
  - [x] For allowed state, show total value and visible record count from `data.financialSummary`; show access `full`/`partial` only if it helps and does not expose hidden totals.
  - [x] For no-permission state, preserve redaction behavior and do not render any approval item amount/amountLabel.
  - [x] Do not invent category totals or cashflow breakdowns unless existing DTO data can support them safely.

- [x] Remove direct risk mutation UI from Dashboard Tổng Quan (AC: 3, 4)
  - [x] In `src/modules/dashboard/components/executive-risk-summary.tsx`, remove the `RiskRecordForm` import and all create/update/override/close details panels.
  - [x] Remove mutation-only props from `ExecutiveRiskSummary`: `canCreateRisk`, `canUpdateRisk`, `canOverrideRisk`, `canCloseRisk`, `canCloseHighRisk`, `riskMutationOptions`.
  - [x] In `ExecutiveDashboardOverview`, stop passing those mutation props to `ExecutiveRiskSummary`.
  - [x] Keep risk summary, risk map categories, matrix cells, affected project count, risk list, escalation/overdue metadata, read-only states and drill-down behavior intact.
  - [x] Do not delete `riskMutationOptions` from `ExecutiveDashboardData` unless all downstream references and tests prove it is unused outside the Dashboard; this story only requires the Dashboard not to render mutation forms.

- [x] Preserve drill-down and module ownership boundaries (AC: 4)
  - [x] Verify `ExecutiveSourceDetailPanel` remains read-only and uses existing `availableActions`, `href`, `linkedRecords`, `timeline` from enriched DTO.
  - [x] Do not add direct calls to approval/risk/decision/meeting server actions from Dashboard Tổng Quan.
  - [x] If adding a link to specialized centers, use existing safe hrefs from DTO/enrichment rather than constructing unauthorized direct routes in the component.

- [x] Keep overview free of micro/technical details by default (AC: 5)
  - [x] Preserve the existing operations micro-task sentinel test in `tests/unit/command-center-dashboard.test.tsx`.
  - [x] Do not surface `operationsDashboard.tasksDueThisWeek`, technical drawings, detailed technical specs, or private workspace support tasks in `ExecutiveDashboardOverview`.

- [x] Update regression tests (AC: 1, 2, 3, 4, 5)
  - [x] Extend `tests/unit/command-center-dashboard.test.tsx` to assert the "Dự án / Cơ hội" metric appears and uses `executiveDashboard.sourceCounts.proposals`.
  - [x] Add assertions that Dashboard Tổng Quan does not render risk mutation labels/forms even when DTO permissions allow risk mutation: "Tạo rủi ro/vướng mắc", "Cập nhật rủi ro/vướng mắc đang mở", "Xác nhận/điều chỉnh trạng thái", "Đóng rủi ro/vướng mắc".
  - [x] Assert risk map/matrix/list and risk drill-down still render after mutation forms are removed.
  - [x] Update finance assertions for the new "Dòng tiền / Chi phí tổng quan" wording while preserving no-permission leakage checks.
  - [x] Update `tests/unit/executive-dashboard-service.test.ts` only if the service DTO or KPI calculation changes.

- [ ] Validation (AC: 1, 2, 3, 4, 5)
  - [x] Run `npm run test -- tests/unit/command-center-dashboard.test.tsx tests/unit/executive-dashboard-service.test.ts`.
  - [x] Run `npm run typecheck`.
  - [x] Run `npm run lint`.
  - [ ] Run `npm run test` (attempted; blocked by unrelated full-suite failures outside Story 2.11 scope; see Debug Log References).
  - [x] Run targeted e2e only if layout, routing, viewport behavior, or drill-down interaction changes beyond component copy/layout (not required: no route/layout/responsive contract change).

### Review Findings

- [x] [Review][Patch] Dashboard Tổng Quan is read-only but still ships `riskMutationOptions` inside the client `CommandCenterData` payload [src/modules/command-center/services/command-center-service.ts:857] — fixed by returning `ExecutiveDashboardClientData` from `getCommandCenterData` and stripping `riskMutationOptions` before client serialization.
- [x] [Review][Patch] Priority labels still mix unaccented and accented overdue/urgent labels after localization [src/modules/dashboard/components/executive-dashboard-overview.tsx:50] — fixed by normalizing Vietnamese diacritics before priority matching and returning localized labels.
- [x] [Review][Defer] Non-Dashboard test assertion rewrites are included in the Story 2.11 diff [tests/unit/command-center-dashboard.test.tsx:100] — deferred, pre-existing/dirty-worktree localization churn outside Dashboard Tổng Quan scope

## Dev Notes

### Correct Course Context

- Approved proposal: `_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-06-dashboard-tong-quan-alignment.md`.
- The approved decision is to patch Epic 2 with Story 2.11 instead of reopening done Story 2.3.
- The gap found in readiness review:
  - Total project/opportunity is not explicit enough; proposals already exist in `sourceCounts.proposals`.
  - Finance is permission-gated but wording is too generic for dòng tiền/chi phí tổng quan.
  - Dashboard currently embeds `RiskRecordForm`, which crosses the Dashboard Tổng Quan boundary.

### Product Requirements

- Dashboard Tổng Quan must show by current user's scope and permission:
  - Total projects/opportunities in scope.
  - Project status red/yellow/green.
  - Executive-level KPIs.
  - Cashflow/cost overview only when finance permission allows.
  - Pending and overdue requests.
  - Risk map or risk summary.
  - Urgent work, today's deadlines, recent decisions.
  - Drill-down to executive summary or detailed record only when permitted.
- Dashboard Tổng Quan must not show by default:
  - Micro tasks.
  - Detailed technical data.
  - Detailed drawings.

### Initial Code State Before Story 2.11

- `src/modules/dashboard/services/executive-dashboard-service.ts`
  - `getExecutiveDashboardData` already filters projects, proposals, meetings, decisions and risk records by access scope.
  - `sourceCounts` already includes `projects: portfolio.total` and `proposals: scopedProposals.length`.
  - `buildFinancialSummary` returns either `no_permission` or allowed `visibleAmountTotal`, `visibleRecordCount`, `currency`, `items`.
  - `buildKpis` currently uses portfolio, approvals, risks and deadlines; proposal count is not part of the main KPI label/value today.
- `src/modules/dashboard/components/executive-dashboard-kpi-strip.tsx`
  - Supporting metric initially labeled project count as "Danh mục dự án" with `active/total`.
  - Finance supporting metric initially used `financialSummary.visibleAmountTotal` or permission reason.
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`
  - `FinancialSummary` was permission-aware but labeled allowed state as generic finance in scope.
  - It passed risk mutation permissions and `riskMutationOptions` into `ExecutiveRiskSummary`.
- `src/modules/dashboard/components/executive-risk-summary.tsx`
  - Initially imported `RiskRecordForm`.
  - Initially rendered create/update/override/close forms in details panels when permissions allow.
  - Risk map, matrix, risk list, escalation metadata and drill-down are already present and should remain.
- `tests/unit/command-center-dashboard.test.tsx`
  - Already validates Dashboard uses executive DTO instead of operations data.
  - Already checks finance no-permission redaction.
  - Already checks read-only source/risk drill-down panels.

### Architecture Compliance

- Keep server/service-side filtering as source of truth; component redaction is not security.
- Do not call repositories, Supabase, or module services from client components.
- Do not add new dependencies, app shell, or global state.
- Preserve TypeScript strictness and existing DTO types unless a DTO change is genuinely needed.
- If a DTO field is retained for another module or future specialized center, do not remove it merely because Dashboard no longer renders it.

### UX Guardrails

- This is an operational dashboard, not a landing page.
- Keep the first screen dense, scannable, Vietnamese-first and leadership-focused.
- Cards are acceptable for repeated KPI/source items, but avoid nested cards and marketing copy.
- Prefer clear labels over explanatory in-app text.
- Drill-down panels should orient the user to source metadata and links; they should not become mutation forms.

### Previous Story Intelligence

- Story 2.10 reinforced central policy and guard-before-fetch. For this story, the equivalent rule is: permission-filtered DTO first, UI display second.
- Story 2.3 established the Dashboard UI structure; extend it rather than rebuilding it.
- Story 5.3 and 5.4 own risk create/update/override/close semantics. Do not duplicate those mutation flows inside Dashboard Tổng Quan.
- Existing focused tests are valuable. Prefer extending `command-center-dashboard.test.tsx` over creating a broad new test file unless needed.

### Testing Guidance

- Start with fail-first assertions for:
  - Project/opportunity combined metric.
  - No `RiskRecordForm` labels or mutation panel text in Dashboard.
  - Risk summary still displays map/matrix/list and drill-down.
  - Finance allowed/no-permission wording and redaction.
  - Operations micro-task sentinel remains hidden.
- The focused command expected for this story is:

```bash
npm run test -- tests/unit/command-center-dashboard.test.tsx tests/unit/executive-dashboard-service.test.ts
```

- Then run typecheck, lint and the full test suite before moving story out of dev.

### No Web Research Needed

- This story uses the existing local stack and local product artifacts. No external API, framework upgrade, pricing, legal or vendor behavior is part of the change.

### References

- `_bmad-output/planning-artifacts/sprint-change-proposal-2026-06-06-dashboard-tong-quan-alignment.md` - approved scope and impact.
- `_bmad-output/planning-artifacts/epics/epic-2-workspace-iu-hnh-v-dashboard-module-1.md` - Epic 2 and Story 2.11 acceptance criteria.
- `_bmad-output/planning-artifacts/product-requirements-document/functional-requirements.md` - Dashboard Tổng Quan and sensitive data requirements.
- `_bmad-output/planning-artifacts/ux-design-specification/core-user-experience.md` - leadership overview and drill-down loop.
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md` - DTO/service boundaries and no render-then-hide for protected data.
- `docs/context/permissions-audit.md` - permission and audit safety guidance.
- `docs/context/testing.md` - test expectations.
- `src/modules/dashboard/services/executive-dashboard-service.ts` - dashboard DTO builder.
- `src/modules/dashboard/types.ts` - dashboard DTO contracts.
- `src/modules/dashboard/components/executive-dashboard-overview.tsx` - Dashboard Tổng Quan shell.
- `src/modules/dashboard/components/executive-dashboard-kpi-strip.tsx` - KPI and supporting metrics.
- `src/modules/dashboard/components/executive-risk-summary.tsx` - risk map/summary component to make read-only.
- `tests/unit/command-center-dashboard.test.tsx` - primary component regression target.
- `tests/unit/executive-dashboard-service.test.ts` - service regression target if DTO/service changes.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/command-center-dashboard.test.tsx tests/unit/executive-dashboard-service.test.ts` - failed first as expected: Dashboard still lacked "Dự án / Cơ hội", finance region still used old label, and risk mutation form was still rendered.
- `npm run test -- tests/unit/command-center-dashboard.test.tsx tests/unit/executive-dashboard-service.test.ts` - passed after component changes, 2 files / 37 tests.
- `npm run typecheck` - initially failed because `tests/unit/risk-record-form.test.tsx` still rendered `ExecutiveRiskSummary` with removed mutation props.
- `npm run test -- tests/unit/command-center-dashboard.test.tsx tests/unit/executive-dashboard-service.test.ts tests/unit/risk-record-form.test.tsx` - passed after test boundary update, 3 files / 41 tests.
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm run test` - failed from Vitest worker OOM before assertions.
- `$env:NODE_OPTIONS='--max-old-space-size=4096'; npm run test -- --maxWorkers=1 --no-file-parallelism` - executed full suite with constrained workers; Story 2.11 tests passed, but suite still failed in unrelated areas: `meeting-detail-panels.test.tsx`, `meeting-list-filters.test.tsx`, `ai-approval-assistant-panel.test.tsx`, `executive-private-workspace-service.test.ts`, `executive-common-center-service.test.ts`, `navigation-policy.test.ts`, and `workspaces.test.ts`.
- `npm run test -- tests/unit/command-center-dashboard.test.tsx tests/unit/executive-dashboard-service.test.ts tests/unit/risk-record-form.test.tsx` - rerun passed, 3 files / 41 tests.
- `npm run typecheck` - rerun passed.
- `npm run lint` - rerun passed.
- `npm run test -- tests/unit/meeting-detail-panels.test.tsx tests/unit/meeting-list-filters.test.tsx tests/unit/ai-approval-assistant-panel.test.tsx` - failed outside Story 2.11 scope due existing localization expectation mismatches: AI assistant/meeting empty-state/assignment status labels expect unaccented or English text while UI now renders Vietnamese localized text.
- `npm run test -- tests/unit/executive-private-workspace-service.test.ts tests/unit/executive-common-center-service.test.ts tests/unit/navigation-policy.test.ts tests/unit/workspaces.test.ts` - failed outside Story 2.11 scope due existing localization, navigation-policy, and private-workspace priority-order expectation mismatches.
- `npm run test -- tests/unit/command-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/executive-dashboard-service.test.ts tests/unit/risk-record-form.test.tsx` - passed after review patches, 4 files / 52 tests.
- `npm run typecheck` - passed after review patches.
- `npm run lint` - passed after review patches.
- `git diff --check -- src/modules/dashboard/types.ts src/modules/command-center/types.ts src/modules/command-center/services/command-center-service.ts src/modules/dashboard/components/executive-dashboard-overview.tsx src/modules/dashboard/components/executive-dashboard-kpi-strip.tsx tests/unit/command-center-service.test.ts tests/unit/command-center-dashboard.test.tsx _bmad-output/implementation-artifacts/2-11-dashboard-tong-quan-alignment-theo-yeu-cau-1-1.md _bmad-output/implementation-artifacts/deferred-work.md` - passed.

### Completion Notes List

- Implemented Dashboard Tổng Quan alignment using existing `ExecutiveDashboardData`; no new route, global store, repository access, or DTO service contract was introduced.
- KPI strip now exposes "Dự án / Cơ hội" from `sourceCounts.projects + sourceCounts.proposals`, with project/opportunity split and red/yellow/green portfolio health.
- Finance summary now uses "Dòng tiền / Chi phí tổng quan" wording and preserves permission-safe no-permission redaction.
- Dashboard risk summary is read-only: direct `RiskRecordForm` import/render and mutation-only props were removed while risk map, matrix, list, escalation metadata and drill-down stayed intact.
- Risk mutation form tests now render `RiskRecordForm` directly; Dashboard summary tests assert mutation forms are absent.
- Latest rerun keeps Story 2.11 focused tests, typecheck, and lint green.
- Review patches applied: Command Center now returns an `ExecutiveDashboardClientData` payload without `riskMutationOptions`, while server-side Common Center/Private Workspace enrichment still uses the full dashboard DTO before serialization.
- Priority queue matching now normalizes Vietnamese diacritics before detecting overdue/urgent/high labels, and returns localized labels.
- Story remains `in-progress` until unrelated full-suite failures are resolved or product accepts review with known external regression failures.

### File List

- `_bmad-output/implementation-artifacts/2-11-dashboard-tong-quan-alignment-theo-yeu-cau-1-1.md`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/types.ts`
- `src/modules/dashboard/components/executive-dashboard-kpi-strip.tsx`
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`
- `src/modules/dashboard/components/executive-risk-summary.tsx`
- `src/modules/dashboard/types.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/command-center-service.test.ts`
- `tests/unit/risk-record-form.test.tsx`

## Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2026-06-06 | 1.0 | Created Story 2.11 implementation guide after approved Correct Course for Dashboard Tổng Quan requirement 1.1 alignment. | Codex |
| 2026-06-06 | 1.1 | Implemented Dashboard Tổng Quan project/opportunity metric, finance wording, read-only risk summary boundary and focused regression tests; full-suite validation remains blocked by unrelated failures. | Codex |
| 2026-06-06 | 1.2 | Reran Story 2.11 focused validation, typecheck and lint successfully; reconfirmed remaining regression failures are outside Story 2.11 scope, so status stays in-progress. | Codex |
| 2026-06-06 | 1.3 | Applied code-review patches for client-safe Dashboard payload sanitization and Vietnamese-normalized priority labels; focused tests, typecheck and lint pass. | Codex |
