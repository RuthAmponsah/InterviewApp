alter table public.user_progress
add column if not exists applied_jobs text[] not null default '{}',
add column if not exists saved_job_details jsonb not null default '{}'::jsonb,
add column if not exists applied_job_details jsonb not null default '{}'::jsonb;

