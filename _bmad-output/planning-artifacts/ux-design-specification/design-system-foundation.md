# Design System Foundation

## 1.1 Design System Choice

GREENNEST BUILDFLOW sẽ dùng hướng Themeable System dựa trên Tailwind CSS + shadcn/ui + Radix primitives + lucide-react.

Đây là nền phù hợp vì repo hiện tại đã có sẵn cấu hình shadcn/ui, Tailwind, component alias và icon library. Design system sẽ không phụ thuộc vào một bộ UI enterprise nặng như Ant Design hoặc MUI, mà mở rộng từ nền hiện tại thành bộ pattern riêng cho ứng dụng vận hành cấp tập đoàn.

## Rationale for Selection

Lựa chọn này phù hợp vì sản phẩm cần:

- Giao diện enterprise rõ ràng, dày thông tin, dễ quét.
- Tốc độ triển khai nhanh trên nền code hiện có.
- Tùy biến cao cho workspace theo vai trò.
- Component đủ kiểm soát để enforce permission-aware UI.
- Responsive web tốt mà không cần phát triển mobile app riêng.
- Dễ tạo các pattern riêng như executive dashboard, risk map, approval queue, timeline, checklist và AI action panel.

Không chọn custom design system hoàn toàn từ đầu vì chi phí cao và không cần thiết cho giai đoạn hiện tại.

Không chọn Ant Design/MUI làm nền chính vì sẽ tạo thêm dependency lớn, dễ lệch khỏi cấu trúc shadcn/Tailwind hiện có và có nguy cơ làm giao diện giống generic admin template.

## Implementation Approach

Thiết kế sẽ xây trên các lớp sau:

- Base UI: button, input, select, dialog, popover, tabs, badge, table, tooltip, sheet, dropdown.
- Layout shell: sidebar desktop, mobile drawer, top header, role workspace switcher, page shell.
- Enterprise patterns: KPI strip, executive dashboard grid, priority queue, risk map, approval queue, timeline, audit trail, list-detail page, object detail page.
- Role workspace patterns: Chairman Workspace, CEO Workspace, Project Director Workspace, Department Head Workspace, Secretary / Assistant Workspace.
- AI patterns: contextual AI panel, AI summary draft, AI meeting preparation, AI agenda builder, AI checklist assistant, AI action proposal review.

Các component nên được thiết kế theo hướng reusable pattern, không chỉ là từng card riêng lẻ. Dashboard không được là tập hợp card tĩnh; mỗi khối dữ liệu cần có trạng thái, ngữ cảnh, drill-down hoặc hành động tiếp theo.

## Customization Strategy

Visual direction cần đi theo hướng khoa học, rõ ràng, professional và Vietnamese-first.

Nguyên tắc tùy biến:

- Dùng typography nhỏ gọn, phân cấp rõ, phù hợp dashboard vận hành.
- Dùng spacing chặt nhưng có nhịp, tránh giao diện quá thưa hoặc quá nhiều card lớn.
- Dùng màu trung tính làm nền, màu xanh GreenNest làm primary vừa phải, đỏ/vàng/xanh lá cho trạng thái, không dùng một theme đơn sắc slate/dark-blue.
- Badge trạng thái luôn có chữ, không chỉ dựa vào màu.
- Icon dùng lucide-react cho action và navigation.
- Tables, lists, timelines và heatmaps là bề mặt chính cho vận hành.
- Cards chỉ dùng cho nhóm thông tin thật sự cần đóng khung, không lồng card trong card.
- Mobile dùng layout xếp lớp và danh sách ưu tiên thay vì ép bảng rộng.
- AI component phải hiển thị như công cụ hỗ trợ theo ngữ cảnh, không thay thế toàn bộ navigation hoặc workflow.
