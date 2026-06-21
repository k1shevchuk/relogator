create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
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

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

revoke all on table
  public.profiles,
  public.user_questionnaires,
  public.saved_route_plans,
  public.specialist_requests
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.user_questionnaires,
  public.saved_route_plans,
  public.specialist_requests
to authenticated;

grant all on table
  public.profiles,
  public.user_questionnaires,
  public.saved_route_plans,
  public.specialist_requests
to service_role;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_insert_admin_only" on public.profiles;
drop policy if exists "profiles_update_admin_only" on public.profiles;
drop policy if exists "profiles_delete_admin_only" on public.profiles;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or private.is_admin());

create policy "profiles_insert_admin_only"
on public.profiles
for insert
to authenticated
with check (private.is_admin());

create policy "profiles_update_admin_only"
on public.profiles
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "profiles_delete_admin_only"
on public.profiles
for delete
to authenticated
using (private.is_admin());

drop policy if exists "user_questionnaires_select_own_or_admin" on public.user_questionnaires;
drop policy if exists "user_questionnaires_insert_own" on public.user_questionnaires;
drop policy if exists "user_questionnaires_update_own_or_admin" on public.user_questionnaires;
drop policy if exists "user_questionnaires_delete_own_or_admin" on public.user_questionnaires;

create policy "user_questionnaires_select_own_or_admin"
on public.user_questionnaires
for select
to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

create policy "user_questionnaires_insert_own"
on public.user_questionnaires
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "user_questionnaires_update_own_or_admin"
on public.user_questionnaires
for update
to authenticated
using (user_id = (select auth.uid()) or private.is_admin())
with check (user_id = (select auth.uid()) or private.is_admin());

create policy "user_questionnaires_delete_own_or_admin"
on public.user_questionnaires
for delete
to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "saved_route_plans_select_own_or_admin" on public.saved_route_plans;
drop policy if exists "saved_route_plans_insert_own" on public.saved_route_plans;
drop policy if exists "saved_route_plans_update_own_or_admin" on public.saved_route_plans;
drop policy if exists "saved_route_plans_delete_own_or_admin" on public.saved_route_plans;

create policy "saved_route_plans_select_own_or_admin"
on public.saved_route_plans
for select
to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

create policy "saved_route_plans_insert_own"
on public.saved_route_plans
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "saved_route_plans_update_own_or_admin"
on public.saved_route_plans
for update
to authenticated
using (user_id = (select auth.uid()) or private.is_admin())
with check (user_id = (select auth.uid()) or private.is_admin());

create policy "saved_route_plans_delete_own_or_admin"
on public.saved_route_plans
for delete
to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

drop policy if exists "specialist_requests_select_own_or_admin" on public.specialist_requests;
drop policy if exists "specialist_requests_insert_own" on public.specialist_requests;
drop policy if exists "specialist_requests_update_own_or_admin" on public.specialist_requests;
drop policy if exists "specialist_requests_delete_own_or_admin" on public.specialist_requests;

create policy "specialist_requests_select_own_or_admin"
on public.specialist_requests
for select
to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

create policy "specialist_requests_insert_own"
on public.specialist_requests
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "specialist_requests_update_own_or_admin"
on public.specialist_requests
for update
to authenticated
using (user_id = (select auth.uid()) or private.is_admin())
with check (user_id = (select auth.uid()) or private.is_admin());

create policy "specialist_requests_delete_own_or_admin"
on public.specialist_requests
for delete
to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

drop function if exists public.is_admin();
