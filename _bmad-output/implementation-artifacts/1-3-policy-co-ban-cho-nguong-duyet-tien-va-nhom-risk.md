# Story 1.3: Policy Cơ Bản Cho Ngưỡng Duyệt Tiền Và Nhóm Risk

Status: done

Ghi chú hoàn tất: Đã phân tích Epic 1, PRD, architecture, UX, Story 1.2, code hiện trạng và thông tin kỹ thuật mới nhất để tạo hướng dẫn triển khai đầy đủ cho dev agent. Story này cố ý giới hạn ở policy cơ bản cho BO Settings, ngưỡng duyệt tiền và nhóm risk; không xây full configurable approval engine production-grade.

## Story

As a quản trị điều hành,  
I want cấu hình policy cơ bản cho ngưỡng duyệt tiền và nhóm risk,  
so that approval và risk center không hardcode rule nghiệp vụ.

## Tiêu Chí Chấp Nhận

1. **Lưu và đọc ngưỡng duyệt tiền từ policy service**
   - Given quản trị có quyền cấu hình policy
   - When tạo hoặc sửa ngưỡng duyệt tiền
   - Then policy được validate và lưu qua service/repository trong `src/modules/settings`
   - And các approval/proposal flow có thể đọc policy này thay vì hardcode threshold hoặc approver role.

2. **Cấu hình nhóm risk có fallback seed/demo mặc định**
   - Given quản trị cấu hình nhóm risk
   - When Risk Center, Executive Dashboard hoặc dashboard service tải dữ liệu
   - Then hệ thống dùng nhóm risk từ configuration
   - And vẫn có nhóm mặc định khi mock/file-backed mode hoặc seed data chưa có file cấu hình.

3. **Audit đầy đủ khi thay đổi policy**
   - Given policy ngưỡng duyệt hoặc nhóm risk bị sửa
   - When mutation hoàn tất
   - Then audit log ghi actor, thời gian, entity type, entity id, giá trị cũ/mới và scope snapshot.

4. **Permission và scope được enforce ở server/service**
   - Given người dùng thiếu `settings.manage`
   - When gọi trực tiếp action tạo/sửa/tắt policy
   - Then service chặn mutation trước khi repository ghi dữ liệu
   - And UI không render dữ liệu nhạy cảm rồi mới ẩn.

5. **Không tạo approval flow riêng**
   - Given approval/proposal cần xác định bước duyệt theo amount/risk
   - When service resolve policy
   - Then kết quả chỉ trả next approval level/role/permission đề xuất cho Proposal/Approval backbone
   - And không tạo `LegalApprovalService`, `FinanceApprovalService` hoặc flow song song ngoài `src/modules/proposals`.

## Tasks / Subtasks

- [x] Tạo domain model policy trong settings
  - [x] Mở rộng `src/modules/settings/types.ts` với `ApprovalThresholdPolicy`, `RiskGroupConfig`, `PolicyScope`, `PolicySettings`, `ApprovalPolicyInput`, `RiskGroupInput`, `PolicyMutationResult`.
  - [x] Policy scope reuse shape từ Story 1.2: `organizationId`, `projectId`, `axisId`, `workstreamId`, `moduleId`, `recordId`; không lưu role/permission vào business record.
  - [x] Approval threshold tối thiểu có: `id`, `policyKey`, `labelVi`, `proposalType` hoặc `targetType`, `amountMin`, `amountMax`, `currency`, `approvalLevel`, `approverRoleKey`, `requiredPermissionKey`, `escalateOnRiskLevels`, `active`, `priority`, timestamps và audit fields.
  - [x] Risk group tối thiểu có: `id`, `riskKey`, `labelVi`, `description`, `defaultSeverity`, `moduleId`, `sortOrder`, `isDefault`, `active`, timestamps và audit fields.
  - [x] Giữ key ổn định dạng lower snake_case; label tiếng Việt có thể đổi mà không làm hỏng dữ liệu lịch sử.

