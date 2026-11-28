import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getVoiceSponsors } from "../../../../lib/voice/supabase-sponsors";
import { SponsorTimeoutError } from "../../../../lib/voice/sponsor-timeout";

export const runtime = "nodejs";

const inputSchema = z.object({
  propertyId: z.string().uuid(),
}).strict();

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export async function POST(request: Request) {
  const secret = process.env.VOICE_TOOL_SECRET;
  if (!secret || secret.length < 32) {
    return json({ code: "SERVICE_UNAVAILABLE" }, 503);
  }

  const authorization = request.headers.get("authorization") ?? "";
  if (!timingSafeEqual(
    digest(authorization),
    digest(`Bearer ${secret}`),
  )) {
    return json({ code: "UNAUTHORIZED" }, 401);
  }

  const contentType = request.headers.get("content-type")
    ?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return json({ code: "UNSUPPORTED_MEDIA_TYPE" }, 415);
  }

  let input: z.infer<typeof inputSchema>;
  try {
    const text = await request.text();
    if (text.length > 4096) {
      return json({ code: "REQUEST_TOO_LARGE" }, 413);
    }
    const parsed = inputSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return json({ code: "INVALID_INPUT" }, 400);
    }
    input = parsed.data;
  } catch {
    return json({ code: "INVALID_INPUT" }, 400);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return json({ code: "SERVICE_UNAVAILABLE" }, 503);
  }

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const sponsors = await getVoiceSponsors(client, input.propertyId);
    return json({ sponsors }, 200);
  } catch (error) {
    const timedOut = error instanceof SponsorTimeoutError;
    console.info(JSON.stringify({
      event: timedOut
        ? "voice.sponsor.timeout"
        : "voice.sponsor.failed",
      ...(timedOut ? { timeout_ms: 2500 } : {}),
    }));

    return json({
      code: timedOut ? "SPONSOR_TIMEOUT" : "SPONSOR_UNAVAILABLE",
      sponsors: null,
      message: "Sponsor information is temporarily unavailable.",
    }, timedOut ? 504 : 503);
  }
}
