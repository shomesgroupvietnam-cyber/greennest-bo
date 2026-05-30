# Design Direction Decision

## Design Directions Explored

Đã tạo và so sánh 6 hướng thiết kế trong `ux-design-directions.html`:

1. Executive Command Center - workspace điều hành tổng hợp cho Chairman/CEO.
2. Operations Control Room - workspace vận hành tổng cho CEO.
3. Project War Room - workspace dự án cho Project Director.
4. Department Workflow Board - workspace chuyên môn cho Department Head.
5. Secretary Briefing Desk - workspace hỗ trợ lãnh đạo cho Secretary / Assistant.
6. Strategic Board View - chế độ review chiến lược cấp cao cho Chairman.

## Chosen Direction

Hướng được chọn là Executive Command Center làm design direction nền.

Các workspace còn lại là biến thể theo vai trò:

- Chairman Workspace: Executive Command Center + Strategic Board View.
- CEO Workspace: Executive Command Center + Operations Control Room.
- Project Director Workspace: Project War Room.
- Department Head Workspace: Department Workflow Board.
- Secretary / Assistant Workspace: Secretary Briefing Desk.

## Design Rationale

Executive Command Center phù hợp nhất vì cân bằng được các yêu cầu chính:

- Dễ nhìn, khoa học, không trang trí thừa.
- Đặt KPI, risk, approval, escalation, timeline và AI copilot vào cùng một bề mặt điều hành.
- Hỗ trợ drill-down từ cảnh báo/KPI đến dữ liệu nguồn.
- Phù hợp với requirement hiện tại hơn giao diện cũ dạng dashboard tĩnh hoặc card rời rạc.
- Dễ mở rộng thành nhiều workspace theo vai trò mà không phá cấu trúc chung.

Strategic Board View chỉ nên là chế độ phụ cho Chairman khi review chiến lược, bổ nhiệm, phân quyền cấp cao hoặc quyết định lớn. Không nên dùng nó làm workspace mặc định duy nhất vì có thể thiếu nhịp vận hành hằng ngày.

## Implementation Approach

Triển khai UI mới theo thứ tự:

1. Xây lại layout shell: sidebar permission-aware, topbar có workspace/scope switcher, content area responsive.
2. Tạo pattern Executive Command Center: KPI strip, top risk/issues, approval queue, risk map, executive timeline, AI copilot panel.
3. Tạo biến thể role workspace bằng cùng component nền nhưng đổi dữ liệu, priority và action.
4. Migrate giao diện cũ sang cấu trúc mới, loại bỏ card tĩnh không có drill-down/action.
5. Đảm bảo mỗi KPI/risk/approval/decision có owner, status, reason, deadline, next action và audit/history khi phù hợp.
