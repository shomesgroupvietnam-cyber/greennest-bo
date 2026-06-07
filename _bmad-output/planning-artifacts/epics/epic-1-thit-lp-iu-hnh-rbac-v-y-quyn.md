# Epic 1: Thiết Lập Điều Hành, RBAC Và Ủy Quyền

Chủ tịch/Super Admin và quản trị được ủy quyền có thể cấu hình nền điều hành tối thiểu cho Module 1: role template tiếng Việt, permission/action, policy/scope, nhóm risk, ngưỡng duyệt tiền, phân quyền quản trị tách khỏi duyệt nghiệp vụ và ủy quyền thư ký/trợ lý. Epic này tạo nền an toàn để các workspace và flow sau hoạt động theo role + scope + action thay vì hardcode.

## Story 1.1: Mẫu Vai Trò Và Danh Mục Quyền Cho Module 1

**Requirements Covered:** FR-091, FR-092, FR-093, FR-096, NFR-005, NFR-006, NFR-008.

As a Chủ tịch/Super Admin,
I want cấu hình role template và action permission tiếng Việt cho Module 1,
So that hệ thống có nền phân quyền không hardcode cho các workspace và workflow điều hành.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền quản lý vai trò
**When** mở BO Settings cho role/permission
**Then** hệ thống hiển thị role template mặc định bằng tiếng Việt gồm Chủ tịch, Super Admin, Tổng Giám đốc, Phó Tổng Giám đốc, Giám đốc dự án, Trưởng bộ phận, Thư ký/Trợ lý, Quản trị hệ thống, Quản trị điều hành và Người xem
**And** role có thể thêm, đổi tên, vô hiệu hóa mà không sửa code UI.

AC2:
**Given** hệ thống có danh sách action permission tối thiểu
**When** quản trị xem permission catalog
**Then** các action như xem tổng hợp, xem chi tiết, xem tài chính nhạy cảm, duyệt, trả lại, chuyển cấp, tạo quyết định, giao việc, tạo cuộc họp, xuất dữ liệu và xem audit được quản lý như dữ liệu cấu hình.

AC3:
**Given** một role có quyền quản trị hệ thống nhưng không có quyền duyệt nghiệp vụ
**When** role đó truy cập approval action
**Then** hệ thống không cho duyệt nghiệp vụ
**And** trả unauthorized/disabled action theo UX pattern mà không lộ dữ liệu ngoài scope.

**Files/Modules:** `src/modules/settings`, `src/modules/users`, `src/lib/permissions`, `src/lib/auth`, `src/lib/audit`.

**Test Expectations:** Unit tests cho permission catalog, role template load, deny-by-default và tách quyền quản trị khỏi quyền duyệt.

**Dependencies:** None.

## Story 1.2: Gán Phạm Vi Theo Tổ Chức, Dự Án, Trục Và Luồng Công Việc

**Requirements Covered:** FR-092, FR-096, NFR-001, NFR-002, NFR-003, NFR-004, NFR-005, NFR-007, NFR-008.

As a quản trị điều hành,
I want gán role và action theo organization/project/axis/workstream/module,
So that một người có thể có quyền khác nhau ở từng phạm vi điều hành.

**Acceptance Criteria:**

AC1:
**Given** một người dùng có nhiều assignment
**When** service kiểm tra quyền cho một project/module/action cụ thể
**Then** kết quả quyền được tính theo user + role + organization + project + axis + workstream/module + action
**And** không lấy role/permission từ business record.

AC2:
**Given** người dùng không có assignment phù hợp
**When** truy cập route hoặc service data Module 1
**Then** route/service trả 403 hoặc empty/unauthorized state theo ngữ cảnh
**And** dữ liệu không được render rồi mới ẩn ở frontend.

AC3:
**Given** người dùng được gán quyền ở project A nhưng không ở project B
**When** gọi dashboard/workspace service
**Then** DTO chỉ chứa dữ liệu trong project A.

**Files/Modules:** `src/lib/permissions/access-scope.ts`, `src/modules/workspaces`, `src/modules/settings`, `tests/unit`.

