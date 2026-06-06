# Story 5.1: Risk Levels, Categories Và Status Suggestion

Status: done

Ghi chú tạo story: Ultimate context engine analysis completed - comprehensive developer guide created. Story này đặt nền đọc/chuẩn hóa risk cho Risk & Alert Center: level, category theo BO Settings và gợi ý trạng thái đỏ/vàng/xanh từ dữ liệu hiện có. Phạm vi cố ý không làm CRUD risk/blocker, không xác nhận/override trạng thái, không tạo AI draft chính thức.

## Story

As a lãnh đạo hoặc quản trị điều hành,  
I want risk có level, category và trạng thái đỏ/vàng/xanh được tính từ dữ liệu,  
so that dashboard và Risk Center phản ánh mức độ nghiêm trọng nhất quán.

## Acceptance Criteria

1. **Risk level được chuẩn hóa và có label tiếng Việt**
   - Given risk data có mức `low`, `medium`, `high`, `critical`
   - When service tạo risk DTO
   - Then level được chuẩn hóa thành stable key `low | medium | high | critical`
   - And DTO/UI hiển thị label tiếng Việt `Thấp`, `Trung bình`, `Cao`, `Nghiêm trọng`
   - And mọi trạng thái/risk badge có text label, không dùng màu làm tín hiệu duy nhất.

2. **Risk category dùng cấu hình BO Settings, có fallback seed**
   - Given risk category cấu hình trong BO Settings qua `risk_group_configs`
   - When Risk Center, Executive Dashboard hoặc Common Center tải dữ liệu
   - Then service dùng active `RiskGroupConfig` từ policy settings để map `riskKey`, `labelVi`, `defaultSeverity`, `moduleId`
   - And nếu policy settings chưa có file/bảng config thì dùng fallback seed mặc định của Story 1.3
   - And không coi `ExecutiveRiskCategory` hardcoded trong mock data là source of truth.

3. **Gợi ý trạng thái đỏ/vàng/xanh có reason và source data an toàn**
   - Given project có blocker nghiêm trọng, approval quá hạn, hồ sơ thiếu hoặc risk cao
   - When service tính trạng thái đỏ/vàng/xanh
   - Then trả `statusSuggestion` gồm `status`, `labelVi`, `reason`, `sourceData`, `generatedAt`
   - And `sourceData` chỉ chứa safe summary/link metadata, không dump raw finance payload, tài liệu, meeting transcript, AI output hoặc dữ liệu ngoài scope
   - And trạng thái chỉ là `suggested`, chưa `confirmed` hoặc `overridden` nếu chưa có người có quyền xác nhận.

4. **Dashboard/Risk surfaces dùng cùng DTO và vẫn lọc quyền trước UI**
   - Given user có quyền/scope xem risk
   - When `ExecutiveDashboardData`, Morning Briefing hoặc Executive Common Center build risk summary
   - Then các surface dùng cùng risk DTO đã normalize, có category label, severity label và status suggestion
   - And user thiếu quyền/scope không nhận risk source data rồi mới bị UI ẩn.

## Tasks / Subtasks

- [x] Định nghĩa risk constants/types dùng chung (AC: 1, 2, 3)
  - [x] Mở rộng `src/modules/executive/types/index.ts` hoặc tạo file type/module nhỏ được export rõ cho `RiskLevelKey`, `RiskLevelMetadata`, `RiskStatusKey`, `RiskStatusSuggestion`, `RiskSignalSource`, `RiskCategoryMetadata`.
  - [x] Labels bắt buộc: `low -> Thấp`, `medium -> Trung bình`, `high -> Cao`, `critical -> Nghiêm trọng`; `green -> Xanh`, `yellow -> Vàng`, `red -> Đỏ`.
  - [x] `RiskSignalSource` tối thiểu có `sourceType`, `sourceId`, `projectId?`, `title`, `reason`, `severity`, `href?`, `permissionState?`; không chứa raw payload nhạy cảm.
  - [x] Giữ stable machine keys bằng lowercase/snake_case; label tiếng Việt chỉ là metadata hiển thị.

