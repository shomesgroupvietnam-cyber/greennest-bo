# Requirements Inventory

## Functional Requirements

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

## NonFunctional Requirements

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

## Additional Requirements

- Tiếp tục trên brownfield baseline hiện có: Next.js App Router + TypeScript modular monolith; không scaffold lại project và không tạo story initialize project.
- Giữ kiến trúc modular monolith, không tách microservices trong scope này.
- Giữ service/repository boundary ổn định để hỗ trợ mock/file-backed mode và Supabase mode cùng một service contract.
- PostgreSQL/Supabase là persistence target; Supabase RLS là lớp defense-in-depth trước production rollout.
- Internal UI mutation dùng Server Actions qua service layer; Route Handlers chỉ dùng khi có external/public integration hoặc callback.
- Permission enforce deny-by-default theo role + scope + action ở route/server action/service trước khi trả UI hoặc mutation.
- Direct URL không đủ quyền phải trả 403; UI không được render dữ liệu rồi mới ẩn.
- Proposal/Internal Approval là workflow backbone dùng chung cho approval, request trình lãnh đạo, meeting follow-up và audit; không tạo approval flow riêng cho từng module.
- One Meeting Engine phải dùng một engine chung với nhiều meeting type, visibility, participant scope và linkage tới project/axis/module/risk/task/decision/approval.
- AI phải đi qua AI Gateway/Coordinator, có citation khi dùng dữ liệu nhạy cảm, chỉ đọc dữ liệu trong permission context và chỉ tạo action proposal cần human confirmation.
- AI không được mutate trực tiếp domain table; mọi mutation từ AI phải qua action proposal, preview, xác nhận người dùng và kiểm tra quyền domain lần nữa.
- Data model project-centric nhưng phải hỗ trợ record cấp organization, không gắn project cụ thể hoặc gắn nhiều project khi nghiệp vụ meeting/decision/proposal cần.
- Business records lưu scope nghiệp vụ (`organization_id`, `project_id`, `axis_id`, `workstream_id/module_id`, `owner_id`); role/permission nằm ở assignment/policy/RBAC layer.
- Module 1 phải nằm trong bối cảnh Trục 1 chỉ expose 5 module/workstream chính; không hiển thị 12 bước cũ như 12 menu ngang hàng.
- 12 bước pháp lý cũ được giữ như checklist/workflow bên trong các module, không bị xóa hoặc đổi tên.
- Module 2-5 chưa triển khai sâu trong đợt này; chỉ tạo integration point/gap story khi cần cho Dashboard, Approval, Risk, Meeting, Decision hoặc dữ liệu mock nghiệm thu Module 1.
- Entity nền tối thiểu cần tính tới: organization, project, axis, workstream/module, project_workstream, task, document, legal_step, proposal/request, meeting, decision, approval, audit_log, assignment.
- Dashboard/KPI/risk/readiness phải derive từ structured records qua service DTO đã lọc quyền, không hardcode số liệu trong UI.
- Zod dùng ở boundary form/action/service input; DB snake_case map sang domain camelCase trong repository.
- Domain module nằm dưới `src/modules/{module}` với `types.ts`, `validation.ts`, `actions.ts`, `services/*`, `components/*`; cross-cutting auth/permissions/db/storage/audit nằm dưới `src/lib/*`.
- Repository implementation đặt trong `services/*-repository.ts`; service orchestration đặt trong `services/*-service.ts`.
- Module không gọi repository của module khác trực tiếp; cross-module business flow đi qua service contracts.
- Audit/history/versioning áp dụng cho approval, decision, risk, meeting, export, permission và AI-confirmed mutations.
- Route/module mapping chính cho Module 1 dùng `src/app/command-center`, `src/app/executive/*`, `src/modules/command-center`, `src/modules/executive`, `src/modules/dashboard`, `src/modules/proposals`, `src/modules/meetings`, `src/modules/tasks`, `src/modules/documents`, `src/modules/legal`, `src/modules/ai`, `src/modules/settings`, `src/modules/users`, `src/modules/workspaces` khi liên quan.
- UI phải Vietnamese-first, role-first, dense but readable, responsive, WCAG 2.1 AA và không dùng một dashboard chung cho mọi vai trò.
- Feature mới phải kèm test phù hợp: unit tests cho service/permission/data access, component behavior khi cần, e2e smoke cho flow chính nếu có UI route mới.
- Verification baseline: `npm run typecheck`, `npm run lint`, `npm run test`; e2e hoặc Supabase validation scripts khi story chạm route/permission/RLS/production readiness.
- Gaps/hardening cần story riêng nếu nằm trong scope: Supabase RLS live validation, proposal Supabase repository validation, configurable approval routing, production storage upload/download, audit UI và notifications.

