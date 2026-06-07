# Sprint Change Proposal: Align Dashboard Tong Quan 1.1

Date: 2026-06-06
Project: green_nest_buider_web
Workflow: BMad Correct Course
Mode: Incremental, assumed from recommended path
Status: Approved
Approved by: Admin
Approved at: 2026-06-06T11:45:54+07:00

## 1. Issue Summary

Dashboard Tong Quan 1.1 has been implemented and tested, but a follow-up requirement review found three alignment gaps:

1. The dashboard currently includes direct risk mutation UI inside the risk summary section. This conflicts with the intended boundary that Dashboard Tong Quan should be an aggregate/read-only drill-down surface, while mutations belong to Risk/Approval/Decision/Meeting centers.
2. The dashboard clearly shows project portfolio totals, but "du an/co hoi" is not exposed as a combined executive metric. Proposal/opportunity counts exist in DTO `sourceCounts.proposals`, but the UI does not surface them as part of the portfolio summary.
3. The finance area is permission-gated and redacts sensitive data correctly, but "dong tien / chi phi tong quan" is currently represented only as visible amount total and visible record count. If the requirement is interpreted as cashflow/cost overview, the display needs clearer labels and DTO/UI support without becoming a full financial dashboard.

Triggering story:

- Story 2.3: `2-3-dashboard-ui-voi-kpi-strip-priority-queue-va-risk-summary`

Evidence reviewed:

- PRD FR-003, FR-006, FR-010, FR-011.
- Requirements inventory FR-003, FR-006, FR-010, FR-011.
- Readiness report notes that Dashboard Tong Quan should remain a read-only aggregate/drill-down entry.
- Current code:
  - `src/modules/dashboard/components/executive-risk-summary.tsx` imports and renders `RiskRecordForm`.
  - `src/modules/dashboard/services/executive-dashboard-service.ts` exposes `sourceCounts.proposals`, but KPI strip labels only "Du an trong scope" / "Danh muc du an".
  - `src/modules/dashboard/components/executive-dashboard-overview.tsx` renders "Tai chinh trong pham vi" from `financialSummary.visibleAmountTotal`.

## 2. Change Analysis Checklist

### 1. Understand Trigger And Context

- [x] 1.1 Triggering story identified: Story 2.3 Dashboard UI.
- [x] 1.2 Core problem categorized: misunderstanding / implementation drift around Dashboard boundary and ambiguous finance/opportunity display.
- [x] 1.3 Evidence gathered from PRD, readiness report, current story, code and focused tests.

### 2. Epic Impact Assessment

- [x] 2.1 Current epic can still be completed. Epic 2 remains valid.
- [x] 2.2 Epic-level change needed: add a corrective alignment story under Epic 2.
- [x] 2.3 Future epics are not invalidated. Epic 5 remains owner of risk mutation flows.
- [x] 2.4 No new epic needed.
- [x] 2.5 Epic order does not need resequencing.

### 3. Artifact Conflict And Impact Analysis

- [x] 3.1 PRD does not need scope change; it already states the relevant requirements.
- [x] 3.2 Architecture remains valid; keep service DTO -> UI pattern and mutation via actions/services.
- [x] 3.3 UX remains valid; use KPI Strip, Risk Map and Drilldown patterns, but avoid direct mutation ownership in dashboard.
- [x] 3.4 Secondary artifacts impacted: Epic 2 story list, sprint-status.yaml, tests, dashboard components and dashboard DTO tests.

### 4. Path Forward Evaluation

- [x] 4.1 Direct Adjustment is viable. Effort: low to medium. Risk: low.
- [x] 4.2 Rollback is not viable. Reverting Story 2.3 would destroy useful completed dashboard work.
- [x] 4.3 PRD MVP review is not needed. MVP remains achievable.
- [x] 4.4 Recommended approach: direct adjustment via a new patch story in Epic 2.

### 5. Sprint Change Proposal Components

- [x] 5.1 Issue summary created.
- [x] 5.2 Epic and artifact impacts documented.
- [x] 5.3 Recommended path documented.
- [x] 5.4 MVP impact and action plan documented.
- [x] 5.5 Handoff plan documented.

### 6. Final Review And Handoff

- [x] 6.1 Checklist completion reviewed.
- [x] 6.2 Proposal accuracy reviewed.
- [x] 6.3 User approval received.
- [x] 6.4 sprint-status.yaml update approved and applied.
- [x] 6.5 Handoff plan confirmed: route to Create Story, Validate Story and Dev Story.

