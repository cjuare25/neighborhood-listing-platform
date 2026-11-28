import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

try {
  const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    VOICE_TOOL_SECRET,
  } = process.env;

  assert.ok(SUPABASE_URL, "SUPABASE_URL is missing.");
  assert.ok(SUPABASE_SERVICE_ROLE_KEY, "Storage key is missing.");
  assert.ok(VOICE_TOOL_SECRET, "VOICE_TOOL_SECRET is missing.");
  assert.equal(
    new URL(SUPABASE_URL).hostname,
    "namidyxwopiimpksfumj.supabase.co",
    "Unexpected Supabase project.",
  );

  const database = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  console.log("Verification time:", new Date().toISOString());

  const property = await database
    .from("properties")
    .select("id")
    .eq("status", "approved")
    .order("id")
    .limit(1)
    .abortSignal(AbortSignal.timeout(8000))
    .maybeSingle();

  assert.ok(!property.error, "Approved-property lookup failed.");
  assert.ok(property.data, "No approved property exists.");

  const propertyId = property.data.id;

  const expected = await database
    .from("properties")
    .select("id,property_sponsors(sponsors(id,name,active_status))")
    .eq("id", propertyId)
    .eq("status", "approved")
    .abortSignal(AbortSignal.timeout(8000))
    .maybeSingle();

  assert.ok(!expected.error, "Sponsor relationship query failed.");
  assert.ok(expected.data, "Approved property was unavailable.");

  const sponsors = expected.data.property_sponsors
    .flatMap(({ sponsors }) =>
      sponsors?.active_status
        ? [{ id: sponsors.id, name: sponsors.name.trim() }]
        : [],
    )
    .sort((left, right) => left.id.localeCompare(right.id));

  const endpoint = "http://127.0.0.1:3001/api/tools/sponsor";

  async function send(authenticated) {
    return fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(authenticated
          ? { authorization: `Bearer ${VOICE_TOOL_SECRET}` }
          : {}),
      },
      body: JSON.stringify({ propertyId }),
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
  }

  const unauthorized = await send(false);
  assert.equal(unauthorized.status, 401);
  console.log("PASS: Missing authorization returned HTTP 401.");

  const response = await send(true);
  assert.equal(response.status, 200, "Expected HTTP 200.");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { sponsors });

  console.log("PASS: Real Supabase relationship query succeeded.");
  console.log("PASS: Authenticated endpoint matched database results.");
  console.log("Approved property ID:", propertyId);
  console.log("Active linked sponsor count:", sponsors.length);
  console.log("Read-only verification; no database rows changed.");
} catch (error) {
  console.error(
    "FAIL:",
    error instanceof Error ? error.message : "Verification failed.",
  );
  process.exitCode = 1;
}
