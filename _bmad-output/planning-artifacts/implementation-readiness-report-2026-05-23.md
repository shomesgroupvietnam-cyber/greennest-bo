---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
documentsIncluded:
  prd: "_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md"
  architecture: "_bmad-output/planning-artifacts/architecture.md"
  epics: "_bmad-output/planning-artifacts/epics.md"
  ux: "_bmad-output/planning-artifacts/ux-design-specification.md"
documentsExcluded:
  architectureDraft: "_bmad-output/planning-artifacts/axis-1-requirement-brd-architecture-draft.md"
---

# Implementation Readiness Assessment Report

**Date:** 2026-05-23
**Project:** green_nest_buider_web

## Step 1: Document Discovery

### PRD Files Found

**Whole Documents:**
- None found matching `*prd*.md` at planning artifact root.

**Sharded Documents:**
- Folder: `_bmad-output/planning-artifacts/prds/`
  - `prd-green_nest_buider_web-2026-05-23/prd.md` - 30,443 bytes, modified `2026-05-23 13:37:05`
  - `prd-green_nest_buider_web-2026-05-23/.decision-log.md` - 30,784 bytes, modified `2026-05-23 13:37:23`

### Architecture Files Found

**Whole Documents:**
- `architecture.md` - 27,950 bytes, modified `2026-05-23 15:20:33`
- `axis-1-requirement-brd-architecture-draft.md` - 26,611 bytes, modified `2026-05-23 09:15:13`

**Sharded Documents:**
- None found.

### Epics & Stories Files Found

**Whole Documents:**
- `epics.md` - 101,999 bytes, modified `2026-05-23 15:42:47`

**Sharded Documents:**
- None found.

### UX Design Files Found

**Whole Documents:**
- `ux-design-specification.md` - 51,087 bytes, modified `2026-05-23 15:01:25`

**Sharded Documents:**
- None found.

### Selected Assessment Inputs

