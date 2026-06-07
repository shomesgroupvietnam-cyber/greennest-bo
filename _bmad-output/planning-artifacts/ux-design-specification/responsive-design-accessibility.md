# Thiết Kế Responsive Và Trợ Năng

## Chiến Lược Responsive

GREENNEST BUILDFLOW là ứng dụng web responsive với desktop là bề mặt làm việc chính.

**Desktop**

Desktop phải tận dụng không gian màn hình cho:

- Thanh điều hướng theo quyền.
- Thanh trên có bộ đổi không gian làm việc/phạm vi.
- Dải KPI.
- Dashboard nhiều cột.
- Hàng đợi ưu tiên.
- Bản đồ rủi ro / bản đồ áp lực hạn xử lý.
- Ngăn xem chi tiết bên cạnh.
- Dòng thời gian / nhật ký kiểm toán.
- Bảng dữ liệu có lọc/sắp xếp.

Desktop là nơi xử lý các luồng phức tạp như phê duyệt, phân quyền, cấu hình chính sách, review nhật ký kiểm toán, quản lý checklist và phân tích nhiều dự án.

**Tablet**

Tablet dùng layout giản lược:

- Thanh điều hướng có thể thu gọn hoặc chuyển thành ngăn kéo.
- Dashboard giảm số cột.
- Ngăn bên có thể chuyển thành ngăn trượt.
- Bảng ưu tiên cột quan trọng, trường phụ đưa vào dòng mở rộng/chi tiết.
- Vùng chạm phải đủ lớn cho thao tác bằng tay.

**Mobile**

Mobile hỗ trợ review nhanh và cập nhật nhẹ:

- Xem tóm tắt không gian làm việc.
- Xem KPI/rủi ro/phê duyệt đang chờ.
- Mở lịch họp.
- Đọc tài liệu trình.
- Xem cảnh báo/leo thang.
- Thực hiện hành động đơn giản nếu đủ quyền và form không phức tạp.

Mobile không phải nơi chính cho:

- Bảng dữ liệu rộng.
- Cấu hình phân quyền/chính sách phức tạp.
- Review nhật ký kiểm toán nhiều lớp.
- Dashboard nhiều cột.
- Phân tích tài chính/rủi ro chuyên sâu.

## Chiến Lược Breakpoint

Dùng breakpoint theo Tailwind mặc định để phù hợp stack hiện tại:

- `sm`: 640px.
- `md`: 768px.
- `lg`: 1024px.
- `xl`: 1280px.
- `2xl`: 1536px.

Chiến lược layout:

- `< 768px`: bố cục mobile xếp chồng, điều hướng dạng ngăn kéo, danh sách gọn thay bảng.
- `768px - 1023px`: bố cục tablet, 1-2 cột, điều hướng dạng ngăn kéo/thu gọn.
- `1024px - 1279px`: desktop cơ bản, thanh điều hướng + nội dung, dashboard 2-3 cột.
- `>= 1280px`: desktop đầy đủ, dashboard 3-4 cột, ngăn xem chi tiết bên cạnh.
- `>= 1536px`: Trung Tâm Điều Hành Lãnh Đạo có thể hiển thị KPI, hàng đợi, bản đồ rủi ro và dòng thời gian cùng lúc.

Không scale font theo chiều rộng viewport. Dùng bố cục responsive, không dùng typography phụ thuộc viewport.

## Chiến Lược Trợ Năng

Mục tiêu trợ năng: WCAG 2.1 AA cho các màn hình chính.

Yêu cầu:

- Tương phản chữ/nền đạt tối thiểu 4.5:1 cho chữ thường.
- Không dùng màu làm tín hiệu duy nhất; badge phải có chữ.
- Trạng thái focus phải rõ cho người dùng bàn phím.
- Tất cả nút/nút icon có tên truy cập.
- Hộp thoại/ngăn trượt có tiêu đề, mô tả, giữ focus và nút đóng rõ.
- Trường form có nhãn, thông báo lỗi và mô tả nếu cần.
- Bảng có header semantic.
- Trạng thái đang tải/chưa có dữ liệu/lỗi/không có quyền có chữ rõ.
- Vùng chạm mobile tối thiểu khoảng 44x44px cho hành động chính.
- Output AI phải có trạng thái rõ: bản nháp, đề xuất, đã chấp nhận, đã từ chối, đã thực thi, thất bại.
- Từ chối quyền truy cập không làm lộ dữ liệu ngoài phạm vi.

Các vùng đặc biệt cần cẩn trọng:

- Bản đồ rủi ro/bản đồ nhiệt phải có số, nhãn hoặc gợi ý; không chỉ dựa vào đỏ/vàng/xanh.
- KPI tài chính nhạy cảm phải có trạng thái không có quyền thay vì render rồi ẩn.
- Hành động phê duyệt phải truy cập được bằng bàn phím và không phụ thuộc hover.
- Dòng thời gian/nhật ký kiểm toán phải đọc được bằng thứ tự DOM hợp lý.

## Chiến Lược Kiểm Thử

Responsive testing cần bao phủ:

- Mobile: 360px, 390px, 430px.
- Tablet: 768px, 820px.
- Desktop: 1024px, 1280px, 1440px.
- Wide desktop: 1536px hoặc lớn hơn.

Các màn hình bắt buộc kiểm tra:

- Không Gian Chủ Tịch.
- Không Gian Tổng Giám Đốc.
- Không Gian Giám Đốc Dự Án.
- Không Gian Trưởng Bộ Phận.
- Không Gian Thư Ký/Trợ Lý.
- Bảng xử lý phê duyệt.
- Ngăn xem chi tiết dữ liệu nguồn.
- Permission denied / 403.
- Trạng thái chưa có dữ liệu/đang tải/lỗi.

Kiểm thử trợ năng:

- Điều hướng chỉ bằng bàn phím.
- Thứ tự focus trong thanh điều hướng, thanh trên, dashboard, hộp thoại/ngăn trượt.
- Kiểm tra trợ năng tự động nếu test stack hỗ trợ.
- Review tương phản thủ công cho nhãn trạng thái/trạng thái rủi ro.
- Kiểm tra text tiếng Việt trong button, badge, table cell không bị tràn hoặc cắt xấu.

## Hướng Dẫn Triển Khai

- Dùng semantic HTML trước, ARIA chỉ bổ sung khi cần.
- Dùng Tailwind responsive utilities theo breakpoint chuẩn.
- Không dùng fixed width cứng cho nội dung text dài tiếng Việt.
- Bảng phải có phương án responsive: cuộn ngang có kiểm soát hoặc danh sách gọn.
- Ngăn xem chi tiết bên cạnh trên desktop chuyển thành ngăn toàn màn hình trên mobile.
- Thanh điều hướng desktop chuyển thành ngăn kéo trên mobile.
- Khung chờ tải dữ liệu giữ kích thước gần với nội dung thật để tránh lệch bố cục.
- Mọi thay đổi dữ liệu quan trọng phải có xác nhận và quản lý focus sau khi đóng hộp thoại.
- Không hardcode số liệu dashboard trong component; component nhận dữ liệu đã lọc theo quyền.
