# Story 2.13: Căn Chỉnh Private Workspace Theo Yêu Cầu 1.4

Status: done

Ghi chú tạo story: Follow-up sau review yêu cầu 1.4 ngày 2026-06-06. Story 2.6 đã hoàn thành lõi role/scope/permission cho Executive Private Workspace và Story 2.12 đã sửa verification. Story này bổ sung các panel nghiệp vụ còn thiếu để Private Workspace đạt đủ mẫu 1.4 cho Chủ tịch, CEO, Giám đốc dự án và Trưởng bộ phận, đồng thời giữ nguyên guardrail phân quyền, scope và delegation hiện có.

## Story

As a lãnh đạo Module 1,
I want Private Workspace hiển thị đúng các panel chuyên biệt theo vai trò, assignment và scope của tôi,
so that Chủ tịch, CEO, Giám đốc dự án, Trưởng bộ phận và Thư ký/Trợ lý không chỉ nhìn khác nhau mà còn có đúng thông tin vận hành cần thiết cho vai trò của mình.

## Bối Cảnh

Review yêu cầu 1.4 xác nhận Private Workspace hiện đã có nền tảng tốt:

- `ExecutivePrivateWorkspaceVariant` có các biến thể `chairman`, `ceo`, `project_director`, `department_head`, `secretary_assistant`, `viewer`.
- Service đã lọc theo `selectedScopeId`, assignment, permission và delegation.
- UI đã render section khác nhau theo variant.
- Test đã chứng minh CEO và Giám đốc dự án khác assignment nhận dữ liệu khác nhau.

Khoảng trống còn lại:

- Chairman thiếu cashflow/financial summary, risk map và permission overview cấp cao.
- CEO thiếu resource/progress panel rõ ràng.
- Project Director thiếu approval section trong UI và cost panel theo dự án.
- Department Head thiếu workflow/checklist và professional approval section rõ ràng.
- Cần test hai người cùng role nhưng khác assignment/scope không nhận cùng DTO.

## Tiêu Chí Chấp Nhận

1. **DTO Private Workspace có các panel bổ sung, permission-safe và backward-compatible**
   - Given `getExecutivePrivateWorkspaceData` trả về DTO hiện tại
   - When story này hoàn thành
   - Then DTO vẫn giữ các field hiện có: `kpis`, `priorityItems`, `assignedProjects`, `approvalItems`, `riskItems`, `deadlineItems`, `decisionItems`, `meetingItems`, `assistantSupport`, `aiSummary`
   - And bổ sung dữ liệu typed cho các panel còn thiếu ở mức executive summary:
     - chairman cashflow/financial summary
     - chairman risk map
     - chairman permission overview
     - CEO resource/progress panel
     - Project Director approval panel và cost panel
     - Department Head workflow/checklist và professional approval panel
   - And mọi field tài chính/cost/amount/cashflow vẫn bị loại hoặc redacted khi user không có `finance.view` hoặc scoped finance grant tương đương.

2. **Chairman workspace đủ: KPI tổng, dòng tiền, risk map, dự án đỏ, phân quyền cấp cao**
   - Given user có variant `chairman` và scope hợp lệ
   - When mở `executive-private-workspace`
   - Then UI hiển thị KPI tổng, danh mục/dự án đỏ, risk map hoặc ma trận rủi ro có nhãn chữ, approval quá hạn/nghiêm trọng và quyết định chiến lược
   - And nếu có quyền tài chính, hiển thị dòng tiền/chi phí tổng quan từ DTO đã lọc quyền
   - And nếu không có quyền tài chính, hiển thị trạng thái không có quyền và không serialize/render số tiền thật
   - And hiển thị permission overview cấp cao dạng read-only/status/link an toàn, không biến Chủ tịch thành Super Admin và không mở mutation BO/admin trái Story 2.10.

3. **CEO workspace đủ: tiến độ vận hành, resource, approval queue, risk, escalation**
   - Given user có variant `ceo` và scope hợp lệ
   - When mở Private Workspace
   - Then UI hiển thị panel tiến độ vận hành theo danh mục/project progress trong scope
   - And hiển thị resource/workload summary ở mức tổng quan nếu nguồn dữ liệu có đủ owner/assignee/task/project metadata
   - And nếu nguồn resource chưa đủ, hiển thị empty state có reason thay vì fabricate số liệu
   - And approval queue, risk, escalation/deadline liên dự án và meeting follow-up hiện có không bị regression.

