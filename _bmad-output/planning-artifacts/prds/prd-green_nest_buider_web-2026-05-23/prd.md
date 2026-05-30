---
title: "PRD Module 1 - Lãnh đạo trong Trục 1"
status: "final"
created: "2026-05-23"
updated: "2026-05-23"
project: "green_nest_buider_web"
scope: "Chỉ Module 1 - Lãnh đạo của Trục 1"
language: "Vietnamese"
---

# PRD Module 1 - Lãnh Đạo Trong Trục 1

## 1. Tóm Tắt

Module 1 - Lãnh đạo là lớp điều hành của **Trục 1 - Phát triển & Hình thành dự án** trong GREENNEST BUILDFLOW.

Module này là nơi lãnh đạo xem tổng hợp, theo dõi nhiều dự án, nhận cảnh báo, duyệt request, ra quyết định, giao việc, theo dõi risk, KPI, lịch họp và lịch sử điều hành theo đúng phạm vi được phân quyền.

Module này không phải nơi nhập liệu vi mô, không xử lý chuyên môn sâu và không làm thay các module/phòng ban chuyên môn.

## 2. Nguồn Đầu Vào

- `C:/Users/Admin/Downloads/GREENNEST_BUILDFLOW_Truc1_Requirements.docx`
- `D:/green_nest_buider_web/_bmad-output/planning-artifacts/truc-1-mvp-final-bmad-ready.md`
- Coaching decisions trong `.decision-log.md` cùng thư mục PRD này.

## 3. Phạm Vi

### 3.1. In Scope

PRD này chỉ đi sâu Module 1 - Lãnh đạo trong Trục 1, gồm:

- Dashboard Tổng Quan.
- Executive Common Center.
- Executive Private Workspace.
- Approval Center.
- Decision & Assignment Center.
- Meeting Center theo mô hình One Meeting Engine + Multiple Meeting Types.
- Risk & Alert Center.
- History & Archive Center.
- Executive AI Center ở mức MVP.
- Quản trị Chủ tịch / Thiết lập điều hành ở mức BO Settings tối thiểu.
- Phân quyền theo role + scope + action.
- Nghiệm thu Module 1 bằng dữ liệu mock/seed data.

### 3.2. Out Of Scope

Không làm trong PRD này:

- Đi sâu nghiệp vụ Module 2, 3, 4, 5 của Trục 1.
- Đi sâu nghiệp vụ Trục 2 và Trục 3.
- Viết architecture, data model kỹ thuật, API contract hoặc service boundary.
- Triển khai code.
- Full configurable approval engine production-grade.
- Full financial dashboard.
- Full booking room/phòng họp.
- AI Project Prediction thật.
- AI tự ra quyết định, tự phê duyệt hoặc tự publish biên bản.
- Full admin suite ngoài các setting tối thiểu để nghiệm thu Module 1.

## 4. Nguyên Tắc Sản Phẩm

- Module Lãnh đạo là executive operating layer, không phải module chuyên môn.
- Lãnh đạo xem tổng hợp trước, drill-down khi cần.
- Mọi dữ liệu hiển thị phải theo quyền.
- Không hardcode role, chức danh, dự án, module hoặc quyền.
- Một người có thể có nhiều role/assignment ở nhiều dự án/module/action khác nhau.
- Approval, decision, risk, meeting, export và thao tác quan trọng phải có audit log.
- AI chỉ hỗ trợ và chỉ dùng dữ liệu mà người dùng hiện tại có quyền xem.
- Dữ liệu mock cho nghiệm thu phải đủ minh họa nhưng không được giả định hệ thống chỉ có vài dự án/role cố định.

## 5. Người Dùng Và Role

### 5.1. Role Mẫu

Hệ thống cần có role template mặc định bằng tiếng Việt:

- Chủ tịch / Super Admin.
- Tổng Giám đốc.
- Phó Tổng Giám đốc.
- Giám đốc dự án.
- Trưởng bộ phận.
- Thư ký / Trợ lý.
- Quản trị hệ thống.
- Quản trị điều hành.
- Người xem.

Role chỉ là cấu hình. Hệ thống phải cho phép thêm, bớt, đổi tên role và gán nhiều người vào cùng một role.

### 5.2. Lãnh Đạo Tập Đoàn Và Lãnh Đạo Dự Án

