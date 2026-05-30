# 2. Core User Experience

## 2.1 Defining Experience

Defining experience của GREENNEST BUILDFLOW là Role Workspace Command Loop:

```text
Vào workspace theo vai trò
-> thấy ưu tiên quan trọng nhất
-> drill-down đến dữ liệu nguồn
-> xử lý hoặc giao hành động
-> hệ thống ghi nhận lịch sử/audit
-> quay lại dashboard với trạng thái đã cập nhật
```

Nếu làm đúng vòng lặp này, sản phẩm sẽ khác giao diện cũ: không còn là dashboard tĩnh hoặc tập hợp card rời rạc, mà trở thành bề mặt điều hành thật sự.

## 2.2 User Mental Model

Người dùng mang theo mental model từ cách điều hành thực tế:

- Chairman nghĩ theo toàn hệ thống, chiến lược, dòng tiền, rủi ro lớn, bổ nhiệm và phân quyền cấp cao.
- CEO nghĩ theo vận hành tổng, tiến độ, nguồn lực, KPI, approval queue và escalation.
- Project Director nghĩ theo dự án được giao, timeline, chi phí, task priority, approval và risk project.
- Department Head nghĩ theo workflow chuyên môn, checklist, hồ sơ, task và approval chuyên môn.
- Secretary / Assistant nghĩ theo lịch lãnh đạo, hồ sơ trình, tài liệu họp, reminder và chuẩn bị nội dung.

UX phải đi theo mental model này thay vì ép mọi người dùng vào cùng một dashboard.

## 2.3 Success Criteria

Core experience được xem là thành công khi:

- Người dùng vào app và thấy đúng workspace của mình.
- Trong 1-2 phút, Chairman/CEO biết vấn đề quan trọng nhất hôm nay.
- KPI, risk, approval, deadline và escalation đều drill-down được.
- Mỗi cảnh báo quan trọng có lý do, owner, deadline, trạng thái và next action.
- Người dùng không phải đoán dữ liệu này thuộc scope nào hoặc có được phép xem không.
- Sau một hành động quan trọng, hệ thống cập nhật trạng thái và ghi audit/history rõ ràng.
- Mobile vẫn xem được ưu tiên chính, approval pending, risk và lịch họp mà không vỡ layout.

## 2.4 Novel UX Patterns

Sản phẩm nên dùng pattern quen thuộc, không cần phát minh interaction lạ:

- Dashboard + drill-down từ Power BI/Tableau.
- Queue ưu tiên từ Jira/Linear.
- Record detail + activity timeline từ Salesforce/Dynamics.
- Role-based workspace từ SAP Fiori.
- Contextual AI action panel thay vì chatbot chung.

Điểm khác biệt không nằm ở interaction mới lạ, mà nằm ở cách kết hợp các pattern enterprise thành workspace điều hành đúng vai trò, đúng scope và có thể hành động ngay.

## 2.5 Experience Mechanics

### Initiation

Người dùng đăng nhập và được đưa vào workspace mặc định theo vai trò chính. Nếu có nhiều role/scope, UI cho phép chuyển workspace hoặc scope rõ ràng.

### Interaction

Người dùng đọc các vùng ưu tiên:

- KPI tổng hoặc KPI theo scope.
- Risk map hoặc risk queue.
- Approval queue.
- Deadline/escalation.
- Timeline hoặc activity stream.
- AI hỗ trợ theo ngữ cảnh nếu cần.

Người dùng chọn một item để drill-down, xem dữ liệu nguồn, record liên quan, lịch sử, người phụ trách và action khả dụng.

### Feedback

Hệ thống phản hồi bằng:

- Badge trạng thái có chữ.
- Lý do risk/overdue/escalation.
- Inline validation khi action thiếu dữ liệu.
- Confirmation rõ ràng trước mutation quan trọng.
- Audit/history sau khi action hoàn tất.

### Completion

Một action hoàn tất khi:

- Trạng thái record được cập nhật.
- Người chịu trách nhiệm và deadline tiếp theo rõ ràng.
- Audit log được ghi.
- Dashboard/queue phản ánh trạng thái mới.
- Người dùng biết bước tiếp theo là theo dõi, chờ phản hồi, hoặc xử lý item kế tiếp.
