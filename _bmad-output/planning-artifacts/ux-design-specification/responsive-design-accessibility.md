# Responsive Design & Accessibility

## Responsive Strategy

GREENNEST BUILDFLOW là web application responsive với desktop là bề mặt làm việc chính.

**Desktop**

Desktop phải tận dụng không gian màn hình cho:

- Sidebar permission-aware.
- Topbar có workspace/scope switcher.
- KPI strip.
- Multi-column dashboard.
- Priority queue.
- Risk map / deadline heatmap.
- Side drill-down panel.
- Timeline / audit trail.
- Data table có filter/sort.

Desktop là nơi xử lý các flow phức tạp như approval, phân quyền, cấu hình policy, review audit, quản lý checklist và phân tích nhiều dự án.

**Tablet**

Tablet dùng layout giản lược:

- Sidebar có thể collapse hoặc chuyển thành drawer.
- Dashboard giảm số cột.
- Side panel có thể chuyển thành sheet.
- Table ưu tiên column quan trọng, các field phụ đưa vào expanded row/detail.
- Touch target phải đủ lớn cho thao tác bằng tay.

**Mobile**

Mobile hỗ trợ review nhanh và cập nhật nhẹ:

- Xem workspace summary.
- Xem KPI/risk/approval pending.
- Mở lịch họp.
- Đọc tài liệu trình.
- Xem alert/escalation.
- Thực hiện action đơn giản nếu đủ quyền và form không phức tạp.

Mobile không phải nơi chính cho:

- Bảng dữ liệu rộng.
- Cấu hình permission/policy phức tạp.
- Review audit nhiều lớp.
- Dashboard multi-column.
- Phân tích tài chính/risk chuyên sâu.

## Breakpoint Strategy

Dùng breakpoint theo Tailwind mặc định để phù hợp stack hiện tại:

- `sm`: 640px.
- `md`: 768px.
- `lg`: 1024px.
- `xl`: 1280px.
- `2xl`: 1536px.

Chiến lược layout:

- `< 768px`: mobile stacked layout, drawer navigation, list compact thay table.
- `768px - 1023px`: tablet layout, 1-2 cột, drawer/collapsed nav.
- `1024px - 1279px`: desktop cơ bản, sidebar + content, dashboard 2-3 cột.
- `>= 1280px`: desktop đầy đủ, dashboard 3-4 cột, side drill-down panel.
- `>= 1536px`: executive command center có thể hiển thị KPI, queue, risk map và timeline cùng lúc.

Không scale font theo viewport width. Dùng responsive layout, không dùng viewport-based typography.

## Accessibility Strategy

Mục tiêu accessibility: WCAG 2.1 AA cho các màn hình chính.

Yêu cầu:

- Contrast text đạt tối thiểu 4.5:1 cho text thường.
- Không dùng màu làm tín hiệu duy nhất; badge phải có chữ.
- Focus state phải rõ cho keyboard users.
- Tất cả button/icon button có accessible name.
- Dialog/sheet có title, description, focus trap và close rõ.
- Form field có label, error message và mô tả nếu cần.
- Table có header semantic.
- Loading/empty/error/unauthorized state có text rõ.
- Touch target mobile tối thiểu khoảng 44x44px cho hành động chính.
- AI output phải có trạng thái rõ: draft, proposed, accepted, rejected, executed, failed.
- Permission denial không làm lộ dữ liệu ngoài scope.

Các vùng đặc biệt cần cẩn trọng:

- Risk map/heatmap phải có số, label hoặc tooltip; không chỉ dựa vào đỏ/vàng/xanh.
- KPI tài chính nhạy cảm phải có no-permission state thay vì render rồi ẩn.
- Approval action phải keyboard-accessible và không phụ thuộc hover.
- Timeline/audit phải đọc được bằng thứ tự DOM hợp lý.

## Testing Strategy

Responsive testing cần bao phủ:

- Mobile: 360px, 390px, 430px.
- Tablet: 768px, 820px.
- Desktop: 1024px, 1280px, 1440px.
- Wide desktop: 1536px hoặc lớn hơn.

Các màn hình bắt buộc kiểm tra:

- Chairman Workspace.
- CEO Workspace.
- Project Director Workspace.
- Department Head Workspace.
- Secretary / Assistant Workspace.
- Approval action panel.
- Record drill-down panel.
- Permission denied / 403.
- Empty/loading/error states.

Accessibility testing:

- Keyboard-only navigation.
- Focus order trong sidebar, topbar, dashboard, dialog/sheet.
- Automated accessibility check nếu test stack hỗ trợ.
- Manual contrast review cho badge/risk states.
- Kiểm tra text tiếng Việt trong button, badge, table cell không bị tràn hoặc cắt xấu.

## Implementation Guidelines

- Dùng semantic HTML trước, ARIA chỉ bổ sung khi cần.
- Dùng Tailwind responsive utilities theo breakpoint chuẩn.
- Không dùng fixed width cứng cho nội dung text dài tiếng Việt.
- Table phải có responsive alternative: horizontal scroll có kiểm soát hoặc compact list.
- Side drill-down panel desktop chuyển thành full-screen sheet trên mobile.
- Sidebar desktop chuyển thành drawer trên mobile.
- Loading skeleton giữ kích thước gần với content thật để tránh layout shift.
- Mọi mutation quan trọng phải có confirmation và focus management sau khi đóng dialog.
- Không hardcode số liệu dashboard trong component; component nhận data đã lọc theo quyền.
