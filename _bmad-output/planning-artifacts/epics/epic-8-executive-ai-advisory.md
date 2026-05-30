# Epic 8: Executive AI Advisory

Lãnh đạo có thể dùng AI Summary, AI Meeting Summary và AI Approval Assistant ở mức advisory trong đúng context và permission; AI chỉ đọc/tóm tắt/gợi ý từ dữ liệu được phép, output là draft/gợi ý, các năng lực AI nâng cao để phase sau hoặc mock/placeholder.

## Story 8.1: AI Gateway Với Permission Context Và Citation

**Requirements Covered:** FR-087, FR-088, NFR-009, UX-DR16, UX-DR34.

As a lãnh đạo,
I want AI chỉ đọc dữ liệu trong permission context và có citation,
So that tôi tin được nguồn tóm tắt mà không lộ dữ liệu ngoài scope.

**Acceptance Criteria:**

AC1:
**Given** AI request có user context và target workspace/record
**When** AI Gateway chuẩn bị context
**Then** retrieval chỉ dùng records người dùng có quyền xem.

AC2:
**Given** AI answer dùng dữ liệu nội bộ
**When** trả kết quả
**Then** answer có citation tới internal record/knowledge item phù hợp.

AC3:
**Given** người dùng thiếu quyền với record nguồn
**When** AI request cố truy xuất record đó
**Then** record bị loại khỏi context và không xuất hiện trong answer/citation.

**Files/Modules:** `src/modules/ai`, `src/modules/knowledge`, `src/lib/permissions`, `src/modules/executive`.

**Test Expectations:** Unit tests cho permission-scoped retrieval, citation required và data exclusion.

**Dependencies:** Story 1.2, Story 2.2.

## Story 8.2: Executive AI Summary Draft Trong Workspace

**Requirements Covered:** FR-085, FR-086, FR-087, FR-088, FR-090, NFR-009, NFR-010, UX-DR16, UX-DR34.

As a Chairman/CEO,
I want AI Summary trong Morning Briefing và workspace ở trạng thái draft/gợi ý,
So that tôi có hỗ trợ đọc nhanh nhưng vẫn biết đây không phải quyết định chính thức.

**Acceptance Criteria:**

AC1:
**Given** workspace có AI summary enabled
**When** người dùng mở Morning Briefing hoặc Executive AI Center
**Then** AI Summary hiển thị như draft/gợi ý với timestamp và citation.

AC2:
**Given** AI không có đủ dữ liệu trong scope
**When** tạo summary
**Then** UI hiển thị empty/insufficient-context state thay vì bịa dữ liệu.

AC3:
**Given** AI summary có đề xuất hành động
**When** người dùng xem đề xuất
**Then** đề xuất chỉ là advisory/action proposal, chưa mutate business record.

**Files/Modules:** `src/modules/ai`, `src/modules/executive/components`, `src/modules/dashboard`.

**Test Expectations:** Unit/component tests cho draft label, citation rendering, insufficient-context state.

**Dependencies:** Story 8.1, Story 2.4.

## Story 8.3: AI Approval Assistant Với Action Proposal

**Requirements Covered:** FR-085, FR-087, FR-088, FR-089, FR-090, NFR-005, NFR-009, NFR-010, UX-DR16, UX-DR23, UX-DR34.

As a người duyệt,
I want AI Approval Assistant tóm tắt request và đề xuất câu hỏi/rủi ro ở dạng advisory,
So that tôi xử lý approval nhanh hơn nhưng vẫn tự quyết định.

**Acceptance Criteria:**

AC1:
**Given** approval detail trong scope
**When** người dùng mở AI Approval Assistant
**Then** AI tóm tắt request, policy, attachments, rủi ro và missing information với citation.

AC2:
**Given** AI đề xuất return/request changes hoặc ask for meeting
**When** hiển thị proposal
**Then** proposal có preview record bị ảnh hưởng, field thay đổi, permission cần có và nút xác nhận rõ.

AC3:
**Given** người dùng không xác nhận proposal
**When** đóng AI panel hoặc reject proposal
**Then** không có mutation nào xảy ra trên approval.

AC4:
**Given** người dùng xác nhận proposal
**When** action được thực thi
**Then** hệ thống re-check domain permission, gọi service action tương ứng và ghi audit.

**Files/Modules:** `src/modules/ai`, `src/modules/proposals`, `src/modules/executive/components`, `src/lib/audit`.

**Test Expectations:** Unit tests cho AI proposal lifecycle, no-direct-mutation, permission re-check và audit.

**Dependencies:** Story 8.1, Story 3.2, Story 3.3.

## Story 8.4: AI Meeting Summary Và Future AI Placeholders

**Requirements Covered:** FR-076, FR-085, FR-086, FR-087, FR-088, FR-089, FR-090, NFR-009, NFR-010, UX-DR16, UX-DR34.

As a meeting host hoặc lãnh đạo,
I want AI Meeting Summary là draft và các AI nâng cao được hiển thị như placeholder/mock khi chưa triển khai,
So that MVP minh bạch phạm vi AI và không tạo kỳ vọng sai.

**Acceptance Criteria:**

AC1:
**Given** meeting có transcript hoặc minutes trong scope
**When** AI tạo meeting summary
**Then** summary ở trạng thái draft/gợi ý, có citation nếu dùng internal records và cần người có quyền approve trước khi thành chính thức.

AC2:
**Given** người dùng mở Executive AI Center
**When** xem các tính năng AI Risk Analysis, AI KPI Analysis, AI Executive Copilot hoặc AI Project Prediction
**Then** hệ thống hiển thị placeholder/mock hoặc future enhancement label rõ ràng.

AC3:
**Given** AI output đề xuất tạo task/risk/decision
**When** người dùng muốn áp dụng
**Then** output đi qua action proposal preview và human confirmation, không mutate trực tiếp domain table.

**Files/Modules:** `src/modules/ai`, `src/modules/meetings`, `src/modules/executive`, `src/modules/tasks`, `src/lib/audit`.

**Test Expectations:** Unit tests cho meeting summary draft, placeholder state và action proposal safety.

**Dependencies:** Story 8.1, Story 6.4.