Lãnh đạo tập đoàn là nhóm lãnh đạo của tổ chức/tập đoàn.

Lãnh đạo dự án là người được assign vào một dự án với phạm vi điều hành cụ thể. Người đó có thể là Chủ tịch, CEO, Phó TGĐ, Giám đốc dự án, Trưởng bộ phận hoặc một vai trò khác được cấu hình.

Một người có thể:

- Là lãnh đạo nhiều dự án.
- Có quyền khác nhau ở từng dự án.
- Quản lý các nhóm việc/module khác nhau trong từng dự án.
- Vừa có vai trò điều hành, vừa có vai trò quản trị nếu được Chủ tịch ủy quyền.

### 5.3. Chủ Tịch / Super Admin

Chủ tịch là Super Admin cấp tập đoàn.

Chủ tịch có quyền:

- Xem toàn hệ thống trong phạm vi tập đoàn.
- Tạo người dùng.
- Tạo/sửa role.
- Cấu hình policy/phân quyền.
- Phân công lãnh đạo.
- Cấu hình phạm vi điều hành.
- Xem audit/export theo quyền Super Admin.

Các chức năng quản trị này nằm trong mục riêng:

- `Quản trị Chủ tịch`
- hoặc `Thiết lập điều hành`

Khu quản trị này phải tách khỏi trải nghiệm điều hành hằng ngày.

### 5.4. Quản Trị Được Ủy Quyền

Sản phẩm nên hỗ trợ các vai trò quản trị được Chủ tịch ủy quyền:

- Quản trị hệ thống: quản lý người dùng, vai trò, chính sách phân quyền và cấu hình hệ thống.
- Quản trị điều hành: hỗ trợ cấu hình phạm vi điều hành, phân công lãnh đạo, workflow/policy duyệt.
- Quản trị dữ liệu/audit: vai trò tương lai để tách quyền xem log, export và kiểm soát dữ liệu nhạy cảm.

Các vai trò này không mặc định có quyền duyệt nghiệp vụ.

## 6. Cấu Trúc Module

Route sản phẩm đề xuất:

```text
axis-1/executive
├── Dashboard Tổng Quan
├── Executive Common Center
├── Executive Private Workspace
├── Approval Center
├── Decision & Assignment Center
├── Meeting Center
├── Risk & Alert Center
├── History & Archive Center
└── Executive AI Center
```

`axis-1/executive` là phạm vi Module 1 trong Trục 1. `/executive` có thể là global executive hub tương lai.

### 6.1. Navigation And Entry Point Clarification

`Tổng quan Trục 1` / `Command Center Trục 1` là entry point của Trục 1 và hiển thị 5 module MVP: Lãnh đạo, Tìm kiếm & phát triển dự án, Pháp lý, Thiết kế - Quy hoạch - Kỹ thuật - BIM, và Đề xuất - Họp - Phê duyệt nội bộ.

`Dashboard Tổng Quan` là mục 1.1 bên trong Module 1 - Lãnh đạo, không được dùng làm nhãn cho toàn bộ Trục 1 hoặc dashboard chung của app.

`Quản trị Chủ tịch` / `BO Settings` là khu quản trị riêng cho role, permission, policy/scope và cấu hình nền. Khu này phải tách khỏi workspace điều hành mặc định hằng ngày của Chủ tịch/lãnh đạo.

## 7. Functional Requirements

### 7.1. Dashboard Tổng Quan

FR-001: Hệ thống phải cung cấp Dashboard Tổng Quan cho Module Lãnh đạo.

FR-002: Dashboard phải hiển thị theo scope và permission của người dùng hiện tại.

FR-003: Dashboard phải hiển thị tổng số dự án/cơ hội trong scope.

FR-004: Dashboard phải hiển thị số dự án đỏ/vàng/xanh.

FR-005: Dashboard phải hiển thị KPI tổng ở mức điều hành.

FR-006: Dashboard phải hiển thị dòng tiền/chi phí tổng quan nếu người dùng có quyền xem tài chính nhạy cảm.

FR-007: Dashboard phải hiển thị tổng request chờ duyệt và request quá hạn.

FR-008: Dashboard phải hiển thị risk map hoặc risk summary.

FR-009: Dashboard phải hiển thị việc khẩn, deadline hôm nay và quyết định mới.