- [x] Tạo service chuẩn hóa/gợi ý risk (AC: 1, 2, 3)
  - [x] ADD `src/modules/executive/services/risk-status-service.ts` hoặc tên tương đương trong `src/modules/executive/services`.
  - [x] Public functions đề xuất: `normalizeRiskLevel`, `mapRiskCategoryToConfiguredGroup`, `buildRiskStatusSuggestion`, `buildExecutiveRiskItem`.
  - [x] Service nhận `RiskGroupConfig[]` hoặc `ExecutiveRiskGroupMetadata[]` đã active; nếu input rỗng thì gọi fallback từ `createDefaultPolicySettings().riskGroups` hoặc `listActiveRiskGroups` qua dependency injection.
  - [x] Map legacy categories hiện có sang config key: `legal_risk -> legal`, `land_risk/planning_risk -> planning_technical`, `approval_risk -> approval`, `schedule_risk/delay_risk -> schedule`, `cost_overrun_risk/cashflow_risk/material_risk -> finance`, `permission_risk/system_risk/compliance_risk -> system_permission`, còn lại dùng `operation` hoặc `uncategorized` có label rõ.
  - [x] Unknown level/category không được silently thành màu; trả fallback có label rõ và test coverage.
  - [x] Rule gợi ý trạng thái:
    - `red`: blocker nghiêm trọng, risk `critical`, approval quá hạn vượt policy/escalation, hồ sơ thiếu làm chặn bước, risk pháp lý/tài chính/quy hoạch cao cần lãnh đạo xử lý ngay.
    - `yellow`: risk `medium` hoặc `high` chưa chặn, approval gần quá hạn, hồ sơ thiếu nhưng chưa chặn, milestone cần theo dõi.
    - `green`: không blocker, milestone ổn, approval không quá hạn, hồ sơ/risk trong tầm kiểm soát.
  - [x] Output luôn ghi `confirmationState: "suggested"`; không ghi override/confirmed state trong story này.

- [x] Nối service vào Executive Dashboard DTO (AC: 1, 2, 3, 4)
  - [x] UPDATE `src/modules/dashboard/types.ts` để `ExecutiveRiskItem` có `severityLabel`, `categoryKey`, `categoryLabel`, `statusSuggestion`.
  - [x] UPDATE `src/modules/dashboard/services/executive-dashboard-service.ts`: thay `buildRiskSummary(actions)` hiện đang dùng raw `action.riskCategory` bằng service mới.
  - [x] Risk summary phải dùng `executiveData.riskGroups` hoặc active policy groups từ `listActiveRiskGroups`, không hardcode category list trong dashboard service.
  - [x] `byCategory` nên dùng category label hoặc `{ key, label, count }` rõ ràng; tránh đưa raw legacy keys như `legal_risk` lên UI.
  - [x] Source metadata của risk item phải giữ `sourceType: "risk"`, `sourceId`, `projectId`, `owner`, `deadline`, `reason`, `linkedRecords` nếu có để drill-down sau này.
  - [x] Nếu dùng approval/document/project signals để tính status suggestion, chỉ lấy dữ liệu đã scoped trong `getExecutiveDashboardData`; không fetch raw ngoài service boundary.

- [x] Cập nhật quyền đọc risk theo hướng tối thiểu (AC: 4)
  - [x] ADD `risk.view` vào `PERMISSIONS` trong `src/lib/permissions/can.ts` và label tương ứng trong `src/modules/settings/services/role-permission-catalog-repository.ts`.
  - [x] Gán `risk.view` cho các role lãnh đạo/project roles đã có quyền xem project/proposal risk: `chu_tich`, `tong_giam_doc`, `pho_tong_giam_doc`, `giam_doc_du_an`, `quan_ly_du_an`, `dau_tu_phat_trien`, `kiem_soat_noi_bo` và các role chỉ đọc phù hợp.
  - [x] UPDATE `database/seeds/001_roles_permissions.sql` để permission catalog Supabase mode không lệch TypeScript catalog.
  - [x] Trong giai đoạn chuyển tiếp, `canViewRisk` có thể cho phép `risk.view` hoặc legacy `project.view/proposal.view`, nhưng story phải test rõ behavior và không làm viewer ngoài scope thấy risk source data.
  - [x] Không thêm `risk.create`, `risk.update`, `risk.override` trong story này trừ khi dev chứng minh cần cho read-side contract; các mutation thuộc Story 5.3/5.4.

