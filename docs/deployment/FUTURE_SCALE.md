# Future Scale Plan

## Stage 1 - Modular Monolith

Use Next.js full-stack application with Supabase.

Best for:

- MVP.
- Early customer validation.
- Small product team.

## Stage 2 - Stronger Backend Boundary

Introduce dedicated backend modules when business logic becomes too large for route/server actions.

Candidate:

- NestJS + TypeScript.
- PostgreSQL.
- Supabase Auth can remain identity provider or be replaced later.

## Stage 3 - Background Processing

Add queue/workers for:

- Report generation.
- AI document processing.
- Email/notification retries.
- File scanning/OCR.
- Integration sync jobs.

## Stage 4 - Reporting and Search

Add:

- Materialized dashboard views.
- Metric snapshots.
- Search index if Postgres search is not enough.
- Data warehouse only if operational database no longer fits analytics needs.

## Stage 5 - Enterprise Controls

Add:

- Advanced RBAC.
- Workspace/team hierarchy.
- External collaborator portal.
- Audit exports.
- SSO if required.
