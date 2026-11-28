# AI Collaboration Log

## App shell lab

This lab was completed within an existing Next.js project.
The setup/app-shell branch was advanced to origin/main before
adding the missing app-shell content. The project was not scaffolded again.

### Prompts

**ChatGPT request:** Explain the proposed stack in plain language and
help complete the existing neighborhood platform app-shell lab step by step.

**Gemini prompt — App Shell Architect:**

Act as a senior teaching assistant. Explain in plain language a minimal
Next.js App Router + TypeScript + Tailwind stack for a neighborhood
property platform.

My existing repository already has Next.js, TypeScript, Tailwind,
ESLint, a src directory, and property and sponsor components.

Propose a file plan and terminal commands to complete an app shell
with a heading, project purpose, and three feature cards:
listings, neighborhood sponsors, and voice help.

Include accessible HTML requirements and a verification checklist.
Preserve existing features. Do not scaffold over the existing app.
Give commands plus a file plan, not a giant code dump.
Never invent command results or credentials. Include no secrets.
Clearly label any proposed voice functionality that is not connected.

### Comparison

1. ChatGPT explained Git, GitHub, and Vercel alongside the application
   stack. Gemini gave more detail about layout.tsx and the src directory.
2. Gemini suggested an optional reusable FeatureCard component and a
   separate TypeScript check. ChatGPT proposed keeping changes focused
   on the homepage, README, and AI log.

### Decisions and verification

| Tool | Prompt | Output used | Output rejected or not used | Verification | Commit |
| --- | --- | --- | --- | --- | --- |
| ChatGPT | Stack explanation and guided completion of the existing app shell | Preserve existing components; add three feature cards, metadata, a skip link, and verification steps | Fresh scaffolding was not used because the application already existed; no fabricated command results were accepted | git diff --check, npm run lint, and npm run build passed; local page loaded on port 3001 | `5599080` |
| Gemini / Google AI Studio | App Shell Architect prompt above | Semantic cards, descriptive headings, keyboard focus, responsive layout, and honest voice integration status | Optional FeatureCard extraction and disabled microphone button were not used; the small shell uses inline cards and a text status | Compared suggestions with existing files; build and lint passed; browser screenshot shows stacked cards; user reported clicks work | `5599080` |

### Observed results

- Node: v24.21.0
- npm: 11.19.0
- Git: 2.39.2 (Apple Git-143)
- Local URL: http://localhost:3001
- Production build and lint passed.
- Initial browser inspection showed a stylesheet HTTP 500 and an older page.
- After stopping development servers, clearing .next, and restarting on
  port 3001, the updated styled page loaded with HTTP 200 responses.
- The latest console screenshot shows no red error entries and includes
  a yellow LMS adapter warning whose source has not been established.
- The user reported that clicks work.
- Keyboard focus makes the skip link visible with a focus outline,
  confirmed by the local-page screenshot.
- Hosted app shell verified in Chrome Incognito on November 25, 2026.
- Production Release Gates passed for merge commit 7454382 (PR #9).
- CI troubleshooting: replaced an invalid Supabase access token,
  configured an IPv4 session-pooler migration dry run in c31a40c,
  and restored the original applied migration in 75fb18b.
- No migration-history repair was performed.
- Voice help is not connected to this webpage; the separate Vapi
  assistant is not represented as an active webpage integration.
- No credentials or private environment values are included in this log.

## Lab 2 — typed accessible components

### Interface prompt evidence

Google AI Studio was asked for TypeScript interfaces and supporting
type aliases only, preserving existing property and sponsor fields.
The request required image alternative-text fields, optional detail
URLs and phone numbers, typed filters and callbacks, and comments
distinguishing compile-time types from runtime validation.

Before revision: SearchFiltersProps lacked a parent-supplied city list;
validation guidance did not explicitly require an integer bedroom count.

Follow-up prompt:

> Revise your interfaces only, preserving the existing field names.
> Add a required cities: readonly string[] property to SearchFiltersProps.
> The parent will derive these options from the sample property data.
> Clarify that minBedrooms requires runtime validation as a finite,
> nonnegative integer, and city must be empty (all cities) or one
> of the supplied cities.
> Preserve the distinction between compile-time types and runtime validation.
> Keep detailUrl and agentPhone optional. Do not invent fallback values.
> Return the revised interfaces and type aliases only.

After revision: accepted the city list and validation requirements;
condensed the explanatory comments in the implementation.
Shared types and the hierarchy were committed in c204c19.

### Component review prompts

ChatGPT reviewed the supplied PropertyCard, SponsorBanner,
SearchFilters, and ListingExplorer source using the lab's requested
issue / why it matters / smallest change / manual test format.

The independent Gemini review used this prompt:

> Review these React/TypeScript components for semantic HTML,
> WCAG-oriented keyboard access, responsive behavior, and TypeScript
> safety. Focus especially on accessibility.
>
> Return a table with:
> issue, why it matters, smallest change, and a manual test.
>
> Distinguish definite code findings from concerns that require
> browser or assistive-technology testing. Do not claim compliance
> from code alone, invent test results, or rewrite the components.
>
> Context:
> - Property cards appear beneath an h2 section heading.
> - The parent supplies three demonstration properties with unique IDs.
> - The user confirmed keyboard navigation and responsive layouts
>   at 375, 768, and 1280 px.
> - A local Lighthouse Mobile accessibility audit scored 100.
> - Form validation error paths and screen-reader announcements
>   have not yet been tested.
>
> Propose only focused improvements appropriate to this component lab.

Gemini initially received only the earlier types and declined to review
missing components. The four component files and shared types were
then supplied, and Gemini returned its critique.

### Decisions

| Tool | Suggestion | Decision and verification | Commit |
| --- | --- | --- | --- |
| ChatGPT | Lift favorite state out of individual cards | Accepted after reproducing lost favorites; manual retest and regression test passed | e7af7da, 5e18c76 |
| ChatGPT and Gemini | Include submitted criteria in result status | Accepted; different one-result searches now show different city text; browser and regression checks passed; spoken announcements remain untested | bf73563, 5e18c76 |
| Gemini | Reject whitespace bedroom values and clear corrected errors | Accepted; manual and automated checks verified rejection, focus, error association, and clearing | bf73563, 5e18c76 |
| Gemini | Make favorite labels static | Not adopted; retained descriptive action labels and aria-pressed. Contradictory screen-reader behavior was not verified | Existing implementation retained |
| Gemini | Make sponsor heading level configurable | Not adopted for this page: its h3 is already beneath an h2 section heading | Existing implementation retained |
| Gemini | Add forced-colors outlines, a visible new-tab cue, trim optional link fields, and enlarge targets | Deferred; these suggestions were not implemented or claimed as verified | None |
| Gemini | Change error announcement timing | Deferred pending assistive-technology testing; DOM association and focus tests do not establish speech behavior | None |

### Implementation commits

- c204c19: shared types and component hierarchy.
- 9fe5071: typed PropertyCard and keyboard-operable favorite.
- 92f1ea0: typed SponsorBanner with accurate image alternative.
- 2eaafe1: labeled SearchFilters and validation.
- 6325dc4: three-property responsive filtering grid.
- e7af7da: favorites retained across filtering.
- bf73563: clearer result status and validation corrections.
- 5e18c76: regression tests.

See [Lab 2 verification](lab2-verification.md) for actual test results,
audit limitations, troubleshooting, and pending classmate review.
No secrets or private environment values were supplied to either AI.
