import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Missing Supabase server configuration.");
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function checked(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.code ?? "request failed"}`);
  }
  return result.data;
}

try {
  const owner = checked(
    await admin.from("profiles").select("id")
      .eq("role", "property_owner")
      .order("created_at", { ascending: true })
      .limit(1).maybeSingle(),
    "Find existing property owner",
  );

  if (!owner) {
    throw new Error("No property-owner profile exists. Stop and request guidance.");
  }

  const samples = [
    {
      id: "a6100000-0000-4000-8000-000000000001",
      sponsorId: "b6100000-0000-4000-8000-000000000001",
      address: "Demo: 125 Maple Street",
      price: 725000,
      bedrooms: 3,
      bathrooms: 2,
      square_feet: 1500,
      sponsorName: "Demo Neighborhood Partners",
      tier: "gold",
    },
    {
      id: "a6100000-0000-4000-8000-000000000002",
      sponsorId: "b6100000-0000-4000-8000-000000000002",
      address: "Demo: 240 Oak Avenue",
      price: 580000,
      bedrooms: 2,
      bathrooms: 1.5,
      square_feet: 1200,
      sponsorName: "Demo Community Partners",
      tier: "silver",
    },
    {
      id: "a6100000-0000-4000-8000-000000000003",
      sponsorId: "b6100000-0000-4000-8000-000000000003",
      address: "Demo: 380 Cedar Lane",
      price: 890000,
      bedrooms: 4,
      bathrooms: 3,
      square_feet: 2100,
      sponsorName: "Demo Local Partners",
      tier: "bronze",
    },
  ];

  checked(
    await admin.from("sponsors").upsert(samples.map((sample) => ({
      id: sample.sponsorId,
      name: sample.sponsorName,
      tier: sample.tier,
      active_status: true,
    }))),
    "Save demonstration sponsors",
  );

  checked(
    await admin.from("properties").upsert(samples.map((sample) => ({
      id: sample.id,
      owner_id: owner.id,
      address: sample.address,
      price: sample.price,
      bedrooms: sample.bedrooms,
      bathrooms: sample.bathrooms,
      square_feet: sample.square_feet,
      status: "approved",
    }))),
    "Save demonstration properties",
  );

  checked(
    await admin.from("property_sponsors").upsert(samples.map((sample) => ({
      property_id: sample.id,
      sponsor_id: sample.sponsorId,
    }))),
    "Connect demonstration sponsors",
  );

  console.log("Saved 3 demonstration properties and 3 active sponsors.");
  console.log("These fictional listings remain available for UI review.");
  console.log("Running this script again updates the same demonstration records.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
