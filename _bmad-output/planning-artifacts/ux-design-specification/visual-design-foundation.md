# Visual Design Foundation

## Color System

Hệ màu cần tạo cảm giác vận hành chuyên nghiệp, rõ ràng và đáng tin. Không dùng giao diện quá tối, không dùng palette một màu, không dùng gradient/trang trí marketing.

Bảng màu đề xuất:

- Background chính: `#F8FAFC` hoặc `#F9FAFB` để giữ nền sáng, sạch.
- Surface/card/table: `#FFFFFF`.
- Border/divider: `#E5E7EB`.
- Text chính: `#111827`.
- Text phụ: `#4B5563`.
- GreenNest primary: `#166534` hoặc `#15803D`, dùng cho primary action, active navigation, điểm nhấn thương hiệu.
- Info: `#0284C7`, dùng cho thông tin trung tính, AI insight, system notice.
- Warning: `#D97706`, dùng cho sắp quá hạn, cần chú ý.
- Danger: `#DC2626`, dùng cho overdue, blocked, rejected, risk nghiêm trọng.
- Success: `#16A34A`, dùng cho approved, complete, healthy.
- Neutral: `#6B7280`, dùng cho draft, archived, not started.

Nguyên tắc dùng màu:

- Màu không thay thế chữ. Badge trạng thái luôn có label.
- Risk đỏ/vàng/xanh phải có lý do và drill-down.
- Primary green không dùng tràn lan toàn giao diện; chỉ dùng cho nhận diện và hành động chính.
- Financial, risk, approval, AI và audit nên có màu/biểu tượng phân biệt nhưng vẫn nằm trong hệ thống semantic chung.

## Typography System

Typography cần nhỏ gọn, rõ cấp bậc, phù hợp dashboard dày thông tin.

Đề xuất:

- Font chính: dùng system font stack hiện tại để tối ưu performance và hiển thị tốt tiếng Việt.
- H1/page title: 24-28px, dùng cho tiêu đề trang/workspace.
- H2/section title: 18-20px, dùng cho vùng chính.
- H3/panel title: 15-16px, dùng cho panel/table section.
- Body: 14px.
- Metadata/table/helper text: 12-13px.
- Line-height: 1.4-1.6 tùy mật độ.
- Không dùng hero-scale typography bên trong dashboard/panel.
- Không dùng letter-spacing âm.

Nguyên tắc:

- Số KPI có thể lớn hơn text thường nhưng không được lấn át ngữ cảnh.
- Table và queue cần dễ đọc trong thời gian dài.
- Text tiếng Việt phải đủ rộng, tránh nút hoặc badge bị vỡ dòng xấu.

## Spacing & Layout Foundation

Layout cần dense but readable: đủ thông tin để điều hành, nhưng không rối.

Nền tảng spacing:

- Base unit: 4px.
- Component rhythm chính: 8px, 12px, 16px, 24px.
- Card/panel radius: tối đa 8px.
- Không lồng card trong card.
- Không dùng section nổi như card lớn nếu không cần.
- Dashboard dùng grid rõ ràng, ưu tiên alignment và grouping hơn trang trí.

Desktop layout:

- Sidebar cố định cho navigation theo quyền.
- Header chứa workspace/scope switcher, search, notification và user actions.
- Main content chia thành vùng ưu tiên: KPI strip, risk/approval/action queue, timeline/detail.
- Với trang detail, dùng pattern header summary + tabs/sections + activity/audit.

Mobile layout:

- Sidebar chuyển thành drawer.
- KPI/risk/approval chuyển thành stacked priority list.
- Table chuyển thành list row/card compact có key fields.
- Không ép người dùng thao tác bảng rộng trên mobile.

## Accessibility Considerations

Yêu cầu accessibility:

- Độ tương phản text/nền đạt WCAG AA ở các trạng thái chính.
- Không truyền đạt trạng thái chỉ bằng màu.
- Button/action quan trọng có label rõ.
- Focus state phải thấy được khi dùng keyboard.
- Modal/dialog phải có title, mô tả và escape/close rõ.
- Error/permission denial phải giải thích hành động nào bị chặn và vì sao.
- Dashboard phải giữ được ý nghĩa khi người dùng không phân biệt tốt đỏ/vàng/xanh.
