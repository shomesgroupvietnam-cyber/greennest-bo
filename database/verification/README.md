# Staging Verification SQL

Run `001_staging_validation.sql` after applying:

1. `database/migrations/202605160001_create_mvp_core_schema.sql`
2. `database/migrations/202605170005_create_knowledge_center.sql`
3. `database/migrations/202605170006_create_knowledge_chunks.sql`
4. `database/migrations/202605170007_create_external_search_logs.sql`
5. `database/seeds/001_roles_permissions.sql`
6. `database/policies/001_mvp_rls.sql`

The file is read-only and is intended for the Supabase SQL editor or `psql` connected to staging.

Expected results:

- All core tables are listed.
- `roles` count is at least `18`.
- `permissions` count is at least `54`.
- Missing role and missing permission result sets are empty.
- `rls_enabled` is `true` for all listed app tables.
- Policy counts exist for MVP tables.
- `project-documents` appears after the private Storage bucket is created.
- After a manual project creation test, the latest project should show `legal_step_count = 12`.

Run `002_external_isolation_rls.sql` after additionally applying:

4. `database/seeds/002_rls_external_isolation_seed.sql`

The Sprint 8C file simulates authenticated users from the deterministic seed and verifies:

- `nha_thau` can read only assigned project/task/document scope and no legal steps.
- `tu_van` can read only assigned review project/task/document/legal scope.
- `viewer` can read assigned scope but cannot insert tasks.
- Internal PM/admin users can read the expected seeded MVP records.
