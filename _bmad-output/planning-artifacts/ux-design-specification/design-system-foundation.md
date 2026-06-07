# Nền Tảng Design System

## 1.1 Lựa Chọn Design System

GREENNEST BUILDFLOW sẽ dùng hướng hệ thống có thể tùy biến giao diện dựa trên Tailwind CSS + shadcn/ui + Radix primitives + lucide-react.

Đây là nền phù hợp vì repo hiện tại đã có sẵn cấu hình shadcn/ui, Tailwind, alias component và thư viện icon. Design system sẽ không phụ thuộc vào một bộ UI enterprise nặng như Ant Design hoặc MUI, mà mở rộng từ nền hiện tại thành bộ pattern riêng cho ứng dụng vận hành cấp tập đoàn.

## Lý Do Lựa Chọn

Lựa chọn này phù hợp vì sản phẩm cần:

- Giao diện enterprise rõ ràng, dày thông tin, dễ quét.
- Tốc độ triển khai nhanh trên nền code hiện có.
- Tùy biến cao cho không gian làm việc theo vai trò.
- Component đủ kiểm soát để bảo đảm UI theo quyền.
- Responsive web tốt mà không cần phát triển mobile app riêng.
- Dễ tạo các pattern riêng như Dashboard Tổng Quan lãnh đạo, bản đồ rủi ro, hàng đợi phê duyệt, dòng thời gian, checklist và bảng hành động AI.

Không chọn custom design system hoàn toàn từ đầu vì chi phí cao và không cần thiết cho giai đoạn hiện tại.

Không chọn Ant Design/MUI làm nền chính vì sẽ tạo thêm dependency lớn, dễ lệch khỏi cấu trúc shadcn/Tailwind hiện có và có nguy cơ làm giao diện giống mẫu quản trị chung chung.

## Cách Triển Khai

Thiết kế sẽ xây trên các lớp sau:

- UI nền: nút bấm, ô nhập, ô chọn, hộp thoại, popover, thẻ chuyển nội dung, nhãn trạng thái, bảng, gợi ý, ngăn trượt, menu thả xuống.
- Khung bố cục: thanh điều hướng desktop, ngăn kéo mobile, thanh đầu trang, bộ đổi không gian làm việc theo vai trò, khung trang.
- Pattern vận hành: dải KPI, lưới Dashboard Tổng Quan lãnh đạo, hàng đợi ưu tiên, bản đồ rủi ro, hàng đợi phê duyệt, dòng thời gian, nhật ký kiểm toán, trang danh sách-chi tiết, trang chi tiết bản ghi.
- Pattern không gian làm việc theo vai trò: Không Gian Chủ Tịch, Không Gian Tổng Giám Đốc, Không Gian Giám Đốc Dự Án, Không Gian Trưởng Bộ Phận, Không Gian Thư Ký/Trợ Lý.
- Pattern AI: bảng AI theo ngữ cảnh, bản nháp tóm tắt AI, AI chuẩn bị họp, AI gợi ý chương trình họp, AI hỗ trợ checklist, màn review đề xuất hành động AI.

Các component nên được thiết kế theo hướng pattern tái sử dụng, không chỉ là từng thẻ riêng lẻ. Dashboard không được là tập hợp thẻ tĩnh; mỗi khối dữ liệu cần có trạng thái, ngữ cảnh, xem chi tiết hoặc hành động tiếp theo.

## Chiến Lược Tùy Biến

Hướng thị giác cần khoa học, rõ ràng, chuyên nghiệp và ưu tiên tiếng Việt.

Nguyên tắc tùy biến:

- Dùng typography nhỏ gọn, phân cấp rõ, phù hợp dashboard vận hành.
- Dùng spacing chặt nhưng có nhịp, tránh giao diện quá thưa hoặc quá nhiều card lớn.
- Dùng màu trung tính làm nền, màu xanh GreenNest làm primary vừa phải, đỏ/vàng/xanh lá cho trạng thái, không dùng một theme đơn sắc slate/dark-blue.
- Badge trạng thái luôn có chữ, không chỉ dựa vào màu.
- Icon dùng lucide-react cho hành động và điều hướng.
- Bảng, danh sách, dòng thời gian và bản đồ nhiệt là bề mặt chính cho vận hành.
- Thẻ chỉ dùng cho nhóm thông tin thật sự cần đóng khung, không lồng thẻ trong thẻ.
- Mobile dùng bố cục xếp lớp và danh sách ưu tiên thay vì ép bảng rộng.
- Component AI phải hiển thị như công cụ hỗ trợ theo ngữ cảnh, không thay thế toàn bộ điều hướng hoặc quy trình nghiệp vụ.