- PRD: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Epics and Stories: `_bmad-output/planning-artifacts/epics.md`
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md`

### Notes

- `axis-1-requirement-brd-architecture-draft.md` was excluded because `architecture.md` is newer and appears to be the canonical non-draft Architecture document.

## PRD Analysis

### Functional Requirements

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

FR-013: Hệ thống nên cung cấp Morning Briefing như bản tóm tắt đầu ngày cho lãnh đạo.

FR-014: Morning Briefing hiển thị AI Summary buổi sáng, top risk lớn nhất, việc cần quyết hôm nay, KPI hôm nay, approval quá hạn và dự án đỏ/vàng/xanh.

FR-015: Morning Briefing phải dùng dữ liệu trong scope của người dùng.

FR-016: Hệ thống phải cung cấp Executive Common Center cho lãnh đạo có quyền.

FR-017: Common Center phải hiển thị thông báo mới, quyết định mới, quyết định Chủ tịch, KPI chung, lịch họp, lịch sự kiện, risk tổng, chiến lược, deadline hệ thống, việc vượt ngưỡng và việc quá hạn.

FR-018: Common Center là phần chung nhưng vẫn phải lọc dữ liệu theo dynamic scope và permission.

FR-019: Risk đỏ/nghiêm trọng và approval quá hạn nghiêm trọng phải xuất hiện trong Common Center nếu người dùng có quyền xem.

FR-020: Hệ thống phải cung cấp Private Workspace theo từng người dùng.

FR-021: Không được giả định hai lãnh đạo nhìn giống nhau nếu assignment/scope khác nhau.

FR-022: Private Workspace phải hiển thị dự án/cơ hội được giao, approval cần xử lý, risk/blocker liên quan, deadline, quyết định gần đây, cuộc họp và KPI trong phạm vi của người dùng.

FR-023: Hệ thống phải hỗ trợ workspace mẫu cho Chủ tịch, CEO, Giám đốc dự án, Trưởng bộ phận và Thư ký/Trợ lý.

FR-024: Workspace của Thư ký/Trợ lý chỉ hiển thị dữ liệu và action được lãnh đạo ủy quyền.

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

FR-044: Hệ thống phải cung cấp Decision & Assignment Center.

FR-045: Decision khác approval. Approval là hành động duyệt một request cụ thể; Decision là quyết định/chỉ đạo chính thức của lãnh đạo.

FR-046: Decision có thể được tạo sau approval, sau cuộc họp hoặc độc lập từ lãnh đạo.

FR-047: Decision phải hỗ trợ giao việc, đặt KPI, đặt deadline, đặt ưu tiên hoặc thay đổi hướng xử lý.

FR-048: Một decision có thể tạo nhiều assignment/task cho nhiều người, phòng ban hoặc dự án.

FR-049: MVP không yêu cầu người nhận xác nhận đã nhận việc.

FR-050: Decision phải có version/history khi sửa nội dung quan trọng như deadline, người phụ trách, phạm vi, mức ưu tiên, KPI hoặc chỉ đạo bổ sung.

FR-051: Decision & Assignment Center phải hiển thị quyết định mới, giao việc, chỉ đạo ưu tiên, KPI giao xuống, deadline và trạng thái thực hiện.

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

FR-080: Hệ thống phải cung cấp History & Archive Center.

FR-081: Center này phải hiển thị lịch sử decision, approval, giao việc, họp, audit log, phiên bản hồ sơ và lịch sử tìm kiếm nếu có.

FR-082: Center này cần hỗ trợ tìm kiếm, filter, export và timeline theo quyền.

FR-083: Export dashboard, audit log và approval history phải giới hạn bởi permission `Xuất dữ liệu`.

FR-084: Export dữ liệu nhạy cảm cần permission riêng và phải ghi audit log.

FR-085: Executive AI Center trong MVP chỉ gồm AI Summary, AI Meeting Summary và AI Approval Assistant dạng gợi ý.

FR-086: AI Risk Analysis, AI KPI Analysis, AI Executive Copilot và AI Project Prediction để phase sau hoặc mock/placeholder.

FR-087: AI bắt buộc tuân thủ permission của người dùng hiện tại.

FR-088: AI chỉ được đọc, tóm tắt và gợi ý từ dữ liệu mà người dùng có quyền xem.

FR-089: AI không được tự phê duyệt, tự quyết định, tự tạo blocker chính thức hoặc tự publish biên bản chính thức.

FR-090: Nội dung AI tạo ra phải thể hiện là draft/gợi ý cho đến khi người có quyền xác nhận.

FR-091: Hệ thống phải có mục quản trị riêng cho Chủ tịch/Super Admin.

FR-092: BO Settings MVP phải demo được cấu hình role, permission và policy/scope cơ bản.

FR-093: BO Settings phải hỗ trợ role template mặc định bằng tiếng Việt.

FR-094: BO Settings phải cho phép cấu hình nhóm risk.

FR-095: BO Settings phải cho phép cấu hình ngưỡng duyệt tiền ở mức mock/policy cơ bản.

FR-096: BO Settings phải tách quyền quản trị hệ thống khỏi quyền duyệt nghiệp vụ.

FR-097: Thư ký/trợ lý được ủy quyền theo từng lãnh đạo.

FR-098: Bên trong ủy quyền của lãnh đạo, hệ thống cần cho phép cấu hình phạm vi dự án/module/action nếu cần.

FR-099: Thư ký/trợ lý được tạo và submit request thay lãnh đạo nếu lãnh đạo đó cho phép.

FR-100: MVP không cho thư ký/trợ lý approve thay lãnh đạo.

FR-101: Workspace của thư ký/trợ lý phải hiển thị lịch lãnh đạo, hồ sơ trình, tài liệu họp, task hỗ trợ, reminder và approval pending trong scope được ủy quyền.

Total FRs: 119

### Non-Functional Requirements

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

Total NFRs: 13

### Additional Requirements

- PRD scope is locked to Module 1 - Lãnh đạo của Trục 1.
- Explicitly out of scope: deep business workflows for Modules 2-5, deep Trục 2/Trục 3 workflows, technical architecture, implementation code, production-grade approval engine, full financial dashboard, full room booking, real AI prediction, autonomous AI approval/decision/publishing, and full admin suite beyond minimum BO Settings for acceptance.
- Product principles require server-side permission enforcement, no hardcoded roles/scopes/permissions/modules, support for multi-role/multi-assignment users, audit logging for important actions, and AI constrained by current user's permission context.
- Required role templates: Chủ tịch / Super Admin, Tổng Giám đốc, Phó Tổng Giám đốc, Giám đốc dự án, Trưởng bộ phận, Thư ký / Trợ lý, Quản trị hệ thống, Quản trị điều hành, Người xem.
- Permission model must support role + scope + action, with scope at least: tổ chức/pháp nhân -> dự án -> trục -> module/workstream -> bản ghi -> hành động.
- Minimum action permissions are listed in Vietnamese and include view summary/detail, view sensitive finance, approve/reject/return/escalate, create decision, assign work, create meeting, upload file, export data, manage users/roles/policies, and view audit log.
- Demo data must include 3-5 representative projects/opportunities with green/yellow/red states, legal risk, overdue approval, missing document/blocker, placeholder/mock Trục 2/3 approval data, sensitive finance mock data, and meeting/AI/decision/history examples.
- Acceptance criteria count: 20 ACs, covering dashboard, common center, private workspace, approval, risk, decision, meeting, BO Settings, permission/403, sensitive finance, secretary scope, export permission, AI permission, audit/history, future gap list, follow-up tasks, and decision tracking.
- Future enhancements are explicitly non-blocking for MVP: real Trục 2/3, detailed finance, room booking, configurable approval engine, full chairman admin UI, advanced AI modules, delegation approval policy, advanced risk register, and production-grade data room.

### PRD Completeness Assessment

- PRD is mostly complete for implementation planning: it has a final status, clear scope boundaries, 119 FRs, 13 NFRs, 20 ACs, demo data expectations, role/permission principles, and explicit future gaps.
- No phase-blocker open questions remain in the PRD.
- Risk for downstream planning: FR order is not sequential in document order. `FR-102` through `FR-119` appear before `FR-080` through `FR-101`; this should be normalized or carefully handled in traceability.
- Risk for implementation detail: several policies are intentionally deferred to BO Settings/Policy design, including exact money thresholds, SLA reminders, escalation policy, and detailed colors.

## Epic Coverage Validation

### Epic FR Coverage Extracted

- Epic 1: Thiết Lập Điều Hành, RBAC Và Ủy Quyền: 10 FRs (FR-091, FR-092, FR-093, FR-094, FR-095, FR-096, FR-097, FR-098, FR-099, FR-100).
- Epic 2: Workspace Điều Hành Và Dashboard Module 1: 25 FRs (FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022, FR-023, FR-024, FR-101).
- Epic 3: Approval Center Trên Proposal/Approval Backbone: 19 FRs (FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, FR-035, FR-036, FR-037, FR-038, FR-039, FR-040, FR-041, FR-042, FR-043).
- Epic 4: Decision & Assignment Center: 8 FRs (FR-044, FR-045, FR-046, FR-047, FR-048, FR-049, FR-050, FR-051).
- Epic 5: Risk & Alert Center Cho Điều Hành: 18 FRs (FR-052, FR-053, FR-054, FR-055, FR-056, FR-057, FR-058, FR-059, FR-060, FR-061, FR-062, FR-063, FR-064, FR-065, FR-066, FR-067, FR-068, FR-069).
- Epic 6: One Meeting Engine Cho Điều Hành: 28 FRs (FR-070, FR-071, FR-072, FR-073, FR-074, FR-075, FR-076, FR-077, FR-078, FR-079, FR-102, FR-103, FR-104, FR-105, FR-106, FR-107, FR-108, FR-109, FR-110, FR-111, FR-112, FR-113, FR-114, FR-115, FR-116, FR-117, FR-118, FR-119).
- Epic 7: History, Archive, Export Và Audit Visibility: 5 FRs (FR-080, FR-081, FR-082, FR-083, FR-084).
- Epic 8: Executive AI Advisory: 6 FRs (FR-085, FR-086, FR-087, FR-088, FR-089, FR-090).

Total FRs claimed in epic coverage map: 119

### Coverage Matrix

| FR Number | PRD Requirement | Epic Coverage | Status |
| --------- | --------------- | ------------- | ------ |
| FR-001 | Hệ thống phải cung cấp Dashboard Tổng Quan cho Module Lãnh đạo. | Epic 2 - Dashboard Tổng Quan cho Module Lãnh đạo. | Covered |
| FR-002 | Dashboard phải hiển thị theo scope và permission của người dùng hiện tại. | Epic 2 - Dashboard lọc theo scope và permission. | Covered |
| FR-003 | Dashboard phải hiển thị tổng số dự án/cơ hội trong scope. | Epic 2 - Tổng số dự án/cơ hội trong scope. | Covered |
| FR-004 | Dashboard phải hiển thị số dự án đỏ/vàng/xanh. | Epic 2 - Trạng thái dự án đỏ/vàng/xanh. | Covered |
| FR-005 | Dashboard phải hiển thị KPI tổng ở mức điều hành. | Epic 2 - KPI điều hành tổng. | Covered |
| FR-006 | Dashboard phải hiển thị dòng tiền/chi phí tổng quan nếu người dùng có quyền xem tài chính nhạy cảm. | Epic 2 - KPI tài chính nhạy cảm theo quyền. | Covered |
| FR-007 | Dashboard phải hiển thị tổng request chờ duyệt và request quá hạn. | Epic 2 - Tổng request chờ duyệt và quá hạn. | Covered |
| FR-008 | Dashboard phải hiển thị risk map hoặc risk summary. | Epic 2 - Risk map hoặc risk summary. | Covered |
| FR-009 | Dashboard phải hiển thị việc khẩn, deadline hôm nay và quyết định mới. | Epic 2 - Việc khẩn, deadline hôm nay và quyết định mới. | Covered |
| FR-010 | Dashboard không được hiển thị task vi mô, dữ liệu kỹ thuật chi tiết hoặc bản vẽ chi tiết mặc định. | Epic 2 - Không hiển thị task vi mô hoặc dữ liệu chuyên môn sâu mặc định. | Covered |
| FR-011 | Dashboard phải cho phép drill-down tới executive summary hoặc record chi tiết read-only nếu người dùng có quyền. | Epic 2 - Drill-down tới executive summary hoặc record read-only. | Covered |
| FR-012 | Nếu người dùng có quyền vào module chuyên môn tương ứng, drill-down có thể điều hướng sang module đó. Nếu không có quyền, hệ thống phải chặn bằng permission/403. | Epic 2 - Drill-down sang module chuyên môn theo quyền hoặc chặn 403. | Covered |
| FR-013 | Hệ thống nên cung cấp Morning Briefing như bản tóm tắt đầu ngày cho lãnh đạo. | Epic 2 - Morning Briefing cho lãnh đạo. | Covered |
| FR-014 | Morning Briefing hiển thị AI Summary buổi sáng, top risk lớn nhất, việc cần quyết hôm nay, KPI hôm nay, approval quá hạn và dự án đỏ/vàng/xanh. | Epic 2 - Morning Briefing gồm AI summary, risk, việc cần quyết, KPI, approval quá hạn và trạng thái dự án. | Covered |
| FR-015 | Morning Briefing phải dùng dữ liệu trong scope của người dùng. | Epic 2 - Morning Briefing dùng dữ liệu trong scope. | Covered |
| FR-016 | Hệ thống phải cung cấp Executive Common Center cho lãnh đạo có quyền. | Epic 2 - Executive Common Center. | Covered |
| FR-017 | Common Center phải hiển thị thông báo mới, quyết định mới, quyết định Chủ tịch, KPI chung, lịch họp, lịch sự kiện, risk tổng, chiến lược, deadline hệ thống, việc vượt ngưỡng và việc quá hạn. | Epic 2 - Common Center hiển thị thông báo, quyết định, KPI, lịch, risk, deadline và việc quá hạn. | Covered |
| FR-018 | Common Center là phần chung nhưng vẫn phải lọc dữ liệu theo dynamic scope và permission. | Epic 2 - Common Center lọc theo dynamic scope và permission. | Covered |
| FR-019 | Risk đỏ/nghiêm trọng và approval quá hạn nghiêm trọng phải xuất hiện trong Common Center nếu người dùng có quyền xem. | Epic 2 - Risk nghiêm trọng và approval quá hạn xuất hiện trong Common Center theo quyền. | Covered |
| FR-020 | Hệ thống phải cung cấp Private Workspace theo từng người dùng. | Epic 2 - Private Workspace theo từng người dùng. | Covered |
| FR-021 | Không được giả định hai lãnh đạo nhìn giống nhau nếu assignment/scope khác nhau. | Epic 2 - Workspace khác nhau theo assignment/scope. | Covered |
| FR-022 | Private Workspace phải hiển thị dự án/cơ hội được giao, approval cần xử lý, risk/blocker liên quan, deadline, quyết định gần đây, cuộc họp và KPI trong phạm vi của người dùng. | Epic 2 - Private Workspace hiển thị dự án, approval, risk, deadline, quyết định, meeting và KPI trong scope. | Covered |
| FR-023 | Hệ thống phải hỗ trợ workspace mẫu cho Chủ tịch, CEO, Giám đốc dự án, Trưởng bộ phận và Thư ký/Trợ lý. | Epic 2 - Workspace mẫu cho Chủ tịch, CEO, Giám đốc dự án, Trưởng bộ phận và Thư ký/Trợ lý. | Covered |
| FR-024 | Workspace của Thư ký/Trợ lý chỉ hiển thị dữ liệu và action được lãnh đạo ủy quyền. | Epic 2 - Workspace Thư ký/Trợ lý chỉ hiển thị dữ liệu và action được ủy quyền. | Covered |
| FR-025 | Hệ thống phải cung cấp Approval Center trong Module Lãnh đạo. | Epic 3 - Approval Center trong Module Lãnh đạo. | Covered |
| FR-026 | Approval Center phải hiển thị phân vùng Trục 1, Trục 2 và Trục 3. | Epic 3 - Approval Center phân vùng Trục 1, Trục 2 và Trục 3. | Covered |
| FR-027 | Trong MVP này, Trục 1 là phần có dữ liệu/flow chi tiết; Trục 2 và Trục 3 được phép là placeholder hoặc mock data. | Epic 3 - Trục 1 có flow chi tiết; Trục 2/3 là placeholder/mock. | Covered |
| FR-028 | Approval Center phải phân loại approval tối thiểu theo: hồ sơ/văn bản, tài chính/chi, chiến lược, kỹ thuật, pháp lý, họp. | Epic 3 - Phân loại approval theo hồ sơ, tài chính, chiến lược, kỹ thuật, pháp lý và họp. | Covered |
| FR-029 | Approval Center phải hỗ trợ approval hồ sơ/văn bản trong Trục 1. | Epic 3 - Approval hồ sơ/văn bản Trục 1. | Covered |
| FR-030 | Approval Center phải hỗ trợ approval chi phí/mock chi phí trong Trục 1. | Epic 3 - Approval chi phí/mock chi phí Trục 1. | Covered |
| FR-031 | Approval Center phải hỗ trợ approval pháp lý/blocker trong Trục 1. | Epic 3 - Approval pháp lý/blocker Trục 1. | Covered |
| FR-032 | Approval Center phải hỗ trợ approval quy hoạch/kỹ thuật ở mức request điều hành. | Epic 3 - Approval quy hoạch/kỹ thuật ở mức request điều hành. | Covered |
| FR-033 | Approval Center phải hỗ trợ approval chiến lược/chuyển bước gồm tiếp tục nghiên cứu, tạm dừng, loại bỏ, chuyển bước/giai đoạn. | Epic 3 - Approval chiến lược/chuyển bước. | Covered |
| FR-034 | Approval Center phải hỗ trợ approval họp hoặc đề xuất họp quan trọng. | Epic 3 - Approval họp hoặc đề xuất họp quan trọng. | Covered |
| FR-035 | Hệ thống phải cho phép một người duyệt trực tiếp nếu policy/assignment xác định người đó đủ quyền. | Epic 3 - Duyệt trực tiếp theo policy/assignment. | Covered |
| FR-036 | Hệ thống phải hỗ trợ workflow duyệt tuần tự cơ bản khi policy yêu cầu. | Epic 3 - Workflow duyệt tuần tự cơ bản. | Covered |
| FR-037 | Ngưỡng duyệt tiền phải là cấu hình trong BO Settings/Policy, không hardcode trong nghiệp vụ. | Epic 3 - Ngưỡng duyệt tiền cấu hình qua BO Settings/Policy. | Covered |
| FR-038 | Approval phải hỗ trợ các kết quả: Approve, Reject, Return/Request Changes, Forward/Escalate, Ask for Meeting, Hold/Pending, Cancel. | Epic 3 - Approval outcomes: approve, reject, return, forward, ask meeting, hold, cancel. | Covered |
| FR-039 | Reject và Return/Request Changes bắt buộc nhập lý do. | Epic 3 - Reject và return bắt buộc lý do. | Covered |
| FR-040 | Approve cho phép comment tùy chọn. | Epic 3 - Approve có comment tùy chọn. | Covered |
| FR-041 | Hold/Pending, Forward/Escalate và Ask for Meeting nên khuyến nghị comment. | Epic 3 - Hold, forward/escalate và ask meeting khuyến nghị comment. | Covered |
| FR-042 | Approval History phải lưu ai duyệt, thời gian, ghi chú, file đính kèm, trạng thái cũ/mới, version và audit log. | Epic 3 - Approval history gồm actor, time, note, attachment, status/version và audit log. | Covered |
| FR-043 | Approval quá hạn phải cảnh báo người duyệt, người đề xuất, thư ký/trợ lý liên quan và escalate theo policy nếu quá hạn kéo dài hoặc risk cao. | Epic 3 - Cảnh báo/escalate approval quá hạn. | Covered |
| FR-044 | Hệ thống phải cung cấp Decision & Assignment Center. | Epic 4 - Decision & Assignment Center. | Covered |
| FR-045 | Decision khác approval. Approval là hành động duyệt một request cụ thể; Decision là quyết định/chỉ đạo chính thức của lãnh đạo. | Epic 4 - Phân biệt decision với approval. | Covered |
| FR-046 | Decision có thể được tạo sau approval, sau cuộc họp hoặc độc lập từ lãnh đạo. | Epic 4 - Decision tạo sau approval, sau meeting hoặc độc lập. | Covered |
| FR-047 | Decision phải hỗ trợ giao việc, đặt KPI, đặt deadline, đặt ưu tiên hoặc thay đổi hướng xử lý. | Epic 4 - Decision hỗ trợ giao việc, KPI, deadline, ưu tiên và hướng xử lý. | Covered |
| FR-048 | Một decision có thể tạo nhiều assignment/task cho nhiều người, phòng ban hoặc dự án. | Epic 4 - Một decision tạo nhiều assignment/task. | Covered |
| FR-049 | MVP không yêu cầu người nhận xác nhận đã nhận việc. | Epic 4 - MVP không yêu cầu người nhận xác nhận đã nhận việc. | Covered |
| FR-050 | Decision phải có version/history khi sửa nội dung quan trọng như deadline, người phụ trách, phạm vi, mức ưu tiên, KPI hoặc chỉ đạo bổ sung. | Epic 4 - Decision có version/history khi sửa nội dung quan trọng. | Covered |
| FR-051 | Decision & Assignment Center phải hiển thị quyết định mới, giao việc, chỉ đạo ưu tiên, KPI giao xuống, deadline và trạng thái thực hiện. | Epic 4 - Decision Center hiển thị quyết định, giao việc, KPI, deadline và trạng thái thực hiện. | Covered |
| FR-052 | Hệ thống phải cung cấp Risk & Alert Center. | Epic 5 - Risk & Alert Center. | Covered |
| FR-053 | Risk levels gồm Thấp, Trung bình, Cao, Nghiêm trọng. | Epic 5 - Risk levels: Thấp, Trung bình, Cao, Nghiêm trọng. | Covered |
| FR-054 | Nhóm risk mặc định gồm Pháp lý, Quy hoạch/kỹ thuật, Approval, Tiến độ, Tài chính, Hồ sơ thiếu, Hệ thống/phân quyền, Vận hành/phối hợp. | Epic 5 - Nhóm risk mặc định. | Covered |
| FR-055 | Nhóm risk phải cấu hình được trong BO Settings, không hardcode cứng. | Epic 5 - Nhóm risk cấu hình được trong BO Settings. | Covered |
| FR-056 | Trạng thái đỏ/vàng/xanh của dự án dùng mô hình kết hợp: hệ thống gợi ý từ dữ liệu, người có quyền xác nhận/override. | Epic 5 - Trạng thái đỏ/vàng/xanh do hệ thống gợi ý và người có quyền xác nhận/override. | Covered |
| FR-057 | Override trạng thái đỏ/vàng/xanh phải có lý do và audit log. | Epic 5 - Override trạng thái cần lý do và audit log. | Covered |
| FR-058 | Điều kiện đỏ gồm blocker nghiêm trọng, quá hạn quan trọng, approval quá hạn vượt ngưỡng, hồ sơ thiếu làm chặn bước, risk tài chính/pháp lý/quy hoạch cao hoặc issue cần lãnh đạo xử lý ngay. | Epic 5 - Điều kiện đỏ. | Covered |
| FR-059 | Điều kiện vàng gồm vấn đề cần theo dõi, sắp quá hạn, hồ sơ thiếu nhưng chưa chặn, risk trung bình hoặc approval gần quá hạn. | Epic 5 - Điều kiện vàng. | Covered |
| FR-060 | Điều kiện xanh gồm không có blocker, milestone ổn, approval không quá hạn và hồ sơ/risk trong tầm kiểm soát. | Epic 5 - Điều kiện xanh. | Covered |
| FR-061 | Risk map mặc định cho lãnh đạo phải hiển thị danh sách/heatmap theo màu, nhóm risk, dự án, deadline và người phụ trách. | Epic 5 - Risk map theo màu, nhóm risk, dự án, deadline và owner. | Covered |
| FR-062 | Drill-down risk nên hỗ trợ ma trận khả năng xảy ra x mức ảnh hưởng. | Epic 5 - Drill-down risk với ma trận khả năng xảy ra x mức ảnh hưởng. | Covered |
| FR-063 | Hệ thống phải cho phép tạo risk/blocker bởi lãnh đạo trong scope, giám đốc dự án, trưởng bộ phận/người phụ trách module, người phụ trách task/hồ sơ nếu có quyền và thư ký/trợ lý nếu được ủy quyền. | Epic 5 - Tạo risk/blocker theo quyền và ủy quyền. | Covered |
| FR-064 | Hệ thống/AI chỉ được tạo cảnh báo hoặc gợi ý risk ở trạng thái draft, không tự tạo blocker chính thức nếu chưa có người xác nhận. | Epic 5 - Hệ thống/AI chỉ tạo cảnh báo/gợi ý risk ở draft. | Covered |
| FR-065 | Đóng risk/blocker phải giới hạn cho người phụ trách, giám đốc dự án, lãnh đạo phụ trách hoặc người có quyền phù hợp. | Epic 5 - Đóng risk/blocker theo quyền. | Covered |
| FR-066 | Risk/blocker mức Cao hoặc Nghiêm trọng nên cần người có quyền cao hơn hoặc lãnh đạo phụ trách xác nhận đóng. | Epic 5 - Risk cao/nghiêm trọng cần xác nhận đóng bởi quyền cao hơn khi phù hợp. | Covered |
| FR-067 | Risk đỏ/nghiêm trọng phải tự động hiện ở Dashboard Tổng, Morning Briefing và Risk & Alert Center nếu người xem có quyền. | Epic 5 - Risk đỏ/nghiêm trọng hiện ở Dashboard, Morning Briefing và Risk Center theo quyền. | Covered |
| FR-068 | Risk quá hạn phải nhắc và escalate theo policy. | Epic 5 - Risk quá hạn nhắc và escalate theo policy. | Covered |
| FR-069 | Mỗi blocker bắt buộc có tiêu đề, nhóm, mức độ, lý do/mô tả, dự án/module liên quan, người phụ trách, deadline xử lý, hành động xử lý tiếp theo, trạng thái và audit log. | Epic 5 - Blocker có đủ trường bắt buộc và audit log. | Covered |
| FR-070 | Hệ thống phải cung cấp một Meeting System chung theo mô hình One Meeting Engine + Multiple Meeting Types. | Epic 6 - One Meeting Engine + Multiple Meeting Types. | Covered |
| FR-071 | Hệ thống không được tạo nhiều module họp riêng biệt cứng cho từng loại họp. | Epic 6 - Không tạo nhiều module họp riêng cứng. | Covered |
| FR-072 | Quản lý phòng họp/đặt phòng là placeholder trong MVP. | Epic 6 - Quản lý phòng/đặt phòng là placeholder MVP. | Covered |
| FR-073 | Người được tạo cuộc họp gồm lãnh đạo trong scope, giám đốc dự án, trưởng bộ phận/người phụ trách module nếu có quyền, thư ký/trợ lý nếu được ủy quyền và người có quyền đề xuất/tạo họp. | Epic 6 - Người tạo họp theo quyền/scope/ủy quyền. | Covered |
| FR-074 | Cuộc họp phải phân loại động theo meeting_type, organization_id, project_id, axis_id, department_id, visibility và participant_scope. | Epic 6 - Phân loại meeting động theo type, organization, project, axis, department, visibility, participant_scope. | Covered |
| FR-075 | Cuộc họp phải gắn được với project, trục, module/workstream, department, approval request, risk/blocker, decision, task hoặc hồ sơ liên quan nếu có. | Epic 6 - Meeting liên kết project, axis, module, department, approval, risk, decision, task hoặc hồ sơ. | Covered |
| FR-076 | AI Meeting Summary luôn là draft cho tới khi được người có quyền approved. | Epic 6 - AI Meeting Summary là draft đến khi approved. | Covered |
| FR-077 | Biên bản chính thức phải được người có quyền duyệt. | Epic 6 - Biên bản chính thức cần người có quyền duyệt. | Covered |
| FR-078 | Cuộc họp phải sinh follow-up task nếu cần. | Epic 6 - Meeting sinh follow-up task khi cần. | Covered |
| FR-079 | Cuộc họp phải có decision tracking, bao gồm quyết định được ghi nhận trong cuộc họp, quyết định liên quan và trạng thái thực hiện sau họp. | Epic 6 - Meeting có decision tracking. | Covered |
| FR-080 | Hệ thống phải cung cấp History & Archive Center. | Epic 7 - History & Archive Center. | Covered |
| FR-081 | Center này phải hiển thị lịch sử decision, approval, giao việc, họp, audit log, phiên bản hồ sơ và lịch sử tìm kiếm nếu có. | Epic 7 - Hiển thị lịch sử decision, approval, assignment, meeting, audit, version và search history nếu có. | Covered |
| FR-082 | Center này cần hỗ trợ tìm kiếm, filter, export và timeline theo quyền. | Epic 7 - Search, filter, export và timeline theo quyền. | Covered |
| FR-083 | Export dashboard, audit log và approval history phải giới hạn bởi permission `Xuất dữ liệu`. | Epic 7 - Export dashboard, audit log và approval history theo permission `Xuất dữ liệu`. | Covered |
| FR-084 | Export dữ liệu nhạy cảm cần permission riêng và phải ghi audit log. | Epic 7 - Export dữ liệu nhạy cảm cần permission riêng và audit log. | Covered |
| FR-085 | Executive AI Center trong MVP chỉ gồm AI Summary, AI Meeting Summary và AI Approval Assistant dạng gợi ý. | Epic 8 - Executive AI Center MVP. | Covered |
| FR-086 | AI Risk Analysis, AI KPI Analysis, AI Executive Copilot và AI Project Prediction để phase sau hoặc mock/placeholder. | Epic 8 - AI nâng cao để phase sau hoặc placeholder/mock. | Covered |
| FR-087 | AI bắt buộc tuân thủ permission của người dùng hiện tại. | Epic 8 - AI tuân thủ permission người dùng hiện tại. | Covered |
| FR-088 | AI chỉ được đọc, tóm tắt và gợi ý từ dữ liệu mà người dùng có quyền xem. | Epic 8 - AI chỉ đọc, tóm tắt và gợi ý từ dữ liệu được phép. | Covered |
| FR-089 | AI không được tự phê duyệt, tự quyết định, tự tạo blocker chính thức hoặc tự publish biên bản chính thức. | Epic 8 - AI không tự phê duyệt, quyết định, tạo blocker chính thức hoặc publish biên bản. | Covered |
| FR-090 | Nội dung AI tạo ra phải thể hiện là draft/gợi ý cho đến khi người có quyền xác nhận. | Epic 8 - AI output là draft/gợi ý đến khi được xác nhận. | Covered |
| FR-091 | Hệ thống phải có mục quản trị riêng cho Chủ tịch/Super Admin. | Epic 1 - Khu quản trị riêng cho Chủ tịch/Super Admin. | Covered |
| FR-092 | BO Settings MVP phải demo được cấu hình role, permission và policy/scope cơ bản. | Epic 1 - BO Settings cấu hình role, permission và policy/scope cơ bản. | Covered |
| FR-093 | BO Settings phải hỗ trợ role template mặc định bằng tiếng Việt. | Epic 1 - Role template mặc định bằng tiếng Việt. | Covered |
| FR-094 | BO Settings phải cho phép cấu hình nhóm risk. | Epic 1 - Cấu hình nhóm risk. | Covered |
| FR-095 | BO Settings phải cho phép cấu hình ngưỡng duyệt tiền ở mức mock/policy cơ bản. | Epic 1 - Cấu hình ngưỡng duyệt tiền ở mức mock/policy cơ bản. | Covered |
| FR-096 | BO Settings phải tách quyền quản trị hệ thống khỏi quyền duyệt nghiệp vụ. | Epic 1 - Tách quyền quản trị hệ thống khỏi quyền duyệt nghiệp vụ. | Covered |
| FR-097 | Thư ký/trợ lý được ủy quyền theo từng lãnh đạo. | Epic 1 - Thư ký/trợ lý được ủy quyền theo từng lãnh đạo. | Covered |
| FR-098 | Bên trong ủy quyền của lãnh đạo, hệ thống cần cho phép cấu hình phạm vi dự án/module/action nếu cần. | Epic 1 - Cấu hình phạm vi ủy quyền theo dự án/module/action. | Covered |
| FR-099 | Thư ký/trợ lý được tạo và submit request thay lãnh đạo nếu lãnh đạo đó cho phép. | Epic 1 - Thư ký/trợ lý tạo và submit request thay lãnh đạo khi được phép. | Covered |
| FR-100 | MVP không cho thư ký/trợ lý approve thay lãnh đạo. | Epic 1 - MVP không cho thư ký/trợ lý approve thay lãnh đạo. | Covered |
| FR-101 | Workspace của thư ký/trợ lý phải hiển thị lịch lãnh đạo, hồ sơ trình, tài liệu họp, task hỗ trợ, reminder và approval pending trong scope được ủy quyền. | Epic 2 - Workspace Thư ký/Trợ lý hiển thị lịch, hồ sơ trình, tài liệu họp, task, reminder và approval pending trong scope. | Covered |
| FR-102 | Meeting System phải hỗ trợ meeting type `EXECUTIVE_MEETING` cho họp HĐQT, họp ban TGĐ, họp chiến lược, họp KPI và họp risk. | Epic 6 - Meeting type `EXECUTIVE_MEETING`. | Covered |
| FR-103 | Meeting System phải hỗ trợ meeting type `EXECUTIVE_OPERATIONAL_MEETING` cho các cuộc họp lãnh đạo với đầu tư, pháp lý, thiết kế, tài chính hoặc nhà thầu. | Epic 6 - Meeting type `EXECUTIVE_OPERATIONAL_MEETING`. | Covered |
| FR-104 | Meeting System phải hỗ trợ meeting type `DEPARTMENT_INTERNAL_MEETING` cho họp nội bộ phòng ban. | Epic 6 - Meeting type `DEPARTMENT_INTERNAL_MEETING`. | Covered |
| FR-105 | Meeting System phải hỗ trợ meeting type `PROJECT_MEETING` cho họp dự án, họp tiến độ, họp nghiệm thu và họp triển khai. | Epic 6 - Meeting type `PROJECT_MEETING`. | Covered |
| FR-106 | Meeting System phải hỗ trợ meeting type `EXTERNAL_PARTNER_MEETING` cho họp tư vấn, họp nhà thầu và họp đối tác. | Epic 6 - Meeting type `EXTERNAL_PARTNER_MEETING`. | Covered |
| FR-107 | Meeting System phải hỗ trợ meeting type `GOVERNMENT_MEETING` cho họp UBND, họp Sở và họp cơ quan chức năng. | Epic 6 - Meeting type `GOVERNMENT_MEETING`. | Covered |
| FR-108 | Mỗi meeting phải có dữ liệu tối thiểu: id, title, meeting_type, organization_id, project_id, axis_id, department_id, visibility, host, participants, external_participants, room_id, start_time, end_time, agenda, attachments, transcript, ai_summary, meeting_minutes, decisions, follow_up_actions, related_approvals, related_tasks, status và audit_log. | Epic 6 - Dữ liệu tối thiểu của meeting. | Covered |
| FR-109 | Meeting workflow phải hỗ trợ các trạng thái: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, FOLLOW_UP_PENDING và CLOSED. | Epic 6 - Meeting workflow statuses. | Covered |
| FR-110 | Meeting visibility phải tuân thủ RBAC, project scope và organization scope. | Epic 6 - Meeting visibility theo RBAC, project scope và organization scope. | Covered |
| FR-111 | Executive chỉ nhìn thấy các cuộc họp trong scope gồm họp quan trọng, họp chiến lược, họp risk cao và họp có follow-up quá hạn. | Epic 6 - Executive chỉ thấy meeting quan trọng trong scope. | Covered |
| FR-112 | Department workspace chỉ nhìn thấy các cuộc họp thuộc scope của phòng ban/người dùng. | Epic 6 - Department workspace chỉ thấy meeting theo scope phòng ban/người dùng. | Covered |
| FR-113 | Meeting Center phải cho phép lọc theo meeting_type, organization, project, axis, department, visibility, participant, status và thời gian. | Epic 6 - Filter Meeting Center. | Covered |
| FR-114 | Meeting Center phải cho phép ghi nhận external_participants cho tư vấn, nhà thầu, đối tác hoặc cơ quan chức năng. | Epic 6 - External participants. | Covered |
| FR-115 | Meeting Center phải cho phép liên kết follow_up_actions với related_tasks khi action cần được theo dõi như task. | Epic 6 - Follow-up actions liên kết related_tasks. | Covered |
| FR-116 | Meeting Center phải cho phép liên kết decisions với Decision & Assignment Center để theo dõi thực hiện sau họp. | Epic 6 - Decisions liên kết Decision & Assignment Center. | Covered |
| FR-117 | Meeting Center phải ghi audit log cho tạo/sửa/hủy cuộc họp, thay đổi người tham dự, upload tài liệu, cập nhật biên bản, approve AI summary, tạo follow-up task và cập nhật decision tracking. | Epic 6 - Audit log cho meeting operations. | Covered |
| FR-118 | Meeting Center phải cho phép meeting nằm ngoài project cụ thể khi đó là họp cấp tập đoàn, họp chiến lược hoặc họp nội bộ không gắn dự án. | Epic 6 - Meeting ngoài project cụ thể. | Covered |
| FR-119 | Meeting Center phải cho phép meeting gắn với nhiều project nếu cuộc họp là họp portfolio, họp chiến lược, họp risk hoặc họp điều phối liên dự án. | Epic 6 - Meeting gắn nhiều project. | Covered |

### Missing Requirements

Không có FR thiếu coverage trong epic map.

### FRs In Epics But Not In PRD

Không có FR trong epics nằm ngoài PRD.

### Coverage Statistics

- Total PRD FRs: 119
- FRs covered in epics: 119
- FRs missing from epics: 0
- Coverage percentage: 100%

### Coverage Assessment

- Epic coverage is complete at the FR map level: every PRD FR from FR-001 through FR-119 has a mapped epic.
- The epic document also includes story-level Requirements Covered fields, so traceability is available below the epic level.
- No missing FR coverage blocks implementation planning at this step.

## UX Alignment Assessment

### UX Document Status

Found:

- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/ux-design-directions.html`

