---
title: "Truc 1 - Requirement, BRD and Architecture Draft"
type: "planning-artifact"
created: "2026-05-23"
status: "draft-for-owner-edit"
owner_edit_expected: true
canonical_update_required_after_approval: true
sources:
  - "../../docs/BMAD_DOCUMENTATION_MAP.md"
  - "../../requirement.md"
  - "../../design.md"
  - "../../architecture.md"
  - "../../blueprint/01-domain-blueprint.md"
  - "../../blueprint/07-platform-requirements.md"
  - "../../blueprint/08-api-contract.md"
  - "../../blueprint/09-data-model.md"
  - "../../blueprint/12-auth-roles-permissions.md"
  - "../../blueprint/13-role-workspaces.md"
  - "../implementation-artifacts/spec-command-center-unification.md"
---

# Trục 1 - Requirement, BRD and Architecture Draft

## 1. Mục Đích Tài Liệu

Tài liệu này tổng hợp hiện trạng Requirement, BRD và Architecture cho **Trục 1 - BuildFlow hình thành dự án** để chủ dự án bổ sung, sửa đổi trước khi cập nhật tài liệu canonical.

Theo chuẩn BMad-compatible của dự án:

- Bản này là planning artifact, chưa phải source of truth cuối cùng.
- Sau khi được duyệt, phần thay đổi dài hạn cần được promote vào `blueprint/` hoặc `docs/`.
- Root files như `requirement.md`, `design.md`, `architecture.md`, `milestone.md` chỉ được xem là snapshot MVP, không phải nguồn dài hạn duy nhất.

## 2. Tóm Tắt Điều Hành

Trục 1 quản lý giai đoạn hình thành dự án bất động sản/nhà ở từ ý tưởng đầu tư, tìm kiếm quỹ đất, kiểm tra pháp lý - quy hoạch - thiết kế sơ bộ, đến trình duyệt nội bộ và các thủ tục pháp lý trước xây dựng.

Mục tiêu sản phẩm không phải tạo một menu phẳng gồm nhiều bước pháp lý, mà là tổ chức công việc hình thành dự án theo 5 nhóm nghiệp vụ:

1. Ban lãnh đạo.
2. Tìm kiếm & phát triển dự án.
3. Pháp lý.
4. Thiết kế - Quy hoạch - Kỹ thuật - BIM.
5. Đề xuất - Họp - Phê duyệt nội bộ.

Hiện trạng triển khai:

- `/command-center` là bề mặt điều hành chính cho lãnh đạo và các view tổng hợp.
- `/axis-1` đã được redirect về `/command-center?view=axis1-search-development`.
- Axis 1 có module dữ liệu mock/structured riêng trong `src/modules/axis-1`.
- Legal Checklist Lite đã giữ đúng 12 bước cũ của Trục 1.
- Các module sâu như Legal V2, Investment Workspace, Design/Planning/BIM V2 và proposal approval configurable flow chưa nên mở rộng sâu nếu chưa có scope duyệt.

## 3. Requirement Summary

### 3.1 Product Goal

Trục 1 phải giúp doanh nghiệp:

- Theo dõi toàn bộ giai đoạn hình thành dự án từ cơ hội đầu tư đến sẵn sàng xin phép/xây dựng.
- Biết dự án đang kẹt ở đâu: quỹ đất, quy hoạch, pháp lý, hồ sơ, tài chính sơ bộ, thiết kế hay phê duyệt nội bộ.
- Giữ dấu vết quyết định của lãnh đạo và các phê duyệt nội bộ.
- Kết nối checklist pháp lý, hồ sơ, task, meeting, proposal và dashboard vào một nguồn dữ liệu có thể audit.
- Chuẩn bị nền tảng cho AI hỗ trợ phân tích rủi ro, thiếu hồ sơ, tóm tắt trạng thái và gợi ý việc cần xử lý.

### 3.2 Core Scope

Trục 1 gồm 5 nhóm nghiệp vụ.

