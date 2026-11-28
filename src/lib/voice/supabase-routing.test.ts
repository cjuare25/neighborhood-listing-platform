import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createSupabaseListingLookup } from "./supabase-routing";

const NUMBER = "+15555550100";
const LISTING = {
  id: 1,
  address: "125 Maple Street",
  availability_status: "Active",
};

function setup() {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  };
  const from = vi.fn().mockReturnValue(query);
  const client = { from } as unknown as SupabaseClient;
  const controller = new AbortController();
  const lookup = createSupabaseListingLookup(client, controller.signal);

  return { query, from, lookup, signal: controller.signal };
}

describe("Supabase voice number lookup", () => {
  it("looks up the mapping and property using the supplied signal", async () => {
    const { query, from, lookup, signal } = setup();
    query.maybeSingle
      .mockResolvedValueOnce({ data: { property_id: 1 }, error: null })
      .mockResolvedValueOnce({ data: LISTING, error: null });

    await expect(lookup(NUMBER)).resolves.toEqual(LISTING);
    expect(from.mock.calls).toEqual([
      ["voice_number_routes"],
      ["properties"],
    ]);
    expect(query.eq.mock.calls).toEqual([
      ["phone_number", NUMBER],
      ["id", 1],
    ]);
    expect(query.abortSignal.mock.calls).toEqual([[signal], [signal]]);
  });

  it("returns null for an unmapped number without querying properties", async () => {
    const { query, from, lookup } = setup();
    query.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(lookup(NUMBER)).resolves.toBeNull();
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("returns null when the mapped property is unavailable to the query", async () => {
    const { query, lookup } = setup();
    query.maybeSingle
      .mockResolvedValueOnce({ data: { property_id: 1 }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });

    await expect(lookup(NUMBER)).resolves.toBeNull();
  });

  it("throws when the number lookup fails", async () => {
    const { query, lookup } = setup();
    query.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Database failure" },
    });

    await expect(lookup(NUMBER)).rejects.toThrow(
      "Voice number lookup failed.",
    );
  });

  it("throws when the property lookup fails", async () => {
    const { query, lookup } = setup();
    query.maybeSingle
      .mockResolvedValueOnce({ data: { property_id: 1 }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { message: "Database failure" },
      });

    await expect(lookup(NUMBER)).rejects.toThrow(
      "Voice property lookup failed.",
    );
  });

  it("rejects malformed mapping data", async () => {
    const { query, lookup } = setup();
    query.maybeSingle.mockResolvedValueOnce({
      data: { property_id: "invalid" },
      error: null,
    });

    await expect(lookup(NUMBER)).rejects.toThrow(
      "Voice number mapping is invalid.",
    );
  });

  it("rejects malformed property data", async () => {
    const { query, lookup } = setup();
    query.maybeSingle
      .mockResolvedValueOnce({ data: { property_id: 1 }, error: null })
      .mockResolvedValueOnce({
        data: { ...LISTING, address: "" },
        error: null,
      });

    await expect(lookup(NUMBER)).rejects.toThrow(
      "Voice property data is invalid.",
    );
  });
});
