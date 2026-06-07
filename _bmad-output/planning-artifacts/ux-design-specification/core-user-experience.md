# Trải Nghiệm Cốt Lõi

## Trải Nghiệm Định Danh

Trải nghiệm cốt lõi của GREENNEST BUILDFLOW là hệ thống không gian làm việc theo vai trò, nơi mỗi người dùng vào đúng bề mặt điều hành tương ứng với quyền hạn và phạm vi công việc của mình.

Vòng lặp chính của người dùng là:

1. Xem tổng quan theo phạm vi được phân quyền.
2. Nhận diện việc quan trọng, rủi ro, phê duyệt, hạn xử lý hoặc leo thang cần xử lý.
3. Xem chi tiết dữ liệu nguồn để hiểu nguyên nhân.
4. Thực hiện hành động phù hợp: duyệt, trả lại, chuyển cấp, tạo quyết định, giao việc, tạo họp hoặc xem nhật ký kiểm toán.
5. Theo dõi kết quả qua dòng thời gian, lịch sử và trạng thái thực hiện.

Trọng tâm UX không phải là nhập liệu vi mô, mà là giúp từng nhóm người dùng nhìn đúng thứ cần nhìn và ra quyết định nhanh hơn.

## Chiến Lược Nền Tảng

Sản phẩm là ứng dụng web responsive.

Desktop là bề mặt làm việc chính cho dashboard, bảng dữ liệu, xem chi tiết, dòng thời gian, phê duyệt, phân quyền và thao tác điều hành phức tạp.

Mobile cần hỗ trợ responsive đủ tốt cho các tình huống kiểm tra nhanh: xem dashboard, xem phê duyệt đang chờ, đọc rủi ro/điểm chặn, mở lịch họp, xem tài liệu trình và cập nhật trạng thái nhẹ. Mobile không phải bề mặt chính để cấu hình phức tạp hoặc xử lý bảng dữ liệu dày.

## Tương Tác Dễ Hiểu

Các tương tác cần gần như không cần suy nghĩ:

- Người dùng đăng nhập và vào đúng không gian làm việc theo vai trò.
- Chủ tịch thấy ngay toàn cảnh hệ thống, KPI tổng, dòng tiền tổng, bản đồ rủi ro, vấn đề nguy hiểm nhất, dự án đỏ và phê duyệt vượt ngưỡng.
- Tổng Giám đốc thấy ngay vận hành tổng, tiến độ, phân bổ nguồn lực, phân tích hiệu suất, hàng đợi phê duyệt, rủi ro vận hành và leo thang.
- Giám đốc dự án thấy ngay tình trạng dự án được giao, dòng thời gian, chi phí, phê duyệt, rủi ro, việc ưu tiên và bản đồ áp lực hạn xử lý.
- Trưởng bộ phận thấy ngay hồ sơ chuyên môn, việc, quy trình, checklist, phê duyệt chuyên môn và rủi ro chuyên môn.
- Thư ký/Trợ lý thấy ngay lịch lãnh đạo, hồ sơ trình, tài liệu họp, nhắc việc, việc hỗ trợ và phê duyệt đang chờ.
- Từ mọi KPI, rủi ro, phê duyệt hoặc cảnh báo quan trọng, người dùng có thể xem chi tiết dữ liệu nguồn.
- Hành động quan trọng luôn có trạng thái, lý do, người chịu trách nhiệm, hạn xử lý và nhật ký kiểm toán.

## Khoảnh Khắc Thành Công Quan Trọng

Khoảnh khắc thành công đầu tiên là khi Chủ tịch hoặc Tổng Giám đốc mở không gian làm việc và trong 1-2 phút biết chính xác hôm nay cần chú ý điều gì, vấn đề nào nguy hiểm nhất, phê duyệt nào vượt ngưỡng, dự án nào đang đỏ và cần xem chi tiết ở đâu.

Với Giám đốc dự án, khoảnh khắc thành công là nhìn được tình trạng dự án được giao, rủi ro, hạn xử lý, phê duyệt và việc ưu tiên mà không phải gom dữ liệu từ nhiều nơi.

Với Trưởng bộ phận, khoảnh khắc thành công là quản được checklist/quy trình chuyên môn và biết ngay hồ sơ nào thiếu, việc nào chờ xử lý, phê duyệt nào đang kẹt.

Với Thư ký/Trợ lý, khoảnh khắc thành công là chuẩn bị được lịch, hồ sơ trình, chương trình họp, tài liệu họp và nhắc việc cho lãnh đạo mà không cần hỏi lại nhiều lần.

## Nguyên Tắc Trải Nghiệm

- Ưu tiên vai trò: mỗi vai trò có không gian làm việc riêng, không dùng một dashboard chung cho tất cả.
- Theo đúng phạm vi: mọi số liệu, danh sách, hành động và xem chi tiết phải tuân thủ vai trò + phạm vi + hành động.
- Rõ cho lãnh đạo: bề mặt lãnh đạo ưu tiên tổng quan, rủi ro, quyết định, phê duyệt vượt ngưỡng và chiến lược; không đẩy việc nhỏ hoặc dữ liệu chuyên môn sâu lên mặc định.
- Dày thông tin nhưng dễ đọc: giao diện phải khoa học, dễ quét, đủ dày cho vận hành nhưng không rối.
- Dashboard có thể hành động: KPI và cảnh báo phải dẫn đến dữ liệu nguồn hoặc hành động tiếp theo.
- Nhật ký là mặc định: phê duyệt, quyết định, giao việc, rủi ro, cuộc họp và phân quyền quan trọng đều phải có lịch sử/nhật ký kiểm toán rõ ràng.
- AI là trợ lý, không phải người quyết định: AI hỗ trợ chuẩn bị họp, tóm tắt, gợi ý checklist, chương trình họp, rủi ro hoặc insight phê duyệt, nhưng không tự phê duyệt, tự quyết định hoặc tự thay đổi dữ liệu.