The Markdown UX specification is marked complete and covers the executive operating layer, role-first workspaces, responsive web strategy, enterprise component patterns, UX consistency, accessibility, and AI interaction rules.

### UX To PRD Alignment

- Aligned: UX covers the PRD's core module surfaces: Dashboard Tổng Quan, Morning Briefing, Executive Common Center, Private Workspace, Approval Center, Decision & Assignment, Risk & Alert, Meeting Center, History/Archive, Executive AI, BO Settings, and Secretary/Assistant workspace.
- Aligned: UX reinforces the PRD principles that this is an executive operating layer, not a micro-task/data-entry module.
- Aligned: UX matches PRD permission requirements with role-first, scope-aware navigation, drill-down, unauthorized states, and no frontend-only hiding of protected data.
- Aligned: UX supports PRD AI rules: contextual AI only, draft/suggestion state, citation, no autonomous approval/decision/blocker/publishing.
- Aligned: UX supports PRD demo/acceptance needs through workspace journeys, approval/risk/meeting flows, responsive behavior, and accessibility testing targets.

### UX To Architecture Alignment

- Aligned: Architecture selects the same frontend foundation expected by UX: Tailwind CSS, shadcn/ui, Radix primitives, lucide-react, TypeScript, Next.js App Router.
- Aligned: Architecture explicitly supports role-first workspace composition, shared enterprise patterns, responsive web, Vietnamese-first UI, WCAG direction, badge text, drill-down, loading/empty/error/unauthorized states, and no generic chatbot as primary workflow.
- Aligned: Architecture maps Module 1 surfaces to `command-center`, `executive`, `dashboard`, `proposals`, `meetings`, `tasks`, `documents`, `legal`, `ai`, `knowledge`, `settings`, `users`, and `workspaces`.
- Aligned: Architecture supports UX security expectations through server/service permission checks, deny-by-default RBAC, RLS as defense-in-depth, audit/history, and AI action proposals with human confirmation.
- Aligned: Epics include 35 UX design requirements (`UX-DR1` through `UX-DR35`) and story-level coverage references include all 35.

