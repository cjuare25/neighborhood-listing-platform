# Lab 2 verification

Date: November 25, 2026
Branch: lab/typed-accessible-components

## Implementation

- Shared Property, Sponsor, and component prop contracts.
- PropertyCard: named article, h3 beneath the section h2, price,
  facts list, descriptive image alternative, and native favorite button.
- SponsorBanner: shared types, visible Sponsored Partner disclosure,
  business-specific link text, approval check, and URL validation.
- SponsorCard remains a compatibility re-export.
- SearchFilters: labeled selects, fieldset/legend, submit button,
  runtime validation, associated error text, and invalid-field focus.
- ListingExplorer: submitted filters, result status, empty state,
  stable property IDs, and favorites retained while filtering.
- Three demonstration listings share a clearly disclosed illustrative photo.
- Component hierarchy is documented in README.md.

## Manual browser checks

The student reported these checks passed locally on port 3001:

- Matching-city filtering, empty results, and restoring all listings.
- Property grid: one column at 375 px, two at 768 px,
  and three at 1280 px; no sideways scrolling or clipped controls.
- Tab and Shift+Tab navigation, visible focus, keyboard selection,
  Enter submission, Space favorite activation, and no keyboard traps.
- Favorite retention after filtering a card out and back in.
- Independent favorite buttons.
- Result status identifies the submitted city and bedroom criteria.
- A whitespace-only bedroom option is rejected.
- Validation moves focus to the invalid field.
- Changing the invalid selection clears its error.

The favorite-retention test initially failed in the browser:
Maple Street lost its favorite after filtering to Pasadena and back.
Commit e7af7da moved favorite state into ListingExplorer.
The repeated manual test passed.

## Lighthouse

Chrome DevTools Lighthouse, Navigation mode, Mobile device,
Accessibility category, local development page:

- Initial score: 100/100, with a browser-cache-clearing timeout warning.
- Repeated score: 100/100; that warning was absent.
- This audit preceded the later favorite and validation improvements.
- Screenshots were inspected during the lab.

This score does not establish WCAG conformance or verify screen-reader speech.

## Final automated checks

- git diff --check: passed.
- npm run lint: passed.
- npm run build: passed after the application changes.
- npm run test:e2e: 3 passed.
- npm run test:a11y: 1 passed.

The accessibility test checks for serious or critical axe violations
using the configured WCAG tags. It does not assert that every possible
accessibility issue is absent.

## Test troubleshooting

Initial Playwright runs reused an older Next.js server on port 3000
from /Users/capcat/Downloads/neighborhood-listing-platform.
After identifying and stopping that process, Playwright started
the current production build.

The validation test initially matched both the form error and
Next.js's route announcer. Scoping the alert locator to the named
search form resolved that test-selector failure.

Regression tests are recorded in commit 5e18c76.

## Limits and pending review

- Screen-reader announcements have not been verified.
- Forced-colors mode and 200%/400% zoom have not been verified.
- Favorites persist during filtering, but reset on page refresh.
- This branch has not yet been verified on a hosted preview.
- Classmate review is pending before merge.

The classmate must provide one strength, one risk, and one
recommendation they actually tested, including steps and results.