| Nhóm | Mục tiêu | Trạng thái hiện tại |
| --- | --- | --- |
| Ban lãnh đạo | Xem tổng quan, duyệt/chỉ đạo, theo dõi quyết định và rủi ro cấp lãnh đạo | Đã gom vào Command Center |
| Tìm kiếm & phát triển dự án | Quản lý cơ hội, quỹ đất, tiền khả thi, năng lực chủ đầu tư | Có Axis 1 mock/structured dashboard; chưa là module sản xuất đầy đủ |
| Pháp lý | Theo dõi 12 bước cũ, hồ sơ, blocker, phản hồi cơ quan | Legal Checklist Lite đã có |
| Thiết kế - Quy hoạch - Kỹ thuật - BIM | Theo dõi quy hoạch, thiết kế cơ sở, chỉ tiêu kỹ thuật, hồ sơ BIM/thiết kế | Có hướng domain; chưa build sâu |
| Đề xuất - Họp - Phê duyệt nội bộ | Quản lý proposal, họp, quyết định, approve/request change/reject | Proposal foundation đã có; approval flow configurable còn gap |

### 3.3 Legacy 12-Step Workflow

12 bước cũ của Trục 1 được giữ làm checklist/workflow item, không trở thành 12 menu độc lập.

| # | Bước cũ | Nhóm chính | Ghi chú |
| --- | --- | --- | --- |
| 1 | Khảo sát quỹ đất | Tìm kiếm & phát triển dự án | Dữ liệu quỹ đất, khảo sát, hiện trạng |
| 2 | Phân tích quy hoạch | Thiết kế - Quy hoạch - Kỹ thuật - BIM | Chỉ tiêu quy hoạch, khả năng phát triển |
| 3 | Hồ sơ đề xuất đầu tư | Tìm kiếm & phát triển dự án; Đề xuất - Họp - Phê duyệt nội bộ | Có thể đi qua proposal/approval |
| 4 | Chủ trương đầu tư | Pháp lý; Ban lãnh đạo | Thủ tục bên ngoài và quyết định nội bộ cần tách rõ |
| 5 | Quy hoạch chi tiết 1/500 | Thiết kế - Quy hoạch - Kỹ thuật - BIM; Pháp lý | Hồ sơ kỹ thuật và theo dõi nộp/phản hồi |
| 6 | Thiết kế cơ sở | Thiết kế - Quy hoạch - Kỹ thuật - BIM | Gói thiết kế nền cho FS |
| 7 | Báo cáo nghiên cứu khả thi | Thiết kế - Quy hoạch - Kỹ thuật - BIM; Tìm kiếm & phát triển dự án | Kết nối hiệu quả đầu tư và kỹ thuật |
| 8 | Đánh giá môi trường | Pháp lý | Theo dõi hồ sơ, nộp, phản hồi |
| 9 | PCCC | Pháp lý; Thiết kế - Quy hoạch - Kỹ thuật - BIM | Legal procedure có evidence kỹ thuật |
| 10 | Giao đất/thuê đất | Pháp lý | Thủ tục đất đai, nghĩa vụ tài chính liên quan |
| 11 | Chấp nhận chủ đầu tư | Pháp lý | Năng lực, hồ sơ chủ đầu tư, quyết định chấp thuận |
| 12 | Giấy phép xây dựng | Pháp lý | Điều kiện chốt trước thi công |

### 3.4 Functional Requirements

#### Project Formation

- User có quyền được tạo dự án/cơ hội dự án với thông tin cơ bản: mã, tên, địa điểm, diện tích, loại hình, chủ đầu tư, owner, trạng thái.
- Nếu chưa nhập mã dự án, hệ thống tự sinh mã.
- Khi tạo dự án, hệ thống tự khởi tạo checklist pháp lý mặc định gồm đúng 12 bước.
- Dự án là entity trung tâm để liên kết task, document, legal step, meeting, proposal, report và dashboard.

#### Axis 1 Dashboard

- Hiển thị số stage/công đoạn Trục 1.
- Hiển thị tỷ lệ hoàn thành, số hồ sơ thiếu, số task mở, số stage blocked, số stage rủi ro cao.
- Hiển thị danh sách stage theo trạng thái, deadline, owner, risk level.
- Hiển thị missing documents, open tasks và risk alerts.
- `/axis-1` không còn là bề mặt độc lập chính; route này redirect về Command Center.

