-- Preserve earlier lab data before introducing the examination schema.
-- The previous numeric-ID sponsor RPC is retired by this migration.
-- Existing migration files remain unchanged.

CREATE SCHEMA exam_legacy;
REVOKE ALL ON SCHEMA exam_legacy
FROM PUBLIC, anon, authenticated;
DROP FUNCTION public.get_active_sponsor_for_property(bigint);
ALTER TABLE public.sponsor_zip_scopes SET SCHEMA exam_legacy;
ALTER TABLE public.sponsors SET SCHEMA exam_legacy;
ALTER TABLE public.properties SET SCHEMA exam_legacy;
REVOKE ALL ON ALL TABLES IN SCHEMA exam_legacy
FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA exam_legacy
FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA exam_legacy TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA exam_legacy TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA exam_legacy TO service_role;
-- The archived property is not copied automatically:
-- its original schema contains no square_feet value.

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL
    CHECK (role IN ('admin', 'property_owner', 'sponsor', 'public')),
  created_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc'::text, now())
);
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2),
  tier TEXT NOT NULL CHECK (tier IN ('gold', 'silver', 'bronze')),
  active_status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc'::text, now())
);
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  address TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
  bathrooms NUMERIC(3, 1) NOT NULL CHECK (bathrooms >= 0),
  square_feet INTEGER NOT NULL CHECK (square_feet > 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc'::text, now())
);
CREATE TABLE public.property_sponsors (
  property_id UUID
    REFERENCES public.properties(id) ON DELETE CASCADE,
  sponsor_id UUID
    REFERENCES public.sponsors(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, sponsor_id)
);
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL
    REFERENCES public.properties(id) ON DELETE CASCADE,
  inquirer_email TEXT NOT NULL
    CHECK (
      inquirer_email ~*
      '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
  message TEXT NOT NULL CHECK (char_length(message) >= 10),
  created_at TIMESTAMPTZ NOT NULL
    DEFAULT timezone('utc'::text, now())
);
-- Index foreign keys used in joins and security policies.
CREATE INDEX exam_properties_owner_idx
  ON public.properties(owner_id);
CREATE INDEX exam_properties_status_idx
  ON public.properties(status);
CREATE INDEX exam_property_sponsors_sponsor_idx
  ON public.property_sponsors(sponsor_id);
CREATE INDEX exam_inquiries_property_idx
  ON public.inquiries(property_id);
-- Establish default-deny before adding role-specific access.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE
  public.profiles,
  public.sponsors,
  public.properties,
  public.property_sponsors,
  public.inquiries
FROM PUBLIC, anon, authenticated;
-- Trusted administrative execution retains access.
GRANT ALL ON TABLE
  public.profiles,
  public.sponsors,
  public.properties,
  public.property_sponsors,
  public.inquiries
TO service_role;
-- Role-specific grants and RLS policies will be appended next.

-- Preserve the owner identities associated with archived listings.
INSERT INTO public.profiles (id, role)
SELECT DISTINCT user_id, 'property_owner'
FROM exam_legacy.properties;
-- Users can read their own profile, but cannot assign or change roles.
GRANT SELECT ON public.profiles TO authenticated;
CREATE POLICY profiles_read_self
ON public.profiles
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));
-- Public sponsor visibility.
GRANT SELECT ON public.sponsors TO anon, authenticated;
CREATE POLICY sponsors_read_active
ON public.sponsors
FOR SELECT TO anon, authenticated
USING (active_status = true);
-- Public property visibility and owner access.
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT INSERT (
  owner_id, address, price, bedrooms, bathrooms, square_feet, status
) ON public.properties TO authenticated;
GRANT UPDATE (
  address, price, bedrooms, bathrooms, square_feet, status
) ON public.properties TO authenticated;
GRANT DELETE ON public.properties TO authenticated;
CREATE POLICY properties_read_approved
ON public.properties
FOR SELECT TO anon, authenticated
USING (status = 'approved');
CREATE POLICY properties_read_own
ON public.properties
FOR SELECT TO authenticated
USING (owner_id = (SELECT auth.uid()));
CREATE POLICY properties_insert_own_draft
ON public.properties
FOR INSERT TO authenticated
WITH CHECK (
  owner_id = (SELECT auth.uid())
  AND status = 'draft'
  AND EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.role = 'property_owner'
  )
);
-- USING checks the existing row; WITH CHECK checks its new values.
-- Column grants also prevent changing owner_id, id, or created_at.
CREATE POLICY properties_update_own_unapproved
ON public.properties
FOR UPDATE TO authenticated
USING (
  owner_id = (SELECT auth.uid())
  AND status IN ('draft', 'rejected')
  AND EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.role = 'property_owner'
  )
)
WITH CHECK (
  owner_id = (SELECT auth.uid())
  AND status IN ('draft', 'rejected')
  AND EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.role = 'property_owner'
  )
);
CREATE POLICY properties_delete_own
ON public.properties
FOR DELETE TO authenticated
USING (
  owner_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = (SELECT auth.uid())
      AND profile.role = 'property_owner'
  )
);
-- Expose only approved-property associations with active sponsors.
GRANT SELECT ON public.property_sponsors TO anon, authenticated;
CREATE POLICY property_sponsors_read_public
ON public.property_sponsors
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.properties AS property
    WHERE property.id = property_sponsors.property_id
      AND property.status = 'approved'
  )
  AND EXISTS (
    SELECT 1
    FROM public.sponsors AS sponsor
    WHERE sponsor.id = property_sponsors.sponsor_id
      AND sponsor.active_status = true
  )
);
-- Anyone can submit an inquiry, subject to the table constraints.
-- Callers cannot supply IDs or timestamps.
GRANT INSERT (
  property_id, inquirer_email, message
) ON public.inquiries TO anon, authenticated;
CREATE POLICY inquiries_insert_anyone
ON public.inquiries
FOR INSERT TO anon, authenticated
WITH CHECK (true);
-- Anonymous users receive no SELECT grant.
-- Authenticated users see inquiries only for their own properties.
GRANT SELECT ON public.inquiries TO authenticated;
CREATE POLICY inquiries_read_property_owner
ON public.inquiries
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.properties AS property
    WHERE property.id = inquiries.property_id
      AND property.owner_id = (SELECT auth.uid())
  )
);
-- No client policies allow profile writes, sponsor writes,
-- junction-table writes, or inquiry updates/deletes.
-- Administrative operations use the trusted service_role.;
