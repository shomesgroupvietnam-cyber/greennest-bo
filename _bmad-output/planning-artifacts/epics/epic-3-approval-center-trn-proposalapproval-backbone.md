# Epic 3: Trung Tâm Phê Duyệt Trên Nền Proposal/Approval

Lãnh đạo có thể xem và xử lý approval trong Module 1 qua một Approval Center chung, phân vùng Trục 1/2/3, phân loại request, xử lý approve/reject/return/forward/ask meeting/hold/cancel, áp dụng policy/assignment, lưu history/audit và cảnh báo/escalate quá hạn.

## Story 3.1: Hàng Đợi Phê Duyệt Theo Phạm Vi Và Tab Theo Trục

**Requirements Covered:** FR-025, FR-026, FR-027, FR-028, NFR-001, NFR-002, UX-DR11, UX-DR24, UX-DR25.

As a lãnh đạo có quyền duyệt,
I want xem Approval Center theo Trục 1/2/3 và queue ưu tiên,
So that tôi xử lý đúng request trong phạm vi của mình.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền vào Approval Center
**When** mở Approval Center
**Then** hệ thống hiển thị tabs Trục 1, Trục 2, Trục 3
**And** Trục 2/3 có thể là placeholder/mock được gắn nhãn rõ.

AC2:
**Given** Trục 1 có approval trong scope
**When** queue tải dữ liệu
**Then** approval được phân loại theo hồ sơ/văn bản, tài chính/chi, chiến lược, kỹ thuật, pháp lý và họp.

AC3:
**Given** người dùng không có quyền xem một approval
**When** service tạo queue
**Then** approval đó không xuất hiện trong DTO.

**Files/Modules:** `src/modules/proposals`, `src/modules/executive`, `src/app/executive/approvals`, `src/components/shared`.

**Test Expectations:** Unit tests cho scoped approval query/category; component tests cho axis tabs và placeholder Trục 2/3.

**Dependencies:** Story 1.2, Story 1.5.

## Story 3.2: Chi Tiết Phê Duyệt Cho Yêu Cầu Trục 1

**Requirements Covered:** FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, NFR-001, NFR-004, UX-DR14, UX-DR20.

As a người duyệt,
I want xem approval detail với request summary, policy, hồ sơ và context Trục 1,
So that tôi đủ thông tin trước khi quyết định.

**Acceptance Criteria:**

AC1:
**Given** một approval Trục 1 thuộc loại hồ sơ, chi phí, pháp lý, kỹ thuật, chiến lược hoặc họp
**When** mở detail
**Then** hệ thống hiển thị request summary, scope, proposer, amount nếu có, policy áp dụng, attachments, linked project/module và history hiện có.

AC2:
**Given** request có liên kết tới Module 2-5
**When** mở detail
**Then** hệ thống hiển thị link/source ở mức placeholder/read-only nếu module chuyên môn chưa triển khai sâu
**And** không tạo logic chuyên môn sâu ngoài scope Module 1.

AC3:
**Given** người dùng thiếu quyền xem tài chính nhạy cảm
**When** detail có amount nhạy cảm
**Then** amount bị ẩn từ service hoặc trả no-permission state.

**Files/Modules:** `src/modules/proposals`, `src/modules/documents`, `src/modules/projects`, `src/modules/executive/components`.

**Test Expectations:** Unit tests cho detail DTO, sensitive amount permission, linked source placeholder.

**Dependencies:** Story 3.1.

## Story 3.3: Hành Động Phê Duyệt Với Kiểm Tra Hợp Lệ Và Phân Quyền

**Requirements Covered:** FR-035, FR-036, FR-038, FR-039, FR-040, FR-041, NFR-005, UX-DR13, UX-DR21, UX-DR23.

As a người duyệt có thẩm quyền,
I want approve, reject, return, forward/escalate, ask for meeting, hold hoặc cancel approval,
So that request được xử lý đúng policy và có lý do rõ ràng.

**Acceptance Criteria:**

AC1:
**Given** policy/assignment xác định người dùng đủ quyền
**When** người dùng approve approval
**Then** trạng thái được cập nhật
**And** comment là tùy chọn.

AC2:
**Given** người dùng chọn reject hoặc return/request changes
**When** submit form không có lý do
**Then** validation chặn submit và hiển thị lỗi gần field lý do.

AC3:
**Given** người dùng chọn forward/escalate, ask for meeting hoặc hold
**When** submit action
**Then** hệ thống lưu comment nếu có, next assignee/meeting proposal nếu áp dụng và trạng thái phù hợp.

AC4:
**Given** người dùng không đủ quyền duyệt
**When** gọi server action trực tiếp
**Then** service trả permission error và không mutate record.

**Files/Modules:** `src/modules/proposals/actions.ts`, `src/modules/proposals/services`, `src/modules/proposals/validation.ts`, `src/modules/proposals/components`.

**Test Expectations:** Unit tests cho từng action outcome, validation reason, permission block; component tests cho Approval Action Panel.

**Dependencies:** Story 3.2, Story 1.3.

## Story 3.4: Lịch Sử, Phiên Bản Và Nhật Ký Phê Duyệt

**Requirements Covered:** FR-042, NFR-006, UX-DR15, UX-DR30.

As a lãnh đạo hoặc kiểm soát viên được quyền,
I want xem history/audit của approval,
So that mọi quyết định duyệt có thể truy vết được.

**Acceptance Criteria:**

AC1:
**Given** approval có thay đổi trạng thái
**When** action hoàn tất
**Then** history lưu actor, thời gian, ghi chú, file đính kèm nếu có, trạng thái cũ/mới, version và audit log.

AC2:
**Given** người dùng mở approval detail
**When** xem tab history/audit
**Then** timeline hiển thị các event theo thứ tự thời gian và đọc được bằng keyboard.

AC3:
**Given** người dùng không có quyền xem audit
**When** mở history/audit
**Then** hệ thống chặn hoặc ẩn phần audit theo permission mà không lộ chi tiết event.

**Files/Modules:** `src/modules/proposals`, `src/lib/audit`, `src/components/shared`, `tests/unit/proposal-service.test.ts`.

**Test Expectations:** Unit tests cho audit append/versioning; component tests cho timeline permission state.

**Dependencies:** Story 3.3.

## Story 3.5: Phê Duyệt Quá Hạn Và Leo Thang Theo Chính Sách

**Requirements Covered:** FR-043, NFR-006, UX-DR11, UX-DR22.

As a lãnh đạo,
I want approval quá hạn được cảnh báo và escalate theo policy,
So that request quan trọng không bị kẹt.

**Acceptance Criteria:**

AC1:
**Given** approval vượt deadline
**When** Approval Center hoặc dashboard tải dữ liệu
**Then** approval được đánh dấu overdue với severity, reason, owner và next action.

AC2:
**Given** approval quá hạn kéo dài hoặc risk cao
**When** policy escalation được áp dụng
**Then** hệ thống xác định người duyệt, người đề xuất, Thư ký/Trợ lý liên quan và escalation target trong scope.

AC3:
**Given** notification production chưa nằm trong scope
**When** escalation được tính
**Then** hệ thống lưu alert/mock notification hoặc queue item đủ để demo nghiệm thu
**And** ghi audit khi trạng thái/escalation thay đổi.

**Files/Modules:** `src/modules/proposals`, `src/modules/dashboard`, `src/modules/settings`, `src/lib/audit`, `src/lib/notifications`.

**Test Expectations:** Unit tests cho overdue calculation, escalation policy, queue item và audit.

**Dependencies:** Story 3.1, Story 3.3, Story 1.3.
