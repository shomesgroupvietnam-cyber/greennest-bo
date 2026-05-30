# Development Guide

## Local Requirements

- Node.js 20 LTS or newer.
- npm.
- Supabase project for auth/database/storage when moving past mock data.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open:

```text
http://localhost:3000/dashboard
```

Seed demo data:

```bash
npm run seed:demo
```

The seed command recreates `.mock-data/project-core.json`, `.mock-data/task-management.json`, `.mock-data/document-center.json`, `.mock-data/document-requirements.json`, `.mock-data/meetings-decisions.json`, `.mock-data/reports.json`, `.mock-data/knowledge-center.json`, `.mock-data/knowledge-candidates.json`, `.mock-data/source-registry-settings.json`, `.mock-data/external-search-logs.json`, `.mock-data/knowledge-discovery.json`, `.mock-data/role-permission-catalog.json`, `.mock-data/scope-assignments.json`, `.mock-data/policy-settings.json`, `.mock-data/leadership-delegations.json` and `.mock-data/users.json` with deterministic demo data.

Module 1 acceptance demo personas:

| Role | Mock role env | Stable user id | What to verify |
| --- | --- | --- | --- |
| Chu tich/Super Admin | `super_admin` | `chairman-01` | Global scope, sensitive finance, final approval threshold |
| Admin smoke | `admin` | `mock-founder` | Settings and seed administration, no business approval permissions |
| CEO | `tong_giam_doc` | `ceo-01` | Executive/company scope and delegated principal |
| Giam doc du an | `giam_doc_du_an` | `project-director-01` | Riverside project scope and finance-visible data |
| Truong bo phan | `to_truong` | `department-head-01` | Garden scoped read/workstream data without finance visibility |
| Thu ky/Tro ly | `thu_ky_tro_ly` | `assistant-01` | Create/submit proposal on behalf through active delegation, cannot approve/reject/request-change |
| Nguoi xem | `viewer` | `viewer-01` | Read-only scoped Garden data and mutation denial |

Manual acceptance scenarios in mock/file-backed mode:

- Run `npm run seed:demo`, then start the app with the target `MOCK_CURRENT_ROLE`.
- Compare Riverside, Garden, Skyline and Axis 2/3 Lab data to verify project/scope differences.
- Verify `finance.view` behavior using `giam_doc_du_an` or `super_admin` as finance-visible users and `thu_ky_tro_ly` or `to_truong` as finance-hidden users.
- Verify negative permission cases: out-of-scope project access returns no data/no permission, viewer cannot mutate, and assistant cannot approve/reject/request-change on behalf.
- Verify positive delegation: `assistant-01` has active `proposal.create` delegation for `ceo-01` on Riverside only.

Supabase/local-staging equivalent seed:

- Apply `database/seeds/003_module1_acceptance_demo.sql` only in local/staging/demo environments after baseline migrations and `001_roles_permissions.sql`.
- Run `database/verification/006_module1_acceptance_seed.sql` to check personas, scope assignments, policy/risk settings, delegation, overdue approval, legal/missing document and Axis 2/3 placeholders.
- The SQL seed uses deterministic `public.users` UUIDs with `auth_user_id = null`; map them to real Supabase Auth users only for live manual staging tests.

## Auth/RBAC

The app resolves the current session through `src/lib/auth/session.ts`.

- If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured, the session layer is ready to read Supabase Auth.
- If they are missing, local development uses a mock current user resolved from:

```bash
MOCK_CURRENT_ROLE=admin
NEXT_PUBLIC_MOCK_ROLE=admin
```

Use any role key from `blueprint/12-auth-roles-permissions.md`, such as `pho_tong_giam_doc`, `to_truong`, `ke_toan`, `thiet_ke` or `viewer`.

Recommended QA roles:

| Role | What to verify |
| --- | --- |
| `admin` | Full MVP navigation, user invite, role update, settings access |
| `pho_tong_giam_doc` | Executive dashboard/project oversight, users/settings hidden |
| `to_truong` | Task-focused navigation, no project/document/legal admin actions |
| `ke_toan` | Finance-ready read access without project mutation actions |
| `thiet_ke` | Document/design-oriented access, no finance/admin actions |
| `nha_thau` | Contractor portal with assigned package/task/document scope |
| `viewer` | Read-only pages, create/edit controls hidden |

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