### Alignment Issues

No critical UX/PRD/Architecture misalignment found.

### Warnings

- Documentation traceability warning: the UX spec itself is prose-driven and does not appear to carry `UX-DR` IDs directly. The `UX-DR1` through `UX-DR35` catalog exists in `epics.md` and is fully covered by stories. To reduce future drift, backporting these IDs into the UX spec or treating the epics UX-DR catalog as the traceability index would help.
- Architecture hardening warning: Architecture identifies important production gaps that affect UX completeness in real deployment: Supabase RLS live validation, proposal Supabase repository validation/configurable approval routing, production storage upload/download, audit UI, and notifications. These do not block MVP planning, but they should remain visible in implementation sequencing.

## Epic Quality Review

### Review Summary

- Epics reviewed: 8.
- Stories reviewed: 40.
- Stories with `As a / I want / So that`: 40/40.
- Stories with acceptance criteria: 40/40.
- Stories with Given/When/Then structure: 40/40.
- Forward dependency violations: 0.
- PRD FR traceability: 119/119 covered.
- UX-DR story coverage: 35/35 covered.

### Critical Violations

None found.

No epic is a pure technical milestone. Epic 1 is foundational and uses the term RBAC, but it still delivers direct admin/user value for Chairman/Super Admin and delegated administration. Cross-epic dependencies move backward only, and no story requires a future story to function.

