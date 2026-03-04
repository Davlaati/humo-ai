-- Step 1: profiles table for Telegram-based user sync
-- Run in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id text primary key, -- Telegram user id
  name text,
  username text,
  avatar_url text,

  premium_status boolean not null default false,
  interests text[] not null default '{}',
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 0 check (streak >= 0),
  top_rating integer not null default 0 check (top_rating >= 0),
  last_active_date timestamptz,

  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create index if not exists idx_profiles_last_active_date on public.profiles (last_active_date desc);
create index if not exists idx_profiles_xp on public.profiles (xp desc);
create index if not exists idx_profiles_top_rating on public.profiles (top_rating desc);

alter table public.profiles enable row level security;

-- Adjust to your auth strategy. For Telegram ID-based app server flow,
-- writes should typically happen through a trusted backend (service role).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_authenticated'
  ) then
    create policy profiles_select_authenticated
      on public.profiles
      for select
      to authenticated
      using (true);
  end if;
end $$;
