# Gemini Security Review

Tool: Gemini
Model version: not recorded
Method: static source-code review; no database execution by Gemini.

Exact prompt and supplied SQL:
prompts/gemini-security-review.txt

## Output Used

Gemini identified the following controls as correctly configured:
- Approved-only public property reads and owner-scoped private reads.
- Owner-scoped updates and deletes.
- Owner self-approval prevented by WITH CHECK.
- Inquiry visibility restricted to the associated property owner.
- Profile role escalation blocked by missing client write grants.

These interpretations agree with the separately executed authorization
checks documented in security-audit.md. No SQL changes were made.

## Output Not Adopted and Rationale

- The broad statement that all controls are secure is not treated as a
  comprehensive security guarantee. Static review cannot establish that.
- The reference to role-assignment triggers does not describe this migration:
  no profile-provisioning trigger is defined.
- Restricting inquiry insertion to approved properties was not adopted.
  The examination permits anyone to insert an inquiry, subject to constraints.

## Additional Test Suggestions

Gemini recommended draft-read, self-approval, cross-owner update/delete,
role-escalation, inquiry-isolation, and draft-inquiry tests.

Existing audit results cover several of these scenarios. Cross-owner DELETE
and draft-inquiry insertion were not separately executed in the recorded audit.
