---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-green_nest_buider_web-2026-05-23/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
  - "_bmad-output/planning-artifacts/truc-1-mvp-final-bmad-ready.md"
  - "_bmad-output/planning-artifacts/axis-1-requirement-brd-architecture-draft.md"
  - "docs/architecture/ARCHITECTURE_OVERVIEW.md"
  - "docs/architecture/TECH_STACK.md"
  - "docs/design/DESIGN_STANDARD.md"
  - "docs/product/PHASE_STATUS.md"
workflowType: "architecture"
lastStep: 8
status: "complete"
completedAt: "2026-05-23"
project_name: "green_nest_buider_web"
user_name: "Admin"
date: "2026-05-23"
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
Dự án tập trung vào Module 1 - Lãnh đạo trong Trục 1, nhưng phải nằm trong kiến trúc mở cho 5 module Trục 1: Lãnh đạo, Tìm kiếm & phát triển dự án, Pháp lý, Thiết kế - Quy hoạch - Kỹ thuật - BIM, và Đề xuất - Họp - Phê duyệt nội bộ.

Các nhóm chức năng chính gồm executive dashboard, morning briefing, common center, private workspace, approval center, decision & assignment center, risk & alert center, one meeting engine, history/archive, executive AI center, BO settings tối thiểu và secretary/assistant workspace. Kiến trúc phải hỗ trợ drill-down từ KPI/risk/approval tới dữ liệu nguồn, xử lý approval/decision/audit, và giữ 12 bước pháp lý cũ như checklist/workflow bên trong 5 module thay vì 12 menu độc lập.

**Non-Functional Requirements:**
Các NFR chi phối kiến trúc gồm permission enforcement ở server/service layer, deny-by-default RBAC theo role + scope + action, 403 cho truy cập trực tiếp không hợp lệ, audit log cho mutation quan trọng, dữ liệu executive được filter trước khi trả UI, AI chạy trong permission context, meeting visibility theo RBAC/project/org/participant scope, và UI hỗ trợ multi-organization, multi-project, multi-role, multi-assignment.

**Scale & Complexity:**
- Primary domain: full-stack enterprise operational/project governance web application.
- Complexity level: enterprise.
- Estimated architectural components: 16-20 gồm app shell/workspaces, command center, executive, projects, axis-1, legal, documents, tasks, proposals/approvals, meetings/decisions, risks/alerts, dashboards/reports, permissions/auth, audit, AI/knowledge, repository/storage adapters.

### Technical Constraints & Dependencies

Nền kỹ thuật đã chốt là Next.js App Router + TypeScript modular monolith, Tailwind CSS + shadcn/ui + Radix + lucide-react, Zod, React Hook Form, Vitest, Testing Library, Playwright, Vercel + Supabase. Service/repository boundary phải giữ ổn định để chuyển giữa mock/file-backed mode và Supabase mode.

Kiến trúc hiện tại ưu tiên modular monolith, không tách microservices. Proposal/Internal Approval là workflow backbone dùng chung. AI dùng một Coordinator ban đầu, module AI chỉ là mode/retriever/tooling dưới Coordinator. Supabase RLS, Storage thật, proposal Supabase repository validation và configurable approval routing vẫn là gap/hardening.

### Cross-Cutting Concerns Identified

- Permission, scope filtering và 403 phải nhất quán trên route, server action, service, repository/RLS.
- Audit/history/versioning áp dụng cho approval, decision, risk, meeting, export, permission và AI-confirmed mutations.
- Proposal/approval phải là backbone dùng chung, không để mỗi module tự tạo approval flow riêng.
- Meeting phải dùng one meeting engine với nhiều meeting type, visibility và linkage tới project/axis/module/risk/task/decision/approval.
- Dashboard/KPI/risk/readiness phải derive từ structured records, không hardcode ở UI.
- UX phải role-first, dense but readable, Vietnamese-first, responsive, WCAG 2.1 AA, không dùng dashboard chung cho mọi vai trò.
- AI phải có citation, chỉ đọc dữ liệu được phép, action proposal cần human confirmation và domain permission re-check.
- Data model phải project-centric nhưng vẫn cho phép proposal/meeting/decision cấp tổ chức hoặc liên dự án.
- Kiến trúc phải không khóa cứng đúng 5 module vĩnh viễn, nhưng MVP chỉ expose 5 module Trục 1.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack enterprise web application trên Next.js App Router + TypeScript modular monolith. Dự án hiện là brownfield repo đã có cấu trúc Next.js, Tailwind, shadcn/ui, Supabase-ready auth/database, service/repository boundary và test stack.