#### Legal Checklist Lite

- Checklist phải có đủ 12 bước cũ.
- Mỗi legal step có: status, assignee, due date, completed date, notes, related document ids.
- Status tối thiểu: `not_started`, `in_progress`, `waiting_authority`, `done`, `blocked`.
- Nếu status là `blocked`, notes là bắt buộc.
- Legal step update phải kiểm tra permission server-side.
- Dashboard/report phải phản ánh blocked và waiting authority legal steps.

#### Documents and Evidence

- Hồ sơ có thể là file hoặc external URL trong giai đoạn đầu.
- Hồ sơ có project, type, version, status, owner.
- Hồ sơ có thể liên kết với legal step, task, meeting, proposal hoặc report.
- Hệ thống cần phát hiện hồ sơ thiếu/cần bổ sung để feed dashboard.
- Future: private storage/signed URL, version history và document approval flow.

#### Tasks and Accountability

- Task phải gắn với project.
- Task có owner/assignee, due date, status, priority, category.
- Task có thể link tới legal step, document, proposal, meeting hoặc risk.
- Quyết định họp, legal blocker, missing document hoặc AI proposal có thể tạo follow-up task.

#### Internal Proposal and Approval

- Proposal là workflow duyệt nội bộ dùng chung cho investment, legal, document, finance, contract, design, construction, HR, QA/QC, safety.
- Proposal có trạng thái: draft, submitted, in review, change requested, approved, rejected, archived.
- Proposal có comment, attachment, linked records và decision history.
- Approval không trực tiếp mutate record liên kết nếu không đi qua domain service tương ứng.
- AI có thể review completeness/risk/route suggestion nhưng không được approve/reject hoặc bỏ qua step.

#### Reporting and Executive View

- Command Center là bề mặt lãnh đạo chính.
- Lãnh đạo xem portfolio health, blocked legal, overdue work, budget/risk exposure, decisions awaiting approval.
- Trục 1 cần feed vào report snapshots và executive dashboard.
- Không hardcode KPI trong component; số liệu phải đi qua service/repository.

#### AI Support

- AI chỉ được đọc dữ liệu mà user có quyền.
- AI được phép tóm tắt, cảnh báo thiếu hồ sơ, gợi ý task, gợi ý route approval.
- AI không được đưa kết luận pháp lý/tài chính cuối cùng.
- AI không được mutate dữ liệu nếu chưa có user confirmation và domain permission.
- Legal/finance/design/construction quality nội dung cần citations hoặc trả lời thiếu dữ liệu.

### 3.5 Non-Functional Requirements

- Authenticated access cho app routes.
- Mutation phải có server-side permission checks.
- Permission dùng key tập trung, không hardcode role trong UI.
- Dữ liệu quan trọng phải audit được.
- Status/role/step code dùng stable keys; UI dùng label tiếng Việt.
- Dashboard và reports phải derive từ structured data.
- Module boundary phải đủ sạch để sau này chuyển từ mock sang Supabase/PostgreSQL.
- Sensitive legal/finance/document data cần chuẩn bị private storage và least-privilege access.

### 3.6 Out of Scope Until Explicitly Scheduled

- Tách 12 bước Trục 1 thành 12 route/menu độc lập.
- Xóa hoặc thay Legal Checklist Lite hiện có.
- Build sâu Legal V2, Investment Development, Design/Planning/BIM V2 nếu chưa có scope.
- Configurable approval routing đầy đủ theo amount/risk threshold nếu chưa có story riêng.
- AI pháp lý/tài chính có quyền quyết định cuối cùng.
- Production storage/upload/download hoàn chỉnh nếu chưa qua Supabase validation.

### 3.7 Acceptance Criteria Draft

