-- Add ZIP scoping to property listings.
alter table public.properties
add column zip_code text
check (zip_code is null or zip_code ~ '^[0-9]{5}$');

create index properties_zip_code_idx
on public.properties (zip_code);

-- Store sponsor identity, approval state, campaign dates, and URL.
create table public.sponsors (
  id bigint generated always as identity primary key,
  name text not null,
  tier text not null
    check (tier in ('SILVER', 'GOLD', 'PLATINUM')),
  status text not null default 'PENDING'
    check (status in ('PENDING', 'APPROVED', 'REJECTED')),
  destination_url text not null
    check (destination_url ~ '^https://'),
  impressions bigint not null default 0
    check (impressions >= 0),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  check (start_date <= end_date)
);

-- Connect each sponsor to eligible ZIP codes and store distance.
create table public.sponsor_zip_scopes (
  sponsor_id bigint not null
    references public.sponsors(id) on delete cascade,
  zip_code text not null
    check (zip_code ~ '^[0-9]{5}$'),
  distance_miles numeric(6, 2) not null
    check (distance_miles >= 0),
  primary key (sponsor_id, zip_code)
);

create index sponsor_selection_idx
on public.sponsors (
  status,
  start_date,
  end_date,
  tier,
  impressions,
  id
);

create index sponsor_zip_lookup_idx
on public.sponsor_zip_scopes (
  zip_code,
  distance_miles,
  sponsor_id
);

-- Public clients only need read access. Administrative writes use a
-- trusted server or Supabase service role and are never exposed publicly.
revoke all on table public.sponsors from anon, authenticated;
revoke all on table public.sponsor_zip_scopes from anon, authenticated;

grant select on table public.sponsors to anon, authenticated;
grant select on table public.sponsor_zip_scopes to anon, authenticated;

alter table public.sponsors enable row level security;
alter table public.sponsor_zip_scopes enable row level security;

create policy "Approved active sponsors are readable"
on public.sponsors
for select
to anon, authenticated
using (
  status = 'APPROVED'
  and current_date between start_date and end_date
);

create policy "Scopes for approved active sponsors are readable"
on public.sponsor_zip_scopes
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.sponsors
    where sponsors.id = sponsor_zip_scopes.sponsor_id
      and sponsors.status = 'APPROVED'
      and current_date between sponsors.start_date and sponsors.end_date
  )
);

-- Retrieve one deterministic sponsor for a given property.
create or replace function public.get_active_sponsor_for_property(
  p_property_id bigint
)
returns table (
  sponsor_id bigint,
  sponsor_name text,
  tier text,
  destination_url text,
  distance_miles numeric,
  impressions bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.id as sponsor_id,
    s.name as sponsor_name,
    s.tier,
    s.destination_url,
    scope.distance_miles,
    s.impressions
  from public.properties as property
  join public.sponsor_zip_scopes as scope
    on scope.zip_code = property.zip_code
  join public.sponsors as s
    on s.id = scope.sponsor_id
  where property.id = p_property_id
    -- Administrative approval requirement
    and s.status = 'APPROVED'
    -- Temporal campaign-validity requirement
    and current_date between s.start_date and s.end_date
    -- Spatial requirement: the join requires the property's exact ZIP
    and scope.zip_code = property.zip_code
  order by
    -- 1. Highest paid tier
    case s.tier
      when 'PLATINUM' then 3
      when 'GOLD' then 2
      when 'SILVER' then 1
      else 0
    end desc,
    -- 2. Shortest distance within the matching ZIP
    scope.distance_miles asc,
    -- 3. Fewest prior impressions
    s.impressions asc,
    -- 4. Stable final tie-breaker
    s.id asc
  limit 1;
$$;

revoke all on function public.get_active_sponsor_for_property(bigint)
from public;

grant execute
on function public.get_active_sponsor_for_property(bigint)
to anon, authenticated;