### Major Issues

#### Major 1: Production hardening gaps are documented but not planned as stories

Evidence:

- `epics.md` lists these as gaps/hardening needing separate stories if in scope: Supabase RLS live validation, proposal Supabase repository validation, configurable approval routing, production storage upload/download, audit UI, and notifications.
- `architecture.md` also identifies RLS validation, proposal repository validation, storage, audit UI, and notifications as important production gaps.

Impact:

- Current epics are ready for MVP/module implementation and mock/file-backed validation.
- They are not sufficient as a production-readiness plan unless these hardening stories are explicitly added or formally deferred outside the implementation phase.

Recommendation:

- Add a hardening epic or pre-release story set before production acceptance.
- Minimum stories should cover live RLS validation, Proposal/Approval Supabase repository validation, configurable approval routing, storage upload/download, audit UI visibility, and notification/escalation behavior.

#### Major 2: Some stories are oversized relative to their requirement load

High-risk examples:

- Story 2.3 covers 30 requirements/design requirements while also building dashboard UI, KPI Strip, Priority Queue, Risk Summary/Map, responsive behavior, accessibility checks, loading/empty/no-permission states, and visual/e2e smoke expectations.
- Story 2.2 covers 16 requirements across dashboard service DTO, permission filtering, financial masking, multiple source modules, and mock/Supabase contract parity.
- Story 2.7 covers 16 requirements across drill-down, unauthorized behavior, responsive QA, accessibility, and multiple workspace surfaces.
- Story 6.1 covers 16 requirements across meeting types, dynamic scope, repository contract, domain DTO shape, multi-project support, and visibility/RBAC constraints.

