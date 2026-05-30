# Component Strategy

## Design System Components

Nền hiện tại:

- Tailwind CSS.
- shadcn/ui configuration.
- Radix primitive dependency.
- lucide-react icon library.
- Component foundation hiện có: Button.

Foundation components cần bổ sung hoặc chuẩn hóa trước khi làm workspace mới:

- Badge.
- Card/Panel.
- Table.
- Tabs.
- Dialog/Alert Dialog.
- Sheet/Drawer.
- Dropdown Menu.
- Select.
- Input/Search.
- Tooltip.
- Separator.
- Scroll Area.
- Skeleton/Loading.
- Toast/Inline feedback.

Các foundation component này phải dùng token đã chốt: màu semantic, radius tối đa 8px, spacing 4/8/12/16/24px, focus state rõ, text tiếng Việt không bị vỡ.

## Custom Components

### AppShell / PermissionAwareShell

**Purpose:** Bố cục ứng dụng chính với sidebar, topbar, workspace/scope switcher và vùng nội dung.

**Usage:** Dùng cho toàn bộ app sau đăng nhập.

**Anatomy:** Sidebar permission-aware, topbar, breadcrumb/context, workspace selector, scope selector, content container.

**Navigation hierarchy:** Sidebar phải phân biệt 3 tầng: `Tổng quan Trục 1` / Command Center entry, `Module 1 - Lãnh đạo` workspace, và `Quản trị Chủ tịch` / BO Settings. Chủ tịch có thể thấy quyền quản trị, nhưng default daily workspace phải là bề mặt điều hành theo scope, không phải admin/settings.

**States:** desktop, mobile drawer, collapsed, unauthorized, loading session.

**Accessibility:** keyboard navigation, focus visible, drawer có aria-label và close rõ.

### WorkspaceHeader

**Purpose:** Cho người dùng biết đang ở workspace nào, scope nào, vai trò nào.

**Content:** Tên workspace, role, scope, thời gian cập nhật, primary action nếu có quyền.

**Actions:** đổi workspace, đổi scope, refresh data, mở filter.

**Variants:** Chairman, CEO, Project Director, Department Head, Secretary / Assistant.

### KPI Strip

**Purpose:** Hiển thị KPI trọng yếu theo scope.

**Content:** label, value, trend, status, quyền dữ liệu, link drill-down.

**States:** normal, warning, danger, no permission, loading, empty.

**Interaction:** click KPI để mở filtered source data.

### Priority Queue

**Purpose:** Danh sách việc cần xử lý theo mức độ ưu tiên.

**Content:** title, type, severity, owner, deadline, reason, next action.

**Variants:** approval queue, risk queue, escalation queue, task priority queue.

**Interaction:** mở detail, filter, sort, quick action nếu có quyền.

### Risk Map / Deadline Heatmap

**Purpose:** Hiển thị mức độ rủi ro hoặc áp lực deadline.

**Content:** category, count, severity, affected projects, drill-down.

**States:** green/yellow/red/critical với label rõ.

**Accessibility:** không phụ thuộc màu; mỗi ô có text, tooltip/label.

### Approval Action Panel

**Purpose:** Xử lý approval với đủ ngữ cảnh.

**Content:** request summary, policy, amount, attachments, history, decision actions.

**Actions:** approve, reject, return/request changes, forward/escalate, ask for meeting, hold.

**Validation:** reject/return bắt buộc lý do; approve comment tùy chọn.

### Record Drilldown Panel

**Purpose:** Mở dữ liệu nguồn từ KPI/risk/approval mà không làm mất ngữ cảnh dashboard.

**Content:** summary, related records, owner, status, deadline, timeline, audit.

**Variants:** side panel desktop, full-screen sheet mobile.

### Activity Timeline / Audit Trail

**Purpose:** Cho thấy ai làm gì, lúc nào, thay đổi gì, lý do gì.

**Content:** actor, action, timestamp, previous/new state, comment, attachment.

**Usage:** approval, decision, risk, meeting, permission changes.

### Contextual AI Panel

**Purpose:** AI hỗ trợ trong đúng ngữ cảnh, không thay thế workflow.

**Variants:** Executive AI Copilot, Checklist AI, AI Meeting Preparation, AI Agenda Builder, AI Summary Assistant.

**Rules:** luôn là draft/gợi ý, có citation, có trạng thái proposed/accepted/rejected/executed/failed nếu sinh action.

## Component Implementation Strategy

Ưu tiên xây component theo 3 lớp:

1. Foundation UI: badge, panel, table, tabs, dialog, sheet, dropdown, input, select, tooltip, skeleton.
2. Enterprise patterns: KPI Strip, Priority Queue, Risk Map, Approval Action Panel, Record Drilldown Panel, Timeline/Audit Trail.
3. Role workspace compositions: Chairman Workspace, CEO Workspace, Project Director Workspace, Department Head Workspace, Secretary / Assistant Workspace.

Không tạo mỗi workspace như một trang hardcode riêng. Workspace nên là composition từ cùng bộ pattern, thay data source, permission, priority và action theo role/scope.

Component phải nhận dữ liệu có cấu trúc từ service/repository, không hardcode số liệu trong UI.

## Implementation Roadmap

Phase 1 - UI Foundation:

- Badge.
- Panel/Card.
- Table.
- Dialog/Alert Dialog.
- Sheet/Drawer.
- Tabs.
- Input/Search.
- Select/Dropdown.
- Tooltip.
- Skeleton/Empty/Error/Unauthorized states.

Phase 2 - Enterprise Dashboard Patterns:

- AppShell / PermissionAwareShell.
- WorkspaceHeader.
- KPI Strip.
- Priority Queue.
- Risk Map / Deadline Heatmap.
- Activity Timeline / Audit Trail.
- Record Drilldown Panel.

Phase 3 - Workflow Action Components:

- Approval Action Panel.
- Decision/Assignment Panel.
- Meeting Preparation Panel.
- Checklist Workflow Panel.
- Contextual AI Panel.

Phase 4 - Role Workspace Assembly:

- Chairman Workspace.
- CEO Workspace.
- Project Director Workspace.
- Department Head Workspace.
- Secretary / Assistant Workspace.

Phase 5 - Responsive and QA:

- Mobile drawer and stacked priority layout.
- Table-to-list responsive behavior.
- Keyboard/focus checks.
- Permission/403 states.
- Loading/empty/error states.
- Visual regression or screenshot review for key workspaces.
