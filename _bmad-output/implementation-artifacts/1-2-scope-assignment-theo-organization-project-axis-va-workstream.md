# Story 1.2: Scope Assignment Theo Organization, Project, Axis Và Workstream

Status: done

Ghi chú hoàn tất: Đã phân tích đầy đủ bối cảnh Epic 1, PRD, kiến trúc, UX, story 1.1, code hiện trạng và thông tin kỹ thuật mới nhất để tạo hướng dẫn triển khai toàn diện cho dev agent.

## Story

As a quản trị điều hành,  
I want gán role và action theo organization/project/axis/workstream/module,  
so that một người có thể có quyền khác nhau ở từng phạm vi điều hành.

## Tiêu Chí Chấp Nhận

1. **Tính quyền theo user + role + scope + action**
   - Given một người dùng có nhiều assignment
   - When service kiểm tra quyền cho một project/module/action cụ thể
   - Then kết quả quyền được tính theo user + role + organization + project + axis + workstream/module + action
   - And không lấy role/permission từ business record.

2. **Chặn truy cập ngoài assignment ở server/service layer**
   - Given người dùng không có assignment phù hợp
   - When truy cập route hoặc service data Module 1
   - Then route/service trả 403 hoặc empty/unauthorized state theo ngữ cảnh
   - And dữ liệu không được render rồi mới ẩn ở frontend.

3. **Dashboard/workspace chỉ trả dữ liệu trong scope**
   - Given người dùng được gán quyền ở project A nhưng không ở project B
   - When gọi dashboard/workspace service
   - Then DTO chỉ chứa dữ liệu trong project A.

## Tasks / Subtasks

- [x] Xác nhận dependency và giữ tương thích với Story 1.1
  - [x] Kiểm tra trạng thái implementation thực tế của Story 1.1 trước khi code; sprint hiện đánh dấu `1-1-role-template-va-permission-catalog-cho-module-1` là `ready-for-dev`, chưa `done`.
  - [x] Nếu role/permission catalog từ 1.1 chưa được merge, triển khai 1.2 bằng adapter tương thích với `ROLES`, `ROLE_PERMISSIONS`, `PERMISSIONS`, `users.role`, `project_members.role` hiện có.
  - [x] Nếu catalog từ 1.1 đã tồn tại, reuse service/repository catalog thay vì tạo nguồn role/permission thứ hai.
  - [x] Không đổi ý nghĩa `Role` hoặc `PermissionAction` theo cách làm hỏng `tests/unit/permissions.test.ts`, `tests/unit/workspaces.test.ts`, navigation hoặc default route hiện có.

- [x] Thiết kế domain model cho scope assignment
  - [x] Thêm hoặc mở rộng types dưới `src/modules/settings/types.ts` cho `ScopeAssignment`, `ScopeDimension`, `ScopeAssignmentInput`, `ScopeAssignmentStatus`, `ScopedPermissionGrant`.
  - [x] Scope tối thiểu phải biểu diễn được `organizationId`, `projectId`, `axisId`, `workstreamId` hoặc `moduleId`, `recordId` tùy chọn, `roleKey`, `permissionKeys`, `startsAt`, `endsAt`, `active`.
  - [x] Assignment phải là lớp RBAC/scope riêng; business records chỉ lưu scope nghiệp vụ như `organizationId`, `projectId`, `axisId`, `workstreamId/moduleId`, `ownerId`, không lưu role/permission làm nguồn quyết định.
  - [x] Định nghĩa precedence rõ: action hợp lệ khi user có permission theo role/catalog và có assignment match scope; global/system assignment chỉ áp dụng khi được cấu hình rõ, không tự suy từ mọi role internal.
  - [x] Hỗ trợ wildcard có kiểm soát, ví dụ `projectId="*"` hoặc `moduleId="*"`, nhưng phải tránh biến mọi assignment thành toàn hệ thống ngoài ý muốn.

