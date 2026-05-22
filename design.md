# GreenNest BuildFlow - Product Design Doc

> Documentation status: MVP UI/UX execution snapshot. For finalized design standards, use `docs/design/DESIGN_STANDARD.md`. For long-term role workspace design, use `blueprint/13-role-workspaces.md`. For AI Assistant/RAG strategy, use `blueprint/14-ai-assistant-strategy.md`.

Phiên bản: 1.0  
Ngày lập: 16/05/2026  
Mục tiêu: mô tả trải nghiệm sản phẩm, màn hình, luồng thao tác và quy chuẩn UI để Codex/Claude triển khai MVP V1 nhất quán.

## 1. Design Goals

- Người dùng không chuyên công nghệ vẫn hiểu nhanh dự án đang ở đâu, việc gì chậm, hồ sơ nào thiếu và pháp lý nào vướng.
- Founder/Chủ đầu tư vào dashboard là thấy được việc cần quyết định trong tuần.
- Trợ lý/PM nhập liệu nhanh, tìm kiếm nhanh, ít màn hình rườm rà.
- UI phải giống công cụ vận hành doanh nghiệp: rõ, gọn, mật độ thông tin vừa đủ, không làm kiểu landing page.
- Thiết kế phải hỗ trợ mở rộng module thi công, tài chính và AI sau MVP.

## 2. Layout Chính

App dùng cấu trúc:

- Sidebar trái: điều hướng module.
- Header trên: tên trang, search nhanh, user menu, notification.
- Main content: dashboard, table, form, detail view.
- Responsive mobile: sidebar chuyển thành drawer hoặc bottom navigation đơn giản.

Menu chính:

- Dashboard.
- Projects.
- Tasks.
- Documents.
- Legal Checklist.
- Meetings.
- Reports.
- Design.
- Construction.
- Finance.
- Audit.
- Users.
- Settings.

Menu phải render theo quyền. Không phải role nào cũng thấy mọi module.

## 3. Visual Language

### Tone

Giao diện tiếng Việt, chuyên nghiệp, thực dụng, không marketing. Ưu tiên bảng, filter, status badge, card số liệu và detail panel.

### Màu trạng thái

- Xanh: hoàn thành, ổn định.
- Vàng: đang xử lý, cần theo dõi.
- Đỏ: quá hạn, bị vướng, rủi ro.
- Xám: chưa bắt đầu, chưa có dữ liệu.

### Component Rules

- Card dùng cho KPI, cảnh báo, item lặp lại và modal.
- Không lồng card trong card.
- Bảng dữ liệu phải có search, filter, sort và pagination khi dữ liệu có thể tăng.
- Form phải có validation message rõ.
- Button chính chỉ dùng cho hành động chính trên màn hình.
- Trạng thái nên dùng badge + text, không chỉ dựa vào màu.

## 4. Information Architecture

```text
Dashboard
Projects
  Project List
  Project Detail
    Overview
    Tasks
    Documents
    Legal
    Dashboard
Tasks
Documents
Legal Checklist
Meetings
Reports
Design
Construction
Finance
Audit
Users
Settings
```

## 5. Key Screens

### 5.1 Login

Mục tiêu: đăng nhập nhanh, không có nội dung marketing dài.

Thành phần:

- Logo hoặc tên `GreenNest BuildFlow`.
- Email/password hoặc provider auth nếu dùng Supabase/NextAuth.
- Error state cho sai thông tin.

### 5.2 Dashboard

Mục tiêu: màn hình điều hành theo role. Dashboard mặc định phải thay đổi theo vai trò và quyền của user.

Thành phần:

- KPI cards:
  - Tổng dự án.
  - Việc quá hạn.
  - Hồ sơ thiếu.
  - Pháp lý vướng.
  - Tiến độ tổng.
- Alert priority:
  - Việc cần xử lý trong tuần.
  - Bước pháp lý đang bị vướng.
  - Hồ sơ thiếu quan trọng.
- Table nhanh:
  - Task quá hạn.
  - Task sắp đến hạn.
  - Documents cần bổ sung.

Acceptance:

- Số liệu lấy từ service/data layer.
- Click vào KPI dẫn đến danh sách đã filter tương ứng.
- User chỉ thấy dữ liệu thuộc quyền truy cập.

### 5.2.1 Role-specific Dashboards