4. **Project Director workspace đủ: dự án được giao, tiến độ, approval, risk, cost, task priority**
   - Given user có variant `project_director` và chỉ được assign một hoặc nhiều dự án cụ thể
   - When mở Private Workspace
   - Then UI hiển thị dự án được giao, project progress/health, task priority, risk/blocker, deadline và meeting/decision liên quan
   - And hiển thị `approvalItems` trong section riêng cho dự án, không chỉ nằm ẩn trong priority queue
   - And hiển thị cost/financial summary theo dự án nếu có quyền tài chính
   - And nếu không có quyền tài chính, cost panel chỉ hiển thị no-permission state, không leak amount/cashflow/budget.

5. **Department Head workspace đủ: hồ sơ, task, workflow, checklist, approval chuyên môn**
   - Given user có variant `department_head` và scope theo bộ phận/module/workstream
   - When mở Private Workspace
   - Then UI hiển thị hồ sơ chuyên môn, việc ưu tiên, risk chuyên môn, deadline chuyên môn và meeting phòng ban
   - And có panel workflow/checklist chuyên môn từ nguồn có scope phù hợp, ví dụ legal steps, task workflow, document/proposal checklist hoặc provider tương đương hiện có
   - And có section approval chuyên môn rõ ràng, không chỉ đổi nhãn generic approval nếu dữ liệu thiếu ngữ cảnh chuyên môn
   - And nếu chưa có checklist/workflow trong scope, hiển thị empty state có reason, không hardcode checklist giả.

6. **Không giả định hai lãnh đạo nhìn giống nhau nếu assignment/scope khác nhau**
   - Given hai user cùng role lãnh đạo nhưng khác `ScopeAssignment`
   - When gọi `getExecutivePrivateWorkspaceData` với `selectedScopeId` tương ứng
   - Then DTO khác nhau ở tối thiểu một nhóm dữ liệu quan trọng như assigned projects, approval, risk, deadline, progress/resource/cost/workflow panel hoặc source counts
   - And invalid selected scope vẫn trả `emptyState.kind = "invalid_scope"` hoặc DTO rỗng an toàn, không fallback global.

7. **UI giữ pattern Executive Private Workspace hiện tại**
   - Given viewport desktop và mobile
   - When render từng variant chính
   - Then layout vẫn dense, scan-friendly, không tạo route mới, không tạo dashboard song song, không lồng card trong card
   - And text tiếng Việt wrap đúng, badge rủi ro/health có nhãn chữ, section empty/no-permission có aria label/heading rõ
   - And không render operations micro-task hoặc dữ liệu kỹ thuật sâu ngoài scope mặc định của Private Workspace.

8. **Regression tests bao phủ gap 1.4**
   - Given các test hiện có của Story 2.6 và 2.12
   - When story này hoàn thành
   - Then test mới/updated cover các panel thiếu cho Chairman, CEO, Project Director, Department Head
   - And cover finance redaction, same-role-different-scope, invalid scope, section ordering và component render
   - And focused targeted suite, typecheck, lint và full unit suite được chạy hoặc ghi rõ blocker nếu suite ngoài scope đang fail.

## Tasks / Subtasks

- [x] Xác nhận baseline trước khi sửa (AC: 1, 6, 8)
  - [x] Đọc lại Story 2.6 và 2.12, đặc biệt các Review Findings đã sửa.
  - [x] Đọc current files trước khi edit: `src/modules/workspaces/types.ts`, `src/modules/workspaces/services/executive-private-workspace-service.ts`, `src/modules/workspaces/components/executive-private-workspace.tsx`, `src/modules/workspaces/private-workspace-variants.ts`.
  - [x] Chạy hoặc tối thiểu reproduce focused tests hiện tại cho Private Workspace trước khi thay đổi:

```powershell
npm run test -- tests/unit/executive-private-workspace-service.test.ts tests/unit/command-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/workspaces.test.ts
```

