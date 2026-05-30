# UX Pattern Analysis & Inspiration

## Inspiring Products Analysis

Nguồn cảm hứng chính:

- Power BI / Tableau: mạnh ở dashboard điều hành, KPI, drill-down, filter, biểu đồ và khả năng truy ngược dữ liệu.
- Jira / Linear: mạnh ở trạng thái công việc, priority, workflow, ownership, deadline và luồng xử lý issue rõ ràng.
- Salesforce / Microsoft Dynamics: mạnh ở workspace theo vai trò, record detail, activity timeline, permission-aware navigation và enterprise workflow.
- SAP Fiori: mạnh ở nguyên tắc enterprise UI, role-based launchpad, object page, list report và action có kiểm soát.
- Notion / Airtable: mạnh ở cách tổ chức dữ liệu linh hoạt, bảng/list/detail dễ đọc, nhưng cần tiết chế để không biến hệ thống thành công cụ ghi chú tự do.

## Transferable UX Patterns

Các pattern nên áp dụng:

- Role-based workspace: mỗi vai trò có dashboard riêng, dữ liệu riêng, action riêng.
- Executive dashboard with drill-down: KPI, risk, approval và cảnh báo phải mở được dữ liệu nguồn.
- List-detail pattern: danh sách vận hành bên trái hoặc vùng chính, record detail/timeline/action ở vùng phụ hoặc trang chi tiết.
- Priority queue: approval, risk, deadline và escalation cần xếp theo mức độ nghiêm trọng thay vì chỉ theo thời gian.
- Status badge có chữ: mọi trạng thái quan trọng dùng badge có text, không chỉ dùng màu.
- Timeline/activity trail: approval, decision, meeting, risk và permission change cần có lịch sử rõ ràng.
- Filter-first data table: bảng dày phải có search, filter, grouping, sort và saved view nếu cần.
- AI contextual action: AI xuất hiện tại đúng ngữ cảnh như chuẩn bị họp, tóm tắt risk, kiểm checklist, gợi ý agenda, không là chatbot chung thay toàn bộ UI.

## Anti-Patterns to Avoid

Các pattern cần tránh:

- Dashboard dạng nhiều card rời rạc nhưng không dẫn tới hành động.
- Hero section, banner lớn, hiệu ứng trang trí hoặc layout marketing trong app vận hành.
- Một dashboard dùng chung cho mọi vai trò.
- Chỉ ẩn dữ liệu ở frontend thay vì enforce permission từ service/server.
- Dùng màu đỏ/vàng/xanh mà không có nhãn, lý do và dữ liệu nguồn.
- Trộn approval, decision, task, meeting và risk vào cùng một danh sách không phân loại.
- AI chat chung không biết scope, không có citation, không có trạng thái draft/gợi ý.
- Mobile ép hiển thị bảng rộng mà không có layout thay thế.

## Design Inspiration Strategy

Áp dụng hướng thiết kế enterprise command center: rõ vai trò, rõ phạm vi, rõ ưu tiên, rõ hành động tiếp theo.

Adopt:

- Power BI/Tableau cho KPI, dashboard, filter và drill-down.
- Jira/Linear cho queue ưu tiên, trạng thái, owner, deadline và workflow.
- Salesforce/Dynamics cho record detail, activity timeline và workspace theo vai trò.
- SAP Fiori cho tính kỷ luật của enterprise UI: list report, object page, action có kiểm soát.

Adapt:

- Notion/Airtable chỉ lấy sự linh hoạt trong list/table/view, không lấy phong cách tự do quá mức.
- AI chỉ dùng như lớp hỗ trợ trong workflow, không thay thế cấu trúc điều hành chính.

Avoid:

- Giao diện cũ nếu đang thiên về dashboard tĩnh, card rời rạc, thiếu phân quyền theo vai trò hoặc thiếu drill-down.
- Giao diện quá đẹp mắt nhưng không giúp lãnh đạo biết việc gì cần xử lý ngay.
