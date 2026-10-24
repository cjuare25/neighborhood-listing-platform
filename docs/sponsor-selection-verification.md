# Sponsor Selection Verification

## 1. SQL and Database Query Definition

The sponsor-selection logic is implemented in:

`supabase/migrations/20261024210441_create_sponsors_selection.sql`

The database function accepts a property ID, obtains that property's ZIP code, filters ineligible sponsors, and returns one sponsor using deterministic ordering.

```sql
create or replace function public.get_active_sponsor_for_property(
  p_property_id bigint
)
returns table (
  sponsor_id bigint,
  sponsor_name text,
  tier text,
  destination_url text,
  distance_miles numeric,
  impressions bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.id as sponsor_id,
    s.name as sponsor_name,
    s.tier,
    s.destination_url,
    scope.distance_miles,
    s.impressions
  from public.properties as property
  join public.sponsor_zip_scopes as scope
    on scope.zip_code = property.zip_code
  join public.sponsors as s
    on s.id = scope.sponsor_id
  where property.id = p_property_id
    -- Administrative approval requirement
    and s.status = 'APPROVED'
    -- Temporal campaign-validity requirement
    and current_date between s.start_date and s.end_date
    -- Spatial requirement: the join requires the property's exact ZIP
    and scope.zip_code = property.zip_code
  order by
    -- 1. Highest paid tier
    case s.tier
      when 'PLATINUM' then 3
      when 'GOLD' then 2
      when 'SILVER' then 1
      else 0
    end desc,
    -- 2. Shortest distance within the matching ZIP
    scope.distance_miles asc,
    -- 3. Fewest prior impressions
    s.impressions asc,
    -- 4. Stable final tie-breaker
    s.id asc
  limit 1;
$$;
```

### Enforcement annotations

- **Administrative status:** `s.status = 'APPROVED'` excludes sponsors that are pending or rejected.
- **Temporal validity:** `current_date between s.start_date and s.end_date` permits only campaigns active on the date of the query.
- **Spatial/ZIP scope:** `scope.zip_code = property.zip_code` requires an exact match between the sponsor's ZIP scope and the property's ZIP code.
- **Single result:** `limit 1` returns only the highest-ranked eligible sponsor.

## 2. Deterministic Tie-Breaking and Fallback Execution

The test property uses ZIP code `90032`.

| Sponsor | Tier | Distance | Impressions | Status | Dates | Eligibility |
|---|---:|---:|---:|---|---|---|
| Sponsor A | Silver | 0.4 miles | 120 | Approved | Active | Eligible |
| Sponsor B | Gold | 1.2 miles | 45 | Approved | Active | Eligible |
| Sponsor C | Gold | 0.8 miles | 90 | Approved | Active | Eligible |
| Sponsor D | Platinum | 0.2 miles | 10 | Pending | Active | Excluded |

### Executed order of precedence

1. **Administrative eligibility:** Sponsor D is excluded because its status is `PENDING`, not `APPROVED`. Its Platinum tier and short distance are never considered.
2. **Temporal eligibility:** Sponsors A, B, and C have active start and end dates, so they remain eligible.
3. **ZIP eligibility:** Sponsors A, B, and C match property ZIP `90032`.
4. **Tier:** Gold ranks above Silver. Sponsors B and C therefore rank above Sponsor A.
5. **Distance:** Sponsor C is `0.8` miles away, while Sponsor B is `1.2` miles away. Sponsor C wins this comparison.
6. **Impressions:** Lower impressions are used only if tier and distance tie. This comparison is not reached between B and C.
7. **Stable ID:** The lowest database ID is the final fallback if all previous values tie.

**Selected result: Sponsor C**

Sponsor D is excluded before sorting because the query requires:

```sql
s.status = 'APPROVED'
```

The TypeScript fallback returns `null` when no sponsor satisfies status, date, and ZIP requirements.

## 3. Input Sanitization and Safe URL Unit Test

Runtime validation is implemented in:

`src/lib/sponsor-url.ts`

The validation uses Zod and the built-in `URL` parser. It requires HTTPS, rejects raw IP addresses and localhost-style hostnames, and rejects embedded credentials.

