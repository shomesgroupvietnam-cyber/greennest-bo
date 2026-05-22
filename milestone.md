# GreenNest BuildFlow - Milestone Plan

> Documentation status: sprint execution plan. For long-term roadmap, use `blueprint/04-roadmap.md`. For documentation ownership, use `docs/DOCUMENTATION_STANDARD.md`.

Phiên bản: 1.0  
Ngày lập: 16/05/2026  
Mục tiêu: chia MVP V1 thành các sprint nhỏ để Codex/Claude triển khai tuần tự, dễ nghiệm thu, không build lan man.

## 1. Delivery Strategy

MVP V1 triển khai theo sprint nhỏ. Mỗi sprint phải có:

- Mục tiêu rõ.
- Phạm vi giới hạn.
- File/module dự kiến chỉnh.
- Tiêu chí nghiệm thu.
- Demo hoặc seed data nếu cần.
- Báo cáo các điểm chưa xong.

Không mở rộng sang module ngoài MVP nếu sprint hiện tại chưa đạt nghiệm thu.

## 2. Milestone Overview

| Sprint | Tên | Nội dung | Kết quả nghiệm thu |
| --- | --- | --- | --- |
| Sprint 0 | Setup dự án | Khởi tạo Next.js, TypeScript, Tailwind, layout, auth skeleton, module skeleton | Chạy được app có login/layout |
| Sprint 1 | Project Core | CRUD project, project detail, trạng thái dự án | Tạo/sửa/xem/archive dự án |
| Sprint 2 | Task Management | CRUD task, filter theo dự án, trạng thái, deadline | Quản lý được việc và thấy việc quá hạn |
| Sprint 3 | Document Center | Upload/link hồ sơ, phân loại, version, trạng thái | Biết hồ sơ thiếu/đủ theo dự án |
| Sprint 4 | Legal Checklist Lite | Checklist 12 bước cũ của Trục 1, cập nhật trạng thái, assignee, deadline | Theo dõi pháp lý cơ bản mà không tạo menu riêng cho từng bước |
| Sprint 5 | Dashboard | KPI cards, việc chậm, hồ sơ thiếu, pháp lý vướng | Founder xem được toàn cảnh dự án |
| Sprint 6 | Auth, Users & Roles Basic | Đăng nhập, mời người dùng, role công ty/dự án, guard route, role dashboards | Làm việc nhóm an toàn theo quyền |
| Sprint 7 | QA & Polish | Kiểm thử, responsive, seed data, sửa lỗi UI | MVP dùng thử thực tế |
| Sprint 8 | Role Permissions & Workspaces | Màn hình riêng theo role, navigation theo quyền, contractor portal, route guards | Mỗi role thấy đúng việc, đúng dữ liệu, đúng quyền |

## 3. Sprint 0 - Setup dự án

### Goal

Tạo nền móng web app đúng kiến trúc để các sprint sau phát triển nhanh.

### Scope

- Khởi tạo Next.js + TypeScript.
- Cấu hình Tailwind CSS.
- Cài hoặc scaffold shadcn/ui nếu phù hợp.
- Tạo app layout: sidebar trái, header trên, vùng nội dung chính.
- Tạo route skeleton:
  - `/login`.
  - `/dashboard`.
  - `/projects`.
  - `/tasks`.
  - `/documents`.
  - `/legal`.
  - `/meetings`.
  - `/users`.
  - `/settings`.
- Tạo constants cơ bản cho roles/status.
- Tạo mock auth/session nếu chưa tích hợp auth thật.
- Tạo seed/mock data có cấu trúc.

### Acceptance Criteria

- `npm run dev` chạy được.
- App hiển thị layout tiếng Việt.
- Các route chính mở được.
- Sidebar điều hướng đúng.
- Không có business logic hardcode lung tung trong component.

### Suggested Files

- `app/layout.tsx`.
- `app/(dashboard)/dashboard/page.tsx`.
- `components/layout/app-sidebar.tsx`.
- `components/layout/app-header.tsx`.
- `constants/statuses.ts`.
- `constants/roles.ts`.
- `modules/*`.

## 4. Sprint 1 - Project Core

### Goal

Dự án trở thành entity trung tâm của hệ thống.

### Scope

- Project type/interface.
- Project service/repository.
- Project list page.
- Create project form.
- Edit project form.
- Project detail page.
- Archive/xóa mềm.
- Tự sinh project code nếu user không nhập.
- Sau khi tạo project, gọi logic tạo legal checklist mặc định.

### Acceptance Criteria

