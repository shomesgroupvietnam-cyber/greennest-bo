# Chiến Lược Component

## Component Nền Của Design System

Nền hiện tại:

- Tailwind CSS.
- cấu hình shadcn/ui.
- primitive Radix.
- thư viện icon lucide-react.
- component nền hiện có: nút bấm.

Component nền cần bổ sung hoặc chuẩn hóa trước khi làm không gian làm việc mới:

- Nhãn trạng thái.
- Thẻ/khung nội dung.
- Bảng dữ liệu.
- Thẻ chuyển nội dung.
- Hộp thoại/hộp thoại cảnh báo.
- Ngăn trượt/ngăn kéo.
- Menu thả xuống.
- Ô chọn.
- Ô nhập/tìm kiếm.
- Gợi ý khi rê chuột.
- Separator.
- Vùng cuộn.
- Khung chờ/tải dữ liệu.
- Thông báo nhanh/phản hồi tại chỗ.

Các component nền này phải dùng token đã chốt: màu theo ngữ nghĩa, bo góc tối đa 8px, khoảng cách 4/8/12/16/24px, trạng thái focus rõ, chữ tiếng Việt không bị vỡ.

## Component Riêng Cho Sản Phẩm

### Khung Ứng Dụng Theo Quyền

**Mục đích:** Bố cục ứng dụng chính với thanh điều hướng bên, thanh trên, bộ đổi không gian làm việc/phạm vi và vùng nội dung.

**Cách dùng:** Dùng cho toàn bộ ứng dụng sau đăng nhập.

**Cấu trúc:** Thanh điều hướng theo quyền, thanh trên, breadcrumb/ngữ cảnh, bộ chọn không gian làm việc, bộ chọn phạm vi, vùng chứa nội dung.

**Phân cấp điều hướng:** Thanh điều hướng phải phân biệt 3 tầng: `Tổng quan Trục 1`, `Module 1 - Lãnh đạo` và `Quản trị hệ thống`. Chủ tịch dùng mặc định bề mặt điều hành theo phạm vi; Super Admin/Quản trị hệ thống mới thấy các mục quản trị kỹ thuật như cấu hình hệ thống, người dùng và phân quyền.

**Trạng thái:** desktop, ngăn kéo mobile, thu gọn, không có quyền, đang tải phiên đăng nhập.

**Trợ năng:** điều hướng bàn phím, focus dễ thấy, ngăn kéo có tên truy cập và nút đóng rõ.

### Tiêu Đề Không Gian Làm Việc

**Mục đích:** Cho người dùng biết đang ở không gian làm việc nào, phạm vi nào, vai trò nào.

**Nội dung:** Tên không gian làm việc, vai trò, phạm vi, thời gian cập nhật, hành động chính nếu có quyền.

**Hành động:** đổi không gian làm việc, đổi phạm vi, làm mới dữ liệu, mở bộ lọc.

**Biến thể:** Chủ tịch, Tổng Giám đốc, Giám đốc dự án, Trưởng bộ phận, Thư ký/Trợ lý.

### Dải KPI Tổng Quan

**Mục đích:** Hiển thị KPI trọng yếu theo phạm vi.

**Nội dung:** nhãn, giá trị, xu hướng, trạng thái, quyền dữ liệu, liên kết xem chi tiết.

**Trạng thái:** bình thường, cảnh báo, nguy hiểm, không có quyền, đang tải, chưa có dữ liệu.

**Tương tác:** bấm KPI để mở dữ liệu nguồn đã lọc.

### Hàng Đợi Ưu Tiên

**Mục đích:** Danh sách việc cần xử lý theo mức độ ưu tiên.

**Nội dung:** tiêu đề, loại việc, mức độ nghiêm trọng, người phụ trách, hạn xử lý, lý do, hành động tiếp theo.

**Biến thể:** hàng đợi phê duyệt, hàng đợi rủi ro, hàng đợi leo thang, hàng đợi việc ưu tiên.

**Tương tác:** mở chi tiết, lọc, sắp xếp, thao tác nhanh nếu có quyền.

### Bản Đồ Rủi Ro / Bản Đồ Áp Lực Hạn Xử Lý

**Mục đích:** Hiển thị mức độ rủi ro hoặc áp lực hạn xử lý.

**Nội dung:** nhóm rủi ro, số lượng, mức độ nghiêm trọng, dự án bị ảnh hưởng, xem chi tiết.

**Trạng thái:** xanh/vàng/đỏ/nghiêm trọng với nhãn rõ.

**Trợ năng:** không phụ thuộc màu; mỗi ô có chữ và gợi ý/nhãn.

### Bảng Xử Lý Phê Duyệt

**Mục đích:** Xử lý phê duyệt với đủ ngữ cảnh.

**Nội dung:** tóm tắt yêu cầu, chính sách áp dụng, số tiền, hồ sơ đính kèm, lịch sử, hành động quyết định.

**Hành động:** duyệt, từ chối, trả lại/yêu cầu chỉnh sửa, chuyển tiếp/leo thang, yêu cầu họp, tạm giữ.