## 3. Recommended Approach

Recommended path: Direct Adjustment.

Do not reopen/rollback Story 2.3. Add one corrective story in Epic 2, then run Create Story -> Validate Story -> Dev Story.

Proposed new story:

`2-11-dashboard-tong-quan-alignment-theo-yeu-cau-1-1`

Scope classification: Minor to Moderate.

Rationale:

- Requirements are already present in PRD and requirements inventory.
- Current implementation already has the DTO, UI sections and tests needed as a foundation.
- The change is mostly boundary cleanup, clearer aggregation, and test hardening.
- No database migration is required unless the team decides to introduce richer finance summary fields beyond existing proposal/approval/project DTO data.

## 4. Detailed Change Proposals

### Proposal A: Add Corrective Story To Epic 2

Artifact: `_bmad-output/planning-artifacts/epics/epic-2-workspace-iu-hnh-v-dashboard-module-1.md`

OLD:

```md
Story 2.10 is the last active Epic 2 story.
```

NEW:

```md
## Story 2.11: Can Chinh Dashboard Tong Quan Theo Yeu Cau 1.1

Requirements Covered: FR-003, FR-006, FR-010, FR-011, NFR-001, NFR-002, NFR-011.

La lanh dao,
toi muon Dashboard Tong Quan hien dung tong du an/co hoi, dong tien/chi phi tong quan theo quyen va chi mo chi tiet/chuyen trung tam chuyen trach khi can,
de dashboard van la man tong hop dieu hanh, khong tro thanh noi thao tac chuyen sau.

Acceptance Criteria:

AC1:
Given Dashboard Tong Quan render tu ExecutiveDashboardData
When nguoi dung mo dashboard
Then UI hien tong du an va tong co hoi/request/proposal trong pham vi bang nhan tieng Viet ro rang
And metric nay lay tu DTO da loc scope/permission, khong hardcode.

AC2:
Given nguoi dung co quyen xem tai chinh nhay cam
When dashboard render
Then UI hien dong tien/chi phi tong quan o muc executive summary, toi thieu gom tong gia tri duoc phep xem, so ban ghi tai chinh duoc xem va nhan phan biet du lieu chi phi/dong tien neu DTO co nguon
And khi khong co quyen, UI hien trang thai khong co quyen va khong render so tien/cashflow/budget that.

AC3:
Given dashboard co risk map/risk summary
When nguoi dung co quyen risk mutation
Then dashboard khong render form tao/cap nhat/override/dong risk truc tiep
And chi hien nut/link "Mo Trung Tam Rui Ro" hoac drill-down read-only theo permission neu co route an toan.

AC4:
Given dashboard co KPI/risk/approval/deadline/decision item
When nguoi dung chon item
Then dashboard mo drill-down/read-only metadata hoac link sang record/center chuyen trach theo quyen
And khong so huu mutation cua Approval/Risk/Decision/Meeting center.

AC5:
Given operations dashboard co task vi mo, du lieu ky thuat hoac ban ve chi tiet
When Dashboard Tong Quan render
Then nhung du lieu nay khong xuat hien mac dinh trong Dashboard Tong Quan.
```

Justification:

- This avoids mutating a completed story's historical record while making the corrective work explicit and traceable.

### Proposal B: Update Sprint Status After Approval

Artifact: `_bmad-output/implementation-artifacts/sprint-status.yaml`

OLD:

```yaml
  2-10-chairman-admin-navigation-policy-settings: done
  epic-2-retrospective: optional
```

NEW:

```yaml
  2-10-chairman-admin-navigation-policy-settings: done
  2-11-dashboard-tong-quan-alignment-theo-yeu-cau-1-1: backlog
  epic-2-retrospective: optional
```

Justification:

- Keeps the BMad story cycle intact. The new story can then be created with `[CS] Create Story`.

### Proposal C: Dashboard UI Boundary Cleanup

Artifact: `src/modules/dashboard/components/executive-risk-summary.tsx`

OLD:

```tsx
import { RiskRecordForm } from "@/modules/executive/components/risk-record-form";

// ...

{canShowMutationPanel ? (
  <RiskRecordForm mode="create" ... />
  <RiskRecordForm mode="update" ... />
  <RiskRecordForm mode="override" ... />
  <RiskRecordForm mode="close" ... />
) : null}
```