- [x] Thêm validation cho policy input
  - [x] Mở rộng `src/modules/settings/validation.ts` bằng Zod schema cho create/update/disable approval threshold và risk group.
  - [x] Validate amount không âm, `amountMin <= amountMax`, `currency` mặc định `VND`, `approvalLevel` thuộc level được hỗ trợ, `approverRoleKey` tồn tại trong role catalog, `requiredPermissionKey` tồn tại trong permission catalog.
  - [x] Chặn range trùng nhau trong cùng `targetType + scope + active` nếu thứ tự `priority` không giải quyết rõ.
  - [x] Validate `riskKey` unique, `labelVi` bắt buộc, `defaultSeverity` thuộc `low | medium | high | critical`, không cho vô hiệu hóa toàn bộ nhóm risk mặc định.
  - [x] Giữ validation sync/testable; mọi lookup async qua service trước/sau parse, không nhét gọi repository vào schema.

- [x] Tạo service/repository policy settings theo pattern hiện có
  - [x] ADD `src/modules/settings/services/policy-settings-service.ts`.
  - [x] ADD `src/modules/settings/services/policy-settings-repository.ts`.
  - [x] JSON repository dùng `.mock-data/policy-settings.json` và fallback mặc định nếu file chưa tồn tại.
  - [x] Supabase repository map DB snake_case sang domain camelCase bằng `toDomain`/`toRow`; không gọi Supabase trực tiếp từ page/component.
  - [x] Service public functions đề xuất: `listPolicySettings`, `listActiveApprovalThresholds`, `listActiveRiskGroups`, `resolveApprovalPolicyForProposal`, `upsertApprovalThresholdPolicy`, `setApprovalThresholdPolicyActive`, `upsertRiskGroupConfig`, `setRiskGroupConfigActive`, `policySettingsAuditValue`.
  - [x] Mutations require `settings.manage`; nếu sau này thêm permission riêng như `proposal.configure_flow`, chỉ dùng bổ sung, không thay thế `settings.manage` cho BO Settings trong story này.

- [x] Mở rộng Server Actions và audit
  - [x] UPDATE `src/modules/settings/actions.ts` để parse FormData cho approval policy và risk group.
  - [x] Actions gọi service, tạo audit bằng `createAuditLog`, `revalidatePath("/settings")`, redirect về anchor phù hợp.
  - [x] Audit entity types đề xuất: `approval_threshold_policy`, `risk_group_config`, action keys `policy.approval_threshold.upsert`, `policy.approval_threshold.disable`, `policy.risk_group.upsert`, `policy.risk_group.disable`.
  - [x] Audit payload gồm old/new values, scope snapshot và các field nghiệp vụ đủ để truy vết.

- [x] Xây BO Settings UI cho policy cơ bản
  - [x] UPDATE `src/app/(dashboard)/settings/page.tsx` để load `policySettings` song song với source registry, provider health, role catalog, scope assignments, users, projects.
  - [x] ADD `src/modules/settings/components/policy-settings-panel.tsx`.
  - [x] UI là section/panel/table dense but readable, không card lồng card.
  - [x] Panel gồm hai vùng rõ: `Ngưỡng duyệt tiền` và `Nhóm risk`.
  - [x] Form dùng label tiếng Việt, inline required indicators nếu có pattern sẵn, pending/disable states hợp lý, destructive disable cần confirmation.
  - [x] Table ngưỡng hiển thị target type, amount range, approval level, approver role, required permission, scope, active, updatedBy/updatedAt.
  - [x] Table risk group hiển thị risk key, label, severity, module, sortOrder, default/active, updatedBy/updatedAt.
  - [x] Không hardcode danh sách role/permission trong component; lấy từ `RolePermissionCatalog`.

- [x] Tích hợp policy vào Proposal/Approval backbone ở mức cơ bản
  - [x] UPDATE `src/modules/proposals/services/proposal-service.ts`; thay hardcode `approverRole: "quan_ly_du_an"` trong `submitProposal` bằng resolver policy.
  - [x] Resolver nhận proposal type, amount, module, scope/project và risk signal nếu có; trả `approverRole`, `requiredPermission`, `thresholdPolicyId`, `thresholdLabel`.
  - [x] Nếu không match policy, fallback về seed/default policy trong settings service, không fallback bằng literal rải trong proposal service.
  - [x] Không triển khai multi-step approval engine đầy đủ trong story này; chỉ tạo bước đầu tiên/next step theo policy cơ bản để các story 3.x dùng tiếp.
  - [x] Không bypass `assertCan`, `can`, scoped permission resolver hoặc Proposal repository.

