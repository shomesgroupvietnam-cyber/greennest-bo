# Epic 2: Workspace Điều Hành Và Dashboard Module 1

Lãnh đạo và người được ủy quyền có thể vào đúng workspace theo vai trò/scope, xem Dashboard Tổng Quan, Morning Briefing, Executive Common Center và Private Workspace với KPI, trạng thái đỏ/vàng/xanh, approval/risk/deadline/decision/meeting liên quan, dữ liệu nhạy cảm theo quyền và drill-down đến nguồn hoặc 403 khi không đủ quyền.

## Story 2.1: PermissionAwareShell Và Workspace Entry

**Requirements Covered:** FR-002, FR-020, FR-021, FR-023, NFR-001, NFR-002, NFR-003, NFR-007, UX-DR7, UX-DR8, UX-DR9, UX-DR19, UX-DR24.

As a người dùng sau đăng nhập,
I want được đưa vào workspace mặc định theo vai trò và scope,
So that tôi bắt đầu ở đúng bề mặt điều hành thay vì dashboard chung.

**Acceptance Criteria:**

AC1:
**Given** người dùng đã đăng nhập và có assignment Module 1
**When** truy cập entry route điều hành
**Then** hệ thống hiển thị PermissionAwareShell với sidebar permission-aware, topbar, workspace selector và scope selector.

AC2:
**Given** người dùng không có quyền vào Module 1
**When** truy cập URL Module 1 trực tiếp
**Then** hệ thống trả 403
**And** không fetch/render dữ liệu Module 1 trước khi chặn.

AC3:
**Given** người dùng có nhiều role/scope
**When** đổi workspace hoặc scope
**Then** dashboard reload bằng service DTO tương ứng với scope mới
**And** navigation chỉ hiển thị module/workspace có quyền.

AC4:
**Given** người dùng có quyền vào Trục 1
**When** sidebar hoặc entry point điều hành render
**Then** hệ thống phân biệt rõ `Tổng quan Trục 1` / Command Center với `Dashboard Tổng Quan` của Module 1 - Lãnh đạo
**And** màn `Tổng quan Trục 1` chỉ đóng vai trò entry cho 5 module MVP, không thay thế dashboard 1.1 của Module Lãnh đạo.

AC5:
**Given** người dùng là Chủ tịch hoặc leadership persona có cả quyền điều hành và quyền quản trị
**When** đăng nhập hoặc mở default workspace
**Then** hệ thống đưa người dùng vào workspace điều hành phù hợp theo role/scope
**And** `Quản trị Chủ tịch` / BO Settings chỉ là mục riêng, không phải default daily workspace.

**Files/Modules:** `src/app/command-center`, `src/app/executive/*`, `src/components/shared`, `src/modules/workspaces`, `src/lib/permissions`.

**Test Expectations:** Unit tests cho workspace resolution; component tests cho shell permission states; e2e smoke cho direct 403 nếu route sẵn có.

**Dependencies:** Story 1.2. Story 1.5 cung cấp seed data cho demo/nghiệm thu đầy đủ, nhưng không chặn phần PermissionAwareShell, navigation hierarchy và default workspace correction.

## Story 2.2: Executive Dashboard Service DTO Theo Scope

**Requirements Covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, NFR-001, NFR-002, NFR-007, NFR-011, UX-DR20, UX-DR35.

As a lãnh đạo,
I want dashboard lấy dữ liệu tổng hợp đã lọc quyền từ service,
So that tôi chỉ thấy KPI, risk, approval và deadline thuộc phạm vi của mình.

**Acceptance Criteria:**

AC1:
**Given** service nhận user context và scope hiện tại
**When** tải Dashboard Tổng Quan
**Then** DTO có tổng dự án/cơ hội, trạng thái đỏ/vàng/xanh, KPI điều hành, request chờ duyệt/quá hạn, risk summary, deadline hôm nay và quyết định mới.

AC2:
**Given** người dùng không có quyền xem tài chính nhạy cảm
**When** DTO được tạo
**Then** financial summary trả no-permission state hoặc bị loại bỏ từ service
**And** UI không nhận số liệu tài chính thật.

AC3:
**Given** dashboard có dữ liệu từ project, proposal, risk, decision và meeting
**When** repository ở mock mode hoặc Supabase mode
**Then** service contract trả cùng kiểu domain DTO.

