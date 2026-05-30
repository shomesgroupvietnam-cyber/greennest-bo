# Core User Experience

## Defining Experience

Trải nghiệm cốt lõi của GREENNEST BUILDFLOW là hệ thống workspace theo vai trò, nơi mỗi người dùng vào đúng bề mặt điều hành tương ứng với quyền hạn và phạm vi công việc của mình.

Vòng lặp chính của người dùng là:

1. Xem tổng quan theo phạm vi được phân quyền.
2. Nhận diện việc quan trọng, rủi ro, approval, deadline hoặc escalation cần xử lý.
3. Drill-down vào dữ liệu nguồn để hiểu nguyên nhân.
4. Thực hiện hành động phù hợp: duyệt, trả lại, chuyển cấp, tạo quyết định, giao việc, tạo họp hoặc xem audit.
5. Theo dõi kết quả qua timeline, history và trạng thái thực hiện.

Trọng tâm UX không phải là nhập liệu vi mô, mà là giúp từng nhóm người dùng nhìn đúng thứ cần nhìn và ra quyết định nhanh hơn.

## Platform Strategy

Sản phẩm là web application responsive.

Desktop là bề mặt làm việc chính cho dashboard, bảng dữ liệu, drill-down, timeline, approval, phân quyền và thao tác điều hành phức tạp.

Mobile cần hỗ trợ responsive đủ tốt cho các tình huống kiểm tra nhanh: xem dashboard, xem approval pending, đọc risk/blocker, mở lịch họp, xem tài liệu trình và cập nhật trạng thái nhẹ. Mobile không phải bề mặt chính để cấu hình phức tạp hoặc xử lý bảng dữ liệu dày.

## Effortless Interactions

Các tương tác cần gần như không cần suy nghĩ:

- Người dùng đăng nhập và vào đúng workspace theo vai trò.
- Chairman thấy ngay toàn cảnh hệ thống, KPI tổng, dòng tiền tổng, risk map, top vấn đề nguy hiểm, dự án đỏ và approval vượt ngưỡng.
- CEO thấy ngay vận hành tổng, tiến độ, resource allocation, performance analytics, approval queue, risk vận hành và escalation.
- Project Director thấy ngay tình trạng project được giao, timeline, cost, approval, risk, task priority và deadline heatmap.
- Department Head thấy ngay hồ sơ chuyên môn, task, workflow, checklist, approval chuyên môn và risk chuyên môn.
- Secretary / Assistant thấy ngay lịch lãnh đạo, hồ sơ trình, tài liệu họp, reminder, task hỗ trợ và approval pending.
- Từ mọi KPI, risk, approval hoặc cảnh báo quan trọng, người dùng có thể drill-down đến dữ liệu nguồn.
- Hành động quan trọng luôn có trạng thái, lý do, người chịu trách nhiệm, deadline và audit trail.

## Critical Success Moments

Khoảnh khắc thành công đầu tiên là khi Chairman hoặc CEO mở workspace và trong 1-2 phút biết chính xác hôm nay cần chú ý điều gì, vấn đề nào nguy hiểm nhất, approval nào vượt ngưỡng, dự án nào đang đỏ và cần drill-down vào đâu.

Với Project Director, khoảnh khắc thành công là nhìn được tình trạng project được giao, rủi ro, deadline, approval và task ưu tiên mà không phải gom dữ liệu từ nhiều nơi.

Với Department Head, khoảnh khắc thành công là quản được checklist/workflow chuyên môn và biết ngay hồ sơ nào thiếu, việc nào chờ xử lý, approval nào đang kẹt.

Với Secretary / Assistant, khoảnh khắc thành công là chuẩn bị được lịch, hồ sơ trình, agenda, tài liệu họp và reminder cho lãnh đạo mà không cần hỏi lại nhiều lần.

## Experience Principles

- Role-first: mỗi vai trò có workspace riêng, không dùng một dashboard chung cho tất cả.
- Scope-aware: mọi số liệu, danh sách, hành động và drill-down phải tuân thủ role + scope + action.
- Executive clarity: bề mặt lãnh đạo ưu tiên tổng quan, rủi ro, quyết định, approval vượt ngưỡng và chiến lược; không đẩy task nhỏ hoặc dữ liệu chuyên môn sâu lên mặc định.
- Dense but readable: giao diện phải khoa học, dễ quét, đủ dày cho vận hành nhưng không rối.
- Actionable dashboard: KPI và cảnh báo phải dẫn đến dữ liệu nguồn hoặc hành động tiếp theo.
- Audit by design: approval, decision, assignment, risk, meeting và phân quyền quan trọng đều phải có lịch sử/audit rõ ràng.
- AI as assistant, not authority: AI hỗ trợ chuẩn bị họp, tóm tắt, gợi ý checklist, agenda, risk hoặc approval insight, nhưng không tự phê duyệt, tự quyết định hoặc tự thay đổi dữ liệu.
