# Operations Guide

## Operational Principles

- Production data should not be edited manually unless there is an approved recovery task.
- Main business records should be archived, not deleted.
- Role changes and sensitive mutations must be audited.
- Access must be reviewed by system role and project membership, not only by job title.
- Document storage should use private access when real project files are uploaded.

## Backup and Recovery

Future production setup should define:

- Supabase database backup frequency.
- Storage backup policy.
- Recovery point objective.
- Recovery time objective.
- Manual restore process.

## Monitoring

Future setup should include:

- Application errors.
- Database health.
- Slow dashboard queries.
- Failed file uploads.
- Failed background jobs.
- AI provider failures when AI module is enabled.