**Files/Modules:** `src/modules/dashboard`, `src/modules/executive`, `src/modules/projects`, `src/modules/proposals`, `src/modules/meetings`, `src/modules/tasks`.

**Test Expectations:** Unit tests cho DTO filtering, financial permission, mock/Supabase repository parity bằng contract tests nếu có adapter.

**Dependencies:** Story 1.2, Story 1.5.

## Story 2.3: Dashboard UI Với KPI Strip, Priority Queue Và Risk Summary

**Requirements Covered:** FR-001, FR-003, FR-004, FR-005, FR-007, FR-008, FR-009, FR-010, FR-011, NFR-011, UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR10, UX-DR11, UX-DR12, UX-DR21, UX-DR22, UX-DR25, UX-DR26, UX-DR27, UX-DR28, UX-DR29, UX-DR30, UX-DR31, UX-DR32, UX-DR35.

As a lãnh đạo,
I want dashboard hiển thị KPI, việc khẩn, approval, risk và quyết định mới theo layout dễ quét,
So that tôi biết nhanh vấn đề quan trọng nhất hôm nay.

**Acceptance Criteria:**

AC1:
**Given** dashboard DTO có dữ liệu hợp lệ
**When** người dùng mở Dashboard Tổng Quan
**Then** UI hiển thị KPI Strip, Priority Queue, Risk Summary/Map, deadline hôm nay và quyết định mới
**And** không hiển thị task vi mô hoặc bản vẽ chi tiết mặc định.

AC2:
**Given** một KPI/risk/approval có nguồn dữ liệu
**When** người dùng chọn item
**Then** hệ thống mở drill-down panel hoặc link detail theo quyền.

AC3:
**Given** mobile viewport dưới 768px
**When** dashboard render
**Then** KPI/risk/approval chuyển sang stacked priority layout hoặc compact list
**And** text tiếng Việt không bị tràn/cắt xấu.

**Files/Modules:** `src/modules/dashboard/components`, `src/modules/executive/components`, `src/components/ui`, `src/components/shared`.

**Test Expectations:** Component tests cho loading/empty/no-permission states; visual/e2e smoke ở desktop và mobile; accessibility checks cho badge/focus.

**Dependencies:** Story 2.1, Story 2.2.

## Story 2.4: Morning Briefing Theo Scope

**Requirements Covered:** FR-013, FR-014, FR-015, FR-085, FR-087, FR-088, FR-090, NFR-001, NFR-009, NFR-010, UX-DR16, UX-DR17, UX-DR33, UX-DR34.

As a Chairman/CEO,
I want Morning Briefing tóm tắt đầu ngày từ dữ liệu trong scope,
So that tôi biết risk lớn, approval quá hạn, việc cần quyết và KPI hôm nay trong 1-2 phút.

**Acceptance Criteria:**

AC1:
**Given** user context có scope hợp lệ
**When** mở Morning Briefing
**Then** hệ thống hiển thị AI Summary draft hoặc summary placeholder, top risk, việc cần quyết hôm nay, KPI hôm nay, approval quá hạn và trạng thái dự án đỏ/vàng/xanh.

AC2:
**Given** người dùng không có quyền xem một project/risk/approval
**When** Morning Briefing được tạo
**Then** dữ liệu đó không xuất hiện trong briefing.

AC3:
**Given** AI summary chưa được người có quyền xác nhận
**When** hiển thị trên briefing
**Then** nội dung được đánh dấu draft/gợi ý.

**Files/Modules:** `src/modules/executive`, `src/modules/dashboard`, `src/modules/ai`, `src/modules/workspaces`.

**Test Expectations:** Unit tests cho scoped briefing DTO; component tests cho draft AI label và empty states.

**Dependencies:** Story 2.2, Story 2.3.

## Story 2.5: Executive Common Center

**Requirements Covered:** FR-016, FR-017, FR-018, FR-019, NFR-001, NFR-002, NFR-011, UX-DR10, UX-DR11, UX-DR12, UX-DR20, UX-DR22.

As a lãnh đạo có quyền,
I want xem Common Center với thông tin chung đã lọc theo permission,
So that các vấn đề nghiêm trọng và thông tin điều hành chung không bị bỏ sót.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền vào Common Center
**When** mở Common Center
**Then** hệ thống hiển thị thông báo mới, quyết định mới, KPI chung, lịch họp, risk tổng, deadline hệ thống, việc vượt ngưỡng và việc quá hạn trong scope.

