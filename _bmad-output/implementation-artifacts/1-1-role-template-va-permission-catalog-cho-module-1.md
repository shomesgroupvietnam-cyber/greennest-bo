# Story 1.1: Role Template Và Permission Catalog Cho Module 1

Status: done

Ghi chú hoàn tất: Đã phân tích đầy đủ bối cảnh và tạo hướng dẫn triển khai toàn diện cho dev agent.

## Story

As a Chủ tịch/Super Admin,  
I want cấu hình role template và action permission tiếng Việt cho Module 1,  
so that hệ thống có nền phân quyền không hardcode cho các workspace và workflow điều hành.

## Tiêu Chí Chấp Nhận

1. **Role template mặc định trong BO Settings**
   - Given người dùng có quyền quản lý vai trò
   - When mở BO Settings cho role/permission
   - Then hệ thống hiển thị role template mặc định bằng tiếng Việt gồm Chủ tịch/Super Admin, CEO, Giám đốc dự án, Trưởng bộ phận, Thư ký/Trợ lý, Quản trị và Người xem
   - And role có thể thêm, đổi tên, vô hiệu hóa mà không sửa code UI.

2. **Permission catalog là dữ liệu cấu hình**
   - Given hệ thống có danh sách action permission tối thiểu
   - When quản trị xem permission catalog
   - Then các action như xem tổng hợp, xem chi tiết, xem tài chính nhạy cảm, duyệt, trả lại, chuyển cấp, tạo quyết định, giao việc, tạo cuộc họp, xuất dữ liệu và xem audit được quản lý như dữ liệu cấu hình.

3. **Tách quyền quản trị khỏi quyền duyệt nghiệp vụ**
   - Given một role có quyền quản trị hệ thống nhưng không có quyền duyệt nghiệp vụ
   - When role đó truy cập approval action
   - Then hệ thống không cho duyệt nghiệp vụ
   - And trả unauthorized/disabled action theo UX pattern mà không lộ dữ liệu ngoài scope.

## Tasks / Subtasks

- [x] Tạo lớp domain cho role template và permission catalog trong `src/modules/settings`
  - [x] Thêm `src/modules/settings/types.ts` hoặc file tương đương cho `RoleTemplate`, `PermissionCatalogItem`, `RolePermissionAssignment`, `RoleScope`, `PermissionModule`.
  - [x] Thêm Zod schemas trong `src/modules/settings/validation.ts` cho add/rename/disable role và cập nhật permission mapping.
  - [x] Defaults phải derive từ nguồn hiện có (`ROLES`, `PERMISSIONS`, `ROLE_PERMISSIONS`, `ROLE_DEFAULT_SCREENS`) thay vì duplicate thủ công trong UI.
  - [x] Role key là định danh ổn định; đổi tên chỉ đổi label/description, không rewrite historical assignment.

- [x] Tạo service/repository cho catalog với mock và Supabase parity
  - [x] Thêm `src/modules/settings/services/role-permission-catalog-service.ts`.
  - [x] Thêm `src/modules/settings/services/role-permission-catalog-repository.ts` theo pattern `source-registry-settings-repository.ts`.
  - [x] Mock repository dùng file `.mock-data/role-permission-catalog.json` hoặc seed từ constants khi file chưa tồn tại.
  - [x] Supabase repository đọc/ghi `roles`, `permissions`, `role_permissions`; map snake_case sang camelCase.
  - [x] Service phải enforce `settings.manage` cho mutation; view có thể dùng `settings.manage` hoặc `user.view` tùy route, nhưng mutation không được chỉ dựa vào UI.

- [x] Xây BO Settings UI cho Role & Permission Catalog
  - [x] Mở rộng `src/app/(dashboard)/settings/page.tsx` để hiển thị panel role/permission trong BO Settings, không tạo dashboard/landing page mới.
  - [x] Dùng layout enterprise dày nhưng dễ đọc: table/list, tab hoặc segmented control cho "Roles" và "Permissions", badge/swatch cho module/scope, icon lucide trong nút action.
  - [x] Không render dữ liệu nhạy cảm rồi mới ẩn; nếu thiếu quyền, route/action phải chặn phía server trước.
  - [x] UI copy phải tiếng Việt UTF-8, tránh sinh thêm mojibake trong các label hiện có.
  - [x] Action thiếu quyền hiển thị disabled/unauthorized state theo pattern hiện có, không để button thực thi mutation.

