# 02 - Scalable Architecture

## 1. Architecture Direction

GreenNest BuildFlow should start as a modular monolith and evolve toward service boundaries only when scale requires it.

Recommended path:

```text
Phase 1: Next.js full-stack modular monolith + Supabase
Phase 2: Next.js frontend + dedicated backend modules when needed
Phase 3: Service boundaries for AI, reporting, document processing and integrations
```

This avoids premature complexity while keeping clean module boundaries from day one.

## 2. Recommended Stack

### MVP to Growth

- Language: TypeScript.
- Frontend: Next.js App Router.
- Backend layer: Next.js Server Actions/API routes.
- UI: Tailwind CSS + shadcn/ui.
- Database: PostgreSQL.
- Auth: Supabase Auth.
- Storage: Supabase Storage/S3-compatible storage.
- Validation: Zod.
- Forms: React Hook Form.
- Tests: Vitest + Playwright.
- Deploy: Vercel + Supabase.

### Scale-up Option

When backend complexity grows:

- Backend: NestJS + TypeScript.
- API: REST first, GraphQL only if data composition becomes complex.
- Queue: BullMQ/Redis or managed queue.
- Search: Postgres full-text first, then Meilisearch/OpenSearch if needed.
- Analytics: materialized views first, warehouse later.
- AI services: isolated worker/service.

## 3. Modular Monolith Structure

Each module owns its UI, service contract, types and tests.

```text
modules/
  projects/
  tasks/
  documents/
  legal/
  meetings/
  design/
  construction/
  finance/
  reports/
  users/
  dashboard/
  ai/
```

Shared infrastructure:

```text
lib/
  auth/
  db/
  permissions/
  storage/
  validation/
  audit/
  notifications/
constants/
types/
components/
```

Rule:

- UI components cannot directly own database queries.
- Business logic belongs in services.
- Database access belongs in repositories or server-only data functions.
- Shared constants must not import UI code.

## 4. Layering

```text
Presentation Layer
  Next.js pages, layouts, components

Application Layer
  server actions, use cases, workflow orchestration

Domain Layer
  business rules, status transitions, permission checks

Data Layer
  repositories, Supabase client, SQL, storage

Infrastructure Layer
  auth, audit logs, notifications, file processing, AI clients
```

## 5. Backend Language Decision

Use TypeScript for backend programming.

Reason:

- Shared types between frontend and backend.
- Faster MVP delivery.
- Strong ecosystem for Next.js, Supabase, Zod and React.
- Smooth upgrade path to NestJS if a dedicated backend is needed.

Decision:

```text
Backend language: TypeScript
Initial backend runtime: Next.js Server Actions/API routes
Future backend option: NestJS + TypeScript
```

## 6. Database Architecture

Start with normalized PostgreSQL tables.

Principles:

- Keep project-centric relational data normalized.
- Use JSONB only for flexible metadata, snapshots and audit values.
- Use indexes for `project_id`, status, due dates and owner/assignee fields.
- Use soft delete/archive for operational records.
- Use migrations from the beginning.

Scale patterns:

- Materialized views for dashboard metrics.
- Read models for reports.
- Background jobs for heavy report generation.
- Event/audit logs for history.

## 7. Authentication and Authorization

Initial:

- Supabase Auth.
- App profile table.
- Scalable role keys from `12-auth-roles-permissions.md`.
- Minimum implementation roles: admin, tổng giám đốc, phó tổng giám đốc, giám đốc dự án, quản lý dự án, tổ trưởng, pháp lý, kế toán, thiết kế, kỹ thuật, thi công, thư ký/trợ lý, viewer.
- Permission helper: `can(user, action, resource)`.

Scale:

- Project-level membership.
- Team/workspace membership.
- Role-based access control.
- Attribute-based checks for sensitive finance/legal data.
- External collaborator roles.

Authorization must be enforced server-side, not only hidden in UI.

## 8. File and Document Storage

Initial:

- Store files in Supabase Storage.
- Store metadata in `documents`.
- Use URLs only through controlled access.

Scale:

- Private buckets.
- Signed URLs.
- Virus scanning if needed.
- OCR/document extraction worker.
- Versioned file storage.
- Retention policies.

## 9. Audit and Event Model

Audit logs should be implemented early for important mutations.

Tracked actions:

- Project create/update/archive.
- Task create/update/status change.
- Document create/update/version change.
- Legal step status change.
- User role change.
- Finance mutation when finance module exists.

Future event model:

- Domain events such as `project.created`, `task.overdue`, `document.missing`, `legal_step.blocked`.
- Events can drive notifications, reports, AI checks and audit history.

## 10. Reporting Architecture

Short term:

- Query services compute dashboard metrics.
- Use SQL views for common metrics.

Medium term:

- Materialized views for portfolio dashboard.
- Scheduled report generation.
- Report snapshots for historical comparison.

Long term:

- Analytics warehouse if data volume and reporting complexity justify it.

## 11. AI Architecture

AI should be isolated behind an application service.

```text
AI UI
  -> AI application service
  -> permission/data retrieval layer
  -> prompt/context builder
  -> model provider
  -> response with citations/source references
```

Rules:

- AI can read only data the user has permission to access.
- AI recommendations should cite project data/documents when possible.
- AI must not mutate production data without explicit user confirmation.
- Long document processing should run in background jobs.

## 12. Integration Architecture

Potential integrations:

- Email.
- Calendar.
- Cloud storage.
- Accounting software.
- E-signature.
- Government/legal portals if available.
- CAD/BIM document viewers.

Integration rule:

- Wrap every external system in an adapter.
- Keep business logic outside adapters.
- Store sync state and external IDs separately.

## 13. Testing and Quality Strategy

Minimum:

- Unit tests for business rules and permissions.
- Service tests for workflow logic.
- Integration tests for data access where possible.
- E2E tests for critical user journeys.

Critical E2E journeys:

- Login.
- Create project.
- Create task.
- Add document.
- Update legal checklist.
- View dashboard.
- Change user role.

## 14. Deployment Environments

Recommended environments:

- Local.
- Preview/staging.
- Production.

Environment requirements:

- Separate database per environment.
- Separate storage bucket per environment.
- Seed data for local/staging.
- Protected production migrations.

## 15. Evolution Triggers

Move beyond the initial modular monolith when:

- Report generation blocks user requests.
- AI processing requires long-running jobs.
- Integrations need retry queues.
- Database read load requires materialized/read models.
- Team size requires strict module ownership.
- Security/compliance requires dedicated backend controls.
