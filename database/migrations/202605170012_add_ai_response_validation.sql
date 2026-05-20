-- AI Response Validation & Citation Guard.
-- Stores validator status/reasons so blocked/warning outputs are auditable.

alter table public.ai_interactions
  add column if not exists response_validation jsonb;

alter table public.ai_jobs
  add column if not exists response_validation jsonb;

comment on column public.ai_interactions.response_validation is
  'AI response validator metadata: status valid/warning/blocked and warning/block reasons.';

comment on column public.ai_jobs.response_validation is
  'AI response validator metadata captured before marking job succeeded or failed.';
