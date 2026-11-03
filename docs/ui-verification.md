# UI Verification

## Verified

- Desktop screenshot shows three property cards in three columns.
- Live demonstration listings display prices, beds, baths, square footage,
  sponsor names, and sponsor tiers.
- The details control expands the inquiry form.
- A screenshot shows a visible focus ring on the Send inquiry button.
- Browser validation blocks an empty form submission.
- A completed inquiry displays "Your inquiry has been sent."
- The form clears after successful submission.
- ESLint and the production build passed after the UI implementation.

## Still awaiting manual confirmation

- One-column mobile layout.
- Two-column tablet layout.
- Complete navigation with Tab and Shift+Tab.
- Details button activation with Enter and Space.

## Demonstration data

scripts/seed-exam-demo.mjs creates three fictional, labeled demonstration
listings and active sponsors using an existing property-owner profile.