FR-010: Dashboard không được hiển thị task vi mô, dữ liệu kỹ thuật chi tiết hoặc bản vẽ chi tiết mặc định.

FR-011: Dashboard phải cho phép drill-down tới executive summary hoặc record chi tiết read-only nếu người dùng có quyền.

FR-012: Nếu người dùng có quyền vào module chuyên môn tương ứng, drill-down có thể điều hướng sang module đó. Nếu không có quyền, hệ thống phải chặn bằng permission/403.

### 7.2. Executive Morning Briefing

FR-013: Hệ thống nên cung cấp Morning Briefing như bản tóm tắt đầu ngày cho lãnh đạo.

FR-014: Morning Briefing hiển thị AI Summary buổi sáng, top risk lớn nhất, việc cần quyết hôm nay, KPI hôm nay, approval quá hạn và dự án đỏ/vàng/xanh.

FR-015: Morning Briefing phải dùng dữ liệu trong scope của người dùng.

### 7.3. Executive Common Center

FR-016: Hệ thống phải cung cấp Executive Common Center cho lãnh đạo có quyền.

FR-017: Common Center phải hiển thị thông báo mới, quyết định mới, quyết định Chủ tịch, KPI chung, lịch họp, lịch sự kiện, risk tổng, chiến lược, deadline hệ thống, việc vượt ngưỡng và việc quá hạn.

FR-018: Common Center là phần chung nhưng vẫn phải lọc dữ liệu theo dynamic scope và permission.

FR-019: Risk đỏ/nghiêm trọng và approval quá hạn nghiêm trọng phải xuất hiện trong Common Center nếu người dùng có quyền xem.

### 7.4. Executive Private Workspace

FR-020: Hệ thống phải cung cấp Private Workspace theo từng người dùng.

FR-021: Không được giả định hai lãnh đạo nhìn giống nhau nếu assignment/scope khác nhau.

FR-022: Private Workspace phải hiển thị dự án/cơ hội được giao, approval cần xử lý, risk/blocker liên quan, deadline, quyết định gần đây, cuộc họp và KPI trong phạm vi của người dùng.

FR-023: Hệ thống phải hỗ trợ workspace mẫu cho Chủ tịch, CEO, Giám đốc dự án, Trưởng bộ phận và Thư ký/Trợ lý.

FR-024: Workspace của Thư ký/Trợ lý chỉ hiển thị dữ liệu và action được lãnh đạo ủy quyền.

### 7.5. Approval Center

FR-025: Hệ thống phải cung cấp Approval Center trong Module Lãnh đạo.

FR-026: Approval Center phải hiển thị phân vùng Trục 1, Trục 2 và Trục 3.

FR-027: Trong MVP này, Trục 1 là phần có dữ liệu/flow chi tiết; Trục 2 và Trục 3 được phép là placeholder hoặc mock data.

FR-028: Approval Center phải phân loại approval tối thiểu theo: hồ sơ/văn bản, tài chính/chi, chiến lược, kỹ thuật, pháp lý, họp.

FR-029: Approval Center phải hỗ trợ approval hồ sơ/văn bản trong Trục 1.

FR-030: Approval Center phải hỗ trợ approval chi phí/mock chi phí trong Trục 1.

FR-031: Approval Center phải hỗ trợ approval pháp lý/blocker trong Trục 1.

FR-032: Approval Center phải hỗ trợ approval quy hoạch/kỹ thuật ở mức request điều hành.

FR-033: Approval Center phải hỗ trợ approval chiến lược/chuyển bước gồm tiếp tục nghiên cứu, tạm dừng, loại bỏ, chuyển bước/giai đoạn.

FR-034: Approval Center phải hỗ trợ approval họp hoặc đề xuất họp quan trọng.

FR-035: Hệ thống phải cho phép một người duyệt trực tiếp nếu policy/assignment xác định người đó đủ quyền.

FR-036: Hệ thống phải hỗ trợ workflow duyệt tuần tự cơ bản khi policy yêu cầu.

FR-037: Ngưỡng duyệt tiền phải là cấu hình trong BO Settings/Policy, không hardcode trong nghiệp vụ.

FR-038: Approval phải hỗ trợ các kết quả: Approve, Reject, Return/Request Changes, Forward/Escalate, Ask for Meeting, Hold/Pending, Cancel.

