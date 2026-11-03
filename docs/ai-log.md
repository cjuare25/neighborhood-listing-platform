# Midterm AI Provenance Journal

Record exact prompts and relevant outputs below as work progresses.
Replace pending commit references with actual hashes after committing.
Record only verification that was actually performed.

| Step / Tool | Prompt Summary | Model Output Used | Model Output Rejected & Rationale | Verification Method | Associated Git Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Environment setup / ChatGPT | Guided exam branch setup, ignore checks, and dependency installation. | Terminal commands for setup and inspection. | None recorded for this step. | Terminal showed the exam branch, six ignored paths, no tracked environment files from the filename check, and successful npm ci. | Pending |

## Exact Prompts and Output Notes

Add the exact prompts used for implementation, accepted output, rejected output where applicable, and independent verification results.

## Property Validation Verification

ChatGPT supplied src/schemas/property.ts and its Vitest tests.
Accepted implementation: strict validation of required listing fields,
rejection of extra fields, and database-compatible numeric limits.

Independent verification:
npm test -- src/schemas/property.test.ts
Result: 17 tests passed.

These tests verify the validation contract only. API persistence and
database authorization tests are still pending.

Related database implementation commit: 2e19513.
Validation implementation commit: see Git history for
"feat: validate property submission payloads".