- Tạo được project mới.
- Xem danh sách project.
- Search/filter theo trạng thái cơ bản.
- Xem project detail.
- Sửa được thông tin project.
- Archive project không xóa dữ liệu cứng.
- Legal checklist mặc định được tạo khi project được tạo.

### Risks

- Nếu chưa có DB thật, cần mock repository có API tương tự DB service để không phải viết lại nhiều.

## 5. Sprint 2 - Task Management

### Goal

Quản lý công việc gắn với dự án và nhận diện việc quá hạn.

### Scope

- Task type/interface.
- Task service/repository.
- Task list global.
- Task tab trong project detail.
- Create/edit task form.
- Filter:
  - Việc của tôi.
  - Quá hạn.
  - Sắp đến hạn.
  - Theo dự án.
  - Theo trạng thái.
- Status và priority constants.

### Acceptance Criteria

- Tạo được task gắn với project.
- Cập nhật được assignee, deadline, status, priority.
- Danh sách task hiển thị việc quá hạn.
- Project detail hiển thị task của đúng project.
- Dashboard service có thể đọc overdue tasks.

## 6. Sprint 3 - Document Center

### Goal

Quản lý hồ sơ dự án bằng link hoặc file upload.

### Scope

- Document type/interface.
- Document service/repository.
- Document list global.
- Document tab trong project detail.
- Add document form.
- Hỗ trợ external URL trước; file upload nếu storage sẵn sàng.
- Version và status.
- Filter theo project, doc type, status.

### Acceptance Criteria

- Thêm được document gắn với project.
- Document có loại hồ sơ, version, status.
- Đánh dấu thiếu/đủ/cần bổ sung.
- Project detail hiển thị document của đúng project.
- Dashboard service có thể đọc missing documents.

## 7. Sprint 4 - Legal Checklist Lite

### Goal

Theo dõi đúng 12 bước cũ của Trục 1 cho từng dự án như workflow/checklist bên trong 5 mục chính: Ban lãnh đạo; Tìm kiếm & phát triển dự án; Pháp lý; Thiết kế - Quy hoạch - Kỹ thuật - BIM; Đề xuất - Họp - Phê duyệt nội bộ.

### Scope

- Constants cho 12 legal steps mặc định.
- Không dùng 13 bước.
- Không tạo menu độc lập cho từng bước cũ.
- LegalStep type/interface.
- Legal service/repository.
- Checklist view theo project.
- Update status, assignee, due date, completed date, notes.
- Liên kết document cơ bản nếu dữ liệu đã có.
- Bắt buộc notes khi status là `blocked`.

### Acceptance Criteria

- Project mới có đủ 12 legal steps.
- Cập nhật được trạng thái từng bước.
- Bước bị vướng hiển thị rõ.
- Dashboard service có thể đọc blocked legal steps.

## 8. Sprint 5 - Dashboard

### Goal

Founder/CEO xem được bức tranh toàn dự án.

### Scope

- Dashboard summary service.
- KPI cards:
  - Tổng dự án.
  - Việc quá hạn.
  - Hồ sơ thiếu.
  - Pháp lý vướng.
  - Tiến độ tổng.
- Alert priority cards.
- Table việc cần xử lý trong tuần.
- Table hồ sơ cần bổ sung.
- Table pháp lý bị vướng.
- Link từ KPI sang danh sách đã filter.

### Acceptance Criteria

- Dashboard phản ánh dữ liệu project/task/document/legal step.
- Không dùng số hardcode trong component.
- Cập nhật task/document/legal step làm số liệu dashboard thay đổi.
- Dashboard responsive trên mobile.

## 9. Sprint 6 - Auth, Users & Roles Basic

### Goal

Có auth và phân quyền cơ bản theo role doanh nghiệp/dự án để dùng nhóm an toàn.

### Scope

- User type/interface.
- Role constants theo `blueprint/12-auth-roles-permissions.md`.
- Permission utility `can(user, action, resource)`.
- Route guard hoặc page guard.
- UI guard cho button/action.
- Users page skeleton hoặc basic list.
- Nếu có auth thật: map auth user sang app user profile.
- Role-specific dashboard routing.
- Sidebar render theo permission.
- Audit role changes.

### Acceptance Criteria

- Admin, phó tổng giám đốc, tổ trưởng, kế toán, thiết kế và viewer có quyền khác nhau.
- Viewer không thấy action chỉnh sửa.
- API/server action vẫn kiểm tra quyền, không chỉ ẩn UI.
- Role dễ mở rộng RBAC sau này.
- User được redirect tới screen mặc định theo role.