FR-039: Reject và Return/Request Changes bắt buộc nhập lý do.

FR-040: Approve cho phép comment tùy chọn.

FR-041: Hold/Pending, Forward/Escalate và Ask for Meeting nên khuyến nghị comment.

FR-042: Approval History phải lưu ai duyệt, thời gian, ghi chú, file đính kèm, trạng thái cũ/mới, version và audit log.

FR-043: Approval quá hạn phải cảnh báo người duyệt, người đề xuất, thư ký/trợ lý liên quan và escalate theo policy nếu quá hạn kéo dài hoặc risk cao.

### 7.6. Decision & Assignment Center

FR-044: Hệ thống phải cung cấp Decision & Assignment Center.

FR-045: Decision khác approval. Approval là hành động duyệt một request cụ thể; Decision là quyết định/chỉ đạo chính thức của lãnh đạo.

FR-046: Decision có thể được tạo sau approval, sau cuộc họp hoặc độc lập từ lãnh đạo.

FR-047: Decision phải hỗ trợ giao việc, đặt KPI, đặt deadline, đặt ưu tiên hoặc thay đổi hướng xử lý.

FR-048: Một decision có thể tạo nhiều assignment/task cho nhiều người, phòng ban hoặc dự án.

FR-049: MVP không yêu cầu người nhận xác nhận đã nhận việc.

FR-050: Decision phải có version/history khi sửa nội dung quan trọng như deadline, người phụ trách, phạm vi, mức ưu tiên, KPI hoặc chỉ đạo bổ sung.

FR-051: Decision & Assignment Center phải hiển thị quyết định mới, giao việc, chỉ đạo ưu tiên, KPI giao xuống, deadline và trạng thái thực hiện.

### 7.7. Risk & Alert Center

FR-052: Hệ thống phải cung cấp Risk & Alert Center.

FR-053: Risk levels gồm Thấp, Trung bình, Cao, Nghiêm trọng.

FR-054: Nhóm risk mặc định gồm Pháp lý, Quy hoạch/kỹ thuật, Approval, Tiến độ, Tài chính, Hồ sơ thiếu, Hệ thống/phân quyền, Vận hành/phối hợp.

FR-055: Nhóm risk phải cấu hình được trong BO Settings, không hardcode cứng.

FR-056: Trạng thái đỏ/vàng/xanh của dự án dùng mô hình kết hợp: hệ thống gợi ý từ dữ liệu, người có quyền xác nhận/override.

FR-057: Override trạng thái đỏ/vàng/xanh phải có lý do và audit log.

FR-058: Điều kiện đỏ gồm blocker nghiêm trọng, quá hạn quan trọng, approval quá hạn vượt ngưỡng, hồ sơ thiếu làm chặn bước, risk tài chính/pháp lý/quy hoạch cao hoặc issue cần lãnh đạo xử lý ngay.

FR-059: Điều kiện vàng gồm vấn đề cần theo dõi, sắp quá hạn, hồ sơ thiếu nhưng chưa chặn, risk trung bình hoặc approval gần quá hạn.

FR-060: Điều kiện xanh gồm không có blocker, milestone ổn, approval không quá hạn và hồ sơ/risk trong tầm kiểm soát.

FR-061: Risk map mặc định cho lãnh đạo phải hiển thị danh sách/heatmap theo màu, nhóm risk, dự án, deadline và người phụ trách.

FR-062: Drill-down risk nên hỗ trợ ma trận khả năng xảy ra x mức ảnh hưởng.

FR-063: Hệ thống phải cho phép tạo risk/blocker bởi lãnh đạo trong scope, giám đốc dự án, trưởng bộ phận/người phụ trách module, người phụ trách task/hồ sơ nếu có quyền và thư ký/trợ lý nếu được ủy quyền.

FR-064: Hệ thống/AI chỉ được tạo cảnh báo hoặc gợi ý risk ở trạng thái draft, không tự tạo blocker chính thức nếu chưa có người xác nhận.

FR-065: Đóng risk/blocker phải giới hạn cho người phụ trách, giám đốc dự án, lãnh đạo phụ trách hoặc người có quyền phù hợp.

