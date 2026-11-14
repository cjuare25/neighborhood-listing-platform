-- One persisted response per inbound call.
-- No caller phone numbers or transcripts are stored here.

CREATE TABLE public.voice_webhook_receipts (
  call_sid TEXT PRIMARY KEY
    CHECK (call_sid ~ '^CA[0-9a-fA-F]{32}$'),
  response_twiml TEXT NOT NULL
    CHECK (char_length(response_twiml) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_webhook_receipts
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.voice_webhook_receipts
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, DELETE
ON TABLE public.voice_webhook_receipts
TO service_role;
