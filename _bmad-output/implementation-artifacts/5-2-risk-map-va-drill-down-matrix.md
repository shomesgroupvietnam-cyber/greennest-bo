# Story 5.2: Risk Map Va Drill-Down Matrix

Status: done

Ghi chu tao story: Ultimate context engine analysis completed - comprehensive developer guide created. Story nay mo rong read-side risk UI tu nen Story 5.1: risk map/heatmap, category summaries va drill-down matrix likelihood x impact. Pham vi co y khong lam CRUD risk/blocker, khong override/dong risk, khong tao AI draft lifecycle va khong tao risk repository/table song song.

## Story

As a lanh dao,  
I want xem risk map/heatmap va drill-down toi ma tran kha nang x anh huong,  
so that toi uu tien xu ly risk dung muc.

## Acceptance Criteria

1. **Risk Map hien thi day du tin hieu uu tien trong scope**
   - Given Dashboard Tong Quan hoac Risk Center co risk trong scope va user co `canViewRisk`
   - When render Risk Map
   - Then UI hien thi risk theo category, count, severity, affected projects, deadline va owner
   - And summary tinh tu tat ca risk scoped, khong chi tu 10 item dau cua list hien thi
   - And user thieu quyen/scope nhan empty/no-permission state, khong nhan risk source data roi moi bi UI an.

2. **Drill-down risk hien thi matrix likelihood x impact**
   - Given user mo mot risk item co quyen drill-down
   - When panel chi tiet mo ra
   - Then panel hien thi likelihood x impact, reason, linked project/module, owner, deadline, next action va audit neu co
   - And link/action trong panel chi dung safe internal href da qua `safeInternalHref`
   - And neu chua co audit/route/action hop le thi panel hien read-only/empty state ro rang, khong fake audit hoac tu tao URL tu raw id.

3. **Risk map khong phu thuoc mau**
   - Given user khong phan biet mau tot
   - When xem risk map, heatmap, matrix hoac badge status
   - Then moi trang thai co text label, count, aria-label hoac tooltip/text ho tro
   - And mau do/vang/xanh chi la ho tro thi giac, khong la tin hieu duy nhat.

4. **Dashboard, Morning Briefing va Common Center giu cung contract risk**
   - Given risk do/nghiem trong xuat hien trong executive scope
   - When Dashboard Tong Quan, Morning Briefing hoac Executive Common Center build DTO
   - Then cac surface tiep tuc dung `ExecutiveRiskItem` tu Story 5.1, co map/matrix metadata moi neu can
   - And FR-067 van dung: risk do/nghiem trong xuat hien tren Dashboard Tong, Morning Briefing, Risk & Alert Center neu co quyen.

## Tasks / Subtasks

- [x] Mo rong DTO risk map va matrix tren read-side contract (AC: 1, 2, 4)
  - [x] UPDATE `src/modules/dashboard/types.ts` de them type nho, stable key:
    - `ExecutiveRiskLikelihood = "low" | "medium" | "high"`.
    - `ExecutiveRiskMapCategorySummary` gom `categoryKey`, `categoryLabel`, `count`, severity counts, `affectedProjectCount`, `affectedProjectIds`, `nearestDeadline?`, `owners`, `statusCounts`.
    - `ExecutiveRiskMatrixCell` gom `likelihood`, `likelihoodLabel`, `impact`, `impactLabel`, `count`, `riskIds`.
    - `ExecutiveRiskSummary` giu backward-compatible fields `critical`, `high`, `byCategory`, `items`, va them `map` hoac `riskMap` gom category summaries + matrix cells.
  - [x] UPDATE `ExecutiveRiskItem` de co `likelihood`, `likelihoodLabel`, `impact`, `impactLabel`, `matrixCellLabel`, `nextAction`, `moduleId?`.
  - [x] Giu `sourceType: "risk"`, `sourceId`, `projectId`, `owner`, `deadline`, `reason`, `statusSuggestion`; khong doi contract da duoc Story 5.1/tests phu.