- [x] Tách quyền quản trị hệ thống khỏi quyền duyệt nghiệp vụ
  - [x] Rà soát `ROLE_PERMISSIONS.admin` trong `src/lib/permissions/can.ts` và seed tương ứng trong `database/seeds/001_roles_permissions.sql`.
  - [x] `admin`/role quản trị hệ thống không được mặc định có quyền duyệt nghiệp vụ như `proposal.approve`, `proposal.reject`, `decision.approve`, `document.approve`, `legal.approve`, `finance.approve`, `payment.approve`, `investment.approve`, `contract.approve`, các permission `*.approve` domain khác, trừ khi có role nghiệp vụ riêng.
  - [x] `super_admin` có thể giữ override kỹ thuật; role lãnh đạo/nghiệp vụ như `tong_giam_doc`, `pho_tong_giam_doc`, `quan_ly_tai_chinh` giữ quyền duyệt theo nghiệp vụ.
  - [x] Nếu cần role "Quản trị điều hành" riêng, thêm qua catalog/seed và tests, nhưng không hardcode logic mới bằng `if role === ...` trong component.

- [x] Cập nhật Server Actions và audit
  - [x] Thêm actions trong `src/modules/settings/actions.ts` cho add/rename/disable role, cập nhật permission mapping.
  - [x] Mọi mutation role/permission phải tạo audit log qua `createAuditLog` với actor, entity type, entity id, action, oldValue/newValue.
  - [x] Không cho disable role đang là role của current user nếu việc đó làm mất quyền quản trị của chính phiên hiện tại mà không có guard rõ ràng.
  - [x] Không cho xóa role; MVP chỉ disable để giữ lịch sử assignment/audit.

- [x] Cập nhật database/RLS nếu Supabase mode ghi catalog
  - [x] Nếu Supabase repository ghi `roles`, `permissions`, `role_permissions`, thêm migration/policy để user có internal `settings.manage` có thể insert/update các bảng này.
  - [x] Giữ roles/permissions readable cho authenticated users như RLS hiện tại.
  - [x] Không bỏ lớp check ở app/service; RLS chỉ là defense-in-depth.
  - [x] Cập nhật verification SQL nếu số lượng roles/permissions kỳ vọng thay đổi.

- [x] Kiểm thử
  - [x] Unit tests cho catalog service: load defaults, add role, rename role, disable role, group permission theo module, reject duplicate key, reject unknown permission.
  - [x] Unit tests cho deny-by-default và tách quyền: admin/settings role không được business approve; super_admin hoặc role nghiệp vụ hợp lệ vẫn được khi có permission.
  - [x] Tests cho actions/service audit: oldValue/newValue được ghi khi role label hoặc active state đổi.
  - [x] Component tests cho BO Settings panel nếu project đã có pattern test component phù hợp; nếu không, ít nhất test service và permission behavior.
  - [x] Chạy `npm run typecheck`, `npm run lint`, `npm run test`; nếu có thay đổi route/permission/RLS lớn, chạy thêm e2e smoke hoặc Supabase validation tương ứng.

### Review Findings

