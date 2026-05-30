# Sprint Change Proposal: Module 1 Navigation And IA Clarification

## 1. Issue Summary

Người dùng đang kiểm tra UI bằng role Chủ tịch và thấy menu trái có `Quản trị`, `Tổng quan`. Khi mở `Tổng quan`, UI hiển thị một dashboard có 5 vùng/module: `Lãnh đạo`, `Tìm kiếm & phát triển dự án`, `Pháp lý`, `Thiết kế - Quy hoạch - Kỹ thuật - BIM`, `Đề xuất - Họp - Phê duyệt nội bộ`.

Vấn đề không phải 5 module này sai BRD. Vấn đề là UI đang dùng nhãn `Tổng quan` quá chung, khiến màn tổng quan Trục 1/Command Center bị hiểu nhầm thành `1.1 Dashboard Tổng Quan` của Module 1 - Lãnh đạo. Đồng thời role `Chủ tịch/Super Admin` đang bị trộn giữa persona điều hành hằng ngày và persona quản trị hệ thống.

## 2. Impact Analysis

### Requirement Impact

- Trục 1 vẫn phải có entry point chỉ hiển thị 5 module chính trong MVP.
- Module 1 - Lãnh đạo vẫn phải có riêng các mục 1.1-1.11.
- BO Settings/Quản trị Chủ tịch phải là khu riêng, không phải trải nghiệm điều hành mặc định hằng ngày.

### Story Impact

- Primary implementation story: `2.1 PermissionAwareShell Và Workspace Entry`.
- Related dashboard content stories: `2.2 Executive Dashboard Service DTO Theo Scope`, `2.3 Dashboard UI Với KPI Strip, Priority Queue Và Risk Summary`.
- Related private workspace story: `2.6 Private Workspace Theo Vai Trò`.
- No need to reopen completed stories `1.1-1.4`; those are foundation for role, scope, policy and delegation.
- Keep `1.5 Seed Data Điều Hành Cho Nghiệm Thu Module 1`; it is still needed for realistic acceptance/demo data. It does not need to block the navigation shell correction in `2.1`, but it should be completed before validating dashboard/data-heavy stories such as `2.2`, `2.3`, `2.4` and `2.6`.

### Technical Impact

- Rename/clarify navigation labels.
- Make default Chairman business entry point go to Module 1 - Lãnh đạo workspace, not `/admin`.
- Keep admin/settings available only as `Quản trị Chủ tịch` or `BO Settings`.
- Ensure Trục 1 entry and Module 1 entry are visually distinct.

## 3. Recommended Approach

Use direct adjustment in existing plan. Do not create a new epic.

Implement the IA correction in `Story 2.1` before building dashboard content in `2.2` and `2.3`.

Recommended route model:

| UI concept | Label | Route intent |
| --- | --- | --- |
| Trục 1 entry | `Tổng quan Trục 1` or `Command Center Trục 1` | Shows exactly 5 MVP modules |
| Module 1 entry | `Lãnh đạo` | Opens Module 1 workspace with 1.1-1.11 |
| Module 1 dashboard | `Dashboard Tổng Quan` | Section 1.1 inside Module 1 |
| BO Settings | `Quản trị Chủ tịch` or `BO Settings` | Separate admin/settings area |

For current code, the least disruptive interim route is:

- `Tổng quan Trục 1` -> `/command-center` or `/axis-1` redirecting to the Trục 1 Command Center view.
- `Lãnh đạo` -> `/command-center?view=executive-dashboard` until a dedicated `/axis-1/executive` route is finalized.
- `Quản trị Chủ tịch` -> `/admin` or `/settings`, but not as Chairman daily default.

## 4. Detailed Change Proposals

### PRD Update

File: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md`

Add a short subsection after the route/module structure section:

```md
### Navigation And Entry Point Clarification

`Tổng quan Trục 1` / `Command Center Trục 1` là entry point của Trục 1 và hiển thị 5 module MVP.
`Dashboard Tổng Quan` là mục 1.1 bên trong Module 1 - Lãnh đạo, không được dùng làm nhãn cho toàn bộ Trục 1.
`Quản trị Chủ tịch` / `BO Settings` là khu quản trị riêng, không phải workspace điều hành mặc định hằng ngày của Chủ tịch.
```

### Trục 1 Requirement Update

File: `_bmad-output/planning-artifacts/truc-1-mvp-final-bmad-ready.md`

Add clarification near section `Route hoặc entry point Trục 1`:

```md
Không đặt nhãn entry point Trục 1 là `Tổng quan` đơn lẻ nếu trong cùng sản phẩm có `Dashboard Tổng Quan` của Module 1. Nhãn phải phân biệt rõ `Tổng quan Trục 1` với `Dashboard Tổng Quan` của Module Lãnh đạo.
```

### UX Spec Update

File: `_bmad-output/planning-artifacts/ux-design-specification.md`

Add to AppShell / PermissionAwareShell rules:

```md
Sidebar phải phân biệt 3 tầng: Trục 1 entry, Module 1 workspace, và BO Settings. Chủ tịch có thể thấy quyền quản trị, nhưng default daily workspace phải là bề mặt điều hành, không phải admin/settings.
```

### Epics Update

File: `_bmad-output/planning-artifacts/epics.md`

Update `Story 2.1: PermissionAwareShell Và Workspace Entry` acceptance criteria:

```md
AC4:
Given người dùng có quyền vào Trục 1
When sidebar/render entry point điều hành
Then hệ thống phân biệt rõ `Tổng quan Trục 1`/Command Center với `Dashboard Tổng Quan` của Module Lãnh đạo.

AC5:
Given người dùng là Chủ tịch hoặc leadership persona có cả quyền điều hành và quyền quản trị
When đăng nhập hoặc mở default workspace
Then hệ thống đưa vào workspace điều hành phù hợp theo scope
And `Quản trị Chủ tịch`/BO Settings chỉ là mục riêng, không phải default daily workspace.
```

## 5. Implementation Handoff

Scope: Minor-to-moderate. No replan needed.

Implement in this order:

1. Update PRD, Trục 1 requirement, UX spec and Epic 2.1 AC.
2. Implement `Story 2.1` IA/navigation shell correction.
3. Complete `Story 1.5` seed data before dashboard/data-heavy acceptance.
4. Build Module 1 dashboard content in `2.2` and `2.3`.
5. Continue `2.4-2.7` for Morning Briefing, Common Center, Private Workspace and drill-down.

Success criteria:

- User can tell whether they are on Trục 1 Command Center or Module 1 - Lãnh đạo.
- Opening `Lãnh đạo` shows the Module 1 workspace structure for 1.1-1.11.
- `Dashboard Tổng Quan` appears only inside Module 1, not as a generic app-wide menu label.
- Chairman daily entry is not `/admin` unless explicitly choosing BO Settings.
