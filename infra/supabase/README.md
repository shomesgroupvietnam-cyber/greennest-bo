# Supabase Notes

Supabase responsibilities:

- Authentication.
- PostgreSQL database.
- Storage for documents.
- Row Level Security.
- Role and permission storage.

Recommended buckets:

- `project-documents`: private bucket for real project files.
- `public-assets`: public bucket only if needed.

Migration files should live in `database/migrations`.
RLS policy files should live in `database/policies`.

Auth/RBAC schema should follow `blueprint/12-auth-roles-permissions.md`.

Phase 1.5 production foundation files:

- `database/migrations/202605160001_create_mvp_core_schema.sql`
- `database/seeds/001_roles_permissions.sql`
- `database/policies/001_mvp_rls.sql`
- `infra/supabase/storage-plan.md`

Apply them in that order for a fresh Supabase project.
