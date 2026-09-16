-- Lag-app MVP schema
-- Run this against a Supabase project (SQL editor, or `supabase db push`).

create extension if not exists "pgcrypto";

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  primary_color text not null default '#1d4ed8',
  secondary_color text not null default '#0f172a',
  logo_url text,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role text check (role in ('admin', 'player')),
  team_id uuid references public.teams (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  title text not null,
  type text not null check (type in ('training', 'match', 'other')),
  location text,
  start_time timestamptz not null,
  end_time timestamptz,
  description text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null check (status in ('going', 'not_going', 'maybe')),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text,
  image_url text,
  created_at timestamptz not null default now(),
  constraint message_has_content check (content is not null or image_url is not null)
);

create table if not exists public.chat_reads (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create index if not exists events_team_time_idx on public.events (team_id, start_time);
create index if not exists messages_team_time_idx on public.messages (team_id, created_at);
create index if not exists rsvps_event_idx on public.rsvps (event_id);
create index if not exists profiles_team_idx on public.profiles (team_id);

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function public.my_team_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select team_id from public.profiles where id = auth.uid();
$$;

create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_team_admin(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and team_id = p_team_id and role = 'admin'
  );
$$;

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.teams where invite_code = code);
  end loop;
  return code;
end;
$$;

-- Auto-create a stub profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Guards profiles.role / profiles.team_id from being changed by a plain
-- client-side update (RLS only restricts *rows*, not *columns*, so without
-- this a player could self-promote to admin). Only the team functions below
-- may flip this, via a transaction-local flag.
create or replace function public.guard_profile_privileged_columns()
returns trigger
language plpgsql
as $$
begin
  if (new.role is distinct from old.role or new.team_id is distinct from old.team_id)
     and coalesce(current_setting('app.bypass_profile_guard', true), '') <> 'on' then
    raise exception 'role and team_id can only change via team functions';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_privileged on public.profiles;
create trigger profiles_guard_privileged
  before update on public.profiles
  for each row execute procedure public.guard_profile_privileged_columns();

-- Atomically create a team and make the caller its admin.
create or replace function public.create_team(
  p_name text,
  p_primary_color text,
  p_secondary_color text,
  p_logo_url text default null
)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team public.teams;
  v_existing uuid;
begin
  select team_id into v_existing from public.profiles where id = auth.uid();
  if v_existing is not null then
    raise exception 'You already belong to a team';
  end if;

  insert into public.teams (name, primary_color, secondary_color, logo_url, invite_code)
  values (p_name, p_primary_color, p_secondary_color, p_logo_url, public.generate_invite_code())
  returning * into v_team;

  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles
  set team_id = v_team.id, role = 'admin'
  where id = auth.uid();

  return v_team;
end;
$$;

-- Join an existing team via its invite code.
create or replace function public.join_team(p_invite_code text)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team public.teams;
  v_existing uuid;
begin
  select team_id into v_existing from public.profiles where id = auth.uid();
  if v_existing is not null then
    raise exception 'You already belong to a team';
  end if;

  select * into v_team from public.teams where invite_code = upper(p_invite_code);
  if v_team.id is null then
    raise exception 'Invalid invite code';
  end if;

  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles
  set team_id = v_team.id, role = 'player'
  where id = auth.uid();

  return v_team;
end;
$$;

-- Admin-only: change a teammate's role.
create or replace function public.admin_set_role(p_profile_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  if p_role not in ('admin', 'player') then
    raise exception 'Invalid role';
  end if;

  select team_id into v_team_id from public.profiles where id = p_profile_id;
  if v_team_id is null or not public.is_team_admin(v_team_id) then
    raise exception 'Only admins can do this';
  end if;

  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set role = p_role where id = p_profile_id;
end;
$$;

-- Admin-only: remove a teammate from the team.
create or replace function public.admin_remove_member(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  select team_id into v_team_id from public.profiles where id = p_profile_id;
  if v_team_id is null or not public.is_team_admin(v_team_id) then
    raise exception 'Only admins can do this';
  end if;
  if p_profile_id = auth.uid() then
    raise exception 'Cannot remove yourself';
  end if;

  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set team_id = null, role = null where id = p_profile_id;
end;
$$;

-- Admin-only: rotate a team's invite code.
create or replace function public.regenerate_invite_code(p_team_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_team_admin(p_team_id) then
    raise exception 'Only admins can do this';
  end if;
  v_code := public.generate_invite_code();
  update public.teams set invite_code = v_code where id = p_team_id;
  return v_code;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.messages enable row level security;
alter table public.chat_reads enable row level security;

-- teams
create policy "teams: members can view own team" on public.teams
  for select using (id = public.my_team_id());

create policy "teams: admin can update own team" on public.teams
  for update using (public.is_team_admin(id));

-- profiles
create policy "profiles: view own row" on public.profiles
  for select using (id = auth.uid());

create policy "profiles: view teammates" on public.profiles
  for select using (team_id is not null and team_id = public.my_team_id());

create policy "profiles: update own name" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- events
create policy "events: team can view" on public.events
  for select using (team_id = public.my_team_id());

create policy "events: admin can insert" on public.events
  for insert with check (public.is_team_admin(team_id));

create policy "events: admin can update" on public.events
  for update using (public.is_team_admin(team_id));

create policy "events: admin can delete" on public.events
  for delete using (public.is_team_admin(team_id));

-- rsvps
create policy "rsvps: team can view" on public.rsvps
  for select using (
    exists (select 1 from public.events e where e.id = event_id and e.team_id = public.my_team_id())
  );

create policy "rsvps: self insert" on public.rsvps
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.events e where e.id = event_id and e.team_id = public.my_team_id())
  );

create policy "rsvps: self update" on public.rsvps
  for update using (user_id = auth.uid());

create policy "rsvps: self delete" on public.rsvps
  for delete using (user_id = auth.uid());

-- messages
create policy "messages: team can view" on public.messages
  for select using (team_id = public.my_team_id());

create policy "messages: team can send" on public.messages
  for insert with check (team_id = public.my_team_id() and user_id = auth.uid());

create policy "messages: author can delete own" on public.messages
  for delete using (user_id = auth.uid());

-- chat_reads
create policy "chat_reads: team can view" on public.chat_reads
  for select using (team_id = public.my_team_id());

create policy "chat_reads: self upsert" on public.chat_reads
  for insert with check (user_id = auth.uid() and team_id = public.my_team_id());

create policy "chat_reads: self update" on public.chat_reads
  for update using (user_id = auth.uid());

-- ============================================================
-- Realtime
-- ============================================================

alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.rsvps;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chat_reads;

-- ============================================================
-- Storage buckets (logos, chat images)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

create policy "logos: public read" on storage.objects
  for select using (bucket_id = 'logos');

create policy "logos: authenticated upload" on storage.objects
  for insert with check (bucket_id = 'logos' and auth.role() = 'authenticated');

create policy "logos: authenticated update own" on storage.objects
  for update using (bucket_id = 'logos' and auth.role() = 'authenticated');

create policy "chat-images: public read" on storage.objects
  for select using (bucket_id = 'chat-images');

create policy "chat-images: authenticated upload" on storage.objects
  for insert with check (bucket_id = 'chat-images' and auth.role() = 'authenticated');
