# Luồng Trải Nghiệm Người Dùng

## 1. Luồng Điều Hành Đầu Ngày Của Chủ Tịch / Tổng Giám Đốc

Mục tiêu: lãnh đạo mở không gian làm việc và trong 1-2 phút biết việc nào cần xử lý trước.

```mermaid
flowchart TD
  A[Đăng nhập] --> B[Mở không gian làm việc theo vai trò]
  B --> C[Xem KPI tổng, bản đồ rủi ro, phê duyệt vượt ngưỡng]
  C --> D{Có vấn đề nghiêm trọng?}
  D -->|Có| E[Xem chi tiết vấn đề nổi bật]
  D -->|Không| F[Xem dòng thời gian và bản tóm tắt]
  E --> G[Xem lý do, người phụ trách, hạn xử lý, dữ liệu nguồn]
  G --> H{Cần hành động?}
  H -->|Duyệt/Trả lại| I[Mở bảng xử lý phê duyệt]
  H -->|Cần họp| J[Tạo bản nháp cuộc họp/chương trình họp]
  H -->|Cần giao việc| K[Tạo quyết định/giao việc]
  I --> L[Ghi nhật ký kiểm toán và cập nhật hàng đợi]
  J --> L
  K --> L
  F --> M[Kết thúc bản tóm tắt đầu ngày]
  L --> M
```

## 2. Approval Vượt Ngưỡng

Mục tiêu: người có thẩm quyền xử lý phê duyệt quan trọng với đủ ngữ cảnh, lý do và nhật ký kiểm toán.

```mermaid
flowchart TD
  A[Hàng đợi phê duyệt] --> B[Chọn phê duyệt vượt ngưỡng]
  B --> C[Xem yêu cầu, số tiền, phạm vi, chính sách, hồ sơ đính kèm]
  C --> D{Đủ thông tin?}
  D -->|Không| E[Trả lại / Yêu cầu chỉnh sửa và nhập lý do]
  D -->|Có| F{Quyết định}
  F -->|Duyệt| G[Nhập bình luận tùy chọn]
  F -->|Từ chối| H[Nhập lý do bắt buộc]
  F -->|Chuyển tiếp/Leo thang| I[Chọn người/nhóm xử lý]
  F -->|Yêu cầu họp| J[Tạo đề xuất họp]
  E --> K[Ghi lịch sử/nhật ký kiểm toán]
  G --> K
  H --> K
  I --> K
  J --> K
  K --> L[Cập nhật trạng thái và thông báo người liên quan]
```

## 3. Luồng Rủi Ro / Hạn Xử Lý Của Giám Đốc Dự Án

Mục tiêu: Giám đốc dự án nhìn được dự án đang kẹt ở đâu và xử lý đúng người đúng hạn.

```mermaid
flowchart TD
  A[Mở Không Gian Giám Đốc Dự Án] --> B[Chọn dự án được giao]
  B --> C[Xem dòng thời gian, bản đồ hạn xử lý, rủi ro, phê duyệt của dự án]
  C --> D[Chọn rủi ro/hạn xử lý nóng]
  D --> E[Xem nguyên nhân, người phụ trách, hồ sơ/việc liên quan]
  E --> F{Có quyền xử lý?}
  F -->|Có| G[Cập nhật trạng thái hoặc tạo hành động]
  F -->|Không| H[Escalate tới người có quyền]
  G --> I[Ghi nhật ký kiểm toán và cập nhật KPI dự án]
  H --> I
  I --> J[Theo dõi trên dòng thời gian]
```

## 4. Luồng Checklist / Quy Trình Của Trưởng Bộ Phận

Mục tiêu: Trưởng bộ phận quản được hồ sơ, checklist, phê duyệt chuyên môn và rủi ro chuyên môn.

```mermaid
flowchart TD
  A[Mở Không Gian Trưởng Bộ Phận] --> B[Xem hồ sơ/checklist/việc theo chuyên môn]
  B --> C[Lọc theo dự án, trạng thái, hạn xử lý, người phụ trách]
  C --> D[Chọn mục thiếu hoặc bị chặn]
  D --> E[Xem yêu cầu, tài liệu, lịch sử, người phụ trách]
  E --> F{Cần AI hỗ trợ?}
  F -->|Có| G[Checklist AI gợi ý thiếu hồ sơ/bước tiếp theo]
  F -->|Không| H[Cập nhật quy trình]
  G --> I[Xem nguồn trích dẫn và xác nhận tạo việc nháp]
  H --> J[Ghi trạng thái]
  I --> J
  J --> K[Cập nhật dashboard chuyên môn]
```

## 5. Luồng Chuẩn Bị Họp Của Thư Ký / Trợ Lý

Mục tiêu: Thư ký/Trợ lý chuẩn bị lịch, hồ sơ trình, chương trình họp và tóm tắt trong phạm vi được ủy quyền.

```mermaid
flowchart TD
  A[Mở Không Gian Thư Ký/Trợ Lý] --> B[Xem lịch lãnh đạo hôm nay]
  B --> C[Chọn cuộc họp hoặc hồ sơ trình]
  C --> D[Xem tài liệu, phê duyệt đang chờ, rủi ro liên quan]
  D --> E{Thiếu tài liệu?}
  E -->|Có| F[Tạo nhắc việc/yêu cầu bổ sung]
  E -->|Không| G[AI chuẩn bị họp tạo chương trình họp nháp]
  F --> H[Cập nhật checklist chuẩn bị]
  G --> I[Kiểm tra nguồn trích dẫn và chỉnh chương trình họp]
  H --> J[Gửi bộ tóm tắt cho lãnh đạo]
  I --> J
  J --> K[Ghi lịch sử chuẩn bị]
```

## Pattern Luồng Cần Chuẩn Hóa

Các pattern cần chuẩn hóa:

- Điểm vào theo không gian làm việc vai trò, không bắt người dùng tự chọn từ dashboard chung.
- Mọi luồng bắt đầu bằng hàng đợi ưu tiên hoặc dashboard theo phạm vi.
- Xem chi tiết luôn hiển thị lý do, người phụ trách, hạn xử lý, trạng thái, dữ liệu nguồn và hành động khả dụng.
- Thay đổi dữ liệu quan trọng luôn có xác nhận, kiểm tra hợp lệ và lịch sử/nhật ký kiểm toán.
- AI luôn ở trạng thái bản nháp/gợi ý, có nguồn trích dẫn và cần người dùng xác nhận.

## Nguyên Tắc Tối Ưu Luồng

- Đưa việc khẩn lên trước, nhưng vẫn cho người dùng kiểm chứng nguồn.
- Giảm số bước từ dashboard tới hành động chính.
- Không yêu cầu lãnh đạo xử lý việc nhỏ hoặc dữ liệu chuyên môn sâu mặc định.
- Không hiển thị hành động người dùng không có quyền.
- Khi thiếu quyền, giải thích rõ và gợi ý người/nhóm có thể xử lý.
- Sau mỗi hành động, cập nhật hàng đợi/dòng thời gian để người dùng thấy hệ thống đã ghi nhận.