- [x] Cập nhật UI risk hiện có để dùng label đã normalize (AC: 1, 2, 4)
  - [x] UPDATE `src/modules/dashboard/components/executive-risk-summary.tsx` để không còn hardcode English labels `Critical/High/Low/Medium`, `Risk Summary`, `Project health` nếu cùng surface đã Vietnamese-first.
  - [x] UPDATE `src/modules/dashboard/components/executive-dashboard-overview.tsx`, `executive-dashboard-kpi-strip.tsx`, `executive-priority-queue.tsx`, `executive-common-center.tsx`, `executive-morning-briefing.tsx` nếu chúng hiển thị severity/category/status label từ risk DTO.
  - [x] UI phải hiển thị cả text `Đỏ/Vàng/Xanh` và level/category label; màu chỉ là hỗ trợ.
  - [x] Empty/no-permission states giữ nguyên ý nghĩa: không có risk trong scope khác với không có quyền xem risk.

- [x] Không tạo nhầm scope của các story sau
  - [x] Không tạo route/form CRUD risk/blocker chính thức; Story 5.3 xử lý tạo/cập nhật risk/blocker theo quyền.
  - [x] Không tạo override/close workflow hoặc audit override; Story 5.4 xử lý xác nhận/override/đóng risk.
  - [x] Không tạo AI risk draft lifecycle; Story 5.5 và Epic 8 xử lý draft suggestion/AI.
  - [x] Không tạo bảng risk chính thức nếu chỉ để pass AC 5.1; nếu cần persistence, phải giữ ở mức schema/contract tối thiểu và không làm CRUD UI.

- [x] Kiểm thử (AC: 1, 2, 3, 4)
  - [x] ADD `tests/unit/risk-status-service.test.ts` cho normalize level, category mapping từ config/fallback, red/yellow/green suggestion rules và `confirmationState: "suggested"`.
  - [x] UPDATE `tests/unit/executive-dashboard-service.test.ts` cho risk summary có `severityLabel`, `categoryLabel`, `statusSuggestion.reason`, safe source data và category config từ policy settings.
  - [x] UPDATE `tests/unit/executive-service.test.ts` nếu `riskGroups` metadata/labels được đổi shape.
  - [x] UPDATE `tests/unit/command-center-dashboard.test.tsx`, `executive-common-center-service.test.ts`, `executive-morning-briefing-service.test.ts` nếu UI/service label hoặc priority copy đổi.
  - [x] UPDATE `tests/unit/permissions.test.ts`, role-permission catalog/seed tests nếu thêm `risk.view`.
  - [x] Run `npm run typecheck`, `npm run lint`, `npm run test`.
  - [x] Chỉ run `npm run test:e2e` nếu thay route/navigation/responsive behavior; label-only dashboard thay đổi có thể được phủ bằng component/unit test.

### Review Findings

- [x] [Review][Patch] Legacy risk category mapping diverges from Story 5.1 required config keys [`src/modules/executive/services/risk-status-service.ts`:77]
- [x] [Review][Patch] Risk status source data drops required safe reason/link/permission metadata [`src/modules/executive/types/index.ts`:271]
- [x] [Review][Patch] Dashboard builds risk DTOs even when canViewRisk is false [`src/modules/dashboard/services/executive-dashboard-service.ts`:1146]
- [x] [Review][Patch] Status suggestion cannot classify urgent high legal/finance/planning risks as red [`src/modules/executive/services/risk-status-service.ts`:267]

## Dev Notes

### Bối Cảnh Nghiệp Vụ

- Epic 5 yêu cầu lãnh đạo xem risk/blocker theo nhóm, mức độ, trạng thái đỏ/vàng/xanh, lý do, deadline và owner; hệ thống chỉ đưa gợi ý/draft cho tới khi người có quyền xác nhận. [Source: `_bmad-output/planning-artifacts/epics/epic-5-risk-alert-center-cho-iu-hnh.md`]
- Story 5.1 cover FR-052, FR-053, FR-054, FR-055, FR-056, FR-058, FR-059, FR-060, NFR-008. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md`]
- FR-058/059/060 chốt điều kiện đỏ/vàng/xanh; đây là gợi ý từ dữ liệu, không phải quyết định cuối cùng của hệ thống. [Source: `_bmad-output/planning-artifacts/epics/requirements-inventory.md#functional-requirements`]