- Khi tạo project, hệ thống tạo đúng 12 legal steps mặc định.
- Khi user mở `/axis-1`, hệ thống đưa user về `/command-center?view=axis1-search-development`.
- Command Center hiển thị được Axis 1 summary, stages, missing documents, open tasks và risk alerts.
- Legal user có thể cập nhật legal step; blocked status bắt buộc notes.
- Dashboard/report thay đổi khi task/document/legal step thay đổi.
- User không có quyền không thấy hoặc không mutate được dữ liệu Trục 1.
- Proposal approval action phải tạo decision history và audit trail.
- AI output chỉ là advisory và không bypass RBAC.

## 4. BRD Draft

### 4.1 Business Problem

Giai đoạn hình thành dự án thường bị phân mảnh giữa lãnh đạo, đầu tư phát triển, pháp lý, quy hoạch, thiết kế, tài chính và thư ký/PMO. Thông tin nằm ở nhiều file, chat, email, meeting notes và checklist thủ công, dẫn đến:

- Không biết dự án đang kẹt ở thủ tục nào.
- Không biết hồ sơ nào thiếu hoặc đang chờ cơ quan.
- Không rõ ai đang chịu trách nhiệm.
- Khó truy lại quyết định lãnh đạo và lịch sử phê duyệt.
- Khó so sánh nhiều cơ hội đầu tư hoặc dự án đang hình thành.
- AI không thể hỗ trợ tốt vì dữ liệu chưa có cấu trúc và chưa được quản trị.

### 4.2 Business Objectives

- Chuẩn hóa quy trình hình thành dự án thành một workflow có thể theo dõi.
- Giảm rủi ro bỏ sót hồ sơ, thủ tục hoặc deadline.
- Tăng tốc ra quyết định đầu tư nhờ executive dashboard và proposal workflow.
- Tạo audit trail cho các quyết định, phê duyệt, blocker và thay đổi trạng thái.
- Làm nền cho AI hỗ trợ phân tích rủi ro, tóm tắt dự án và đề xuất việc tiếp theo.

### 4.3 Stakeholders

| Stakeholder | Nhu cầu chính |
| --- | --- |
| Tổng giám đốc / Chủ đầu tư | Xem rủi ro, quyết định, phê duyệt, định hướng đầu tư |
| Phó tổng giám đốc | Theo dõi portfolio/scope được giao, xử lý escalations |
| Đầu tư phát triển | Quản lý cơ hội, quỹ đất, tiền khả thi, proposal đầu tư |
| Giám đốc dự án / PM | Theo dõi project health, task, legal progress, documents |
| Pháp lý | Quản lý checklist, hồ sơ pháp lý, blocker, phản hồi cơ quan |
| Thiết kế / Quy hoạch / Kỹ thuật | Quản lý chỉ tiêu quy hoạch, thiết kế cơ sở, hồ sơ kỹ thuật |
| Tài chính / Quản lý tài chính | Đánh giá tiền khả thi, nghĩa vụ tài chính, hiệu quả đầu tư |
| Thư ký / Trợ lý | Nhập liệu, chuẩn hóa hồ sơ, ghi meeting/action item, chuẩn bị báo cáo |
| Kiểm soát / Kiểm toán nội bộ | Đọc audit trail, kiểm tra phê duyệt và compliance |

### 4.4 Business Process Draft

```text
Ý tưởng/cơ hội dự án
  -> Hồ sơ quỹ đất
  -> Kiểm tra quy hoạch
  -> Phân tích tiền khả thi
  -> Hồ sơ năng lực/chủ đầu tư
  -> Proposal/meeting/approval nội bộ
  -> Chủ trương đầu tư
  -> Quy hoạch 1/500
  -> Thiết kế cơ sở
  -> Báo cáo nghiên cứu khả thi
  -> Môi trường/PCCC/đất đai/chấp thuận CĐT
  -> Giấy phép xây dựng
  -> Chuyển sang Trục 2 thi công
```

Các bước thực tế có thể chạy song song, nhưng hệ thống cần giữ dependency, blocker và evidence rõ ràng.

### 4.5 Business Capabilities

#### Capability 1 - Executive Command

- Portfolio and project formation overview.
- Approval queue.
- Directives and decision log.
- AI leadership summary.
- Risk/escalation view.