Impact:

- These stories are implementable, but the blast radius is high.
- ACs are structurally valid but too few for the number of behaviors covered, increasing the chance of partial implementation or ambiguous review.

Recommendation:

- Split Story 2.3 into design-system/tokens baseline, dashboard composition, risk/priority widgets, and responsive/accessibility QA.
- Split Story 2.2 into dashboard aggregation DTO, sensitive finance masking, and repository contract parity if implementation proves large.
- Split Story 6.1 into meeting type/status contract, scope/multi-project model, and repository adapter parity.
- Keep traceability IDs on each split story so FR/UX coverage remains intact.

### Minor Concerns

#### Minor 1: Several story titles use technical phrasing

Examples:

- Story 2.2: `Executive Dashboard Service DTO Theo Scope`
- Story 6.1: `Meeting Engine Types, Scope Và Repository Contract`
- Story 7.1: `History & Archive Center Service`
- Story 8.1: `AI Gateway Với Permission Context Và Citation`

These stories do include user-value statements, so this is not a structural blocker. Rename titles toward user outcomes where practical to reduce implementation bias toward internal plumbing.

#### Minor 2: Story 1.5 is an enablement/acceptance fixture story

Story 1.5 creates seed/mock data for acceptance. It is justified by the PRD's explicit demo-data requirements, but it is not a normal end-user capability. Keep it clearly labeled as acceptance enablement and avoid letting later functional stories depend on fixed demo assumptions.

