# Cảm Nhận Mong Muốn

## Mục Tiêu Cảm Xúc Chính

GREENNEST BUILDFLOW cần tạo cảm giác rõ ràng, có kiểm soát và đáng tin. Người dùng, đặc biệt là lãnh đạo, phải cảm thấy rằng hệ thống đang giúp họ nhìn đúng vấn đề, đúng mức độ nghiêm trọng và đúng phạm vi trách nhiệm.

Cảm xúc chính cần đạt:

- Chủ tịch cảm thấy nắm được toàn hệ thống mà không bị chìm trong chi tiết nhỏ.
- Tổng Giám đốc cảm thấy kiểm soát được vận hành, leo thang, hàng đợi phê duyệt và tiến độ tổng.
- Giám đốc dự án cảm thấy biết rõ dự án đang ở đâu, rủi ro nào cần xử lý và hạn xử lý nào đang nóng.
- Trưởng bộ phận cảm thấy quy trình chuyên môn có trật tự, hồ sơ/checklist/việc không bị thất lạc.
- Thư ký/Trợ lý cảm thấy chuẩn bị họp, hồ sơ trình và nhắc việc cho lãnh đạo dễ hơn, ít phụ thuộc vào hỏi đáp thủ công.

## Hành Trình Cảm Xúc

Khi đăng nhập, người dùng cần thấy ngay không gian làm việc phù hợp với vai trò, không phải tự tìm xem mình nên bắt đầu từ đâu.

Trong quá trình sử dụng, giao diện cần tạo cảm giác đang đọc một bảng điều hành có tổ chức: KPI, rủi ro, phê duyệt, dòng thời gian, việc và hồ sơ được phân nhóm rõ, có ưu tiên, có xem chi tiết và có trạng thái.

Sau khi hoàn thành một hành động như duyệt, trả lại, giao việc, tạo cuộc họp hoặc xem rủi ro, người dùng cần cảm thấy hệ thống đã ghi nhận đầy đủ: ai làm, lúc nào, lý do gì, tác động tới bản ghi nào và bước tiếp theo là gì.

Khi có lỗi, thiếu quyền hoặc thiếu dữ liệu, hệ thống phải giữ cảm giác kiểm soát bằng thông báo rõ ràng, không gây hoang mang, không để người dùng nghĩ dữ liệu bị mất hoặc thao tác sai.

Khi quay lại sử dụng hằng ngày, người dùng cần cảm thấy hệ thống có nhịp vận hành ổn định: hôm nay có gì mới, việc nào quá hạn, rủi ro nào tăng, phê duyệt nào cần xử lý và thay đổi nào đã xảy ra.

## Cảm Xúc Vi Mô

Các cảm xúc vi mô quan trọng:

- Tự tin thay vì bối rối.
- Tin cậy thay vì nghi ngờ số liệu.
- Tập trung bình tĩnh thay vì quá tải thông tin.
- Kiểm soát thay vì cảm giác mất dấu việc.
- Sẵn sàng thay vì bị động trước cuộc họp hoặc phê duyệt.
- Rõ trách nhiệm thay vì không biết ai chịu trách nhiệm.

Những cảm xúc cần tránh:

- Rối vì quá nhiều card và màu sắc.
- Lo lắng vì không biết dữ liệu có theo đúng quyền không.
- Mất niềm tin vì KPI không xem chi tiết được.
- Bực bội vì phê duyệt, quyết định, việc và cuộc họp bị trộn lẫn.
- Cảm giác hệ thống chỉ là dashboard tĩnh, không giúp hành động.

## Hàm Ý Thiết Kế

Để tạo cảm giác rõ ràng và kiểm soát, giao diện cần dùng bố cục có phân cấp mạnh: khu tổng quan, khu cảnh báo ưu tiên, khu danh sách hành động và khu dòng thời gian/lịch sử.

Để tạo niềm tin, mọi KPI, rủi ro, phê duyệt và cảnh báo quan trọng phải có khả năng xem chi tiết dữ liệu nguồn, kèm trạng thái, người phụ trách, hạn xử lý, quyền xem và nhật ký kiểm toán khi cần.

Để giảm quá tải, mỗi không gian làm việc chỉ hiển thị thông tin phù hợp với vai trò. Chủ tịch không bị đẩy việc nhỏ; Giám đốc dự án không nhìn dữ liệu toàn hệ thống nếu không có phạm vi; Thư ký/Trợ lý chỉ thấy dữ liệu được ủy quyền.

Để tạo cảm giác khoa học, UI cần ưu tiên bảng, dòng thời gian, bản đồ nhiệt, nhãn trạng thái có chữ, lọc, tìm kiếm và phân nhóm rõ ràng thay vì thẻ trang trí lớn.

Để AI tạo niềm tin, mọi output AI phải được đặt trong ngữ cảnh cụ thể như chuẩn bị họp, tóm tắt phê duyệt, gợi ý checklist hoặc phân tích rủi ro; AI luôn là bản nháp/gợi ý và không tự thay người dùng ra quyết định.

## Nguyên Tắc Thiết Kế Cảm Xúc

- Điều hành bình tĩnh: giao diện tạo cảm giác điều hành chủ động, không gây nhiễu.
- Rõ ràng trước trang trí: ưu tiên dễ hiểu, dễ quét, dễ so sánh hơn hiệu ứng thị giác.
- Tin cậy qua truy vết: số liệu và hành động quan trọng phải truy ngược được nguồn.
- Tự tin theo vai trò: người dùng cảm thấy không gian này được thiết kế đúng cho vai trò của họ.
- Khẩn cấp có kiểm soát: việc khẩn phải nổi bật, nhưng không làm toàn bộ giao diện trở nên báo động liên tục.
- Thẩm quyền thuộc con người: hệ thống và AI hỗ trợ quyết định, nhưng quyền quyết định cuối cùng luôn thuộc con người có thẩm quyền.
