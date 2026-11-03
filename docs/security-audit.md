# Examination Security Audit

Execution time (UTC): 2026-11-03T03:54:22.989Z

Runner: scripts/exam-security-audit.mjs
Tests use temporary accounts and records in the configured Supabase project.
User operations use anonymous or authenticated clients; administrative
setup, verification, and cleanup use a separate service-role client.
Only listed checks were executed. A failure may stop later checks.

| Check | Observed result |
| :--- | :--- |
| Admin can insert and read across all five tables | PASS |
| Anonymous approved read allowed; draft reads denied | PASS |
| Anonymous sponsor reads expose only active sponsors | PASS |
| Public associations hide inactive sponsors | PASS |
| Owner A can update Owner A draft | PASS |
| Owner A cannot update Owner B listing | PASS |
| Owner cannot edit an approved listing | PASS |
| Owner cannot approve their own draft | PASS |
| User cannot grant themselves an admin profile | PASS |
| Anonymous and authenticated inquirers can submit inquiries | PASS |
| Anonymous users cannot select inquiries | PASS |
| Authenticated public inquirer cannot read existing inquiries | PASS |
| Owner A sees only inquiries for Owner A properties | PASS |
| Authenticated API POST persists an owner-linked draft with HTTP 201 | PASS |
| Public API includes approved sponsored fixture and excludes drafts | PASS |
| Temporary fixture cleanup | PASS |

## Previously verified HTTP smoke checks

- Public GET returned HTTP 200.
- POST with an extra status field returned HTTP 400 and structured details.
- Valid POST without authentication returned HTTP 401.
- Malformed JSON returned HTTP 400.

## Dependency verification

- Next.js updated to 16.4.4.
- Production dependency audit reported zero vulnerabilities.
- Full dependency audit still reported 16 moderate development-tool findings.