#### Capability 2 - Opportunity and Land Development

- Opportunity/project idea capture.
- Land bank dossier.
- Land/site survey.
- Early market and product hypothesis.
- Pre-feasibility analysis.
- Investment proposal preparation.

#### Capability 3 - Legal Readiness

- Configurable legal checklist.
- Legal step status and owner.
- Authority submission/response tracking.
- Legal blocker and risk tracking.
- Legal document linkage.

#### Capability 4 - Planning, Design and Technical Readiness

- Planning indicator checks.
- 1/500 planning package.
- Basic design package.
- Feasibility study inputs.
- Technical/BIM evidence linkage.

#### Capability 5 - Internal Proposal, Meeting and Approval

- Proposal creation.
- Internal comments.
- Attachments/evidence.
- Approval/change request/reject.
- Decision history and audit.
- AI preliminary review.

### 4.6 Business Rules

- Dự án là trung tâm dữ liệu; operational records phải link tới project nếu không phải cấu hình global.
- 12 bước cũ của Trục 1 được giữ làm workflow item, không tạo 12 menu độc lập.
- Legal blocker phải có notes.
- Proposal approval không tự động thay đổi record nghiệp vụ nếu không đi qua domain service.
- AI không có quyền quyết định cuối cùng.
- Role/permission quyết định dữ liệu được xem và action được thực hiện.
- Mọi decision quan trọng cần lưu lịch sử người quyết định, thời điểm và ghi chú.

### 4.7 Business KPIs

- Số dự án/cơ hội đang ở từng stage Trục 1.
- Tỷ lệ hoàn thành Trục 1 theo dự án.
- Số legal steps blocked/waiting authority.
- Số hồ sơ thiếu/cần bổ sung.
- Số task quá hạn trong giai đoạn hình thành dự án.
- Số proposal đang chờ duyệt/change requested.
- Thời gian trung bình từ cơ hội đến proposal đầu tư.
- Thời gian trung bình từ proposal đến approval.
- Số quyết định/phê duyệt có đủ evidence/audit trail.

### 4.8 Business Risks

| Risk | Impact | Control |
| --- | --- | --- |
| Khách hàng liên tục đổi requirement | Scope drift, tài liệu mâu thuẫn | Mọi thay đổi đi qua BMad artifact trước |
| 12 bước cũ bị biến thành menu rời rạc | UX rối, khó mở rộng | Giữ 5 nhóm chính, 12 bước là checklist |
| Legal và internal approval bị trộn lẫn | Sai nghiệp vụ và audit | Tách external legal procedure với internal proposal/approval |
| AI trả lời như nguồn pháp lý chính thức | High-impact error | Approved knowledge, citations, no final legal conclusions |
| Dashboard hardcode số liệu | Sai trạng thái điều hành | Service/repository-derived metrics |
| Quyền truy cập quá rộng | Lộ legal/finance/project data | Permission keys, scope filters, server-side checks |

## 5. Architecture Draft

### 5.1 Architecture Principles

- Modular monolith first.
- Project-centric data model.
- Service layer before repository/database access.
- Permission checks centralized by action key.
- UI renders from typed DTOs, not scattered business logic.
- Mock/local repository must remain swappable with Supabase/PostgreSQL.
- BMad artifacts capture change intent; canonical docs capture accepted direction.

### 5.2 Current Route and Surface Model

| Surface | Current behavior |
| --- | --- |
| `/command-center` | Canonical leadership/operations surface |
| `/command-center?view=executive-dashboard` | Executive Command Center |
| `/command-center?view=axis1-search-development` | Axis 1 search/development view |
| `/axis-1` | Redirects to Command Center Axis 1 view |
| `/axis-1/[stageId]` | Stage detail exists behind `axis1.view` permission |
| `/legal` | Legal Checklist Lite |
| `/proposals` | Shared internal proposal workflow |
| `/design-workspace` | Design workspace direction/surface |
| `/investment-workspace` | Investment role workspace, not yet full Axis 1 engine |

### 5.3 Module Map