## UX Design Requirements

UX-DR1: Xây design system theo Tailwind CSS + shadcn/ui + Radix primitives + lucide-react, không đưa Ant Design/MUI làm nền chính.
UX-DR2: Chuẩn hóa design tokens cho màu semantic, typography, spacing 4/8/12/16/24px, radius tối đa 8px, border/divider, focus state và text tiếng Việt.
UX-DR3: Dùng nền sáng chuyên nghiệp, surface trắng, text rõ, GreenNest green cho primary action vừa phải, các màu info/warning/danger/success/neutral theo semantic state.
UX-DR4: Badge trạng thái luôn có chữ; risk đỏ/vàng/xanh phải có label, lý do và drill-down, không chỉ dựa vào màu.
UX-DR5: Typography dashboard phải nhỏ gọn: title 24-28px, section 18-20px, panel 15-16px, body 14px, metadata 12-13px; không dùng hero-scale type trong dashboard/panel.
UX-DR6: Layout phải dense but readable, không lồng card trong card, không dùng section nổi như card lớn nếu không cần, dashboard ưu tiên grid/alignment/grouping hơn trang trí.
UX-DR7: Bổ sung hoặc chuẩn hóa foundation UI: Badge, Card/Panel, Table, Tabs, Dialog/Alert Dialog, Sheet/Drawer, Dropdown Menu, Select, Input/Search, Tooltip, Separator, Scroll Area, Skeleton/Loading, Toast/Inline feedback.
UX-DR8: Xây AppShell/PermissionAwareShell với sidebar permission-aware, topbar, breadcrumb/context, workspace selector, scope selector, content container; hỗ trợ desktop, mobile drawer, collapsed, unauthorized và loading session.
UX-DR9: Xây WorkspaceHeader hiển thị workspace, role, scope, thời gian cập nhật và primary action theo quyền; hỗ trợ biến thể Chairman, CEO, Project Director, Department Head, Secretary/Assistant.
UX-DR10: Xây KPI Strip hiển thị KPI trọng yếu theo scope với label, value, trend, status, quyền dữ liệu và link drill-down; có state normal, warning, danger, no permission, loading, empty.
UX-DR11: Xây Priority Queue cho approval, risk, escalation và task priority với title, type, severity, owner, deadline, reason, next action, filter/sort và quick action theo quyền.
UX-DR12: Xây Risk Map/Deadline Heatmap với category, count, severity, affected projects, drill-down, label rõ và accessibility không phụ thuộc màu.
UX-DR13: Xây Approval Action Panel có request summary, policy, amount, attachments, history và actions approve/reject/return/forward/ask for meeting/hold; reject/return bắt buộc lý do.
UX-DR14: Xây Record Drilldown Panel để mở dữ liệu nguồn từ KPI/risk/approval, hiển thị summary, related records, owner, status, deadline, timeline, audit; desktop dùng side panel, mobile dùng full-screen sheet.
UX-DR15: Xây Activity Timeline/Audit Trail hiển thị actor, action, timestamp, previous/new state, comment, attachment cho approval, decision, risk, meeting và permission changes.
UX-DR16: Xây Contextual AI Panel theo workspace/record context, không thay workflow; output là draft/gợi ý/proposed, có citation và trạng thái proposed/accepted/rejected/executed/failed nếu sinh action.
UX-DR17: Tạo Executive Command Center pattern gồm KPI strip, top risk/issues, approval queue, risk map, executive timeline và AI copilot panel.
UX-DR18: Tạo role workspace compositions từ cùng bộ pattern: Chairman Workspace, CEO Workspace, Project Director Workspace, Department Head Workspace, Secretary/Assistant Workspace; không hardcode từng workspace thành trang riêng rời rạc.
UX-DR19: Entry sau đăng nhập phải đưa người dùng vào workspace mặc định theo vai trò chính; nếu có nhiều role/scope, UI phải cho đổi workspace/scope rõ ràng.
UX-DR20: Mọi KPI, risk, approval, deadline hoặc alert quan trọng phải drill-down được và hiển thị title, type, scope, owner, deadline, status, reason, source/linked records, actions theo quyền và timeline/audit nếu có.
UX-DR21: Button hierarchy phải phân biệt primary, secondary, destructive và disabled/permission-denied; destructive/critical mutation cần confirmation; action không đủ quyền không được làm lộ dữ liệu.
UX-DR22: Feedback states phải rõ: success nêu record và bước tiếp theo, warning cho sắp quá hạn/thiếu dữ liệu, error có ngữ cảnh và cách khắc phục, permission/403 không render dữ liệu rồi mới ẩn.
UX-DR23: Form patterns phải có label tiếng Việt, required indicator, inline validation, giữ input khi validation fail, sticky action nếu form dài; approval form và AI action proposal form phải có validation/preview rõ.
UX-DR24: Navigation phải permission-aware và role-first: sidebar chỉ hiện module/workspace có quyền, topbar có workspace/scope selector, mobile dùng drawer, breadcrumb/detail context chỉ rõ organization/project/axis/module.
UX-DR25: Search/filter phải hỗ trợ tên project, approval, hồ sơ, owner, mã record; filter theo status, severity, project, owner, deadline, module, scope; list/table quan trọng có sort và active filter removable.
UX-DR26: Loading/empty/error/unauthorized states phải có nội dung rõ; skeleton giữ layout ổn định; empty phân biệt không có dữ liệu trong scope hay do filter; unauthorized không lộ dữ liệu nhạy cảm.
UX-DR27: Responsive strategy phải ưu tiên desktop cho workflow phức tạp, tablet giảm cột/collapse nav, mobile hỗ trợ review nhanh KPI/risk/approval/lịch họp/tài liệu và action đơn giản.
UX-DR28: Dùng Tailwind breakpoints `sm`, `md`, `lg`, `xl`, `2xl`; `<768px` stacked/drawer/list compact, `>=1280px` dashboard 3-4 cột, `>=1536px` có thể hiển thị KPI/queue/risk map/timeline cùng lúc; không scale font theo viewport width.
UX-DR29: Table rộng phải có responsive alternative: horizontal scroll có kiểm soát hoặc compact list; không ép bảng rộng trên mobile.
UX-DR30: Accessibility target là WCAG 2.1 AA: contrast 4.5:1, focus visible, accessible names cho button/icon button, semantic table headers, dialog/sheet có title/description/focus trap/close, touch target mobile khoảng 44x44px.
UX-DR31: Kiểm tra responsive ở 360/390/430/768/820/1024/1280/1440/1536px cho các workspace và panel chính.
UX-DR32: Kiểm tra accessibility bằng keyboard-only navigation, focus order, automated accessibility nếu stack hỗ trợ, manual contrast review và text tiếng Việt không tràn/cắt xấu.
UX-DR33: Các journey phải được hỗ trợ: Chairman/CEO Morning Command Loop, Approval Vượt Ngưỡng, Project Director Risk/Deadline Flow, Department Head Checklist/Workflow Flow, Secretary/Assistant Meeting Preparation Flow.
UX-DR34: AI UX phải là contextual assistant: nằm trong workspace/record context, có citation, không tự approve/reject/tạo blocker/publish biên bản, mutation qua preview và human confirmation.
UX-DR35: Migrate giao diện cũ sang cấu trúc actionable pattern, loại bỏ card tĩnh không có drill-down/action; mỗi KPI/risk/approval/decision cần owner, status, reason, deadline, next action và audit/history khi phù hợp.

