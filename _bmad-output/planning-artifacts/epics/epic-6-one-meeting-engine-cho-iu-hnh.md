# Epic 6: Bộ Máy Cuộc Họp Thống Nhất Cho Điều Hành

Người có quyền có thể tạo, xem, lọc và theo dõi cuộc họp qua một Meeting System chung với nhiều meeting type, visibility/scope động, external participants, attachments, agenda, minutes, AI summary draft, follow-up actions, related tasks, related approvals, decision tracking và audit.

## Story 6.1: Loại Cuộc Họp, Phạm Vi Và Hợp Đồng Repository

**Requirements Covered:** FR-070, FR-071, FR-072, FR-074, FR-102, FR-103, FR-104, FR-105, FR-106, FR-107, FR-108, FR-109, FR-118, FR-119, NFR-008, NFR-013.

As a người dùng có quyền tạo/xem họp,
I want một meeting engine chung hỗ trợ nhiều loại họp và scope động,
So that hệ thống không tạo nhiều module họp riêng cứng.

**Acceptance Criteria:**

AC1:
**Given** meeting engine được cấu hình
**When** tạo hoặc đọc meeting
**Then** meeting hỗ trợ types `EXECUTIVE_MEETING`, `EXECUTIVE_OPERATIONAL_MEETING`, `DEPARTMENT_INTERNAL_MEETING`, `PROJECT_MEETING`, `EXTERNAL_PARTNER_MEETING`, `GOVERNMENT_MEETING`.

AC2:
**Given** meeting có scope khác nhau
**When** lưu meeting
**Then** record hỗ trợ organization_id, project_id tùy chọn, multi-project nếu cần, axis_id, department_id, visibility và participant_scope.

AC3:
**Given** repository chạy mock/file-backed hoặc Supabase mode
**When** service gọi list/create/update meeting
**Then** contract domain DTO giống nhau và không lộ DB snake_case ra UI.

**Files/Modules:** `src/modules/meetings/types.ts`, `src/modules/meetings/constants.ts`, `src/modules/meetings/services`, `database/migrations`.

**Test Expectations:** Unit tests cho meeting type/status contract, scope mapping, mock/Supabase repository mapping.

**Dependencies:** Story 1.2.

## Story 6.2: Danh Sách Cuộc Họp, Bộ Lọc Và Hiển Thị Cho Lãnh Đạo

**Requirements Covered:** FR-110, FR-111, FR-112, FR-113, NFR-001, NFR-013, UX-DR24, UX-DR25, UX-DR29.

As a executive user,
I want xem và lọc meeting trong scope theo type, project, department, visibility, participant, status và thời gian,
So that tôi chỉ thấy cuộc họp liên quan và ưu tiên.

**Acceptance Criteria:**

AC1:
**Given** người dùng executive có scope hợp lệ
**When** mở Meeting Center
**Then** chỉ meeting trong scope xuất hiện, gồm họp quan trọng, họp chiến lược, họp risk cao và họp có follow-up quá hạn.

AC2:
**Given** người dùng thuộc department workspace
**When** mở danh sách họp
**Then** chỉ meeting thuộc scope phòng ban/người dùng xuất hiện.

AC3:
**Given** filter được áp dụng
**When** người dùng lọc theo meeting_type, organization, project, axis, department, visibility, participant, status hoặc thời gian
**Then** danh sách cập nhật và active filters hiển thị rõ.

**Files/Modules:** `src/app/(dashboard)/meetings`, `src/modules/meetings/components`, `src/modules/meetings/services`.

**Test Expectations:** Unit tests cho visibility/filter service; component tests cho filter UI và empty states.

**Dependencies:** Story 6.1.

## Story 6.3: Tạo Và Sửa Cuộc Họp Với Bản Ghi Liên Quan

**Requirements Covered:** FR-073, FR-075, FR-114, NFR-005, NFR-006, UX-DR23.

As a người có quyền tạo họp,
I want tạo/sửa meeting với participants, external participants và related records,
So that cuộc họp liên kết đúng project, approval, risk, decision, task hoặc hồ sơ.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền tạo họp trong scope
**When** submit meeting form
**Then** hệ thống lưu title, meeting_type, host, participants, external_participants, start/end time, agenda, visibility, scope và status hợp lệ.

