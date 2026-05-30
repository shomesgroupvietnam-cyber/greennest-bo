# Epic 5: Risk & Alert Center Cho Điều Hành

Lãnh đạo có thể xem risk/blocker theo nhóm, mức độ, màu đỏ/vàng/xanh, lý do, deadline và owner; tạo/cập nhật/đóng risk theo quyền; nhận cảnh báo risk quá hạn/escalation; hệ thống chỉ đưa gợi ý/draft cho risk do AI hoặc rule phát hiện cho tới khi người có quyền xác nhận.

## Story 5.1: Risk Levels, Categories Và Status Suggestion

**Requirements Covered:** FR-052, FR-053, FR-054, FR-055, FR-056, FR-058, FR-059, FR-060, NFR-008.

As a lãnh đạo hoặc quản trị điều hành,
I want risk có level, category và trạng thái đỏ/vàng/xanh được tính từ dữ liệu,
So that dashboard và Risk Center phản ánh mức độ nghiêm trọng nhất quán.

**Acceptance Criteria:**

AC1:
**Given** risk data có mức Thấp, Trung bình, Cao, Nghiêm trọng
**When** service tạo risk DTO
**Then** level được chuẩn hóa và hiển thị bằng label tiếng Việt, không chỉ bằng màu.

AC2:
**Given** risk category cấu hình trong BO Settings
**When** Risk Center tải dữ liệu
**Then** hệ thống dùng category cấu hình được, có fallback seed category mặc định.

AC3:
**Given** project có blocker nghiêm trọng, approval quá hạn, hồ sơ thiếu hoặc risk cao
**When** service tính trạng thái đỏ/vàng/xanh
**Then** trạng thái được gợi ý cùng reason và source data
**And** chưa override nếu chưa có người có quyền xác nhận.

**Files/Modules:** `src/modules/executive`, `src/modules/dashboard`, `src/modules/settings`, `src/lib/permissions`.

**Test Expectations:** Unit tests cho risk level/category, red/yellow/green suggestion rules và fallback config.

**Dependencies:** Story 1.3, Story 2.2.

## Story 5.2: Risk Map Và Drill-Down Matrix

**Requirements Covered:** FR-061, FR-062, FR-067, NFR-001, UX-DR4, UX-DR12, UX-DR14, UX-DR20, UX-DR30.

As a lãnh đạo,
I want xem risk map/heatmap và drill-down tới ma trận khả năng x ảnh hưởng,
So that tôi ưu tiên xử lý risk đúng mức.

**Acceptance Criteria:**

AC1:
**Given** dashboard hoặc Risk Center có risk trong scope
**When** render Risk Map
**Then** UI hiển thị risk theo category, count, severity, affected projects, deadline và owner.

AC2:
**Given** người dùng mở một risk
**When** drill-down
**Then** panel hiển thị likelihood x impact, reason, linked project/module, owner, deadline, next action và audit nếu có.

AC3:
**Given** người dùng không phân biệt màu tốt
**When** xem risk map
**Then** mỗi trạng thái có text/label hoặc tooltip, không phụ thuộc màu.

**Files/Modules:** `src/modules/executive/components`, `src/modules/dashboard/components`, `src/components/shared`.

**Test Expectations:** Component tests cho heatmap labels, drill-down fields, loading/empty states; accessibility check cho color-independent status.

**Dependencies:** Story 5.1.

## Story 5.3: Tạo Và Cập Nhật Risk/Blocker Theo Quyền

**Requirements Covered:** FR-063, FR-069, NFR-005, NFR-006, UX-DR23.

As a người có trách nhiệm trong scope,
I want tạo và cập nhật risk/blocker với dữ liệu bắt buộc,
So that vấn đề điều hành được ghi nhận đầy đủ và có người chịu trách nhiệm.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền tạo risk/blocker trong scope
**When** submit form tạo blocker
**Then** hệ thống yêu cầu title, category, level, reason/description, project/module, owner, deadline, next action, status và audit log.

AC2:
**Given** Thư ký/Trợ lý được ủy quyền
**When** tạo risk trong phạm vi được ủy quyền
**Then** hệ thống cho phép tạo và ghi audit onBehalfOf nếu áp dụng.

AC3:
**Given** người dùng thiếu quyền hoặc ngoài scope
**When** gọi action tạo/cập nhật risk
**Then** service chặn mutation và không tạo record.

**Files/Modules:** `src/modules/executive/actions.ts`, `src/modules/executive/validation.ts`, `src/modules/executive/services`, `src/lib/audit`.

**Test Expectations:** Unit tests cho validation required fields, permission/delegation, audit log.

**Dependencies:** Story 5.1, Story 1.4.

## Story 5.4: Override Và Đóng Risk/Blocker Có Audit

**Requirements Covered:** FR-057, FR-065, FR-066, NFR-005, NFR-006, UX-DR21.

As a lãnh đạo phụ trách,
I want xác nhận/override trạng thái và đóng risk/blocker với lý do,
So that hệ thống không tự quyết định trạng thái quan trọng mà không có trách nhiệm người dùng.

**Acceptance Criteria:**

AC1:
**Given** hệ thống gợi ý trạng thái đỏ/vàng/xanh
**When** người có quyền override trạng thái
**Then** hệ thống bắt buộc nhập lý do và ghi audit log.

AC2:
**Given** risk/blocker mức Cao hoặc Nghiêm trọng
**When** người dùng đóng risk
**Then** service kiểm tra quyền cao hơn hoặc lãnh đạo phụ trách theo policy
**And** chặn nếu không đủ quyền.

AC3:
**Given** risk được đóng hợp lệ
**When** dashboard reload
**Then** risk không còn xuất hiện như blocker mở nhưng vẫn còn trong history/audit.

**Files/Modules:** `src/modules/executive/services`, `src/modules/dashboard`, `src/lib/audit`, `src/lib/permissions`.

**Test Expectations:** Unit tests cho override reason, close permission, audit và dashboard recompute.

**Dependencies:** Story 5.3.

## Story 5.5: Risk Alert, Overdue Escalation Và Draft Suggestions

**Requirements Covered:** FR-064, FR-067, FR-068, FR-085, FR-087, FR-088, FR-089, FR-090, NFR-009, NFR-010, UX-DR16, UX-DR34.

As a lãnh đạo,
I want risk quá hạn và gợi ý risk từ hệ thống/AI chỉ xuất hiện như cảnh báo draft cho tới khi được xác nhận,
So that cảnh báo hữu ích nhưng không tự tạo blocker chính thức.

**Acceptance Criteria:**

AC1:
**Given** risk vượt deadline
**When** Risk Center hoặc dashboard tải dữ liệu
**Then** risk được đánh dấu overdue và có escalation target theo policy nếu áp dụng.

AC2:
**Given** hệ thống hoặc AI phát hiện risk tiềm năng
**When** tạo suggestion
**Then** suggestion ở trạng thái draft/advisory
**And** không tạo blocker chính thức nếu chưa có người có quyền xác nhận.

AC3:
**Given** người có quyền xác nhận draft risk
**When** accept suggestion
**Then** hệ thống tạo risk/blocker chính thức qua service action, kiểm tra permission và ghi audit.

**Files/Modules:** `src/modules/executive`, `src/modules/ai`, `src/modules/dashboard`, `src/lib/audit`.

**Test Expectations:** Unit tests cho overdue calculation, draft suggestion lifecycle, accept permission và audit.

**Dependencies:** Story 5.3, Story 5.4.
