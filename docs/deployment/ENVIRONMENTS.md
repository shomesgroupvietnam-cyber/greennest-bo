# Environment Strategy

## Local

Purpose:

- Developer implementation.
- Mock data or local Supabase.
- Fast iteration.

Rules:

- Demo seed data allowed.
- Debug logging allowed.
- No real client project files.

## Preview/Staging

Purpose:

- QA and owner review.
- Vercel preview deployments.
- Supabase staging database.

Rules:

- Use staging Supabase project.
- Use realistic demo data.
- Do not connect production integrations unless explicitly approved.

## Production

Purpose:

- Real users and real project data.

Rules:

- No demo seed data.
- Private document storage.
- Backups enabled.
- Role and permission changes audited.
- Production migrations reviewed before apply.

## Environment Variable Ownership

| Variable | Local | Staging | Production |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | localhost | preview/staging URL | production URL |
| `GREENNEST_REPOSITORY_MODE` | empty or `mock` | `supabase` | `supabase` |
| `NEXT_PUBLIC_SUPABASE_URL` | local/staging | staging | production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | local/staging | staging | production |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | staging secret | production secret |
| `DATABASE_URL` | optional | staging DB | production DB |
| `OPENAI_API_KEY` | optional | staging secret | production secret |
| `DISCOVERY_RUNNER_ID` | optional local label | staging runner label | production runner label |

When `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing locally, the app uses the mock session fallback and file-backed mock repositories under `.mock-data`.

Repository mode:

- Empty `GREENNEST_REPOSITORY_MODE`: auto-selects `mock` without Supabase public env vars and `supabase` when they are configured.
- `mock`: always uses file-backed repositories under `.mock-data`.
- `supabase`: uses Supabase repositories and expects migrations, seeds, and RLS policies to be applied.

## Scheduled Discovery Execution

Local:

- Use `npm run discovery:run-due` manually against mock repositories.
- Do not rely on long-running local cron for source governance.

Preview/Staging:

- Preferred validation is a manual GitHub Actions dispatch or protected one-off worker run.
- Staging may test Vercel Cron or server cron after Supabase RLS and provider credentials are validated.

Production:

- Use exactly one hosted scheduler mechanism for discovery jobs.
- Protect any HTTP scheduler endpoint with a secret.
- Monitor failed runs and retry exhaustion through `knowledge_discovery_run_logs`.
- Keep imported results in `pending_review`; production scheduler must not auto-approve or auto-index external sources.
