import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  lookupListing: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("../../../../lib/voice/supabase-routing", () => ({
  createSupabaseListingLookup: () => mocks.lookupListing,
}));

import { POST } from "./route";

const WEBHOOK_URL = "https://voice.example.com/api/voice/twilio";
const TOKEN = "local-unit-test-token";
const CALL_SID = `CA${"a".repeat(32)}`;
const PHONE = "+15551234567";
const TRANSCRIPT = "Private caller transcript for the test.";

const FALLBACK =
  '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, our service is temporarily unavailable. Please try again later. Goodbye.</Say><Hangup/></Response>';

type Receipt = {
  call_sid: string;
  response_twiml: string;
};

const receipts = new Map<string, string>();

function signedRequest(fields: Record<string, string> = {}) {
  const params = {
    CallSid: CALL_SID,
    To: "+15555550100",
    From: PHONE,
    SpeechResult: TRANSCRIPT,
    ...fields,
  };

  const signedData =
    WEBHOOK_URL +
    Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key as keyof typeof params]}`)
      .join("");

  const signature = createHmac("sha1", TOKEN)
    .update(signedData)
    .digest("base64");

  return new Request(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Twilio-Signature": signature,
    },
    body: new URLSearchParams(params),
  });
}

beforeEach(() => {
  receipts.clear();
  mocks.createClient.mockReset();
  mocks.lookupListing.mockReset();
  mocks.lookupListing.mockResolvedValue({
    id: 1,
    address: "125 Maple Street",
    availability_status: "Active",
  });
  mocks.insert.mockReset();
  mocks.select.mockReset();

  vi.stubEnv("TWILIO_AUTH_TOKEN", TOKEN);
  vi.stubEnv("TWILIO_VOICE_WEBHOOK_URL", WEBHOOK_URL);
  vi.stubEnv("SUPABASE_URL", "https://storage.example.com");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "unit-test-service-role-key");
  vi.spyOn(console, "info").mockImplementation(() => undefined);

  mocks.insert.mockImplementation((row: Receipt) => ({
    abortSignal: async () => {
      if (receipts.has(row.call_sid)) {
        return { error: { code: "23505" } };
      }

      receipts.set(row.call_sid, row.response_twiml);
      return { error: null };
    },
  }));

  mocks.select.mockImplementation(() => ({
    eq: (column: string, callSid: string) => {
      expect(column).toBe("call_sid");

      return {
        abortSignal: () => ({
          single: async () => ({
            data: { response_twiml: receipts.get(callSid) },
            error: null,
          }),
        }),
      };
    },
  }));

  mocks.createClient.mockReturnValue({
    from: () => ({
      insert: mocks.insert,
      select: mocks.select,
    }),
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Twilio voice webhook", () => {
  it("rejects a missing signature with 403 Forbidden", async () => {
    const request = signedRequest();
    request.headers.delete("X-Twilio-Signature");

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Forbidden");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature before accessing storage", async () => {
    const request = signedRequest();
    request.headers.set("X-Twilio-Signature", "invalid-signature");

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(await response.text()).toBe("Forbidden");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects a body changed after signing", async () => {
    const original = signedRequest();

    const request = new Request(WEBHOOK_URL, {
      method: "POST",
      headers: original.headers,
      body: `${await original.text()}&Extra=tampered`,
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("accepts a correctly signed request and stores only the receipt", async () => {
    const response = await POST(signedRequest());
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/xml");
    expect(xml).toContain("<Say>");
    expect(xml).toContain("<Hangup/>");
    expect(receipts.get(CALL_SID)).toBe(xml);

    const inserted = mocks.insert.mock.calls[0][0];
    expect(Object.keys(inserted).sort()).toEqual([
      "call_sid",
      "response_twiml",
    ]);
  });

  it("returns the stored response for a repeated CallSid", async () => {
    const first = await POST(signedRequest());
    const firstXml = await first.text();

    const retry = await POST(signedRequest());
    const retryXml = await retry.text();

    expect(retry.status).toBe(200);
    expect(retryXml).toBe(firstXml);
    expect(receipts.size).toBe(1);
    expect(mocks.select).toHaveBeenCalledTimes(1);

    const logs = JSON.stringify(vi.mocked(console.info).mock.calls);
    expect(logs).toContain("twilio.voice.replayed");
  });

  it("does not write caller PII or the signing token to logs", async () => {
    await POST(signedRequest());

    const logs = JSON.stringify(vi.mocked(console.info).mock.calls);

    expect(logs).toContain("[REDACTED]");
    expect(logs).not.toContain(PHONE);
    expect(logs).not.toContain(TRANSCRIPT);
    expect(logs).not.toContain(TOKEN);
    expect(logs).not.toContain(CALL_SID);
  });

  it("returns spoken fallback TwiML when storage fails", async () => {
    mocks.insert.mockReturnValue({
      abortSignal: async () => ({
        error: {
          code: "08006",
          message: `Sensitive upstream detail: ${PHONE} ${TRANSCRIPT}`,
        },
      }),
    });

    const response = await POST(signedRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/xml");
    expect(await response.text()).toBe(FALLBACK);

    const logs = JSON.stringify(vi.mocked(console.info).mock.calls);
    expect(logs).toContain("twilio.voice.fallback");
    expect(logs).not.toContain(PHONE);
    expect(logs).not.toContain(TRANSCRIPT);
    expect(logs).not.toContain("Sensitive upstream detail");
  });

  it("rejects a signed request containing an invalid CallSid", async () => {
    const response = await POST(signedRequest({ CallSid: "invalid" }));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid CallSid");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("fails closed when signature-verification configuration is missing", async () => {
    vi.stubEnv("TWILIO_AUTH_TOKEN", "");

    const response = await POST(signedRequest());

    expect(response.status).toBe(503);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});

describe("signed webhook listing routing", () => {
  it("returns HTTP 200 and general agency TwiML for an unmapped number", async () => {
    mocks.lookupListing.mockResolvedValue(null);

    const response = await POST(signedRequest());
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/xml");
    expect(xml).toContain(
      "We could not find an active property for this number.",
    );
    expect(xml).toContain("<Hangup/>");
    expect(xml).not.toContain("<Dial");
    expect(xml).not.toContain("<Connect");
    expect(receipts.get(CALL_SID)).toBe(xml);
    expect(mocks.lookupListing).toHaveBeenCalledWith("+15555550100");
  });

  it("returns the general agency message for an inactive listing", async () => {
    mocks.lookupListing.mockResolvedValue({
      id: 1,
      address: "125 Maple Street",
      availability_status: "Sold",
    });

    const response = await POST(signedRequest());

    expect(response.status).toBe(200);
    expect(await response.text()).toContain(
      "We could not find an active property for this number.",
    );
  });

  it("returns a listing-specific greeting for an active mapping", async () => {
    const response = await POST(signedRequest());

    expect(response.status).toBe(200);
    expect(await response.text()).toContain("125 Maple Street");
  });

  it("uses the service-unavailable fallback when routing storage fails", async () => {
    mocks.lookupListing.mockRejectedValue(new Error("Database unavailable"));

    const response = await POST(signedRequest());

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(FALLBACK);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects an invalid dialed number before accessing storage", async () => {
    const response = await POST(signedRequest({ To: "invalid" }));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid dialed number");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
});
