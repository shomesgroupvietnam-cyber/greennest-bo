# Epic 4: Trung Tâm Quyết Định Và Giao Việc

Lãnh đạo có thể ban hành quyết định/chỉ đạo khác biệt với approval, tạo assignment/task từ decision, gán deadline/KPI/ưu tiên, theo dõi trạng thái thực hiện và giữ version/history khi sửa nội dung quan trọng.

## Story 4.1: Bản Ghi Quyết Định Từ Phê Duyệt, Cuộc Họp Hoặc Độc Lập

**Requirements Covered:** FR-044, FR-045, FR-046, NFR-005, NFR-006.

As a lãnh đạo,
I want tạo quyết định chính thức sau approval, sau meeting hoặc độc lập,
So that chỉ đạo điều hành được ghi nhận riêng với approval.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền tạo quyết định
**When** tạo decision độc lập
**Then** hệ thống lưu title, nội dung, scope, owner, priority, deadline nếu có và linked records nếu có.

AC2:
**Given** approval hoặc meeting có kết quả cần ban hành quyết định
**When** tạo decision từ nguồn đó
**Then** decision liên kết nguồn nhưng vẫn là record riêng.

AC3:
**Given** người dùng thiếu quyền tạo quyết định trong scope
**When** gọi action tạo decision
**Then** service chặn mutation và ghi nhận lỗi permission phù hợp.

**Files/Modules:** `src/modules/executive`, `src/modules/proposals`, `src/modules/meetings`, `src/lib/audit`.

**Test Expectations:** Unit tests cho create decision, linked source, permission block và audit.

**Dependencies:** Story 1.2; liên kết approval/meeting dùng source nếu đã có, nhưng tạo độc lập phải hoạt động trước.

## Story 4.2: Giao Việc Từ Quyết Định Cho Nhiều Người

**Requirements Covered:** FR-047, FR-048, FR-049, NFR-005, NFR-007.

As a lãnh đạo,
I want một quyết định có thể giao nhiều việc cho nhiều người/phòng ban/dự án,
So that chỉ đạo được chuyển thành hành động theo dõi được.

**Acceptance Criteria:**

AC1:
**Given** decision hợp lệ
**When** lãnh đạo thêm assignments
**Then** hệ thống tạo nhiều task/assignment với assignee, department/project nếu có, deadline, priority, KPI hoặc mô tả việc.

AC2:
**Given** MVP không yêu cầu người nhận xác nhận đã nhận việc
**When** assignment được tạo
**Then** trạng thái ban đầu phản ánh đã giao/chờ xử lý mà không cần bước acknowledge.

AC3:
**Given** assignee ngoài scope của người tạo
**When** submit assignment
**Then** validation hoặc permission service chặn assignment không hợp lệ.

**Files/Modules:** `src/modules/executive`, `src/modules/tasks`, `src/modules/users`, `src/lib/permissions`.

**Test Expectations:** Unit tests cho multi-assignment creation, scope validation và task linkage.

**Dependencies:** Story 4.1.

## Story 4.3: Phiên Bản/Lịch Sử Khi Sửa Quyết Định Quan Trọng

**Requirements Covered:** FR-050, NFR-006, UX-DR15.

As a lãnh đạo hoặc kiểm soát viên,
I want decision lưu version/history khi sửa deadline, owner, scope, priority, KPI hoặc chỉ đạo bổ sung,
So that thay đổi quan trọng có thể truy vết.

**Acceptance Criteria:**

AC1:
**Given** decision đã tồn tại
**When** sửa field quan trọng
**Then** hệ thống tạo version/history với previous/new value, actor, timestamp và reason nếu có.

AC2:
**Given** sửa nội dung không quan trọng
**When** service cập nhật
**Then** hệ thống vẫn audit mutation nhưng chỉ version hóa theo rule đã định.

AC3:
**Given** người dùng mở decision detail
**When** xem history
**Then** timeline hiển thị version và audit theo thứ tự dễ đọc.

**Files/Modules:** `src/modules/executive/services`, `src/modules/executive/components`, `src/lib/audit`.

**Test Expectations:** Unit tests cho version rules; component tests cho history timeline.

**Dependencies:** Story 4.1.

## Story 4.4: Giao Diện Trung Tâm Quyết Định Và Giao Việc

**Requirements Covered:** FR-051, NFR-001, NFR-011, UX-DR11, UX-DR14, UX-DR15, UX-DR27, UX-DR29.

As a lãnh đạo,
I want xem quyết định mới, giao việc, chỉ đạo ưu tiên, KPI giao xuống, deadline và trạng thái thực hiện,
So that tôi theo dõi được việc đã giao sau quyết định.

**Acceptance Criteria:**

AC1:
**Given** user có decision/assignment trong scope
**When** mở Decision & Assignment Center
**Then** UI hiển thị danh sách quyết định, assignments, owner, deadline, priority, KPI và trạng thái thực hiện.

AC2:
**Given** một decision liên quan approval hoặc meeting
**When** mở detail
**Then** UI hiển thị linked source và timeline/audit.

AC3:
**Given** mobile viewport
**When** xem danh sách decision/assignment
**Then** table chuyển sang compact list hoặc scroll có kiểm soát.

**Files/Modules:** `src/app/executive/decisions`, `src/modules/executive/components`, `src/modules/tasks`, `src/components/shared`.

**Test Expectations:** Component tests cho list/detail/empty/loading; e2e smoke cho create decision -> assignment visible nếu route có sẵn.

**Dependencies:** Story 4.1, Story 4.2, Story 4.3.