### Current Code State

- `src/modules/settings/services/policy-settings-service.ts` đã có `listActiveRiskGroups`, `upsertRiskGroupConfig`, `setRiskGroupConfigActive`; mutation require `settings.manage`.
- `src/modules/settings/services/policy-settings-repository.ts` đã có JSON + Supabase repository, fallback mặc định gồm `legal`, `planning_technical`, `approval`, `schedule`, `finance`, `missing_document`, `system_permission`, `operation`.
- `database/migrations/202605230004_create_policy_settings.sql` đã tạo `risk_group_configs` với RLS: active config readable cho authenticated runtime, writes chỉ settings manager.
- `src/modules/executive/services/executive-service.ts` đã load `listActiveRiskGroups()` và expose `ExecutiveLeadershipData.riskGroups`.
- `src/modules/dashboard/services/executive-dashboard-service.ts` hiện build risk summary từ `ExecutiveLeadershipActionItem`, filter action type/risk level, nhưng category đang là raw `action.riskCategory` legacy và chưa có label/status suggestion contract.
- `src/modules/dashboard/components/executive-risk-summary.tsx` và vài dashboard/common-center components còn hardcode English/ASCII labels như `Critical`, `High`, `Risk Summary`, `Project health`. Story này cần đưa label từ DTO hoặc constants để nhất quán Vietnamese-first.
- `src/lib/permissions/can.ts` hiện chưa có `risk.view`; `canViewRisk` trong dashboard đang suy ra từ `project.view`/`proposal.view`. Nếu thêm permission mới, nhớ cập nhật role catalog, seeds và tests cùng lúc.
- Chưa có `src/modules/risk` hoặc official risk table/CRUD. `TaskLinkedEntityType` đã cho phép `"risk"`, nhưng đó chỉ là linkage type, không phải risk repository.

### Ràng Buộc Kiến Trúc

- Domain modules nằm trong `src/modules/*`; service orchestration trong `services/*-service.ts`; repository trong `services/*-repository.ts`; cross-cutting auth/permissions/audit trong `src/lib/*`. [Source: `_bmad-output/project-context.md`; `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`]
- Internal mutations dùng Server Actions + service layer; story này chủ yếu read-side/service DTO, không cần tạo route handler hoặc server action mới nếu không có mutation. [Source: `_bmad-output/planning-artifacts/architecture/core-architectural-decisions.md`]
- Permission enforcement ở server/service trước UI; không render dữ liệu rồi ẩn. [Source: `docs/context/permissions-audit.md`]
- Mock/file-backed và Supabase adapter phải giữ cùng contract nếu đụng repository. [Source: `_bmad-output/project-context.md`]
- Stable keys dùng lowercase/snake_case; label tiếng Việt nằm ở constants/config/UI, không làm source key. [Source: `_bmad-output/project-context.md`]

### Ràng Buộc UX

- Badge trạng thái phải có chữ, không chỉ màu; risk map/heatmap cần số, label hoặc tooltip. [Source: `_bmad-output/planning-artifacts/ux-design-specification/responsive-design-accessibility.md`]
- Dashboard vận hành phải dense but readable, tables/lists/timelines/heatmaps là bề mặt chính; không dùng hero/landing page pattern. [Source: `_bmad-output/planning-artifacts/ux-design-specification/design-system-foundation.md`]
- Drill-down risk sau này phải có title, scope, owner, deadline, trạng thái, lý do cảnh báo, source/linked records, action theo quyền và audit nếu có. Story này chỉ cần DTO đủ source metadata để Story 5.2/5.3 dùng tiếp. [Source: `_bmad-output/planning-artifacts/ux-design-specification/ux-consistency-patterns.md`]

### Dependency Intelligence

