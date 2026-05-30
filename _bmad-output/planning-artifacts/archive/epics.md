---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/truc-1-mvp-final-bmad-ready.md"
  - "_bmad-output/planning-artifacts/architecture.md"
workflowType: "epics-and-stories"
lastStep: 1
status: "complete"
completedAt: "2026-05-23"
project_name: "green_nest_buider_web"
user_name: "Admin"
date: "2026-05-23"
scope: "Module 1 - Lãnh đạo trong Trục 1"
---

# green_nest_buider_web - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for green_nest_buider_web, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

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

### NonFunctional Requirements

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

### Additional Requirements

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

### UX Design Requirements

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

### FR Coverage Map

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

## Epic List

### Epic 1: Thiết Lập Điều Hành, RBAC Và Ủy Quyền
Chủ tịch/Super Admin và quản trị được ủy quyền có thể cấu hình nền điều hành tối thiểu cho Module 1: role template tiếng Việt, permission/action, policy/scope, nhóm risk, ngưỡng duyệt tiền, phân quyền quản trị tách khỏi duyệt nghiệp vụ và ủy quyền thư ký/trợ lý. Epic này tạo nền an toàn để các workspace và flow sau hoạt động theo role + scope + action thay vì hardcode.

**FRs covered:** FR-091, FR-092, FR-093, FR-094, FR-095, FR-096, FR-097, FR-098, FR-099, FR-100.

**Implementation notes:** Dùng `src/modules/settings`, `src/modules/users`, `src/modules/workspaces`, `src/lib/permissions`, `src/lib/auth`, `src/lib/audit`; mutation qua Server Actions + service layer; repository giữ mock/Supabase parity; audit log cho cập nhật permission/policy/delegation.

### Epic 2: Workspace Điều Hành Và Dashboard Module 1
Lãnh đạo và người được ủy quyền có thể vào đúng workspace theo vai trò/scope, xem Dashboard Tổng Quan, Morning Briefing, Executive Common Center và Private Workspace với KPI, trạng thái đỏ/vàng/xanh, approval/risk/deadline/decision/meeting liên quan, dữ liệu nhạy cảm theo quyền và drill-down đến nguồn hoặc 403 khi không đủ quyền.

**FRs covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-017, FR-018, FR-019, FR-020, FR-021, FR-022, FR-023, FR-024, FR-101.

**Implementation notes:** Dùng `src/app/command-center`, `src/app/executive/*`, `src/modules/command-center`, `src/modules/executive`, `src/modules/dashboard`, `src/modules/workspaces`; service DTO phải filter server-side; UI dùng PermissionAwareShell, WorkspaceHeader, KPI Strip, Priority Queue, Risk Map và Record Drilldown; Module 2-5 chỉ dùng integration placeholders/mock khi cần hiển thị nguồn dữ liệu.

### Epic 3: Approval Center Trên Proposal/Approval Backbone
Lãnh đạo có thể xem và xử lý approval trong Module 1 qua một Approval Center chung, phân vùng Trục 1/2/3, phân loại request, xử lý approve/reject/return/forward/ask meeting/hold/cancel, áp dụng policy/assignment, lưu history/audit và cảnh báo/escalate quá hạn.

**FRs covered:** FR-025, FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, FR-035, FR-036, FR-037, FR-038, FR-039, FR-040, FR-041, FR-042, FR-043.

**Implementation notes:** Dùng `src/modules/proposals` làm backbone, không tạo approval flow riêng; Approval Action Panel theo UX spec; Trục 2/3 chỉ là placeholder/mock; policy/threshold lấy từ Epic 1; mọi mutation check permission server-side và audit.

### Epic 4: Decision & Assignment Center
Lãnh đạo có thể ban hành quyết định/chỉ đạo khác biệt với approval, tạo assignment/task từ decision, gán deadline/KPI/ưu tiên, theo dõi trạng thái thực hiện và giữ version/history khi sửa nội dung quan trọng.

**FRs covered:** FR-044, FR-045, FR-046, FR-047, FR-048, FR-049, FR-050, FR-051.

**Implementation notes:** Dùng `src/modules/executive`, `src/modules/tasks`, `src/modules/meetings` khi liên kết sau họp, `src/lib/audit`; decision có thể tạo từ approval, meeting hoặc độc lập nhưng không phụ thuộc future epic để dùng chức năng cơ bản.

### Epic 5: Risk & Alert Center Cho Điều Hành
Lãnh đạo có thể xem risk/blocker theo nhóm, mức độ, màu đỏ/vàng/xanh, lý do, deadline và owner; tạo/cập nhật/đóng risk theo quyền; nhận cảnh báo risk quá hạn/escalation; hệ thống chỉ đưa gợi ý/draft cho risk do AI hoặc rule phát hiện cho tới khi người có quyền xác nhận.

**FRs covered:** FR-052, FR-053, FR-054, FR-055, FR-056, FR-057, FR-058, FR-059, FR-060, FR-061, FR-062, FR-063, FR-064, FR-065, FR-066, FR-067, FR-068, FR-069.

**Implementation notes:** Dùng `src/modules/executive`, `src/modules/dashboard`, `src/modules/settings`, `src/lib/audit`; risk groups cấu hình từ Epic 1; Risk Map/Deadline Heatmap và drill-down phải không phụ thuộc màu; AI chỉ tạo advisory draft/action proposal.

### Epic 6: One Meeting Engine Cho Điều Hành
Người có quyền có thể tạo, xem, lọc và theo dõi cuộc họp qua một Meeting System chung với nhiều meeting type, visibility/scope động, external participants, attachments, agenda, minutes, AI summary draft, follow-up actions, related tasks, related approvals, decision tracking và audit.

**FRs covered:** FR-070, FR-071, FR-072, FR-073, FR-074, FR-075, FR-076, FR-077, FR-078, FR-079, FR-102, FR-103, FR-104, FR-105, FR-106, FR-107, FR-108, FR-109, FR-110, FR-111, FR-112, FR-113, FR-114, FR-115, FR-116, FR-117, FR-118, FR-119.

**Implementation notes:** Dùng `src/modules/meetings` và route meeting hiện có; không tách nhiều module họp riêng; phòng họp/booking là placeholder; liên kết với proposals, risks, tasks, decisions qua service contracts; meeting visibility enforce server/service.

### Epic 7: History, Archive, Export Và Audit Visibility
Người có quyền có thể tra cứu lịch sử điều hành, approval, decision, assignment, meeting, audit log, version hồ sơ, timeline và export theo permission; dữ liệu nhạy cảm hoặc export quan trọng luôn bị kiểm soát và ghi audit.

**FRs covered:** FR-080, FR-081, FR-082, FR-083, FR-084.

**Implementation notes:** Dùng `src/lib/audit`, `src/modules/reports`, `src/modules/executive`, `src/modules/proposals`, `src/modules/meetings`; export permission là `Xuất dữ liệu`; không render dữ liệu nhạy cảm trước khi kiểm tra quyền.

### Epic 8: Executive AI Advisory
Lãnh đạo có thể dùng AI Summary, AI Meeting Summary và AI Approval Assistant ở mức advisory trong đúng context và permission; AI chỉ đọc/tóm tắt/gợi ý từ dữ liệu được phép, output là draft/gợi ý, các năng lực AI nâng cao để phase sau hoặc mock/placeholder.

**FRs covered:** FR-085, FR-086, FR-087, FR-088, FR-089, FR-090.

**Implementation notes:** Dùng `src/modules/ai`, `src/modules/knowledge`, contextual AI panel trong executive/approval/meeting context; mọi đề xuất mutation đi qua action proposal preview, human confirmation và domain permission re-check; không cho AI tự approve, quyết định, tạo blocker chính thức hoặc publish biên bản.

## Epic 1: Thiết Lập Điều Hành, RBAC Và Ủy Quyền

