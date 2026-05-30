# UX Consistency Patterns

## Button Hierarchy

Button hierarchy phải giúp người dùng biết hành động nào là chính, hành động nào là phụ, hành động nào nguy hiểm.

**Primary action**

- Dùng cho hành động chính của màn hình hoặc panel.
- Ví dụ: `Duyệt`, `Tạo cuộc họp`, `Tạo quyết định`, `Lưu thay đổi`.
- Mỗi panel/action area chỉ nên có một primary action nổi bật.
- Màu primary dùng GreenNest green.

**Secondary action**

- Dùng cho hành động phụ.
- Ví dụ: `Xem nguồn`, `Mở chi tiết`, `Tải tài liệu`, `Lưu nháp`.

**Destructive action**

- Dùng cho từ chối, hủy, reject, xóa hoặc hành động làm mất hiệu lực record.
- Phải có confirmation nếu tác động quan trọng.
- Reject/Return phải yêu cầu lý do khi policy yêu cầu.

**Disabled / permission-denied action**

- Không hiển thị action nếu người dùng hoàn toàn không có quyền.
- Nếu action cần giải thích nghiệp vụ, có thể hiển thị disabled kèm tooltip/lý do: `Bạn không có quyền duyệt approval này`.

## Feedback Patterns

Feedback phải giúp người dùng tin rằng hệ thống đã ghi nhận trạng thái.

**Success**

- Hiển thị sau khi action hoàn tất.
- Nêu rõ record nào đã đổi trạng thái và bước tiếp theo là gì.
- Ví dụ: `Approval đã được duyệt. Quyết định đã được ghi vào audit log.`

**Warning**

- Dùng cho sắp quá hạn, thiếu dữ liệu, policy chưa đủ điều kiện.
- Warning không được chặn thao tác nếu vẫn hợp lệ.

**Error**

- Dùng khi validation fail, permission fail, service fail.
- Error message phải nói rõ điều gì sai và cách khắc phục.
- Không dùng thông báo chung chung kiểu `Có lỗi xảy ra` nếu có thể cung cấp ngữ cảnh.

**Permission / 403**

- Với direct URL access, trả 403 rõ ràng.
- Trong UI, giải thích người dùng thiếu quyền gì hoặc scope nào nếu phù hợp.
- Không render dữ liệu rồi mới ẩn.

## Form Patterns

Forms trong app phải ngắn gọn, có validation và giữ ngữ cảnh.

**General form**

- Label tiếng Việt rõ.
- Required fields có dấu hiệu rõ.
- Inline validation gần field.
- Giữ input khi validation fail.
- Primary submit nằm cuối form hoặc trong sticky action area nếu form dài.

**Approval form**

- Approve: comment tùy chọn.
- Reject: lý do bắt buộc.
- Return / Request changes: lý do và yêu cầu chỉnh sửa bắt buộc.
- Forward / Escalate: chọn người/nhóm nhận và comment khuyến nghị.
- Ask for Meeting: chọn meeting type, agenda draft, participant scope.

**AI action proposal form**

- Hiển thị preview trước mutation.
- Liệt kê record bị ảnh hưởng, field thay đổi, permission cần có.
- Confirm button phải explicit, ví dụ `Xác nhận tạo task`.
- Reject proposal cho phép nhập lý do tùy chọn và không đổi business record.

## Navigation Patterns

Navigation phải permission-aware và role-first.

**Sidebar**

- Desktop dùng sidebar cố định.
- Chỉ hiển thị module/workspace người dùng có quyền truy cập.
- Workspace theo vai trò nằm gần đầu sidebar.

**Topbar**

- Hiển thị workspace hiện tại, scope selector, search, notification và user menu.
- Nếu người dùng có nhiều role/scope, selector phải rõ nhưng không chiếm quá nhiều diện tích.

**Mobile**

- Sidebar chuyển thành drawer.
- Topbar ưu tiên workspace, search và menu.
- Các bảng dày chuyển thành list compact.

**Breadcrumb / context**

- Detail pages phải cho biết record thuộc organization, project, axis/module nào.
- Drill-down panel phải giữ link quay lại dashboard/queue ban đầu.

## Drill-Down Patterns

Mọi KPI, risk, approval, deadline hoặc alert quan trọng phải có đường drill-down.

**Drill-down bắt buộc hiển thị:**

- Tiêu đề record.
- Loại record.
- Scope.
- Owner.
- Deadline.
- Trạng thái.
- Lý do bị cảnh báo hoặc bị chặn.
- Dữ liệu nguồn hoặc linked records.
- Action khả dụng theo quyền.
- Timeline/audit nếu có.

**Desktop**

- Dùng side panel hoặc detail page tùy độ phức tạp.
- Với quick review, side panel là mặc định tốt.

**Mobile**

- Dùng full-screen sheet hoặc detail page.
- Không ép layout 2 cột.

## Search and Filtering Patterns

Search/filter phải hỗ trợ dữ liệu vận hành lớn.

- Search theo tên project, approval, hồ sơ, owner, mã record.
- Filter theo status, severity, project, owner, deadline, module, scope.
- Bảng/list quan trọng phải có sort.
- Filter active phải hiển thị rõ và xóa được.
- Saved view có thể bổ sung sau nếu danh sách lớn.

## Loading, Empty, Error and Unauthorized States

**Loading**

- Dùng skeleton cho dashboard/panel/table.
- Không layout shift mạnh khi data load xong.

**Empty**

- Empty state phải nói rõ không có gì trong scope hiện tại hay do filter.
- Nếu có quyền, hiển thị next action phù hợp.
- Nếu không có quyền, không gợi ý action không làm được.

**Error**

- Có retry nếu lỗi tạm thời.
- Có link về dashboard/workspace nếu lỗi record không tồn tại hoặc không truy cập được.

**Unauthorized**

- Không hiển thị dữ liệu nhạy cảm.
- Nêu rõ người dùng không có quyền hoặc không thuộc scope.
- Gợi ý liên hệ quản trị/phụ trách nếu phù hợp.

## AI UX Patterns

AI phải là contextual assistant.

- AI panel nằm trong đúng workspace hoặc record context.
- AI output luôn có trạng thái: draft/gợi ý/proposed.
- AI answer cần citation với internal record hoặc knowledge item.
- AI không tự approve, reject, tạo blocker chính thức hoặc publish biên bản.
- Nếu AI đề xuất mutation, phải đi qua action proposal preview và human confirmation.
- Nếu thiếu quyền, AI không được truy xuất hoặc hiển thị dữ liệu ngoài scope.