- [x] Tinh risk map/matrix trong service, khong tinh bang ad hoc trong UI (AC: 1, 2, 4)
  - [x] UPDATE `src/modules/executive/services/risk-status-service.ts` hoac `src/modules/dashboard/services/executive-dashboard-service.ts` bang helper pure function de derive likelihood/impact va aggregate map.
  - [x] `impact` = normalized risk severity tu Story 5.1.
  - [x] `likelihood` derive deterministic tu tin hieu hien co:
    - `high`: `statusSuggestion.status === "red"`, `action.status` la `blocked/overdue`, `dueGroup === "overdue"`, hoac `tone === "red"`.
    - `medium`: `statusSuggestion.status === "yellow"`, `dueGroup === "today" | "this_week"`, hoac `status` la `pending/in_progress/high_risk`.
    - `low`: con lai.
  - [x] `nextAction` lay tu `action.decisionRequired`, fallback `statusSuggestion.reason`; khong dung AI draft trong story nay.
  - [x] Category/heatmap aggregate tinh tren full risk list truoc khi cap `items` hien thi; `items` co the tiep tuc cap top 10 neu UI hien list ngan.
  - [x] Neu can linked module, dung `moduleId` metadata/read-only linked record; khong tu tao route module neu chua co route an toan.

- [x] Cap nhat Risk Map UI tren Dashboard Tong Quan (AC: 1, 3, 4)
  - [x] UPDATE `src/modules/dashboard/components/executive-risk-summary.tsx` tu summary list hien tai thanh risk map dense: category heatmap, status/severity counts, affected project count, nearest deadline, owners va risk list.
  - [x] Hien `Do/Vang/Xanh`, severity label, category label, likelihood label va impact label bang text trong badge/cell.
  - [x] Cell/button co `aria-label` du noi dung: category, count, severity/status va affected projects.
  - [x] Empty/no-permission states tiep tuc phan biet "khong co risk trong scope" voi "khong co quyen xem risk".
  - [x] Khong tao landing/hero/card nested; giu UI van hanh compact theo pattern dashboard hien co.

- [x] Cap nhat drill-down panel cho risk-specific matrix (AC: 2, 3)
  - [x] UPDATE `src/modules/dashboard/components/executive-drilldown-panel.tsx` bang type guard cho risk item, them section "Ma tran risk" hoac tuong duong.
  - [x] Section risk hien likelihood x impact, `matrixCellLabel`, `reason`, `nextAction`, category/severity/status suggestion.
  - [x] Metadata rows them `moduleId` khi co; linked records hien project/module theo permission state.
  - [x] Preserve focus trap, Escape close, return focus, responsive behavior: desktop side panel, mobile full-screen sheet.
  - [x] Khong mo action mutation risk; action buttons chi la safe read/open-source neu DTO da co permission/href.

- [x] Bao toan permission, finance va source-data sanitizer (AC: 1, 2, 4)
  - [x] `getExecutiveDashboardData` van gate `riskSummary` bang `permissions.canViewRisk`; user khong co risk permission nhan empty summary/map.
  - [x] `enrichExecutiveDashboardDataSources` van enrich risk items sau khi service da scope/filter; khong render unauthorized data roi an trong UI.
  - [x] Khong dua `amount`, `amountLabel`, raw document body, meeting transcript, AI output, audit payload raw vao risk map/drilldown.
  - [x] `safeInternalHref` la guard bat buoc cho moi link drill-down/action.

- [x] Cap nhat cac surface dung risk DTO (AC: 3, 4)
  - [x] UPDATE `src/modules/dashboard/components/executive-dashboard-overview.tsx` neu prop/summary shape doi.
  - [x] UPDATE `src/modules/dashboard/components/executive-morning-briefing.tsx` va `executive-common-center.tsx` de van hien risk label/status khong phu thuoc mau.
  - [x] UPDATE `src/modules/dashboard/services/executive-morning-briefing-service.ts` va `executive-common-center-service.ts` neu DTO moi can map/enrich hoac copy `riskSummary`.
  - [x] Khong tao route Risk Center rieng neu app chua co entry; story nay co the hoan thanh tren existing Dashboard/Common/Morning surfaces.