Chủ tịch/Super Admin và quản trị được ủy quyền có thể cấu hình nền điều hành tối thiểu cho Module 1: role template tiếng Việt, permission/action, policy/scope, nhóm risk, ngưỡng duyệt tiền, phân quyền quản trị tách khỏi duyệt nghiệp vụ và ủy quyền thư ký/trợ lý. Epic này tạo nền an toàn để các workspace và flow sau hoạt động theo role + scope + action thay vì hardcode.

### Story 1.1: Role Template Và Permission Catalog Cho Module 1

**Requirements Covered:** FR-091, FR-092, FR-093, FR-096, NFR-005, NFR-006, NFR-008.

As a Chủ tịch/Super Admin,
I want cấu hình role template và action permission tiếng Việt cho Module 1,
So that hệ thống có nền phân quyền không hardcode cho các workspace và workflow điều hành.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền quản lý vai trò
**When** mở BO Settings cho role/permission
**Then** hệ thống hiển thị role template mặc định bằng tiếng Việt gồm Chủ tịch/Super Admin, CEO, Giám đốc dự án, Trưởng bộ phận, Thư ký/Trợ lý, Quản trị và Người xem
**And** role có thể thêm, đổi tên, vô hiệu hóa mà không sửa code UI.

AC2:
**Given** hệ thống có danh sách action permission tối thiểu
**When** quản trị xem permission catalog
**Then** các action như xem tổng hợp, xem chi tiết, xem tài chính nhạy cảm, duyệt, trả lại, chuyển cấp, tạo quyết định, giao việc, tạo cuộc họp, xuất dữ liệu và xem audit được quản lý như dữ liệu cấu hình.

AC3:
**Given** một role có quyền quản trị hệ thống nhưng không có quyền duyệt nghiệp vụ
**When** role đó truy cập approval action
**Then** hệ thống không cho duyệt nghiệp vụ
**And** trả unauthorized/disabled action theo UX pattern mà không lộ dữ liệu ngoài scope.

**Files/Modules:** `src/modules/settings`, `src/modules/users`, `src/lib/permissions`, `src/lib/auth`, `src/lib/audit`.

**Test Expectations:** Unit tests cho permission catalog, role template load, deny-by-default và tách quyền quản trị khỏi quyền duyệt.

**Dependencies:** None.

### Story 1.2: Scope Assignment Theo Organization, Project, Axis Và Workstream

**Requirements Covered:** FR-092, FR-096, NFR-001, NFR-002, NFR-003, NFR-004, NFR-005, NFR-007, NFR-008.

As a quản trị điều hành,
I want gán role và action theo organization/project/axis/workstream/module,
So that một người có thể có quyền khác nhau ở từng phạm vi điều hành.

**Acceptance Criteria:**

AC1:
**Given** một người dùng có nhiều assignment
**When** service kiểm tra quyền cho một project/module/action cụ thể
**Then** kết quả quyền được tính theo user + role + organization + project + axis + workstream/module + action
**And** không lấy role/permission từ business record.

AC2:
**Given** người dùng không có assignment phù hợp
**When** truy cập route hoặc service data Module 1
**Then** route/service trả 403 hoặc empty/unauthorized state theo ngữ cảnh
**And** dữ liệu không được render rồi mới ẩn ở frontend.

AC3:
**Given** người dùng được gán quyền ở project A nhưng không ở project B
**When** gọi dashboard/workspace service
**Then** DTO chỉ chứa dữ liệu trong project A.

**Files/Modules:** `src/lib/permissions/access-scope.ts`, `src/modules/workspaces`, `src/modules/settings`, `tests/unit`.

**Test Expectations:** Unit tests cho multi-assignment, scope filtering và direct access 403.

**Dependencies:** Story 1.1.

### Story 1.3: Policy Cơ Bản Cho Ngưỡng Duyệt Tiền Và Nhóm Risk

**Requirements Covered:** FR-037, FR-055, FR-092, FR-094, FR-095, NFR-006, NFR-008.

As a quản trị điều hành,
I want cấu hình policy cơ bản cho ngưỡng duyệt tiền và nhóm risk,
So that approval và risk center không hardcode rule nghiệp vụ.

**Acceptance Criteria:**

AC1:
**Given** quản trị có quyền cấu hình policy
**When** tạo hoặc sửa ngưỡng duyệt tiền
**Then** policy được lưu qua service/repository
**And** các approval flow có thể đọc policy này thay vì hardcode threshold.

AC2:
**Given** quản trị cấu hình nhóm risk
**When** Risk Center hoặc dashboard tải dữ liệu
**Then** hệ thống dùng nhóm risk từ configuration
**And** vẫn có nhóm mặc định khi seed/demo data được khởi tạo.

AC3:
**Given** policy hoặc nhóm risk bị sửa
**When** mutation hoàn tất
**Then** audit log ghi actor, thời gian, giá trị cũ/mới và scope.

**Files/Modules:** `src/modules/settings`, `src/modules/proposals`, `src/modules/executive`, `src/lib/audit`.

**Test Expectations:** Unit tests cho policy repository, service validation, audit log và fallback seed config.

**Dependencies:** Story 1.1, Story 1.2.

### Story 1.4: Delegation Cho Thư Ký/Trợ Lý Theo Lãnh Đạo

**Requirements Covered:** FR-097, FR-098, FR-099, FR-100, NFR-005, NFR-006, NFR-007.

As a lãnh đạo hoặc quản trị được ủy quyền,
I want cấu hình Thư ký/Trợ lý theo từng lãnh đạo và phạm vi dự án/module/action,
So that Thư ký/Trợ lý chỉ thao tác trong phạm vi được ủy quyền.

**Acceptance Criteria:**

AC1:
**Given** một lãnh đạo có Thư ký/Trợ lý được ủy quyền
**When** cấu hình delegation
**Then** hệ thống lưu lãnh đạo ủy quyền, người được ủy quyền, project/module/action và thời hạn nếu có.

AC2:
**Given** Thư ký/Trợ lý được phép tạo và submit request thay lãnh đạo
**When** họ tạo request trong scope được ủy quyền
**Then** request ghi rõ submittedBy và onBehalfOf
**And** audit log thể hiện hành động thay mặt.

AC3:
**Given** Thư ký/Trợ lý cố approve thay lãnh đạo trong MVP
**When** gọi approval action
**Then** hệ thống chặn action bằng service-side permission
**And** trả thông báo rõ rằng MVP không cho approve thay.

**Files/Modules:** `src/modules/users`, `src/modules/settings`, `src/modules/proposals`, `src/modules/workspaces`, `src/lib/audit`.

**Test Expectations:** Unit tests cho delegation scope, submit on behalf, block approve on behalf và audit.

**Dependencies:** Story 1.2.

### Story 1.5: Seed Data Điều Hành Cho Nghiệm Thu Module 1

**Requirements Covered:** FR-091, FR-092, FR-093, FR-097, FR-098, FR-099, FR-100, NFR-007, NFR-008.

As a product owner,
I want có dữ liệu seed/mock đủ vai trò, scope, policy và delegation,
So that Module 1 có thể nghiệm thu bằng nhiều user và nhiều phạm vi quyền.

**Acceptance Criteria:**

AC1:
**Given** môi trường demo chạy mock/file-backed mode
**When** load dữ liệu Module 1
**Then** có ít nhất các user Chủ tịch, CEO, Giám đốc dự án, Trưởng bộ phận, Thư ký/Trợ lý và Người xem với assignment khác nhau.

AC2:
**Given** seed data có project/cơ hội mẫu
**When** từng user mở workspace
**Then** dữ liệu hiển thị khác nhau theo assignment/scope
**And** có dữ liệu tài chính nhạy cảm để test permission.

AC3:
**Given** seed data có policy và delegation
**When** chạy unit tests hoặc demo manual
**Then** có thể kiểm tra 403, no-permission state, submit thay lãnh đạo và chặn approve thay.