FR-066: Risk/blocker mức Cao hoặc Nghiêm trọng nên cần người có quyền cao hơn hoặc lãnh đạo phụ trách xác nhận đóng.

FR-067: Risk đỏ/nghiêm trọng phải tự động hiện ở Dashboard Tổng, Morning Briefing và Risk & Alert Center nếu người xem có quyền.

FR-068: Risk quá hạn phải nhắc và escalate theo policy.

FR-069: Mỗi blocker bắt buộc có tiêu đề, nhóm, mức độ, lý do/mô tả, dự án/module liên quan, người phụ trách, deadline xử lý, hành động xử lý tiếp theo, trạng thái và audit log.

### 7.8. Meeting Center

FR-070: Hệ thống phải cung cấp một Meeting System chung theo mô hình One Meeting Engine + Multiple Meeting Types.

FR-071: Hệ thống không được tạo nhiều module họp riêng biệt cứng cho từng loại họp.

FR-072: Quản lý phòng họp/đặt phòng là placeholder trong MVP.

FR-073: Người được tạo cuộc họp gồm lãnh đạo trong scope, giám đốc dự án, trưởng bộ phận/người phụ trách module nếu có quyền, thư ký/trợ lý nếu được ủy quyền và người có quyền đề xuất/tạo họp.

FR-074: Cuộc họp phải phân loại động theo meeting_type, organization_id, project_id, axis_id, department_id, visibility và participant_scope.

FR-075: Cuộc họp phải gắn được với project, trục, module/workstream, department, approval request, risk/blocker, decision, task hoặc hồ sơ liên quan nếu có.

FR-076: AI Meeting Summary luôn là draft cho tới khi được người có quyền approved.

FR-077: Biên bản chính thức phải được người có quyền duyệt.

FR-078: Cuộc họp phải sinh follow-up task nếu cần.

FR-079: Cuộc họp phải có decision tracking, bao gồm quyết định được ghi nhận trong cuộc họp, quyết định liên quan và trạng thái thực hiện sau họp.

FR-102: Meeting System phải hỗ trợ meeting type `EXECUTIVE_MEETING` cho họp HĐQT, họp ban TGĐ, họp chiến lược, họp KPI và họp risk.

FR-103: Meeting System phải hỗ trợ meeting type `EXECUTIVE_OPERATIONAL_MEETING` cho các cuộc họp lãnh đạo với đầu tư, pháp lý, thiết kế, tài chính hoặc nhà thầu.

FR-104: Meeting System phải hỗ trợ meeting type `DEPARTMENT_INTERNAL_MEETING` cho họp nội bộ phòng ban.

FR-105: Meeting System phải hỗ trợ meeting type `PROJECT_MEETING` cho họp dự án, họp tiến độ, họp nghiệm thu và họp triển khai.

FR-106: Meeting System phải hỗ trợ meeting type `EXTERNAL_PARTNER_MEETING` cho họp tư vấn, họp nhà thầu và họp đối tác.

FR-107: Meeting System phải hỗ trợ meeting type `GOVERNMENT_MEETING` cho họp UBND, họp Sở và họp cơ quan chức năng.

FR-108: Mỗi meeting phải có dữ liệu tối thiểu: id, title, meeting_type, organization_id, project_id, axis_id, department_id, visibility, host, participants, external_participants, room_id, start_time, end_time, agenda, attachments, transcript, ai_summary, meeting_minutes, decisions, follow_up_actions, related_approvals, related_tasks, status và audit_log.

FR-109: Meeting workflow phải hỗ trợ các trạng thái: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, FOLLOW_UP_PENDING và CLOSED.

FR-110: Meeting visibility phải tuân thủ RBAC, project scope và organization scope.

FR-111: Executive chỉ nhìn thấy các cuộc họp trong scope gồm họp quan trọng, họp chiến lược, họp risk cao và họp có follow-up quá hạn.

FR-112: Department workspace chỉ nhìn thấy các cuộc họp thuộc scope của phòng ban/người dùng.

FR-113: Meeting Center phải cho phép lọc theo meeting_type, organization, project, axis, department, visibility, participant, status và thời gian.

FR-114: Meeting Center phải cho phép ghi nhận external_participants cho tư vấn, nhà thầu, đối tác hoặc cơ quan chức năng.