#### Minor 3: UX traceability IDs are strongest in `epics.md`, not the UX source document

The story plan has full UX-DR coverage, but the UX spec itself is prose-driven. If future UX changes happen only in `ux-design-specification.md`, the `UX-DR` catalog in `epics.md` can drift.

### Dependency Analysis

- No forward dependencies found.
- Epic 1 stands alone.
- Epic 2 depends only on Epic 1 outputs.
- Epics 3-8 depend only on earlier epics or earlier stories in the same epic.
- Story 4.1 explicitly avoids a future dependency by allowing independent decision creation even when approval/meeting linkage is not present yet.

### Database And Entity Timing

- No single upfront "create all tables" story was found.
- Entity/data work is introduced near first use: settings/RBAC in Epic 1, dashboard DTO in Epic 2, meeting contract in Epic 6, history/export in Epic 7, AI gateway in Epic 8.
- Seed data is introduced early for acceptance, but it is limited to role/scope/policy/delegation baseline rather than all future domain data.

### Brownfield/Starter Assessment

- Architecture specifies this is a brownfield Next.js App Router repo and explicitly says not to scaffold a new starter.
- Therefore, no "set up initial project from starter template" story is required.
- Brownfield integration boundaries are present: service/repository parity, existing proposal backbone, existing meeting route/module, modular monolith boundaries, and mock/Supabase adapter expectations.

