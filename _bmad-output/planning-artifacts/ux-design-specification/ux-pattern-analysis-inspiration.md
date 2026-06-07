# Phân Tích Pattern UX Và Nguồn Cảm Hứng

## Phân Tích Sản Phẩm Tham Chiếu

Nguồn cảm hứng chính:

- Power BI / Tableau: mạnh ở dashboard điều hành, KPI, xem chi tiết, lọc, biểu đồ và khả năng truy ngược dữ liệu.
- Jira / Linear: mạnh ở trạng thái công việc, mức ưu tiên, quy trình, người phụ trách, hạn xử lý và luồng xử lý vấn đề rõ ràng.
- Salesforce / Microsoft Dynamics: mạnh ở không gian làm việc theo vai trò, chi tiết bản ghi, dòng thời gian hoạt động, điều hướng theo quyền và quy trình doanh nghiệp.
- SAP Fiori: mạnh ở nguyên tắc UI doanh nghiệp, launchpad theo vai trò, trang đối tượng, báo cáo danh sách và hành động có kiểm soát.
- Notion / Airtable: mạnh ở cách tổ chức dữ liệu linh hoạt, bảng/danh sách/chi tiết dễ đọc, nhưng cần tiết chế để không biến hệ thống thành công cụ ghi chú tự do.

## Pattern UX Có Thể Áp Dụng

Các pattern nên áp dụng:

- Không gian làm việc theo vai trò: mỗi vai trò có dashboard riêng, dữ liệu riêng, hành động riêng.
- Dashboard lãnh đạo có xem chi tiết: KPI, rủi ro, phê duyệt và cảnh báo phải mở được dữ liệu nguồn.
- Pattern danh sách-chi tiết: danh sách vận hành ở bên trái hoặc vùng chính, chi tiết bản ghi/dòng thời gian/hành động ở vùng phụ hoặc trang chi tiết.
- Hàng đợi ưu tiên: phê duyệt, rủi ro, hạn xử lý và leo thang cần xếp theo mức độ nghiêm trọng thay vì chỉ theo thời gian.
- Nhãn trạng thái có chữ: mọi trạng thái quan trọng dùng nhãn có chữ, không chỉ dùng màu.
- Dòng thời gian hoạt động: phê duyệt, quyết định, cuộc họp, rủi ro và thay đổi phân quyền cần có lịch sử rõ ràng.
- Bảng dữ liệu ưu tiên lọc: bảng dày phải có tìm kiếm, lọc, phân nhóm, sắp xếp và góc nhìn đã lưu nếu cần.
- Hành động AI theo ngữ cảnh: AI xuất hiện tại đúng ngữ cảnh như chuẩn bị họp, tóm tắt rủi ro, kiểm checklist, gợi ý chương trình họp, không là chatbot chung thay toàn bộ UI.

## Pattern Cần Tránh

Các pattern cần tránh:

- Dashboard dạng nhiều card rời rạc nhưng không dẫn tới hành động.
- Hero section, banner lớn, hiệu ứng trang trí hoặc layout marketing trong app vận hành.
- Một dashboard dùng chung cho mọi vai trò.
- Chỉ ẩn dữ liệu ở frontend thay vì enforce permission từ service/server.
- Dùng màu đỏ/vàng/xanh mà không có nhãn, lý do và dữ liệu nguồn.
- Trộn phê duyệt, quyết định, việc, cuộc họp và rủi ro vào cùng một danh sách không phân loại.
- AI chat chung không biết phạm vi, không có nguồn trích dẫn, không có trạng thái bản nháp/gợi ý.
- Mobile ép hiển thị bảng rộng mà không có layout thay thế.

## Chiến Lược Áp Dụng Cảm Hứng

Áp dụng hướng thiết kế enterprise command center: rõ vai trò, rõ phạm vi, rõ ưu tiên, rõ hành động tiếp theo.

Áp dụng:

- Power BI/Tableau cho KPI, dashboard, lọc và xem chi tiết.
- Jira/Linear cho hàng đợi ưu tiên, trạng thái, người phụ trách, hạn xử lý và quy trình.
- Salesforce/Dynamics cho chi tiết bản ghi, dòng thời gian hoạt động và không gian làm việc theo vai trò.
- SAP Fiori cho tính kỷ luật của UI doanh nghiệp: báo cáo danh sách, trang đối tượng, hành động có kiểm soát.

Điều chỉnh:

- Notion/Airtable chỉ lấy sự linh hoạt trong danh sách/bảng/góc nhìn, không lấy phong cách tự do quá mức.
- AI chỉ dùng như lớp hỗ trợ trong quy trình, không thay thế cấu trúc điều hành chính.

Tránh:

- Giao diện cũ nếu đang thiên về dashboard tĩnh, card rời rạc, thiếu phân quyền theo vai trò hoặc thiếu xem chi tiết.
- Giao diện quá đẹp mắt nhưng không giúp lãnh đạo biết việc gì cần xử lý ngay.