**Files/Modules:** `database/seeds`, `src/modules/*/services/*-repository.ts`, `tests/fixtures`, `tests/unit`.

**Test Expectations:** Unit tests hoặc fixture tests xác nhận seed data bao phủ role/scope/policy/delegation cần cho các story sau.

**Dependencies:** Story 1.1, Story 1.2, Story 1.3, Story 1.4.

## Epic 2: Workspace Điều Hành Và Dashboard Module 1

Lãnh đạo và người được ủy quyền có thể vào đúng workspace theo vai trò/scope, xem Dashboard Tổng Quan, Morning Briefing, Executive Common Center và Private Workspace với KPI, trạng thái đỏ/vàng/xanh, approval/risk/deadline/decision/meeting liên quan, dữ liệu nhạy cảm theo quyền và drill-down đến nguồn hoặc 403 khi không đủ quyền.

### Story 2.1: PermissionAwareShell Và Workspace Entry

**Requirements Covered:** FR-002, FR-020, FR-021, FR-023, NFR-001, NFR-002, NFR-003, NFR-007, UX-DR7, UX-DR8, UX-DR9, UX-DR19, UX-DR24.

As a người dùng sau đăng nhập,
I want được đưa vào workspace mặc định theo vai trò và scope,
So that tôi bắt đầu ở đúng bề mặt điều hành thay vì dashboard chung.

**Acceptance Criteria:**

AC1:
**Given** người dùng đã đăng nhập và có assignment Module 1
**When** truy cập entry route điều hành
**Then** hệ thống hiển thị PermissionAwareShell với sidebar permission-aware, topbar, workspace selector và scope selector.

AC2:
**Given** người dùng không có quyền vào Module 1
**When** truy cập URL Module 1 trực tiếp
**Then** hệ thống trả 403
**And** không fetch/render dữ liệu Module 1 trước khi chặn.

AC3:
**Given** người dùng có nhiều role/scope
**When** đổi workspace hoặc scope
**Then** dashboard reload bằng service DTO tương ứng với scope mới
**And** navigation chỉ hiển thị module/workspace có quyền.

AC4:
**Given** người dùng có quyền vào Trục 1
**When** sidebar hoặc entry point điều hành render
**Then** hệ thống phân biệt rõ `Tổng quan Trục 1` / Command Center với `Dashboard Tổng Quan` của Module 1 - Lãnh đạo
**And** màn `Tổng quan Trục 1` chỉ đóng vai trò entry cho 5 module MVP, không thay thế dashboard 1.1 của Module Lãnh đạo.

AC5:
**Given** người dùng là Chủ tịch hoặc leadership persona có cả quyền điều hành và quyền quản trị
**When** đăng nhập hoặc mở default workspace
**Then** hệ thống đưa người dùng vào workspace điều hành phù hợp theo role/scope
**And** `Quản trị Chủ tịch` / BO Settings chỉ là mục riêng, không phải default daily workspace.

**Files/Modules:** `src/app/command-center`, `src/app/executive/*`, `src/components/shared`, `src/modules/workspaces`, `src/lib/permissions`.

**Test Expectations:** Unit tests cho workspace resolution; component tests cho shell permission states; e2e smoke cho direct 403 nếu route sẵn có.

**Dependencies:** Story 1.2. Story 1.5 cung cấp seed data cho demo/nghiệm thu đầy đủ, nhưng không chặn phần PermissionAwareShell, navigation hierarchy và default workspace correction.

### Story 2.2: Executive Dashboard Service DTO Theo Scope

**Requirements Covered:** FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, NFR-001, NFR-002, NFR-007, NFR-011, UX-DR20, UX-DR35.

As a lãnh đạo,
I want dashboard lấy dữ liệu tổng hợp đã lọc quyền từ service,
So that tôi chỉ thấy KPI, risk, approval và deadline thuộc phạm vi của mình.

**Acceptance Criteria:**

AC1:
**Given** service nhận user context và scope hiện tại
**When** tải Dashboard Tổng Quan
**Then** DTO có tổng dự án/cơ hội, trạng thái đỏ/vàng/xanh, KPI điều hành, request chờ duyệt/quá hạn, risk summary, deadline hôm nay và quyết định mới.

AC2:
**Given** người dùng không có quyền xem tài chính nhạy cảm
**When** DTO được tạo
**Then** financial summary trả no-permission state hoặc bị loại bỏ từ service
**And** UI không nhận số liệu tài chính thật.

AC3:
**Given** dashboard có dữ liệu từ project, proposal, risk, decision và meeting
**When** repository ở mock mode hoặc Supabase mode
**Then** service contract trả cùng kiểu domain DTO.

**Files/Modules:** `src/modules/dashboard`, `src/modules/executive`, `src/modules/projects`, `src/modules/proposals`, `src/modules/meetings`, `src/modules/tasks`.

**Test Expectations:** Unit tests cho DTO filtering, financial permission, mock/Supabase repository parity bằng contract tests nếu có adapter.

**Dependencies:** Story 1.2, Story 1.5.

### Story 2.3: Dashboard UI Với KPI Strip, Priority Queue Và Risk Summary

**Requirements Covered:** FR-001, FR-003, FR-004, FR-005, FR-007, FR-008, FR-009, FR-010, FR-011, NFR-011, UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR10, UX-DR11, UX-DR12, UX-DR21, UX-DR22, UX-DR25, UX-DR26, UX-DR27, UX-DR28, UX-DR29, UX-DR30, UX-DR31, UX-DR32, UX-DR35.

As a lãnh đạo,
I want dashboard hiển thị KPI, việc khẩn, approval, risk và quyết định mới theo layout dễ quét,
So that tôi biết nhanh vấn đề quan trọng nhất hôm nay.

**Acceptance Criteria:**

AC1:
**Given** dashboard DTO có dữ liệu hợp lệ
**When** người dùng mở Dashboard Tổng Quan
**Then** UI hiển thị KPI Strip, Priority Queue, Risk Summary/Map, deadline hôm nay và quyết định mới
**And** không hiển thị task vi mô hoặc bản vẽ chi tiết mặc định.

AC2:
**Given** một KPI/risk/approval có nguồn dữ liệu
**When** người dùng chọn item
**Then** hệ thống mở drill-down panel hoặc link detail theo quyền.

AC3:
**Given** mobile viewport dưới 768px
**When** dashboard render
**Then** KPI/risk/approval chuyển sang stacked priority layout hoặc compact list
**And** text tiếng Việt không bị tràn/cắt xấu.

**Files/Modules:** `src/modules/dashboard/components`, `src/modules/executive/components`, `src/components/ui`, `src/components/shared`.

**Test Expectations:** Component tests cho loading/empty/no-permission states; visual/e2e smoke ở desktop và mobile; accessibility checks cho badge/focus.

**Dependencies:** Story 2.1, Story 2.2.

### Story 2.4: Morning Briefing Theo Scope

**Requirements Covered:** FR-013, FR-014, FR-015, FR-085, FR-087, FR-088, FR-090, NFR-001, NFR-009, NFR-010, UX-DR16, UX-DR17, UX-DR33, UX-DR34.

As a Chairman/CEO,
I want Morning Briefing tóm tắt đầu ngày từ dữ liệu trong scope,
So that tôi biết risk lớn, approval quá hạn, việc cần quyết và KPI hôm nay trong 1-2 phút.

**Acceptance Criteria:**

AC1:
**Given** user context có scope hợp lệ
**When** mở Morning Briefing
**Then** hệ thống hiển thị AI Summary draft hoặc summary placeholder, top risk, việc cần quyết hôm nay, KPI hôm nay, approval quá hạn và trạng thái dự án đỏ/vàng/xanh.

AC2:
**Given** người dùng không có quyền xem một project/risk/approval
**When** Morning Briefing được tạo
**Then** dữ liệu đó không xuất hiện trong briefing.

