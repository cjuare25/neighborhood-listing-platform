# Midterm AI Provenance Journal

The student completed the examination independently.
AI assistance supported implementation and review. The student executed
the recorded commands and browser checks.

Model versions were not recorded. Historical progress notes are retained
in ai-log-checkpoints.md.

| Step / Tool | Prompt Summary | Model Output Used | Model Output Rejected & Rationale | Verification Method | Associated Git Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Setup and requirements / ChatGPT | Supplied examination instructions and terminal context. | Branch setup, ignore rules, three user stories and acceptance criteria. | No rejected output recorded for this step. | Branch/status checks and environment filename ignore checks. | 419bcc5 |
| Database / ChatGPT | Implement examination tables and security while preserving earlier lab data. | UUID schema, private legacy archive, grants, and RLS policies. | No rejected output recorded for this step. | Migration applied; histories matched; five tables had RLS enabled; archived property count was one. | 2e19513 |
| Validation / ChatGPT | Implement the examination property contract. | Strict Zod schema and validation tests. | Client-controlled ownership and approval fields are rejected by the contract. | All 17 property validation tests passed. | e7160b0 |
| API and authorization / ChatGPT | Implement server-isolated clients, routes, and authorization verification. | Property GET/POST handlers and repeatable security audit. | npm audit fix --force was not used because it proposed a breaking ESLint downgrade. | Lint, build, 21 unit tests, 15 authorization checks, and fixture cleanup passed. | 7781e8d |
| UI and inquiries / ChatGPT | Implement live cards, responsive layout, and private inquiry submission. | Semantic cards, live grid, inquiry validator/endpoint, and demonstration seed script. | No rejected output recorded for this step. | Lint/build and recorded browser screenshots; see ui-verification.md for pending checks. | 50e6683 |
| Credential history / ChatGPT | Guide a credential-history scan. | Official Gitleaks download, checksum verification, and redacted scan commands. | Homebrew installation path was replaced because Homebrew was unavailable. | Gitleaks 8.30.1 scanned 11 commits and reported no leaks. | d6b640c |
| Merge resolution / ChatGPT | Reconcile examination work with updated main. | Preserved tested examination UI and original migration; retained compatible image work. | Replacing the examination UI with the older sample UI was not adopted. | Lint, 21 tests, build, and four matching migration histories. | 53286ae |
| Deployment / ChatGPT | Configure and verify hosted examination application. | Vercel project linking, hosted connection settings, and deployment commands. | Initial Preview deployment command failed because Vercel requires the first deployment to use Production. | Deployment Ready; hosted GET 200 with three listings; unauthenticated POST 401. | 53286ae (deployed source) |
| SQL review / Gemini | Review migration for draft disclosure, ownership violations, self-approval, inquiry disclosure, and role escalation. | Policy interpretations supporting the existing implementation. | Blanket security assurance, trigger implication, and optional inquiry-policy change were not adopted; see gemini-security-review.md. | Compared static review against source and previously executed audit. No new SQL execution claimed. | 2e19513 (reviewed implementation) |
| Access attempt / Google AI Studio | Attempt to obtain the prepared accessibility review. | No output generated or used. | Access required age verification, which was not completed because of time constraints. | Student observed the age-verification requirement. | N/A — access attempt only |

## Exact Prompt Records

- Gemini: prompts/gemini-security-review.txt contains the prepared review
  prompt and supplied migration source.
- Google AI Studio: prompts/ai-studio-accessibility-review.txt contains the
  prepared prompt and source. This review was not executed.
- ChatGPT: the initial request supplied the examination assignment and
  its attached handout, Pasted markdown.md. Subsequent messages supplied
  terminal outputs, screenshots, and troubleshooting questions.
  The full follow-up conversation has not been transcribed into this repository.

## Accepted Outputs and Independent Verification

Implementation files can be inspected at the associated commits.
Evidence is recorded in:
- security-audit.md
- ui-verification.md
- credential-verification.md
- deployment-verification.md
- gemini-security-review.md

AI-generated tests and scripts were executed by the student. Gemini's
review is static analysis and is not counted as an executed test.

## Remaining Limitations

- Google AI Studio usage was not completed because age verification was required.
- Full exact ChatGPT follow-up prompt transcripts have not been archived.
- Responsive and complete keyboard checks remain unconfirmed.
- Hosted inquiry-form submission remains unconfirmed.
- Sixteen moderate development-tool dependency findings remain documented;
  the production dependency audit reported zero vulnerabilities.
