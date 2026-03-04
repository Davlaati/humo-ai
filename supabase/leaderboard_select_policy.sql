-- Run once in Supabase SQL editor.
-- Grants read-only leaderboard access for all users while keeping RLS enabled.

alter table public.profiles enable row level security;

drop policy if exists "Public leaderboard read" on public.profiles;

create policy "Public leaderboard read"
on public.profiles
for select
to public
using (true);
