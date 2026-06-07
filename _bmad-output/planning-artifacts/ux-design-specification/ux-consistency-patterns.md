# Pattern Nhất Quán UX

## Phân Cấp Nút Bấm

Phân cấp nút bấm phải giúp người dùng biết hành động nào là chính, hành động nào là phụ, hành động nào nguy hiểm.

**Hành động chính**

- Dùng cho hành động chính của màn hình hoặc khung nội dung.
- Ví dụ: `Duyệt`, `Tạo cuộc họp`, `Tạo quyết định`, `Lưu thay đổi`.
- Mỗi khung/vùng hành động chỉ nên có một hành động chính nổi bật.
- Màu chính dùng xanh GreenNest.

**Hành động phụ**

- Dùng cho hành động phụ.
- Ví dụ: `Xem nguồn`, `Mở chi tiết`, `Tải tài liệu`, `Lưu nháp`.

**Hành động nguy hiểm**

- Dùng cho từ chối, hủy, xóa hoặc hành động làm mất hiệu lực bản ghi.
- Phải có xác nhận nếu tác động quan trọng.
- Từ chối/Trả lại phải yêu cầu lý do khi chính sách yêu cầu.

**Hành động bị khóa / không có quyền**

- Không hiển thị hành động nếu người dùng hoàn toàn không có quyền.
- Nếu hành động cần giải thích nghiệp vụ, có thể hiển thị trạng thái bị khóa kèm gợi ý/lý do: `Bạn không có quyền duyệt phê duyệt này`.

## Pattern Phản Hồi

Phản hồi phải giúp người dùng tin rằng hệ thống đã ghi nhận trạng thái.

**Thành công**

- Hiển thị sau khi hành động hoàn tất.
- Nêu rõ bản ghi nào đã đổi trạng thái và bước tiếp theo là gì.
- Ví dụ: `Phê duyệt đã được duyệt. Quyết định đã được ghi vào nhật ký kiểm toán.`

**Cảnh báo**

- Dùng cho sắp quá hạn, thiếu dữ liệu, chính sách chưa đủ điều kiện.
- Cảnh báo không được chặn thao tác nếu vẫn hợp lệ.

**Lỗi**

- Dùng khi kiểm tra hợp lệ thất bại, quyền thất bại, service thất bại.
- Thông báo lỗi phải nói rõ điều gì sai và cách khắc phục.
- Không dùng thông báo chung chung kiểu `Có lỗi xảy ra` nếu có thể cung cấp ngữ cảnh.

**Không Có Quyền / 403**

- Với direct URL access, trả 403 rõ ràng.
- Trong UI, giải thích người dùng thiếu quyền gì hoặc phạm vi nào nếu phù hợp.
- Không render dữ liệu rồi mới ẩn.

## Pattern Form

Form trong ứng dụng phải ngắn gọn, có kiểm tra hợp lệ và giữ ngữ cảnh.

**Form chung**

- Label tiếng Việt rõ.
- Trường bắt buộc có dấu hiệu rõ.
- Kiểm tra hợp lệ tại chỗ gần trường.
- Giữ nội dung nhập khi kiểm tra hợp lệ thất bại.
- Nút gửi chính nằm cuối form hoặc trong vùng hành động cố định nếu form dài.

**Form phê duyệt**

- Duyệt: bình luận tùy chọn.
- Từ chối: lý do bắt buộc.
- Trả lại / Yêu cầu chỉnh sửa: lý do và yêu cầu chỉnh sửa bắt buộc.
- Chuyển tiếp / Leo thang: chọn người/nhóm nhận và bình luận khuyến nghị.
- Yêu cầu họp: chọn loại cuộc họp, chương trình họp nháp, phạm vi người tham gia.

**Form đề xuất hành động AI**

- Hiển thị bản xem trước trước khi thay đổi dữ liệu.
- Liệt kê bản ghi bị ảnh hưởng, trường thay đổi, quyền cần có.
- Nút xác nhận phải rõ nghĩa, ví dụ `Xác nhận tạo việc`.
- Từ chối đề xuất cho phép nhập lý do tùy chọn và không đổi bản ghi nghiệp vụ.

## Pattern Điều Hướng

Điều hướng phải theo quyền và ưu tiên vai trò.

**Thanh điều hướng bên**

