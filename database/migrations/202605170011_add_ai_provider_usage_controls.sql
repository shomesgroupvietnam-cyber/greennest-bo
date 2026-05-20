-- AI Provider Reliability & Cost Controls.
-- Adds token/cost metadata placeholders while keeping provider execution in the app worker.

alter table public.ai_interactions
  add column if not exists usage jsonb;

alter table public.ai_jobs
  add column if not exists usage jsonb;

comment on column public.ai_interactions.usage is
  'Provider usage metadata placeholder: promptTokens, completionTokens, totalTokens, estimatedCost.';

comment on column public.ai_jobs.usage is
  'Provider usage metadata placeholder copied from the completed provider call for job-level diagnostics.';
