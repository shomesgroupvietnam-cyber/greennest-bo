# Implementation Patterns & Consistency Rules

## Pattern Categories Defined

**Critical Conflict Points Identified:**
Các agent dễ lệch nhau ở naming DB/API/code, vị trí service/repository/action/test, format DTO/error/date, permission checks, loading/error UI và mock-vs-Supabase repository behavior.

## Naming Patterns

**Database Naming Conventions:**
- Table/column/index dùng `snake_case`: `projects`, `legal_steps`, `project_id`, `idx_projects_status`.
- FK column dùng `{entity}_id`; không dùng `fk_entity`.
- Timestamp DB dùng `created_at`, `updated_at`, `archived_at`.
- Enum/status value dùng stable lowercase keys: `not_started`, `in_review`, `change_requested`.

**API Naming Conventions:**
- Internal app dùng Server Actions thay vì REST wrapper.
- Route path dùng kebab/lowercase khi cần route mới: `/command-center`, `/project-workbench`.
- Query params dùng camelCase nếu đi vào UI/service DTO; DB mapping ở repository xử lý snake_case.

**Code Naming Conventions:**
- TypeScript domain fields dùng camelCase: `projectId`, `ownerName`, `createdAt`.
- React components dùng PascalCase; file component hiện hữu dùng kebab-case hoặc tên đã có, không đổi hàng loạt.
- Services dùng verb phrase: `createProject`, `listProposals`, `approveProposal`.
- Server actions suffix `Action`: `createProjectAction`.

## Structure Patterns

**Project Organization:**
- Domain module nằm trong `src/modules/{module}` với `types.ts`, `validation.ts`, `actions.ts`, `services/*`, `components/*`.
- Shared cross-cutting code nằm trong `src/lib/auth`, `src/lib/permissions`, `src/lib/db`, `src/lib/storage`, `src/lib/audit`.
- UI primitive/shared component nằm trong `src/components/ui` hoặc `src/components/shared`.
- Tests hiện dùng `tests/unit/*.test.ts`; tiếp tục đặt unit tests ở đó trừ khi repo chuyển hẳn sang co-located tests.

**File Structure Patterns:**
- Repository implementation đặt trong `services/*-repository.ts`.
- Service orchestration đặt trong `services/*-service.ts`.
- SQL migration đặt trong `database/migrations/YYYYMMDDNNNN_description.sql`.
- RLS policy đặt trong `database/policies`.

## Format Patterns

**API Response Formats:**
- Server Actions không trả REST envelope nếu action redirect/revalidate.
- Service layer trả domain object/DTO hoặc throw `Error` với message tiếng Việt thân thiện.
- Route Handlers nếu có public API phải dùng `{ data, error }` nhất quán.

**Data Exchange Formats:**
- JSON/domain DTO dùng camelCase.
- DB rows dùng snake_case và map qua repository `toDomain`/`toRow`.
- Date/time trong TypeScript dùng ISO string; date-only fields giữ `YYYY-MM-DD` khi nghiệp vụ là ngày.
- Missing optional fields trong domain dùng `undefined`; DB persistence dùng `null` khi cần.

## Communication Patterns

**Event System Patterns:**
- Chưa thêm event bus trong MVP.
- “Event” nghiệp vụ quan trọng phải lưu qua audit/decision/proposal history trước.
- Nếu sau này cần event name, dùng dot-case: `proposal.approved`, `meeting.completed`.

**State Management Patterns:**
- Ưu tiên server-rendered data, Server Actions, URL query state và local component state.
- Không thêm global store nếu chỉ phục vụ một page/panel.
- Dashboard state phải đến từ service DTO đã lọc quyền.

## Process Patterns

**Error Handling Patterns:**
- Permission check ở action/service trước mutation: `assertCan(await getCurrentUser(), "permission.key")`.
- Validation bằng Zod ở boundary.
- UI phải có unauthorized/empty/loading/error state rõ, không render dữ liệu rồi ẩn.

**Loading State Patterns:**
- Route-level loading dùng `loading.tsx` khi cần.
- Component-level loading dùng skeleton/empty state giữ layout ổn định.
- Form submit phải disable action chính trong pending state.

## Enforcement Guidelines

**All AI Agents MUST:**
- Không hardcode role name, KPI số liệu, người duyệt hoặc module future trong UI.
- Không bypass service layer để gọi repository từ component/action khác module.
- Không tạo approval flow riêng ngoài Proposal/Approval backbone.
- Không mutate AI output trực tiếp vào domain table; phải qua action proposal + confirmation.
- Giữ mock repository và Supabase repository cùng service contract.

**Pattern Enforcement:**
- Chạy `npm run typecheck`, `npm run lint`, `npm run test` cho thay đổi code.
- Với route/permission/data access mới, thêm hoặc cập nhật unit tests tương ứng.
- Pattern mới phải cập nhật architecture/docs trước khi agent khác triển khai tiếp.

## Pattern Examples

**Good Examples:**
- DB `legal_steps.project_id` -> domain `legalStep.projectId`.
- `createProjectAction` gọi `assertCan`, sau đó gọi `createProject`, rồi `revalidatePath`.
- `SupabaseProjectRepository` map row snake_case sang domain camelCase.

**Anti-Patterns:**
- Component gọi Supabase trực tiếp.
- Dashboard hardcode “3 dự án đỏ”.
- Action chỉ ẩn nút ở UI mà không check permission server-side.
- Tạo `LegalApprovalService` riêng bỏ qua proposal backbone.