**Test Expectations:** Unit tests cho multi-assignment, scope filtering và direct access 403.

**Dependencies:** Story 1.1.

## Story 1.3: Chính Sách Cơ Bản Cho Ngưỡng Duyệt Tiền Và Nhóm Rủi Ro

**Requirements Covered:** FR-037, FR-055, FR-092, FR-094, FR-095, NFR-006, NFR-008.

As a quản trị điều hành,
I want cấu hình policy cơ bản cho ngưỡng duyệt tiền và nhóm risk,
So that approval và risk center không hardcode rule nghiệp vụ.

**Acceptance Criteria:**

AC1:
**Given** quản trị có quyền cấu hình policy
**When** tạo hoặc sửa ngưỡng duyệt tiền
**Then** policy được lưu qua service/repository
**And** các approval flow có thể đọc policy này thay vì hardcode threshold.

AC2:
**Given** quản trị cấu hình nhóm risk
**When** Risk Center hoặc dashboard tải dữ liệu
**Then** hệ thống dùng nhóm risk từ configuration
**And** vẫn có nhóm mặc định khi seed/demo data được khởi tạo.

AC3:
**Given** policy hoặc nhóm risk bị sửa
**When** mutation hoàn tất
**Then** audit log ghi actor, thời gian, giá trị cũ/mới và scope.

**Files/Modules:** `src/modules/settings`, `src/modules/proposals`, `src/modules/executive`, `src/lib/audit`.

**Test Expectations:** Unit tests cho policy repository, service validation, audit log và fallback seed config.

**Dependencies:** Story 1.1, Story 1.2.

## Story 1.4: Ủy Quyền Cho Thư Ký/Trợ Lý Theo Lãnh Đạo

**Requirements Covered:** FR-097, FR-098, FR-099, FR-100, NFR-005, NFR-006, NFR-007.

As a lãnh đạo hoặc quản trị được ủy quyền,
I want cấu hình Thư ký/Trợ lý theo từng lãnh đạo và phạm vi dự án/module/action,
So that Thư ký/Trợ lý chỉ thao tác trong phạm vi được ủy quyền.

**Acceptance Criteria:**

AC1:
**Given** một lãnh đạo có Thư ký/Trợ lý được ủy quyền
**When** cấu hình delegation
**Then** hệ thống lưu lãnh đạo ủy quyền, người được ủy quyền, project/module/action và thời hạn nếu có.

AC2:
**Given** Thư ký/Trợ lý được phép tạo và submit request thay lãnh đạo
**When** họ tạo request trong scope được ủy quyền
**Then** request ghi rõ submittedBy và onBehalfOf
**And** audit log thể hiện hành động thay mặt.

AC3:
**Given** Thư ký/Trợ lý cố approve thay lãnh đạo trong MVP
**When** gọi approval action
**Then** hệ thống chặn action bằng service-side permission
**And** trả thông báo rõ rằng MVP không cho approve thay.

**Files/Modules:** `src/modules/users`, `src/modules/settings`, `src/modules/proposals`, `src/modules/workspaces`, `src/lib/audit`.

**Test Expectations:** Unit tests cho delegation scope, submit on behalf, block approve on behalf và audit.

**Dependencies:** Story 1.2.

## Story 1.5: Dữ Liệu Mẫu Điều Hành Cho Nghiệm Thu Module 1

**Requirements Covered:** FR-091, FR-092, FR-093, FR-097, FR-098, FR-099, FR-100, NFR-007, NFR-008.

As a product owner,
I want có dữ liệu seed/mock đủ vai trò, scope, policy và delegation,
So that Module 1 có thể nghiệm thu bằng nhiều user và nhiều phạm vi quyền.

**Acceptance Criteria:**

AC1:
**Given** môi trường demo chạy mock/file-backed mode
**When** load dữ liệu Module 1
**Then** có ít nhất các user Chủ tịch, CEO, Giám đốc dự án, Trưởng bộ phận, Thư ký/Trợ lý và Người xem với assignment khác nhau.

