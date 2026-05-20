# Tech Stack

## Current Stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript |
| Frontend | Next.js App Router, React |
| UI | Tailwind CSS, shadcn/ui |
| Icons | lucide-react |
| Backend | Next.js Server Actions/API routes |
| Auth | Supabase Auth |
| Authorization | App-level RBAC with workspace/project membership |
| Database | PostgreSQL via Supabase |
| Storage | Supabase Storage |
| Validation | Zod |
| Forms | React Hook Form |
| Unit Test | Vitest |
| Component Test | Testing Library |
| E2E Test | Playwright |
| Deployment | Vercel + Supabase |
| AI Assistant | Permission-aware service layer with Knowledge Center and RAG |
| External Search | MCP Web Search adapter/intake, source review before RAG |

## Future Stack Options

| Need | Candidate |
| --- | --- |
| Dedicated backend | NestJS + TypeScript |
| Background jobs | BullMQ + Redis or managed queue |
| Search | Postgres full-text, then Meilisearch/OpenSearch |
| Analytics | SQL views/materialized views, later warehouse |
| AI | Dedicated AI service/worker with permission-aware retrieval |

## Stack Decision

Start with a Next.js full-stack modular monolith. Keep module and service boundaries clean so the system can evolve into a dedicated backend or selected services later.

For the full architecture overview, use `docs/architecture/ARCHITECTURE_OVERVIEW.md`.

## Auth and Roles

Auth is Supabase-ready through the session abstraction in `src/lib/auth/session.ts`. Local development falls back to the mock session when Supabase public env vars are missing. Business authorization must use centralized RBAC permission helpers and the scalable role model in `blueprint/12-auth-roles-permissions.md`.

## AI Assistant

AI Assistant architecture is defined in `blueprint/14-ai-assistant-strategy.md`.

The technical direction is:

- TypeScript service layer.
- Knowledge Center for reviewed/approved sources.
- MCP Web Search only as source discovery/intake.
- Permission-aware context builder.
- Approved RAG sources with citations.
- Human-confirmed mutations.
