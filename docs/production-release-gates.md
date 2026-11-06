# Production Release Gates

## Project and Pipeline Context

- Repository: `cjuare25/neighborhood-listing-platform`
- Application: Next.js App Router with TypeScript and Tailwind CSS
- Database: Supabase PostgreSQL
- Deployment platform: Vercel
- Pipeline: `.github/workflows/production-release.yml`
- Production branch: `main`
- Local Node.js version used for verification: `v24.21.0`
- Release-gate branch: `ci/production-release-gates`

Pull requests into `main` execute the application-quality and database-security jobs. A push to `main` executes those jobs and, only after both pass, proceeds to the production deployment, smoke test, and conditional rollback.

Secrets are stored in GitHub Actions secrets and are never committed to the repository.

---

## Gate 1 — Production Build

### Automated Trigger / Command

Local command:

```bash
npm run build
```

GitHub Actions step:

```yaml
- name: Gate 1 - Production build
  run: npm run build
```

The npm script executes:

```json
"build": "next build"
```

### Pass Criteria — Exit Code 0

The pipeline advances only when all of the following complete successfully:

- Next.js production bundle compilation
- TypeScript static type checking
- Page-data collection
- Static-page generation
- Route generation
- Production artifact finalization

Successful verification included:

```text
Compiled successfully
Finished TypeScript
Generating static pages
Route (app)
├ ○ /
├ ○ /_not-found
└ ƒ /api/health
```

### Blocking Failure Evidence

A compilation or type-checking failure produces a nonzero exit and output such as:

```text
Failed to compile.
Type error: ...
Error: Process completed with exit code 1.
```

Any nonzero result from `next build` immediately halts the dependent deployment jobs.

---

## Gate 2 — Automated Test Suite

### Automated Trigger / Command

Local command:

```bash
npm test
```

GitHub Actions step:

```yaml
- name: Gate 2 - Automated unit tests
  run: npm test
```

The npm script executes:

```json
"test": "vitest run src"
```

The suite currently verifies:

- Deterministic sponsor eligibility and precedence
- Null selection when no sponsor is eligible
- Acceptance of a valid HTTPS sponsor destination
- Rejection of an unsafe HTTP sponsor destination

### Pass Criteria — Exit Code 0

Every Vitest test file and assertion must pass. Current evidence:

```text
Test Files  2 passed (2)
Tests       4 passed (4)
```

### Blocking Failure Evidence

Any failed assertion produces a nonzero exit. The blocking signature is:

```text
Test Files  1 failed
Tests       1 failed
Error: Process completed with exit code 1.
```

A failed unit test prevents both database-dependent approval and production deployment.

---

## Gate 3 — Data Migration Integrity

### Automated Trigger / Command

Local command:

```bash
npm run check:migrations
```

The npm script executes:

```json
"check:migrations": "supabase db push --dry-run"
```

GitHub Actions first links the protected project and then performs the dry run:

```yaml
- name: Link Supabase project
  run: >
    npx supabase link
    --project-ref "$SUPABASE_PROJECT_ID"
    --password "$SUPABASE_DB_PASSWORD"

- name: Gate 3 - Data migration integrity
  run: npm run check:migrations
```

### Pass Criteria — Exit Code 0

The Supabase CLI must:

- Authenticate successfully
- Connect to the intended project
- Match local and remote migration histories
- Parse all pending SQL migrations
- Complete the dry run without applying schema changes

Current passing evidence:

```text
DRY RUN: migrations will *not* be pushed to the database.
Connecting to remote database...
Remote database is up to date.
```

### Blocking Failure Evidence

Migration divergence or an invalid migration stops the job. Previously observed migration-history failure:

```text
Remote migration versions not found in local migrations directory.
Make sure your local git repo is up-to-date.
```

Other SQL or connection failures also return a nonzero exit and prevent deployment.

---

## Gate 4 — Row-Level Security Enforcement

### Automated Trigger / Command

Local command:

```bash
npm run test:rls
```

The npm script executes:

```json
"test:rls": "node --env-file-if-exists=.env.local scripts/test-rls.mjs"
```

GitHub Actions step:

```yaml
- name: Gate 4 - Row-Level Security enforcement
  run: npm run test:rls
```

The test sends an anonymous `DELETE` request against a nonmatching UUID in `public.properties`.

### Pass Criteria — Exit Code 0

The request must be denied with:

- HTTP `401` or `403`
- PostgreSQL error code `42501`

Current passing evidence:

```text
RLS_GATE_PASSED: anonymous DELETE blocked with HTTP 401 and PostgreSQL code 42501.
```

### Blocking Failure Evidence

Missing configuration blocks the gate:

```text
RLS_GATE_FAILED: SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are required.
```

A response that does not prove RLS enforcement also blocks the gate:

```text
RLS_GATE_FAILED: anonymous DELETE was not blocked as expected. HTTP 204.
```

The script exits with code 1 unless the expected RLS denial is observed.

---

## Gate 5 — Accessibility Gate

### Automated Trigger / Command

Local command:

```bash
npm run test:a11y
```

The npm script executes:

```json
"test:a11y": "playwright test tests/e2e/accessibility.spec.ts"
```

GitHub Actions step:

```yaml
- name: Gate 5 - Accessibility
  run: npm run test:a11y
```

The test uses `@axe-core/playwright` with WCAG 2.0 A/AA and WCAG 2.1 A/AA tags.

### Pass Criteria — Exit Code 0

The rendered home page must:

- Return HTTP `200`
- Have zero `serious` Axe violations
- Have zero `critical` Axe violations

Current passing evidence:

```text
home page has no serious or critical WCAG violations
1 passed
```

### Blocking Failure Evidence

The gate previously detected this serious violation:

```text
"id": "label-content-name-mismatch"
"impact": "serious"
"message": "Text inside the element is not included in the accessible name"
1 failed
```

The sponsor link was corrected so its accessible name now includes its visible text:

```tsx
aria-label={`Visit sponsor: ${sponsor.name}. Sponsored Partner. Opens in a new tab.`}
```

Any serious or critical violation causes Playwright to exit nonzero and halt the release.

---

## Gate 6 — Usability / Core Flow Check

### Automated Trigger / Command

Local command:

```bash
npm run test:e2e
```

The npm script executes:

```json
"test:e2e": "playwright test tests/e2e/core-flow.spec.ts"
```

GitHub Actions step:

```yaml
- name: Gate 6 - Core user flow
  run: npm run test:e2e
```

The Playwright flow verifies that a user can:

1. Open the home page successfully.
2. Use “Browse this neighborhood.”
3. Reach the Featured properties section.
4. Add the featured property to favorites.
5. Observe the button change to “Remove ... from favorites.”
6. See the sponsored-partner disclosure.
7. Verify that the sponsor link contains `rel="sponsored"`.

### Pass Criteria — Exit Code 0

Every required locator, state transition, URL fragment, and attribute assertion must pass.

Current evidence:

```text
user can browse the featured property and save it as a favorite
1 passed
```

### Blocking Failure Evidence

A previous accessible-name mismatch produced:

```text
Error: expect(locator).toHaveAttribute(expected) failed
Error: element(s) not found
Timeout: 5000ms
1 failed
```

Any missing control, broken interaction, incorrect accessible name, or failed assertion exits nonzero and blocks deployment.

---

## Gate 7 — Deployment Smoke Test

### Automated Trigger / Command

Local verification command:

```bash
npm run test:smoke -- http://localhost:3000
```

Post-deployment GitHub Actions step:

```yaml
- name: Gate 7 - Deployment smoke test
  id: smoke
  env:
    DEPLOYMENT_URL: ${{ steps.deploy.outputs.deployment_url }}
  run: npm run test:smoke -- "$DEPLOYMENT_URL"
```

The npm script executes:

```json
"test:smoke": "node scripts/smoke-test.mjs"
```

The script checks:

- `GET /api/health`
- `GET /`
- HTTP `200` for both endpoints
- Health JSON contains `status: "ok"`
- Health JSON identifies `neighborhood-listing-platform`
- Home HTML contains `Neighborhood Property Listings`

### Pass Criteria — Exit Code 0

Current local passing evidence:

```text
SMOKE_TEST_PASSED: http://localhost:3000 returned HTTP 200 for /api/health and /.
```

### Blocking Failure Evidence

An unreachable deployment produced:

```text
SMOKE_TEST_FAILED: health endpoint could not be reached: fetch failed
```

A missing health route previously produced:

```text
HTTP/1.1 404 Not Found
```

Any connection failure, non-200 response, invalid health JSON, or missing application heading returns exit code 1 and activates Gate 8.

---

## Gate 8 — Automated Rollback Protocol

### Automated Trigger / Command

GitHub Actions condition:

```yaml
- name: Gate 8 - Roll back failed production release
  if: failure() && steps.smoke.outcome == 'failure'
  run: npm run rollback:production
```

The npm script executes:

```json
"rollback:production": "bash scripts/rollback-production.sh"
```

The rollback script executes:

```bash
npx --yes vercel@65.12.1 rollback \
  --token "$VERCEL_TOKEN" \
  --scope "$VERCEL_ORG_ID" \
  --no-color

npx --yes vercel@65.12.1 rollback status \
  --token "$VERCEL_TOKEN" \
  --scope "$VERCEL_ORG_ID" \
  --no-color
```

### Pass Criteria — Exit Code 0

The rollback protocol advances only when:

- Required Vercel identifiers and token are available.
- The CI workspace is linked to the intended Vercel project.
- Vercel accepts the rollback request.
- `vercel rollback status` completes successfully.

Successful completion prints:

```text
ROLLBACK_COMPLETED: Vercel reported the rollback status successfully.
```

The rollback redirects production traffic to the previous eligible production deployment.

### Blocking Failure Evidence

Safe local verification without credentials produced:

```text
ROLLBACK_FAILED: VERCEL_TOKEN is required.
```

Other protected failure messages include:

```text
ROLLBACK_FAILED: VERCEL_ORG_ID is required.
ROLLBACK_FAILED: VERCEL_PROJECT_ID is required.
ROLLBACK_FAILED: the Vercel project must be linked before rollback.
```

A failed Vercel rollback command exits nonzero because the script uses:

```bash
set -euo pipefail
```

---

## Required GitHub Actions Secrets

The following names must be configured under:

`Repository Settings → Secrets and variables → Actions`

Supabase:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Vercel:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Secret values must never be pasted into documentation, workflow files, screenshots, commits, pull requests, or chat messages.

---

## Release Decision

The pipeline permits production deployment only when Gates 1 through 6 return exit code 0. After deployment, Gate 7 validates the live application. A Gate 7 failure automatically invokes Gate 8 to restore the previous production deployment.

A failed command in any gate produces a nonzero exit code, marks the GitHub Actions job as failed, and blocks dependent jobs.