- [x] [Review][Defer] Define the missing "chuyen cap" permission action — deferred to approval-center/approval workflow story because escalation needs workflow state, target approver, audit, and UX semantics before a stable permission key is safe.
- [x] [Review][Patch] Runtime authorization still ignores catalog mappings and disabled role state [src/lib/permissions/can.ts:714]
- [x] [Review][Patch] Custom role keys can be created but cannot be assigned or resolved safely by user/session flows [src/modules/users/validation.ts:5]
- [x] [Review][Patch] Admin/business-approval separation can be reversed through role permission mapping [src/modules/settings/services/role-permission-catalog-service.ts:145]
- [x] [Review][Patch] Current settings manager can remove `settings.manage` from the active role and lock out catalog writes [src/modules/settings/services/role-permission-catalog-service.ts:145]
- [x] [Review][Patch] Supabase add-role path returns permission assignments that it never persists [src/modules/settings/services/role-permission-catalog-repository.ts:539]
- [x] [Review][Patch] Supabase role-permission replacement deletes all mappings before insert without an atomic boundary [src/modules/settings/services/role-permission-catalog-repository.ts:598]
- [x] [Review][Patch] `proposal.request_change` denial is bypassed by `proposal.review` gates [src/modules/proposals/services/proposal-service.ts:126]
- [x] [Review][Patch] Mock catalog scopes disagree with Supabase seed scopes for project roles [src/modules/settings/services/role-permission-catalog-repository.ts:32]
- [x] [Review][Patch] Required server-action audit payload tests are missing [tests/unit/role-permission-catalog.test.ts:1]

## Ghi Chú Dev

### Bối Cảnh Quan Trọng

Story này là nền của Epic 1. Các story 1.2-1.5 sẽ dựa vào role + scope + action, policy, delegation và seed data. Không giải quyết story này bằng cách thêm vài điều kiện role name trong UI; mục tiêu là tạo catalog có thể quản lý và dùng lại.

Nguồn yêu cầu chính:
- Epic 1 yêu cầu nền điều hành tối thiểu cho Module 1: role template tiếng Việt, permission/action, policy/scope, phân quyền quản trị tách khỏi duyệt nghiệp vụ và ủy quyền thư ký/trợ lý. [Source: `_bmad-output/planning-artifacts/epics.md#Epic 1`]
- Story 1.1 yêu cầu BO Settings hiển thị role template mặc định, permission catalog tối thiểu và block approval action với role chỉ có quyền quản trị hệ thống. [Source: `_bmad-output/planning-artifacts/epics.md#Story 1.1`]
- PRD yêu cầu role chỉ là cấu hình, có thể thêm/bớt/đổi tên, không hardcode role/chức danh/quyền/dự án/module và có permission riêng cho dữ liệu tài chính nhạy cảm. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#5.1 Role Mẫu`, `#8.2 Action Permission Tiếng Việt`, `#8.3 Dữ Liệu Nhạy Cảm`]

### Hiện Trạng Triển Khai

- `src/constants/roles.ts` hiện là nguồn static cho `ROLES`, `Role`, role groups và `ROLE_DEFAULT_SCREENS`. File này đang chi phối label, default route và type union.
- `src/lib/permissions/can.ts` hiện là nguồn static cho `PERMISSIONS`, `ROLE_PERMISSIONS`, `getRolePermissions`, `can`, `assertCan`. `can()` đã deny-by-default với unknown permission và hỗ trợ alias `project:view`.
- `src/lib/permissions/guard.ts` đã có `requirePermission`, `requireWorkspaceRoute`, audit access denied và dùng `forbidden()` cho 403.
- `src/lib/permissions/navigation.ts` và `src/components/layout/app-sidebar.tsx` đã lọc navigation theo permission/role, nhưng còn nhiều label không đúng UTF-8 khi nhìn qua console. Khi sửa UI copy, phải giữ UTF-8.
- `src/modules/users/services/user-service.ts` đã có `listRoles()`, `inviteUser`, `updateUserRole`, `upsertProjectMembership`, `createAuditLog`. `listRoles()` hiện derive từ `ROLES`.
- `src/modules/users/validation.ts` đang dùng `z.enum(Object.keys(ROLES))`, nên nếu cho add role dynamic thì phải đổi validation để đọc catalog/service hoặc có schema nhận string key hợp lệ theo repository.
- `src/app/(dashboard)/users/page.tsx` đã có UI user list, invite, update role, project membership và audit role. Story này cần BO Settings role/permission catalog, không chỉ trang Users.
- `src/app/(dashboard)/settings/page.tsx` hiện có Provider Health và Source Registry; đây là nơi tự nhiên để thêm panel Role & Permission Catalog.
- `src/modules/settings/services/source-registry-settings-repository.ts` là pattern tốt cho mock/Supabase repository parity trong module settings.
- Database đã có `roles`, `permissions`, `role_permissions`, `users.role`, `project_members.role`, `workspace_members.role` trong `database/migrations/202605160001_create_mvp_core_schema.sql`.
- `database/seeds/001_roles_permissions.sql` seed role/permission baseline và implied permissions; `database/migrations/202605220003_add_axis1_permission.sql` thêm `axis1.view`.
- `database/policies/001_mvp_rls.sql` hiện có helper `current_user_has_permission` và đọc roles/permissions/role_permissions, nhưng phần roles/permissions chủ yếu đang readonly; nếu story cho ghi catalog trong Supabase mode thì phải thêm policies/migration phù hợp.
- `tests/unit/permissions.test.ts` và `tests/unit/workspaces.test.ts` đang bao phủ role route, nav visibility và permission behavior; cập nhật tests này khi thay đổi admin/business approval separation.