### Starter Options Considered

**Next.js create-next-app**
Phù hợp nhất cho nền tảng App Router, TypeScript, Tailwind, ESLint và alias. Đây là baseline tương thích với repo hiện tại, nhưng không nên scaffold lại vì dự án đã tồn tại.

**Supabase with-supabase template**
Phù hợp cho dự án mới cần cookie-based auth, TypeScript và Tailwind với Supabase. Repo hiện tại đã có Supabase abstraction, migrations, RLS assets và staging validation assets, nên chỉ dùng làm tham chiếu, không thay thế cấu trúc hiện có.

**shadcn/ui CLI**
Phù hợp để bổ sung component vào existing project. Repo đã có `components.json`, style `new-york`, RSC, TSX, Tailwind config và alias. Tiếp tục dùng shadcn CLI để thêm component foundation khi cần.

**Create T3 App**
Có giá trị cho greenfield app cần tRPC/Prisma/Drizzle/NextAuth. Không chọn vì repo đã định hướng Supabase, Server Actions/service layer và không cần tRPC.

**Turborepo**
Có giá trị khi tách monorepo nhiều app/package. Không chọn cho giai đoạn này vì architecture đã chốt modular monolith, chưa có nhu cầu monorepo.

### Selected Starter: Existing Next.js App Router Brownfield Baseline

**Rationale for Selection:**
Không scaffold lại. Tiếp tục trên repo hiện tại là lựa chọn đúng vì nền tảng đã khớp với yêu cầu: Next.js App Router, TypeScript strict, Tailwind/shadcn-ready UI, Supabase-ready persistence, RBAC/permission helpers, module boundaries, Vitest, Playwright và Vercel deployment direction.

**Initialization Command:**

