import { validatePropertyListing } from "@/lib/propertySchema";

export function safeHandleApiResponse(responseBody: string): string {
  const payload: unknown = JSON.parse(responseBody);

  // Execution stops here if runtime validation fails.
  const listing = validatePropertyListing(payload);

  const formattedPrice = listing.price.toFixed(2);
  const amenities = listing.amenities
    .map((amenity) => amenity.toUpperCase())
    .join(", ");

  return `${listing.address}: $${formattedPrice} — ${amenities}`;
}