AC3:
**Given** AI summary chưa được người có quyền xác nhận
**When** hiển thị trên briefing
**Then** nội dung được đánh dấu draft/gợi ý.

**Files/Modules:** `src/modules/executive`, `src/modules/dashboard`, `src/modules/ai`, `src/modules/workspaces`.

**Test Expectations:** Unit tests cho scoped briefing DTO; component tests cho draft AI label và empty states.

**Dependencies:** Story 2.2, Story 2.3.

### Story 2.5: Executive Common Center

**Requirements Covered:** FR-016, FR-017, FR-018, FR-019, NFR-001, NFR-002, NFR-011, UX-DR10, UX-DR11, UX-DR12, UX-DR20, UX-DR22.

As a lãnh đạo có quyền,
I want xem Common Center với thông tin chung đã lọc theo permission,
So that các vấn đề nghiêm trọng và thông tin điều hành chung không bị bỏ sót.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền vào Common Center
**When** mở Common Center
**Then** hệ thống hiển thị thông báo mới, quyết định mới, KPI chung, lịch họp, risk tổng, deadline hệ thống, việc vượt ngưỡng và việc quá hạn trong scope.

AC2:
**Given** có risk đỏ/nghiêm trọng hoặc approval quá hạn nghiêm trọng trong scope
**When** Common Center render
**Then** item đó xuất hiện trong priority area với lý do, owner, deadline và action/drill-down theo quyền.

AC3:
**Given** người dùng thiếu quyền xem một thông tin chung
**When** Common Center tải dữ liệu
**Then** service loại bỏ dữ liệu đó trước khi trả UI.

**Files/Modules:** `src/modules/executive`, `src/modules/dashboard`, `src/modules/meetings`, `src/modules/proposals`, `src/modules/tasks`.

**Test Expectations:** Unit tests cho common center filtering; component tests cho priority item, no-permission và drill-down.

**Dependencies:** Story 2.1, Story 2.2.

### Story 2.6: Private Workspace Theo Vai Trò

**Requirements Covered:** FR-020, FR-021, FR-022, FR-023, FR-024, FR-101, NFR-001, NFR-002, NFR-007, UX-DR9, UX-DR18, UX-DR19, UX-DR24, UX-DR33.

As a người dùng Module 1,
I want Private Workspace phản ánh assignment/scope của riêng tôi,
So that Chủ tịch, CEO, Giám đốc dự án, Trưởng bộ phận, Thư ký/Trợ lý và Người xem không nhìn cùng một dashboard.

**Acceptance Criteria:**

AC1:
**Given** các user demo có assignment khác nhau
**When** từng user mở Private Workspace
**Then** workspace hiển thị dự án/cơ hội được giao, approval cần xử lý, risk/blocker, deadline, quyết định gần đây, cuộc họp và KPI trong phạm vi tương ứng.

AC2:
**Given** Thư ký/Trợ lý chỉ được ủy quyền một phần
**When** mở workspace
**Then** họ chỉ thấy lịch lãnh đạo, hồ sơ trình, tài liệu họp, task hỗ trợ, reminder và approval pending trong scope được ủy quyền.

AC3:
**Given** người dùng là Người xem
**When** mở workspace
**Then** action mutation bị ẩn hoặc disabled theo UX permission pattern
**And** direct mutation vẫn bị chặn ở server/service.

**Files/Modules:** `src/modules/workspaces`, `src/modules/executive`, `src/modules/dashboard`, `src/modules/meetings`, `src/modules/proposals`.

**Test Expectations:** Unit tests cho workspace composition per role; component/e2e smoke cho các demo users chính.

**Dependencies:** Story 1.4, Story 1.5, Story 2.2, Story 2.3.

### Story 2.7: Drill-Down, Unauthorized Và Responsive QA Cho Workspace

**Requirements Covered:** FR-011, FR-012, NFR-003, NFR-004, NFR-011, UX-DR14, UX-DR20, UX-DR22, UX-DR24, UX-DR26, UX-DR27, UX-DR28, UX-DR29, UX-DR30, UX-DR31, UX-DR32.

As a lãnh đạo,
I want drill-down từ KPI/risk/approval đến nguồn dữ liệu hoặc bị chặn rõ ràng khi thiếu quyền,
So that tôi có thể kiểm chứng số liệu mà không bị lộ dữ liệu ngoài scope.

**Acceptance Criteria:**

AC1:
**Given** dashboard item có linked records
**When** người dùng mở drill-down
**Then** panel hiển thị title, type, scope, owner, deadline, status, reason, linked records, actions theo quyền và timeline/audit nếu có.

AC2:
**Given** người dùng không có quyền vào record nguồn
**When** truy cập drill-down hoặc URL trực tiếp
**Then** hệ thống trả unauthorized/403 rõ ràng
**And** không trả payload chứa dữ liệu nhạy cảm.

AC3:
**Given** viewport mobile/tablet/desktop
**When** kiểm tra các workspace chính
**Then** side panel chuyển thành sheet trên mobile, table chuyển thành compact list khi cần, focus order và accessible names đạt yêu cầu.

**Files/Modules:** `src/modules/executive/components`, `src/components/shared`, `src/lib/permissions`, `tests/e2e`.

**Test Expectations:** E2E smoke cho drill-down/403; responsive checks ở 360/390/768/1280; accessibility checks cho focus/dialog/sheet.

**Dependencies:** Story 2.3, Story 2.5, Story 2.6.

## Epic 3: Approval Center Trên Proposal/Approval Backbone

Lãnh đạo có thể xem và xử lý approval trong Module 1 qua một Approval Center chung, phân vùng Trục 1/2/3, phân loại request, xử lý approve/reject/return/forward/ask meeting/hold/cancel, áp dụng policy/assignment, lưu history/audit và cảnh báo/escalate quá hạn.

### Story 3.1: Approval Center Scoped Queue Và Axis Tabs

**Requirements Covered:** FR-025, FR-026, FR-027, FR-028, NFR-001, NFR-002, UX-DR11, UX-DR24, UX-DR25.

As a lãnh đạo có quyền duyệt,
I want xem Approval Center theo Trục 1/2/3 và queue ưu tiên,
So that tôi xử lý đúng request trong phạm vi của mình.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền vào Approval Center
**When** mở Approval Center
**Then** hệ thống hiển thị tabs Trục 1, Trục 2, Trục 3
**And** Trục 2/3 có thể là placeholder/mock được gắn nhãn rõ.

AC2:
**Given** Trục 1 có approval trong scope
**When** queue tải dữ liệu
**Then** approval được phân loại theo hồ sơ/văn bản, tài chính/chi, chiến lược, kỹ thuật, pháp lý và họp.

AC3:
**Given** người dùng không có quyền xem một approval
**When** service tạo queue
**Then** approval đó không xuất hiện trong DTO.

**Files/Modules:** `src/modules/proposals`, `src/modules/executive`, `src/app/executive/approvals`, `src/components/shared`.

**Test Expectations:** Unit tests cho scoped approval query/category; component tests cho axis tabs và placeholder Trục 2/3.

**Dependencies:** Story 1.2, Story 1.5.

### Story 3.2: Approval Detail Cho Request Trục 1

**Requirements Covered:** FR-029, FR-030, FR-031, FR-032, FR-033, FR-034, NFR-001, NFR-004, UX-DR14, UX-DR20.

As a người duyệt,
I want xem approval detail với request summary, policy, hồ sơ và context Trục 1,
So that tôi đủ thông tin trước khi quyết định.

**Acceptance Criteria:**

AC1:
**Given** một approval Trục 1 thuộc loại hồ sơ, chi phí, pháp lý, kỹ thuật, chiến lược hoặc họp
**When** mở detail
**Then** hệ thống hiển thị request summary, scope, proposer, amount nếu có, policy áp dụng, attachments, linked project/module và history hiện có.