## 10. Sprint 7 - QA & Polish

### Goal

Làm MVP đủ ổn để dùng thử thực tế.

### Scope

- Seed data demo.
- Responsive check.
- Empty/loading/error states.
- Validate forms.
- Fix UI overflow.
- Basic tests.
- README hướng dẫn chạy local.
- Review lại docs nếu implementation khác tài liệu.

### Acceptance Criteria

- MVP chạy local ổn định.
- Có seed data demo.
- Các luồng chính chạy được:
  - Login.
  - Create project.
  - Create task.
  - Add document.
  - Update legal step.
  - View dashboard.
- UI không vỡ trên desktop/mobile.
- README có cách chạy.

## 11. Sprint 8 - Role Permissions & Workspaces

### Goal

Biến RBAC từ nền tảng kỹ thuật thành trải nghiệm business rõ ràng cho từng vai trò: Admin, Tổng giám đốc, Phó tổng giám đốc, Giám đốc dự án, Quản lý dự án, Tổ trưởng, Pháp lý, Kế toán, Thiết kế, Kỹ thuật, Thi công, Thư ký/Trợ lý, Nhà thầu, Tư vấn và Viewer.

### Scope

- Đọc và bám theo `blueprint/12-auth-roles-permissions.md` và `blueprint/13-role-workspaces.md`.
- Tạo role-to-default-route map.
- Tạo permission-to-navigation map.
- Tạo shared `RoleWorkspaceShell`.
- Tạo hoặc scaffold màn hình:
  - Admin Workspace.
  - Executive Portfolio Dashboard.
  - Project Director/PM Workbench.
  - Team Leader Workspace.
  - Legal Workspace.
  - Accounting Workspace.
  - Design Workspace.
  - Technical Workspace.
  - Construction Workspace.
  - Assistant Workspace.
  - Contractor Portal.
  - Consultant Portal.
  - Read-only Viewer Dashboard.
- Sidebar/mobile nav hiển thị theo permission.
- Direct route access guard cho từng workspace.
- Mock role switch có đủ role để QA.
- Demo seed data có scenario cho nhà thầu, kế toán, thiết kế, tổ trưởng.
- Permission tests cho navigation và route access.
- Contractor data isolation test: nhà thầu chỉ thấy dữ liệu được giao.

### Acceptance Criteria

- Mỗi role bắt buộc có default screen.
- Admin thấy Users/Settings/Audit; role thường không thấy.
- Phó tổng giám đốc thấy executive/assigned portfolio workspace.
- Tổ trưởng thấy team execution workspace.
- Kế toán thấy finance workspace placeholder hoặc finance-ready workspace.
- Thiết kế thấy design workspace placeholder hoặc design-ready workspace.
- Nhà thầu thấy Contractor Portal và chỉ thấy task/document/package được giao.
- Viewer không thấy action tạo/sửa/xóa.
- Sidebar thay đổi theo role.
- Truy cập URL trực tiếp bị chặn nếu không đủ quyền.
- Server actions vẫn dùng centralized permission helper.
- Unit/E2E tests cover tối thiểu admin, phó tổng giám đốc, tổ trưởng, kế toán, thiết kế, nhà thầu, viewer.
- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` pass.

## 12. Backlog Sau MVP V1

- Tài chính dự án.
- Hợp đồng và thanh toán.
- Quản lý nhà thầu.
- Vật tư và tồn kho.
- Nhật ký công trường.
- Nghiệm thu.
- Báo cáo tuần/tháng/quý.
- AI hỗ trợ phát hiện rủi ro, thiếu hồ sơ và việc ưu tiên.
- Phân quyền RBAC chi tiết.
- Tích hợp email/notification.
- Tích hợp chữ ký số hoặc hệ thống lưu trữ doanh nghiệp.

## 12. Agent Working Protocol

Mỗi task cho Codex/Claude nên bắt đầu bằng:

```text
Đọc requirement.md, design.md, architecture.md và milestone.md.
Triển khai đúng sprint hiện tại.
Không mở rộng ngoài phạm vi sprint.
Giữ UI tiếng Việt.
Không hardcode status/role rải rác.
Sau khi xong, báo cáo file đã thay đổi, cách chạy, test đã chạy và phần còn lại.
```

Khi kết thúc sprint, agent phải báo cáo:

- Sprint đã làm.
- File đã tạo/sửa.
- Cách chạy local.
- Test/verification đã chạy.
- Acceptance criteria nào đã đạt.
- Gaps hoặc quyết định kỹ thuật cần xác nhận.