- [x] Tích hợp risk group config vào executive/dashboard context
  - [x] UPDATE `src/modules/executive/services/executive-service.ts` để đọc active policy config và trả `escalationRules`/risk group metadata từ settings config hoặc fallback mặc định.
  - [x] UPDATE `src/modules/executive/types/index.ts` cẩn thận: hardcoded `ExecutiveRiskCategory` union hiện là mock-facing type, không được biến thành nguồn truth duy nhất cho risk group config. Có thể thêm type config `ConfiguredRiskGroupKey = string` hoặc bridge mapper để giảm blast radius.
  - [x] UPDATE `src/modules/executive/mock-data/executive-mock-data.ts` chỉ như fallback seed, không tiếp tục là nguồn policy duy nhất.
  - [x] Nếu `src/modules/dashboard/services/dashboard-service.ts` cần risk summary metadata, chỉ đọc config qua service contract; không tạo logic risk mới ngoài scope story.

- [x] Thêm database migration, RLS và seed/verification cho Supabase mode
  - [x] ADD migration tiếp theo, ví dụ `database/migrations/202605230004_create_policy_settings.sql`.
  - [x] Đề xuất bảng `approval_threshold_policies` và `risk_group_configs` thay vì nhét JSON không cấu trúc nếu triển khai Supabase.
  - [x] Các bảng có `created_by`, `updated_by`, timestamps, `is_active`, scope columns, indexes theo active + scope + type.
  - [x] RLS: authenticated user có `settings.manage` hoặc scoped global `settings.manage` được đọc/ghi; app/service vẫn phải check quyền trước RLS.
  - [x] UPDATE `database/seeds/001_roles_permissions.sql` nếu cần thêm seed policy hoặc permission/module metadata, nhưng không thêm business approval permission vào role `admin`.
  - [x] ADD/UPDATE `database/verification/*policy*` để smoke RLS và default seed đọc được.

- [x] Kiểm thử
  - [x] ADD `tests/unit/policy-settings-service.test.ts` cho create/update/disable threshold, risk group fallback, duplicate range, invalid role/permission, audit value.
  - [x] UPDATE `tests/unit/settings-actions.test.ts` cho actions policy và audit old/new values.
  - [x] UPDATE `tests/unit/proposal-service.test.ts` để `submitProposal` dùng threshold policy thay vì hardcoded `quan_ly_du_an`.
  - [x] UPDATE `tests/unit/executive-service.test.ts` cho risk groups/escalation rules từ config fallback.
  - [x] Nếu dashboard dùng risk config, UPDATE `tests/unit/dashboard-service.test.ts`.
  - [x] Chạy `npm run typecheck`, `npm run lint`, `npm run test`; nếu route/settings UI thay đổi lớn hoặc RLS thay đổi, chạy thêm `npm run test:e2e` hoặc Supabase smoke phù hợp.

### Review Findings

- [x] [Review][Patch] Re-enabling approval policies bypasses duplicate-range validation [src/modules/settings/services/policy-settings-service.ts:340]
- [x] [Review][Patch] Risk-group upsert can disable the last active default risk group [src/modules/settings/services/policy-settings-service.ts:360]
- [x] [Review][Patch] Approval policy upsert allows duplicate policyKey when id is supplied [src/modules/settings/services/policy-settings-service.ts:298]
- [x] [Review][Patch] Escalation risk levels accept low/medium even though policy contract and DB only support high/critical [src/modules/settings/validation.ts:219]
- [x] [Review][Patch] Upsert defaults missing active to true and can reactivate disabled records [src/modules/settings/validation.ts:220]
- [x] [Review][Patch] Escalation checkboxes offer invalid low/medium risk levels [src/modules/settings/components/policy-settings-panel.tsx:329]
- [x] [Review][Patch] Policy settings UI labels and required indicators are not consistently Vietnamese [src/modules/settings/components/policy-settings-panel.tsx:235]
- [x] [Review][Patch] Policy mutation forms lack pending/disabled submit states [src/modules/settings/components/policy-settings-panel.tsx:470]
- [x] [Review][Patch] Last active approval policy can be disabled, making proposal submit fail [src/modules/settings/components/policy-settings-panel.tsx:539]
- [x] [Review][Defer] Approval policy metadata is stored on steps but not enforced by approve/reject/change decisions [src/modules/proposals/services/proposal-service.ts:190] — deferred, belongs to approval-center workflow hardening in Story 3.x
- [x] [Review][Defer] Axis 1 scoped risk alerts are filtered by alert id instead of stage id [src/modules/command-center/services/command-center-service.ts:300] — deferred, belongs to scoped Axis 1 command-center follow-up rather than Story 1.3 policy settings
- [x] [Review][Defer] Role-level Axis 1 access is dropped when no scope assignment exists [src/modules/command-center/services/command-center-service.ts:527] — deferred, belongs to Story 1.2 scoped access semantics rather than Story 1.3 policy settings