- [x] Tạo service/repository cho scope assignment trong settings
  - [x] Thêm `src/modules/settings/services/scope-assignment-service.ts`.
  - [x] Thêm `src/modules/settings/services/scope-assignment-repository.ts` theo pattern mock/Supabase parity của `source-registry-settings-repository.ts`.
  - [x] Mock repository dùng `.mock-data/scope-assignments.json` và seed fallback đủ cho user demo Module 1 nếu file chưa tồn tại.
  - [x] Supabase repository map snake_case DB row sang camelCase domain DTO; không gọi Supabase trực tiếp từ page/component.
  - [x] Service mutation phải require `settings.manage` hoặc permission quản trị scope tương đương; nếu cần dùng `project.assign_member`, chỉ dùng bổ sung chứ không thay thế `settings.manage` cho BO Settings.
  - [x] Mọi mutation create/update/disable assignment ghi audit log với actor, entity type `scope_assignment`, entity id, oldValue/newValue và scope snapshot.

- [x] Mở rộng validation và Server Actions
  - [x] Thêm Zod schemas trong `src/modules/settings/validation.ts` cho create/update/disable scope assignment.
  - [x] Validate user, role, permission key, organization/project/axis/workstream/module input; reject unknown permission và reject assignment không có bất kỳ scope dimension hợp lệ nào trừ khi đó là system/global assignment explicit.
  - [x] Thêm actions trong `src/modules/settings/actions.ts` cho create/update/disable assignment; action phải lấy current user server-side, gọi service, audit, `revalidatePath("/settings")`.
  - [x] Không cho disable assignment làm current user mất quyền quản trị phiên hiện tại nếu không có guard rõ ràng.

- [x] Mở rộng permission/scope resolver dùng chung
  - [x] Update `src/lib/permissions/access-scope.ts` để nhận assignment theo organization/project/axis/workstream/module, không chỉ `ProjectMembership[]`, task và document ownership.
  - [x] Thêm helper như `canAccessScopedAction(user, action, targetScope, inputs)` hoặc tên tương đương, trả kết quả dựa trên cả permission action và scope match.
  - [x] Giữ các helper hiện có (`resolveAccessScope`, `filterProjectsForScope`, `filterTasksForScope`, `filterDocumentsForScope`, `filterMeetingsForScope`, `filterDecisionsForScope`) tương thích ngược cho tests hiện tại.
  - [x] Update `src/lib/permissions/scoped-resources.ts` để dùng resolver mới và trả `undefined`/empty trước khi UI render dữ liệu ngoài scope.
  - [x] Không hardcode điều kiện kiểu `if role === "..."` mới trong component; nếu cần mapping role/scope, đặt ở config/service.

- [x] Áp dụng scope filtering cho workspace/dashboard Module 1
  - [x] Update `src/modules/workspaces/services/workspace-service.ts` để `applyWorkspaceScope` lọc theo assignment mới cho projects, tasks, documents, legalSteps, meetings, decisions, users, auditLogs và memberships.
  - [x] Update `src/modules/workspaces/config.ts` nếu route access cần permission/scope thay vì role-only, nhưng phải giữ behavior hiện có cho default routes và tests.
  - [x] Rà soát `src/modules/dashboard/services/dashboard-service.ts`, `src/modules/command-center/services/command-center-service.ts` và `src/modules/executive/services/executive-service.ts`; nơi nào trả DTO Module 1 theo scope thì phải dùng cùng resolver hoặc contract tương thích.
  - [x] Với record detail service, ngoài list filtering phải có get-by-id guard: record ngoài scope trả `undefined`, domain error hoặc 403 theo pattern hiện có, không để page render rồi mới ẩn.

