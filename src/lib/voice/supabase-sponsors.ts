import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { withSponsorTimeout } from "./sponsor-timeout";

const sponsorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  active_status: z.boolean(),
});

const propertySchema = z.object({
  id: z.string().uuid(),
  property_sponsors: z.array(
    z.object({ sponsors: sponsorSchema.nullable() }),
  ),
});

export async function getVoiceSponsors(
  client: SupabaseClient,
  propertyId: string,
) {
  const id = z.string().uuid().parse(propertyId);

  return withSponsorTimeout(async (signal) => {
    const result = await client
      .from("properties")
      .select("id,property_sponsors(sponsors(id,name,active_status))")
      .eq("id", id)
      .eq("status", "approved")
      .abortSignal(signal)
      .maybeSingle();

    if (result.error) {
      throw new Error("Voice sponsor lookup failed.");
    }

    if (result.data === null) {
      return [];
    }

    const parsed = propertySchema.safeParse(result.data);
    if (!parsed.success) {
      throw new Error("Voice sponsor data is invalid.");
    }

    return parsed.data.property_sponsors
      .flatMap(({ sponsors }) =>
        sponsors?.active_status
          ? [{ id: sponsors.id, name: sponsors.name }]
          : [],
      )
      .sort((left, right) => left.id.localeCompare(right.id));
  });
}