**Kiểm tra hợp lệ:** từ chối/trả lại bắt buộc lý do; bình luận khi duyệt là tùy chọn.

### Ngăn Chi Tiết Dữ Liệu Nguồn

**Mục đích:** Mở dữ liệu nguồn từ KPI/rủi ro/phê duyệt mà không làm mất ngữ cảnh dashboard.

**Nội dung:** tóm tắt, bản ghi liên quan, người phụ trách, trạng thái, hạn xử lý, dòng thời gian, nhật ký kiểm toán.

**Biến thể:** ngăn bên trên desktop, ngăn toàn màn hình trên mobile.

### Dòng Thời Gian Hoạt Động / Nhật Ký Kiểm Toán

**Mục đích:** Cho thấy ai làm gì, lúc nào, thay đổi gì, lý do gì.

**Nội dung:** người thao tác, hành động, thời điểm, trạng thái cũ/mới, bình luận, tệp đính kèm.

**Cách dùng:** phê duyệt, quyết định, rủi ro, cuộc họp, thay đổi phân quyền.

### Bảng AI Theo Ngữ Cảnh

**Mục đích:** AI hỗ trợ trong đúng ngữ cảnh, không thay thế quy trình nghiệp vụ.

**Biến thể:** AI hỗ trợ lãnh đạo, AI kiểm checklist, AI chuẩn bị họp, AI gợi ý chương trình họp, AI tóm tắt.

**Quy tắc:** luôn là bản nháp/gợi ý, có nguồn trích dẫn, có trạng thái đề xuất/đã chấp nhận/đã từ chối/đã thực thi/thất bại nếu sinh hành động.

## Chiến Lược Triển Khai Component

Ưu tiên xây component theo 3 lớp:

1. UI nền: nhãn trạng thái, khung nội dung, bảng, thẻ chuyển nội dung, hộp thoại, ngăn trượt, menu thả xuống, ô nhập, ô chọn, gợi ý, khung chờ.
2. Pattern vận hành: Dải KPI Tổng Quan, Hàng Đợi Ưu Tiên, Bản Đồ Rủi Ro, Bảng Xử Lý Phê Duyệt, Ngăn Chi Tiết Dữ Liệu Nguồn, Dòng Thời Gian/Nhật Ký Kiểm Toán.
3. Tổ hợp không gian làm việc theo vai trò: Không Gian Chủ Tịch, Không Gian Tổng Giám Đốc, Không Gian Giám Đốc Dự Án, Không Gian Trưởng Bộ Phận, Không Gian Thư Ký/Trợ Lý.

Không tạo mỗi không gian làm việc như một trang hardcode riêng. Không gian làm việc nên là tổ hợp từ cùng bộ pattern, thay nguồn dữ liệu, quyền, mức ưu tiên và hành động theo vai trò/phạm vi.

Component phải nhận dữ liệu có cấu trúc từ service/repository, không hardcode số liệu trong UI.

## Lộ Trình Triển Khai

Giai đoạn 1 - UI nền:

- Nhãn trạng thái.
- Khung nội dung/thẻ.
- Bảng dữ liệu.
- Hộp thoại/hộp thoại cảnh báo.
- Ngăn trượt/ngăn kéo.
- Thẻ chuyển nội dung.
- Ô nhập/tìm kiếm.
- Ô chọn/menu thả xuống.
- Gợi ý khi rê chuột.
- Trạng thái đang tải/chưa có dữ liệu/lỗi/không có quyền.

Giai đoạn 2 - Pattern Dashboard Vận Hành:

- Khung Ứng Dụng Theo Quyền.
- Tiêu Đề Không Gian Làm Việc.
- Dải KPI Tổng Quan.
- Hàng Đợi Ưu Tiên.
- Bản Đồ Rủi Ro / Bản Đồ Áp Lực Hạn Xử Lý.
- Dòng Thời Gian Hoạt Động / Nhật Ký Kiểm Toán.
- Ngăn Chi Tiết Dữ Liệu Nguồn.

Giai đoạn 3 - Component Hành Động Quy Trình:

- Bảng Xử Lý Phê Duyệt.
- Bảng Quyết Định/Giao Việc.
- Bảng Chuẩn Bị Họp.
- Bảng Quy Trình Checklist.
- Bảng AI Theo Ngữ Cảnh.

Giai đoạn 4 - Lắp Ghép Không Gian Làm Việc Theo Vai Trò:

- Không Gian Chủ Tịch.
- Không Gian Tổng Giám Đốc.
- Không Gian Giám Đốc Dự Án.
- Không Gian Trưởng Bộ Phận.
- Không Gian Thư Ký/Trợ Lý.

Giai đoạn 5 - Responsive Và QA:

- Ngăn kéo mobile và bố cục hàng đợi ưu tiên dạng xếp chồng.
- Bảng dữ liệu chuyển thành danh sách trên màn hình nhỏ.
- Kiểm tra bàn phím/focus.
- Trạng thái không có quyền/403.
- Trạng thái đang tải/chưa có dữ liệu/lỗi.
- Review ảnh chụp hoặc visual regression cho các không gian làm việc chính.
