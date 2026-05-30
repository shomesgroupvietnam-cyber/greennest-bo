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

Run `003_scope_assignments_rls.sql` after additionally applying:

7. `database/migrations/202605230003_create_scope_assignments.sql`

The Story 1.2 file verifies:

- `access_scope_assignments` exists with RLS enabled.
- Scope columns, permission keys, active/status timestamps and audit actor columns exist.
- Owner/settings-manager RLS policies are installed.
- Lookup indexes exist for user + active and scope dimensions.

Run `004_policy_settings_rls.sql` after additionally applying:

8. `database/migrations/202605230004_create_policy_settings.sql`

The Story 1.3 file verifies:

- `approval_threshold_policies` and `risk_group_configs` exist with RLS enabled.
- Policy/risk columns, audit actor columns, and lookup indexes exist.
- Active policy/risk config is readable to authenticated users, and inactive/write access stays limited to settings managers.
- Default approval thresholds and default risk groups are readable.
- The `admin` role has not received business approval permissions.
- Temporary verification rows are inserted inside transactions and rolled back.

Run `005_leadership_delegations_rls.sql` after additionally applying:

9. `database/migrations/202605240001_create_leadership_delegations.sql`

The Story 1.4 file verifies:

- `leadership_delegations` exists with RLS enabled.
- Principal/delegate, action keys, scope, validity and audit columns exist.
- Participant/manager read policies and manager write policies are installed.
- Lookup indexes and the action-key validation trigger exist.
- `delegation.manage` is seeded, and `thu_ky_tro_ly` has not received approval/delegation management permissions.

Run `006_module1_acceptance_seed.sql` after additionally applying:

10. `database/migrations/202605240002_add_proposal_delegation_metadata.sql`
11. `database/seeds/003_module1_acceptance_demo.sql`

The Story 1.5 file verifies:

- Module 1 acceptance personas, 4 project scenarios and scoped assignments exist.
- Assistant scope has no `finance.view`, and assistant role has no approval/delegation management permissions.
- Approval threshold/risk settings, active and expired delegation fixtures, overdue approval, missing/confidential documents, Axis 2/3 placeholders and meeting follow-up data are present.