Run due Knowledge Discovery topics manually:

```bash
npm run discovery:run-due
```

This script finds enabled daily/weekly discovery topics that are due, applies a soft lock, runs the same governed discovery service as Run Now, records retry metadata for failures and imports only allowlisted non-duplicate results as `pending_review` Knowledge Candidates.

## Current Sprint Scope

The current app includes the Sprint 0 foundation, Sprint 1 Project Core, Sprint 2 Task Management, Sprint 2.5 Auth/RBAC alignment, Sprint 3 Document Center, Sprint 4 Legal Checklist Lite, Sprint 5 Dashboard, Sprint 6 Auth/Users/Roles Basic, Sprint 7 QA/Polish, Sprint 8 Role Workspaces, Phase 2 Reporting Lite, the Knowledge Center Foundation, approved-only RAG indexing foundation and the first Enterprise Governance foundation:

- Next.js App Router routes for `/login`, `/dashboard`, `/projects`, `/tasks`, `/documents`, `/legal`, `/meetings`, `/reports`, `/knowledge`, `/users` and `/settings`.
- Vietnamese app shell with permission-aware sidebar, header and mobile navigation.
- shadcn/ui-compatible component structure under `src/components/ui`.
- Supabase-ready environment placeholders and client factory.
- Zod-ready validation under `src/lib/validation`.
- Vitest and Playwright configuration.
- Project Core routes for list, create, detail, edit and archive.
- File-backed mock persistence in `.mock-data/project-core.json`.
- Generated project codes and automatic 12-step legal checklist initialization.
- Task Management routes for list, create, detail and edit/update.
- File-backed task persistence in `.mock-data/task-management.json`.
- Task filters for project, status, priority, overdue, upcoming and mock "việc của tôi".
- Scalable role constants, centralized permission keys, role default screens and server-side permission checks for project/task mutations.
- Document Center routes for list, create, detail and edit/update.
- File-backed document persistence in `.mock-data/document-center.json`.
- Document filters for project, document type, status and owner.
- External URL document support plus a Supabase Storage upload placeholder.
- Missing and needs-update document states surfaced in list/detail/project pages.
- Server-side permission checks for document mutations.
- Document requirement templates by project type in `.mock-data/document-requirements.json`.
- Project document readiness detects missing required documents from project type templates and existing document `docType` records.
- Document approval workflow with submit-for-review, approve, reject/request-update metadata and audit placeholder entries.
- Mock document version history in `.mock-data/document-center.json` plus Supabase-ready `document_versions` mapping.
- Legal Checklist Lite route for global filtering by project, status and assignee.
- Legal steps reuse the 12 default records initialized in `.mock-data/project-core.json`.
- Legal updates support status, assignee, due date, completed date, notes and related documents.
- Blocked legal steps require notes and blocked/waiting-authority states are visually highlighted.
- Server-side permission checks for legal mutations.
- Dashboard summary service under `src/modules/dashboard/services`.
- Dashboard KPI cards for projects, overdue/upcoming tasks, missing/needs-update documents, blocked/waiting legal steps and overall progress.
- Priority alerts and quick lists sourced from existing mock repositories.
- Permission-aware dashboard visibility based on centralized RBAC helpers.
- Supabase-ready session abstraction with mock fallback when Supabase env vars are missing.
- Improved login page and logout skeleton.
- File-backed user persistence in `.mock-data/users.json`.
- Users page for mock invite, role update and project membership assignment.
- Role-change and invite audit log placeholder records.
- Role-specific default routes for admin, executive, project, team, legal, finance, design, technical, construction, assistant, contractor, consultant and viewer workspaces.
- First-wave Enterprise Governance roles add investment development, finance management, HR/admin, QA/QC, safety, internal audit and contract-management workspaces.
- Permission-aware navigation is centralized in `src/lib/permissions/navigation.ts`.
- Workspace route guards block direct URL access when the current role does not own that workspace.
- Contractor and consultant workspace data is limited to assigned mock tasks/documents/project memberships.
- Reporting Lite routes for list, generator and detail views.
- Report snapshots for weekly project summary, document readiness and legal status are stored in `.mock-data/reports.json`.
- Report generation uses current project/task/document/readiness/legal/meeting data and keeps existing snapshots unchanged when source data changes.
- Knowledge Center routes for list, create/import, detail and review/approval workflow.
- File-backed governed knowledge persistence in `.mock-data/knowledge-center.json`.
- Knowledge records track source, module, jurisdiction, lifecycle status, confidence, review metadata and RAG eligibility.
- Only approved knowledge records are marked RAG-eligible and indexed into deterministic text chunks.
- Knowledge retrieval returns approved chunks with citation metadata and permission-aware access-level filtering.
- Embedding provider/vector retrieval interfaces exist with a local mock provider for tests.
- Knowledge intake route `/knowledge/intake` uses mock fallback or config-gated Tavily provider, BO-managed allowed source registry and pending-review import workflow.
- BO settings route `/settings` lets `settings.manage` users manage Web Search source registry domains used by Knowledge intake.
- Knowledge discovery route `/knowledge/discovery` lets permitted users manage discovery topics and run a manual Web Search intake now.
- Discovery Run Now and `npm run discovery:run-due` use the same provider, allowlist, duplicate URL checks and pending-review Knowledge Candidate queue.
- Discovery Scheduler foundation includes due-topic selection, soft locks and retry metadata; hosted cron wiring is intentionally deferred.
- AI route `/ai` is user-facing as “Trợ lý AI”, with role/module presets for finance, legal, documents, executive and field/contractor use cases.
- AI Assistant UX hides job mode, priority, projectId text entry and rate-limit payload from normal users; projects are selected by code/name dropdown and technical details are visible only to admin/super_admin.
- AI requests default to fast processing, use approved RAG by default when the role has `ai.use_rag`, and create action proposals only when the user explicitly chooses “Đề xuất việc cần làm”.
- AI result and proposal review pages show project code/name when available, business-friendly proposal labels and admin-only raw technical payloads.
- Admin/super_admin can open `/settings` and run `Kiểm tra provider` to validate AI, embedding and Web Search provider status without exposing API keys. Friendly messages cover missing config, quota/billing, invalid key/model, timeout and rate-limit states.
- Proposal routes `/proposals`, `/proposals/new` and `/proposals/[proposalId]` provide a shared internal request workflow for investment, finance, contract, HR, QA/QC, safety and general requests.
- Proposal service supports create, submit, request change, approve and reject with centralized proposal permissions and mock persistence in `.mock-data/proposals.json`.
- Real embedding APIs, production pgvector semantic search and AI answer generation remain deferred.
- Shared user-friendly empty, loading, not-found and error states for the dashboard shell.
- Demo seed command for realistic MVP review data.
- Playwright smoke tests for key MVP routes.

