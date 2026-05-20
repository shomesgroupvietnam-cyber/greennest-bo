# Supabase Staging Validation

This checklist validates the Phase 1.5 Supabase foundation against a real staging Supabase project. It does not add product features and should be completed before production hardening.

## Apply Order

Use a fresh staging Supabase project or a disposable staging database.

1. Create the Supabase project.
2. Configure Auth for email/password or the intended staging provider.
3. Apply `database/migrations/202605160001_create_mvp_core_schema.sql`.
4. Apply `database/migrations/202605170001_add_decision_task_link.sql`.
5. Apply `database/migrations/202605170002_create_document_requirements.sql`.
6. Apply `database/migrations/202605170003_add_document_approval_fields.sql`.
7. Apply `database/migrations/202605170004_create_report_runs.sql`.
8. Apply `database/migrations/202605170005_create_knowledge_center.sql`.
9. Apply `database/migrations/202605170006_create_knowledge_chunks.sql`.
10. Apply `database/migrations/202605170007_create_external_search_logs.sql`.
11. Apply `database/migrations/202605170008_create_knowledge_candidates.sql`.
12. Apply `database/migrations/202605170009_create_ai_jobs.sql`.
13. Apply `database/migrations/202605170010_add_ai_action_proposal_decisions.sql`.
14. Apply `database/migrations/202605170011_add_ai_provider_usage_controls.sql`.
15. Apply `database/migrations/202605170012_add_ai_response_validation.sql`.
16. Apply `database/migrations/202605170013_prepare_pgvector_knowledge_embeddings.sql`.
17. Apply `database/migrations/202605170014_add_external_search_provider_metadata.sql`.
18. Apply `database/migrations/202605170015_create_source_registry_entries.sql`.
19. Apply `database/seeds/001_roles_permissions.sql`.
20. Apply `database/policies/001_mvp_rls.sql`.
21. Create private Storage bucket `project-documents`.
22. Apply `database/policies/002_project_document_storage.sql`.
23. Apply optional staging-only isolation seed `database/seeds/002_rls_external_isolation_seed.sql`.
24. Create Supabase Auth users for manual testing.
25. Map Auth users to profiles by updating `public.users.auth_user_id`.
26. Run `database/verification/001_staging_validation.sql`.
27. Run `database/verification/002_external_isolation_rls.sql`.
28. Configure the app environment with `GREENNEST_REPOSITORY_MODE=supabase`.
29. Deploy or run the app against the staging Supabase project.
30. For guarded AI/Knowledge write validation, set `ALLOW_STAGING_WRITES=true` only in staging and run `npm run validate:ai-knowledge:staging`.

## Required Environment

```text
GREENNEST_REPOSITORY_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=<staging Supabase URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging anon key>
SUPABASE_SERVICE_ROLE_KEY=<staging service role key, server-side only>
DATABASE_URL=<staging database connection string>
ALLOW_STAGING_WRITES=true
```

