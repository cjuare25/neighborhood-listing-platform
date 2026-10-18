-- Create the properties table used by the neighborhood listing platform.
create table public.properties (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  address text not null,
  city text not null,
  price numeric(12, 2) not null check (price >= 0),
  bedrooms integer not null check (bedrooms >= 0),
  bathrooms numeric(3, 1) not null check (bathrooms >= 0),
  image_url text,
  amenities text[] not null default '{}',
  contact_email text,
  contact_phone text,
  availability_status text not null default 'Active'
    check (
      availability_status in (
        'Active',
        'Pending',
        'Sold',
        'Temporarily Unavailable'
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index the columns used by the RLS predicates.
create index properties_user_id_idx
  on public.properties (user_id);

create index properties_availability_status_idx
  on public.properties (availability_status);

-- Remove broad default privileges and grant only the operations each API role needs.
revoke all on table public.properties from anon, authenticated;

grant select on table public.properties to anon;

grant select, insert, update, delete
  on table public.properties
  to authenticated;

grant usage, select
  on sequence public.properties_id_seq
  to authenticated;

-- Enable PostgreSQL Row-Level Security.
alter table public.properties enable row level security;

-- Anonymous and authenticated clients may view listings that are active.
create policy "Active properties are publicly readable"
on public.properties
for select
to anon, authenticated
using (availability_status = 'Active');

-- Authenticated owners may view all of their own listings,
-- including Pending, Sold, or Temporarily Unavailable listings.
create policy "Owners can view their own properties"
on public.properties
for select
to authenticated
using ((select auth.uid()) = user_id);

-- An authenticated user may create a listing only for their own user ID.
create policy "Owners can insert their own properties"
on public.properties
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- An owner may update only their own listing and cannot transfer
-- ownership by changing user_id to another user's ID.
create policy "Owners can update their own properties"
on public.properties
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- An owner may delete only their own listing.
create policy "Owners can delete their own properties"
on public.properties
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- A user with the custom app_metadata is_admin claim may read all rows.
create policy "Administrators can view all properties"
on public.properties
for select
to authenticated
using (
  coalesce(
    (select auth.jwt()) -> 'app_metadata' ->> 'is_admin',
    'false'
  ) = 'true'
);

-- A user with the custom app_metadata is_admin claim may update all rows.
create policy "Administrators can update all properties"
on public.properties
for update
to authenticated
using (
  coalesce(
    (select auth.jwt()) -> 'app_metadata' ->> 'is_admin',
    'false'
  ) = 'true'
)
with check (
  coalesce(
    (select auth.jwt()) -> 'app_metadata' ->> 'is_admin',
    'false'
  ) = 'true'
);

-- A user with the custom app_metadata is_admin claim may delete any row.
create policy "Administrators can delete all properties"
on public.properties
for delete
to authenticated
using (
  coalesce(
    (select auth.jwt()) -> 'app_metadata' ->> 'is_admin',
    'false'
  ) = 'true'
);