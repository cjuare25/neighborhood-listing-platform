# Hosted Deployment Verification

Application:
https://neighborhood-listing-platform-mauve.vercel.app

Submission pull request:
https://github.com/cjuare25/neighborhood-listing-platform/pull/6

Source branch: exam/practical-persistence-eval
Source commit: 53286ae
Hosting provider: Vercel
Deployment environment: Production

Vercel required the first deployment to use Production.
The application was deployed from the local examination branch.

## Verified

- Vercel reported the deployment Ready.
- Hosted screenshot shows three demonstration property cards.
- GET /api/properties returned HTTP 200 with three listings and sponsor tiers.
- A valid POST /api/properties without authentication returned HTTP 401.
- Responses included Cache-Control: no-store.

## Hosted Environment

- SUPABASE_URL configured for Production.
- SUPABASE_ANON_KEY configured as a Secret for Production.
- The service-role key remains local for administrative verification.

## Pending

- Hosted inquiry-form submission confirmation.
- Remaining manual responsive-layout and keyboard checks.
