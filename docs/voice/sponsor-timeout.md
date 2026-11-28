# Sponsor tool timeout — partial verification

## Code references

Implementation commit: bf38f5c.

- src/lib/voice/sponsor-timeout.ts → withSponsorTimeout
  Enforces a 2500 ms budget and aborts the supplied signal.
- src/lib/voice/supabase-sponsors.ts → getVoiceSponsors
  Queries linked active sponsors for an approved UUID property.
- src/app/api/tools/sponsor/route.ts → POST
  Requires bearer authentication and returns HTTP 504 on timeout.
- src/app/api/tools/sponsor/route.test.ts
  Test: returns 504, aborts the query, and logs the 2500 ms timeout.

## Automated failure injection

The database mock returns a promise that never settles.
The test clock advances 2500 ms.

Verified output:
- HTTP 504.
- code: SPONSOR_TIMEOUT.
- sponsors: null.
- message: Sponsor information is temporarily unavailable.
- Database request signal is aborted.
- Log event: voice.sponsor.timeout, timeout_ms: 2500.

The production build and all 51 unit tests passed.

## Live read-only verification

Script: scripts/verify-voice-sponsors.mjs.
Timestamp: 2026-11-28T09:56:01.618Z.
Target: local production server, port 3001, with real Supabase.

Observed:
- Missing authorization returned HTTP 401.
- Supabase relationship query succeeded.
- Authenticated endpoint returned HTTP 200 matching database results.
- Approved property: a6100000-0000-4000-8000-000000000001.
- Active linked sponsor count: 1.
- No database rows changed.

## Remaining verification

The timeout was injected in automated tests, not the live database.
Vapi tool attachment and caller continuation after a sponsor timeout
remain unverified. This document does not establish complete row 3 recovery.
