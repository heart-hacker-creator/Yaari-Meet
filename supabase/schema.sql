-- YaariMeet database. Paste into the Supabase SQL editor and run once.
-- Users can only read their own rows; every change to credits, gender,
-- verification or bans goes through the functions below.

-- ---------- Tables ----------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text not null default '' check (char_length(name) <= 40),
  gender text check (gender in ('male', 'female')),
  credits int not null default 0 check (credits >= 0),
  forced_filter text check (forced_filter in ('male', 'female')),
  verified boolean not null default false,
  banned boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.payment_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  amount int not null check (amount between 1 and 100000),
  utr text not null unique check (utr ~ '^[0-9A-Za-z]{6,30}$'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  credits int,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.verifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  video_path text not null,
  gesture text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table public.reports (
  id bigint generated always as identity primary key,
  reporter uuid references public.profiles on delete set null,
  reported uuid not null references public.profiles on delete cascade,
  reason text not null check (reason in ('abuse', 'wrong_gender')),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table public.admin_push_subscriptions (
  endpoint text primary key,
  admin_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now()
);

create index on public.payment_requests (status, created_at);
create index on public.verifications (status, created_at);
create index on public.reports (status, created_at);

-- ---------- New users get a profile automatically ----------

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 40));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ---------- Row level security ----------

alter table public.profiles enable row level security;
alter table public.payment_requests enable row level security;
alter table public.verifications enable row level security;
alter table public.reports enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.admin_push_subscriptions enable row level security;

create policy "read own profile, admin reads all" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "read own payments, admin reads all" on public.payment_requests
  for select using (user_id = auth.uid() or public.is_admin());
create policy "read own verifications, admin reads all" on public.verifications
  for select using (user_id = auth.uid() or public.is_admin());
create policy "admin reads reports" on public.reports
  for select using (public.is_admin());
create policy "read own ledger, admin reads all" on public.credit_ledger
  for select using (user_id = auth.uid() or public.is_admin());
create policy "admin manages own push subscriptions" on public.admin_push_subscriptions
  for all using (public.is_admin()) with check (public.is_admin() and admin_id = auth.uid());

-- ---------- User functions ----------

-- Onboarding. Gender can only be set once; after that only an admin can change it.
create function public.set_profile(p_name text, p_gender text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if char_length(trim(p_name)) = 0 then raise exception 'Name is required'; end if;
  if p_gender not in ('male', 'female') then raise exception 'Invalid gender'; end if;
  update public.profiles
     set name = left(trim(p_name), 40),
         gender = coalesce(gender, p_gender)
   where id = auth.uid();
end $$;

-- Called only by the chat server (secret key). Returns the new balance, or null if too few credits.
create function public.spend_credits(p_user uuid, p_amount int) returns int
language plpgsql security definer set search_path = '' as $$
declare
  balance int;
begin
  update public.profiles set credits = credits - p_amount
   where id = p_user and credits >= p_amount
  returning credits into balance;
  if balance is not null then
    insert into public.credit_ledger (user_id, delta, reason) values (p_user, -p_amount, 'chat minute');
  end if;
  return balance;
end $$;

revoke execute on function public.spend_credits(uuid, int) from public, anon, authenticated;

-- ---------- Admin functions ----------

create function public.admin_approve_payment(p_id bigint, p_credits int) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  if p_credits < 0 then raise exception 'Credits must be positive'; end if;
  update public.payment_requests
     set status = 'approved', credits = p_credits, reviewed_at = now()
   where id = p_id and status = 'pending'
  returning user_id into uid;
  if uid is null then raise exception 'This request is no longer pending'; end if;
  update public.profiles set credits = credits + p_credits where id = uid;
  insert into public.credit_ledger (user_id, delta, reason) values (uid, p_credits, 'payment #' || p_id);
end $$;

create function public.admin_reject_payment(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.payment_requests set status = 'rejected', reviewed_at = now()
   where id = p_id and status = 'pending';
end $$;

create function public.admin_add_credits(p_user uuid, p_delta int) returns int
language plpgsql security definer set search_path = '' as $$
declare
  balance int;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.profiles set credits = greatest(0, credits + p_delta)
   where id = p_user returning credits into balance;
  insert into public.credit_ledger (user_id, delta, reason) values (p_user, p_delta, 'admin');
  return balance;
end $$;

create function public.admin_set_credits(p_user uuid, p_credits int) returns void
language plpgsql security definer set search_path = '' as $$
declare
  old int;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  if p_credits < 0 then raise exception 'Credits must be positive'; end if;
  select credits into old from public.profiles where id = p_user for update;
  update public.profiles set credits = p_credits where id = p_user;
  insert into public.credit_ledger (user_id, delta, reason) values (p_user, p_credits - old, 'admin set');
end $$;

create function public.admin_set_user(
  p_user uuid, p_gender text, p_forced_filter text, p_verified boolean, p_banned boolean
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.profiles
     set gender = p_gender, forced_filter = p_forced_filter, verified = p_verified, banned = p_banned
   where id = p_user;
end $$;

-- Returns the video path so the admin app can delete the video afterwards.
create function public.admin_review_verification(p_id bigint, p_approve boolean) returns text
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid;
  path text;
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.verifications
     set status = case when p_approve then 'approved' else 'rejected' end, reviewed_at = now()
   where id = p_id and status = 'pending'
  returning user_id, video_path into uid, path;
  if p_approve and uid is not null then
    update public.profiles set verified = true where id = uid;
  end if;
  return path;
end $$;

create function public.admin_close_report(p_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  update public.reports set status = 'closed' where id = p_id;
end $$;

-- ---------- Verification videos (private bucket) ----------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verifications', 'verifications', false, 8388608, array['video/webm', 'video/mp4']);

create policy "users upload their own verification video" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'verifications' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "admin watches verification videos" on storage.objects
  for select using (bucket_id = 'verifications' and public.is_admin());
create policy "admin deletes verification videos" on storage.objects
  for delete using (bucket_id = 'verifications' and public.is_admin());

-- ---------- Make yourself admin ----------
-- Sign in to the site once with your Google account, then run (with your email):
-- update public.profiles set is_admin = true where email = 'you@gmail.com';