## FR Coverage Map

FR-001: Epic 2 - Dashboard Tổng Quan cho Module Lãnh đạo.
FR-002: Epic 2 - Dashboard lọc theo scope và permission.
FR-003: Epic 2 - Tổng số dự án/cơ hội trong scope.
FR-004: Epic 2 - Trạng thái dự án đỏ/vàng/xanh.
FR-005: Epic 2 - KPI điều hành tổng.
FR-006: Epic 2 - KPI tài chính nhạy cảm theo quyền.
FR-007: Epic 2 - Tổng request chờ duyệt và quá hạn.
FR-008: Epic 2 - Risk map hoặc risk summary.
FR-009: Epic 2 - Việc khẩn, deadline hôm nay và quyết định mới.
FR-010: Epic 2 - Không hiển thị task vi mô hoặc dữ liệu chuyên môn sâu mặc định.
FR-011: Epic 2 - Drill-down tới executive summary hoặc record read-only.
FR-012: Epic 2 - Drill-down sang module chuyên môn theo quyền hoặc chặn 403.
FR-013: Epic 2 - Morning Briefing cho lãnh đạo.
FR-014: Epic 2 - Morning Briefing gồm AI summary, risk, việc cần quyết, KPI, approval quá hạn và trạng thái dự án.
FR-015: Epic 2 - Morning Briefing dùng dữ liệu trong scope.
FR-016: Epic 2 - Executive Common Center.
FR-017: Epic 2 - Common Center hiển thị thông báo, quyết định, KPI, lịch, risk, deadline và việc quá hạn.
FR-018: Epic 2 - Common Center lọc theo dynamic scope và permission.
FR-019: Epic 2 - Risk nghiêm trọng và approval quá hạn xuất hiện trong Common Center theo quyền.
FR-020: Epic 2 - Private Workspace theo từng người dùng.
FR-021: Epic 2 - Workspace khác nhau theo assignment/scope.
FR-022: Epic 2 - Private Workspace hiển thị dự án, approval, risk, deadline, quyết định, meeting và KPI trong scope.
FR-023: Epic 2 - Workspace mẫu cho Chủ tịch, CEO, Giám đốc dự án, Trưởng bộ phận và Thư ký/Trợ lý.
FR-024: Epic 2 - Workspace Thư ký/Trợ lý chỉ hiển thị dữ liệu và action được ủy quyền.
FR-025: Epic 3 - Approval Center trong Module Lãnh đạo.
FR-026: Epic 3 - Approval Center phân vùng Trục 1, Trục 2 và Trục 3.
FR-027: Epic 3 - Trục 1 có flow chi tiết; Trục 2/3 là placeholder/mock.
FR-028: Epic 3 - Phân loại approval theo hồ sơ, tài chính, chiến lược, kỹ thuật, pháp lý và họp.
FR-029: Epic 3 - Approval hồ sơ/văn bản Trục 1.
FR-030: Epic 3 - Approval chi phí/mock chi phí Trục 1.
FR-031: Epic 3 - Approval pháp lý/blocker Trục 1.
FR-032: Epic 3 - Approval quy hoạch/kỹ thuật ở mức request điều hành.
FR-033: Epic 3 - Approval chiến lược/chuyển bước.
FR-034: Epic 3 - Approval họp hoặc đề xuất họp quan trọng.
FR-035: Epic 3 - Duyệt trực tiếp theo policy/assignment.
FR-036: Epic 3 - Workflow duyệt tuần tự cơ bản.
FR-037: Epic 3 - Ngưỡng duyệt tiền cấu hình qua BO Settings/Policy.
FR-038: Epic 3 - Approval outcomes: approve, reject, return, forward, ask meeting, hold, cancel.
FR-039: Epic 3 - Reject và return bắt buộc lý do.
FR-040: Epic 3 - Approve có comment tùy chọn.
FR-041: Epic 3 - Hold, forward/escalate và ask meeting khuyến nghị comment.
FR-042: Epic 3 - Approval history gồm actor, time, note, attachment, status/version và audit log.
FR-043: Epic 3 - Cảnh báo/escalate approval quá hạn.
FR-044: Epic 4 - Decision & Assignment Center.
FR-045: Epic 4 - Phân biệt decision với approval.
FR-046: Epic 4 - Decision tạo sau approval, sau meeting hoặc độc lập.
FR-047: Epic 4 - Decision hỗ trợ giao việc, KPI, deadline, ưu tiên và hướng xử lý.
FR-048: Epic 4 - Một decision tạo nhiều assignment/task.
FR-049: Epic 4 - MVP không yêu cầu người nhận xác nhận đã nhận việc.
FR-050: Epic 4 - Decision có version/history khi sửa nội dung quan trọng.
FR-051: Epic 4 - Decision Center hiển thị quyết định, giao việc, KPI, deadline và trạng thái thực hiện.
FR-052: Epic 5 - Risk & Alert Center.
FR-053: Epic 5 - Risk levels: Thấp, Trung bình, Cao, Nghiêm trọng.
FR-054: Epic 5 - Nhóm risk mặc định.
FR-055: Epic 5 - Nhóm risk cấu hình được trong BO Settings.
FR-056: Epic 5 - Trạng thái đỏ/vàng/xanh do hệ thống gợi ý và người có quyền xác nhận/override.
FR-057: Epic 5 - Override trạng thái cần lý do và audit log.
FR-058: Epic 5 - Điều kiện đỏ.
FR-059: Epic 5 - Điều kiện vàng.
FR-060: Epic 5 - Điều kiện xanh.
FR-061: Epic 5 - Risk map theo màu, nhóm risk, dự án, deadline và owner.
FR-062: Epic 5 - Drill-down risk với ma trận khả năng xảy ra x mức ảnh hưởng.
FR-063: Epic 5 - Tạo risk/blocker theo quyền và ủy quyền.
FR-064: Epic 5 - Hệ thống/AI chỉ tạo cảnh báo/gợi ý risk ở draft.
FR-065: Epic 5 - Đóng risk/blocker theo quyền.
FR-066: Epic 5 - Risk cao/nghiêm trọng cần xác nhận đóng bởi quyền cao hơn khi phù hợp.
FR-067: Epic 5 - Risk đỏ/nghiêm trọng hiện ở Dashboard, Morning Briefing và Risk Center theo quyền.
FR-068: Epic 5 - Risk quá hạn nhắc và escalate theo policy.
FR-069: Epic 5 - Blocker có đủ trường bắt buộc và audit log.
FR-070: Epic 6 - One Meeting Engine + Multiple Meeting Types.
FR-071: Epic 6 - Không tạo nhiều module họp riêng cứng.
FR-072: Epic 6 - Quản lý phòng/đặt phòng là placeholder MVP.
FR-073: Epic 6 - Người tạo họp theo quyền/scope/ủy quyền.
FR-074: Epic 6 - Phân loại meeting động theo type, organization, project, axis, department, visibility, participant_scope.
FR-075: Epic 6 - Meeting liên kết project, axis, module, department, approval, risk, decision, task hoặc hồ sơ.
FR-076: Epic 6 - AI Meeting Summary là draft đến khi approved.
FR-077: Epic 6 - Biên bản chính thức cần người có quyền duyệt.
FR-078: Epic 6 - Meeting sinh follow-up task khi cần.
FR-079: Epic 6 - Meeting có decision tracking.
FR-080: Epic 7 - History & Archive Center.
FR-081: Epic 7 - Hiển thị lịch sử decision, approval, assignment, meeting, audit, version và search history nếu có.
FR-082: Epic 7 - Search, filter, export và timeline theo quyền.
FR-083: Epic 7 - Export dashboard, audit log và approval history theo permission `Xuất dữ liệu`.
FR-084: Epic 7 - Export dữ liệu nhạy cảm cần permission riêng và audit log.
FR-085: Epic 8 - Executive AI Center MVP.
FR-086: Epic 8 - AI nâng cao để phase sau hoặc placeholder/mock.
FR-087: Epic 8 - AI tuân thủ permission người dùng hiện tại.
FR-088: Epic 8 - AI chỉ đọc, tóm tắt và gợi ý từ dữ liệu được phép.
FR-089: Epic 8 - AI không tự phê duyệt, quyết định, tạo blocker chính thức hoặc publish biên bản.
FR-090: Epic 8 - AI output là draft/gợi ý đến khi được xác nhận.
FR-091: Epic 1 - Khu quản trị riêng cho Chủ tịch/Super Admin.
FR-092: Epic 1 - BO Settings cấu hình role, permission và policy/scope cơ bản.
FR-093: Epic 1 - Role template mặc định bằng tiếng Việt.
FR-094: Epic 1 - Cấu hình nhóm risk.
FR-095: Epic 1 - Cấu hình ngưỡng duyệt tiền ở mức mock/policy cơ bản.
FR-096: Epic 1 - Tách quyền quản trị hệ thống khỏi quyền duyệt nghiệp vụ.
FR-097: Epic 1 - Thư ký/trợ lý được ủy quyền theo từng lãnh đạo.
FR-098: Epic 1 - Cấu hình phạm vi ủy quyền theo dự án/module/action.
FR-099: Epic 1 - Thư ký/trợ lý tạo và submit request thay lãnh đạo khi được phép.
FR-100: Epic 1 - MVP không cho thư ký/trợ lý approve thay lãnh đạo.
FR-101: Epic 2 - Workspace Thư ký/Trợ lý hiển thị lịch, hồ sơ trình, tài liệu họp, task, reminder và approval pending trong scope.
FR-102: Epic 6 - Meeting type `EXECUTIVE_MEETING`.
FR-103: Epic 6 - Meeting type `EXECUTIVE_OPERATIONAL_MEETING`.
FR-104: Epic 6 - Meeting type `DEPARTMENT_INTERNAL_MEETING`.
FR-105: Epic 6 - Meeting type `PROJECT_MEETING`.
FR-106: Epic 6 - Meeting type `EXTERNAL_PARTNER_MEETING`.
FR-107: Epic 6 - Meeting type `GOVERNMENT_MEETING`.
FR-108: Epic 6 - Dữ liệu tối thiểu của meeting.
FR-109: Epic 6 - Meeting workflow statuses.
FR-110: Epic 6 - Meeting visibility theo RBAC, project scope và organization scope.
FR-111: Epic 6 - Executive chỉ thấy meeting quan trọng trong scope.
FR-112: Epic 6 - Department workspace chỉ thấy meeting theo scope phòng ban/người dùng.
FR-113: Epic 6 - Filter Meeting Center.
FR-114: Epic 6 - External participants.
FR-115: Epic 6 - Follow-up actions liên kết related_tasks.
FR-116: Epic 6 - Decisions liên kết Decision & Assignment Center.
FR-117: Epic 6 - Audit log cho meeting operations.
FR-118: Epic 6 - Meeting ngoài project cụ thể.
FR-119: Epic 6 - Meeting gắn nhiều project.