- [x] Kiem thu va validation (AC: 1, 2, 3, 4)
  - [x] UPDATE `tests/unit/risk-status-service.test.ts` cho likelihood derivation, impact label, nextAction fallback va matrix-safe metadata neu logic nam trong risk service.
  - [x] UPDATE `tests/unit/executive-dashboard-service.test.ts` cho `riskSummary.map/riskMap` aggregate full list, affected projects, owners, nearest deadline, permission-empty state va no finance/raw leakage.
  - [x] UPDATE `tests/unit/command-center-dashboard.test.tsx` cho risk map category cells, text labels khong chi mau, drill-down matrix fields, no-permission/empty state.
  - [x] UPDATE `tests/unit/executive-common-center-service.test.ts` va `tests/unit/executive-morning-briefing-service.test.ts` neu DTO shape thay doi tai cac surface do.
  - [x] Run `npm run typecheck`, `npm run lint`, `npm run test`.
  - [x] Chi run `npm run test:e2e` neu them route/navigation moi hoac thay doi responsive behavior khong duoc component test cover.

### Review Findings

- [x] [Review][Patch] Sanitize risk source href before serializing `statusSuggestion.sourceData` [src/modules/executive/services/risk-status-service.ts:199]
- [x] [Review][Patch] Sanitize risk item display text before risk map/drill-down serialization [src/modules/executive/services/risk-status-service.ts:453]

## Dev Notes

### Boi Canh Nghiep Vu

- Epic 5 yeu cau lanh dao xem risk/blocker theo nhom, muc do, mau do/vang/xanh, ly do, deadline va owner; he thong chi dua goi y/draft cho toi khi nguoi co quyen xac nhan. [Source: `_bmad-output/planning-artifacts/epics/epic-5-risk-alert-center-cho-iu-hnh.md`]
- Story 5.2 cover FR-061, FR-062, FR-067, NFR-001, UX-DR4, UX-DR12, UX-DR14, UX-DR20, UX-DR30. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-061 yeu cau Risk Map theo mau/nhom risk/du an/deadline/owner; FR-062 yeu cau drill-down likelihood x impact; FR-067 yeu cau risk do/nghiem trong hien o Dashboard Tong, Morning Briefing, Risk & Alert Center neu co quyen. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]

### Current Code State

- `src/modules/executive/services/risk-status-service.ts` da co `normalizeRiskLevel`, `mapRiskCategoryToConfiguredGroup`, `buildRiskStatusSuggestion`, `buildExecutiveRiskItem`. Service da map legacy categories, tao `statusSuggestion`, safe `sourceData`, urgent high legal/finance/planning thanh red.
- `src/modules/dashboard/types.ts` da co `ExecutiveRiskItem` voi `severity`, `severityLabel`, `categoryKey`, `categoryLabel`, `statusSuggestion`; `ExecutiveRiskSummary` hien chi co `critical`, `high`, `byCategory`, `items`.
- `src/modules/dashboard/services/executive-dashboard-service.ts` build risk summary tu `executiveData.leadershipActionItems`, gate bang `permissions.canViewRisk`, va tra empty summary khi user khong co quyen risk. Phai giu behavior nay.
- `src/modules/dashboard/services/executive-drilldown-source.ts` da co `safeInternalHref`, `enrichExecutiveSourceItem`, `linkedRecords`, `availableActions`, `timeline`, `auditTrail`, permissionState. Reuse thay vi tao drill-down sanitizer moi.
- `src/modules/dashboard/components/executive-risk-summary.tsx` hien co category count + list risk can xem; chua co heatmap/matrix likelihood x impact hoac affected project aggregate.
- `src/modules/dashboard/components/executive-drilldown-panel.tsx` hien co accessible read-only panel, focus trap, Escape close, linked records, actions, timeline, audit. Story nay chi them risk-specific section/metadata, khong rewrite panel.
- `tests/unit/command-center-dashboard.test.tsx` da co patterns cho open/close drill-down, safe href, no-permission states, labels. Mo rong test o day thay vi tao harness song song.

### Previous Story Intelligence

- Story 5.1 da ap dung code review fixes:
  - Legacy category mapping dung config keys: `material_risk -> finance`, `land_risk -> planning_technical`, `compliance_risk -> system_permission`.
  - `RiskStatusSourceData` bat buoc co safe `title`, `reason`, `severity`; optional `href`, `permissionState`.
  - Dashboard khong build/serialize risk DTO khi `canViewRisk` false.
  - High risk trong urgent categories `finance`, `legal`, `planning_technical` co the goi y red.