| Role | Screen | Nội dung chính |
| --- | --- | --- |
| Admin | System Admin Dashboard | Users, roles, projects, configuration, audit alerts |
| Tổng giám đốc | Ban lãnh đạo | Dashboard lãnh đạo, kế hoạch đầu tư, thẩm quyền, phê duyệt, chỉ đạo, quyết định |
| Phó tổng giám đốc | Ban lãnh đạo - phạm vi được giao | Dự án được giao, phê duyệt, chỉ đạo điều hành, escalations, domain risk |
| Giám đốc dự án | Project Director Dashboard | Sức khỏe dự án, milestone, blockers, decision log, workload |
| Quản lý dự án | PM Workbench | Task, document, legal progress, meeting, weekly report |
| Tổ trưởng | Team Execution Board | Việc của tổ, gói việc, deadline, issue hiện trường |
| Pháp lý | Legal Workspace | Checklist pháp lý, hồ sơ pháp lý, submission, blocker |
| Kế toán | Finance Workspace | Budget, payment, contract, invoice, finance task |
| Thiết kế | Design Workspace | Design package, drawing, issue, review task |
| Kỹ thuật | Technical Workspace | Task kỹ thuật, quality item, hồ sơ kỹ thuật |
| Thi công | Construction Workspace | Schedule, site diary, quality checklist, nghiệm thu |
| Thư ký/Trợ lý | Assistant Workspace | Nhập liệu, biên bản họp, hồ sơ thiếu, report draft |
| Viewer | Read-only Dashboard | Tóm tắt dự án/report được cấp quyền |

### 5.2.2 Role-based Navigation

- Admin: Dashboard, Projects, Users, Settings, Audit, Reports.
- Tổng giám đốc/Phó tổng giám đốc: Ban lãnh đạo, Dashboard, Projects, Tasks, Documents, Legal, Meetings, Reports, Proposals, Finance read/approve.
- Giám đốc dự án/Quản lý dự án: Dashboard, Projects, Tasks, Documents, Legal, Meetings, Design, Construction, Reports.
- Tổ trưởng: Team Execution, Tasks, Documents, Construction package được giao.
- Kế toán: Finance, Documents tài chính, Tasks tài chính, Reports tài chính.
- Thiết kế: Design, Documents thiết kế, Tasks thiết kế, Reviews.
- Pháp lý: Legal, Documents pháp lý, Tasks pháp lý, Meetings liên quan.
- Viewer/external: chỉ module được cấp quyền.

### 5.3 Project List

Mục tiêu: quản lý danh mục dự án.

Thành phần:

- Search theo tên/mã dự án.
- Filter theo trạng thái, loại dự án, người phụ trách.
- Table columns:
  - Mã dự án.
  - Tên dự án.
  - Địa điểm.
  - Loại hình.
  - Chủ đầu tư.
  - Người phụ trách.
  - Trạng thái.
  - Cập nhật gần nhất.
- Action:
  - Tạo dự án.
  - Xem chi tiết.
  - Sửa.
  - Archive/xóa mềm.

### 5.4 Project Detail

Mục tiêu: một nơi duy nhất để xem toàn bộ dữ liệu của dự án.

Header:

- Tên dự án.
- Mã dự án.
- Trạng thái.
- Người phụ trách.
- Button sửa dự án.

Tabs:

- Tổng quan: thông tin cơ bản, chỉ số nhanh, alert.
- Công việc: task thuộc dự án.
- Hồ sơ: document thuộc dự án.
- Pháp lý: legal checklist.
- Dashboard: chỉ số riêng của dự án.

### 5.5 Task Management

Mục tiêu: tạo và theo dõi công việc theo dự án.

Table columns:

- Tên việc.
- Dự án.
- Người phụ trách.
- Deadline.
- Trạng thái.
- Ưu tiên.
- Nhóm việc.

Filter:

- Việc của tôi.
- Quá hạn.
- Sắp đến hạn.
- Theo dự án.
- Theo trạng thái.

Form:

- Project.
- Title.
- Description.
- Assignee.
- Due date.
- Status.
- Priority.
- Category.

### 5.6 Document Center

Mục tiêu: quản lý hồ sơ/link hồ sơ và trạng thái thiếu/đủ.

Table columns:

- Tên hồ sơ.
- Dự án.
- Loại hồ sơ.
- Version.
- Trạng thái.
- Người phụ trách.
- Ngày cập nhật.
- Link/file.

Form:

- Project.
- Title.
- Document type.
- Upload file hoặc external URL.
- Version.
- Status.
- Owner.

### 5.7 Trục 1 - BuildFlow hình thành dự án

Mục tiêu: gom Trục 1 thành 5 mục chính, không build theo danh sách 12 bước cũ như menu độc lập.