For local fallback validation, remove `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or set:

```text
GREENNEST_REPOSITORY_MODE=mock
```

## Verification SQL

Run:

```text
database/verification/001_staging_validation.sql
```

Expected results:

- All MVP tables are present.
- All 18 role keys are present.
- All 54 permission keys are present.
- `role_permissions` contains seeded mappings.
- RLS is enabled on app tables.
- Policy rows exist for app tables.
- `project-documents` exists and is private after bucket setup.
- After creating a project manually through the app, the newest project has 12 legal steps.

For Sprint 8C external isolation, also run:

```text
database/verification/002_external_isolation_rls.sql
```

Expected results:

- Contractor sees only `RLS-ASG-001`, one assigned task and one owned document.
- Contractor sees zero legal steps.
- Consultant sees only assigned review project/task/document scope.
- Viewer has read permissions only and task insert is denied by RLS.
- Internal PM and admin can read both seeded RLS projects.

## Smoke Script

Run this read-only staging smoke check after env vars are configured:

```bash
npm run smoke:supabase
```

The script checks Supabase connectivity, baseline roles, baseline permissions, role-permission mappings and core table readability using the configured Supabase key. It does not create, update or delete data.

## Manual Test Cases

Use a staging admin profile unless the test states otherwise.

| Case | Steps | Expected result |
| --- | --- | --- |
| Create project | Open `/projects/new`, enter required project fields, submit. | Project appears in `/projects`; a unique code is stored if omitted; 12 legal steps exist for the project. |
| Create task | Open `/tasks/new`, choose the staging project, enter title/status/priority/due date, submit. | Task appears in `/tasks` and project task section/filter. |
| Create document metadata | Open `/documents/new`, choose project, enter title/type/status/version and external URL, submit. | Document appears in `/documents`; no storage upload is required. |
| Document approval | Open a document detail as a user with `document.update`, submit for review, then sign in as a user with `document.approve` and approve or request update with notes. | Approval status, reviewer, reviewed date and audit log are updated; rejected documents move to `needs_update`. |
| Update legal step | Open `/legal`, filter to project, update status/assignee/due date/notes. | Legal step updates persist; blocked status requires notes. |
| User role permission check | Change a staging user role to `viewer`, sign in as that user, open create/edit pages. | Viewer can read permitted pages but cannot see or perform mutation controls. |
| Knowledge Center workflow | Open `/knowledge/new` as a user with `knowledge.create`, create/import a source, submit it for review, then approve/reject as a user with `knowledge.approve`. | Source moves through imported/pending review/approved or rejected states; only approved records are RAG-eligible. |
| Knowledge RAG indexing | Open an approved Knowledge Center item as a user with `knowledge.review` or `knowledge.approve`, click Reindex, then inspect `public.knowledge_chunks`. | Approved source creates deterministic text chunks with citation metadata; pending/rejected/expired sources do not appear in normal retrieval. |
| Knowledge vector readiness | Inspect `public.knowledge_chunks.embedding`, `embedding_model` and `embedded_at`. | Fields exist as JSONB/text/timestamp placeholders. pgvector is intentionally not enabled until a production embedding model and dimension are selected. |
| Knowledge external intake | Open `/knowledge/intake` as a user with `knowledge.create` or `knowledge.review`, run a mock search and import one candidate. | Candidate is created as `pending_review`, is not RAG-eligible and a row is recorded in `external_search_logs`. |
| Provider health check | Sign in as `admin` or `super_admin`, open `/settings`, click `Kiểm tra provider`. | AI provider, embedding provider and Web Search provider show friendly status cards without exposing API keys. Missing key, quota, invalid model/key, timeout and rate-limit cases show user-facing messages instead of stack traces. |
| AI real provider UX | Configure `AI_PROVIDER=openai_compatible`, `OPENAI_API_KEY`, `AI_CHAT_MODEL` and `AI_PROVIDER_TIMEOUT_MS`, then ask a question at `/ai`. Repeat with missing key, invalid model, very low timeout and known quota/rate-limit scenarios. | `/ai/jobs/[jobId]` shows `Kết quả Trợ lý AI`, friendly provider errors and no stack trace. Admin-only technical details remain collapsed. |
| Tavily Web Search UX | Configure `WEB_SEARCH_PROVIDER=tavily`, `WEB_SEARCH_API_KEY` and `WEB_SEARCH_TIMEOUT_MS`, then run `/knowledge/intake` and `/knowledge/discovery`. Repeat with missing/invalid key, very low timeout and rate-limit scenarios. | Intake/discovery show friendly error state or failed run log. Imported results remain `pending_review` Knowledge Candidates only. |
| AI/Knowledge staging write runner | With `GREENNEST_REPOSITORY_MODE=supabase`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOW_STAGING_WRITES=true` and non-production `NODE_ENV`, run `npm run validate:ai-knowledge:staging`. | Source registry insert/read/toggle passes; Knowledge Candidate remains `pending_review`; Discovery topic/run log/candidate are created; AI interaction/job reaches `succeeded` or friendly `failed`; service-role table access is reported. |
| Contractor isolation | Create a `nha_thau` user with one assigned project/task/document, then open `/projects`, `/tasks`, `/documents` and direct URLs for unassigned records. | Contractor sees only assigned records and direct unassigned detail URLs show unauthorized/not-found behavior. |
| Consultant isolation | Create a `tu_van` user with one assigned review task/document, then open global lists and unassigned contractor/internal document URLs. | Consultant sees only assigned review scope and cannot open unassigned document/task records. |