### Quality Recommendations

1. Add production-hardening stories or formally mark them out of scope for Phase 4 implementation.
2. Split the largest stories before implementation if one story cannot be completed and reviewed in a small pull request.
3. Rename technical-leaning story titles toward user outcomes while preserving implementation notes.
4. Keep FR, NFR, and UX-DR IDs on every split or renamed story to preserve traceability.

## Summary and Recommendations

### Overall Readiness Status

NEEDS WORK

The planning set is close: PRD, UX, Architecture, and Epics are present; PRD coverage is complete at the FR level; UX design requirements are covered at story level; and no forward dependency violations were found.

It is not fully ready for broad Phase 4 implementation because two major issues should be handled first: production hardening gaps are not planned as stories, and several stories are too large for safe implementation/review.

### Critical Issues Requiring Immediate Action

No critical blockers found.

### Major Issues Requiring Action

1. Production hardening is not represented as implementation stories.
   Add or explicitly defer stories for Supabase RLS live validation, Proposal/Approval Supabase repository validation, configurable approval routing, production storage upload/download, audit UI, and notifications.

2. Several stories are oversized.
   Split Story 2.3 first, then evaluate Story 2.2, Story 2.7, and Story 6.1 before implementation. These stories each carry too many behaviors for reliable acceptance in one pass.

### Additional Warnings

1. PRD FR order is not sequential in document order: `FR-102` through `FR-119` appear before `FR-080` through `FR-101`.
2. Some policy details are intentionally deferred: money thresholds, SLA reminders, escalation policy, and exact status colors.
3. UX traceability IDs live in `epics.md`, not directly in the UX source document.
4. Some story titles lean technical even though the body contains user value.
5. Story 1.5 is an acceptance-enablement seed-data story and should not become a source of hardcoded demo assumptions.

### Recommended Next Steps

1. Create a small hardening epic or explicit pre-release checklist covering RLS, Proposal/Approval Supabase repository validation, storage, audit UI, configurable approval routing, and notifications.
2. Split Story 2.3 into smaller stories for design tokens/foundation, dashboard composition, risk/priority widgets, and responsive/accessibility QA.
3. Review Story 2.2, Story 2.7, and Story 6.1 for similar splitting before assigning to implementation.
4. Normalize FR ordering in the PRD or add a traceability note so implementation agents do not miss `FR-080` through `FR-101`.
5. Decide whether production hardening is in Phase 4 scope. If it is out of scope, document that explicitly before coding starts.

### Final Note

This assessment identified 7 issues requiring attention across 4 categories: production readiness, story sizing, documentation traceability, and deferred implementation detail.

Proceeding as-is is acceptable only for controlled MVP implementation with mock/file-backed or non-production constraints. For production-oriented implementation, address the major issues before starting broad development.

**Assessment Date:** 2026-05-23

**Assessor:** Codex using `bmad-check-implementation-readiness`
