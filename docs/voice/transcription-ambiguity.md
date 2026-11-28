# Transcription ambiguity — TA-01

Configuration: Neighborhood Leasing Assistant, Vapi version v5.
Location: appended to the assistant system prompt.

## Configured rule

If a street name is garbled, incomplete, or could reasonably refer
to more than one street, do not guess the address or invent a match.

Ask one focused question:
"Could you spell the street name, please?"

Wait for the caller's answer. Read back your understanding and ask
for confirmation before using the street name in a property lookup.

If an actual transcription-confidence value is supplied and is below
0.45, treat that transcription as uncertain. Never invent a confidence
score or claim that a score was supplied when it was not.

If the street remains unclear after one clarification attempt, explain
that you cannot identify the property reliably and offer human help.
Follow the existing escalation and transfer rules if the caller
requests a human. Never claim a transfer succeeded without confirmation.

## Observed browser-call test

Date: November 28, 2026.
Evidence: Screenshot 2026-11-28 at 12.50.21 AM.png.

The transcript captured the opening as:
"I'm looking for a rental. But I'm not sure whether the street is
Maple or Maple."

Observed sequence:
1. Nia asked: "Could you spell the street name, please?"
2. Caller answered: "M-A-P-L-E."
3. Nia read back Maple Street and asked whether that was correct.
4. Caller answered: "Yes."
5. Nia continued by asking how many bedrooms were needed.

Result: spelling clarification and confirmation passed.

Scope: Vapi browser call only. No numeric STT-confidence score was
observed. This does not verify the below-0.45 threshold, a property
lookup, or the integrated Twilio telephone path.