AC2:
**Given** có risk đỏ/nghiêm trọng hoặc approval quá hạn nghiêm trọng trong scope
**When** Common Center render
**Then** item đó xuất hiện trong priority area với lý do, owner, deadline và action/drill-down theo quyền.

AC3:
**Given** người dùng thiếu quyền xem một thông tin chung
**When** Common Center tải dữ liệu
**Then** service loại bỏ dữ liệu đó trước khi trả UI.

**Files/Modules:** `src/modules/executive`, `src/modules/dashboard`, `src/modules/meetings`, `src/modules/proposals`, `src/modules/tasks`.

**Test Expectations:** Unit tests cho common center filtering; component tests cho priority item, no-permission và drill-down.

**Dependencies:** Story 2.1, Story 2.2.

## Story 2.6: Private Workspace Theo Vai Trò

**Requirements Covered:** FR-020, FR-021, FR-022, FR-023, FR-024, FR-101, NFR-001, NFR-002, NFR-007, UX-DR9, UX-DR18, UX-DR19, UX-DR24, UX-DR33.

As a người dùng Module 1,
I want Private Workspace phản ánh assignment/scope của riêng tôi,
So that Chủ tịch, CEO, Giám đốc dự án, Trưởng bộ phận, Thư ký/Trợ lý và Người xem không nhìn cùng một dashboard.

**Acceptance Criteria:**

AC1:
**Given** các user demo có assignment khác nhau
**When** từng user mở Private Workspace
**Then** workspace hiển thị dự án/cơ hội được giao, approval cần xử lý, risk/blocker, deadline, quyết định gần đây, cuộc họp và KPI trong phạm vi tương ứng.

AC2:
**Given** Thư ký/Trợ lý chỉ được ủy quyền một phần
**When** mở workspace
**Then** họ chỉ thấy lịch lãnh đạo, hồ sơ trình, tài liệu họp, task hỗ trợ, reminder và approval pending trong scope được ủy quyền.

AC3:
**Given** người dùng là Người xem
**When** mở workspace
**Then** action mutation bị ẩn hoặc disabled theo UX permission pattern
**And** direct mutation vẫn bị chặn ở server/service.

**Files/Modules:** `src/modules/workspaces`, `src/modules/executive`, `src/modules/dashboard`, `src/modules/meetings`, `src/modules/proposals`.

**Test Expectations:** Unit tests cho workspace composition per role; component/e2e smoke cho các demo users chính.

**Dependencies:** Story 1.4, Story 1.5, Story 2.2, Story 2.3.

## Story 2.7: Drill-Down, Unauthorized Và Responsive QA Cho Workspace

**Requirements Covered:** FR-011, FR-012, NFR-003, NFR-004, NFR-011, UX-DR14, UX-DR20, UX-DR22, UX-DR24, UX-DR26, UX-DR27, UX-DR28, UX-DR29, UX-DR30, UX-DR31, UX-DR32.

As a lãnh đạo,
I want drill-down từ KPI/risk/approval đến nguồn dữ liệu hoặc bị chặn rõ ràng khi thiếu quyền,
So that tôi có thể kiểm chứng số liệu mà không bị lộ dữ liệu ngoài scope.

**Acceptance Criteria:**

AC1:
**Given** dashboard item có linked records
**When** người dùng mở drill-down
**Then** panel hiển thị title, type, scope, owner, deadline, status, reason, linked records, actions theo quyền và timeline/audit nếu có.

AC2:
**Given** người dùng không có quyền vào record nguồn
**When** truy cập drill-down hoặc URL trực tiếp
**Then** hệ thống trả unauthorized/403 rõ ràng
**And** không trả payload chứa dữ liệu nhạy cảm.

AC3:
**Given** viewport mobile/tablet/desktop
**When** kiểm tra các workspace chính
**Then** side panel chuyển thành sheet trên mobile, table chuyển thành compact list khi cần, focus order và accessible names đạt yêu cầu.

**Files/Modules:** `src/modules/executive/components`, `src/components/shared`, `src/lib/permissions`, `tests/e2e`.

**Test Expectations:** E2E smoke cho drill-down/403; responsive checks ở 360/390/768/1280; accessibility checks cho focus/dialog/sheet.

**Dependencies:** Story 2.3, Story 2.5, Story 2.6.