- [x] Xây BO Settings UI cho quản lý scope assignment
  - [x] Mở rộng `src/app/(dashboard)/settings/page.tsx` để nạp danh sách users, roles/catalog, scope assignments và options scope cần thiết qua service.
  - [x] Thêm component dưới `src/modules/settings/components/*` cho panel "Phạm vi điều hành" hoặc "Scope assignment".
  - [x] UI cần table/list dense but readable: user, role, organization, project, axis, workstream/module, permission/action, trạng thái active, thời hạn nếu có, updatedBy/updatedAt.
  - [x] Form create/update dùng label tiếng Việt, inline validation, giữ input khi lỗi, destructive disable cần confirmation.
  - [x] Không dùng card lồng card; dùng section/panel/table, tabs/segmented controls nếu cần tách "Vai trò", "Permission", "Phạm vi".
  - [x] Unauthorized state phải đến từ route/service guard; không render danh sách assignment cho user thiếu quyền.

- [x] Cập nhật database/RLS cho Supabase mode
  - [x] Nếu chưa có bảng phù hợp, thêm migration `database/migrations/YYYYMMDDNNNN_create_scope_assignments.sql` hoặc tên tương đương.
  - [x] Bảng đề xuất: `access_scope_assignments` với `user_id`, `role_key`, `organization_id`, `project_id`, `axis_id`, `workstream_id`, `module_id`, `permission_keys`, `is_active`, `starts_at`, `ends_at`, `created_by`, `updated_by`, timestamps.
  - [x] Thêm unique/index phù hợp cho lookup theo user + scope + active, ví dụ `user_id`, `project_id`, `axis_id`, `module_id`, `is_active`.
  - [x] RLS: authenticated user được đọc assignment của chính họ; user có `settings.manage` hoặc permission quản trị scope được đọc/ghi assignment; app/service vẫn phải check quyền trước RLS.
  - [x] Không phá `project_members` hiện có; có thể giữ làm compatibility source hoặc migration bridge, nhưng resolver mới phải định nghĩa rõ khi nào dùng `project_members` và khi nào dùng `access_scope_assignments`.

- [x] Kiểm thử
  - [x] Unit tests cho scope resolver: nhiều assignment trên cùng user, project A allowed/project B denied, organization-level grant, axis/workstream grant, wildcard có kiểm soát, inactive/expired assignment ignored.
  - [x] Unit tests cho action permission + scope: user có permission nhưng không có scope bị deny; user có scope nhưng không có permission bị deny; system/global scope chỉ pass khi explicit.
  - [x] Update `tests/unit/access-scope.test.ts` và `tests/unit/workspaces.test.ts` để giữ regression external/viewer hiện tại và thêm multi-assignment mới.
  - [x] Tests cho settings service/repository: create/update/disable assignment, reject unknown role/permission, audit old/new values.
  - [x] Tests cho dashboard/workspace DTO không chứa project ngoài scope.
  - [x] Nếu thêm RLS/migration, thêm verification SQL hoặc smoke script tương ứng.
  - [x] Chạy `npm run typecheck`, `npm run lint`, `npm run test`; nếu thay đổi route/permission/RLS lớn, chạy thêm `npm run test:e2e` hoặc Supabase smoke phù hợp.

### Review Findings

- [x] [Review][Patch] Supabase create/upsert fails because assignment IDs are not UUIDs [`src/modules/settings/services/scope-assignment-service.ts:41`]
- [x] [Review][Patch] Scoped assignments can grant permissions outside the selected role catalog [`src/lib/permissions/access-scope.ts:214`]
- [x] [Review][Patch] Dashboard/workspace pre-gate raw data by the user's base role, so scoped grants cannot actually expose assigned data [`src/modules/dashboard/services/dashboard-service.ts:104`]
- [x] [Review][Patch] Internal users without matching assignments still fall back to full data access [`src/lib/permissions/access-scope.ts:274`]
- [x] [Review][Patch] Organization/axis/workstream and several record-level scopes are not passed into resolver targets, so those assignments fail silently [`src/lib/permissions/access-scope.ts:264`]
- [x] [Review][Patch] `scopeType="global"` ignores any supplied dimensions and becomes full-system scope [`src/lib/permissions/access-scope.ts:197`]
- [x] [Review][Patch] Updating the current management assignment can remove the actor's own `settings.manage` guard [`src/modules/settings/services/scope-assignment-service.ts:194`]
- [x] [Review][Patch] Scope dimensions and datetime inputs are not validated against known projects/modules/entities or valid dates [`src/modules/settings/validation.ts:80`]
- [x] [Review][Patch] Scoped `settings.manage` is not honored by route guards or Supabase RLS policies [`src/lib/permissions/guard.ts:91`]
- [x] [Review][Patch] Command Center returns unscoped Axis 1 DTO data regardless of assignment scope [`src/modules/command-center/services/command-center-service.ts:479`]

