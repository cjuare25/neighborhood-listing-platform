import { describe, expect, it } from "vitest";

import { validateSponsorDestinationUrl } from "./sponsor-url";

describe("validateSponsorDestinationUrl", () => {
  it("accepts a valid HTTPS sponsor URL", () => {
    const result = validateSponsorDestinationUrl({
      destinationUrl:
        "https://partners.example.com/offers/neighborhood",
    });

    expect(result).toEqual({
      success: true,
      data: {
        destinationUrl:
          "https://partners.example.com/offers/neighborhood",
      },
    });
  });

  it("rejects an unsafe HTTP sponsor URL", () => {
    const result = validateSponsorDestinationUrl({
      destinationUrl: "http://partners.example.com/offer",
    });

    expect(result).toEqual({
      success: false,
      error: {
        code: "INVALID_SPONSOR_URL",
        field: "destinationUrl",
        issues: [
          {
            path: "destinationUrl",
            message: "Sponsor URL must use HTTPS.",
          },
        ],
      },
    });
  });
});