create table public.partner_leads (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  contact_name text not null,
  contact text not null,
  website text not null default '',
  countries text not null,
  services text not null,
  message text not null,
  consent boolean not null,
  status text not null default 'new',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint partner_leads_organization_name_length check (
    char_length(organization_name) between 2 and 180
  ),
  constraint partner_leads_contact_name_length check (
    char_length(contact_name) between 2 and 120
  ),
  constraint partner_leads_contact_length check (
    char_length(contact) between 4 and 180
  ),
  constraint partner_leads_website_length check (char_length(website) <= 240),
  constraint partner_leads_countries_length check (
    char_length(countries) between 2 and 500
  ),
  constraint partner_leads_services_length check (
    char_length(services) between 2 and 500
  ),
  constraint partner_leads_message_length check (
    char_length(message) between 10 and 2000
  ),
  constraint partner_leads_consent_true check (consent is true),
  constraint partner_leads_status_check check (
    status in ('new', 'contacted', 'qualified', 'rejected', 'closed')
  )
);

create index partner_leads_status_created_at_idx
  on public.partner_leads (status, created_at desc);

create trigger partner_leads_set_updated_at
before update on public.partner_leads
for each row execute function public.set_updated_at();

revoke all on table public.partner_leads from public, anon, authenticated;
grant insert on table public.partner_leads to anon, authenticated;
grant select, update, delete on table public.partner_leads to authenticated;
grant all on table public.partner_leads to service_role;

alter table public.partner_leads enable row level security;

create policy "partner_leads_insert_public"
on public.partner_leads
for insert
to anon, authenticated
with check (consent is true and status = 'new');

create policy "partner_leads_select_admin"
on public.partner_leads
for select
to authenticated
using (private.is_admin());

create policy "partner_leads_update_admin"
on public.partner_leads
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "partner_leads_delete_admin"
on public.partner_leads
for delete
to authenticated
using (private.is_admin());