## Ghi Chú Dev

### Bối Cảnh Quan Trọng

Story này là lớp scope nền sau role/permission catalog. Mục tiêu không phải chỉ thêm field vào `project_members`; mục tiêu là tạo một resolver thống nhất để mọi workspace, dashboard, route guard, service DTO và future AI context có thể trả lời cùng một câu hỏi: user này có action này trong scope nghiệp vụ này không?

Nguồn yêu cầu chính:
- Epic 1 yêu cầu nền điều hành tối thiểu cho Module 1: role template, permission/action, policy/scope, tách quyền quản trị khỏi duyệt nghiệp vụ và ủy quyền thư ký/trợ lý. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1`]
- Story 1.2 yêu cầu tính quyền theo user + role + organization + project + axis + workstream/module + action, chặn route/service ngoài assignment và dashboard/workspace chỉ trả dữ liệu trong scope. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.2`]
- PRD định nghĩa scope tối thiểu là `Tổ chức/pháp nhân -> Dự án -> Trục -> Module/Workstream -> Bản ghi -> Hành động`; role chỉ là cấu hình và người dùng có thể có quyền khác nhau theo từng dự án/module. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#5.2 Lãnh Đạo Tập Đoàn Và Lãnh Đạo Dự Án`, `#8.1 Scope`]
- PRD/NFR yêu cầu dữ liệu executive được filter ở server/service layer, không render rồi ẩn ở frontend, direct access ngoài quyền trả 403 hoặc không trả dữ liệu. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#10 Non-Functional Requirements`]

### Hiện Trạng Triển Khai

- `src/lib/permissions/can.ts` là nguồn permission static hiện tại với `PERMISSIONS`, `ROLE_PERMISSIONS`, `getRolePermissions`, `can`, `assertCan`. `can()` đã deny-by-default với unknown permission và có alias `project:view`.
- `src/lib/permissions/access-scope.ts` hiện chỉ phân loại role thành `internal_full`, `internal_assigned`, `external_limited`, `read_only_allowed`; filtering chủ yếu dựa vào `project_members`, task assignee, document owner. Các role internal không limited hiện có thể thấy full data.
- `src/lib/permissions/scoped-resources.ts` đã có wrapper list/get scoped cho projects, tasks, documents, legalSteps, meetings, decisions, nhưng input scope hiện chưa có organization/axis/workstream/action.
- `src/lib/permissions/guard.ts` đã có `requirePermission`, `requireWorkspaceRoute`, audit access denied và `forbidden()` cho direct 403.
- `src/modules/workspaces/config.ts` hiện cho workspace route access dựa trên role list; `WORKSPACE_DEFINITIONS` có permission metadata nhưng `canAccessWorkspaceRoute` chưa dùng scope assignment.
- `src/modules/workspaces/services/workspace-service.ts` gọi `getDashboardData`, list domain data, rồi `applyWorkspaceScope`; đây là điểm chính phải giữ end-to-end filtering trước UI.
- `src/modules/executive/services/executive-service.ts` đã có mock `ExecutiveAccessibleScope` theo organization/project/axis/module và tests chứng minh scope behavior cho CEO, project director, department head. Reuse ý tưởng data shape/filtering ở đây thay vì tạo logic mâu thuẫn.
- `src/modules/settings/actions.ts`, `validation.ts` và `source-registry-settings-*` là pattern tốt cho Server Actions + Zod + repository parity + audit trong settings.
- `src/modules/users/services/user-service.ts` hiện có `listProjectMemberships()` và `upsertProjectMembership()` chỉ theo `projectId/userId/role`; `ProjectMembership` chưa có organization/axis/workstream/module.
- Database baseline có `roles`, `permissions`, `role_permissions`, `users`, `workspace_members`, `project_members`; `project_members` hiện chỉ theo project. Meeting migration đã thêm `organization_id`, `project_ids`, `axis_id`, `department_id`, visibility và participant scope.
- `database/policies/001_mvp_rls.sql` có helper `current_user_has_permission`, `current_user_has_internal_permission`, `current_user_is_project_member`, `current_user_can_read_project` và policies cho `project_members`, tasks, documents, meetings, proposals. Scope assignment mới cần mirror RLS nếu Supabase mode dùng bảng mới.
- Tests hiện có: `tests/unit/access-scope.test.ts`, `tests/unit/workspaces.test.ts`, `tests/unit/permissions.test.ts`, `tests/unit/user-service.test.ts`, `tests/unit/source-registry-settings.test.ts`, `tests/unit/executive-service.test.ts`.

