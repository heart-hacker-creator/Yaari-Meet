-- YaariMeet update 2: editable banner, visit log, alert switches, push encryption keys.
-- Paste into the Supabase SQL editor and run once (after schema.sql).

-- One row of site-wide settings, edited from the admin app.
create table public.site_settings (
  id int primary key default 1 check (id = 1),
  banner_text text not null default '' check (char_length(banner_text) <= 300),
  banner_on boolean not null default false,
  alert_visits boolean not null default true,
  alert_signups boolean not null default true
);
insert into public.site_settings default values;

alter table public.site_settings enable row level security;
create policy "admin reads settings" on public.site_settings for select using (public.is_admin());
create policy "admin updates settings" on public.site_settings for update using (public.is_admin());

-- One row per browser visit (not per page view), written by the chat server.
create table public.visits (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles on delete set null,
  path text,
  city text,
  region text,
  country text,
  device text,
  referrer text,
  created_at timestamptz not null default now()
);
create index on public.visits (created_at);

alter table public.visits enable row level security;
create policy "admin reads visits" on public.visits for select using (public.is_admin());

-- Push alerts now carry text (name, amount...), which browsers require to be encrypted
-- with these per-device keys.
alter table public.admin_push_subscriptions add column p256dh text, add column auth text;