- [x] [Review][Patch] Allow authenticated runtime reads of active policy/risk config while keeping writes manager-only [database/migrations/202605230004_create_policy_settings.sql:76]
- [x] [Review][Patch] Policy default rows in migration can fail before role/permission seeds exist [database/migrations/202605230004_create_policy_settings.sql:147]
- [x] [Review][Patch] Policy settings tables lack updated_at triggers [database/migrations/202605230004_create_policy_settings.sql:25]
- [x] [Review][Patch] Default approval threshold ranges leave decimal VND gaps [database/migrations/202605230004_create_policy_settings.sql:147]
- [x] [Review][Patch] Verification script selects nonexistent row_security column [database/verification/004_policy_settings_rls.sql:5]
- [x] [Review][Patch] RLS verification lists metadata but does not assert allow/deny behavior or policy predicates [database/verification/004_policy_settings_rls.sql:40]
- [x] [Review][Patch] Approval policy rows do not enforce approver role and required permission consistency [database/migrations/202605230004_create_policy_settings.sql:12]

## Dev Notes

### Bối Cảnh Nghiệp Vụ

Story 1.3 là nền policy sau role catalog và scope assignment. Mục tiêu là đưa hai nhóm rule dễ bị hardcode nhất ra khỏi code nghiệp vụ:

- Ngưỡng duyệt tiền: PRD yêu cầu ngưỡng duyệt tiền là cấu hình trong BO Settings/Policy, không hardcode trong nghiệp vụ. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-037`]
- Nhóm risk: PRD yêu cầu nhóm risk cấu hình được trong BO Settings, không hardcode cứng; nhóm mặc định gồm Pháp lý, Quy hoạch/kỹ thuật, Approval, Tiến độ, Tài chính, Hồ sơ thiếu, Hệ thống/phân quyền, Vận hành/phối hợp. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-054`, `#FR-055`]
- Mọi thay đổi approval/risk/permission quan trọng phải có audit log. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#NFR-006`]
- Không hardcode role, người duyệt, ngưỡng tiền, nhóm risk hoặc module tương lai. [Source: `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#NFR-008`]

### Hiện Trạng Code Liên Quan

- `src/modules/settings/types.ts` hiện có role/permission catalog và scope assignment types, chưa có policy/risk group types.
- `src/modules/settings/validation.ts` hiện có schemas cho source registry, role template và scope assignment. Pattern tốt: schema sync bằng Zod, kiểm tra cross-field bằng `superRefine`, lookup user/role/project nằm ở service.
- `src/modules/settings/actions.ts` hiện có actions cho source registry, role template, permission mapping và scope assignment. Pattern phải reuse: lấy `getCurrentUser()`, gọi service, `createAuditLog`, `revalidatePath("/settings")`, redirect về anchor.
- `src/modules/settings/services/role-permission-catalog-*` và `scope-assignment-*` đã thiết lập JSON mock + Supabase repository parity. Policy settings nên đi cùng module và cách đặt tên này.
- `src/app/(dashboard)/settings/page.tsx` đã load provider health, role catalog, scope assignments, users, projects; policy panel nên được thêm vào page này thay vì tạo route mới.
- `src/modules/proposals/services/proposal-service.ts` hiện `submitProposal` tạo step với `approverRole: "quan_ly_du_an"` hardcoded. Đây là điểm integration chính để policy threshold có giá trị thực.
- `src/modules/proposals/services/proposal-repository.ts` hiện chỉ là JSON repository, chưa có `selectRepository` Supabase adapter. Story này không bắt buộc harden toàn bộ Proposal Supabase repository, nhưng integration policy không được làm tình trạng đó tệ hơn.
- `src/modules/executive/mock-data/executive-mock-data.ts` hiện hardcode `escalationRules`, risk categories và một số authority thresholds. Dev agent phải biến chúng thành fallback seed/config, không tiếp tục coi mock data là nguồn truth duy nhất.
- `src/modules/executive/types/index.ts` hiện hardcode `ExecutiveRiskCategory` union. Nếu risk group config cần key động, thêm bridge type thay vì refactor toàn bộ executive surface trong một lần.
- `src/lib/permissions/can.ts` hiện có `settings.manage`, `proposal.configure_flow`, `finance.approve`, `proposal.approve` và danh sách business approval permissions. Admin không được nhận business approval permissions theo Story 1.1.
- `database/migrations/202605230002_role_permission_catalog_rpc.sql` và `202605230003_create_scope_assignments.sql` là mẫu gần nhất cho policy migration/RLS.

