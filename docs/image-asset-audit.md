# Image Asset Verification Audit

## Audit Scope

This audit evaluates three distinct image assets currently rendered by the Neighborhood Listing Platform:

- Asset A: Primary property listing photo
- Asset B: Local business partner advertisement banner
- Asset C: Neighborhood navigation map-pin icon

The database approval records are declared in:

`supabase/migrations/20261031073023_create_image_asset_metadata.sql`

The migration was successfully applied to the linked Supabase project. A database query confirmed that all three records have `is_approved = true` and `status = 'ACTIVE'`.

---

## Asset A: Primary Property Listing Photo

### 1. Asset Metadata and Provenance

- Asset key: `primary-property-listing`
- Repository path: `/public/assets/property-listing.jpg`
- Rendered URL: `/assets/property-listing.jpg`
- Original source: Wikimedia Commons
- Source page: https://commons.wikimedia.org/wiki/File:Modern_house_exterior_with_red_roof_and_landscaped_garden_under_clear_blue_sky.jpg
- Permission source: Shixart1985
- License: Creative Commons Attribution 2.0
- License URI: https://creativecommons.org/licenses/by/2.0/
- Database approval: `is_approved = true`
- Database status: `status = 'ACTIVE'`

The image is authorized through its Creative Commons Attribution 2.0 license. The creator is identified as Shixart1985 in the asset metadata record.

### 2. Accessibility and Functional Purpose

The property image is **informational** because it communicates the appearance of the listed property.

The exact dynamic alternative text is:

```tsx
alt={`${property.address} property in ${property.city}`}
```

For the current property, this produces:

```text
125 Maple Street property in Los Angeles, CA
```

This gives screen-reader users the property address and location instead of using a generic description such as “house image.”

### 3. Responsive Configuration

```tsx
<Image
  src={property.imageUrl}
  alt={`${property.address} property in ${property.city}`}
  width={1280}
  height={853}
  sizes="(min-width: 1024px) 410px, (min-width: 768px) 40vw, calc(100vw - 3rem)"
  priority
  className="h-56 w-full object-cover md:h-full"
/>
```

The measured rendered widths were:

| Viewport | Rendered CSS width |
|---|---:|
| Mobile, 390px | 340px |
| Desktop, 1280px | 409px |

The `sizes` attribute tells Next.js that the image occupies approximately the viewport width minus three rem on mobile and approximately 410 pixels on a desktop viewport.

### 4. Network Telemetry and Performance Risk

Chrome DevTools was opened to **Network**, filtered by **Img**, with the cache disabled before a hard refresh.

| Measurement | Result |
|---|---:|
| Transferred size | 221 KB |
| Content-Type | `image/webp` |
| Download time | 25 ms |

Performance risk: the original JPEG is approximately 356 KB and could waste bandwidth or contribute to a slow Largest Contentful Paint. Missing dimensions could also create cumulative layout shift.

Applied optimization: Next.js `<Image>` supplies responsive image candidates and converts the delivered image to WebP. The `width`, `height`, and responsive `sizes` values reserve the correct aspect ratio and reduce layout shift. The `priority` property prioritizes the primary above-the-fold property image.

---

## Asset B: Local Business Partner Advertisement Banner

### 1. Asset Metadata and Provenance

- Asset key: `local-business-partner-banner`
- Repository path: `/public/assets/business-partner.jpg`
- Rendered URL: `/assets/business-partner.jpg`
- Original source: Wikimedia Commons
- Source page: https://commons.wikimedia.org/wiki/File:Down_to_Earth_Coffee_Storefront.jpg
- Permission source: Andy Li
- License: CC0 1.0 Universal
- License URI: https://creativecommons.org/publicdomain/zero/1.0/
- Database approval: `is_approved = true`
- Database status: `status = 'ACTIVE'`

The image was released under CC0 1.0 Universal by Andy Li. The sponsor card also checks that the sponsor record has `status === "APPROVED"` before rendering.

### 2. Accessibility and Functional Purpose

The banner is **informational** because it identifies the storefront belonging to the sponsored neighborhood partner. The nearby “Visit sponsor” link is the actionable element.

The exact dynamic alternative text is:

```tsx
alt={`${sponsor.name} storefront for a sponsored neighborhood partner`}
```

For the current sponsor, it produces:

```text
Down to Earth Coffee storefront for a sponsored neighborhood partner
```