- Khong lap lai cac loi da fix: khong drop safe source metadata, khong build risk map cho user thieu quyen, khong dung raw legacy category label tren UI.
- Story 5.1 khong tao risk CRUD/table/repository; Story 5.2 cung phai tiep tuc read-side tren `ExecutiveLeadershipActionItem`/dashboard DTO hien co.

### Architecture Guardrails

- Domain modules nam trong `src/modules/*`; service orchestration trong `services/*-service.ts`; UI module trong `components/*`; cross-cutting permission/audit trong `src/lib/*`. [Source: `_bmad-output/project-context.md`; `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- App Router pages compose module components; domain logic/aggregation phai o service layer, khong tinh rule chinh trong React component. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`]
- Permission enforcement phai o server/service truoc UI; UI disable/hide chi la UX, khong phai security. [Source: `docs/context/permissions-audit.md`; `_bmad-output/project-context.md`]
- DTO domain dung camelCase; stable machine keys lowercase/snake_case; label tieng Viet la metadata hien thi. [Source: `_bmad-output/project-context.md`]
- Khong them dependency moi. Local stack hien tai: Next.js `^15.3.2`, React `^19.0.0`, TypeScript `^5.8.3`, Tailwind `^3.4.17`, lucide-react `^0.511.0`, Vitest `^3.1.3`. [Source: `package.json`]

### UX Guardrails

