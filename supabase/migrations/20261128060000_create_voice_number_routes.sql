-- Administrative mapping from an inbound number to a property.
-- This table does not store caller phone numbers or transcripts.

CREATE TABLE public.voice_number_routes (
  phone_number TEXT PRIMARY KEY
    CHECK (phone_number ~ '^\+[1-9][0-9]{7,14}$'),
  property_id BIGINT NOT NULL
    REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_number_routes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.voice_number_routes
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.voice_number_routes TO service_role;
