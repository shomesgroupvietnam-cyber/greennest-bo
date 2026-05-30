# User Journey Flows

## 1. Chairman / CEO Morning Command Loop

Mục tiêu: lãnh đạo mở workspace và trong 1-2 phút biết việc nào cần xử lý trước.

```mermaid
flowchart TD
  A[Đăng nhập] --> B[Mở workspace theo vai trò]
  B --> C[Xem KPI tổng, risk map, approval vượt ngưỡng]
  C --> D{Có vấn đề nghiêm trọng?}
  D -->|Có| E[Drill-down top issue]
  D -->|Không| F[Xem timeline và briefing]
  E --> G[Xem lý do, owner, deadline, dữ liệu nguồn]
  G --> H{Cần hành động?}
  H -->|Duyệt/Trả lại| I[Mở approval action]
  H -->|Cần họp| J[Tạo meeting/agenda draft]
  H -->|Cần giao việc| K[Tạo decision/assignment]
  I --> L[Ghi audit và cập nhật queue]
  J --> L
  K --> L
  F --> M[Kết thúc briefing]
  L --> M
```

## 2. Approval Vượt Ngưỡng

Mục tiêu: người có thẩm quyền xử lý approval quan trọng với đủ ngữ cảnh, lý do và audit.

```mermaid
flowchart TD
  A[Approval queue] --> B[Chọn approval vượt ngưỡng]
  B --> C[Xem request, số tiền, scope, policy, hồ sơ đính kèm]
  C --> D{Đủ thông tin?}
  D -->|Không| E[Return / Request changes và nhập lý do]
  D -->|Có| F{Quyết định}
  F -->|Approve| G[Nhập comment tùy chọn]
  F -->|Reject| H[Nhập lý do bắt buộc]
  F -->|Forward/Escalate| I[Chọn người/nhóm xử lý]
  F -->|Ask for Meeting| J[Tạo đề xuất họp]
  E --> K[Ghi history/audit]
  G --> K
  H --> K
  I --> K
  J --> K
  K --> L[Cập nhật trạng thái và thông báo người liên quan]
```

## 3. Project Director Risk / Deadline Flow

Mục tiêu: Giám đốc dự án nhìn được project đang kẹt ở đâu và xử lý đúng người đúng hạn.

```mermaid
flowchart TD
  A[Mở Project Director Workspace] --> B[Chọn project được giao]
  B --> C[Xem timeline, deadline heatmap, risk, approval project]
  C --> D[Chọn risk/deadline nóng]
  D --> E[Xem nguyên nhân, owner, hồ sơ/task liên quan]
  E --> F{Có quyền xử lý?}
  F -->|Có| G[Cập nhật trạng thái hoặc tạo action]
  F -->|Không| H[Escalate tới người có quyền]
  G --> I[Ghi audit và cập nhật project KPI]
  H --> I
  I --> J[Theo dõi trên timeline]
```

## 4. Department Head Checklist / Workflow Flow

Mục tiêu: trưởng bộ phận quản được hồ sơ, checklist, approval chuyên môn và risk chuyên môn.

```mermaid
flowchart TD
  A[Mở Department Workspace] --> B[Xem hồ sơ/checklist/task theo chuyên môn]
  B --> C[Lọc theo project, status, deadline, owner]
  C --> D[Chọn item thiếu hoặc bị chặn]
  D --> E[Xem yêu cầu, tài liệu, lịch sử, người phụ trách]
  E --> F{Cần AI hỗ trợ?}
  F -->|Có| G[Checklist AI gợi ý thiếu hồ sơ/bước tiếp theo]
  F -->|Không| H[Cập nhật workflow]
  G --> I[Xem citation và xác nhận tạo task draft]
  H --> J[Ghi trạng thái]
  I --> J
  J --> K[Cập nhật dashboard chuyên môn]
```

## 5. Secretary / Assistant Meeting Preparation Flow

Mục tiêu: thư ký/trợ lý chuẩn bị lịch, hồ sơ trình, agenda và summary trong phạm vi được ủy quyền.

```mermaid
flowchart TD
  A[Mở Secretary Workspace] --> B[Xem lịch lãnh đạo hôm nay]
  B --> C[Chọn cuộc họp hoặc hồ sơ trình]
  C --> D[Xem tài liệu, approval pending, risk liên quan]
  D --> E{Thiếu tài liệu?}
  E -->|Có| F[Tạo reminder/request bổ sung]
  E -->|Không| G[AI Meeting Preparation tạo agenda draft]
  F --> H[Cập nhật checklist chuẩn bị]
  G --> I[Kiểm tra citation và chỉnh agenda]
  H --> J[Gửi briefing pack cho lãnh đạo]
  I --> J
  J --> K[Ghi lịch sử chuẩn bị]
```

## Journey Patterns

Các pattern cần chuẩn hóa:

- Entry theo workspace vai trò, không bắt người dùng tự chọn từ dashboard chung.
- Mọi journey bắt đầu bằng priority queue hoặc dashboard theo scope.
- Drill-down luôn hiển thị lý do, owner, deadline, trạng thái, dữ liệu nguồn và action khả dụng.
- Mutation quan trọng luôn có confirmation, validation và audit/history.
- AI luôn ở trạng thái draft/gợi ý, có citation và cần người dùng xác nhận.

## Flow Optimization Principles

- Đưa việc khẩn lên trước, nhưng vẫn cho người dùng kiểm chứng nguồn.
- Giảm số bước từ dashboard tới action chính.
- Không yêu cầu lãnh đạo xử lý task nhỏ hoặc dữ liệu chuyên môn sâu mặc định.
- Không hiển thị action người dùng không có quyền.
- Khi thiếu quyền, giải thích rõ và gợi ý người/nhóm có thể xử lý.
- Sau mỗi action, cập nhật queue/timeline để người dùng thấy hệ thống đã ghi nhận.