### Ràng Buộc Kiến Trúc

- Giữ modular monolith: domain module trong `src/modules/*`, cross-cutting auth/permissions/db/audit trong `src/lib/*`, database trong `database/*`. [Source: `_bmad-output/planning-artifacts/architecture.md#Project Organization`]
- Internal UI mutations dùng Server Actions + service layer; Route Handlers chỉ dùng cho integration/public API. [Source: `_bmad-output/planning-artifacts/architecture.md#API & Communication Patterns`]
- Repository implementation đặt trong `services/*-repository.ts`; service orchestration đặt trong `services/*-service.ts`. [Source: `_bmad-output/planning-artifacts/architecture.md#Structure Patterns`]
- DB snake_case ở repository/migration, domain DTO camelCase. [Source: `_bmad-output/planning-artifacts/architecture.md#Data Exchange Formats`]
- Permission check ở action/service trước mutation; UI có unauthorized/empty/loading/error rõ và không render dữ liệu rồi ẩn. [Source: `_bmad-output/planning-artifacts/architecture.md#Process Patterns`]
- Proposal/Approval là backbone dùng chung; không tạo approval flow riêng. [Source: `_bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns Identified`]
- Mock repository và Supabase repository phải giữ cùng service contract. [Source: `_bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines`]

### Ràng Buộc UX

- BO Settings là tool vận hành, không phải landing page. UI cần dense but readable, dễ quét, dùng table/list/panel và form rõ.
- Button hierarchy: primary cho lưu/tạo policy, secondary cho mở/chỉnh chi tiết, destructive cho vô hiệu hóa; destructive mutation cần confirmation. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy`]
- Form phải có label tiếng Việt, required fields rõ, inline validation gần field và giữ ngữ cảnh khi lỗi. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns`]
- Loading/empty/error/unauthorized state cần rõ; không layout shift mạnh. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Loading, Empty, Error and Unauthorized States`]
- Risk state không phụ thuộc màu; nếu có màu/tone thì luôn kèm text label. [Source: `_bmad-output/planning-artifacts/ux-design-specification.md#Risk Map / Deadline Heatmap`]

### Data Contract Gợi Ý

```ts
type PolicyScope = {
  organizationId?: string;
  projectId?: string;
  axisId?: string;
  workstreamId?: string;
  moduleId?: string;
  recordId?: string;
};

type ApprovalThresholdPolicy = PolicyScope & {
  id: string;
  policyKey: string;
  labelVi: string;
  targetType: "proposal" | "finance" | "investment" | "contract" | "general";
  amountMin?: number;
  amountMax?: number;
  currency: "VND";
  approvalLevel: "DEPARTMENT_HEAD" | "PROJECT_DIRECTOR" | "CEO" | "CHAIRMAN";
  approverRoleKey: string;
  requiredPermissionKey: PermissionAction;
  escalateOnRiskLevels?: Array<"high" | "critical">;
  active: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};

type RiskGroupConfig = {
  id: string;
  riskKey: string;
  labelVi: string;
  description?: string;
  defaultSeverity: "low" | "medium" | "high" | "critical";
  moduleId?: string;
  sortOrder: number;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};
```

