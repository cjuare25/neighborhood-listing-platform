import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { ListingLookup } from "./routing";

const mappingSchema = z.object({
  property_id: z.number().int().positive(),
});

const listingSchema = z.object({
  id: z.number().int().positive(),
  address: z.string().trim().min(1),
  availability_status: z.string(),
});

export function createSupabaseListingLookup(
  client: SupabaseClient,
  signal: AbortSignal,
): ListingLookup {
  return async (dialedNumber) => {
    const mapping = await client
      .from("voice_number_routes")
      .select("property_id")
      .eq("phone_number", dialedNumber)
      .abortSignal(signal)
      .maybeSingle();

    if (mapping.error) {
      throw new Error("Voice number lookup failed.");
    }

    if (mapping.data === null) {
      return null;
    }

    const parsedMapping = mappingSchema.safeParse(mapping.data);

    if (!parsedMapping.success) {
      throw new Error("Voice number mapping is invalid.");
    }

    const listing = await client
      .from("properties")
      .select("id,address,availability_status")
      .eq("id", parsedMapping.data.property_id)
      .abortSignal(signal)
      .maybeSingle();

    if (listing.error) {
      throw new Error("Voice property lookup failed.");
    }

    if (listing.data === null) {
      return null;
    }

    const parsedListing = listingSchema.safeParse(listing.data);

    if (!parsedListing.success) {
      throw new Error("Voice property data is invalid.");
    }

    return parsedListing.data;
  };
}
