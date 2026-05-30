# Scripts

Use this folder for project scripts such as:

- Database migration helpers.
- Seed data setup.
- Report generation utilities.
- Maintenance tasks.

Scripts must be documented and safe for local/staging/production use.

Available scripts:

- `seed-demo.mjs`: writes deterministic local file-backed demo data under `.mock-data`, including Module 1 acceptance personas, role-permission catalog, scope assignments, policy/risk settings, leadership delegations, proposal/approval fixtures, governed Knowledge Center examples and approved text chunks. Set `GREENNEST_MOCK_DATA_DIR=/tmp/output` to write seed output to a temporary directory for tests.
- `run-e2e.mjs`: starts a local Next.js dev server for Playwright smoke checks.
- `supabase-staging-smoke.mjs`: read-only Supabase staging validation for core tables, baseline roles, permissions and the document bucket.
- `npm run validate:ai-knowledge:staging`: guarded staging write validation for AI/Knowledge flows. It refuses to run unless `GREENNEST_REPOSITORY_MODE=supabase`, Supabase URL/service role key are set, `ALLOW_STAGING_WRITES=true`, and `NODE_ENV` is not `production`. It creates deterministic `staging-validation-*` records for source registry, Knowledge Candidate, Discovery and AI job validation.
- `npm run discovery:run-due`: runs the TypeScript Discovery Scheduler entrypoint for due enabled discovery topics. It uses the same governed discovery service as Run Now and keeps imports as pending-review Knowledge Candidates.