## Sprint 8C RLS Isolation Setup

Use the deterministic seed when validating RLS itself:

```text
database/seeds/002_rls_external_isolation_seed.sql
```

The seed creates staging-only profiles with fixed IDs:

| Role | Email | Fixed public user ID |
| --- | --- | --- |
| Admin | `admin.rls@greennest.local` | `20000000-0000-4000-8000-000000000001` |
| Project manager | `pm.rls@greennest.local` | `20000000-0000-4000-8000-000000000002` |
| Contractor | `contractor.rls@greennest.local` | `20000000-0000-4000-8000-000000000003` |
| Consultant | `consultant.rls@greennest.local` | `20000000-0000-4000-8000-000000000004` |
| Viewer | `viewer.rls@greennest.local` | `20000000-0000-4000-8000-000000000005` |

For SQL-only validation, `002_external_isolation_rls.sql` simulates those users by setting `request.jwt.claim.sub` to the fixed profile IDs.

For real Supabase Auth validation:

1. Create Auth users in Supabase for the five emails above, or equivalent staging emails.
2. Copy each `auth.users.id`.
3. Update the matching profile:

```sql
update public.users
set auth_user_id = '<real-auth-user-uuid>'
where email = 'contractor.rls@greennest.local';
```

4. Sign in as each user through the app.
5. Repeat the manual Contractor, Consultant and Viewer isolation cases.

## AI/Knowledge Staging Write Runner

`npm run validate:ai-knowledge:staging` is a staging-only write validation for governed AI/Knowledge flows. It uses the Supabase service-role key so it can validate persistence and table access without depending on browser auth state.

The script refuses to run unless all guards pass:

```text
GREENNEST_REPOSITORY_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=<staging Supabase URL>
SUPABASE_SERVICE_ROLE_KEY=<staging service role key>
ALLOW_STAGING_WRITES=true
NODE_ENV is not production
```

Validated flows:

- Source registry: upserts `staging-validation.greennest.local`, reads it back, disables and re-enables it.
- Knowledge Candidate: upserts a deterministic `pending_review` candidate.
- Discovery: upserts a deterministic discovery topic, mock run log and pending-review candidate.
- AI: upserts a deterministic AI interaction/job and stores a mock or configured-provider health result.
- RLS/scoping baseline: verifies service-role table access for AI/Knowledge tables. Real role-user RLS checks remain manual.

The runner intentionally keeps validation records instead of deleting them. They use deterministic IDs or `staging-validation-*` identifiers and are safe to inspect or remove manually after staging validation.

## RLS Assumptions

- RLS helpers resolve the app user from `public.users.auth_user_id = auth.uid()` or `public.users.id = auth.uid()`.
- Internal non-viewer, non-external roles with the relevant permission can read project-linked MVP records across projects for the MVP.
- `viewer` is read-only and scoped to assigned projects.
- `nha_thau` and `tu_van` are external roles and are scoped to assigned project/task/document records.
- Contractor legal access is denied by RLS.
- Consultant legal access follows assigned project/review scope.
- App-level Sprint 8B scope helpers and Sprint 8C RLS helpers use the same assignment sources: project membership, task assignee and document owner.
- Storage RLS is not implemented because real upload/download flows are not implemented yet.
- Knowledge chunk embeddings are stored as vector-ready metadata placeholders. A future production migration should enable `pgvector`, add a typed `vector(n)` column and create an ANN index after the embedding model dimension is fixed.

## Known Limitations Before Production

- Multi-step writes are still application-level sequences, not database RPC transactions.
- Production invitation emails are not implemented.
- Storage upload and signed URL flows are not implemented.
- RLS policies are initial baselines and need real user/project membership test coverage.
- Demo/mock data must not be loaded into production.

## Pass Criteria

- `npm run typecheck`, `npm run lint`, `npm run test` and `npm run build` pass.
- Verification SQL shows no missing roles or permissions.
- Manual create/update tests pass in Supabase mode.
- Mock mode still works with Supabase variables removed or `GREENNEST_REPOSITORY_MODE=mock`.
