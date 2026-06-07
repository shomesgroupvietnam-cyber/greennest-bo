# Epic 7: Lịch Sử, Lưu Trữ, Xuất Dữ Liệu Và Hiển Thị Nhật Ký

Người có quyền có thể tra cứu lịch sử điều hành, approval, decision, assignment, meeting, audit log, version hồ sơ, timeline và export theo permission; dữ liệu nhạy cảm hoặc export quan trọng luôn bị kiểm soát và ghi audit.

## Story 7.1: Dịch Vụ Trung Tâm Lịch Sử Và Lưu Trữ

**Requirements Covered:** FR-080, FR-081, NFR-001, NFR-004, NFR-006.

As a lãnh đạo hoặc người kiểm soát được quyền,
I want xem lịch sử điều hành từ nhiều loại record,
So that tôi truy vết được decision, approval, assignment, meeting và audit.

**Acceptance Criteria:**

AC1:
**Given** user context và scope hợp lệ
**When** History & Archive service tải timeline
**Then** DTO gồm decision, approval, assignment, meeting, audit log, version hồ sơ và search history nếu có trong scope.

AC2:
**Given** user không có quyền xem audit hoặc record cụ thể
**When** service tạo timeline
**Then** event ngoài quyền bị loại bỏ trước khi trả UI.

AC3:
**Given** dữ liệu đến từ nhiều module
**When** timeline được sắp xếp
**Then** event có type, actor, timestamp, scope, summary và link nguồn nhất quán.

**Files/Modules:** `src/modules/executive`, `src/modules/reports`, `src/lib/audit`, `src/modules/proposals`, `src/modules/meetings`.

**Test Expectations:** Unit tests cho event aggregation, scope filtering và ordering.

**Dependencies:** Story 3.4, Story 4.3, Story 6.4.

## Story 7.2: Giao Diện Tìm Kiếm, Lọc Và Dòng Thời Gian

**Requirements Covered:** FR-082, UX-DR15, UX-DR25, UX-DR27, UX-DR29, UX-DR30.

As a người dùng được quyền,
I want search/filter history theo project, module, actor, type, status và thời gian,
So that tôi tìm nhanh thay đổi điều hành cần kiểm tra.

**Acceptance Criteria:**

AC1:
**Given** History Center có event timeline
**When** người dùng search theo tên project, approval, hồ sơ, owner hoặc mã record
**Then** danh sách lọc đúng và hiển thị active filters.

AC2:
**Given** người dùng lọc theo type/status/severity/module/scope/time
**When** filter thay đổi
**Then** timeline cập nhật không mất context.

AC3:
**Given** mobile viewport
**When** timeline render
**Then** event hiển thị dạng list compact với focus order hợp lý.

**Files/Modules:** `src/app/executive/history`, `src/modules/reports/components`, `src/components/shared`.

**Test Expectations:** Component tests cho search/filter/empty; accessibility checks cho timeline DOM order.

**Dependencies:** Story 7.1.

## Story 7.3: Xuất Dữ Liệu Theo Quyền Và Nhật Ký

**Requirements Covered:** FR-083, FR-084, NFR-005, NFR-006, NFR-012.

As a người dùng có quyền xuất dữ liệu,
I want export dashboard, approval history hoặc audit log theo permission,
So that dữ liệu điều hành được chia sẻ có kiểm soát.

**Acceptance Criteria:**

AC1:
**Given** người dùng có permission `Xuất dữ liệu`
**When** export dashboard, audit log hoặc approval history
**Then** hệ thống tạo export chỉ chứa dữ liệu trong scope và ghi audit log.

AC2:
**Given** export chứa dữ liệu nhạy cảm
**When** người dùng thiếu permission nhạy cảm riêng
**Then** hệ thống chặn export hoặc loại bỏ field nhạy cảm từ service.

AC3:
**Given** người dùng không có quyền export
**When** gọi action export trực tiếp
**Then** service trả permission error và không tạo file/export payload.

**Files/Modules:** `src/modules/reports`, `src/modules/dashboard`, `src/modules/proposals`, `src/lib/audit`, `src/lib/permissions`.

**Test Expectations:** Unit tests cho export permission, sensitive data filtering và audit on export.

**Dependencies:** Story 7.1.

## Story 7.4: Trạng Thái Lịch Sử/Xuất Dữ Liệu Và QA Nghiệm Thu

**Requirements Covered:** FR-080, FR-082, FR-083, FR-084, NFR-004, UX-DR22, UX-DR26, UX-DR30, UX-DR31, UX-DR32.

As a product owner,
I want History/Archive/Export có loading, empty, error, unauthorized và responsive states,
So that nghiệm thu Module 1 bao phủ traceability và permission.

**Acceptance Criteria:**

AC1:
**Given** History Center không có event trong scope
**When** render empty state
**Then** UI nói rõ không có dữ liệu trong scope hoặc do filter.

AC2:
**Given** service lỗi tạm thời
**When** UI hiển thị error state
**Then** có retry hoặc link quay về workspace phù hợp.

AC3:
**Given** người dùng thiếu quyền xem/export
**When** mở history/export action
**Then** unauthorized state rõ ràng và không lộ dữ liệu.

**Files/Modules:** `src/modules/reports/components`, `src/components/shared`, `tests/e2e`.

**Test Expectations:** Component tests cho loading/empty/error/unauthorized; e2e smoke cho export blocked/allowed.

**Dependencies:** Story 7.2, Story 7.3.
