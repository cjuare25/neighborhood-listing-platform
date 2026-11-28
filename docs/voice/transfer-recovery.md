# Human-transfer recovery — partial verification

## Configuration reference

Vapi tool: transfer_call_tool, version v4.
Defense: destinations[].transferPlan
- mode: warm-transfer-experimental
- transferAssistant.model.messages: operator acceptance/cancellation rules
- fallbackPlan.endCallEnabled: false
- fallbackPlan.message: spoken connection-failure message

## Actual test

November 28, 2026, approximately 01:14–01:15 Pacific Time.
Inbound call to the Vapi-provided number.
Main assistant: Neighborhood Leasing Assistant v5.

Trigger:
Caller requested a human. The destination returned an automated prompt:
"Please enter your password. Then press pound."

Observed evidence:
- At 01:15:12.745, the transfer assistant's model request contained
  that automated prompt as its latest user message.
- At 01:15:13.253, Vapi logged call.transferCancelled.
- Nia returned and said:
  "I couldn't connect you to the leasing team. I'm still here to help
  with general questions. You can also visit our website."
- Caller asked for demonstration office hours.
- Nia correctly answered Monday through Friday, 9 a.m.–5 p.m. Pacific.
- Displayed ended reason:
  "Customer ended call after warm transfer attempt"

## Scope and remaining work

Verified: automated-destination transfer cancellation, spoken fallback,
and continued caller conversation on the Vapi telephone path.

Not established: carrier busy/no-answer status, voicemail classification,
SMS follow-up, or integration with the Next.js Twilio webhook.

The caller and configured transfer destination matched in the inspected
configuration. Use a separate caller line for the next controlled test.
No passwords, caller phone numbers, or credentials are included here.