### Ràng Buộc Kiến Trúc

- Giữ modular monolith: domain module ở `src/modules/*`, cross-cutting auth/permissions/db/audit ở `src/lib/*`, database ở `database/*`. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Organization`]
- Internal UI mutations dùng Next.js Server Actions + service layer; Route Handlers chỉ cho integration/public API khi cần. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Repository implementation đặt trong `services/*-repository.ts`; service orchestration đặt trong `services/*-service.ts`. [Source: `_bmad-output/planning-artifacts/architecture.md#Structure Patterns`]
- Zod dùng ở boundary form/action/service input; DB snake_case map sang camelCase trong repository. [Source: `_bmad-output/planning-artifacts/architecture.md#Format Patterns`]
- Permission check ở action/service trước mutation; UI phải có unauthorized/empty/loading/error state rõ và không render dữ liệu rồi ẩn. [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Không thêm Prisma/Drizzle/tRPC, Redux/Zustand hoặc scaffold lại repo trong story này. [Source: `_bmad-output/planning-artifacts/architecture.md#Deferred Decisions`]

### Ràng Buộc UX

- BO Settings là tool vận hành, không phải landing page. Màn quản trị scope cần dense but readable, hỗ trợ tìm kiếm/filter user/project/module/action và hiển thị active filters rõ.
- Button hierarchy: primary cho lưu/tạo assignment, secondary cho mở chi tiết, destructive cho disable; destructive/critical mutation cần confirmation.
- Form phải có label tiếng Việt, required indicator, inline validation, giữ input khi validation fail.
- Unauthorized state không được lộ dữ liệu assignment/scope; direct URL phải 403 rõ.
- Responsive: desktop là bề mặt chính cho cấu hình phức tạp; mobile chỉ cần đọc/review nhẹ, table rộng phải có horizontal scroll có kiểm soát hoặc compact list.
- Accessibility: semantic table headers, focus visible, accessible names cho icon buttons, tooltip/lý do cho disabled action nếu hiển thị.

### Yêu Cầu Cấu Trúc File

Expected new/update areas:
- UPDATE `src/lib/permissions/access-scope.ts`
- UPDATE `src/lib/permissions/scoped-resources.ts`
- UPDATE `src/modules/workspaces/services/workspace-service.ts`
- UPDATE `src/modules/workspaces/config.ts` nếu route access cần scope/permission-aware hơn role-only
- UPDATE `src/modules/settings/actions.ts`
- UPDATE `src/modules/settings/validation.ts`
- ADD/UPDATE `src/modules/settings/types.ts`
- ADD `src/modules/settings/services/scope-assignment-service.ts`
- ADD `src/modules/settings/services/scope-assignment-repository.ts`
- ADD component dưới `src/modules/settings/components/*` cho Scope Assignment panel
- UPDATE `src/app/(dashboard)/settings/page.tsx`
- UPDATE `src/modules/users/types.ts`, `src/modules/users/services/user-service.ts`, `src/modules/users/services/user-repository.ts` nếu cần compatibility với project/workspace membership
- UPDATE `src/modules/dashboard/services/dashboard-service.ts`, `src/modules/command-center/services/command-center-service.ts`, `src/modules/executive/services/executive-service.ts` nếu DTO Module 1 cần scope resolver thống nhất
- ADD migration/policies/verification nếu Supabase mode cần bảng `access_scope_assignments`
- UPDATE tests trong `tests/unit/access-scope.test.ts`, `tests/unit/workspaces.test.ts`, `tests/unit/permissions.test.ts`, `tests/unit/user-service.test.ts`; ADD `tests/unit/scope-assignment-settings.test.ts` hoặc tên tương đương

Avoid:
- Không gọi Supabase trực tiếp từ page/component.
- Không duplicate role/permission catalog trong scope component.
- Không biến mọi internal role thành full-access nếu assignment mới có mặt; full access phải là assignment/policy explicit hoặc compatibility path được test.
- Không đưa role/permission vào business record để quyết định quyền.
- Không phá external/viewer behavior hiện có: nhà thầu/tư vấn chỉ thấy task/document/project liên quan; viewer read-only theo assignment.
- Không xử lý delegation thư ký/trợ lý đầy đủ trong story này; Story 1.4 sẽ làm delegation. Ở story 1.2 chỉ chuẩn bị model/action/scope để delegation dùng sau.

### Gợi Ý Data Contract

```ts
type ScopeDimension = {
  organizationId?: string;
  projectId?: string;
  axisId?: string;
  workstreamId?: string;
  moduleId?: string;
  recordId?: string;
};

type ScopeAssignment = ScopeDimension & {
  id: string;
  userId: string;
  roleKey: string;
  permissionKeys: PermissionAction[];
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
};

type ScopedActionCheck = {
  user: PermissionUser;
  action: PermissionAction;
  target: ScopeDimension;
};
```

Recommended behavior:
- Permission grant = role/catalog/action permission AND active assignment matches target scope.
- More specific assignment should not broaden less specific assignment accidentally. Example: project A + module legal does not grant project A + module finance.
- Empty target field means "record does not have that dimension", not "match all"; wildcard should be explicit.
- Expired/inactive assignment ignored by resolver and service DTO filters.
- Audit log should store enough scope snapshot to explain why assignment changed.

### Ngữ Cảnh Story Trước

Story 1.1 created the implementation guide for role template and permission catalog. It is not marked `done`, so dev agent must not assume code artifacts such as `role-permission-catalog-service.ts` already exist. Use this order:

1. Read actual repo state first.
2. If Story 1.1 has been implemented, integrate with its catalog types/services.
3. If not implemented, build scope assignment against current static permission constants and user/project membership services while keeping an adapter boundary so 1.1 can replace the source later.

Important learnings from Story 1.1:
- Do not hardcode role/permission lists in UI.
- Keep mock/file-backed and Supabase repository parity.
- Mutation must enforce permission server-side and write audit log.
- Role key is stable; labels/descriptions can change without rewriting historical assignment.
- Admin/business approval separation is a known risk. Story 1.2 must test both permission and scope, not treat system admin role as automatic scoped approval authority.

### Ngữ Cảnh Git

Recent commit `484589a 2205` expanded command center, executive dashboards, RBAC/workspaces, guards, permissions, Supabase policies and tests. Current worktree has unrelated edits in meetings, permissions, docs, policies and tests. Do not revert them. If touching a dirty file such as `src/lib/permissions/access-scope.ts`, read current content carefully and preserve user changes.

Relevant established patterns:
- `forbidden()` + audit denied access in `src/lib/permissions/guard.ts`.
- Mock/Supabase repository selection via `selectRepository`.
- Unit tests in `tests/unit/*.test.ts`.
- Workspace route and nav visibility are important regression surfaces.

### Thông Tin Kỹ Thuật Mới Nhất

- Next.js App Router remains the correct pattern for this repo; use Server Components/Server Actions as already established. Source: https://nextjs.org/docs/app
- Next.js docs for mutating data keep Server Actions as the App Router mutation path. Keep internal UI mutations in Server Actions and service layer. Source: https://nextjs.org/docs/app/getting-started/mutating-data
- Supabase official docs continue to recommend server-side auth/client handling for Next.js SSR/App Router via Supabase server utilities. Preserve `createSupabaseServerClient` repository usage. Source: https://supabase.com/docs/guides/auth/server-side
- React docs list current React documentation against 19.x; repo `package.json` ranges are React `^19.0.0`, while lockfile currently resolves React/React DOM `19.2.6`. Do not downgrade these during this story. Source: https://react.dev/versions
- Next.js published Dec 2025 RSC security advisories. App Router apps on vulnerable Next 15 lines required patched releases; fixed 15.5.x line is `15.5.9+`. Current lockfile shows Next `15.5.18`, so preserve lockfile rather than reinstalling to an older vulnerable version. Sources: https://nextjs.org/blog/CVE-2025-66478 and https://nextjs.org/blog/security-update-2025-12-11

## Tham Chiếu

- `_bmad-output/planning-artifacts/epics.md#Story 1.2`
- `_bmad-output/planning-artifacts/epics.md#Epic 1`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#5.2 Lãnh Đạo Tập Đoàn Và Lãnh Đạo Dự Án`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#8.1 Scope`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#10 Non-Functional Requirements`
- `_bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions`
- `_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Loading, Empty, Error and Unauthorized States`
- `_bmad-output/implementation-artifacts/1-1-role-template-va-permission-catalog-cho-module-1.md`
- `src/lib/permissions/access-scope.ts`
- `src/lib/permissions/scoped-resources.ts`
- `src/lib/permissions/can.ts`
- `src/lib/permissions/guard.ts`
- `src/modules/workspaces/services/workspace-service.ts`
- `src/modules/workspaces/config.ts`
- `src/modules/settings/actions.ts`
- `src/modules/settings/validation.ts`
- `src/modules/settings/services/source-registry-settings-repository.ts`
- `src/modules/users/services/user-service.ts`
- `src/modules/executive/services/executive-service.ts`
- `database/migrations/202605160001_create_mvp_core_schema.sql`
- `database/migrations/202605230001_add_meeting_engine_fields.sql`
- `database/policies/001_mvp_rls.sql`
- `database/seeds/001_roles_permissions.sql`
- `tests/unit/access-scope.test.ts`
- `tests/unit/workspaces.test.ts`
- `tests/unit/permissions.test.ts`
- `tests/unit/executive-service.test.ts`

## Ghi Chú Kiểm Tra

- Checklist pass: story có AC rõ, tasks đúng phạm vi, guardrails kiến trúc, file targets, current implementation state, previous story dependency, git/worktree context, UX constraints, test plan và latest tech notes.
- Rủi ro còn lại: Story 1.1 chưa `done`, nên implementation 1.2 có thể phải làm adapter tạm cho static permissions. Nếu scope quá lớn, ưu tiên resolver + service/repository + tests trước, sau đó UI settings panel có thể làm mỏng nhưng vẫn dùng cùng service contract.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/access-scope.test.ts tests/unit/scope-assignment-settings.test.ts tests/unit/workspaces.test.ts tests/unit/settings-actions.test.ts` failed first as expected before implementation: missing scope assignment service/repository/actions and resolver support.
- `npm run test -- tests/unit/access-scope.test.ts tests/unit/scope-assignment-settings.test.ts tests/unit/workspaces.test.ts tests/unit/settings-actions.test.ts` passed after model/service/resolver/action implementation.
- `npm run test -- tests/unit/access-scope.test.ts tests/unit/scope-assignment-settings.test.ts tests/unit/workspaces.test.ts tests/unit/dashboard-service.test.ts tests/unit/settings-actions.test.ts` passed after dashboard DTO filtering coverage.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test` passed: 38 files, 211 tests.
- `npm run test:e2e` initially exposed existing smoke fragility around brand text spacing and `/dashboard` redirect navigation; added stable sr-only brand text and aligned mobile smoke navigation with the route smoke wait strategy.
- Final `npm run test:e2e` passed: 27 tests.
- Code review patch pass resolved all 10 review findings; final `npm run typecheck`, `npm run lint`, `npm run test` and `npm run test:e2e` passed.

### Implementation Plan

- Reused Story 1.1 role/permission catalog and kept `Role`/`PermissionAction` semantics compatible with existing permissions, workspace and navigation tests.
- Added scope assignment domain types, validation, JSON/Supabase repository parity and service-layer `settings.manage` enforcement.
- Added Server Actions for create/update/disable with audit payloads containing scope snapshots.
- Extended the shared access-scope resolver with explicit assignment matching, controlled wildcards, inactive/expired filtering and `canAccessScopedAction`.
- Wired scoped-resources, workspace and dashboard services to filter DTOs before UI render when explicit assignments are present.
- Added BO Settings scope assignment panel and Supabase migration/RLS/verification SQL.
- Stabilized e2e brand smoke text without changing visual layout.

### Completion Notes List

- Story 1.1 dependency confirmed as `done`; scope assignment implementation reuses `listRolePermissionCatalog` and catalog role/permission data instead of duplicating role lists.
- Implemented `ScopeAssignment`, `ScopeDimension`, `ScopeAssignmentInput`, `ScopeAssignmentStatus` and `ScopedPermissionGrant` in settings domain types.
- Implemented scope assignment create/update/disable with user, role, permission and scope validation; implicit global assignments are rejected unless `scopeType = "global"`.
- Added JSON mock fallback for demo admin and Supabase mapper for `access_scope_assignments`.
- Added resolver support for project/module/action checks, explicit wildcard handling and inactive/expired assignment denial.
- Workspace and dashboard DTOs now filter projects, tasks, documents, legal steps, meetings and decisions by explicit assignments; existing project membership/owner compatibility remains covered.
- Added BO Settings UI for dense scope assignment management with user/role/scope/permission/status/audit metadata.
- Added migration and verification SQL for Supabase table, indexes and RLS policies.
- Added unit coverage for resolver, settings service/repository, settings actions audit, workspace filtering and dashboard filtering.
- Added e2e stabilization for brand smoke and dashboard redirect navigation; final e2e suite passes.

### File List

- `_bmad-output/implementation-artifacts/1-2-scope-assignment-theo-organization-project-axis-va-workstream.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `database/migrations/202605230003_create_scope_assignments.sql`
- `database/verification/003_scope_assignments_rls.sql`
- `database/verification/README.md`
- `src/app/(dashboard)/settings/page.tsx`
- `src/app/page.tsx`
- `src/lib/permissions/access-scope.ts`
- `src/lib/permissions/scoped-resources.ts`
- `src/modules/command-center/components/command-center-dashboard.tsx`
- `src/modules/dashboard/services/dashboard-service.ts`
- `src/modules/executive/components/executive-leadership-dashboard.tsx`
- `src/modules/settings/actions.ts`
- `src/modules/settings/components/scope-assignment-panel.tsx`
- `src/modules/settings/services/scope-assignment-repository.ts`
- `src/modules/settings/services/scope-assignment-service.ts`
- `src/modules/settings/types.ts`
- `src/modules/settings/validation.ts`
- `src/modules/workspaces/services/workspace-service.ts`
- `src/modules/workspaces/types.ts`
- `tests/e2e/mvp-smoke.spec.ts`
- `tests/unit/access-scope.test.ts`
- `tests/unit/dashboard-service.test.ts`
- `tests/unit/scope-assignment-settings.test.ts`
- `tests/unit/settings-actions.test.ts`
- `tests/unit/workspaces.test.ts`

### Change Log

- 2026-05-23: Implemented Story 1.2 scope assignment foundation; status moved to review.
- 2026-05-23: Applied code review patches for scoped permissions, route/RLS guards and Axis 1 DTO filtering; status moved to done.