FR-115: Meeting Center phải cho phép liên kết follow_up_actions với related_tasks khi action cần được theo dõi như task.

FR-116: Meeting Center phải cho phép liên kết decisions với Decision & Assignment Center để theo dõi thực hiện sau họp.

FR-117: Meeting Center phải ghi audit log cho tạo/sửa/hủy cuộc họp, thay đổi người tham dự, upload tài liệu, cập nhật biên bản, approve AI summary, tạo follow-up task và cập nhật decision tracking.

FR-118: Meeting Center phải cho phép meeting nằm ngoài project cụ thể khi đó là họp cấp tập đoàn, họp chiến lược hoặc họp nội bộ không gắn dự án.

FR-119: Meeting Center phải cho phép meeting gắn với nhiều project nếu cuộc họp là họp portfolio, họp chiến lược, họp risk hoặc họp điều phối liên dự án.

### 7.9. History & Archive Center

FR-080: Hệ thống phải cung cấp History & Archive Center.

FR-081: Center này phải hiển thị lịch sử decision, approval, giao việc, họp, audit log, phiên bản hồ sơ và lịch sử tìm kiếm nếu có.

FR-082: Center này cần hỗ trợ tìm kiếm, filter, export và timeline theo quyền.

FR-083: Export dashboard, audit log và approval history phải giới hạn bởi permission `Xuất dữ liệu`.

FR-084: Export dữ liệu nhạy cảm cần permission riêng và phải ghi audit log.

### 7.10. Executive AI Center

FR-085: Executive AI Center trong MVP chỉ gồm AI Summary, AI Meeting Summary và AI Approval Assistant dạng gợi ý.

FR-086: AI Risk Analysis, AI KPI Analysis, AI Executive Copilot và AI Project Prediction để phase sau hoặc mock/placeholder.

FR-087: AI bắt buộc tuân thủ permission của người dùng hiện tại.

FR-088: AI chỉ được đọc, tóm tắt và gợi ý từ dữ liệu mà người dùng có quyền xem.

FR-089: AI không được tự phê duyệt, tự quyết định, tự tạo blocker chính thức hoặc tự publish biên bản chính thức.

FR-090: Nội dung AI tạo ra phải thể hiện là draft/gợi ý cho đến khi người có quyền xác nhận.

### 7.11. Quản Trị Chủ Tịch / BO Settings

FR-091: Hệ thống phải có mục quản trị riêng cho Chủ tịch/Super Admin.

FR-092: BO Settings MVP phải demo được cấu hình role, permission và policy/scope cơ bản.

FR-093: BO Settings phải hỗ trợ role template mặc định bằng tiếng Việt.

FR-094: BO Settings phải cho phép cấu hình nhóm risk.

FR-095: BO Settings phải cho phép cấu hình ngưỡng duyệt tiền ở mức mock/policy cơ bản.

FR-096: BO Settings phải tách quyền quản trị hệ thống khỏi quyền duyệt nghiệp vụ.

### 7.12. Thư Ký / Trợ Lý

FR-097: Thư ký/trợ lý được ủy quyền theo từng lãnh đạo.

FR-098: Bên trong ủy quyền của lãnh đạo, hệ thống cần cho phép cấu hình phạm vi dự án/module/action nếu cần.

FR-099: Thư ký/trợ lý được tạo và submit request thay lãnh đạo nếu lãnh đạo đó cho phép.

FR-100: MVP không cho thư ký/trợ lý approve thay lãnh đạo.

FR-101: Workspace của thư ký/trợ lý phải hiển thị lịch lãnh đạo, hồ sơ trình, tài liệu họp, task hỗ trợ, reminder và approval pending trong scope được ủy quyền.

## 8. Permission Requirements

### 8.1. Scope

Phân quyền dựa trên role + scope + action.

Scope tối thiểu:

```text
Tổ chức/pháp nhân -> Dự án -> Trục -> Module/Workstream -> Bản ghi -> Hành động
```

### 8.2. Action Permission Tiếng Việt

Các action permission tối thiểu:

- Xem tổng hợp.
- Xem chi tiết.
- Xem tài chính nhạy cảm.
- Duyệt.
- Từ chối.
- Trả lại / yêu cầu chỉnh sửa.
- Chuyển cấp / chuyển người xử lý.
- Tạo quyết định.
- Giao việc.
- Tạo cuộc họp.
- Tải lên hồ sơ.
- Xuất dữ liệu.
- Quản lý người dùng.
- Quản lý vai trò.
- Quản lý chính sách phân quyền.
- Xem nhật ký kiểm toán.