### Ràng Buộc Kiến Trúc

- Giữ modular monolith: domain module ở `src/modules/*`, cross-cutting auth/permissions/db/audit ở `src/lib/*`, database ở `database/*`. [Source: `_bmad-output/planning-artifacts/architecture.md#Code Organization`]
- Internal UI mutations dùng Next.js Server Actions + service layer; route/page không gọi Supabase trực tiếp. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Permission enforce deny-by-default ở route/server action/service trước UI; direct URL không quyền trả 403. [Source: `_bmad-output/planning-artifacts/architecture.md#Authentication & Security`]
- Repository boundary phải giữ mock/file-backed mode và Supabase-ready mode. [Source: `_bmad-output/planning-artifacts/architecture.md#Development Experience`]
- Không thêm Prisma/Drizzle/tRPC hoặc scaffold lại repo. [Source: `_bmad-output/planning-artifacts/architecture.md#Deferred Decisions`]
- Không nâng Next/React trong story này; architecture đã chốt upgrade framework là story riêng nếu cần. [Source: `_bmad-output/planning-artifacts/architecture.md#Deferred Decisions`]

### Ràng Buộc UX

- BO Settings là tool vận hành, không phải landing page. Dùng layout rõ vai trò, rõ phạm vi, rõ action tiếp theo.
- Role/Permission catalog nên có:
  - Danh sách roles với label tiếng Việt, key, scope, trạng thái active/disabled, số permissions.
  - Permission catalog grouped theo module/action type.
  - Detail panel hoặc modal nhỏ để rename/disable/update permission mapping.
  - Disabled state rõ ràng cho role inactive và action thiếu quyền.
- Tránh card lồng card. Section rộng hoặc panel/table là đủ.
- Nút action dùng icon lucide khi có icon phù hợp; destructive/critical action cần confirmation.
- Không hiển thị dữ liệu rồi mới ẩn; unauthorized state phải đến từ server/guard/service.

### Yêu Cầu Cấu Trúc File

Expected new/update areas:
- UPDATE `src/app/(dashboard)/settings/page.tsx`
- UPDATE `src/modules/settings/actions.ts`
- UPDATE `src/modules/settings/validation.ts`
- ADD `src/modules/settings/types.ts` nếu chưa có
- ADD `src/modules/settings/services/role-permission-catalog-service.ts`
- ADD `src/modules/settings/services/role-permission-catalog-repository.ts`
- ADD component dưới `src/modules/settings/components/*` cho Role & Permission Catalog panel
- UPDATE `src/lib/permissions/can.ts` nếu cần tách admin khỏi business approve hoặc expose helper mapping
- UPDATE `src/modules/users/services/user-service.ts` và `src/modules/users/validation.ts` nếu role list/validation chuyển sang catalog-driven
- UPDATE `database/seeds/001_roles_permissions.sql` và có thể thêm migration/RLS policy nếu Supabase write support thay đổi
- UPDATE `tests/unit/permissions.test.ts`, `tests/unit/user-service.test.ts`, thêm test settings catalog nếu cần

