# Desired Emotional Response

## Primary Emotional Goals

GREENNEST BUILDFLOW cần tạo cảm giác rõ ràng, có kiểm soát và đáng tin. Người dùng, đặc biệt là lãnh đạo, phải cảm thấy rằng hệ thống đang giúp họ nhìn đúng vấn đề, đúng mức độ nghiêm trọng và đúng phạm vi trách nhiệm.

Cảm xúc chính cần đạt:

- Chairman cảm thấy nắm được toàn hệ thống mà không bị chìm trong chi tiết nhỏ.
- CEO cảm thấy kiểm soát được vận hành, escalation, approval queue và tiến độ tổng.
- Project Director cảm thấy biết rõ dự án đang ở đâu, rủi ro nào cần xử lý và deadline nào đang nóng.
- Department Head cảm thấy workflow chuyên môn có trật tự, hồ sơ/checklist/task không bị thất lạc.
- Secretary / Assistant cảm thấy chuẩn bị họp, hồ sơ trình và reminder cho lãnh đạo dễ hơn, ít phụ thuộc vào hỏi đáp thủ công.

## Emotional Journey Mapping

Khi đăng nhập, người dùng cần thấy ngay workspace phù hợp với vai trò, không phải tự tìm xem mình nên bắt đầu từ đâu.

Trong quá trình sử dụng, giao diện cần tạo cảm giác đang đọc một bảng điều hành có tổ chức: KPI, risk, approval, timeline, task và hồ sơ được phân nhóm rõ, có ưu tiên, có drill-down và có trạng thái.

Sau khi hoàn thành một hành động như duyệt, trả lại, giao việc, tạo meeting hoặc xem risk, người dùng cần cảm thấy hệ thống đã ghi nhận đầy đủ: ai làm, lúc nào, lý do gì, tác động tới record nào và bước tiếp theo là gì.

Khi có lỗi, thiếu quyền hoặc thiếu dữ liệu, hệ thống phải giữ cảm giác kiểm soát bằng thông báo rõ ràng, không gây hoang mang, không để người dùng nghĩ dữ liệu bị mất hoặc thao tác sai.

Khi quay lại sử dụng hằng ngày, người dùng cần cảm thấy hệ thống có nhịp vận hành ổn định: hôm nay có gì mới, việc nào quá hạn, risk nào tăng, approval nào cần xử lý và thay đổi nào đã xảy ra.

## Micro-Emotions

Các micro-emotion quan trọng:

- Confidence thay vì confusion.
- Trust thay vì nghi ngờ số liệu.
- Calm focus thay vì quá tải thông tin.
- Control thay vì cảm giác mất dấu việc.
- Readiness thay vì bị động trước cuộc họp hoặc approval.
- Accountability thay vì không biết ai chịu trách nhiệm.

Những cảm xúc cần tránh:

- Rối vì quá nhiều card và màu sắc.
- Lo lắng vì không biết dữ liệu có theo đúng quyền không.
- Mất niềm tin vì KPI không drill-down được.
- Bực bội vì approval, decision, task và meeting bị trộn lẫn.
- Cảm giác hệ thống chỉ là dashboard tĩnh, không giúp hành động.

## Design Implications

Để tạo cảm giác rõ ràng và kiểm soát, giao diện cần dùng layout có phân cấp mạnh: khu tổng quan, khu cảnh báo ưu tiên, khu danh sách hành động và khu timeline/history.

Để tạo niềm tin, mọi KPI, risk, approval và cảnh báo quan trọng phải có khả năng drill-down đến dữ liệu nguồn, kèm trạng thái, chủ sở hữu, deadline, quyền xem và audit trail khi cần.

Để giảm quá tải, mỗi workspace chỉ hiển thị thông tin phù hợp với vai trò. Chairman không bị đẩy task nhỏ; Project Director không nhìn dữ liệu toàn hệ thống nếu không có scope; Secretary / Assistant chỉ thấy dữ liệu được ủy quyền.

Để tạo cảm giác khoa học, UI cần ưu tiên bảng, timeline, heatmap, status badge có chữ, filter, search và grouping rõ ràng thay vì card trang trí lớn.

Để AI tạo niềm tin, mọi AI output phải được đặt trong ngữ cảnh cụ thể như chuẩn bị họp, tóm tắt approval, gợi ý checklist hoặc phân tích risk; AI luôn là draft/gợi ý và không tự thay người dùng ra quyết định.

## Emotional Design Principles

- Calm command: giao diện tạo cảm giác điều hành bình tĩnh, không gây nhiễu.
- Clarity before decoration: ưu tiên dễ hiểu, dễ quét, dễ so sánh hơn hiệu ứng thị giác.
- Trust through traceability: số liệu và hành động quan trọng phải truy ngược được nguồn.
- Role confidence: người dùng cảm thấy workspace này được thiết kế đúng cho vai trò của họ.
- Controlled urgency: việc khẩn phải nổi bật, nhưng không làm toàn bộ giao diện trở nên báo động liên tục.
- Human authority: hệ thống và AI hỗ trợ quyết định, nhưng quyền quyết định cuối cùng luôn thuộc con người có thẩm quyền.
