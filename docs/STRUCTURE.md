# Repository Structure

```text
green_nest_buider_web/
  blueprint/
  docs/
    architecture/
    design/
    development/
    deployment/
    operations/
    product/
  src/
    app/
    components/
    constants/
    hooks/
    lib/
    modules/
    services/
    types/
  database/
    migrations/
    policies/
    seeds/
    views/
  infra/
    supabase/
    vercel/
    future/
  scripts/
  tests/
    unit/
    integration/
    e2e/
  public/
    assets/
```

## Read Order

Start with:

- [DOCS_INDEX.md](./DOCS_INDEX.md)
- [DOCUMENTATION_STANDARD.md](./DOCUMENTATION_STANDARD.md)
- [product/PHASE_STATUS.md](./product/PHASE_STATUS.md)

## `blueprint/`

Long-term source of truth for product, requirements, architecture, API contract, data model, roadmap and agent rules.

Also owns AI Assistant strategy, Knowledge Center, MCP Web Search intake, RAG strategy, role permissions and role workspaces.

## `docs/`

Practical engineering documentation for development, deployment, operations and architecture decisions.

Use [DOCUMENTATION_STANDARD.md](./DOCUMENTATION_STANDARD.md) to decide whether a new document belongs in `blueprint/`, `docs/`, a module folder or root.

`docs/DOCS_INDEX.md` is the entrypoint. `docs/product/PHASE_STATUS.md` owns current implementation status and production blockers.

## `src/app/`

Next.js App Router routes. Keep route files thin. Move business logic into modules/services.

## `src/components/`

Shared UI components:

- `layout`: app shell, sidebar, header.
- `shared`: reusable app-level components.
- `ui`: shadcn/ui components.

## `src/modules/`

Domain modules. Each module can own:

- `components`.
- `services`.
- `types.ts`.
- `validation.ts`.
- `constants.ts` if module-specific.
- `tests` if colocated tests are preferred.

## `src/lib/`

Cross-cutting infrastructure:

- auth.
- db.
- permissions.
- storage.
- validation.
- audit.
- notifications.

## `database/`

Database schema, migrations, RLS policies, seed data and dashboard/reporting views.

## `infra/`

Deployment and infrastructure notes for Vercel, Supabase and future components.

## `tests/`

Global tests, especially E2E and integration tests.
