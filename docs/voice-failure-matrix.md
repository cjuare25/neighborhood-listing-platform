# Voice failure matrix — work in progress

## Evidence scope

Verified on November 28, 2026 using the local production server
on port 3001 and the real Supabase project.

The routing verification script sent signed synthetic HTTP requests.
It did not place a telephone call or start a Vapi assistant.

Source references are pinned to commit `0ea43fffa9ca9b7a4b792dfcd57cb5e970892db8`.
Reproduction script: `scripts/verify-voice-routing.mjs`.

## Failure matrix

| Failure domain | Concrete trigger / payload | Codebase defense | Observed HTTP / telephony output | Caller experience / fallback |
| --- | --- | --- | --- | --- |
| 1. Routing failure | Signed POST with synthetic `To=+15555550100`; database lookup confirmed no mapping | [route.ts → POST](https://github.com/cjuare25/neighborhood-listing-platform/blob/0ea43fffa9ca9b7a4b792dfcd57cb5e970892db8/src/app/api/voice/twilio/route.ts#L54); [routing.ts → resolveVoiceListing](https://github.com/cjuare25/neighborhood-listing-platform/blob/0ea43fffa9ca9b7a4b792dfcd57cb5e970892db8/src/lib/voice/routing.ts#L13); [routing.ts → buildUnmappedListingTwiml](https://github.com/cjuare25/neighborhood-listing-platform/blob/0ea43fffa9ca9b7a4b792dfcd57cb5e970892db8/src/lib/voice/routing.ts#L30) | Verified HTTP 200, text/xml, general agency Say followed by Hangup; no Dial or Connect | Generated instructions explain that no active property was found and direct the caller to the website. Telephone playback remains unverified. |
| 2. Transcription ambiguity | Browser caller expressed uncertainty about the street name; transcript captured Maple or Maple | [Vapi v5 system prompt: TA-01](voice/transcription-ambiguity.md#configured-rule) | Observed spelling request, Maple Street readback, and confirmation | Caller spelled M-A-P-L-E and confirmed Yes. Browser-call behavior verified; numeric confidence threshold and Twilio path unverified. |
| 3. Sponsor tool timeout | Not exercised yet | No 2500 ms sponsor-query defense implemented | Not verified | Not verified |
| 4. Duplicate callback | Resend the same signed synthetic CallSid | [POST → duplicate-key/replay branch](https://github.com/cjuare25/neighborhood-listing-platform/blob/0ea43fffa9ca9b7a4b792dfcd57cb5e970892db8/src/app/api/voice/twilio/route.ts#L191) | Verified HTTP 200 with identical TwiML and exactly one stored receipt | Cached response verified. Prevention of duplicate assistant streams remains unverified because Vapi is not connected. |
| 5. Unavailable human | Not exercised yet | Transfer/SMS recovery not implemented | Not verified | Not verified |
| 6. Consent refusal | Not exercised yet | Recording-consent recovery not implemented | Not verified | Not verified |
| 7. Provider outage | Vapi/Google outage not exercised yet | Existing storage-error fallback is insufficient for this row; upstream outage/voicemail recovery is pending | Storage fallback has unit-test coverage, but provider-outage recovery is not verified | Offline announcement and voicemail remain unverified |

## Observed routing verification

Verification timestamp: `2026-11-28T08:24:50.931Z`.

- Synthetic number had no database mapping.
- Unmapped-number response: HTTP 200 with recovery TwiML.
- Duplicate CallSid returned identical TwiML with one stored receipt.
- Synthetic receipt cleanup completed.
- Response SHA-256:
  `f4ba149393a037fa39b4166351ad83537b5b3a7f8066e9241445b36ce2958f65`.

Recovery output:

```xml
<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thank you for calling Neighborhood Listing Platform. We could not find an active property for this number. Please visit our website to browse available homes. Goodbye.</Say><Hangup/></Response>
```

## Database and deployment notes

- Current properties use UUID IDs and `status = 'approved'`.
- Migration `20261128060000_create_voice_number_routes.sql` was applied
  through the guarded manual GitHub Actions job.
- Earlier production endpoint inspection returned HTTP 404.
- The new voice implementation has not yet been merged or verified
  on the production telephone path.
- Keep PR #12 as a draft while the remaining cases are implemented.