Business features such as real Supabase Storage upload/download, production email invitations, legal submissions/authority responses, notification delivery, PDF/DOCX report export, advanced portfolio reporting and configurable proposal approval flows are intentionally deferred to later sprints. Supabase schema/RLS assets exist, but live staging validation remains required before production rollout.

## Development Rules

- Use TypeScript for all application code.
- Keep UI labels Vietnamese-first.
- Put business statuses and roles in `src/constants`.
- Implement access control through centralized permission helpers, not scattered role-name checks.
- Follow `blueprint/12-auth-roles-permissions.md` for admin, executive, department, team and external collaborator roles.
- Put domain logic in `src/modules/*/services` or `src/lib`.
- Do not query database directly from presentational components.
- Use `project_id` for project-scoped data.
- Keep future modules present but do not implement them before roadmap phase.

## Module Ownership

```text
src/modules/projects     Project core
src/modules/tasks        Task management
src/modules/documents    Document center
src/modules/legal        Legal checklist and submissions
src/modules/meetings     Meetings and decisions
src/modules/knowledge    Governed Knowledge Center and future RAG source control
src/modules/design       Future design management
src/modules/construction Future construction execution
src/modules/finance      Future finance/commercial control
src/modules/reports      Reporting Lite snapshots
src/modules/ai           Future AI assistance
```
