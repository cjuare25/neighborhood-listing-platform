import assert from "node:assert/strict";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const required = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_VOICE_WEBHOOK_URL",
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing configuration: ${name}`);
  }
}

assert.equal(
  new URL(process.env.SUPABASE_URL).hostname,
  "namidyxwopiimpksfumj.supabase.co",
  "Unexpected database target.",
);

const target = "http://127.0.0.1:3001/api/voice/twilio";
const signingUrl = process.env.TWILIO_VOICE_WEBHOOK_URL;

assert.equal(
  new URL(signingUrl).pathname,
  new URL(target).pathname,
  "Configured webhook path differs from the local test path.",
);

const database = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const callSid = `CA${randomBytes(16).toString("hex")}`;
const dialedNumber = "+15555550100";
let failed = false;

async function sendRequest() {
  const fields = { CallSid: callSid, To: dialedNumber };
  const signatureInput =
    signingUrl +
    Object.keys(fields)
      .sort()
      .map((key) => `${key}${fields[key]}`)
      .join("");

  const signature = createHmac("sha1", process.env.TWILIO_AUTH_TOKEN)
    .update(signatureInput)
    .digest("base64");

  return fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Twilio-Signature": signature,
    },
    body: new URLSearchParams(fields),
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });
}

try {
  const mapping = await database
    .from("voice_number_routes")
    .select("phone_number")
    .eq("phone_number", dialedNumber)
    .abortSignal(AbortSignal.timeout(8000))
    .maybeSingle();

  if (mapping.error) throw new Error("Could not inspect number mapping.");
  if (mapping.data !== null) {
    throw new Error("Test number is mapped. No webhook request sent.");
  }

  console.log("Verification time:", new Date().toISOString());
  console.log("PASS: Synthetic dialed number has no database mapping.");

  const first = await sendRequest();
  const firstXml = await first.text();

  assert.equal(first.status, 200, "Expected HTTP 200 for routing recovery.");
  assert.match(
    first.headers.get("content-type") || "",
    /text\/xml/,
    "Expected TwiML content type.",
  );
  assert.ok(
    firstXml.includes("We could not find an active property for this number."),
    "Expected the unmapped-listing recovery message.",
  );
  assert.ok(firstXml.includes("<Hangup/>"), "Expected Hangup.");
  assert.ok(!/<(?:Dial|Connect)\b/.test(firstXml), "Unexpected connection.");
  console.log("PASS: Unmapped number returned HTTP 200 and recovery TwiML.");
  console.log("Recovery output:", firstXml);

  const retry = await sendRequest();
  const retryXml = await retry.text();

  assert.equal(retry.status, 200, "Expected HTTP 200 for duplicate callback.");
  assert.equal(retryXml, firstXml, "Duplicate response differs.");

  const saved = await database
    .from("voice_webhook_receipts")
    .select("response_twiml", { count: "exact" })
    .eq("call_sid", callSid)
    .abortSignal(AbortSignal.timeout(8000));

  if (saved.error) throw new Error("Could not inspect the synthetic receipt.");

  assert.equal(saved.count, 1, "Expected exactly one stored receipt.");
  assert.equal(saved.data?.[0]?.response_twiml, firstXml);
  console.log("PASS: Duplicate CallSid returned identical TwiML; one receipt.");
  console.log(
    "Response SHA-256:",
    createHash("sha256").update(firstXml).digest("hex"),
  );
} catch (error) {
  failed = true;
  console.error("FAIL:", error instanceof Error ? error.message : "Unknown error");
} finally {
  try {
    const cleanup = await database
      .from("voice_webhook_receipts")
      .delete()
      .eq("call_sid", callSid)
      .abortSignal(AbortSignal.timeout(8000));

    if (cleanup.error) throw new Error("Receipt cleanup failed.");
    console.log("PASS: Synthetic receipt cleanup completed.");
  } catch {
    failed = true;
    console.error("FAIL: Synthetic receipt cleanup needs attention.");
  }
}

process.exitCode = failed ? 1 : 0;