Recommended behavior:
- Policy match ưu tiên scope cụ thể hơn, sau đó `priority`, sau đó amount range.
- Empty `amountMax` nghĩa là không có trần trên, không phải 0.
- Empty `amountMin` nghĩa là từ 0.
- Không match policy không được làm approval silently fail; service phải trả fallback seed/default hoặc domain error rõ.
- `approverRoleKey` phải là role active trong catalog; `requiredPermissionKey` phải nằm trong permission catalog và không biến role `admin` thành người duyệt nghiệp vụ.
- Risk group config là nguồn label/category cho risk UI/service. Type union hiện có trong executive mock chỉ là compatibility layer.

### Ngữ Cảnh Story Trước

Story 1.2 đã hoàn tất scope assignment foundation và có các điểm cần giữ:
- Reuse role/permission catalog từ Story 1.1, không duplicate role/permission list trong UI.
- Scope assignment là RBAC/scope riêng, business records chỉ lưu scope nghiệp vụ.
- Mutations trong settings require `settings.manage` và ghi audit old/new values.
- JSON mock và Supabase repository phải cùng contract.
- Không tự mở rộng quyền của internal role nếu assignment/policy không explicit.
- Nếu chạm file dirty như `src/modules/settings/actions.ts`, `validation.ts`, `src/lib/permissions/*`, `database/seeds/001_roles_permissions.sql`, phải đọc current content và preserve thay đổi hiện có.

### Ngữ Cảnh Git / Worktree

Recent commit `484589a 2205` mở rộng command center, executive dashboards, RBAC/workspaces, guards, permissions, Supabase policies và tests. Worktree hiện đang dirty với nhiều file do các story trước tạo/cập nhật, bao gồm settings, permissions, meetings, proposals, executive và tests. Dev agent không được revert các thay đổi này.

### Thông Tin Kỹ Thuật Mới Nhất

- Repo hiện resolve `next@15.5.18`, `react@19.2.6`, `react-dom@19.2.6`, `@supabase/supabase-js@2.105.4`, `zod@3.25.76`. Không upgrade dependency trong story này.
- Next.js App Router vẫn hướng dẫn dùng Server Actions cho form/mutation và có thể revalidate UI sau mutation. Giữ pattern action -> service -> audit -> `revalidatePath`. Source: https://nextjs.org/docs/app/getting-started/mutating-data
- React docs hiện khuyến nghị form actions/Server Functions có progressive enhancement và state serializable khi dùng `useActionState`; story này có thể giữ server forms đơn giản như settings panel hiện có, không bắt buộc thêm client state. Source: https://react.dev/reference/react/useActionState
- Supabase RLS vẫn là lớp bảo vệ bảng bằng policy SQL; app-level service check không được bỏ chỉ vì có RLS. Source: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase JS `upsert` hỗ trợ upsert object/array; nếu policy repository dùng upsert, vẫn phải `.select()` để lấy row mới giống pattern scope assignment repository. Source: https://supabase.com/docs/reference/javascript/upsert
- Zod docs hiện vẫn hỗ trợ `parse`, `safeParse`, `refine`/`superRefine`; giữ schema validation ở boundary và service-level lookup riêng. Source: https://zod.dev/packages/zod
- Next.js CVE-2025-66478 đã ảnh hưởng App Router/RSC trên các dòng 15.x chưa patched; fixed 15.5.x là `15.5.7+`. Repo đang ở `15.5.18`, nên không được hạ version hoặc regenerate lockfile xuống bản thấp hơn. Source: https://nextjs.org/blog/CVE-2025-66478

## File Targets

Expected ADD:
- `src/modules/settings/services/policy-settings-service.ts`
- `src/modules/settings/services/policy-settings-repository.ts`
- `src/modules/settings/components/policy-settings-panel.tsx`
- `tests/unit/policy-settings-service.test.ts`
- `database/migrations/202605230004_create_policy_settings.sql`
- `database/verification/004_policy_settings_rls.sql` hoặc tên tương đương nếu thêm RLS verification

