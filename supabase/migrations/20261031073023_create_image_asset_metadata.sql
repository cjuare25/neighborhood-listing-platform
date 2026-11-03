-- Store auditable provenance and administrative approval for rendered images.
create table public.image_assets (
  id bigint generated always as identity primary key,
  asset_key text not null unique,
  category text not null
    check (
      category in (
        'PROPERTY_LISTING',
        'BUSINESS_PARTNER',
        'UI_NAVIGATION'
      )
    ),
  source_path text not null,
  original_source_url text not null,
  permission_source text not null,
  license_name text not null,
  license_uri text not null,
  purpose text not null
    check (purpose in ('INFORMATIONAL', 'ACTIONABLE', 'DECORATIVE')),
  alt_text text not null,
  intrinsic_width integer,
  intrinsic_height integer,
  is_approved boolean not null default false,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'ACTIVE', 'REJECTED')),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.image_assets enable row level security;

grant select on table public.image_assets to anon, authenticated;

create policy "Approved active image assets are publicly readable"
on public.image_assets
for select
to anon, authenticated
using (
  is_approved = true
  and status = 'ACTIVE'
);

insert into public.image_assets (
  asset_key,
  category,
  source_path,
  original_source_url,
  permission_source,
  license_name,
  license_uri,
  purpose,
  alt_text,
  intrinsic_width,
  intrinsic_height,
  is_approved,
  status,
  approved_at
)
values
  (
    'primary-property-listing',
    'PROPERTY_LISTING',
    '/public/assets/property-listing.jpg',
    'https://commons.wikimedia.org/wiki/File:Modern_house_exterior_with_red_roof_and_landscaped_garden_under_clear_blue_sky.jpg',
    'Shixart1985',
    'Creative Commons Attribution 2.0',
    'https://creativecommons.org/licenses/by/2.0/',
    'INFORMATIONAL',
    '125 Maple Street property in Los Angeles, CA',
    1280,
    853,
    true,
    'ACTIVE',
    now()
  ),
  (
    'local-business-partner-banner',
    'BUSINESS_PARTNER',
    '/public/assets/business-partner.jpg',
    'https://commons.wikimedia.org/wiki/File:Down_to_Earth_Coffee_Storefront.jpg',
    'Andy Li',
    'CC0 1.0 Universal',
    'https://creativecommons.org/publicdomain/zero/1.0/',
    'INFORMATIONAL',
    'Down to Earth Coffee storefront for a sponsored neighborhood partner',
    1280,
    960,
    true,
    'ACTIVE',
    now()
  ),
  (
    'neighborhood-navigation-icon',
    'UI_NAVIGATION',
    '/public/assets/map-pin.svg',
    'https://github.com/tailwindlabs/heroicons/blob/master/optimized/24/outline/map-pin.svg',
    'Tailwind Labs Heroicons contributors',
    'MIT License',
    'https://github.com/tailwindlabs/heroicons/blob/master/LICENSE',
    'DECORATIVE',
    '',
    24,
    24,
    true,
    'ACTIVE',
    now()
  );