| Module | Responsibility |
| --- | --- |
| `src/modules/command-center` | Aggregate executive, operations dashboard and Axis 1 data |
| `src/modules/axis-1` | Axis 1 stage model, mock data, dashboard/stage detail components |
| `src/modules/projects` | Project lifecycle and legal checklist initialization |
| `src/modules/legal` | Legal steps list/update/repository and validation |
| `src/modules/documents` | Document metadata, requirements and readiness |
| `src/modules/tasks` | Task execution and accountability |
| `src/modules/proposals` | Internal proposal and approval foundation |
| `src/modules/executive` | Executive dashboard, approvals, directives, decision log |
| `src/modules/dashboard` | KPI and operational dashboard derived from structured records |
| `src/modules/reports` | Report snapshots from project/task/document/legal/meeting data |
| `src/lib/permissions` | Permission keys, scope filters and navigation |

### 5.4 Data Model

#### Core implemented/foundation entities

- `projects`
- `tasks`
- `documents`
- `legal_steps`
- `meetings`
- `decisions`
- `proposals`
- `proposal_steps`
- `proposal_comments`
- `proposal_attachments`
- `proposal_links`
- `proposal_decisions`
- `audit_logs`

#### Future/scalable entities

- `investment_opportunities`
- `legal_checklist_templates`
- `legal_step_templates`
- `legal_step_dependencies`
- `legal_submissions`
- `authority_responses`
- `legal_risks`
- `design_packages`
- `drawings`
- `design_reviews`
- `risks`
- relation table such as `legal_step_documents`

### 5.5 Legal Step Contract

Current legal step type:

```ts
type LegalStep = {
  id: EntityId;
  projectId: EntityId;
  stepCode: LegalStepCode;
  stepName: string;
  status: LegalStatus;
  assigneeId?: EntityId;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
  relatedDocumentIds?: EntityId[];
};
```

Default legal steps are centralized in `src/constants/legal-steps.ts`.

### 5.6 Axis 1 Stage Contract

Current Axis 1 dashboard/stage data uses:

```ts
type AxisOneDevelopmentStage = {
  id: string;
  code: string;
  title: string;
  shortTitle: string;
  projectId: string;
  projectName: string;
  objective: string;
  description: string;
  status: AxisOneStageStatus;
  progress: number;
  responsiblePerson: string;
  responsibleRole: string;
  deadline: string;
  riskLevel: AxisOneRiskLevel;
  requiredDocuments: AxisOneRequiredDocument[];
  inputData: string[];
  outputData: string[];
  tasks: AxisOneTask[];
};
```

Architecture gap: Axis 1 stages currently use structured mock data and are not fully normalized into production tables. A future approved story should decide whether stages become:

- derived projections from project/legal/document/task/proposal data,
- their own `axis1_stages` table,
- or configurable workflow templates.

Recommendation: derive from domain records where possible; add stage/workflow tables only when configuration and dependencies become explicit requirements.

### 5.7 API and Service Contracts

Current/foundation contracts:

- `POST /projects`: creates project, generates code if missing, initializes default legal checklist, audits creation.
- `GET /projects/:projectId/legal-steps`: returns project legal checklist.
- `PATCH /legal-steps/:stepId`: updates status, assignee, dates, notes, related documents; blocked requires notes.
- `POST /projects/:projectId/legal-steps/reinitialize`: admin-only reinitialize missing legal steps without duplicates.
- `GET /proposals`: list proposals by project/type/status/owner/requester.
- Proposal actions: submit, request change, approve, reject.

Service-level contracts:

- `initializeLegalChecklist(projectId)`
- `listLegalSteps(filters)`
- `updateLegalStep(stepId, input)`
- `getBlockedLegalSteps(filters)`
- `getAxisOneDashboardSummary()`
- `getAxisOneStages()`
- `getAxisOneMissingDocuments()`
- `getAxisOneOpenTasks()`
- `getAxisOneRiskAlerts()`
- `getCommandCenterData(user)`

### 5.8 Permission Model

Relevant permission keys:

- `axis1.view`
- `project.view`, `project.create`, `project.update`, `project.archive`
- `legal.view`, `legal.update`, `legal.approve`, `legal.configure_template`
- `document.view`, `document.create`, `document.update`, `document.approve`
- `task.view`, `task.create`, `task.update`
- `meeting.view`, `meeting.create`, `decision.create`, `decision.approve`
- `proposal.view`, `proposal.create`, `proposal.update`, `proposal.review`, `proposal.approve`, `proposal.reject`, `proposal.request_change`, `proposal.configure_flow`
- `investment.view`, `investment.create`, `investment.update`, `investment.review`, `investment.approve`
- `design.view`, `design.create`, `design.update`, `design.review`
- `ai.use`, `ai.use_rag`, `ai.propose_action`, `ai.confirm_action`

Access must remain deny-by-default and scoped by project/resource membership where applicable.

### 5.9 Data Flow

```text
User action or route request
  -> Server action/page loader
  -> requireAuthenticatedSession / requirePermission
  -> Service layer
  -> Repository or structured mock data
  -> DTO aggregation
  -> UI component renders Vietnamese labels
```

For Command Center:

```text
Command Center page
  -> getCommandCenterData(user)
  -> executive service + dashboard service + axis-one service
  -> command-center typed aggregate
  -> command-center-dashboard component
```

### 5.10 Current Implementation Status

Implemented/foundation:

- Project core and 12-step legal checklist initialization.
- Legal step update and blocked notes validation.
- Axis 1 structured mock stages.
- Axis 1 dashboard summary, missing documents, open tasks and risk alerts.
- `/axis-1` redirect to Command Center Axis 1 view.
- Command Center aggregate with executive, operations dashboard and Axis 1.
- Proposal module foundation with create/list/detail/submit/request-change/approve/reject.
- Permission keys and role navigation foundation.

Gaps:

- Axis 1 stage data is not yet production-normalized.
- Investment opportunity lifecycle is not fully implemented.
- Configurable legal templates and dependencies are future work.
- Legal submissions/authority responses are not full workflow yet.
- Proposal approval routing is not configurable by threshold/risk/project/role yet.
- Supabase repository/live RLS validation for proposal workflow remains incomplete.
- AI-assisted proposal review is still future/next direction.

## 6. Owner Edit Checklist

Anh/chị nên bổ sung hoặc chỉnh các điểm sau:

- Trục 1 có cần thêm/bớt nhóm ngoài 5 nhóm hiện tại không?
- 12 bước cũ có giữ nguyên tên như hiện tại không?
- Có stage nghiệp vụ mới nào khác 12 bước pháp lý cũ không, ví dụ "ý tưởng dự án", "hồ sơ quỹ đất", "tiền khả thi"?
- Với mỗi stage, đầu vào/đầu ra bắt buộc là gì?
- Ai là owner mặc định theo từng stage?
- Stage nào cần phê duyệt nội bộ trước khi đi tiếp?
- Stage nào phụ thuộc vào phản hồi cơ quan nhà nước?
- Hồ sơ nào bắt buộc theo từng loại dự án?
- Dashboard lãnh đạo cần KPI nào là bắt buộc?
- AI được phép hỗ trợ đến mức nào trong Trục 1?
- Có cần tách Investment Workspace thành module sản xuất ngay không?

## 7. Proposed Next BMad Steps

Sau khi chủ dự án chỉnh bản này:

1. Chạy `bmad-prd` update nếu thay đổi ảnh hưởng requirement nền tảng.
2. Chạy `bmad-create-architecture` hoặc tạo architecture decision nếu thay đổi ảnh hưởng data model/workflow.
3. Chạy `bmad-create-epics-and-stories` cho phần Trục 1 cần build tiếp.
4. Promote phần đã duyệt vào:
   - `blueprint/01-domain-blueprint.md`
   - `blueprint/07-platform-requirements.md`
   - `blueprint/08-api-contract.md`
   - `blueprint/09-data-model.md`
   - `docs/architecture/ARCHITECTURE_OVERVIEW.md`
   - `docs/product/PHASE_STATUS.md`