Expected UPDATE:
- `src/modules/settings/types.ts`
- `src/modules/settings/validation.ts`
- `src/modules/settings/actions.ts`
- `src/app/(dashboard)/settings/page.tsx`
- `src/modules/proposals/services/proposal-service.ts`
- `src/modules/executive/services/executive-service.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/executive/mock-data/executive-mock-data.ts`
- `src/modules/dashboard/services/dashboard-service.ts` nếu cần expose risk group metadata
- `database/seeds/001_roles_permissions.sql` nếu cần seed permissions/policies
- `database/verification/README.md`
- `tests/unit/settings-actions.test.ts`
- `tests/unit/proposal-service.test.ts`
- `tests/unit/executive-service.test.ts`
- `tests/unit/dashboard-service.test.ts` nếu dashboard dùng policy/risk config

Avoid:
- Không tạo route BO Settings mới khi `/settings` đã là nơi cấu hình.
- Không hardcode threshold trong proposal/executive/dashboard service sau khi đã có policy service.
- Không tạo approval flow/module riêng cho finance/legal/risk.
- Không gọi repository từ component.
- Không làm full delegation policy; Story 1.4 sẽ xử lý thư ký/trợ lý.
- Không làm full Risk Center CRUD; Story 5.x sẽ xử lý risk/blocker lifecycle.

## Tham Chiếu

- `_bmad-output/planning-artifacts/epics.md#Story 1.3`
- `_bmad-output/planning-artifacts/epics.md#Epic 1`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-037`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-054`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-055`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-092`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-094`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#FR-095`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#NFR-006`
- `_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md#NFR-008`
- `_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules`
- `_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Form Patterns`
- `_bmad-output/planning-artifacts/ux-design-specification.md#Button Hierarchy`
- `_bmad-output/implementation-artifacts/1-2-scope-assignment-theo-organization-project-axis-va-workstream.md`
- `src/modules/settings/types.ts`
- `src/modules/settings/validation.ts`
- `src/modules/settings/actions.ts`
- `src/modules/settings/services/role-permission-catalog-service.ts`
- `src/modules/settings/services/scope-assignment-service.ts`
- `src/modules/settings/components/scope-assignment-panel.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- `src/modules/proposals/services/proposal-service.ts`
- `src/modules/proposals/services/proposal-repository.ts`
- `src/modules/executive/services/executive-service.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/executive/mock-data/executive-mock-data.ts`
- `src/modules/dashboard/services/dashboard-service.ts`
- `src/lib/permissions/can.ts`
- `database/migrations/202605230002_role_permission_catalog_rpc.sql`
- `database/migrations/202605230003_create_scope_assignments.sql`
- `database/seeds/001_roles_permissions.sql`
- `tests/unit/scope-assignment-settings.test.ts`
- `tests/unit/proposal-service.test.ts`
- `tests/unit/executive-service.test.ts`

## Ghi Chú Kiểm Tra

- Checklist pass: story có AC rõ, tasks đúng phạm vi, guardrails kiến trúc, file targets, current implementation state, previous story intelligence, UX constraints, test plan, Supabase/RLS direction và latest tech notes.
- Rủi ro còn lại: Proposal repository chưa có Supabase adapter; story này chỉ nên tạo policy repository Supabase-ready và tích hợp proposal service ở mức contract. Nếu scope quá lớn, ưu tiên settings policy service/repository/actions/tests trước, sau đó thêm UI panel và proposal resolver.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-05-23T22:20:50+07:00 - `npm run test -- tests/unit/policy-settings-service.test.ts` failed red because policy settings repository/service did not exist yet.
- 2026-05-23T22:24:43+07:00 - `npm run test -- tests/unit/policy-settings-service.test.ts` passed after adding domain/service/repository.
- 2026-05-23T22:25:33+07:00 - `npm run test -- tests/unit/settings-actions.test.ts` failed red because policy actions were not exported yet.
- 2026-05-23T22:26:14+07:00 - `npm run test -- tests/unit/settings-actions.test.ts` passed after adding policy/risk actions and audit payloads.
- 2026-05-23T22:29:48+07:00 - `npm run test -- tests/unit/proposal-service.test.ts` failed red because submit still used hardcoded `quan_ly_du_an`.
- 2026-05-23T22:30:10+07:00 - `npm run test -- tests/unit/proposal-service.test.ts` passed after switching submit to policy resolver.
- 2026-05-23T22:30:37+07:00 - `npm run test -- tests/unit/executive-service.test.ts` failed red because executive escalation rules still came from mock constant.
- 2026-05-23T22:31:15+07:00 - `npm run test -- tests/unit/executive-service.test.ts` passed after loading policy thresholds/risk groups from settings service.
- 2026-05-23T22:33:52+07:00 - `npm run test` passed: 39 files, 218 tests.
- 2026-05-23T22:36:06+07:00 - Final `npm run test` passed after mock-data fallback comment: 39 files, 218 tests.
- 2026-05-23T22:36:06+07:00 - Final `npm run typecheck` and `npm run lint` passed.
- 2026-05-23T22:33:52+07:00 - `npm run test:e2e` passed: 27 tests, including `/settings`.
- 2026-05-23T23:53:28+07:00 - `npm run test -- tests/unit/policy-settings-service.test.ts tests/unit/settings-actions.test.ts tests/unit/proposal-service.test.ts tests/unit/executive-service.test.ts tests/unit/command-center-service.test.ts` passed after DB/RLS review fixes: 5 files, 31 tests.
- 2026-05-23T23:54:14+07:00 - Final `npm run test` passed after DB/RLS review fixes: 39 files, 221 tests.
- 2026-05-23T23:54:39+07:00 - Final `npm run typecheck` and `npm run lint` passed after DB/RLS review fixes.

### Completion Notes List

- Added policy settings domain, validation, JSON/Supabase repositories, service orchestration, default approval thresholds, default risk groups, duplicate range validation, active default risk guard, and audit snapshot helpers.
- Added BO Settings policy panel with approval threshold and risk group forms/tables, all role/permission choices sourced from `RolePermissionCatalog`.
- Added server actions for policy/risk upsert and active toggles with old/new audit values and `/settings#policy-settings` revalidation/redirect.
- Replaced proposal submit hardcoded approver role with `resolveApprovalPolicyForProposal`, storing approver role, required permission, threshold policy id/label, and approval level on the proposal step.
- Updated executive/command-center context to expose escalation rules and risk group metadata from policy settings; mock escalation rules remain fallback seed only.
- Added Supabase migration and verification SQL for `approval_threshold_policies` and `risk_group_configs` with RLS using `settings.manage` or scoped global `settings.manage`.
- Hardened Supabase policy settings migration/RLS so active config is readable to authenticated runtime flows, writes remain settings-manager only, policy rows validate approver role/permission consistency, and `updated_at` triggers are installed.
- Updated `database/seeds/001_roles_permissions.sql` with idempotent policy/risk seed fallback so default config is inserted whether environments apply Story 1.3 migration before or after baseline role/permission seed.

