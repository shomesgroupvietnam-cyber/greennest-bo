# Nền Tảng Thiết Kế Thị Giác

## Hệ Màu

Hệ màu cần tạo cảm giác vận hành chuyên nghiệp, rõ ràng và đáng tin. Không dùng giao diện quá tối, không dùng palette một màu, không dùng gradient/trang trí marketing.

Bảng màu đề xuất:

- Nền chính: `#F8FAFC` hoặc `#F9FAFB` để giữ nền sáng, sạch.
- Bề mặt/thẻ/bảng: `#FFFFFF`.
- Viền/đường phân tách: `#E5E7EB`.
- Chữ chính: `#111827`.
- Chữ phụ: `#4B5563`.
- Xanh GreenNest: `#166534` hoặc `#15803D`, dùng cho hành động chính, điều hướng đang chọn, điểm nhấn thương hiệu.
- Thông tin: `#0284C7`, dùng cho thông tin trung tính, insight AI, thông báo hệ thống.
- Cảnh báo: `#D97706`, dùng cho sắp quá hạn, cần chú ý.
- Nguy hiểm: `#DC2626`, dùng cho quá hạn, bị chặn, bị từ chối, rủi ro nghiêm trọng.
- Thành công: `#16A34A`, dùng cho đã duyệt, hoàn tất, khỏe.
- Trung tính: `#6B7280`, dùng cho bản nháp, đã lưu trữ, chưa bắt đầu.

Nguyên tắc dùng màu:

- Màu không thay thế chữ. Nhãn trạng thái luôn có chữ.
- Rủi ro đỏ/vàng/xanh phải có lý do và đường xem chi tiết.
- Xanh chính không dùng tràn lan toàn giao diện; chỉ dùng cho nhận diện và hành động chính.
- Tài chính, rủi ro, phê duyệt, AI và nhật ký kiểm toán nên có màu/biểu tượng phân biệt nhưng vẫn nằm trong hệ thống ngữ nghĩa chung.

## Hệ Chữ

Hệ chữ cần nhỏ gọn, rõ cấp bậc, phù hợp dashboard dày thông tin.

Đề xuất:

- Font chính: dùng font hệ thống hiện tại để tối ưu hiệu năng và hiển thị tốt tiếng Việt.
- H1/tiêu đề trang: 24-28px, dùng cho tiêu đề trang/không gian làm việc.
- H2/tiêu đề vùng: 18-20px, dùng cho vùng chính.
- H3/tiêu đề khung: 15-16px, dùng cho khung/bảng.
- Body: 14px.
- Metadata/bảng/chữ hỗ trợ: 12-13px.
- Chiều cao dòng: 1.4-1.6 tùy mật độ.
- Không dùng cỡ chữ kiểu hero bên trong dashboard/khung nội dung.
- Không dùng letter-spacing âm.

Nguyên tắc:

- Số KPI có thể lớn hơn text thường nhưng không được lấn át ngữ cảnh.
- Bảng và hàng đợi cần dễ đọc trong thời gian dài.
- Text tiếng Việt phải đủ rộng, tránh nút hoặc badge bị vỡ dòng xấu.

## Nền Tảng Khoảng Cách Và Bố Cục

Bố cục cần dày thông tin nhưng dễ đọc: đủ thông tin để điều hành, nhưng không rối.

Nền tảng spacing:

- Đơn vị nền: 4px.
- Nhịp component chính: 8px, 12px, 16px, 24px.
- Bo góc thẻ/khung: tối đa 8px.
- Không lồng thẻ trong thẻ.
- Không dùng section nổi như thẻ lớn nếu không cần.
- Dashboard dùng grid rõ ràng, ưu tiên alignment và grouping hơn trang trí.

Desktop layout:

- Thanh điều hướng cố định theo quyền.
- Header chứa bộ đổi không gian làm việc/phạm vi, tìm kiếm, thông báo và hành động người dùng.
- Nội dung chính chia thành vùng ưu tiên: dải KPI, hàng đợi rủi ro/phê duyệt/hành động, dòng thời gian/chi tiết.
- Với trang chi tiết, dùng pattern tóm tắt đầu trang + thẻ chuyển/vùng nội dung + hoạt động/nhật ký kiểm toán.

Mobile layout:

- Thanh điều hướng chuyển thành ngăn kéo.
- KPI/rủi ro/phê duyệt chuyển thành danh sách ưu tiên xếp chồng.
- Bảng chuyển thành dòng danh sách/thẻ gọn có trường chính.
- Không ép người dùng thao tác bảng rộng trên mobile.

## Lưu Ý Trợ Năng

Yêu cầu accessibility:

- Độ tương phản text/nền đạt WCAG AA ở các trạng thái chính.
- Không truyền đạt trạng thái chỉ bằng màu.
- Nút/hành động quan trọng có nhãn rõ.
- Trạng thái focus phải thấy được khi dùng bàn phím.
- Modal/hộp thoại phải có tiêu đề, mô tả và nút thoát/đóng rõ.
- Lỗi/từ chối quyền phải giải thích hành động nào bị chặn và vì sao.
- Dashboard phải giữ được ý nghĩa khi người dùng không phân biệt tốt đỏ/vàng/xanh.
