import { describe, expect, it, vi } from "vitest";
import {
  buildUnmappedListingTwiml,
  resolveVoiceListing,
} from "./routing";

const DIALED_NUMBER = "+15555550100";

describe("voice listing routing", () => {
  it("returns an active listing mapped to the dialed number", async () => {
    const listing = {
      id: "11111111-1111-4111-8111-111111111111",
      address: "125 Maple Street",
      status: "approved",
    };
    const lookup = vi.fn().mockResolvedValue(listing);

    await expect(resolveVoiceListing(DIALED_NUMBER, lookup)).resolves.toEqual(
      listing,
    );
    expect(lookup).toHaveBeenCalledWith(DIALED_NUMBER);
  });

  it("returns no listing when the dialed number is unmapped", async () => {
    const lookup = vi.fn().mockResolvedValue(null);

    await expect(resolveVoiceListing(DIALED_NUMBER, lookup)).resolves.toBeNull();
    expect(lookup).toHaveBeenCalledWith(DIALED_NUMBER);
  });

  it.each(["pending", "rejected", "draft"])(
    "does not route to a listing whose status is %s",
    async (status) => {
      const lookup = vi.fn().mockResolvedValue({
        id: "11111111-1111-4111-8111-111111111111",
        address: "125 Maple Street",
        status,
      });

      await expect(
        resolveVoiceListing(DIALED_NUMBER, lookup),
      ).resolves.toBeNull();
    },
  );

  it("rejects an invalid dialed number before looking it up", async () => {
    const lookup = vi.fn();

    await expect(resolveVoiceListing("invalid", lookup)).rejects.toThrow(
      "Invalid dialed number.",
    );
    expect(lookup).not.toHaveBeenCalled();
  });

  it("keeps database failures distinct from an unmapped number", async () => {
    const lookup = vi.fn().mockRejectedValue(new Error("Storage unavailable"));

    await expect(resolveVoiceListing(DIALED_NUMBER, lookup)).rejects.toThrow(
      "Storage unavailable",
    );
  });

  it("builds a general agency message followed by hangup", () => {
    const xml = buildUnmappedListingTwiml();

    expect(xml).toContain("<Response>");
    expect(xml).toContain("<Say>");
    expect(xml).toContain(
      "We could not find an active property for this number.",
    );
    expect(xml).toContain("Please visit our website");
    expect(xml).toContain("<Hangup/>");
    expect(xml).not.toContain("<Dial");
    expect(xml).not.toContain("<Connect");
  });
});