- [x] Bổ sung typed DTO cho panel 1.4 (AC: 1)
  - [x] Mở rộng `ExecutivePrivateWorkspaceData` bằng các field typed, optional/backward-compatible.
  - [x] Reuse type hiện có từ dashboard nếu phù hợp: `ExecutiveFinancialSummary`, `ExecutiveRiskMap`, project portfolio/progress/source item metadata.
  - [x] Thêm type riêng trong `src/modules/workspaces/types.ts` cho permission overview, resource/progress, project cost, workflow/checklist và professional approvals nếu dashboard type không đủ.
  - [x] Không expose raw amount/cashflow/budget nếu `canViewFinance` false.

- [x] Compose dữ liệu bổ sung trong service, không đọc raw data từ UI (AC: 1, 2, 3, 4, 5, 6)
  - [x] Reuse `getExecutiveDashboardData`/dashboard DTO cho financial summary, risk map, project portfolio, approval, risk, deadline, decision và meeting.
  - [x] Chairman: map `financialSummary`, `riskSummary.riskMap`, red/yellow/green portfolio và permission overview read-only.
  - [x] CEO: derive progress/resource summary từ project portfolio/source items/task-owner metadata hiện có; nếu nguồn thiếu, trả empty state có reason.
  - [x] Project Director: expose approval section riêng từ `approvalItems` và cost summary theo project/scope.
  - [x] Department Head: derive workflow/checklist/professional approvals từ legal steps/tasks/proposals hoặc provider hiện có đã scope-filter; nếu thiếu, trả empty state.
  - [x] Giữ `selectedScopeInvalid` và assignment-filtering hiện tại; không fallback global.

- [x] Cập nhật variant config và section ordering (AC: 2, 3, 4, 5, 7)
  - [x] `chairman`: KPI tổng -> cashflow/financial summary -> risk map -> dự án đỏ -> approval quá hạn/nghiêm trọng -> permission overview -> strategic decisions.
  - [x] `ceo`: operations KPI -> progress/resource -> approval queue -> escalation/risk -> cross-project deadlines -> meetings/follow-ups.
  - [x] `project_director`: assigned projects -> progress/health -> approval dự án -> cost -> risk/blocker -> task priority/deadlines -> meetings/decisions.
  - [x] `department_head`: department/workstream queue -> hồ sơ chuyên môn -> workflow/checklist -> approval chuyên môn -> risk/deadline chuyên môn -> meetings.
  - [x] `secretary_assistant` giữ nguyên guardrail delegation và không mở approve-on-behalf.
  - [x] `viewer` vẫn read-only và không nhận mutation actions.

- [x] Cập nhật UI component Private Workspace (AC: 2, 3, 4, 5, 7)
  - [x] Render các panel mới trong `executive-private-workspace.tsx` theo variant.
  - [x] Reuse pattern item/source/drill-down hiện có, không tạo unsafe href từ raw id.
  - [x] Risk map phải có nhãn chữ và không chỉ dựa vào màu.
  - [x] Finance/cost panel có allowed/no-permission/empty states rõ.
  - [x] Empty state cho resource/workflow/checklist phải nói rõ thiếu nguồn trong scope, không tạo dữ liệu giả.

- [x] Cập nhật tests (AC: 1, 2, 3, 4, 5, 6, 8)
  - [x] `tests/unit/executive-private-workspace-service.test.ts`: assert DTO có chairman financial summary/risk map/permission overview, CEO progress/resource, project director approval+cost, department workflow/checklist/professional approval.
  - [x] Thêm test same role different scope, ví dụ hai CEO hoặc hai Department Head với assignment khác nhau nhận DTO khác nhau.
  - [x] Assert invalid scope không fallback global.
  - [x] Assert finance/cost redaction bằng `JSON.stringify(dto)` không chứa `amount`, `cashFlowLabel`, `budget` khi không có quyền.
  - [x] `tests/unit/command-center-dashboard.test.tsx`: assert các section mới render đúng trong view `executive-private-workspace`.
  - [x] Cập nhật `tests/unit/command-center-service.test.ts` nếu DTO aggregate/client serialization thay đổi.
  - [x] Cập nhật `tests/e2e/mvp-smoke.spec.ts` nếu visible UI/route flow cần smoke desktop/mobile.