AC2:
**Given** request có liên kết tới Module 2-5
**When** mở detail
**Then** hệ thống hiển thị link/source ở mức placeholder/read-only nếu module chuyên môn chưa triển khai sâu
**And** không tạo logic chuyên môn sâu ngoài scope Module 1.

AC3:
**Given** người dùng thiếu quyền xem tài chính nhạy cảm
**When** detail có amount nhạy cảm
**Then** amount bị ẩn từ service hoặc trả no-permission state.

**Files/Modules:** `src/modules/proposals`, `src/modules/documents`, `src/modules/projects`, `src/modules/executive/components`.

**Test Expectations:** Unit tests cho detail DTO, sensitive amount permission, linked source placeholder.

**Dependencies:** Story 3.1.

### Story 3.3: Approval Actions Với Validation Và Permission

**Requirements Covered:** FR-035, FR-036, FR-038, FR-039, FR-040, FR-041, NFR-005, UX-DR13, UX-DR21, UX-DR23.

As a người duyệt có thẩm quyền,
I want approve, reject, return, forward/escalate, ask for meeting, hold hoặc cancel approval,
So that request được xử lý đúng policy và có lý do rõ ràng.

**Acceptance Criteria:**

AC1:
**Given** policy/assignment xác định người dùng đủ quyền
**When** người dùng approve approval
**Then** trạng thái được cập nhật
**And** comment là tùy chọn.

AC2:
**Given** người dùng chọn reject hoặc return/request changes
**When** submit form không có lý do
**Then** validation chặn submit và hiển thị lỗi gần field lý do.

AC3:
**Given** người dùng chọn forward/escalate, ask for meeting hoặc hold
**When** submit action
**Then** hệ thống lưu comment nếu có, next assignee/meeting proposal nếu áp dụng và trạng thái phù hợp.

AC4:
**Given** người dùng không đủ quyền duyệt
**When** gọi server action trực tiếp
**Then** service trả permission error và không mutate record.

**Files/Modules:** `src/modules/proposals/actions.ts`, `src/modules/proposals/services`, `src/modules/proposals/validation.ts`, `src/modules/proposals/components`.

**Test Expectations:** Unit tests cho từng action outcome, validation reason, permission block; component tests cho Approval Action Panel.

**Dependencies:** Story 3.2, Story 1.3.

### Story 3.4: Approval History, Version Và Audit

**Requirements Covered:** FR-042, NFR-006, UX-DR15, UX-DR30.

As a lãnh đạo hoặc kiểm soát viên được quyền,
I want xem history/audit của approval,
So that mọi quyết định duyệt có thể truy vết được.

**Acceptance Criteria:**

AC1:
**Given** approval có thay đổi trạng thái
**When** action hoàn tất
**Then** history lưu actor, thời gian, ghi chú, file đính kèm nếu có, trạng thái cũ/mới, version và audit log.

AC2:
**Given** người dùng mở approval detail
**When** xem tab history/audit
**Then** timeline hiển thị các event theo thứ tự thời gian và đọc được bằng keyboard.

AC3:
**Given** người dùng không có quyền xem audit
**When** mở history/audit
**Then** hệ thống chặn hoặc ẩn phần audit theo permission mà không lộ chi tiết event.

**Files/Modules:** `src/modules/proposals`, `src/lib/audit`, `src/components/shared`, `tests/unit/proposal-service.test.ts`.

**Test Expectations:** Unit tests cho audit append/versioning; component tests cho timeline permission state.

**Dependencies:** Story 3.3.

### Story 3.5: Approval Quá Hạn Và Escalation Theo Policy

**Requirements Covered:** FR-043, NFR-006, UX-DR11, UX-DR22.

As a lãnh đạo,
I want approval quá hạn được cảnh báo và escalate theo policy,
So that request quan trọng không bị kẹt.

**Acceptance Criteria:**

AC1:
**Given** approval vượt deadline
**When** Approval Center hoặc dashboard tải dữ liệu
**Then** approval được đánh dấu overdue với severity, reason, owner và next action.

AC2:
**Given** approval quá hạn kéo dài hoặc risk cao
**When** policy escalation được áp dụng
**Then** hệ thống xác định người duyệt, người đề xuất, Thư ký/Trợ lý liên quan và escalation target trong scope.

AC3:
**Given** notification production chưa nằm trong scope
**When** escalation được tính
**Then** hệ thống lưu alert/mock notification hoặc queue item đủ để demo nghiệm thu
**And** ghi audit khi trạng thái/escalation thay đổi.

**Files/Modules:** `src/modules/proposals`, `src/modules/dashboard`, `src/modules/settings`, `src/lib/audit`, `src/lib/notifications`.

**Test Expectations:** Unit tests cho overdue calculation, escalation policy, queue item và audit.

**Dependencies:** Story 3.1, Story 3.3, Story 1.3.

## Epic 4: Decision & Assignment Center

Lãnh đạo có thể ban hành quyết định/chỉ đạo khác biệt với approval, tạo assignment/task từ decision, gán deadline/KPI/ưu tiên, theo dõi trạng thái thực hiện và giữ version/history khi sửa nội dung quan trọng.

### Story 4.1: Decision Record Từ Approval, Meeting Hoặc Độc Lập

**Requirements Covered:** FR-044, FR-045, FR-046, NFR-005, NFR-006.

As a lãnh đạo,
I want tạo quyết định chính thức sau approval, sau meeting hoặc độc lập,
So that chỉ đạo điều hành được ghi nhận riêng với approval.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền tạo quyết định
**When** tạo decision độc lập
**Then** hệ thống lưu title, nội dung, scope, owner, priority, deadline nếu có và linked records nếu có.

AC2:
**Given** approval hoặc meeting có kết quả cần ban hành quyết định
**When** tạo decision từ nguồn đó
**Then** decision liên kết nguồn nhưng vẫn là record riêng.

AC3:
**Given** người dùng thiếu quyền tạo quyết định trong scope
**When** gọi action tạo decision
**Then** service chặn mutation và ghi nhận lỗi permission phù hợp.

**Files/Modules:** `src/modules/executive`, `src/modules/proposals`, `src/modules/meetings`, `src/lib/audit`.

**Test Expectations:** Unit tests cho create decision, linked source, permission block và audit.

**Dependencies:** Story 1.2; liên kết approval/meeting dùng source nếu đã có, nhưng tạo độc lập phải hoạt động trước.

### Story 4.2: Assignment/Task Từ Decision Cho Nhiều Người

**Requirements Covered:** FR-047, FR-048, FR-049, NFR-005, NFR-007.

As a lãnh đạo,
I want một quyết định có thể giao nhiều việc cho nhiều người/phòng ban/dự án,
So that chỉ đạo được chuyển thành hành động theo dõi được.

**Acceptance Criteria:**

AC1:
**Given** decision hợp lệ
**When** lãnh đạo thêm assignments
**Then** hệ thống tạo nhiều task/assignment với assignee, department/project nếu có, deadline, priority, KPI hoặc mô tả việc.

AC2:
**Given** MVP không yêu cầu người nhận xác nhận đã nhận việc
**When** assignment được tạo
**Then** trạng thái ban đầu phản ánh đã giao/chờ xử lý mà không cần bước acknowledge.

AC3:
**Given** assignee ngoài scope của người tạo
**When** submit assignment
**Then** validation hoặc permission service chặn assignment không hợp lệ.

**Files/Modules:** `src/modules/executive`, `src/modules/tasks`, `src/modules/users`, `src/lib/permissions`.

**Test Expectations:** Unit tests cho multi-assignment creation, scope validation và task linkage.

**Dependencies:** Story 4.1.

### Story 4.3: Version/History Khi Sửa Decision Quan Trọng

**Requirements Covered:** FR-050, NFR-006, UX-DR15.

As a lãnh đạo hoặc kiểm soát viên,
I want decision lưu version/history khi sửa deadline, owner, scope, priority, KPI hoặc chỉ đạo bổ sung,
So that thay đổi quan trọng có thể truy vết.