AC2:
**Given** meeting liên quan approval, risk, decision, task hoặc document
**When** người dùng chọn related records
**Then** service lưu liên kết qua service contract tương ứng, không gọi repository module khác trực tiếp từ component.

AC3:
**Given** quản lý phòng họp/booking chưa nằm trong MVP
**When** form hiển thị room_id
**Then** trường này được xử lý như placeholder/mock và không chặn tạo meeting.

**Files/Modules:** `src/modules/meetings/actions.ts`, `src/modules/meetings/validation.ts`, `src/modules/meetings/components/meeting-form.tsx`, `src/modules/proposals`, `src/modules/executive`.

**Test Expectations:** Unit tests cho validation, permission, related records; component tests cho create/edit form.

**Dependencies:** Story 6.1, Story 6.2.

## Story 6.4: Biên Bản, Tệp Đính Kèm Và Bản Nháp Tóm Tắt AI

**Requirements Covered:** FR-076, FR-077, FR-108, FR-117, NFR-006, NFR-009, NFR-010, UX-DR16, UX-DR34.

As a meeting host hoặc người được quyền,
I want upload tài liệu, cập nhật biên bản và dùng AI summary draft,
So that meeting có hồ sơ đầy đủ nhưng biên bản chính thức vẫn cần duyệt.

**Acceptance Criteria:**

AC1:
**Given** meeting đã tồn tại
**When** người dùng upload attachment hoặc cập nhật minutes
**Then** hệ thống lưu thay đổi và ghi audit.

AC2:
**Given** AI tạo meeting summary
**When** summary hiển thị
**Then** summary luôn có trạng thái draft/gợi ý cho tới khi người có quyền approve.

AC3:
**Given** người dùng có quyền approve biên bản
**When** approve official minutes hoặc AI summary
**Then** trạng thái được cập nhật và audit log ghi actor/time/previous/new state.

**Files/Modules:** `src/modules/meetings`, `src/modules/ai`, `src/lib/storage`, `src/lib/audit`.

**Test Expectations:** Unit tests cho minutes/status/audit; component tests cho draft label và approve action.

**Dependencies:** Story 6.3.

## Story 6.5: Hành Động Theo Dõi Liên Kết Việc Liên Quan

**Requirements Covered:** FR-078, FR-115, NFR-005, NFR-006.

As a meeting host,
I want tạo follow-up actions sau họp và liên kết chúng với tasks,
So that action items sau họp được theo dõi như công việc.

**Acceptance Criteria:**

AC1:
**Given** meeting đã hoàn tất hoặc đang follow-up
**When** tạo follow-up action
**Then** hệ thống lưu action với owner, deadline, status và related meeting.

AC2:
**Given** follow-up action cần theo dõi như task
**When** người dùng chọn tạo related task
**Then** service tạo task qua task service contract và liên kết `related_tasks`.

AC3:
**Given** follow-up task quá hạn
**When** executive dashboard hoặc meeting detail tải dữ liệu
**Then** item xuất hiện trong priority/overdue context theo quyền.

**Files/Modules:** `src/modules/meetings`, `src/modules/tasks`, `src/modules/dashboard`, `src/lib/audit`.

**Test Expectations:** Unit tests cho follow-up lifecycle, task linkage và overdue integration.

**Dependencies:** Story 6.3.

## Story 6.6: Theo Dõi Quyết Định Sau Họp

**Requirements Covered:** FR-079, FR-116, FR-117, NFR-006, UX-DR15.

As a lãnh đạo hoặc host cuộc họp,
I want meeting liên kết decisions và trạng thái thực hiện sau họp,
So that quyết định sau họp được theo dõi trong Decision & Assignment Center.

**Acceptance Criteria:**

AC1:
**Given** meeting có decision được ghi nhận
**When** người dùng liên kết hoặc tạo decision từ meeting
**Then** hệ thống lưu relation giữa meeting và decision.

AC2:
**Given** decision sau họp có assignments
**When** mở meeting detail
**Then** UI hiển thị decision liên quan, trạng thái thực hiện và audit.

AC3:
**Given** meeting update decision tracking
**When** mutation hoàn tất
**Then** audit log ghi thay đổi tracking và actor.

**Files/Modules:** `src/modules/meetings`, `src/modules/executive`, `src/modules/tasks`, `src/lib/audit`.

**Test Expectations:** Unit tests cho meeting-decision linkage; component tests cho decision tracking panel.

**Dependencies:** Story 4.1, Story 6.3.