- [x] Validation (AC: 8)
  - [x] Chạy focused Private Workspace suite.
  - [x] Chạy `npm run typecheck`.
  - [x] Chạy `npm run lint`.
  - [x] Chạy `npm run test`.
  - [x] Chạy `npm run test:e2e` nếu thay đổi visible route/navigation/responsive flow.

### Review Findings

- [x] [Review][Patch] DTO 1.4 đang required thay vì optional/backward-compatible [src/modules/workspaces/types.ts:209]
- [x] [Review][Patch] Permission overview đánh dấu quyền view/admin yếu hơn như quyền mutation hoặc BO/Admin [src/modules/workspaces/services/executive-private-workspace-service.ts:905]
- [x] [Review][Patch] CEO resource/progress panel có thể trả metrics available khi thiếu resource metadata đủ tin cậy [src/modules/workspaces/services/executive-private-workspace-service.ts:975]
- [x] [Review][Patch] Project Director cost panel có thể render tổng tài chính aggregate khi không có cost row theo project scope [src/modules/workspaces/services/executive-private-workspace-service.ts:1052]
- [x] [Review][Patch] Department Head workflow/checklist backfill từ deadline hoặc approval generic thay vì empty state [src/modules/workspaces/services/executive-private-workspace-service.ts:1154]
- [x] [Review][Patch] Department Head professional approvals dùng lại generic approvals và bị duplicate trong UI [src/modules/workspaces/services/executive-private-workspace-service.ts:1175]
- [x] [Review][Patch] Ordering theo variant chưa được implement đúng và chưa có test cover [src/modules/workspaces/components/executive-private-workspace.tsx:1074]

## Dev Notes

### Current Code State

- `src/modules/workspaces/types.ts` hiện có `ExecutivePrivateWorkspaceData` với các field chung: `kpis`, `priorityItems`, `assignedProjects`, `approvalItems`, `riskItems`, `deadlineItems`, `decisionItems`, `meetingItems`, `assistantSupport`, `aiSummary`, `sourceCounts`, `emptyState`. Chưa có field riêng cho `financialSummary`, `riskMap`, `permissionOverview`, `resourceProgress`, `projectCost`, `workflowChecklist`.
- `src/modules/workspaces/services/executive-private-workspace-service.ts` hiện compose dữ liệu chính từ `dashboard.projectPortfolio`, `dashboard.approvalSummary`, `dashboard.riskSummary`, `dashboard.todayDeadlines`, `dashboard.recentDecisions`, `dashboard.meetingSnapshot`.
- `src/modules/workspaces/components/executive-private-workspace.tsx` hiện build section khác nhau theo variant. Project Director hiện thiếu section approval riêng; Chairman hiện thiếu cashflow/risk map/permission overview.
- `src/modules/workspaces/private-workspace-variants.ts` có priority group labels, nhưng label "Tài chính" của Chairman chưa được support bằng section/DTO thật.
- `src/modules/dashboard/types.ts` đã có `ExecutiveFinancialSummary` và `ExecutiveRiskMap` trên `ExecutiveDashboardData`. Reuse trước khi tạo shape mới.
- `src/modules/dashboard/components/executive-risk-summary.tsx` đã có pattern render `riskSummary.riskMap`; có thể học layout/pattern nhưng không import component nếu props quá gắn với Dashboard Tổng Quan.

### Architecture Guardrails

- Data flow phải giữ: route guard -> `getCommandCenterData` -> `getExecutivePrivateWorkspaceData` -> client component render.
- Service layer là nơi enforce permission/scope/redaction; UI chỉ render DTO đã an toàn.
- Không gọi repository/Supabase trực tiếp từ React component.
- Không tạo route mới ngoài `/command-center?view=executive-private-workspace`.
- Không thêm global store hoặc dependency mới.
- Không tạo approval/risk/workflow engine mới trong story này; chỉ render executive lens/panel từ nguồn hiện có.
- Không biến Chairman thành Super Admin. Story 2.10 đã chốt Chủ tịch không thấy BO Settings/Admin/User routes nếu không có role/quyền quản trị tương ứng.
- Nếu nguồn dữ liệu chưa đủ cho resource/workflow/checklist/cost, trả empty state có reason, không hardcode số liệu.

### UX Guardrails

