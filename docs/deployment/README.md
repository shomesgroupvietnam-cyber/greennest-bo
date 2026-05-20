# Deployment Guide

## Target Deployment

GreenNest BuildFlow is designed for:

- Vercel: Next.js hosting.
- Supabase: Auth, PostgreSQL, Storage.

## Environments

Use separate environments:

- Local.
- Preview/Staging.
- Production.

Each environment should have:

- Separate Supabase project or separate database.
- Separate storage bucket.
- Separate environment variables.
- Seed data only in local/staging.

## Required Environment Variables

```text
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_APP_URL
GREENNEST_REPOSITORY_MODE
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

`GREENNEST_REPOSITORY_MODE` is optional. Leave it empty for automatic mode selection, set it to `mock` to force file-backed local repositories, or set it to `supabase` to force Supabase repositories.

## Vercel Deployment

1. Connect repository to Vercel.
2. Configure environment variables.
3. Set build command:

```bash
npm run build
```

4. Set install command:

```bash
npm install
```

## Supabase Deployment

1. Create Supabase project.
2. Apply migrations from `database/migrations`.
3. Apply seed files from `database/seeds`.
4. Apply RLS policies from `database/policies`.
5. Configure the private `project-documents` storage bucket using `infra/supabase/storage-plan.md`.
6. Configure auth providers.
7. Create the first admin profile in `public.users` after the Supabase Auth user exists.

For staging validation, follow [SUPABASE_STAGING_VALIDATION.md](./SUPABASE_STAGING_VALIDATION.md).

## Discovery Scheduler Options

The app includes a manual scheduler entrypoint:

```bash
npm run discovery:run-due
```

This runner selects due enabled daily/weekly Knowledge Discovery topics, applies soft locks, retries failed runs according to topic metadata and imports only allowlisted non-duplicate results as `pending_review` Knowledge Candidates.

Hosted cron wiring is deployment-specific and intentionally separate from product behavior. Viable options:

- Vercel Cron calling a protected internal route that invokes the same scheduler service.
- GitHub Actions scheduled workflow running `npm ci` and `npm run discovery:run-due` against staging/production environment variables.
- Server cron on a controlled worker host running the same npm script.

Production cron wiring must include secret protection, logging/alerting, single-environment targeting and staging validation before enabling production cadence.

## Production Checklist

- Environment variables configured.
- Database migrations applied.
- Roles and permissions seeded.
- RLS enabled where needed.
- Live Supabase RLS validation completed with real authenticated internal and external users.
- Storage bucket privacy reviewed.
- Storage upload/download policy validated before enabling production uploads.
- Role and permission seed/migration reviewed.
- Admin/owner user created.
- Seed/demo data disabled.
- Discovery scheduler cron wiring reviewed and protected before enabling automated runs.
- Error monitoring configured.
- Backup policy confirmed.