The text identifies both the business and the commercial relationship. The card also visibly displays “Sponsored Partner.”

### 3. Responsive Configuration

```tsx
<Image
  src={sponsor.bannerUrl}
  alt={`${sponsor.name} storefront for a sponsored neighborhood partner`}
  width={1280}
  height={960}
  sizes="(min-width: 1024px) 410px, (min-width: 768px) 40vw, calc(100vw - 3rem)"
  loading="eager"
  className="h-52 w-full object-cover md:h-full"
/>
```

The measured rendered widths were:

| Viewport | Rendered CSS width |
|---|---:|
| Mobile, 390px | 340px |
| Desktop, 1280px | 409px |

### 4. Network Telemetry and Performance Risk

| Measurement | Result |
|---|---:|
| Transferred size | 265 KB |
| Content-Type | `image/webp` |
| Download time | 68 ms |

Performance risk: the original banner is approximately 418 KB. Chrome also identified the banner as the Largest Contentful Paint image on the desktop layout and warned that it had initially been loaded lazily.

Applied optimization: the component uses Next.js `<Image>` with intrinsic dimensions, a responsive `sizes` expression, and WebP delivery. After observing the LCP warning, `loading="eager"` was added so the visible sponsor banner begins loading without waiting for lazy-loading proximity detection. The fixed `width` and `height` values also mitigate layout shift.

---

## Asset C: UI and Navigational Map-Pin Icon

### 1. Asset Metadata and Provenance

- Asset key: `neighborhood-navigation-icon`
- Repository path: `/public/assets/map-pin.svg`
- Rendered URL: `/assets/map-pin.svg`
- Original source: Heroicons
- Source file: https://github.com/tailwindlabs/heroicons/blob/master/optimized/24/outline/map-pin.svg
- Permission source: Tailwind Labs Heroicons contributors
- License: MIT License
- License URI: https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
- Database approval: `is_approved = true`
- Database status: `status = 'ACTIVE'`

### 2. Accessibility and Functional Purpose

The map-pin icon is **decorative**. It appears beside the visible link text “Browse this neighborhood,” which already communicates the link’s action. Repeating the same meaning through the icon would create unnecessary screen-reader output.

The exact accessibility attributes are:

```tsx
alt=""
aria-hidden="true"
```

An empty `alt` value prevents the image filename from being announced. `aria-hidden="true"` explicitly removes the decorative icon from the accessibility tree.

### 3. Responsive Configuration

```tsx
<Image
  src="/assets/map-pin.svg"
  alt=""
  aria-hidden="true"
  width={24}
  height={24}
  sizes="24px"
  unoptimized
/>
```

The measured rendered widths were:

| Viewport | Rendered CSS width |
|---|---:|
| Mobile, 390px | 24px |
| Desktop, 1280px | 24px |

The icon has a fixed navigational size and does not need different responsive candidates.

### 4. Network Telemetry and Performance Risk

| Measurement | Result |
|---|---:|
| Transferred size | 0.7 KB |
| Content-Type | `image/svg+xml` |
| Download time | 45 ms |

Performance risk: running an already lightweight SVG through an unnecessary raster optimization pipeline could add needless processing and potentially reduce vector quality.

Applied optimization: the SVG uses `unoptimized`, retains its vector format, and has explicit `width={24}` and `height={24}` dimensions. These dimensions reserve its layout space and prevent layout movement.

---

## Database Verification

The following query was executed in the Supabase SQL Editor:

```sql
select
  asset_key,
  is_approved,
  status
from public.image_assets
order by id;
```

The query returned:

| Asset key | is_approved | status |
|---|---:|---|
| `primary-property-listing` | `true` | `ACTIVE` |
| `local-business-partner-banner` | `true` | `ACTIVE` |
| `neighborhood-navigation-icon` | `true` | `ACTIVE` |

This confirms that the three rendered assets have administrative clearance in the active project database.

## Verification Summary

- All three assets render successfully.
- All three assets have documented permission sources and license URIs.
- Informational images have meaningful dynamic alternative text.
- The decorative icon uses `alt=""` and `aria-hidden="true"`.
- Responsive widths were measured at 390px and 1280px viewports.
- Network measurements were collected with Chrome DevTools.
- Next.js responsive image optimization, intrinsic dimensions, WebP delivery, eager loading for the observed LCP image, and SVG preservation are implemented.
- `npm test`, `npm run lint`, and `npm run build` pass.