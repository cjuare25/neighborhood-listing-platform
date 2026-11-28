import {
  afterEach, beforeEach, describe, expect, it, vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: mocks.createClient,
}));

import { POST } from "./route";

const SECRET = "test-only-secret-for-sponsor-route-12345";
const PROPERTY_ID = "11111111-1111-4111-8111-111111111111";
const SPONSOR_ID = "22222222-2222-4222-8222-222222222222";

let query: {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  abortSignal: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
};

function request(
  body: unknown = { propertyId: PROPERTY_ID },
  token = SECRET,
) {
  return new Request("http://localhost/api/tools/sponsor", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("VOICE_TOOL_SECRET", SECRET);
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-storage-key");
  vi.spyOn(console, "info").mockImplementation(() => {});

  query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  mocks.createClient.mockReset().mockReturnValue({
    from: vi.fn().mockReturnValue(query),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sponsor tool endpoint", () => {
  it("returns linked active sponsors", async () => {
    query.maybeSingle.mockResolvedValue({
      data: {
        id: PROPERTY_ID,
        property_sponsors: [{
          sponsors: {
            id: SPONSOR_ID,
            name: "Demo Coffee",
            active_status: true,
          },
        }],
      },
      error: null,
    });

    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      sponsors: [{ id: SPONSOR_ID, name: "Demo Coffee" }],
    });
  });

  it("returns an empty result without inventing a sponsor", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sponsors: [] });
  });

  it("rejects unauthorized requests before accessing storage", async () => {
    const response = await POST(request(undefined, "wrong"));
    expect(response.status).toBe(401);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("fails closed when the tool secret is missing", async () => {
    vi.stubEnv("VOICE_TOOL_SECRET", "");
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("rejects invalid property IDs before accessing storage", async () => {
    const response = await POST(request({ propertyId: "invalid" }));
    expect(response.status).toBe(400);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("returns 503 when database configuration is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("returns a generic recovery response for database errors", async () => {
    query.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "Private database details" },
    });

    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      code: "SPONSOR_UNAVAILABLE",
      sponsors: null,
      message: "Sponsor information is temporarily unavailable.",
    });
  });

  it("returns 504, aborts the query, and logs the 2500 ms timeout", async () => {
    vi.useFakeTimers();
    query.maybeSingle.mockReturnValue(new Promise<never>(() => {}));

    const pending = POST(request());
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(2500);
    const response = await pending;

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      code: "SPONSOR_TIMEOUT",
      sponsors: null,
      message: "Sponsor information is temporarily unavailable.",
    });

    const signal = query.abortSignal.mock.calls[0][0] as AbortSignal;
    expect(signal.aborted).toBe(true);
    expect(console.info).toHaveBeenCalledWith(JSON.stringify({
      event: "voice.sponsor.timeout",
      timeout_ms: 2500,
    }));
    expect(vi.getTimerCount()).toBe(0);
  });
});
