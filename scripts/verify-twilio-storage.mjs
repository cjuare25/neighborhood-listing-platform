import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }
}

const options = {
  auth: { persistSession: false, autoRefreshToken: false },
};

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  options,
);

const anonymous = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  options,
);

const callSid = `CA${randomBytes(16).toString("hex")}`;
const xml =
  '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Storage verification.</Say><Hangup/></Response>';

try {
  const attempts = await Promise.all(
    Array.from({ length: 3 }, () =>
      admin.from("voice_webhook_receipts").insert({
        call_sid: callSid,
        response_twiml: xml,
      }).abortSignal(AbortSignal.timeout(8000)),
    ),
  );

  assert.equal(
    attempts.filter((result) => !result.error).length,
    1,
    "Exactly one concurrent insert must succeed.",
  );
  assert.equal(
    attempts.filter((result) => result.error?.code === "23505").length,
    2,
    "Two duplicate inserts must fail with PostgreSQL code 23505.",
  );
  console.log("PASS: Three concurrent inserts created exactly one receipt.");

  const saved = await admin
    .from("voice_webhook_receipts")
    .select("*", { count: "exact" })
    .eq("call_sid", callSid)
    .abortSignal(AbortSignal.timeout(8000));

  assert.equal(saved.error, null, "Receipt read must succeed.");
  assert.equal(saved.count, 1);
  assert.equal(saved.data[0].response_twiml, xml);
  assert.deepEqual(Object.keys(saved.data[0]).sort(), [
    "call_sid",
    "created_at",
    "response_twiml",
  ]);
  console.log("PASS: Stored response matches; no phone/transcript columns exist.");

  const publicRead = await anonymous
    .from("voice_webhook_receipts")
    .select("call_sid")
    .eq("call_sid", callSid)
    .abortSignal(AbortSignal.timeout(8000));

  assert.equal(publicRead.error?.code, "42501");
  console.log("PASS: Anonymous receipt reads are denied.");

  const publicWrite = await anonymous
    .from("voice_webhook_receipts")
    .insert({ call_sid: callSid, response_twiml: xml })
    .abortSignal(AbortSignal.timeout(8000));

  assert.equal(publicWrite.error?.code, "42501");
  console.log("PASS: Anonymous receipt writes are denied.");
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  const cleanup = await admin
    .from("voice_webhook_receipts")
    .delete()
    .eq("call_sid", callSid)
    .abortSignal(AbortSignal.timeout(8000));

  if (cleanup.error) {
    console.error("FAIL: Temporary receipt cleanup needs attention.");
    process.exitCode = 1;
  } else {
    console.log("PASS: Temporary test receipt removed.");
  }
}