AC2:
**Given** seed data có project/cơ hội mẫu
**When** từng user mở workspace
**Then** dữ liệu hiển thị khác nhau theo assignment/scope
**And** có dữ liệu tài chính nhạy cảm để test permission.

AC3:
**Given** seed data có policy và delegation
**When** chạy unit tests hoặc demo manual
**Then** có thể kiểm tra 403, trạng thái không có quyền, submit thay lãnh đạo và chặn duyệt thay.

**Files/Modules:** `database/seeds`, `src/modules/*/services/*-repository.ts`, `tests/fixtures`, `tests/unit`.

**Test Expectations:** Unit tests hoặc fixture tests xác nhận seed data bao phủ role/scope/policy/delegation cần cho các story sau.

**Dependencies:** Story 1.1, Story 1.2, Story 1.3, Story 1.4.

## Story 1.6: Tách Vai Trò Chủ Tịch Khỏi Super Admin Kỹ Thuật

**Requirements Covered:** FR-091, FR-092, FR-093, FR-096, NFR-005, NFR-006, NFR-008.

As a người quản lý RBAC Module 1,
I want vai trò Chủ tịch điều hành được tách khỏi Super Admin kỹ thuật/BO,
So that Chủ tịch có quyền điều hành nghiệp vụ nhưng không mặc định nắm quyền quản trị hệ thống, người dùng, thiết lập và danh mục vai trò.

**Acceptance Criteria:**

AC1:
**Given** danh mục vai trò tĩnh và danh mục quyền theo vai trò được tải
**When** hệ thống liệt kê vai trò
**Then** có role mới `chu_tich` với label "Chủ tịch" và route mặc định `/command-center`
**And** `super_admin` mang nghĩa Super Admin kỹ thuật/BO, không còn đồng nghĩa với Chủ tịch.

AC2:
**Given** user role `chu_tich`
**When** runtime permission check chạy
**Then** role có quyền điều hành dashboard, phê duyệt, quyết định, rủi ro, họp và quyền xem/phê duyệt tài chính nhạy cảm khi phù hợp
**And** role không có quyền BO như `settings.manage`, `user.invite`, `user.update_role`, `user.view`, cấu hình danh mục vai trò hoặc `delegation.manage` cấp BO.

AC3:
**Given** user role `super_admin`
**When** permission/navigation/default route được resolve
**Then** role có toàn bộ quyền của `chu_tich` cộng thêm quyền BO/system
**And** default route khuyến nghị vẫn là `/command-center`, BO là menu/không gian làm việc riêng.

AC4:
**Given** seed/demo data được tạo
**When** mock/file-backed hoặc local/staging Supabase seed được đọc
**Then** `chairman-01` có role `chu_tich`
**And** có `super-admin-01` với role `super_admin`.

AC5:
**Given** role `chu_tich`
**When** sidebar/default route/direct routes render
**Then** user thấy "Tổng quan Trục 1" và "Lãnh đạo"
**And** không thấy/không vào được `/admin`, `/settings`, `/users`.

AC6:
**Given** tests chạy
**When** RBAC, seed, navigation và e2e smoke được validate
**Then** tests bao phủ ma trận allow/deny của `chu_tich`, `super_admin` superset, seed persona mapping và direct BO route denial cho Chủ tịch.

**Files/Modules:** `src/constants/roles.ts`, `src/lib/permissions`, `src/modules/settings`, `src/modules/workspaces`, `src/modules/executive`, `src/modules/command-center`, `src/lib/auth`, `scripts/seed-demo.mjs`, `database/seeds`, `database/verification`, `tests/unit`, `tests/e2e`.

**Test Expectations:** Unit tests cho role catalog/permissions/navigation/default route/seed fixtures và e2e smoke cho tách Chủ tịch/Super Admin.

**Dependencies:** Story 1.1, Story 1.5.

**Follow-up liên quan:** Story 2.9 tăng cứng chính sách điều hướng và điều kiện vào Trung Tâm Điều Hành sau khi tách vai trò này.
