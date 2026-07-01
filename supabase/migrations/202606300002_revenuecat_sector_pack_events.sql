create table if not exists public.revenuecat_webhook_events (
  event_id text primary key,
  event_type text not null,
  app_user_id uuid,
  product_id text,
  transaction_id text,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create index if not exists revenuecat_webhook_events_user_idx
  on public.revenuecat_webhook_events(app_user_id, processed_at desc);

alter table public.revenuecat_webhook_events enable row level security;

drop policy if exists "Users can read their RevenueCat events" on public.revenuecat_webhook_events;
create policy "Users can read their RevenueCat events"
on public.revenuecat_webhook_events
for select
using (auth.uid() = app_user_id);