```bash
# Không áp dụng cho repo hiện tại.
# Nếu tạo greenfield repo tương đương từ đầu, baseline tham chiếu là:
pnpm create next-app [project-name]
pnpm dlx shadcn@latest init
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript strict, React, Next.js App Router, Node-based full-stack runtime.

**Styling Solution:**
Tailwind CSS, shadcn/ui, Radix primitives, lucide-react, CSS variables và component alias.

**Build Tooling:**
Next.js build/dev pipeline, ESLint, TypeScript compiler checks, Vercel-compatible deployment.

**Testing Framework:**
Vitest cho unit tests, Testing Library cho component behavior, Playwright cho e2e smoke tests.

**Code Organization:**
Giữ modular monolith: `src/modules/*` cho domain modules; `src/lib/*` cho auth, permissions, db, storage, audit; `src/components/*` cho shared UI/layout; `database/*` cho schema, migrations, policies, seeds, verification.

**Development Experience:**
Dùng scripts hiện có: `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`. Feature mới phải giữ mock/file-backed mode và Supabase-ready repository boundary trừ khi story chốt production-only.

**Note:** Không tạo implementation story để initialize project. Story đầu tiên sau architecture nên tập trung vào hardening/expanding architecture trên repo hiện có.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Tiếp tục modular monolith trên Next.js App Router + TypeScript, không chuyển microservices.
- PostgreSQL/Supabase là persistence target; mock/file-backed mode vẫn được giữ qua repository boundary.
- Permission enforce theo deny-by-default, server/service layer trước UI, RLS là lớp defense-in-depth trước production.
- Internal Proposal/Approval là workflow backbone dùng chung.
- Server Actions dùng cho form/mutation nội bộ; Route Handlers chỉ dùng cho public/API integration hoặc callback.

**Important Decisions (Shape Architecture):**
- Data model project-centric nhưng cho phép proposal/meeting/decision cấp organization hoặc multi-project.
- Validation dùng Zod ở boundary: form/action/service input.
- Frontend dùng role-first workspace composition, không hardcode mỗi role thành một dashboard riêng biệt.
- AI đi qua AI Gateway/Coordinator, citation bắt buộc cho nội dung nhạy cảm, mutation chỉ qua action proposal + human confirmation.

**Deferred Decisions (Post-MVP):**
- Không nâng cấp Next 15.3.2 lên Next 16 trong architecture workflow này; tạo story upgrade riêng nếu cần.
- Không thêm Prisma/Drizzle/tRPC lúc này.
- Không tách monorepo/Turborepo.
- Không làm full configurable approval engine, production storage và hosted AI/search jobs nếu chưa có story riêng.

### Data Architecture

- Database: PostgreSQL via Supabase.
- Repository: service contracts ổn định, repository adapter cho mock/file-backed và Supabase.
- Migration: mọi thay đổi production đi qua `database/migrations`; `schema.sql` chỉ là entrypoint/tổng quan.
- Modeling: business records lưu scope nghiệp vụ (`organization_id`, `project_id`, `axis_id`, `workstream_id`, `owner_id`), không nhét role/permission vào từng record.
- Caching: chưa thêm cache layer riêng; ưu tiên derived service DTO, SQL views/materialized views sau khi dashboard volume chứng minh cần.

### Authentication & Security

- Auth: Supabase Auth qua `src/lib/auth`.
- Authorization: centralized permission keys trong `src/lib/permissions`, deny-by-default.
- Route/security guard: direct URL không quyền trả 403.
- RLS: bắt buộc mirror app-level scope trước production rollout.
- Audit: ghi cho project/task/document/legal/proposal/approval/decision/risk/meeting/export/permission/AI-confirmed mutation.

### API & Communication Patterns

- Internal UI mutation: Next.js Server Actions + service layer.
- External/public integration: Route Handlers.
- Error handling: service trả lỗi typed/domain-level; UI có unauthorized, validation, empty, loading, retry states.
- Rate limiting: cần cho AI Gateway, web search/discovery và external-facing endpoints; chưa cần global rate limiter cho mọi server action trong MVP.
- Service communication: module gọi service/use-case, không gọi repository module khác trực tiếp.

### Frontend Architecture

- Routing: giữ App Router và dashboard route hiện có; `/axis-1` tiếp tục redirect về Command Center view khi phù hợp.
- State management: ưu tiên server data + URL/filter state + local component state; chưa thêm Redux/Zustand.
- Component strategy: foundation UI, enterprise patterns, rồi role workspace composition.
- UX constraints: Vietnamese-first, dense but readable, WCAG 2.1 AA, responsive, badge có chữ, KPI/risk/approval drill-down được.
- AI UX: contextual panel/action, không dùng chatbot chung thay workflow chính.

### Infrastructure & Deployment

- Hosting: Vercel + Supabase.
- Runtime baseline: repo local đang chạy Node v24.15.0, npm 11.12.1; dependency baseline lấy từ `package.json`.
- Production readiness gate: live Supabase RLS validation, storage upload/download, proposal Supabase repository validation, staging smoke tests.
- CI/CD direction: typecheck, lint, unit tests, e2e smoke, Supabase validation scripts trước release.
- Observability: trước mắt audit logs + run logs; monitoring/logging production chi tiết để story hardening riêng.

### Decision Impact Analysis

**Implementation Sequence:**
1. Hardening proposal/approval repository and RLS validation.
2. Normalize executive/dashboard DTOs around project, proposal, meeting, decision, risk and document readiness.
3. Build role workspace patterns from shared enterprise components.
4. Add audit/history coverage where mutation gaps remain.
5. Add AI proposal review only after permission and citation paths are stable.

**Cross-Component Dependencies:**
- Permission model affects navigation, routes, services, RLS, AI retrieval and export.
- Proposal backbone affects executive approvals, module requests, meeting follow-ups and audit.
- Meeting engine affects decisions, tasks, approvals, risk and executive timeline.
- Dashboard accuracy depends on structured records and service-derived metrics.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
Các agent dễ lệch nhau ở naming DB/API/code, vị trí service/repository/action/test, format DTO/error/date, permission checks, loading/error UI và mock-vs-Supabase repository behavior.

### Naming Patterns

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

### Structure Patterns

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

### Format Patterns

**API Response Formats:**
- Server Actions không trả REST envelope nếu action redirect/revalidate.
- Service layer trả domain object/DTO hoặc throw `Error` với message tiếng Việt thân thiện.
- Route Handlers nếu có public API phải dùng `{ data, error }` nhất quán.

**Data Exchange Formats:**
- JSON/domain DTO dùng camelCase.
- DB rows dùng snake_case và map qua repository `toDomain`/`toRow`.
- Date/time trong TypeScript dùng ISO string; date-only fields giữ `YYYY-MM-DD` khi nghiệp vụ là ngày.
- Missing optional fields trong domain dùng `undefined`; DB persistence dùng `null` khi cần.

### Communication Patterns

**Event System Patterns:**
- Chưa thêm event bus trong MVP.
- “Event” nghiệp vụ quan trọng phải lưu qua audit/decision/proposal history trước.
- Nếu sau này cần event name, dùng dot-case: `proposal.approved`, `meeting.completed`.

**State Management Patterns:**
- Ưu tiên server-rendered data, Server Actions, URL query state và local component state.
- Không thêm global store nếu chỉ phục vụ một page/panel.
- Dashboard state phải đến từ service DTO đã lọc quyền.

### Process Patterns

**Error Handling Patterns:**
- Permission check ở action/service trước mutation: `assertCan(await getCurrentUser(), "permission.key")`.
- Validation bằng Zod ở boundary.
- UI phải có unauthorized/empty/loading/error state rõ, không render dữ liệu rồi ẩn.

**Loading State Patterns:**
- Route-level loading dùng `loading.tsx` khi cần.
- Component-level loading dùng skeleton/empty state giữ layout ổn định.
- Form submit phải disable action chính trong pending state.

### Enforcement Guidelines

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

### Pattern Examples

**Good Examples:**
- DB `legal_steps.project_id` -> domain `legalStep.projectId`.
- `createProjectAction` gọi `assertCan`, sau đó gọi `createProject`, rồi `revalidatePath`.
- `SupabaseProjectRepository` map row snake_case sang domain camelCase.

**Anti-Patterns:**
- Component gọi Supabase trực tiếp.
- Dashboard hardcode “3 dự án đỏ”.
- Action chỉ ẩn nút ở UI mà không check permission server-side.
- Tạo `LegalApprovalService` riêng bỏ qua proposal backbone.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
green_nest_buider_web/
├── src/
│   ├── app/                    # Next.js routes, layouts, route-level guards
│   │   ├── (auth)/login
│   │   ├── (dashboard)/         # authenticated app surfaces
│   │   ├── command-center
│   │   ├── executive
│   │   └── pending-access
│   ├── modules/                # domain modules
│   │   ├── ai
│   │   ├── axis-1
│   │   ├── command-center
│   │   ├── dashboard
│   │   ├── documents
│   │   ├── executive
│   │   ├── knowledge
│   │   ├── legal
│   │   ├── meetings
│   │   ├── projects
│   │   ├── proposals
│   │   ├── reports
│   │   ├── settings
│   │   ├── tasks
│   │   ├── users
│   │   └── workspaces
│   ├── lib/                    # cross-cutting foundations
│   │   ├── audit
│   │   ├── auth
│   │   ├── db
│   │   ├── notifications
│   │   ├── permissions
│   │   ├── storage
│   │   └── validation
│   ├── components/             # shared UI/layout components
│   ├── constants/
│   ├── scripts/
│   └── types/
├── database/
│   ├── migrations/
│   ├── policies/
│   ├── seeds/
│   ├── verification/
│   └── views/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── docs/
├── blueprint/
├── infra/
├── scripts/
├── public/
└── _bmad-output/
```

### Architectural Boundaries

**API Boundaries:**
- Internal UI mutations live in `src/modules/*/actions.ts`.
- Public/external APIs use App Router Route Handlers only when integration requires URL endpoints.
- Routes do not call Supabase/repositories directly; they call services/actions.

**Component Boundaries:**
- `src/app` composes pages and route shells.
- `src/modules/*/components` owns domain UI.
- `src/components/ui` and `src/components/shared` hold reusable primitives/states.

**Service Boundaries:**
- `services/*-service.ts` owns business orchestration.
- `services/*-repository.ts` owns mock/Supabase persistence mapping.
- Cross-module business flow must go through service contracts, not direct repository access.

**Data Boundaries:**
- DB snake_case stays inside repository adapters.
- Domain DTOs use camelCase.
- RLS policies live in `database/policies`; migrations live in `database/migrations`.

### Requirements to Structure Mapping

**Module 1 - Lãnh đạo:**
- Routes: `src/app/command-center`, `src/app/executive/*`, selected `(dashboard)` workspace routes.
- Modules: `src/modules/command-center`, `src/modules/executive`, `src/modules/dashboard`.
- Tests: `command-center-service.test.ts`, `executive-service.test.ts`, `dashboard-service.test.ts`.

**Approval / Proposal:**
- Module: `src/modules/proposals`.
- DB: `202605190001_create_proposals.sql`.
- Tests: `proposal-service.test.ts`.
- Boundary: all internal approval flows use Proposal/Approval backbone.

**Meeting / Decision:**
- Module: `src/modules/meetings`.
- Executive pages: `src/app/executive/meetings`, `src/app/executive/decision-log`.
- DB: `202605230001_add_meeting_engine_fields.sql`.

**Legal / Documents / Tasks / Projects:**
- Modules: `src/modules/legal`, `documents`, `tasks`, `projects`.
- Routes: `(dashboard)/legal`, `documents`, `tasks`, `projects`.
- Tests remain in `tests/unit/*-service.test.ts`.

**AI / Knowledge:**
- Modules: `src/modules/ai`, `src/modules/knowledge`.
- AI action proposal path must remain separate from direct domain mutations.

### Integration Points

**Internal Communication:**
Page -> action/loader -> permission/auth -> service -> repository -> DTO/component.

**External Integrations:**
Supabase Auth/PostgreSQL/Storage, Vercel deployment, MCP/Web Search intake, AI model provider behind AI Gateway.

**Data Flow:**
User request -> session + permission scope -> service DTO -> UI render; mutation -> action -> service validation -> repository -> audit/history -> revalidate route.

### Development Workflow Integration

- Unit tests live in `tests/unit`.
- E2E tests live in `tests/e2e`.
- Scripts in `package.json` remain the workflow baseline: `typecheck`, `lint`, `test`, `test:e2e`.
- Deployment structure stays Vercel + Supabase; production readiness depends on RLS/storage/proposal repository validation.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Các quyết định lõi tương thích: Next.js App Router + TypeScript modular monolith, Supabase/PostgreSQL, Server Actions, repository boundary, RBAC/RLS và Proposal backbone không mâu thuẫn nhau. Không có quyết định nào yêu cầu microservice, ORM mới, global state mới hoặc scaffold lại repo.

**Pattern Consistency:**
Naming, service/repository boundary, DB snake_case -> domain camelCase, Zod validation, Server Actions và permission checks khớp với codebase hiện tại.

**Structure Alignment:**
Cấu trúc `src/app`, `src/modules`, `src/lib`, `database`, `tests` hỗ trợ đầy đủ các boundary đã chốt.

### Requirements Coverage Validation ✅

**Feature Coverage:**
Module Lãnh đạo, Approval Center, Decision/Assignment, Risk/Alert, Meeting, History, AI, BO Settings tối thiểu và Secretary/Assistant đều có module hoặc boundary tương ứng.

**Functional Requirements Coverage:**
FRs được hỗ trợ qua `command-center`, `executive`, `dashboard`, `proposals`, `meetings`, `tasks`, `documents`, `legal`, `ai`, `knowledge`, `settings`, `users`, `workspaces`.

**Non-Functional Requirements Coverage:**
RBAC, 403, server-side filtering, audit, AI permission context, responsive enterprise UI, WCAG direction, multi-project/multi-role/multi-assignment đều đã được phản ánh trong quyết định và pattern.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Critical decisions đã có rationale và baseline version/context. Next 16/TypeScript 6 được ghi nhận là current external state nhưng không upgrade trong workflow này.

**Structure Completeness:**
Project structure đủ cụ thể cho brownfield implementation. Không liệt kê từng page file vì repo đã tồn tại, nhưng boundary và ownership rõ.

**Pattern Completeness:**
Các conflict point chính cho AI agents đã được chốt: naming, structure, format, service communication, error/loading, permission, AI mutation, mock/Supabase parity.

### Gap Analysis Results

**Critical Gaps:**
Không có critical gap chặn implementation architecture.

**Important Gaps:**
- Supabase RLS live validation vẫn cần story/hardening riêng.
- Proposal Supabase repository validation và configurable approval routing chưa hoàn chỉnh.
- Production storage upload/download chưa hoàn chỉnh.
- Audit UI và notification vẫn chưa production-complete.

**Nice-to-Have Gaps:**
- Có thể bổ sung ADR riêng cho upgrade Next/React/TypeScript.
- Có thể bổ sung deeper risk module/data model khi scope được duyệt.
- Có thể bổ sung observability/monitoring production plan.

### Validation Issues Addressed

Không có mâu thuẫn kiến trúc cần sửa ngay. Các gap còn lại đã được phân loại là production hardening hoặc post-MVP scope, không chặn việc dùng tài liệu này để tạo story triển khai tiếp.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** high

**Key Strengths:**
- Brownfield architecture matches existing code instead of forcing a new scaffold.
- Permission, service, repository and RLS boundaries are explicit.
- Proposal/Approval backbone prevents duplicated approval workflows.
- AI mutation safety is clearly constrained.
- Patterns are specific enough for multiple AI agents to implement consistently.

**Areas for Future Enhancement:**
- Production RLS/storage/proposal validation.
- Configurable approval routing.
- Notifications and audit UI.
- Dedicated ADR for dependency upgrades.
- Deeper risk/workflow/stage-gate model after scope approval.

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented.
- Use implementation patterns consistently across all components.
- Respect project structure and boundaries.
- Refer to this document for all architectural questions.

**First Implementation Priority:**
Harden Proposal/Approval Supabase repository and RLS validation, then normalize executive/dashboard DTOs around project, proposal, meeting, decision, risk and document readiness.
