# Seed Data

Use this folder for local and staging seed data.

Production deployments should not load demo seed data.

`001_roles_permissions.sql` is baseline configuration seed data, not demo data. Apply it after the core schema migration in every Supabase environment so RBAC checks can resolve roles and permissions.

`002_rls_external_isolation_seed.sql` is staging-only validation data for Sprint 8C. Apply it only when validating contractor, consultant and viewer isolation. Do not load it into production.