```ts
const sponsorUrlSchema = z
  .string()
  .trim()
  .min(1, "Sponsor URL is required.")
  .superRefine((value, context) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      context.addIssue({
        code: "custom",
        message: "Sponsor URL must be a valid absolute URL.",
      });
      return;
    }

    if (parsedUrl.protocol !== "https:") {
      context.addIssue({
        code: "custom",
        message: "Sponsor URL must use HTTPS.",
      });
      return;
    }

    const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, "");

    if (rawIpv4Pattern.test(hostname) || hostname.includes(":")) {
      context.addIssue({
        code: "custom",
        message: "Sponsor URL cannot use a raw IP address.",
      });
      return;
    }

    if (hostname === "localhost" || !hostname.includes(".")) {
      context.addIssue({
        code: "custom",
        message: "Sponsor URL must use a public hostname.",
      });
      return;
    }

    if (parsedUrl.username || parsedUrl.password) {
      context.addIssue({
        code: "custom",
        message: "Sponsor URL cannot contain embedded credentials.",
      });
    }
  });
```

### Valid test case

Input:

```json
{
  "destinationUrl": "https://partners.example.com/offers/neighborhood"
}
```

Result:

```json
{
  "success": true,
  "data": {
    "destinationUrl": "https://partners.example.com/offers/neighborhood"
  }
}
```

### Unsafe test case

Input:

```json
{
  "destinationUrl": "http://partners.example.com/offer"
}
```

Exact error object returned:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SPONSOR_URL",
    "field": "destinationUrl",
    "issues": [
      {
        "path": "destinationUrl",
        "message": "Sponsor URL must use HTTPS."
      }
    ]
  }
}
```

The tests are implemented in `src/lib/sponsor-url.test.ts`.

## 4. FTC Disclosure and Accessibility DOM Audit

The sponsor card is implemented in:

`src/components/SponsorCard.tsx`

```tsx
<aside
  aria-labelledby={titleId}
  className="rounded-2xl border border-amber-300 bg-amber-50 p-6"
>
  <p
    id={disclosureId}
    className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-900"
  >
    Sponsored Partner
  </p>

  <h2 id={titleId} className="text-xl font-bold text-gray-950">
    {sponsor.name}
  </h2>

  <p id={descriptionId} className="mt-2 text-gray-700">
    Local {sponsor.tier.toLowerCase()} sponsor supporting this
    neighborhood.
  </p>

  <a
    href={validatedUrl.data.destinationUrl}
    target="_blank"
    rel="sponsored noopener noreferrer"
    aria-label={`Sponsored Partner: Visit ${sponsor.name} website. Opens in a new tab.`}
    aria-describedby={`${disclosureId} ${descriptionId}`}
    className="mt-4 inline-flex rounded-lg bg-amber-900 px-4 py-2 font-semibold text-white hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2"
  >
    Visit sponsor
  </a>
</aside>
```

### Audit findings

- **Visible disclosure:** The text `Sponsored Partner` appears visibly before the sponsor link in DOM order.
- **Accessible link name:** The `aria-label` starts with `Sponsored Partner`, so screen-reader users hear the commercial nature of the link before its destination.
- **Accessible description:** `aria-describedby` associates the link with the disclosure and sponsor description.
- **Commercial relationship:** `rel="sponsored"` identifies the commercial link relationship.
- **New-tab security:** `noopener noreferrer` protects the originating page when the link opens in a new tab.
- **Unsafe URL behavior:** The component returns `null` if runtime URL validation fails.

## 5. Verification Results

The complete automated test suite passed:

```text
Test Files  2 passed (2)
Tests       4 passed (4)
```

The tests verify:

- A valid HTTPS sponsor URL is accepted.
- An unsafe HTTP sponsor URL returns the expected structured error.
- Sponsor C is selected from the supplied test dataset.
- No eligible sponsor produces the fallback result `null`.

Additional verification:

- `npm run lint` passed without errors.
- `npm run build` compiled successfully.
- `git diff --check` reported no whitespace errors.
- Supabase migration `20261024210441` appears in both the local and remote migration history.