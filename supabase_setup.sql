-- ============================================================================
-- Hearth — Supabase setup (HOUSEHOLD model: one shared budget, separate logins)
-- Run once:  SQL Editor -> New query -> paste -> Run.   Safe to re-run.
-- This supersedes any earlier Hearth setup script.
-- ============================================================================

-- Households (each owns ONE shared budget) ----------------------------------
create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Our Household',
  invite_code text unique not null,
  created_by  uuid not null default auth.uid(),
  created_at  timestamptz not null default now()
);

-- Membership: which users belong to which household --------------------------
create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null default 'member',
  created_at   timestamptz not null default now(),
  primary key (household_id, user_id)
);

-- If an earlier (user-keyed) budgets table exists, replace it. No real data
-- yet, so this is safe.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='budgets' and column_name='user_id') then
    drop table public.budgets cascade;
  end if;
end $$;

-- One budget per household ---------------------------------------------------
create table if not exists public.budgets (
  household_id uuid primary key references public.households(id) on delete cascade,
  data         jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

-- Membership check used by policies (SECURITY DEFINER avoids RLS recursion) ---
create or replace function public.is_member(h uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.household_members m
                 where m.household_id = h and m.user_id = auth.uid());
$$;

-- Row-Level Security ---------------------------------------------------------
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.budgets           enable row level security;

drop policy if exists hh_select on public.households;
create policy hh_select on public.households for select using (public.is_member(id));
drop policy if exists hh_insert on public.households;
create policy hh_insert on public.households for insert with check (auth.uid() = created_by);
drop policy if exists hh_update on public.households;
create policy hh_update on public.households for update using (public.is_member(id)) with check (public.is_member(id));

drop policy if exists hm_select on public.household_members;
create policy hm_select on public.household_members for select using (public.is_member(household_id));
drop policy if exists hm_delete on public.household_members;
create policy hm_delete on public.household_members for delete using (user_id = auth.uid());
-- (membership INSERTs happen only via the SECURITY DEFINER functions below)

drop policy if exists b_select on public.budgets;
create policy b_select on public.budgets for select using (public.is_member(household_id));
drop policy if exists b_insert on public.budgets;
create policy b_insert on public.budgets for insert with check (public.is_member(household_id));
drop policy if exists b_update on public.budgets;
create policy b_update on public.budgets for update using (public.is_member(household_id)) with check (public.is_member(household_id));

-- Create a household, become its owner, create an empty budget. Returns id. ---
create or replace function public.create_household(p_name text default 'Our Household')
returns uuid language plpgsql security definer set search_path = public as $$
declare h uuid; code text;
begin
  code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.households(name, invite_code, created_by)
    values (coalesce(nullif(trim(p_name), ''), 'Our Household'), code, auth.uid())
    returning id into h;
  insert into public.household_members(household_id, user_id, role) values (h, auth.uid(), 'owner');
  insert into public.budgets(household_id, data) values (h, '{}'::jsonb) on conflict do nothing;
  return h;
end; $$;

-- Join an existing household by invite code. Returns id. ---------------------
create or replace function public.join_household(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare h uuid;
begin
  select id into h from public.households where invite_code = upper(trim(p_code));
  if h is null then raise exception 'Invalid invite code'; end if;
  insert into public.household_members(household_id, user_id, role)
    values (h, auth.uid(), 'member') on conflict (household_id, user_id) do nothing;
  return h;
end; $$;

-- The caller's household (or no rows). ---------------------------------------
create or replace function public.get_my_household()
returns table(id uuid, name text, invite_code text, role text, member_count int)
language sql security definer stable set search_path = public as $$
  select h.id, h.name, h.invite_code, m.role,
         (select count(*)::int from public.household_members mm where mm.household_id = h.id)
  from public.household_members m
  join public.households h on h.id = m.household_id
  where m.user_id = auth.uid()
  order by m.created_at asc
  limit 1;
$$;

-- Regenerate the caller's household invite code. -----------------------------
create or replace function public.regenerate_invite_code()
returns text language plpgsql security definer set search_path = public as $$
declare h uuid; code text;
begin
  select household_id into h from public.household_members
    where user_id = auth.uid() order by created_at asc limit 1;
  if h is null then raise exception 'No household'; end if;
  code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  update public.households set invite_code = code where id = h;
  return code;
end; $$;

grant execute on function public.create_household(text)     to authenticated;
grant execute on function public.join_household(text)       to authenticated;
grant execute on function public.get_my_household()         to authenticated;
grant execute on function public.regenerate_invite_code()   to authenticated;

-- Live updates across devices (safe if already enabled). ---------------------
do $$ begin
  alter publication supabase_realtime add table public.budgets;
exception when others then null; end $$;