**Acceptance Criteria:**

AC1:
**Given** decision đã tồn tại
**When** sửa field quan trọng
**Then** hệ thống tạo version/history với previous/new value, actor, timestamp và reason nếu có.

AC2:
**Given** sửa nội dung không quan trọng
**When** service cập nhật
**Then** hệ thống vẫn audit mutation nhưng chỉ version hóa theo rule đã định.

AC3:
**Given** người dùng mở decision detail
**When** xem history
**Then** timeline hiển thị version và audit theo thứ tự dễ đọc.

**Files/Modules:** `src/modules/executive/services`, `src/modules/executive/components`, `src/lib/audit`.

**Test Expectations:** Unit tests cho version rules; component tests cho history timeline.

**Dependencies:** Story 4.1.

### Story 4.4: Decision & Assignment Center UI

**Requirements Covered:** FR-051, NFR-001, NFR-011, UX-DR11, UX-DR14, UX-DR15, UX-DR27, UX-DR29.

As a lãnh đạo,
I want xem quyết định mới, giao việc, chỉ đạo ưu tiên, KPI giao xuống, deadline và trạng thái thực hiện,
So that tôi theo dõi được việc đã giao sau quyết định.

**Acceptance Criteria:**

AC1:
**Given** user có decision/assignment trong scope
**When** mở Decision & Assignment Center
**Then** UI hiển thị danh sách quyết định, assignments, owner, deadline, priority, KPI và trạng thái thực hiện.

AC2:
**Given** một decision liên quan approval hoặc meeting
**When** mở detail
**Then** UI hiển thị linked source và timeline/audit.

AC3:
**Given** mobile viewport
**When** xem danh sách decision/assignment
**Then** table chuyển sang compact list hoặc scroll có kiểm soát.

**Files/Modules:** `src/app/executive/decisions`, `src/modules/executive/components`, `src/modules/tasks`, `src/components/shared`.

**Test Expectations:** Component tests cho list/detail/empty/loading; e2e smoke cho create decision -> assignment visible nếu route có sẵn.

**Dependencies:** Story 4.1, Story 4.2, Story 4.3.

## Epic 5: Risk & Alert Center Cho Điều Hành

Lãnh đạo có thể xem risk/blocker theo nhóm, mức độ, màu đỏ/vàng/xanh, lý do, deadline và owner; tạo/cập nhật/đóng risk theo quyền; nhận cảnh báo risk quá hạn/escalation; hệ thống chỉ đưa gợi ý/draft cho risk do AI hoặc rule phát hiện cho tới khi người có quyền xác nhận.

### Story 5.1: Risk Levels, Categories Và Status Suggestion

**Requirements Covered:** FR-052, FR-053, FR-054, FR-055, FR-056, FR-058, FR-059, FR-060, NFR-008.

As a lãnh đạo hoặc quản trị điều hành,
I want risk có level, category và trạng thái đỏ/vàng/xanh được tính từ dữ liệu,
So that dashboard và Risk Center phản ánh mức độ nghiêm trọng nhất quán.

**Acceptance Criteria:**

AC1:
**Given** risk data có mức Thấp, Trung bình, Cao, Nghiêm trọng
**When** service tạo risk DTO
**Then** level được chuẩn hóa và hiển thị bằng label tiếng Việt, không chỉ bằng màu.

AC2:
**Given** risk category cấu hình trong BO Settings
**When** Risk Center tải dữ liệu
**Then** hệ thống dùng category cấu hình được, có fallback seed category mặc định.

AC3:
**Given** project có blocker nghiêm trọng, approval quá hạn, hồ sơ thiếu hoặc risk cao
**When** service tính trạng thái đỏ/vàng/xanh
**Then** trạng thái được gợi ý cùng reason và source data
**And** chưa override nếu chưa có người có quyền xác nhận.

**Files/Modules:** `src/modules/executive`, `src/modules/dashboard`, `src/modules/settings`, `src/lib/permissions`.

**Test Expectations:** Unit tests cho risk level/category, red/yellow/green suggestion rules và fallback config.

**Dependencies:** Story 1.3, Story 2.2.

### Story 5.2: Risk Map Và Drill-Down Matrix

**Requirements Covered:** FR-061, FR-062, FR-067, NFR-001, UX-DR4, UX-DR12, UX-DR14, UX-DR20, UX-DR30.

As a lãnh đạo,
I want xem risk map/heatmap và drill-down tới ma trận khả năng x ảnh hưởng,
So that tôi ưu tiên xử lý risk đúng mức.

**Acceptance Criteria:**

AC1:
**Given** dashboard hoặc Risk Center có risk trong scope
**When** render Risk Map
**Then** UI hiển thị risk theo category, count, severity, affected projects, deadline và owner.

AC2:
**Given** người dùng mở một risk
**When** drill-down
**Then** panel hiển thị likelihood x impact, reason, linked project/module, owner, deadline, next action và audit nếu có.

AC3:
**Given** người dùng không phân biệt màu tốt
**When** xem risk map
**Then** mỗi trạng thái có text/label hoặc tooltip, không phụ thuộc màu.

**Files/Modules:** `src/modules/executive/components`, `src/modules/dashboard/components`, `src/components/shared`.

**Test Expectations:** Component tests cho heatmap labels, drill-down fields, loading/empty states; accessibility check cho color-independent status.

**Dependencies:** Story 5.1.

### Story 5.3: Tạo Và Cập Nhật Risk/Blocker Theo Quyền

**Requirements Covered:** FR-063, FR-069, NFR-005, NFR-006, UX-DR23.

As a người có trách nhiệm trong scope,
I want tạo và cập nhật risk/blocker với dữ liệu bắt buộc,
So that vấn đề điều hành được ghi nhận đầy đủ và có người chịu trách nhiệm.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền tạo risk/blocker trong scope
**When** submit form tạo blocker
**Then** hệ thống yêu cầu title, category, level, reason/description, project/module, owner, deadline, next action, status và audit log.

AC2:
**Given** Thư ký/Trợ lý được ủy quyền
**When** tạo risk trong phạm vi được ủy quyền
**Then** hệ thống cho phép tạo và ghi audit onBehalfOf nếu áp dụng.

AC3:
**Given** người dùng thiếu quyền hoặc ngoài scope
**When** gọi action tạo/cập nhật risk
**Then** service chặn mutation và không tạo record.

**Files/Modules:** `src/modules/executive/actions.ts`, `src/modules/executive/validation.ts`, `src/modules/executive/services`, `src/lib/audit`.

**Test Expectations:** Unit tests cho validation required fields, permission/delegation, audit log.

**Dependencies:** Story 5.1, Story 1.4.

### Story 5.4: Override Và Đóng Risk/Blocker Có Audit

**Requirements Covered:** FR-057, FR-065, FR-066, NFR-005, NFR-006, UX-DR21.

As a lãnh đạo phụ trách,
I want xác nhận/override trạng thái và đóng risk/blocker với lý do,
So that hệ thống không tự quyết định trạng thái quan trọng mà không có trách nhiệm người dùng.

**Acceptance Criteria:**

AC1:
**Given** hệ thống gợi ý trạng thái đỏ/vàng/xanh
**When** người có quyền override trạng thái
**Then** hệ thống bắt buộc nhập lý do và ghi audit log.

AC2:
**Given** risk/blocker mức Cao hoặc Nghiêm trọng
**When** người dùng đóng risk
**Then** service kiểm tra quyền cao hơn hoặc lãnh đạo phụ trách theo policy
**And** chặn nếu không đủ quyền.

AC3:
**Given** risk được đóng hợp lệ
**When** dashboard reload
**Then** risk không còn xuất hiện như blocker mở nhưng vẫn còn trong history/audit.

**Files/Modules:** `src/modules/executive/services`, `src/modules/dashboard`, `src/lib/audit`, `src/lib/permissions`.