- Desktop dùng thanh điều hướng cố định.
- Chỉ hiển thị module/không gian làm việc người dùng có quyền truy cập.
- Không gian làm việc theo vai trò nằm gần đầu thanh điều hướng.

**Thanh trên**

- Hiển thị không gian làm việc hiện tại, bộ chọn phạm vi, tìm kiếm, thông báo và menu người dùng.
- Nếu người dùng có nhiều vai trò/phạm vi, bộ chọn phải rõ nhưng không chiếm quá nhiều diện tích.

**Mobile**

- Thanh điều hướng chuyển thành ngăn kéo.
- Thanh trên ưu tiên không gian làm việc, tìm kiếm và menu.
- Các bảng dày chuyển thành danh sách gọn.

**Breadcrumb / ngữ cảnh**

- Trang chi tiết phải cho biết bản ghi thuộc tổ chức, dự án, trục/module nào.
- Ngăn xem chi tiết phải giữ liên kết quay lại dashboard/hàng đợi ban đầu.

## Pattern Xem Chi Tiết

Mọi KPI, rủi ro, phê duyệt, hạn xử lý hoặc cảnh báo quan trọng phải có đường xem chi tiết.

**Xem chi tiết bắt buộc hiển thị:**

- Tiêu đề bản ghi.
- Loại bản ghi.
- Phạm vi.
- Người phụ trách.
- Hạn xử lý.
- Trạng thái.
- Lý do bị cảnh báo hoặc bị chặn.
- Dữ liệu nguồn hoặc bản ghi liên quan.
- Hành động khả dụng theo quyền.
- Dòng thời gian/nhật ký kiểm toán nếu có.

**Desktop**

- Dùng side panel hoặc detail page tùy độ phức tạp.
- Với review nhanh, ngăn bên là mặc định tốt.

**Mobile**

- Dùng ngăn toàn màn hình hoặc trang chi tiết.
- Không ép bố cục 2 cột.

## Pattern Tìm Kiếm Và Lọc

Tìm kiếm/lọc phải hỗ trợ dữ liệu vận hành lớn.

- Tìm kiếm theo tên dự án, phê duyệt, hồ sơ, người phụ trách, mã bản ghi.
- Lọc theo trạng thái, mức độ nghiêm trọng, dự án, người phụ trách, hạn xử lý, module, phạm vi.
- Bảng/danh sách quan trọng phải có sắp xếp.
- Bộ lọc đang áp dụng phải hiển thị rõ và xóa được.
- Góc nhìn đã lưu có thể bổ sung sau nếu danh sách lớn.

## Trạng Thái Đang Tải, Chưa Có Dữ Liệu, Lỗi Và Không Có Quyền

**Đang tải**

- Dùng khung chờ cho dashboard/khung/bảng.
- Không làm lệch bố cục mạnh khi dữ liệu tải xong.

**Chưa có dữ liệu**

- Trạng thái chưa có dữ liệu phải nói rõ không có gì trong phạm vi hiện tại hay do bộ lọc.
- Nếu có quyền, hiển thị hành động tiếp theo phù hợp.
- Nếu không có quyền, không gợi ý hành động không làm được.

**Lỗi**

- Có thử lại nếu lỗi tạm thời.
- Có liên kết về dashboard/không gian làm việc nếu bản ghi không tồn tại hoặc không truy cập được.

**Không có quyền**

- Không hiển thị dữ liệu nhạy cảm.
- Nêu rõ người dùng không có quyền hoặc không thuộc phạm vi.
- Gợi ý liên hệ quản trị/phụ trách nếu phù hợp.

## Pattern UX Cho AI

AI phải là trợ lý theo ngữ cảnh.

- Bảng AI nằm trong đúng không gian làm việc hoặc ngữ cảnh bản ghi.
- Output AI luôn có trạng thái: bản nháp/gợi ý/đề xuất.
- Câu trả lời AI cần nguồn trích dẫn từ bản ghi nội bộ hoặc mục tri thức.
- AI không tự duyệt, từ chối, tạo blocker chính thức hoặc xuất bản biên bản.
- Nếu AI đề xuất thay đổi dữ liệu, phải đi qua màn xem trước đề xuất hành động và xác nhận của người dùng.
- Nếu thiếu quyền, AI không được truy xuất hoặc hiển thị dữ liệu ngoài phạm vi.
