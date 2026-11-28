import "server-only";

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

export const runtime = "nodejs";

const FALLBACK_TWIML =
  '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, our service is temporarily unavailable. Please try again later. Goodbye.</Say><Hangup/></Response>';

function textResponse(body: string, status: number) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function xmlResponse(body: string) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function logVoiceEvent(
  event: "accepted" | "replayed" | "fallback",
  callSid: string,
) {
  console.info(
    JSON.stringify({
      event: `twilio.voice.${event}`,
      call_ref: createHash("sha256")
        .update(callSid)
        .digest("hex")
        .slice(0, 12),
      from: "[REDACTED]",
      transcript: "[REDACTED]",
    }),
  );
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-twilio-signature") ?? "";

  if (!signature) {
    console.info(JSON.stringify({
      event: "twilio.voice.rejected",
      reason: "missing_signature",
    }));
    return textResponse("Forbidden", 403);
  }

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const webhookUrl = process.env.TWILIO_VOICE_WEBHOOK_URL;

  if (!authToken || !webhookUrl) {
    return textResponse("Service unavailable", 503);
  }

  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();

  if (contentType !== "application/x-www-form-urlencoded") {
    return textResponse("Unsupported media type", 415);
  }

  let params: Record<string, string>;

  try {
    const body = await request.text();

    if (body.length > 32768) {
      return textResponse("Request too large", 413);
    }

    const entries = Array.from(new URLSearchParams(body).entries());

    if (new Set(entries.map(([name]) => name)).size !== entries.length) {
      return textResponse("Duplicate form fields", 400);
    }

    params = Object.fromEntries(entries);
  } catch {
    return textResponse("Invalid form body", 400);
  }

  let validSignature = false;

  try {
    const configuredUrl = new URL(webhookUrl);
    const incomingUrl = new URL(request.url);

    validSignature =
      configuredUrl.pathname === incomingUrl.pathname &&
      configuredUrl.search === incomingUrl.search &&
      !configuredUrl.hash &&
      twilio.validateRequest(authToken, signature, webhookUrl, params);
  } catch {
    validSignature = false;
  }

  if (!validSignature) {
    console.info(JSON.stringify({
      event: "twilio.voice.rejected",
      reason: "invalid_signature",
      request_url_matches: request.url === webhookUrl,
      has_account_sid: Boolean(params.AccountSid),
      has_signature_settings: request.headers.has(
        "x-twilio-webhooks-signature-settings"
      ),
    }));
    return textResponse("Forbidden", 403);
  }

  const callSid = params.CallSid;

  if (!callSid || !/^CA[0-9a-fA-F]{32}$/.test(callSid)) {
    return textResponse("Invalid CallSid", 400);
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Voice storage is not configured.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const response = new twilio.twiml.VoiceResponse();
    response.say(
      "Thank you for calling Neighborhood Listing Platform. You can explore approved homes on our website. Goodbye.",
    );
    response.hangup();

    const responseTwiml = response.toString();
    const deadline = AbortSignal.timeout(4000);

    const { error: insertError } = await supabase
      .from("voice_webhook_receipts")
      .insert({
        call_sid: callSid,
        response_twiml: responseTwiml,
      })
      .abortSignal(deadline);

    if (!insertError) {
      logVoiceEvent("accepted", callSid);
      return xmlResponse(responseTwiml);
    }

    if (insertError.code !== "23505") {
      throw new Error("Voice receipt could not be saved.");
    }

    const { data, error: readError } = await supabase
      .from("voice_webhook_receipts")
      .select("response_twiml")
      .eq("call_sid", callSid)
      .abortSignal(deadline)
      .single();

    if (readError || !data?.response_twiml) {
      throw new Error("Saved voice response is unavailable.");
    }

    logVoiceEvent("replayed", callSid);
    return xmlResponse(data.response_twiml);
  } catch {
    logVoiceEvent("fallback", callSid);
    return xmlResponse(FALLBACK_TWIML);
  }
}
