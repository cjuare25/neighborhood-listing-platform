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

## Server API and Security Audit Verification

ChatGPT supplied the server client, property API handlers, and repeatable
security audit script. The student executed and reviewed the checks.

Verified:
- Lint and production build passed.
- All 21 unit tests passed.
- Production dependency audit reported zero vulnerabilities.
- Public GET returned HTTP 200.
- Extra-field and malformed-JSON submissions returned HTTP 400.
- Unauthenticated valid submission returned HTTP 401.
- All 15 database/API authorization checks passed.
- Authenticated POST returned HTTP 201 with an owner-linked draft.
- Temporary audit records and accounts were cleaned up.

Evidence:
- scripts/exam-security-audit.mjs
- docs/security-audit.md

The npm suggestion to use audit fix --force was not followed because
it proposed a breaking ESLint downgrade. Sixteen moderate
development-tool dependency findings remain documented.

Exact-prompt records and final commit references still need completion.

## Accessible Listing UI and Inquiry Form

ChatGPT supplied the live property grid, semantic property cards,
inquiry validation and endpoint, and demonstration-data script.

Accepted output:
- Semantic article, header, heading, and specification list.
- Responsive one/two/three-column Tailwind grid.
- Labeled inquiry controls and visible focus styles.
- Anonymous inquiry insertion without returning inquiry records.

Verification:
- ESLint and production build passed.
- Student screenshots confirmed desktop cards, an expanded form,
  visible button focus, empty-form validation, and successful submission.
- See docs/ui-verification.md for confirmed and pending manual checks.

Associated implementation: see commit
"feat: add accessible property grid and private inquiry form".

## Credential History Verification

ChatGPT supplied commands to download the official Gitleaks release,
verify its published checksum, and scan Git history.

Student verification:
- Download checksum matched.
- Gitleaks version: 8.30.1.
- Repository shallow-history check returned false.
- Scan across all available Git references examined 11 commits.
- Result: no leaks found.

Evidence: docs/credential-verification.md