### File List

- `_bmad-output/implementation-artifacts/1-3-policy-co-ban-cho-nguong-duyet-tien-va-nhom-risk.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `database/migrations/202605230004_create_policy_settings.sql`
- `database/seeds/001_roles_permissions.sql`
- `database/verification/004_policy_settings_rls.sql`
- `database/verification/README.md`
- `src/app/(dashboard)/settings/page.tsx`
- `src/modules/command-center/services/command-center-service.ts`
- `src/modules/command-center/types.ts`
- `src/modules/executive/mock-data/executive-mock-data.ts`
- `src/modules/executive/services/executive-service.ts`
- `src/modules/executive/types/index.ts`
- `src/modules/proposals/services/proposal-service.ts`
- `src/modules/proposals/types.ts`
- `src/modules/settings/actions.ts`
- `src/modules/settings/components/policy-settings-panel.tsx`
- `src/modules/settings/components/policy-submit-button.tsx`
- `src/modules/settings/services/policy-settings-repository.ts`
- `src/modules/settings/services/policy-settings-service.ts`
- `src/modules/settings/types.ts`
- `src/modules/settings/validation.ts`
- `tests/unit/executive-service.test.ts`
- `tests/unit/policy-settings-service.test.ts`
- `tests/unit/proposal-service.test.ts`
- `tests/unit/settings-actions.test.ts`

### Change Log

- 2026-05-23: Implemented Story 1.3 policy settings foundation, BO Settings policy UI, proposal/executive integration, Supabase policy tables/RLS verification, and regression tests.