- Story 1.3 đã tạo policy settings foundation và review fixes cho fallback risk groups, active default guard, Supabase RLS, repository parity và BO Settings UI. Không tạo risk group config song song. [Source: `_bmad-output/implementation-artifacts/1-3-policy-co-ban-cho-nguong-duyet-tien-va-nhom-risk.md`]
- Story 2.2 đã tạo `ExecutiveDashboardData`, `ExecutiveRiskItem`, `ExecutiveRiskSummary`, finance sanitizer, scoped proposal helper và Command Center wiring. Story 5.1 phải extend DTO này thay vì tạo dashboard contract mới. [Source: `_bmad-output/implementation-artifacts/2-2-executive-dashboard-service-dto-theo-scope.md`]
- Story 4.4 gần đây đã chuyển Decision & Assignment Center sang repository-backed DTO với selected Command Center scope, safe linked source hrefs và audit redaction. Risk source data nên dùng cùng tư duy: safe summary, scoped before render, không raw payload. [Source: `_bmad-output/implementation-artifacts/4-4-decision-assignment-center-ui.md`]

### Suggested DTO Shape

```ts
export type RiskStatusKey = "green" | "yellow" | "red";
export type RiskConfirmationState = "suggested";

export type RiskSignalSource = {
  sourceType: "project" | "proposal" | "leadership_approval" | "executive_action" | "meeting" | "decision" | "risk" | "document" | "legal" | "task";
  sourceId: string;
  projectId?: string;
  title: string;
  reason: string;
  severity: "low" | "medium" | "high" | "critical";
  href?: string;
  permissionState?: "allowed" | "read_only" | "denied";
};

export type RiskStatusSuggestion = {
  status: RiskStatusKey;
  labelVi: "Xanh" | "Vàng" | "Đỏ";
  reason: string;
  sourceData: RiskSignalSource[];
  confirmationState: RiskConfirmationState;
  generatedAt: string;
};
```

`ExecutiveRiskItem` có thể thêm fields:

```ts
severityLabel: string;
categoryKey: string;
categoryLabel: string;
statusSuggestion: RiskStatusSuggestion;
```

Tên type có thể đổi, nhưng phải giữ intent: normalized, label-rich, safe source data, suggested-only.

### File Targets

Expected ADD:
- `src/modules/executive/services/risk-status-service.ts`
- `tests/unit/risk-status-service.test.ts`

Expected UPDATE:
- `src/modules/executive/types/index.ts`
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/services/executive-common-center-service.ts` nếu priority/risk overview cần label/status mới
- `src/modules/dashboard/services/executive-morning-briefing-service.ts` nếu top risk dùng severity/category label
- `src/modules/dashboard/components/executive-risk-summary.tsx`
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`
- `src/modules/dashboard/components/executive-dashboard-kpi-strip.tsx`
- `src/modules/dashboard/components/executive-priority-queue.tsx`
- `src/modules/dashboard/components/executive-common-center.tsx`
- `src/lib/permissions/can.ts`
- `src/modules/settings/services/role-permission-catalog-repository.ts`
- `database/seeds/001_roles_permissions.sql`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/executive-service.test.ts` nếu metadata shape đổi
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/executive-common-center-service.test.ts`
- `tests/unit/executive-morning-briefing-service.test.ts`
- `tests/unit/permissions.test.ts`
- `tests/unit/module-one-seed-fixtures.test.ts` nếu seed permission/risk assertions đổi

Avoid:
- Không tạo `src/modules/risks` nếu chỉ để chuẩn hóa DTO; Epic hiện chỉ định `src/modules/executive`, `dashboard`, `settings`, `permissions`.
- Không tạo risk CRUD actions/forms.
- Không tạo override/audit close workflow.
- Không thêm global store hoặc UI route mới nếu dashboard/service integration đủ cho AC.
- Không hardcode category labels trong dashboard component khi config đã có.
- Không dùng `any` để né type blast radius.

### Testing Guidance