5 mục chính:

1. Ban lãnh đạo.
2. Tìm kiếm & phát triển dự án.
3. Pháp lý.
4. Thiết kế - Quy hoạch - Kỹ thuật - BIM.
5. Đề xuất - Họp - Phê duyệt nội bộ.

Trong giai đoạn hiện tại chỉ triển khai Mục 1 - Ban lãnh đạo. Mục 2, 3, 4, 5 chỉ xuất hiện như phân loại nghiệp vụ/workflow, không tạo route/module mới.

### 5.8 Legal Checklist Lite

Mục tiêu: theo dõi đúng 12 bước cũ của Trục 1 cho từng dự án như workflow/checklist nằm trong 5 mục chính.

View:

- Chọn dự án.
- Checklist đúng 12 bước cũ, không dùng 13 bước.
- Status badge.
- Assignee.
- Deadline.
- Completed date.
- Notes.
- Related documents.

Interaction:

- Cập nhật trạng thái inline hoặc qua drawer/modal.
- Khi status là `Bị vướng`, bắt buộc nhập notes.
- Không tạo menu riêng cho từng bước cũ.

### 5.9 Meetings

MVP có thể skeleton hoặc lightweight.

Thành phần:

- Danh sách cuộc họp theo dự án.
- Tạo meeting note.
- Ghi quyết định.
- Action item có thể tạo task.

## 6. User Flows

### Flow A - Founder/Tổng giám đốc xem tình hình

1. Đăng nhập.
2. Vào Ban lãnh đạo.
3. Xem dashboard lãnh đạo, kế hoạch đầu tư, đề xuất chờ duyệt, chỉ đạo điều hành và nhật ký quyết định.
4. Click vào đề xuất/chỉ đạo/cuộc họp cần xử lý.
5. Xem chi tiết dữ liệu liên quan.
6. Phê duyệt, yêu cầu chỉnh sửa, từ chối hoặc giao người phụ trách theo quyền.

### Flow B - PM tạo dự án

1. Vào Projects.
2. Click Tạo dự án.
3. Nhập thông tin dự án.
4. Submit.
5. Hệ thống tạo project code nếu chưa có.
6. Hệ thống tạo legal checklist mặc định.
7. Điều hướng sang Project Detail.

### Flow C - Assistant thêm hồ sơ

1. Vào Project Detail.
2. Mở tab Hồ sơ.
3. Thêm hồ sơ bằng file hoặc link.
4. Chọn loại hồ sơ, version, trạng thái.
5. Submit.
6. Dashboard cập nhật số hồ sơ thiếu/đủ.

### Flow D - Legal cập nhật pháp lý

1. Vào Legal Checklist.
2. Chọn dự án.
3. Cập nhật trạng thái bước pháp lý.
4. Nếu bị vướng, nhập ghi chú.
5. Dashboard hiển thị cảnh báo pháp lý vướng.

## 7. Empty, Loading, Error States

- Empty dashboard: hiển thị lời nhắc tạo dự án đầu tiên.
- Empty task list: hiển thị CTA tạo task.
- Empty documents: hiển thị CTA thêm hồ sơ.
- Loading: skeleton hoặc spinner nhỏ, tránh nhảy layout.
- Error: thông báo ngắn, có hành động thử lại.
- Unauthorized: hiển thị trang không có quyền truy cập.

## 8. Form Validation

Project:

- `name`: bắt buộc.
- `code`: duy nhất, nếu bỏ trống hệ thống tự sinh.
- `status`: bắt buộc.
- `area`: số dương nếu có.

Task:

- `project_id`: bắt buộc.
- `title`: bắt buộc.
- `due_date`: hợp lệ nếu có.
- `priority`: thuộc enum.

Document:

- `project_id`: bắt buộc.
- `title`: bắt buộc.
- Phải có `file_url` hoặc `external_url` trong MVP.
- `version`: bắt buộc nếu có nhiều bản.

Legal Step:

- `status`: bắt buộc.
- `notes`: bắt buộc khi status là `blocked`.

## 9. UX Acceptance Checklist

- UI tiếng Việt trên toàn bộ màn hình MVP.
- Sidebar và header hoạt động responsive.
- Không có số liệu dashboard hardcode trong component.
- Tất cả table chính có search/filter cơ bản.
- Task/document/legal step có trạng thái rõ ràng.
- Mobile không vỡ layout ở dashboard, task list và project detail.
- Các form có validation và error message.
- Các hành động destructive cần confirm.
