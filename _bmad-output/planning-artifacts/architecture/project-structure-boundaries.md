# Project Structure & Boundaries

## Complete Project Directory Structure

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

## Architectural Boundaries

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

## Requirements to Structure Mapping

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

## Integration Points

**Internal Communication:**
Page -> action/loader -> permission/auth -> service -> repository -> DTO/component.

**External Integrations:**
Supabase Auth/PostgreSQL/Storage, Vercel deployment, MCP/Web Search intake, AI model provider behind AI Gateway.

**Data Flow:**
User request -> session + permission scope -> service DTO -> UI render; mutation -> action -> service validation -> repository -> audit/history -> revalidate route.

## Development Workflow Integration

- Unit tests live in `tests/unit`.
- E2E tests live in `tests/e2e`.
- Scripts in `package.json` remain the workflow baseline: `typecheck`, `lint`, `test`, `test:e2e`.
- Deployment structure stays Vercel + Supabase; production readiness depends on RLS/storage/proposal repository validation.