**Test Expectations:** Unit tests cho override reason, close permission, audit và dashboard recompute.

**Dependencies:** Story 5.3.

### Story 5.5: Risk Alert, Overdue Escalation Và Draft Suggestions

**Requirements Covered:** FR-064, FR-067, FR-068, FR-085, FR-087, FR-088, FR-089, FR-090, NFR-009, NFR-010, UX-DR16, UX-DR34.

As a lãnh đạo,
I want risk quá hạn và gợi ý risk từ hệ thống/AI chỉ xuất hiện như cảnh báo draft cho tới khi được xác nhận,
So that cảnh báo hữu ích nhưng không tự tạo blocker chính thức.

**Acceptance Criteria:**

AC1:
**Given** risk vượt deadline
**When** Risk Center hoặc dashboard tải dữ liệu
**Then** risk được đánh dấu overdue và có escalation target theo policy nếu áp dụng.

AC2:
**Given** hệ thống hoặc AI phát hiện risk tiềm năng
**When** tạo suggestion
**Then** suggestion ở trạng thái draft/advisory
**And** không tạo blocker chính thức nếu chưa có người có quyền xác nhận.

AC3:
**Given** người có quyền xác nhận draft risk
**When** accept suggestion
**Then** hệ thống tạo risk/blocker chính thức qua service action, kiểm tra permission và ghi audit.

**Files/Modules:** `src/modules/executive`, `src/modules/ai`, `src/modules/dashboard`, `src/lib/audit`.

**Test Expectations:** Unit tests cho overdue calculation, draft suggestion lifecycle, accept permission và audit.

**Dependencies:** Story 5.3, Story 5.4.

## Epic 6: One Meeting Engine Cho Điều Hành

Người có quyền có thể tạo, xem, lọc và theo dõi cuộc họp qua một Meeting System chung với nhiều meeting type, visibility/scope động, external participants, attachments, agenda, minutes, AI summary draft, follow-up actions, related tasks, related approvals, decision tracking và audit.

### Story 6.1: Meeting Engine Types, Scope Và Repository Contract

**Requirements Covered:** FR-070, FR-071, FR-072, FR-074, FR-102, FR-103, FR-104, FR-105, FR-106, FR-107, FR-108, FR-109, FR-118, FR-119, NFR-008, NFR-013.

As a người dùng có quyền tạo/xem họp,
I want một meeting engine chung hỗ trợ nhiều loại họp và scope động,
So that hệ thống không tạo nhiều module họp riêng cứng.

**Acceptance Criteria:**

AC1:
**Given** meeting engine được cấu hình
**When** tạo hoặc đọc meeting
**Then** meeting hỗ trợ types `EXECUTIVE_MEETING`, `EXECUTIVE_OPERATIONAL_MEETING`, `DEPARTMENT_INTERNAL_MEETING`, `PROJECT_MEETING`, `EXTERNAL_PARTNER_MEETING`, `GOVERNMENT_MEETING`.

AC2:
**Given** meeting có scope khác nhau
**When** lưu meeting
**Then** record hỗ trợ organization_id, project_id tùy chọn, multi-project nếu cần, axis_id, department_id, visibility và participant_scope.

AC3:
**Given** repository chạy mock/file-backed hoặc Supabase mode
**When** service gọi list/create/update meeting
**Then** contract domain DTO giống nhau và không lộ DB snake_case ra UI.

**Files/Modules:** `src/modules/meetings/types.ts`, `src/modules/meetings/constants.ts`, `src/modules/meetings/services`, `database/migrations`.

**Test Expectations:** Unit tests cho meeting type/status contract, scope mapping, mock/Supabase repository mapping.

**Dependencies:** Story 1.2.

### Story 6.2: Meeting List, Filters Và Executive Visibility

**Requirements Covered:** FR-110, FR-111, FR-112, FR-113, NFR-001, NFR-013, UX-DR24, UX-DR25, UX-DR29.

As a executive user,
I want xem và lọc meeting trong scope theo type, project, department, visibility, participant, status và thời gian,
So that tôi chỉ thấy cuộc họp liên quan và ưu tiên.

**Acceptance Criteria:**

AC1:
**Given** người dùng executive có scope hợp lệ
**When** mở Meeting Center
**Then** chỉ meeting trong scope xuất hiện, gồm họp quan trọng, họp chiến lược, họp risk cao và họp có follow-up quá hạn.

AC2:
**Given** người dùng thuộc department workspace
**When** mở danh sách họp
**Then** chỉ meeting thuộc scope phòng ban/người dùng xuất hiện.

AC3:
**Given** filter được áp dụng
**When** người dùng lọc theo meeting_type, organization, project, axis, department, visibility, participant, status hoặc thời gian
**Then** danh sách cập nhật và active filters hiển thị rõ.

**Files/Modules:** `src/app/(dashboard)/meetings`, `src/modules/meetings/components`, `src/modules/meetings/services`.

**Test Expectations:** Unit tests cho visibility/filter service; component tests cho filter UI và empty states.

**Dependencies:** Story 6.1.

### Story 6.3: Tạo Và Sửa Meeting Với Related Records

**Requirements Covered:** FR-073, FR-075, FR-114, NFR-005, NFR-006, UX-DR23.

As a người có quyền tạo họp,
I want tạo/sửa meeting với participants, external participants và related records,
So that cuộc họp liên kết đúng project, approval, risk, decision, task hoặc hồ sơ.

**Acceptance Criteria:**

AC1:
**Given** người dùng có quyền tạo họp trong scope
**When** submit meeting form
**Then** hệ thống lưu title, meeting_type, host, participants, external_participants, start/end time, agenda, visibility, scope và status hợp lệ.

AC2:
**Given** meeting liên quan approval, risk, decision, task hoặc document
**When** người dùng chọn related records
**Then** service lưu liên kết qua service contract tương ứng, không gọi repository module khác trực tiếp từ component.

AC3:
**Given** quản lý phòng họp/booking chưa nằm trong MVP
**When** form hiển thị room_id
**Then** trường này được xử lý như placeholder/mock và không chặn tạo meeting.

**Files/Modules:** `src/modules/meetings/actions.ts`, `src/modules/meetings/validation.ts`, `src/modules/meetings/components/meeting-form.tsx`, `src/modules/proposals`, `src/modules/executive`.

**Test Expectations:** Unit tests cho validation, permission, related records; component tests cho create/edit form.

**Dependencies:** Story 6.1, Story 6.2.

### Story 6.4: Minutes, Attachments Và AI Summary Draft

**Requirements Covered:** FR-076, FR-077, FR-108, FR-117, NFR-006, NFR-009, NFR-010, UX-DR16, UX-DR34.

As a meeting host hoặc người được quyền,
I want upload tài liệu, cập nhật biên bản và dùng AI summary draft,
So that meeting có hồ sơ đầy đủ nhưng biên bản chính thức vẫn cần duyệt.

**Acceptance Criteria:**

AC1:
**Given** meeting đã tồn tại
**When** người dùng upload attachment hoặc cập nhật minutes
**Then** hệ thống lưu thay đổi và ghi audit.

AC2:
**Given** AI tạo meeting summary
**When** summary hiển thị
**Then** summary luôn có trạng thái draft/gợi ý cho tới khi người có quyền approve.

AC3:
**Given** người dùng có quyền approve biên bản
**When** approve official minutes hoặc AI summary
**Then** trạng thái được cập nhật và audit log ghi actor/time/previous/new state.

**Files/Modules:** `src/modules/meetings`, `src/modules/ai`, `src/lib/storage`, `src/lib/audit`.

**Test Expectations:** Unit tests cho minutes/status/audit; component tests cho draft label và approve action.

**Dependencies:** Story 6.3.

### Story 6.5: Follow-Up Actions Liên Kết Related Tasks

**Requirements Covered:** FR-078, FR-115, NFR-005, NFR-006.