Avoid:
- Không gọi Supabase trực tiếp từ page/component.
- Không tạo role/permission list riêng trong component.
- Không hardcode "admin can/cannot" trong UI; dùng `can()`/service permission.
- Không xóa các role hiện có khỏi history/assignment; dùng active flag.
- Không làm story 1.2 scope assignment đầy đủ trong story này. Story này chỉ chuẩn bị catalog và admin/business permission separation.

### Gợi Ý Data Contract

Recommended internal shapes:

```ts
type RoleTemplate = {
  key: string;
  labelVi: string;
  description?: string;
  scope: "system" | "project" | "external";
  active: boolean;
  defaultScreenHref?: string;
  permissionKeys: PermissionAction[];
  createdAt?: string;
  updatedAt?: string;
};

type PermissionCatalogItem = {
  key: PermissionAction;
  module: string;
  labelVi: string;
  description?: string;
  sensitive?: boolean;
  actionType: "view" | "create" | "update" | "approve" | "export" | "audit" | "admin" | "ai";
};
```

Use existing `PermissionAction` where possible. If truly dynamic permission keys are introduced, update `PermissionAction` strategy carefully; otherwise keep permission keys fixed in code for type safety and make role-to-permission mapping configurable first.

### Ghi Chú Tách Quyền

The dangerous gap for AC3 is that current static/seeds can let admin-like roles hold business approval permissions. The implementation should make this explicit:

- System administration permissions: `user.view`, `user.invite`, `user.update_role`, `settings.manage`, `audit.view`.
- Business approval permissions: `document.approve`, `legal.approve`, `decision.approve`, `proposal.approve`, `proposal.reject`, `proposal.request_change`, `finance.approve`, `payment.approve`, `investment.approve`, `contract.approve`, `hr.approve`, `qa.approve`, `safety.approve`, `acceptance.approve`, and future `*.approve` keys.
- `admin` may manage users/settings/catalog, but should not automatically approve business records. `super_admin` can remain an override if product accepts that as emergency/technical authority.
- Tests must prove a system admin without business approval permission cannot execute approval services/actions even if the button is hidden.

### Ngữ Cảnh Story Trước

No previous story exists for Epic 1. This is the first backlog story and sets implementation patterns for later Epic 1 stories.

### Ngữ Cảnh Git

Recent commit `484589a 2205` expanded command center, executive dashboards, RBAC/workspaces, guards, permissions, Supabase policies and tests. This story must preserve those patterns:
- role workspace routing and nav visibility tests are already important regression coverage;
- `forbidden()`/audit-denied route guards are already in place;
- repository parity and Supabase RLS assets are active parts of the architecture;
- do not undo current dirty work in meetings/permissions/docs files unless directly required by this story.

### Thông Tin Kỹ Thuật Mới Nhất

- Next.js official docs show App Router as the current file-system router using React Server Components/Server Functions; this repo already uses App Router and should keep that pattern. Source: https://nextjs.org/docs/app
- Next.js 16 upgrade docs list breaking changes around async request APIs and related migration work. This story must not upgrade framework versions; keep repo baseline from `package.json` unless a separate upgrade story is created. Source: https://nextjs.org/docs/app/guides/upgrading/version-16
- React docs list latest React major as 19.2, while repo pins React 19.0.0. Do not upgrade React inside this story. Source: https://react.dev/versions
- Supabase JavaScript docs document `supabase-js` v2 as the official JS/TS client; repo already uses `@supabase/supabase-js` v2 and `@supabase/ssr`. Preserve server-side repository/client patterns. Source: https://supabase.com/docs/reference/javascript/introduction

## Tham Chiếu

- `_bmad-output/planning-artifacts/epics.md#Story 1.1`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#5.1 Role Mẫu`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#8.2 Action Permission Tiếng Việt`
- `_bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Design Inspiration Strategy`
- `blueprint/12-auth-roles-permissions.md`
- `blueprint/13-role-workspaces.md`
- `src/lib/permissions/can.ts`
- `src/lib/permissions/guard.ts`
- `src/lib/permissions/navigation.ts`
- `src/constants/roles.ts`
- `src/modules/users/services/user-service.ts`
- `src/modules/settings/services/source-registry-settings-repository.ts`
- `database/migrations/202605160001_create_mvp_core_schema.sql`
- `database/seeds/001_roles_permissions.sql`
- `database/policies/001_mvp_rls.sql`
- `tests/unit/permissions.test.ts`
- `tests/unit/workspaces.test.ts`

