import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getVoiceSponsors } from "./supabase-sponsors";
import { SponsorTimeoutError } from "./sponsor-timeout";

const PROPERTY_ID = "11111111-1111-4111-8111-111111111111";
const SPONSOR_ID = "22222222-2222-4222-8222-222222222222";

function setup() {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  };
  const from = vi.fn().mockReturnValue(query);
  const client = { from } as unknown as SupabaseClient;
  return { query, from, client };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Supabase voice sponsors", () => {
  it("returns only active linked sponsors for an approved property", async () => {
    const { client, query, from } = setup();
    query.maybeSingle.mockResolvedValue({
      data: {
        id: PROPERTY_ID,
        property_sponsors: [
          {
            sponsors: {
              id: SPONSOR_ID,
              name: "Demo Coffee",
              active_status: true,
            },
          },
          {
            sponsors: {
              id: "33333333-3333-4333-8333-333333333333",
              name: "Inactive sponsor",
              active_status: false,
            },
          },
          { sponsors: null },
        ],
      },
      error: null,
    });

    await expect(getVoiceSponsors(client, PROPERTY_ID)).resolves.toEqual([
      { id: SPONSOR_ID, name: "Demo Coffee" },
    ]);
    expect(from).toHaveBeenCalledWith("properties");
    expect(query.select).toHaveBeenCalledWith(
      "id,property_sponsors(sponsors(id,name,active_status))",
    );
    expect(query.eq.mock.calls).toEqual([
      ["id", PROPERTY_ID],
      ["status", "approved"],
    ]);
    expect(query.abortSignal.mock.calls[0][0]).toBeInstanceOf(AbortSignal);
  });

  it("returns no sponsors when no approved property matches", async () => {
    const { client, query } = setup();
    query.maybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(getVoiceSponsors(client, PROPERTY_ID)).resolves.toEqual([]);
  });

  it("rejects database errors without exposing their details", async () => {
    const { client, query } = setup();
    query.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "Internal database details" },
    });

    await expect(getVoiceSponsors(client, PROPERTY_ID)).rejects.toThrow(
      "Voice sponsor lookup failed.",
    );
  });

  it("rejects malformed sponsor data", async () => {
    const { client, query } = setup();
    query.maybeSingle.mockResolvedValue({
      data: {
        id: PROPERTY_ID,
        property_sponsors: [
          { sponsors: { id: SPONSOR_ID, name: "", active_status: true } },
        ],
      },
      error: null,
    });

    await expect(getVoiceSponsors(client, PROPERTY_ID)).rejects.toThrow(
      "Voice sponsor data is invalid.",
    );
  });

  it("rejects an invalid property ID before accessing storage", async () => {
    const { client, from } = setup();

    await expect(getVoiceSponsors(client, "invalid")).rejects.toThrow();
    expect(from).not.toHaveBeenCalled();
  });

  it("aborts the supplied database signal after 2500 ms", async () => {
    vi.useFakeTimers();
    const { client, query } = setup();
    query.maybeSingle.mockReturnValue(new Promise<never>(() => {}));

    const pending = getVoiceSponsors(client, PROPERTY_ID);
    const assertion = expect(pending).rejects.toBeInstanceOf(
      SponsorTimeoutError,
    );

    await vi.advanceTimersByTimeAsync(2500);
    await assertion;

    const signal = query.abortSignal.mock.calls[0][0] as AbortSignal;
    expect(signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
