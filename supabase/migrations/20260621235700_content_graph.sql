-- Relogator content graph.
-- Route content is public reference data. Writes are limited to project admins.

create table public.content_countries (
  code text primary key,
  name text not null,
  slug text not null unique,
  status text not null,
  summary text not null,
  source_ids text[] not null default '{}',
  last_reviewed_at date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint content_countries_code_check check (code ~ '^[A-Z]{2}$'),
  constraint content_countries_status_check check (
    status in ('reviewed', 'needs_review', 'stale', 'reference_only')
  ),
  constraint content_countries_sources_not_empty check (cardinality(source_ids) > 0)
);

create table public.content_sources (
  id text primary key,
  title text not null,
  url text not null,
  source_type text not null,
  country_code text not null references public.content_countries (code) on update cascade on delete restrict,
  language text not null,
  last_reviewed_at date not null,
  description text not null,
  confidence text not null,
  applies_to_citizenship text[] not null default array['RU'],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint content_sources_url_check check (url ~ '^https://'),
  constraint content_sources_source_type_check check (
    source_type in (
      'official_body',
      'consulate',
      'law',
      'statistics',
      'government_portal',
      'partner',
      'editorial_note'
    )
  ),
  constraint content_sources_confidence_check check (
    confidence in ('low', 'medium', 'high')
  ),
  constraint content_sources_applies_to_ru_check check (
    applies_to_citizenship @> array['RU']
  )
);

create table public.content_routes (
  id text primary key,
  country_code text not null references public.content_countries (code) on update cascade on delete restrict,
  title text not null,
  short_description text not null,
  entry_type text not null,
  goals text[] not null,
  stay_durations text[] not null,
  publication_status text not null,
  confidence text not null,
  last_reviewed_at date not null,
  base_difficulty smallint not null,
  requirements jsonb not null default '{}'::jsonb,
  supports jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '{}'::jsonb,
  cost jsonb not null default '{}'::jsonb,
  documents text[] not null default '{}',
  source_ids text[] not null default '{}',
  steps jsonb not null default '[]'::jsonb,
  risks text[] not null default '{}',
  decision_graph jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint content_routes_entry_type_check check (
    entry_type in ('visa_free', 'residence_permit', 'temporary_residence')
  ),
  constraint content_routes_publication_status_check check (
    publication_status in ('draft', 'reviewed', 'partner_reviewed', 'stale', 'archived')
  ),
  constraint content_routes_confidence_check check (
    confidence in ('low', 'medium', 'high')
  ),
  constraint content_routes_base_difficulty_check check (
    base_difficulty between 1 and 5
  ),
  constraint content_routes_requirements_object check (
    jsonb_typeof(requirements) = 'object'
  ),
  constraint content_routes_supports_object check (
    jsonb_typeof(supports) = 'object'
  ),
  constraint content_routes_timeline_object check (
    jsonb_typeof(timeline) = 'object'
  ),
  constraint content_routes_cost_object check (
    jsonb_typeof(cost) = 'object'
  ),
  constraint content_routes_steps_array check (
    jsonb_typeof(steps) = 'array'
  ),
  constraint content_routes_decision_graph_object check (
    jsonb_typeof(decision_graph) = 'object'
  ),
  constraint content_routes_source_ids_not_empty check (cardinality(source_ids) > 0)
);

create index content_countries_status_idx on public.content_countries (status);
create index content_sources_country_code_idx on public.content_sources (country_code);
create index content_routes_country_code_idx on public.content_routes (country_code);
create index content_routes_publication_status_idx on public.content_routes (publication_status);
create index content_routes_goals_gin_idx on public.content_routes using gin (goals);
create index content_routes_stay_durations_gin_idx on public.content_routes using gin (stay_durations);
create index content_routes_source_ids_gin_idx on public.content_routes using gin (source_ids);
create index content_routes_requirements_gin_idx on public.content_routes using gin (requirements jsonb_path_ops);

create trigger content_countries_set_updated_at
before update on public.content_countries
for each row execute function public.set_updated_at();

create trigger content_sources_set_updated_at
before update on public.content_sources
for each row execute function public.set_updated_at();

create trigger content_routes_set_updated_at
before update on public.content_routes
for each row execute function public.set_updated_at();

alter table public.content_countries enable row level security;
alter table public.content_sources enable row level security;
alter table public.content_routes enable row level security;

grant select on table public.content_countries to anon, authenticated;
grant select on table public.content_sources to anon, authenticated;
grant select on table public.content_routes to anon, authenticated;

grant insert, update, delete on table public.content_countries to authenticated;
grant insert, update, delete on table public.content_sources to authenticated;
grant insert, update, delete on table public.content_routes to authenticated;

grant all on table public.content_countries to service_role;
grant all on table public.content_sources to service_role;
grant all on table public.content_routes to service_role;

create policy public_read_content_countries
on public.content_countries
for select
to anon, authenticated
using (true);

create policy public_read_content_sources
on public.content_sources
for select
to anon, authenticated
using (true);

create policy public_read_content_routes
on public.content_routes
for select
to anon, authenticated
using (publication_status in ('reviewed', 'partner_reviewed', 'stale'));

create policy admin_manage_content_countries
on public.content_countries
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy admin_manage_content_sources
on public.content_sources
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy admin_manage_content_routes
on public.content_routes
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());