As a meeting host,
I want tạo follow-up actions sau họp và liên kết chúng với tasks,
So that action items sau họp được theo dõi như công việc.

**Acceptance Criteria:**

AC1:
**Given** meeting đã hoàn tất hoặc đang follow-up
**When** tạo follow-up action
**Then** hệ thống lưu action với owner, deadline, status và related meeting.

AC2:
**Given** follow-up action cần theo dõi như task
**When** người dùng chọn tạo related task
**Then** service tạo task qua task service contract và liên kết `related_tasks`.

AC3:
**Given** follow-up task quá hạn
**When** executive dashboard hoặc meeting detail tải dữ liệu
**Then** item xuất hiện trong priority/overdue context theo quyền.

**Files/Modules:** `src/modules/meetings`, `src/modules/tasks`, `src/modules/dashboard`, `src/lib/audit`.

**Test Expectations:** Unit tests cho follow-up lifecycle, task linkage và overdue integration.

**Dependencies:** Story 6.3.

### Story 6.6: Decision Tracking Sau Họp

**Requirements Covered:** FR-079, FR-116, FR-117, NFR-006, UX-DR15.

As a lãnh đạo hoặc host cuộc họp,
I want meeting liên kết decisions và trạng thái thực hiện sau họp,
So that quyết định sau họp được theo dõi trong Decision & Assignment Center.

**Acceptance Criteria:**

AC1:
**Given** meeting có decision được ghi nhận
**When** người dùng liên kết hoặc tạo decision từ meeting
**Then** hệ thống lưu relation giữa meeting và decision.

AC2:
**Given** decision sau họp có assignments
**When** mở meeting detail
**Then** UI hiển thị decision liên quan, trạng thái thực hiện và audit.

AC3:
**Given** meeting update decision tracking
**When** mutation hoàn tất
**Then** audit log ghi thay đổi tracking và actor.

**Files/Modules:** `src/modules/meetings`, `src/modules/executive`, `src/modules/tasks`, `src/lib/audit`.

**Test Expectations:** Unit tests cho meeting-decision linkage; component tests cho decision tracking panel.

**Dependencies:** Story 4.1, Story 6.3.

## Epic 7: History, Archive, Export Và Audit Visibility

Người có quyền có thể tra cứu lịch sử điều hành, approval, decision, assignment, meeting, audit log, version hồ sơ, timeline và export theo permission; dữ liệu nhạy cảm hoặc export quan trọng luôn bị kiểm soát và ghi audit.

### Story 7.1: History & Archive Center Service

**Requirements Covered:** FR-080, FR-081, NFR-001, NFR-004, NFR-006.

As a lãnh đạo hoặc người kiểm soát được quyền,
I want xem lịch sử điều hành từ nhiều loại record,
So that tôi truy vết được decision, approval, assignment, meeting và audit.

**Acceptance Criteria:**

AC1:
**Given** user context và scope hợp lệ
**When** History & Archive service tải timeline
**Then** DTO gồm decision, approval, assignment, meeting, audit log, version hồ sơ và search history nếu có trong scope.

AC2:
**Given** user không có quyền xem audit hoặc record cụ thể
**When** service tạo timeline
**Then** event ngoài quyền bị loại bỏ trước khi trả UI.

AC3:
**Given** dữ liệu đến từ nhiều module
**When** timeline được sắp xếp
**Then** event có type, actor, timestamp, scope, summary và link nguồn nhất quán.

**Files/Modules:** `src/modules/executive`, `src/modules/reports`, `src/lib/audit`, `src/modules/proposals`, `src/modules/meetings`.

**Test Expectations:** Unit tests cho event aggregation, scope filtering và ordering.

**Dependencies:** Story 3.4, Story 4.3, Story 6.4.

### Story 7.2: Search, Filter Và Timeline UI

**Requirements Covered:** FR-082, UX-DR15, UX-DR25, UX-DR27, UX-DR29, UX-DR30.

As a người dùng được quyền,
I want search/filter history theo project, module, actor, type, status và thời gian,
So that tôi tìm nhanh thay đổi điều hành cần kiểm tra.

**Acceptance Criteria:**

AC1:
**Given** History Center có event timeline
**When** người dùng search theo tên project, approval, hồ sơ, owner hoặc mã record
**Then** danh sách lọc đúng và hiển thị active filters.

AC2:
**Given** người dùng lọc theo type/status/severity/module/scope/time
**When** filter thay đổi
**Then** timeline cập nhật không mất context.

AC3:
**Given** mobile viewport
**When** timeline render
**Then** event hiển thị dạng list compact với focus order hợp lý.

**Files/Modules:** `src/app/executive/history`, `src/modules/reports/components`, `src/components/shared`.

**Test Expectations:** Component tests cho search/filter/empty; accessibility checks cho timeline DOM order.

**Dependencies:** Story 7.1.

### Story 7.3: Export Theo Permission Và Audit

**Requirements Covered:** FR-083, FR-084, NFR-005, NFR-006, NFR-012.

As a người dùng có quyền xuất dữ liệu,
I want export dashboard, approval history hoặc audit log theo permission,
So that dữ liệu điều hành được chia sẻ có kiểm soát.

**Acceptance Criteria:**

AC1:
**Given** người dùng có permission `Xuất dữ liệu`
**When** export dashboard, audit log hoặc approval history
**Then** hệ thống tạo export chỉ chứa dữ liệu trong scope và ghi audit log.

AC2:
**Given** export chứa dữ liệu nhạy cảm
**When** người dùng thiếu permission nhạy cảm riêng
**Then** hệ thống chặn export hoặc loại bỏ field nhạy cảm từ service.

AC3:
**Given** người dùng không có quyền export
**When** gọi action export trực tiếp
**Then** service trả permission error và không tạo file/export payload.

**Files/Modules:** `src/modules/reports`, `src/modules/dashboard`, `src/modules/proposals`, `src/lib/audit`, `src/lib/permissions`.

**Test Expectations:** Unit tests cho export permission, sensitive data filtering và audit on export.

**Dependencies:** Story 7.1.

### Story 7.4: History/Export States Và QA Nghiệm Thu

**Requirements Covered:** FR-080, FR-082, FR-083, FR-084, NFR-004, UX-DR22, UX-DR26, UX-DR30, UX-DR31, UX-DR32.

As a product owner,
I want History/Archive/Export có loading, empty, error, unauthorized và responsive states,
So that nghiệm thu Module 1 bao phủ traceability và permission.

**Acceptance Criteria:**

AC1:
**Given** History Center không có event trong scope
**When** render empty state
**Then** UI nói rõ không có dữ liệu trong scope hoặc do filter.

AC2:
**Given** service lỗi tạm thời
**When** UI hiển thị error state
**Then** có retry hoặc link quay về workspace phù hợp.

AC3:
**Given** người dùng thiếu quyền xem/export
**When** mở history/export action
**Then** unauthorized state rõ ràng và không lộ dữ liệu.

**Files/Modules:** `src/modules/reports/components`, `src/components/shared`, `tests/e2e`.

**Test Expectations:** Component tests cho loading/empty/error/unauthorized; e2e smoke cho export blocked/allowed.

**Dependencies:** Story 7.2, Story 7.3.

## Epic 8: Executive AI Advisory

Lãnh đạo có thể dùng AI Summary, AI Meeting Summary và AI Approval Assistant ở mức advisory trong đúng context và permission; AI chỉ đọc/tóm tắt/gợi ý từ dữ liệu được phép, output là draft/gợi ý, các năng lực AI nâng cao để phase sau hoặc mock/placeholder.

### Story 8.1: AI Gateway Với Permission Context Và Citation

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

### Story 8.2: Executive AI Summary Draft Trong Workspace

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

### Story 8.3: AI Approval Assistant Với Action Proposal

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

### Story 8.4: AI Meeting Summary Và Future AI Placeholders

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