- Risk map/heatmap phai co text/label/tooltip/aria-label; khong chi dung mau do/vang/xanh. [Source: `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]
- Drill-down detail phai co title, type/scope, owner, deadline, status, reason, source/linked records, actions theo quyen, timeline/audit neu co; desktop side panel, mobile full-screen sheet. [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`]
- Dashboard van hanh phai dense but readable, khong dung hero/landing pattern, khong nested cards; card chi cho item/lap lai/panel thuc su. [Source: `_bmad-output/planning-artifacts/ux-design-specification/design-system-foundation.md`]
- Touch/click targets trong list/button nen giu `min-h-11` khi la action tren mobile; text phai wrap, khong overlap. [Source: `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]

### Suggested DTO Shape

Ten field co the dieu chinh theo code style, nhung intent phai giu: service-level aggregate, backward-compatible summary, label-rich, permission-safe.

```ts
export type ExecutiveRiskLikelihood = "low" | "medium" | "high";

export type ExecutiveRiskMapCategorySummary = {
  categoryKey: string;
  categoryLabel: string;
  count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  affectedProjectCount: number;
  affectedProjectIds: string[];
  nearestDeadline?: string;
  owners: string[];
  statusCounts: Record<"green" | "yellow" | "red", number>;
};

export type ExecutiveRiskMatrixCell = {
  likelihood: ExecutiveRiskLikelihood;
  likelihoodLabel: string;
  impact: "low" | "medium" | "high" | "critical";
  impactLabel: string;
  count: number;
  riskIds: string[];
};

export type ExecutiveRiskMap = {
  total: number;
  affectedProjectCount: number;
  categories: ExecutiveRiskMapCategorySummary[];
  matrix: ExecutiveRiskMatrixCell[];
};
```

`ExecutiveRiskSummary` nen them `riskMap: ExecutiveRiskMap` hoac `map: ExecutiveRiskMap`, dong thoi giu cac field cu. `ExecutiveRiskItem` nen co `likelihood`, `likelihoodLabel`, `impact`, `impactLabel`, `matrixCellLabel`, `nextAction`, `moduleId?`.

### File Targets

Expected UPDATE:
- `src/modules/dashboard/types.ts`
- `src/modules/executive/services/risk-status-service.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/services/executive-drilldown-source.ts` neu can linked module/read-only metadata
- `src/modules/dashboard/components/executive-risk-summary.tsx`
- `src/modules/dashboard/components/executive-drilldown-panel.tsx`
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`
- `src/modules/dashboard/components/executive-common-center.tsx`
- `src/modules/dashboard/components/executive-morning-briefing.tsx`
- `src/modules/dashboard/services/executive-common-center-service.ts` neu DTO shape can propagate
- `src/modules/dashboard/services/executive-morning-briefing-service.ts` neu DTO shape can propagate
- `tests/unit/risk-status-service.test.ts`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/executive-common-center-service.test.ts` neu common DTO/service thay doi
- `tests/unit/executive-morning-briefing-service.test.ts` neu briefing DTO/service thay doi

Avoid:
- Khong tao `src/modules/risks` hoac risk repository/table/CRUD chi de pass Story 5.2.
- Khong tao form create/update/close/override risk; Story 5.3/5.4 xu ly.
- Khong tao AI risk draft/advisory lifecycle; Story 5.5/Epic 8 xu ly.
- Khong fetch audit raw/global de lam panel co du lieu; chi hien audit neu DTO scoped/safe da co.
- Khong them charting library moi; risk map/heatmap co the lam bang Tailwind grid/list hien co.

### Testing Guidance

- Service tests nen dung ngay co dinh va fixture risk/action ro rang; khong phu thuoc system clock.
- Component tests nen assert text label/aria-label trong heatmap va matrix, khong assert CSS color la tin hieu duy nhat.
- Drill-down test nen click mot risk item va assert likelihood label, impact label, reason, owner, deadline, next action, project/module metadata va empty audit state neu khong co audit.
- Permission regression bat buoc: `canViewRisk=false` thi `riskSummary.items` rong, `riskMap.total` bang 0 va serialized DTO khong chua source data risk.
- Finance/raw leakage regression: serialized risk map/drilldown khong chua `amountLabel`, raw body/transcript/AI output.

### Git / Worktree Notes

- Recent commits before story creation: `d4db6c7 4.1 done`, `9696080 Module 1: story 4.1`, `484589a 2205`, `a8162e3 first fcm`.
- Worktree co the dang dirty tu cac story truoc. Dev agent khong duoc revert thay doi khong thuoc story; neu file target da dirty, doc current content va patch toi thieu.

## Dev Agent Record

### Agent Model Used
GPT-5 Codex

### Debug Log References
- `npm run test -- tests/unit/risk-status-service.test.ts tests/unit/executive-dashboard-service.test.ts tests/unit/command-center-dashboard.test.tsx` - passed, 3 files / 38 tests.
- `npm run typecheck` - passed.
- `npm run lint` - passed.
- `npm run test` - passed, 76 files / 481 tests.
- Code review patch validation: targeted risk/dashboard tests passed, 3 files / 39 tests; `npm run typecheck`, `npm run lint`, and `npm run test` passed, 76 files / 482 tests.

### Completion Notes List
- Extended the read-side risk contract with likelihood, impact, matrix labels, next action, module metadata, and service-built `riskMap` aggregate.
- Added deterministic risk likelihood derivation and full-list category/matrix aggregation while preserving permission gating and finance/raw source sanitizer behavior.
- Updated dashboard Risk Summary into a label-rich risk map/matrix and added risk-specific drill-down metadata without adding mutation actions or new risk storage.
- Propagated risk likelihood/impact labels across Priority Queue, Morning Briefing, Common Center, and private workspace test fixtures so surfaces keep the same `ExecutiveRiskItem` contract.
- Added/updated unit and component tests for DTO aggregation, permission-empty state, no finance leakage, risk map accessibility labels, and drill-down matrix fields.
- Code review patches sanitized unsafe risk source hrefs and top-level risk item display text before dashboard/drill-down serialization.

### File List
- `_bmad-output/implementation-artifacts/5-2-risk-map-va-drill-down-matrix.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/modules/dashboard/types.ts`
- `src/modules/executive/services/risk-status-service.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/services/executive-common-center-service.ts`
- `src/modules/dashboard/services/executive-drilldown-source.ts`
- `src/modules/dashboard/components/executive-risk-summary.tsx`
- `src/modules/dashboard/components/executive-drilldown-panel.tsx`
- `src/modules/dashboard/components/executive-priority-queue.tsx`
- `src/modules/dashboard/components/executive-morning-briefing.tsx`
- `src/modules/dashboard/components/executive-common-center.tsx`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `tests/unit/risk-status-service.test.ts`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/executive-private-workspace-service.test.ts`

## Change Log

- 2026-06-01: Implemented risk map, likelihood x impact matrix drilldown, risk DTO aggregation, and tests; moved story to review.
- 2026-06-01: Addressed code review sanitizer findings and moved story to done.