- Dùng test pure function cho rule engine trước, inject risk groups/source signals để không phụ thuộc mock global.
- Với dashboard service test, truyền `today: new Date("2026-06-01T00:00:00.000Z")` hoặc ngày cố định; không để overdue/status test phụ thuộc clock.
- Test safe source data bằng deep assertion: không chứa `amountLabel` khi finance denied, không chứa raw document body/transcript/AI output.
- Test permission/scope: scoped user chỉ thấy risk từ project/proposal/action trong scope; no-access DTO rỗng hoặc no-permission state rõ.
- Nếu update copy component, tests nên assert label tiếng Việt thay vì English copy cũ.

### Latest Tech Notes

- Local stack hiện từ `package.json`: Next.js `^15.3.2`, React `^19.0.0`, TypeScript `^5.8.3`, Supabase JS `^2.49.4`, Zod `^3.24.4`, Vitest `^3.1.3`.
- Theo workflow customization của project, story nội bộ này dùng package.json và project-context; không cần web research vì không phụ thuộc API/library bên ngoài mới hoặc bất ổn.

### Git / Worktree Notes

- Recent commits: `d4db6c7 4.1 done`, `9696080 Module 1: story 4.1`, `484589a 2205`, `a8162e3 first fcm`.
- Worktree đang có nhiều thay đổi/untracked từ Epic 4 và sprint artifacts. Dev agent không được revert những thay đổi này; nếu cùng file bị dirty, đọc current content và patch tối thiểu.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/risk-status-service.test.ts tests/unit/executive-dashboard-service.test.ts tests/unit/permissions.test.ts tests/unit/module-one-seed-fixtures.test.ts`
- `npm run test -- tests/unit/executive-common-center-service.test.ts tests/unit/executive-morning-briefing-service.test.ts tests/unit/risk-status-service.test.ts tests/unit/executive-dashboard-service.test.ts`
- `npm run test -- tests/unit/risk-status-service.test.ts tests/unit/executive-dashboard-service.test.ts`
- `npm run typecheck`
- `npm run lint`
- `npm run test`

### Completion Notes List

- Added normalized risk level/category/status service with Vietnamese labels, configured/fallback risk group mapping, safe `sourceData`, and suggested-only status output.
- Extended `ExecutiveRiskItem` and dashboard/common/morning/private workspace consumers to use `severityLabel`, `categoryLabel`, and `statusSuggestion` text labels.
- Added `risk.view` to TypeScript permissions, role permission catalog, Supabase seed, and module-one acceptance fixture.
- Updated risk UI labels and tests so badges include text for severity/category/status instead of relying on color.
- Applied code review fixes for exact legacy category mapping, required safe `sourceData` metadata, `canViewRisk` service gating, and urgent high legal/finance/planning red status suggestions.
- Did not add risk CRUD routes, override/close workflow, AI draft lifecycle, or a new risk table.

### File List

- `_bmad-output/implementation-artifacts/5-1-risk-levels-categories-va-status-suggestion.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `database/seeds/001_roles_permissions.sql`
- `src/lib/permissions/can.ts`
- `src/modules/settings/services/role-permission-catalog-repository.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/executive/services/risk-status-service.ts`
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `src/modules/dashboard/services/executive-common-center-service.ts`
- `src/modules/dashboard/services/executive-morning-briefing-service.ts`
- `src/modules/dashboard/components/executive-risk-summary.tsx`
- `src/modules/dashboard/components/executive-dashboard-overview.tsx`
- `src/modules/dashboard/components/executive-dashboard-kpi-strip.tsx`
- `src/modules/dashboard/components/executive-priority-queue.tsx`
- `src/modules/dashboard/components/executive-common-center.tsx`
- `src/modules/dashboard/components/executive-morning-briefing.tsx`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `tests/unit/risk-status-service.test.ts`
- `tests/unit/executive-dashboard-service.test.ts`
- `tests/unit/permissions.test.ts`
- `tests/unit/module-one-seed-fixtures.test.ts`
- `tests/fixtures/module-one-acceptance.json`
- `tests/unit/executive-common-center-service.test.ts`
- `tests/unit/executive-morning-briefing-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/executive-private-workspace-service.test.ts`

### Change Log

- 2026-06-01: Implemented normalized risk DTO, status suggestion service, permission/catalog/seed updates, UI label wiring, and regression coverage; moved story to review.
- 2026-06-01: Applied code review patches, reran targeted/full verification, and moved story to done.
