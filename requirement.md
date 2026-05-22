# GreenNest BuildFlow - Requirement Document

> Documentation status: MVP execution snapshot. For long-term platform requirements, use `blueprint/07-platform-requirements.md`. For AI Assistant/RAG strategy, use `blueprint/14-ai-assistant-strategy.md`.

Phiên bản: 1.0  
Ngày lập: 16/05/2026  
Nguồn: `GreenNest_BuildFlow_Master_Blueprint_V1_Buoc_1.docx`  
Mục tiêu: định nghĩa yêu cầu sản phẩm để Codex, Claude và đội phát triển triển khai thống nhất toàn bộ MVP V1.

## 1. Tóm tắt sản phẩm

GreenNest BuildFlow là web app quản lý vòng đời dự án đầu tư xây dựng và phát triển nhà ở. Hệ thống gom các quy trình rời rạc như pháp lý, quy hoạch, thiết kế, thi công, hồ sơ, công việc, tài chính, họp, báo cáo và ra quyết định vào một nền tảng điều hành tập trung.

MVP V1 tập trung vào quản lý dự án, công việc, hồ sơ, checklist pháp lý sơ bộ, dashboard và phân quyền cơ bản. Các module thi công, tài chính nâng cao và AI sẽ được chuẩn bị về kiến trúc nhưng chưa build sâu trong MVP V1.

## 2. Người dùng mục tiêu

- Founder/Chủ đầu tư: xem toàn cảnh dự án, rủi ro, việc chậm, hồ sơ thiếu, pháp lý vướng.
- Admin/PM: quản lý dự án, công việc, hồ sơ, checklist và người phụ trách.
- Legal: cập nhật hồ sơ pháp lý, trạng thái pháp lý và ghi chú vướng mắc.
- Engineer: cập nhật task kỹ thuật, hồ sơ thiết kế và tiến độ kỹ thuật.
- Accountant: dùng ở giai đoạn sau cho dữ liệu tài chính, hợp đồng, chi phí và dòng tiền.
- Assistant: nhập liệu, chuẩn hóa hồ sơ, tạo báo cáo, hỗ trợ vận hành.
- Viewer: chỉ xem dữ liệu được chia sẻ.

## 3. Nguyên tắc bắt buộc

- Đơn giản trước, mở rộng sau: MVP phải dễ dùng, ít màn hình, không build lan man.
- Dữ liệu là trung tâm: mọi module xoay quanh dự án, hồ sơ, công việc, người phụ trách, trạng thái, deadline và lịch sử thay đổi.
- Một nguồn sự thật: dữ liệu dự án chỉ nhập một lần và dùng lại ở dashboard, báo cáo, hồ sơ, nhiệm vụ.
- Không hardcode nghiệp vụ rải rác: trạng thái, loại hồ sơ, vai trò, bước pháp lý phải nằm ở constants tập trung hoặc database.
- Có thể nghiệm thu: mỗi chức năng có input, xử lý, output, quyền truy cập và lỗi thường gặp.
- Chuẩn enterprise từ nền móng: TypeScript, cấu trúc rõ, bảo mật, phân quyền, audit log, naming nhất quán.
- Tiếng Việt trước: UI, label, trạng thái và thông báo mặc định dùng tiếng Việt.

## 4. Mô hình 3 trục hệ thống

### Trục 1 - BuildFlow hình thành dự án

Trục 1 quản lý giai đoạn hình thành dự án theo 5 mục chính thay vì menu phẳng nhiều bước:

1. Ban lãnh đạo.
2. Tìm kiếm & phát triển dự án.
3. Pháp lý.
4. Thiết kế - Quy hoạch - Kỹ thuật - BIM.
5. Đề xuất - Họp - Phê duyệt nội bộ.

Các bước cũ của Trục 1 được chốt là 12 bước, không dùng 13 bước. 12 bước này không bị xóa, không trở thành menu độc lập, mà là workflow/checklist nằm trong 5 mục chính để dễ dùng, dễ mở rộng AI và dễ nghiệm thu theo từng mục.

Phân loại 12 bước cũ:

| Bước cũ | Mục chính |
| --- | --- |
| Khảo sát quỹ đất | Tìm kiếm & phát triển dự án |
| Phân tích quy hoạch | Thiết kế - Quy hoạch - Kỹ thuật - BIM |
| Hồ sơ đề xuất đầu tư | Tìm kiếm & phát triển dự án; liên kết luồng Đề xuất - Họp - Phê duyệt nội bộ |
| Chủ trương đầu tư | Pháp lý; phê duyệt chủ trương nội bộ thuộc Ban lãnh đạo |
| Quy hoạch chi tiết 1/500 | Thiết kế - Quy hoạch - Kỹ thuật - BIM; phần nộp/nhận phản hồi cơ quan liên kết Pháp lý |
| Thiết kế cơ sở | Thiết kế - Quy hoạch - Kỹ thuật - BIM |
| Báo cáo nghiên cứu khả thi | Thiết kế - Quy hoạch - Kỹ thuật - BIM; phần hiệu quả đầu tư liên kết Tìm kiếm & phát triển dự án |
| Đánh giá môi trường | Pháp lý |
| PCCC | Pháp lý; hồ sơ kỹ thuật liên kết Thiết kế - Quy hoạch - Kỹ thuật - BIM |
| Giao đất/thuê đất | Pháp lý |
| Chấp nhận chủ đầu tư | Pháp lý |
| Giấy phép xây dựng | Pháp lý |

Hiện tại chỉ triển khai trước Mục 1 - Ban lãnh đạo. Chưa triển khai Mục 2, 3, 4, 5 thành route/module mới nếu chưa có lệnh tiếp theo.

### Trục 2 - Thi công và triển khai

Quản lý tiến độ thi công, nhà thầu, vật tư, chất lượng, nhật ký công trường, nghiệm thu và thay đổi thiết kế.

### Trục 3 - Điều hành, tài chính và vận hành

Quản lý dashboard, tài chính, dòng tiền, họp, báo cáo, KPI, quyết định, bài học kinh nghiệm và AI hỗ trợ điều hành.

## 5. Phạm vi MVP V1

| Mã | Module | Chức năng chính | Ưu tiên |
| --- | --- | --- | --- |
| M1 | Project Core | Tạo/sửa/xem dự án, thông tin cơ bản, trạng thái, loại dự án | Bắt buộc |
| M2 | Task Management | Tạo việc, deadline, người phụ trách, trạng thái, mức ưu tiên | Bắt buộc |
| M3 | Document Center | Upload/link hồ sơ, phân loại, version, trạng thái thiếu/đủ | Bắt buộc |
| M4 | Legal Checklist Lite | Checklist 12 bước cũ của Trục 1, ngày dự kiến, ngày hoàn thành, tình trạng | Bắt buộc |
| M5 | Dashboard | Tổng quan dự án, việc chậm, hồ sơ thiếu, chỉ tiêu chính, tiến độ | Bắt buộc |
| M6 | Auth, Users & Roles Basic | Đăng nhập, mời người dùng, phân quyền theo role công ty/dự án, người phụ trách | Bắt buộc |

## 6. Module Requirements

### M1 - Project Core

Yêu cầu chức năng:

- Tạo dự án mới với tên dự án, mã dự án, địa điểm, diện tích, loại hình, chủ đầu tư, người phụ trách và trạng thái.
- Xem danh sách dự án với search, filter, sort và pagination.
- Xem trang chi tiết dự án với tab: Tổng quan, Công việc, Hồ sơ, Pháp lý, Dashboard.
- Sửa thông tin dự án.
- Xóa mềm dự án hoặc archive, không xóa cứng dữ liệu chính.
- Khi tạo dự án, hệ thống tự sinh checklist pháp lý mặc định.

Tiêu chí nghiệm thu:

- User có quyền tạo được dự án và thấy dự án trong danh sách.
- Dự án có mã duy nhất.
- Trang chi tiết dự án hiển thị đúng dữ liệu liên quan.
- Refresh không mất dữ liệu.

### M2 - Task Management

Yêu cầu chức năng:

- Task phải gắn với một dự án cụ thể.
- Mỗi task có title, mô tả, người phụ trách, deadline, trạng thái, mức ưu tiên và nhóm công việc.
- Lọc được việc quá hạn, việc sắp đến hạn, việc của tôi và việc theo dự án.
- Cho phép cập nhật trạng thái task.
- Dashboard lấy dữ liệu task thật, không dùng số cứng trong component.

Tiêu chí nghiệm thu:

- Tạo/sửa/xem task trong dự án.
- Task quá hạn được nhận diện bằng `due_date` và `status`.
- Danh sách task có filter cơ bản.

### M3 - Document Center

Yêu cầu chức năng:

- Hồ sơ có thể là file upload hoặc link ngoài trong giai đoạn đầu.
- Mỗi hồ sơ có loại hồ sơ, tên, phiên bản, trạng thái, người phụ trách và ngày cập nhật.
- Có trạng thái thiếu/đủ/cần bổ sung/đang xử lý.
- Dashboard hiển thị hồ sơ thiếu hoặc quá hạn bổ sung.
- Version hồ sơ phải được lưu và hiển thị.

Tiêu chí nghiệm thu:

- Thêm được hồ sơ bằng link hoặc file.
- Phân loại hồ sơ theo dự án.
- Thấy được trạng thái thiếu/đủ.

### M4 - Legal Checklist Lite

Yêu cầu chức năng:

- Khi tạo dự án, khởi tạo checklist mặc định gồm 12 bước cũ của Trục 1.
- Checklist này là workflow nội bộ bên trong 5 mục chính của Trục 1, không phải menu Trục 1 độc lập.
- Mỗi bước có trạng thái: Chưa bắt đầu, Đang làm, Chờ cơ quan, Đã xong, Bị vướng.
- Mỗi bước có ghi chú, deadline, file liên quan và người phụ trách.
- Cho phép cập nhật trạng thái, deadline, người phụ trách và ghi chú.
- Dashboard hiển thị bước pháp lý đang vướng.

Checklist mặc định Trục 1 gồm đúng 12 bước:

1. Khảo sát quỹ đất.
2. Phân tích quy hoạch.
3. Hồ sơ đề xuất đầu tư.
4. Chủ trương đầu tư.
5. Quy hoạch chi tiết 1/500.
6. Thiết kế cơ sở.
7. Báo cáo nghiên cứu khả thi.
8. Đánh giá môi trường.
9. PCCC.
10. Giao đất/thuê đất.
11. Chấp nhận chủ đầu tư.
12. Giấy phép xây dựng.

### M5 - Dashboard

Yêu cầu chức năng:

- Hiển thị số dự án.
- Hiển thị tiến độ tổng.
- Hiển thị số việc chậm.
- Hiển thị số hồ sơ thiếu.
- Hiển thị số bước pháp lý bị vướng.
- Có card cảnh báo ưu tiên cho Founder/CEO.
- Có bảng nhanh các việc cần xử lý trong tuần.

Tiêu chí nghiệm thu:

- Số liệu dashboard được tính từ data source thật hoặc mock service có cấu trúc.
- Khi cập nhật task, document hoặc legal step, dashboard phản ánh thay đổi.

### M6 - Auth, Users & Roles Basic

Yêu cầu chức năng:

- Hỗ trợ đăng nhập, đăng xuất, reset mật khẩu và mời người dùng.
- Hỗ trợ role hệ thống và role theo dự án.
- Role tối thiểu cần chuẩn bị: admin, tổng giám đốc, phó tổng giám đốc, giám đốc dự án, quản lý dự án, tổ trưởng, pháp lý, kế toán, thiết kế, kỹ thuật, thi công, thư ký/trợ lý, viewer.
- Các role mở rộng: mua hàng, kiểm soát nội bộ, nhà thầu, tư vấn, super admin.
- Mỗi role có màn hình mặc định phù hợp công việc.
- Sidebar chỉ hiện module user có quyền truy cập.
- Mọi mutation phải kiểm tra permission server-side.
- Cấu trúc phải sẵn sàng mở rộng RBAC/ABAC sau này.
- Nguồn chuẩn chi tiết: `blueprint/12-auth-roles-permissions.md`.