### 8.3. Dữ Liệu Nhạy Cảm

Dữ liệu như dòng tiền, chi phí, ngân sách và hợp đồng phải có permission riêng theo role + scope + action.

Ví dụ: một CEO có thể xem tài chính nhạy cảm của dự án A nhưng không xem dự án B nếu không được assign.

## 9. KPI Requirements

KPI của Module Lãnh đạo là KPI điều hành, lấy từ dữ liệu có cấu trúc. Module 1 không phải nơi nhập KPI vi mô thủ công.

Nhóm KPI đề xuất:

- Portfolio KPI: tổng dự án/cơ hội trong scope, số dự án đỏ/vàng/xanh, số dự án theo giai đoạn/trạng thái, dự án mới trong kỳ, dự án đủ điều kiện chuyển bước, dự án bị dừng/loại.
- Progress KPI: milestone đúng hạn/quá hạn/sắp đến hạn, deadline hôm nay, tỷ lệ hoàn thành việc lãnh đạo giao, số vấn đề chưa xử lý theo thời gian tồn đọng.
- Approval KPI: tổng request chờ duyệt, request quá hạn, thời gian duyệt trung bình, request bị trả lại/từ chối, request vượt ngưỡng, giá trị tiền đang chờ duyệt nếu có quyền.
- Risk KPI: tổng risk theo mức độ, số risk đỏ, blocker chưa xử lý, risk mới trong kỳ, risk quá hạn, risk theo nhóm.
- Readiness/Document KPI: hồ sơ thiếu, hồ sơ chờ duyệt, checklist hoàn thành, bước pháp lý bị chặn, bước đang chờ cơ quan, bước tiền nhập hệ thống chưa xác minh.
- Meeting/Decision KPI: quyết định mới, quyết định chờ thực hiện, action items sau họp, action items quá hạn, biên bản họp chờ duyệt.
- Financial summary KPI: chi đã duyệt, chi đang chờ duyệt, chi vượt ngưỡng, budget variance nếu có dữ liệu và có quyền.
- Organization/Workload KPI: bottleneck theo phòng ban/người phụ trách, số việc đang chờ từng nhóm duyệt, SLA xử lý theo nhóm.

## 10. Non-Functional Requirements

NFR-001: Mọi dữ liệu executive phải được filter ở server/service layer trước khi trả về UI.

NFR-002: Không được render dữ liệu rồi mới ẩn ở frontend.

NFR-003: Người không có quyền vào Module 1 phải nhận 403 khi truy cập trực tiếp.

NFR-004: Người không có quyền vào bản ghi/dữ liệu cụ thể phải không thấy dữ liệu đó và nhận 403 nếu truy cập trực tiếp.

NFR-005: Mutation quan trọng phải kiểm tra quyền phía server/service.

NFR-006: Approval, decision, risk/blocker, meeting approval, export, override trạng thái và cập nhật permission phải ghi audit log.

NFR-007: UI phải hỗ trợ multi-organization, multi-project, multi-role và multi-assignment.

NFR-008: Không hardcode danh sách role, người duyệt, ngưỡng tiền, nhóm risk hoặc module tương lai.

NFR-009: AI phải chạy trong permission context của người dùng hiện tại.

NFR-010: AI output phải được đánh dấu là draft/gợi ý khi chưa được người có quyền xác nhận.

NFR-011: Dashboard và workspace phải đủ nhanh để lãnh đạo nhìn nhanh hiểu nhanh; không đẩy thông tin vi mô lên mặc định.

NFR-012: Export dữ liệu nhạy cảm phải có permission riêng và audit log.

NFR-013: Meeting visibility phải được enforce ở server/service layer theo RBAC, project scope, organization scope và participant_scope.

## 11. Demo Data Và Nghiệm Thu

### 11.1. Dữ Liệu Mock/Seed Data

Hệ thống cần chuẩn bị sẵn bộ dữ liệu mock/seed data để demo nghiệm thu Module 1. Khách hàng có thể tự tạo thêm dữ liệu thật hoặc dữ liệu demo bổ sung sau.