- Private Workspace là công cụ vận hành, không phải landing page.
- Dùng layout dày nhưng dễ quét, section rõ, nhãn tiếng Việt rõ nghĩa.
- Không lồng card trong card; item lặp có thể dùng card nhỏ radius <= 8px.
- Badge đỏ/vàng/xanh, critical/high, no-permission phải có text label.
- Mobile dùng stacked compact list; không table rộng, không overflow chữ tiếng Việt.
- No-permission phải rõ nhưng không lộ dữ liệu bị cấm.

### Previous Story Intelligence

- Story 2.6 đã tạo service/component/variant nền và nhiều guardrail delegation. Không viết lại từ đầu.
- Story 2.12 đã sửa verification và nhấn mạnh các gap lớn như chairman `financialSummary`, `riskMap`, high-level permission/admin surface cần story alignment riêng. Đây chính là story đó.
- Story 2.11 đang in-progress và đã làm Dashboard Tổng Quan finance/risk read-only boundary; không lấy story 2.11 làm bằng chứng Private Workspace đã đủ 1.4.
- Story 5.2 đã có risk map center; Private Workspace chỉ cần executive summary/risk map lens, không duplicate Risk Center.
- Story 3.x sở hữu approval actions; Private Workspace chỉ hiển thị queue/panel và safe links/action states theo quyền.

### Expected File Targets

Expected UPDATE:

- `src/modules/workspaces/types.ts`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `src/modules/workspaces/components/executive-private-workspace.tsx`
- `src/modules/workspaces/private-workspace-variants.ts`
- `tests/unit/executive-private-workspace-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/unit/command-center-service.test.ts`

Possible UPDATE:

- `src/modules/command-center/services/command-center-service.ts` nếu cần sanitize client DTO hoặc pass dashboard data vào private service theo cách mới.
- `src/modules/command-center/types.ts` nếu aggregate DTO type thay đổi.
- `tests/e2e/mvp-smoke.spec.ts` nếu UI flow/section labels cần smoke.
- `docs/context/testing.md` hoặc architecture docs chỉ khi thêm pattern mới thật sự tái sử dụng.

Avoid:

- Không tạo page riêng `/private-workspace`.
- Không sửa role navigation policy nếu chỉ bổ sung panel trong view hiện có.
- Không cập nhật approval/risk mutation flow trừ khi test chứng minh regression trực tiếp.
- Không sửa unrelated localized test drift ngoài phạm vi story này.

### Testing Guidance

Focused command:

```powershell
npm run test -- tests/unit/executive-private-workspace-service.test.ts tests/unit/command-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/workspaces.test.ts
```

Required final commands:

```powershell
npm run typecheck
npm run lint
npm run test
```

Conditional:

```powershell
npm run test:e2e
```

Run e2e if new visible sections affect route rendering, navigation smoke, responsive layout or mobile behavior.

## References

