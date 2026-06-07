# 2. Trải Nghiệm Cốt Lõi

## 2.1 Trải Nghiệm Định Danh

Trải nghiệm định danh của GREENNEST BUILDFLOW là vòng lặp điều hành theo không gian làm việc vai trò:

```text
Vào không gian làm việc theo vai trò
-> thấy ưu tiên quan trọng nhất
-> xem chi tiết dữ liệu nguồn
-> xử lý hoặc giao hành động
-> hệ thống ghi nhận lịch sử/nhật ký kiểm toán
-> quay lại dashboard với trạng thái đã cập nhật
```

Nếu làm đúng vòng lặp này, sản phẩm sẽ khác giao diện cũ: không còn là dashboard tĩnh hoặc tập hợp thẻ rời rạc, mà trở thành bề mặt điều hành thật sự.

## 2.2 Mô Hình Tư Duy Người Dùng

Người dùng mang theo mô hình tư duy từ cách điều hành thực tế:

- Chủ tịch nghĩ theo toàn hệ thống, chiến lược, dòng tiền, rủi ro lớn, bổ nhiệm và phân quyền cấp cao.
- Tổng Giám đốc nghĩ theo vận hành tổng, tiến độ, nguồn lực, KPI, hàng đợi phê duyệt và leo thang.
- Giám đốc dự án nghĩ theo dự án được giao, dòng thời gian, chi phí, việc ưu tiên, phê duyệt và rủi ro dự án.
- Trưởng bộ phận nghĩ theo quy trình chuyên môn, checklist, hồ sơ, việc và phê duyệt chuyên môn.
- Thư ký/Trợ lý nghĩ theo lịch lãnh đạo, hồ sơ trình, tài liệu họp, nhắc việc và chuẩn bị nội dung.

UX phải đi theo mô hình tư duy này thay vì ép mọi người dùng vào cùng một dashboard.

## 2.3 Tiêu Chí Thành Công

Trải nghiệm cốt lõi được xem là thành công khi:

- Người dùng vào ứng dụng và thấy đúng không gian làm việc của mình.
- Trong 1-2 phút, Chủ tịch/Tổng Giám đốc biết vấn đề quan trọng nhất hôm nay.
- KPI, rủi ro, phê duyệt, hạn xử lý và leo thang đều xem chi tiết được.
- Mỗi cảnh báo quan trọng có lý do, người phụ trách, hạn xử lý, trạng thái và hành động tiếp theo.
- Người dùng không phải đoán dữ liệu này thuộc phạm vi nào hoặc có được phép xem không.
- Sau một hành động quan trọng, hệ thống cập nhật trạng thái và ghi lịch sử/nhật ký kiểm toán rõ ràng.
- Mobile vẫn xem được ưu tiên chính, phê duyệt đang chờ, rủi ro và lịch họp mà không vỡ bố cục.

## 2.4 Pattern UX Sử Dụng

Sản phẩm nên dùng pattern quen thuộc, không cần phát minh tương tác lạ:

- Dashboard + xem chi tiết từ Power BI/Tableau.
- Queue ưu tiên từ Jira/Linear.
- Chi tiết bản ghi + dòng thời gian hoạt động từ Salesforce/Dynamics.
- Không gian làm việc theo vai trò từ SAP Fiori.
- Bảng AI theo ngữ cảnh thay vì chatbot chung.

Điểm khác biệt không nằm ở tương tác mới lạ, mà nằm ở cách kết hợp các pattern vận hành doanh nghiệp thành không gian điều hành đúng vai trò, đúng phạm vi và có thể hành động ngay.

## 2.5 Cơ Chế Trải Nghiệm

### Khởi Động

Người dùng đăng nhập và được đưa vào không gian làm việc mặc định theo vai trò chính. Nếu có nhiều vai trò/phạm vi, UI cho phép chuyển không gian làm việc hoặc phạm vi rõ ràng.

### Tương Tác

Người dùng đọc các vùng ưu tiên:

- KPI tổng hoặc KPI theo phạm vi.
- Bản đồ rủi ro hoặc hàng đợi rủi ro.
- Hàng đợi phê duyệt.
- Hạn xử lý/leo thang.
- Dòng thời gian hoặc luồng hoạt động.
- AI hỗ trợ theo ngữ cảnh nếu cần.

Người dùng chọn một mục để xem chi tiết, xem dữ liệu nguồn, bản ghi liên quan, lịch sử, người phụ trách và hành động khả dụng.

### Phản Hồi

Hệ thống phản hồi bằng:

- Badge trạng thái có chữ.
- Lý do rủi ro/quá hạn/leo thang.
- Kiểm tra hợp lệ tại chỗ khi hành động thiếu dữ liệu.
- Xác nhận rõ ràng trước thay đổi dữ liệu quan trọng.
- Lịch sử/nhật ký kiểm toán sau khi hành động hoàn tất.

### Hoàn Tất

Một hành động hoàn tất khi:

- Trạng thái bản ghi được cập nhật.
- Người chịu trách nhiệm và hạn xử lý tiếp theo rõ ràng.
- Nhật ký kiểm toán được ghi.
- Dashboard/hàng đợi phản ánh trạng thái mới.
- Người dùng biết bước tiếp theo là theo dõi, chờ phản hồi, hoặc xử lý mục kế tiếp.