Bộ dữ liệu demo tối thiểu:

- 3-5 dự án/cơ hội đại diện.
- Có đủ dự án xanh, vàng, đỏ.
- Có ít nhất một dự án có risk pháp lý.
- Có ít nhất một dự án có approval quá hạn.
- Có ít nhất một dự án có hồ sơ thiếu/blocker.
- Có dữ liệu mock cho Trục 2 và Trục 3 ở Approval Center dạng placeholder/mock.
- Có dữ liệu tài chính mock để test permission xem tài chính nhạy cảm.
- Có lịch họp theo nhiều meeting type, biên bản draft, AI summary draft, follow-up task, decision tracking và decision/history mẫu.

### 11.2. User Demo

Demo cần đủ các loại user:

- Chủ tịch / Super Admin.
- CEO.
- Giám đốc dự án.
- Trưởng bộ phận.
- Thư ký / Trợ lý.
- Người xem.

### 11.3. Acceptance Criteria Tổng Thể

AC-001: Khách hàng xem được Dashboard Tổng Quan với dữ liệu mock đỏ/vàng/xanh, KPI, approval, risk, deadline và quyết định mới theo quyền.

AC-002: Khách hàng xem được Executive Common Center và xác nhận thông tin chung vẫn lọc theo permission.

AC-003: Khách hàng xem được Private Workspace khác nhau giữa Chủ tịch, CEO, Giám đốc dự án, Trưởng bộ phận, Thư ký/Trợ lý và Người xem.

AC-004: Approval Center hiển thị Trục 1, Trục 2, Trục 3; Trục 2/3 ở trạng thái placeholder/mock được chấp nhận.

AC-005: Demo được 1 approval hồ sơ, 1 approval chi phí mock và 1 approval pháp lý/blocker.

AC-006: Demo được approve, return, reject và approval history/audit.

AC-007: Demo được tạo risk đỏ, risk hiển thị trên dashboard, nhắc quá hạn và đóng risk với lý do.

AC-008: Demo được tạo decision, giao nhiều việc cho nhiều người và sửa deadline tạo version/history.

AC-009: Demo được tạo lịch họp theo nhiều meeting type, upload biên bản, AI tạo summary draft và người có quyền approve biên bản.

AC-010: Demo được BO Settings tối thiểu: role, permission, policy/scope cơ bản.

AC-011: Người không có quyền không thấy module/dữ liệu.

AC-012: Truy cập URL trực tiếp không có quyền trả 403.

AC-013: Dữ liệu tài chính nhạy cảm bị ẩn nếu không có quyền.

AC-014: Thư ký/trợ lý chỉ thấy và thao tác trong scope được ủy quyền.

AC-015: Export bị chặn nếu không có quyền.

AC-016: AI chỉ đọc/tóm tắt/gợi ý trong phạm vi permission của người dùng.

AC-017: Mọi approval, decision, risk, meeting approval, export và thay đổi permission quan trọng có audit/history.

AC-018: Khách hàng nhận được danh sách gap/future enhancement đi kèm nghiệm thu Module 1.

AC-019: Demo được follow-up action sau họp sinh task khi cần và liên kết vào related_tasks.

AC-020: Demo được decision tracking sau họp, gồm decision liên quan, trạng thái thực hiện và audit log.

## 12. Future Enhancements / Gap Sau MVP

Các mục sau không phải lỗi thiếu của MVP Module 1:

- Trục 2/Trục 3 thật thay vì placeholder/mock.
- Full financial dashboard và dòng tiền chi tiết.
- Full booking room/phòng họp.
- Full configurable approval engine.
- Full Chairman Administration UI.
- AI Risk Analysis nâng cao.
- AI KPI Analysis nâng cao.
- AI Executive Copilot đầy đủ.
- AI Project Prediction.
- Delegation policy cho thư ký/trợ lý hoặc người thay mặt approve.
- Risk register nâng cao.
- Data room production-grade.

## 13. Open Questions

Hiện không còn câu hỏi phase-blocker cho PRD Module 1.

Các ngưỡng duyệt tiền, màu sắc chi tiết, SLA nhắc việc và policy escalation cụ thể sẽ được cấu hình trong BO Settings/Policy ở giai đoạn thiết kế chi tiết.