NEW:

```tsx
// Dashboard renders risk summary/map and read-only drill-down only.
// Mutation entry is a permission-aware link/action to the Risk Center when a safe route exists.
```

Implementation notes:

- Remove `RiskRecordForm` import from dashboard risk summary.
- Remove `canCreateRisk`, `canUpdateRisk`, `canOverrideRisk`, `canCloseRisk`, `canCloseHighRisk`, and `riskMutationOptions` props from `ExecutiveRiskSummary` if no longer needed there.
- Keep mutation permissions in DTO only if reused by Risk Center routing/action affordance.
- Add component test proving form labels/actions do not render in Dashboard Tong Quan.

### Proposal D: Portfolio Metric For Du An / Co Hoi

Artifacts:

- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/components/executive-dashboard-kpi-strip.tsx`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`

OLD:

```ts
sourceCounts: {
  projects: portfolio.total,
  proposals: scopedProposals.length,
  ...
}
```

and UI mainly displays:

```tsx
label: "Danh muc du an"
value: `${data.projectPortfolio.active}/${data.projectPortfolio.total}`
```

NEW:

```tsx
label: "Du an / Co hoi"
value: `${data.projectPortfolio.total} / ${data.sourceCounts.proposals}`
helper: `Dang hoat dong ${data.projectPortfolio.active} | Do ${...} | Vang ${...} | Xanh ${...}`
```

or, if the team wants a stronger contract:

```ts
portfolioSummary: {
  projectsTotal: number;
  opportunitiesTotal: number;
  activeProjects: number;
  red: number;
  yellow: number;
  green: number;
}
```

Recommendation:

- Use existing `sourceCounts.proposals` for this corrective story unless product decides "co hoi" is a separate domain object beyond proposals.

### Proposal E: Finance Summary Label And Scope Clarification

Artifacts:

- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`
- `src/modules/dashboard/components/executive-dashboard-kpi-strip.tsx`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`

OLD:

```tsx
<h2>Tai chinh trong pham vi</h2>
{visibleAmountTotal}
{visibleRecordCount} ban ghi duoc xem
```

NEW:

```tsx
<h2>Dong tien / Chi phi tong quan</h2>
<p>Tong gia tri duoc phep xem: {visibleAmountTotal}</p>
<p>{visibleRecordCount} ban ghi tai chinh trong pham vi</p>
<p>Chi hien du lieu tong hop theo quyen; khong phai dashboard tai chinh chi tiet.</p>
```

Optional DTO enhancement:

```ts
financialSummary: {
  state: "allowed";
  access: "full" | "partial";
  visibleAmountTotal: number;
  visibleRecordCount: number;
  currency: "VND";
  categoryTotals?: {
    cashFlow: number;
    cost: number;
    budget?: number;
  };
}
```

Recommendation:

- For this story, keep implementation minimal: relabel and show existing aggregate safely.
- Add DTO category totals only if existing domain data can distinguish cashflow vs cost reliably without inventing finance semantics.

## 5. Implementation Handoff

Recommended next BMad steps:

1. Run `[CS] Create Story` for `2-11-dashboard-tong-quan-alignment-theo-yeu-cau-1-1`.
2. Run `[VS] Validate Story`.
3. Run `[DS] Dev Story`.
4. Run focused tests:
   - `npm run test -- tests/unit/executive-dashboard-service.test.ts tests/unit/command-center-dashboard.test.tsx`
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run test:e2e` if route/responsive behavior changes.

Handoff recipients:

- Developer agent: implement Story 2.11 and tests.
- Product/owner reviewer: confirm whether "co hoi" maps to proposals for MVP.
- Product/finance reviewer: confirm whether existing aggregate amount is acceptable as "dong tien / chi phi tong quan" for MVP, or whether category totals are required.

Success criteria:

- Dashboard Tong Quan no longer renders direct risk mutation forms.
- Dashboard visibly shows both project total and opportunity/proposal total.
- Finance summary has a clear executive-level label and permission-safe behavior.
- Existing no-permission, drill-down, responsive and no-micro-task tests remain green.

## 6. Approval And Routing

Approved path:

- Epic 2 updated with Story 2.11.
- `sprint-status.yaml` updated with Story 2.11 in `backlog`.
- Change scope: Minor to Moderate.
- Routed to: Create Story -> Validate Story -> Dev Story.