## Ghi Chú Kiểm Tra

- Checklist pass: story có AC rõ, tasks đúng phạm vi, ràng buộc kiến trúc, hiện trạng implementation, vị trí file, yêu cầu test, trạng thái previous story, ngữ cảnh git và thông tin kỹ thuật mới nhất.
- Rủi ro còn lại: dynamic role key có thể cần mở rộng `Role` TypeScript union và validation path hiện tại. Nếu scope triển khai quá lớn, ưu tiên giao trước catalog-driven role labels/status và role-to-permission mapping, rồi tạo follow-up story cho custom runtime role key đầy đủ.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- `npm run test -- tests/unit/role-permission-catalog.test.ts tests/unit/permissions.test.ts` failed first as expected before implementation: missing catalog service/repository and admin still had business approval permissions.
- `npm run test -- tests/unit/role-permission-catalog.test.ts tests/unit/permissions.test.ts tests/unit/source-registry-settings.test.ts` passed after domain/service implementation.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test` initially exposed one stale document approval expectation for `admin`; updated the regression to assert `super_admin`/business roles can approve and `admin` cannot.
- Final `npm run test` passed: 36 files, 191 tests.
- Local render smoke: dev server started on `http://localhost:3000`; `GET /settings` returned `200 OK`.

### Implementation Plan

- Added catalog domain types and Zod schemas for role add/rename/active state and permission mapping.
- Added mock JSON and Supabase repository parity for roles, permissions and role_permissions, deriving defaults from existing `ROLES`, `PERMISSIONS`, `ROLE_PERMISSIONS` and `ROLE_DEFAULT_SCREENS`.
- Added service-layer `settings.manage` enforcement, stable role key handling, duplicate/unknown permission validation and current-role disable guard.
- Added BO Settings Role & Permission Catalog panel with role add/rename/disable, permission mapping, module/scope badges and sensitive permission markers.
- Separated `admin` system management permissions from business approval permissions while preserving `super_admin` override and business-role approvals.
- Added RLS write policies for catalog tables and seed cleanup to remove admin business approval permissions on re-run.

### Completion Notes List

- Implemented `RoleTemplate`, `PermissionCatalogItem`, `RolePermissionAssignment`, `RoleScope`, `PermissionModule` domain layer and settings validation schemas.
- Implemented role-permission catalog repositories/services with mock file fallback and Supabase snake_case/camelCase mapping.
- Extended `/settings` with Role & Permission Catalog; mutations run through Server Actions and write audit logs with oldValue/newValue.
- Updated default role labels for Module 1 acceptance targets: Chủ tịch/Super Admin, CEO, Trưởng bộ phận, Quản trị and Người xem.
- Introduced `BUSINESS_APPROVAL_PERMISSIONS`; `admin` no longer receives document/legal/decision/proposal/finance/payment/investment/contract/hr/qa/safety/acceptance approval permissions by default.
- Added focused catalog tests and updated permission/document approval regressions; full typecheck, lint and unit test suite pass.

### File List

- `_bmad-output/implementation-artifacts/1-1-role-template-va-permission-catalog-cho-module-1.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `database/policies/001_mvp_rls.sql`
- `database/seeds/001_roles_permissions.sql`
- `src/app/(dashboard)/settings/page.tsx`
- `src/constants/roles.ts`
- `src/lib/permissions/can.ts`
- `src/modules/settings/actions.ts`
- `src/modules/settings/components/role-permission-catalog-panel.tsx`
- `src/modules/settings/services/role-permission-catalog-repository.ts`
- `src/modules/settings/services/role-permission-catalog-service.ts`
- `src/modules/settings/types.ts`
- `src/modules/settings/validation.ts`
- `tests/unit/document-approval.test.ts`
- `tests/unit/permissions.test.ts`
- `tests/unit/role-permission-catalog.test.ts`

### Change Log

- 2026-05-23: Implemented Story 1.1 role template and permission catalog; status moved to review.