Role screen mặc định:

| Role | Screen mặc định |
| --- | --- |
| Admin | System Admin Dashboard |
| Tổng giám đốc | Executive Portfolio Dashboard |
| Phó tổng giám đốc | Assigned Portfolio Dashboard |
| Giám đốc dự án | Project Director Dashboard |
| Quản lý dự án | PM Workbench |
| Tổ trưởng | Team Execution Board |
| Pháp lý | Legal Workspace |
| Kế toán | Finance Workspace |
| Thiết kế | Design Workspace |
| Kỹ thuật | Technical Workspace |
| Thi công | Construction Workspace |
| Thư ký/Trợ lý | Assistant Workspace |
| Viewer | Read-only Dashboard |

## 7. Workflow MVP V1

| Mã | Workflow | Trigger | Kết quả |
| --- | --- | --- | --- |
| WF-01 | Tạo dự án | User nhập thông tin dự án | Sinh mã dự án, tạo dashboard, tạo checklist pháp lý mặc định |
| WF-02 | Tạo công việc | User tạo task trong dự án | Task xuất hiện ở danh sách việc, dashboard và lịch nhắc |
| WF-03 | Thêm hồ sơ | User upload/link hồ sơ | Hồ sơ được phân loại, cập nhật trạng thái thiếu/đủ |
| WF-04 | Cập nhật pháp lý | User cập nhật bước pháp lý | Dashboard cập nhật tiến độ pháp lý và cảnh báo vướng |
| WF-05 | Họp/đánh giá sơ bộ | User ghi nhận ý kiến và action item | Sinh công việc theo quyết định họp |
| WF-06 | Báo cáo tuần | Hệ thống tổng hợp dữ liệu | Xuất báo cáo việc chậm, hồ sơ thiếu, rủi ro |

## 8. Non-functional Requirements

- Performance: màn hình danh sách cơ bản phản hồi dưới 2 giây với dữ liệu MVP.
- Security: bắt buộc xác thực trước khi truy cập app; API phải kiểm tra quyền.
- Data integrity: không mất dữ liệu khi refresh; mọi entity chính có `created_at`, `updated_at` khi phù hợp.
- Auditability: thao tác quan trọng cần chuẩn bị audit log.
- Maintainability: code chia rõ `components`, `modules`, `services`, `types`, `constants`, `lib`.
- Responsive: dùng được trên laptop và điện thoại, ưu tiên dashboard và cập nhật task nhanh.
- Accessibility: form có label rõ, màu trạng thái không phải tín hiệu duy nhất.
- Localization: tiếng Việt mặc định, enum/status dùng key ổn định để có thể dịch sau.

## 9. Out of Scope MVP V1

- Tài chính dự án đầy đủ.
- Dòng tiền, hợp đồng và thanh toán nâng cao.
- Nhật ký công trường chi tiết.
- Quản lý vật tư/tồn kho.
- AI recommendation thật.
- Mobile app native.
- Phân quyền RBAC quá sâu theo từng field.
- Tích hợp chữ ký số hoặc e-government.

## 10. Definition of Done

- Tạo được tài khoản và đăng nhập.
- Tạo được dự án mới và xem trang chi tiết dự án.
- Tạo được công việc gắn với dự án, có deadline và người phụ trách.
- Thấy được việc quá hạn trên dashboard.
- Tạo được hồ sơ/link hồ sơ, đánh dấu thiếu/đủ.
- Cập nhật được checklist 12 bước cũ của Trục 1 mà không tạo menu riêng cho từng bước.
- Dashboard hiển thị tổng quan đúng theo dữ liệu nhập.
- Có auth và phân quyền cơ bản theo role công ty/dự án.
- Giao diện tiếng Việt, dùng được trên laptop và điện thoại.
- Dữ liệu lưu trong database hoặc mock persistence rõ ràng theo giai đoạn.
- Code có cấu trúc rõ: components, services, types, schema, utils.
- Có seed data mẫu để demo.
