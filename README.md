# GreenNest BuildFlow

GreenNest BuildFlow is a scalable web platform for housing development, real-estate investment and construction enterprise operations.

The platform starts with project, task, document, legal checklist and dashboard management, then expands into enterprise governance, design, construction, finance, contracts, HR, reporting, integrations and AI-assisted project intelligence.

Access control is role-based and project-aware. The scalable role model is defined in [blueprint/12-auth-roles-permissions.md](./blueprint/12-auth-roles-permissions.md), including Admin, Tổng giám đốc, Phó tổng giám đốc, Giám đốc dự án, Quản lý dự án, Tổ trưởng, Kế toán, Thiết kế, Pháp lý, Thi công and external collaborator roles.

## Tech Stack

Primary stack:

- Frontend: Next.js App Router, React, TypeScript.
- UI: Tailwind CSS, shadcn/ui, lucide-react.
- Backend layer: Next.js Server Actions/API routes.
- Database: PostgreSQL via Supabase.
- Auth: Supabase Auth.
- Storage: Supabase Storage.
- Validation: Zod.
- Forms: React Hook Form.
- Testing: Vitest, Testing Library, Playwright.
- Deployment: Vercel + Supabase.

Future scale option:

- Dedicated backend: NestJS + TypeScript.
- Queue/workers: BullMQ/Redis or managed queue.
- Search: Postgres full-text first, Meilisearch/OpenSearch later if needed.
- AI service: isolated service/worker behind a permission-aware API.

## Repository Structure

```text
blueprint/        Long-term product, architecture, API, data and roadmap docs
docs/             Development, deployment and operations documentation
src/              Application source code
database/         SQL schema, migrations, seed data, views and RLS policies
infra/            Deployment and infrastructure notes/config placeholders
scripts/          Developer and operations scripts
tests/            Unit, integration and E2E tests
public/           Public assets
```

## Current Status

This repo is organized as a scalable project foundation. Application implementation should follow:

1. `docs/DOCS_INDEX.md`
2. `docs/DOCUMENTATION_STANDARD.md`
3. `blueprint/README.md`
4. Relevant blueprint file for the domain
5. `docs/architecture/ARCHITECTURE_OVERVIEW.md`
6. `docs/design/DESIGN_STANDARD.md`

Root-level `requirement.md`, `design.md`, `architecture.md`, and `milestone.md` are MVP execution snapshots. Long-term platform decisions live under `blueprint/`.

Current phase/status is tracked in [docs/product/PHASE_STATUS.md](./docs/product/PHASE_STATUS.md). That file is the canonical current implementation status register.

AI Assistant strategy is centralized in [blueprint/14-ai-assistant-strategy.md](./blueprint/14-ai-assistant-strategy.md). The user-facing `/ai` screen is labeled “Trợ lý AI” and uses business presets, project dropdowns, citations, project code/name result context and human-confirmed action proposals while keeping gateway/job/worker details internal. Admin settings include provider health checks for AI, embeddings and Web Search.

Enterprise Governance now has first-wave RBAC expansion plus a shared Internal Proposal and Approval workflow before deep finance, investment, HR, contract, QA/QC and safety modules.

Completed implementation now covers Phase 0, Phase 1, Phase 1.5 foundation assets, Sprint 8/8B/8C validation/hardening assets, Phase 2 Sprint 1-4, the governed Knowledge Center Foundation, approved-only text chunk indexing/retrieval, vector retrieval adapter boundary, controlled Web Search intake with mock fallback/config-gated Tavily, BO-managed Web Search source registry settings, Discovery Scheduler foundation, simplified AI Assistant UX, first-wave Enterprise Governance workspaces and the Internal Proposal/Approval foundation.

Production email invitations, real Supabase Storage upload/download, live Supabase RLS validation, external collaborator production rollout, PDF/DOCX report export, hosted Web Discovery cron wiring, production pgvector semantic search and hardened AI operations are intentionally left for later work.

## Development

Install dependencies:

```bash
npm install
```

Run local dev server:

```bash
npm run dev
```

Open the app shell:

```text
http://localhost:3000/dashboard
```

Seed demo data for a realistic MVP review:

```bash
npm run seed:demo
```

This writes file-backed mock data under `.mock-data` for demo users, projects, tasks, documents, legal checklist progress, meetings/decisions, report snapshots, proposals, project memberships and audit placeholders.

Run checks:

```bash
npm run lint
npm run typecheck
npm run test
```

Switch the mock local role with:

```bash
MOCK_CURRENT_ROLE=pho_tong_giam_doc
NEXT_PUBLIC_MOCK_ROLE=pho_tong_giam_doc
```

If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not configured, the app automatically uses the mock session fallback for local development.

Repository mode:

- Empty `GREENNEST_REPOSITORY_MODE`: auto-selects mock mode without Supabase env vars and Supabase mode when they are configured.
- `GREENNEST_REPOSITORY_MODE=mock`: forces file-backed `.mock-data` repositories.
- `GREENNEST_REPOSITORY_MODE=supabase`: uses Supabase repositories and expects migrations, seed data and RLS policies to be applied.

Useful demo roles:

- `admin`: full MVP access, users and settings visible.
- `pho_tong_giam_doc`: executive oversight, no user/settings management.
- `to_truong`: task execution focus, own-task update only.
- `ke_toan`: finance-ready role with read access to MVP operations.
- `quan_ly_tai_chinh`: finance management workspace and proposal approvals.
- `dau_tu_phat_trien`: investment development workspace and investment proposal creation.
- `quan_ly_hop_dong`: contract workspace and contract proposal review/approval.
- `thiet_ke`: design/document role with task/document write access.
- `viewer`: read-only navigation and no mutation controls.

See [docs/development/README.md](./docs/development/README.md) for detailed setup.

## Deployment

Target deployment:

- Vercel for Next.js.
- Supabase for Auth, PostgreSQL and Storage.

See [docs/deployment/README.md](./docs/deployment/README.md).
