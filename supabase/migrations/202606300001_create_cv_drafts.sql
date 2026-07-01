create table if not exists public.cv_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled CV',
  target_role text,
  input_details jsonb not null default '{}'::jsonb,
  cv_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cv_drafts enable row level security;

create index if not exists cv_drafts_user_updated_idx
  on public.cv_drafts(user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_cv_drafts_updated_at on public.cv_drafts;
create trigger set_cv_drafts_updated_at
before update on public.cv_drafts
for each row
execute function public.set_updated_at();

drop policy if exists "Users can read their CV drafts" on public.cv_drafts;
create policy "Users can read their CV drafts"
on public.cv_drafts
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their CV drafts" on public.cv_drafts;
create policy "Users can create their CV drafts"
on public.cv_drafts
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their CV drafts" on public.cv_drafts;
create policy "Users can update their CV drafts"
on public.cv_drafts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their CV drafts" on public.cv_drafts;
create policy "Users can delete their CV drafts"
on public.cv_drafts
for delete
using (auth.uid() = user_id);
