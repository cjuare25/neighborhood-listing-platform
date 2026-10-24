import { describe, expect, it } from "vitest";

import {
  selectSponsorForProperty,
  type SponsorCandidate,
} from "./sponsor-selection";

const activeDates = {
  startDate: "2026-10-01",
  endDate: "2026-10-31",
};

const sponsors: SponsorCandidate[] = [
  {
    id: 1,
    name: "Sponsor A",
    tier: "SILVER",
    distanceMiles: 0.4,
    impressions: 120,
    status: "APPROVED",
    ...activeDates,
    zipCode: "90032",
    destinationUrl: "https://sponsor-a.example.com",
  },
  {
    id: 2,
    name: "Sponsor B",
    tier: "GOLD",
    distanceMiles: 1.2,
    impressions: 45,
    status: "APPROVED",
    ...activeDates,
    zipCode: "90032",
    destinationUrl: "https://sponsor-b.example.com",
  },
  {
    id: 3,
    name: "Sponsor C",
    tier: "GOLD",
    distanceMiles: 0.8,
    impressions: 90,
    status: "APPROVED",
    ...activeDates,
    zipCode: "90032",
    destinationUrl: "https://sponsor-c.example.com",
  },
  {
    id: 4,
    name: "Sponsor D",
    tier: "PLATINUM",
    distanceMiles: 0.2,
    impressions: 10,
    status: "PENDING",
    ...activeDates,
    zipCode: "90032",
    destinationUrl: "https://sponsor-d.example.com",
  },
];

describe("selectSponsorForProperty", () => {
  it("selects Sponsor C using eligibility and deterministic precedence", () => {
    const selectedSponsor = selectSponsorForProperty(
      sponsors,
      "90032",
      "2026-10-24",
    );

    expect(selectedSponsor?.name).toBe("Sponsor C");
  });

  it("returns null when no sponsor is eligible", () => {
    const selectedSponsor = selectSponsorForProperty(
      sponsors,
      "99999",
      "2026-10-24",
    );

    expect(selectedSponsor).toBeNull();
  });
});