# Quyết Định Hướng Thiết Kế

## Các Hướng Thiết Kế Đã So Sánh

Đã tạo và so sánh 6 hướng thiết kế trong `ux-design-directions.html`:

1. Trung Tâm Điều Hành Lãnh Đạo - không gian điều hành tổng hợp cho Chủ tịch/Tổng Giám đốc.
2. Phòng Điều Phối Vận Hành - không gian vận hành tổng cho Tổng Giám đốc.
3. Phòng Điều Hành Dự Án - không gian dự án cho Giám đốc dự án.
4. Bảng Công Việc Bộ Phận - không gian chuyên môn cho Trưởng bộ phận.
5. Bàn Chuẩn Bị Của Thư Ký - không gian hỗ trợ lãnh đạo cho Thư ký/Trợ lý.
6. Góc Review Chiến Lược - chế độ review chiến lược cấp cao cho Chủ tịch.

## Hướng Được Chọn

Hướng được chọn là Trung Tâm Điều Hành Lãnh Đạo làm nền thiết kế.

Các không gian làm việc còn lại là biến thể theo vai trò:

- Không Gian Chủ Tịch: Trung Tâm Điều Hành Lãnh Đạo + Góc Review Chiến Lược.
- Không Gian Tổng Giám Đốc: Trung Tâm Điều Hành Lãnh Đạo + Phòng Điều Phối Vận Hành.
- Không Gian Giám Đốc Dự Án: Phòng Điều Hành Dự Án.
- Không Gian Trưởng Bộ Phận: Bảng Công Việc Bộ Phận.
- Không Gian Thư Ký/Trợ Lý: Bàn Chuẩn Bị Của Thư Ký.

## Lý Do Chọn

Trung Tâm Điều Hành Lãnh Đạo phù hợp nhất vì cân bằng được các yêu cầu chính:

- Dễ nhìn, khoa học, không trang trí thừa.
- Đặt KPI, rủi ro, phê duyệt, leo thang, dòng thời gian và AI hỗ trợ vào cùng một bề mặt điều hành.
- Hỗ trợ xem chi tiết từ cảnh báo/KPI đến dữ liệu nguồn.
- Phù hợp với yêu cầu hiện tại hơn giao diện cũ dạng dashboard tĩnh hoặc card rời rạc.
- Dễ mở rộng thành nhiều không gian làm việc theo vai trò mà không phá cấu trúc chung.

Góc Review Chiến Lược chỉ nên là chế độ phụ cho Chủ tịch khi review chiến lược, bổ nhiệm, phân quyền cấp cao hoặc quyết định lớn. Không nên dùng nó làm không gian mặc định duy nhất vì có thể thiếu nhịp vận hành hằng ngày.

## Cách Triển Khai

Triển khai UI mới theo thứ tự:

1. Xây lại khung ứng dụng: thanh điều hướng theo quyền, thanh trên có bộ đổi không gian làm việc/phạm vi, vùng nội dung responsive.
2. Tạo pattern Trung Tâm Điều Hành Lãnh Đạo: dải KPI, nhóm rủi ro/vấn đề nổi bật, hàng đợi phê duyệt, bản đồ rủi ro, dòng thời gian điều hành, bảng AI hỗ trợ.
3. Tạo biến thể không gian làm việc theo vai trò bằng cùng component nền nhưng đổi dữ liệu, mức ưu tiên và hành động.
4. Chuyển giao diện cũ sang cấu trúc mới, loại bỏ thẻ tĩnh không có xem chi tiết/hành động.
5. Đảm bảo mỗi KPI/rủi ro/phê duyệt/quyết định có người phụ trách, trạng thái, lý do, hạn xử lý, hành động tiếp theo và lịch sử/nhật ký khi phù hợp.
