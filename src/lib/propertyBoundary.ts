import type { PropertyListing } from "@/types/PropertyListing";

export function unsafeHandleApiResponse(responseBody: string): string {
  const listing = JSON.parse(responseBody) as PropertyListing;

  const formattedPrice = listing.price.toFixed(2);
  const amenities = listing.amenities
    .map((amenity) => amenity.toUpperCase())
    .join(", ");

  return `${listing.address}: $${formattedPrice} — ${amenities}`;
}
