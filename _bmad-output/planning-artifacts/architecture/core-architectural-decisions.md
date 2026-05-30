# Core Architectural Decisions

## Decision Priority Analysis

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

## Data Architecture

- Database: PostgreSQL via Supabase.
- Repository: service contracts ổn định, repository adapter cho mock/file-backed và Supabase.
- Migration: mọi thay đổi production đi qua `database/migrations`; `schema.sql` chỉ là entrypoint/tổng quan.
- Modeling: business records lưu scope nghiệp vụ (`organization_id`, `project_id`, `axis_id`, `workstream_id`, `owner_id`), không nhét role/permission vào từng record.
- Caching: chưa thêm cache layer riêng; ưu tiên derived service DTO, SQL views/materialized views sau khi dashboard volume chứng minh cần.

## Authentication & Security

- Auth: Supabase Auth qua `src/lib/auth`.
- Authorization: centralized permission keys trong `src/lib/permissions`, deny-by-default.
- Route/security guard: direct URL không quyền trả 403.
- RLS: bắt buộc mirror app-level scope trước production rollout.
- Audit: ghi cho project/task/document/legal/proposal/approval/decision/risk/meeting/export/permission/AI-confirmed mutation.

## API & Communication Patterns

- Internal UI mutation: Next.js Server Actions + service layer.
- External/public integration: Route Handlers.
- Error handling: service trả lỗi typed/domain-level; UI có unauthorized, validation, empty, loading, retry states.
- Rate limiting: cần cho AI Gateway, web search/discovery và external-facing endpoints; chưa cần global rate limiter cho mọi server action trong MVP.
- Service communication: module gọi service/use-case, không gọi repository module khác trực tiếp.

## Frontend Architecture

- Routing: giữ App Router và dashboard route hiện có; `/axis-1` tiếp tục redirect về Command Center view khi phù hợp.
- State management: ưu tiên server data + URL/filter state + local component state; chưa thêm Redux/Zustand.
- Component strategy: foundation UI, enterprise patterns, rồi role workspace composition.
- UX constraints: Vietnamese-first, dense but readable, WCAG 2.1 AA, responsive, badge có chữ, KPI/risk/approval drill-down được.
- AI UX: contextual panel/action, không dùng chatbot chung thay workflow chính.

## Infrastructure & Deployment

- Hosting: Vercel + Supabase.
- Runtime baseline: repo local đang chạy Node v24.15.0, npm 11.12.1; dependency baseline lấy từ `package.json`.
- Production readiness gate: live Supabase RLS validation, storage upload/download, proposal Supabase repository validation, staging smoke tests.
- CI/CD direction: typecheck, lint, unit tests, e2e smoke, Supabase validation scripts trước release.
- Observability: trước mắt audit logs + run logs; monitoring/logging production chi tiết để story hardening riêng.

## Decision Impact Analysis

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
