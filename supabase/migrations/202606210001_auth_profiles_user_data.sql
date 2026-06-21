-- Relogator MVP Auth and user-owned data.
-- Admins are assigned manually by updating public.profiles.role in Supabase SQL.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('user', 'admin');
  end if;
end $$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_questionnaires (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profile jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_questionnaires_profile_object check (jsonb_typeof(profile) = 'object')
);

create table public.saved_route_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  route_id text not null,
  profile jsonb,
  assessment jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint saved_route_plans_profile_object check (
    profile is null or jsonb_typeof(profile) = 'object'
  ),
  constraint saved_route_plans_assessment_object check (
    assessment is null or jsonb_typeof(assessment) = 'object'
  )
);

create table public.specialist_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  route_id text not null,
  route_title text not null,
  country_name text not null,
  user_name text not null,
  contact text not null,
  question text not null,
  profile jsonb,
  status text not null default 'new',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint specialist_requests_profile_object check (
    profile is null or jsonb_typeof(profile) = 'object'
  ),
  constraint specialist_requests_status_check check (
    status in ('new', 'in_progress', 'closed', 'rejected')
  )
);

create index profiles_role_idx on public.profiles (role);
create index user_questionnaires_user_id_created_at_idx
  on public.user_questionnaires (user_id, created_at desc);
create index saved_route_plans_user_id_created_at_idx
  on public.saved_route_plans (user_id, created_at desc);
create index saved_route_plans_route_id_idx on public.saved_route_plans (route_id);
create index specialist_requests_user_id_created_at_idx
  on public.specialist_requests (user_id, created_at desc);
create index specialist_requests_route_id_idx on public.specialist_requests (route_id);
create index specialist_requests_status_idx on public.specialist_requests (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger user_questionnaires_set_updated_at
before update on public.user_questionnaires
for each row execute function public.set_updated_at();

create trigger saved_route_plans_set_updated_at
before update on public.saved_route_plans
for each row execute function public.set_updated_at();

create trigger specialist_requests_set_updated_at
before update on public.specialist_requests
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.user_questionnaires enable row level security;
alter table public.saved_route_plans enable row level security;
alter table public.specialist_requests enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or public.is_admin());

create policy "profiles_insert_admin_only"
on public.profiles
for insert
to authenticated
with check (public.is_admin());

create policy "profiles_update_admin_only"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "profiles_delete_admin_only"
on public.profiles
for delete
to authenticated
using (public.is_admin());

create policy "user_questionnaires_select_own_or_admin"
on public.user_questionnaires
for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

create policy "user_questionnaires_insert_own"
on public.user_questionnaires
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "user_questionnaires_update_own_or_admin"
on public.user_questionnaires
for update
to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

create policy "user_questionnaires_delete_own_or_admin"
on public.user_questionnaires
for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

create policy "saved_route_plans_select_own_or_admin"
on public.saved_route_plans
for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

create policy "saved_route_plans_insert_own"
on public.saved_route_plans
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "saved_route_plans_update_own_or_admin"
on public.saved_route_plans
for update
to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

create policy "saved_route_plans_delete_own_or_admin"
on public.saved_route_plans
for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

create policy "specialist_requests_select_own_or_admin"
on public.specialist_requests
for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

create policy "specialist_requests_insert_own"
on public.specialist_requests
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "specialist_requests_update_own_or_admin"
on public.specialist_requests
for update
to authenticated
using (user_id = (select auth.uid()) or public.is_admin())
with check (user_id = (select auth.uid()) or public.is_admin());

create policy "specialist_requests_delete_own_or_admin"
on public.specialist_requests
for delete
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());
