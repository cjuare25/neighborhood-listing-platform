import {
  createPublicSupabaseClient,
  createUserSupabaseClient,
} from "@/lib/supabaseServer";
import { propertySchema } from "@/schemas/property";

export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  try {
    const supabase = createPublicSupabaseClient();

    const { data, error } = await supabase
      .from("properties")
      .select(`
        id, address, price, bedrooms, bathrooms, square_feet,
        property_sponsors!inner(
          sponsors!inner(id, name, tier, active_status)
        )
      `)
      .eq("status", "approved")
      .eq("property_sponsors.sponsors.active_status", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return json({ error: "Listings are temporarily unavailable." }, 503);
    }

    const properties = (data ?? []).map((property) => ({
      id: property.id,
      address: property.address,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      square_feet: property.square_feet,
      sponsors: property.property_sponsors
        .flatMap((link) => link.sponsors)
        .map((sponsor) => ({
          id: sponsor.id,
          name: sponsor.name,
          tier: sponsor.tier,
        })),
    }));

    return json({ data: properties });
  } catch {
    return json({ error: "Listings are temporarily unavailable." }, 503);
  }
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return json(
      {
        error: "Invalid JSON body.",
        details: [{ path: [], message: "Send valid JSON." }],
      },
      400,
    );
  }

  const result = propertySchema.safeParse(payload);

  if (!result.success) {
    return json(
      {
        error: "Invalid property data.",
        details: result.error.issues.map((issue) => ({
          path: issue.path.map(String),
          code: issue.code,
          message: issue.message,
        })),
      },
      400,
    );
  }

  const match = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    return json({ error: "Authentication required." }, 401);
  }

  try {
    const accessToken = match[1];
    const supabase = createUserSupabaseClient(accessToken);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return json({ error: "Invalid or expired authentication." }, 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return json({ error: "Unable to verify owner access." }, 503);
    }

    if (profile?.role !== "property_owner") {
      return json({ error: "A property owner account is required." }, 403);
    }

    const { data, error } = await supabase
      .from("properties")
      .insert({
        ...result.data,
        owner_id: user.id,
        status: "draft",
      })
      .select(`
        id, owner_id, address, price, bedrooms, bathrooms,
        square_feet, status, created_at
      `)
      .single();

    if (error) {
      if (error.code === "42501") {
        return json({ error: "You cannot create this listing." }, 403);
      }

      return json({ error: "Unable to save the listing." }, 503);
    }

    return json({ data }, 201);
  } catch {
    return json({ error: "The listing service is unavailable." }, 503);
  }
}