- `_bmad-output/implementation-artifacts/2-6-private-workspace-theo-vai-tro.md`
- `_bmad-output/implementation-artifacts/2-12-private-workspace-verification-fixes.md`
- `_bmad-output/planning-artifacts/module-1-gap-closure-dashboard-workspace-meeting.md`
- `_bmad-output/planning-artifacts/epics/epic-2-workspace-iu-hnh-v-dashboard-module-1.md`
- `_bmad-output/planning-artifacts/ux-design-specification/core-user-experience.md`
- `_bmad-output/planning-artifacts/ux-design-specification/component-strategy.md`
- `_bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md`
- `_bmad-output/planning-artifacts/architecture/project-structure-boundaries.md`
- `docs/context/permissions-audit.md`
- `docs/context/testing.md`
- `src/modules/workspaces/types.ts`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `src/modules/workspaces/components/executive-private-workspace.tsx`
- `src/modules/workspaces/private-workspace-variants.ts`
- `src/modules/dashboard/types.ts`
- `src/modules/dashboard/services/executive-dashboard-service.ts`
- `tests/unit/executive-private-workspace-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Baseline focused suite before implementation:
  `npm run test -- tests/unit/executive-private-workspace-service.test.ts tests/unit/command-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/workspaces.test.ts`
  - Passed: 4 files / 59 tests.
- Red tests added:
  `npm run test -- tests/unit/executive-private-workspace-service.test.ts tests/unit/command-center-dashboard.test.tsx`
  - Failed as expected on missing 1.4 DTO fields/panels and missing UI regions.
- Focused validation after implementation:
  `npm run test -- tests/unit/executive-private-workspace-service.test.ts tests/unit/command-center-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/workspaces.test.ts`
  - Passed: 4 files / 62 tests.
- Type validation:
  `npm run typecheck`
  - Passed.
- Lint validation:
  `npm run lint`
  - Passed.
- Full unit validation:
  `npm run test`
  - Passed: 100 files / 723 tests.
- Conditional e2e:
  `npm run test:e2e`
  - Timed out after 184s. Artifacts show existing Playwright selector drift against Vietnamese UI text, for example tests expecting `Kh?ng Gian L?m Vi?c C? Nh?n`, `Tong quan Truc 1`, and `Xem chi tiet` while pages render Vietnamese labels with diacritics. No lingering e2e child process was left; only the pre-existing dev server remained.
- Targeted Private Workspace e2e:
  `npx playwright test tests/e2e/mvp-smoke.spec.ts -g "leadership private workspace"`
  - Passed: 2 tests. Temporary Next dev server on port 3100 was stopped after the run.
- Code review patch validation:
  `npm run typecheck`
  - Passed.
- Code review patch validation:
  `npm run lint`
  - Passed.
- Code review patch focused validation:
  `npm run test -- tests/unit/executive-private-workspace-service.test.ts tests/unit/command-center-dashboard.test.tsx tests/unit/command-center-service.test.ts tests/unit/workspaces.test.ts`
  - Passed: 4 files / 66 tests.
- Code review patch full unit validation:
  `npm run test`
  - Passed: 100 files / 727 tests.

### Completion Notes List

- Added optional/backward-compatible typed 1.4 DTO fields to `ExecutivePrivateWorkspaceData`: `financialSummary`, `riskMap`, `permissionOverview`, `resourceProgress`, `projectCost`, `workflowChecklist`, and `professionalApprovals`.
- Composed the new panels in `getExecutivePrivateWorkspaceData` from existing executive dashboard DTO data, preserving scope, permission, delegation, invalid-scope, and finance redaction guardrails.
- Added Chairman cashflow/financial summary, risk map, and read-only permission overview. Chairman `bo-admin` overview remains disabled unless the user actually has admin permissions.
- Added CEO resource/progress summary derived from portfolio progress, project health, owners, and deadline pressure.
- Added Project Director cost panel and a dedicated `Phê duyệt dự án` section.
- Added Department Head workflow/checklist and professional approval sections with deduped scoped source items and empty-state reasons.
- Added same-role different-scope service regression coverage so two project directors with different `ScopeAssignment` values receive different scoped project DTOs.
- Added component coverage for the new role-specific regions in `executive-private-workspace`.
- Added targeted e2e assertions for the CEO `Tiến độ và resource vận hành` panel in desktop and mobile Private Workspace smoke tests.
- Applied code review patches: tightened permission overview to `risk.override`/`settings.manage`, made resource/progress and workflow/professional panels return empty instead of fabricated generic data, scoped Project Director cost to assigned project finance rows, removed Department Head duplicate items, and added variant ordering/legacy DTO tests.

### File List

- `src/modules/workspaces/types.ts`
- `src/modules/workspaces/services/executive-private-workspace-service.ts`
- `src/modules/workspaces/components/executive-private-workspace.tsx`
- `tests/unit/executive-private-workspace-service.test.ts`
- `tests/unit/command-center-dashboard.test.tsx`
- `tests/e2e/mvp-smoke.spec.ts`

## Change Log

| Date       | Version | Description                                                                                                                                 | Author |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2026-06-06 | 1.0     | Created follow-up story to align Executive Private Workspace with requirement 1.4 role-specific panels and same-role different-scope tests. | Codex  |
| 2026-06-06 | 1.1     | Implemented Private Workspace 1.4 role-specific DTO panels, UI sections, and regression tests; moved story to review.                       | Codex  |
| 2026-06-06 | 1.2     | Applied all code-review patches, added guard tests, and moved story to done.                                                                | Codex  |
