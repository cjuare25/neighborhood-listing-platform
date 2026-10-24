export type SponsorTier = "SILVER" | "GOLD" | "PLATINUM";
export type SponsorStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SponsorCandidate = {
  id: number;
  name: string;
  tier: SponsorTier;
  distanceMiles: number;
  impressions: number;
  status: SponsorStatus;
  startDate: string;
  endDate: string;
  zipCode: string;
  destinationUrl: string;
};

const tierPriority: Record<SponsorTier, number> = {
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
};

export function selectSponsorForProperty(
  candidates: SponsorCandidate[],
  propertyZipCode: string,
  currentDate: string,
): SponsorCandidate | null {
  const eligibleSponsors = candidates.filter(
    (candidate) =>
      // Administrative status
      candidate.status === "APPROVED" &&
      // Temporal validity, inclusive of both campaign dates
      currentDate >= candidate.startDate &&
      currentDate <= candidate.endDate &&
      // Spatial scope
      candidate.zipCode === propertyZipCode,
  );

  eligibleSponsors.sort((left, right) => {
    // 1. Highest sponsor tier
    const tierDifference =
      tierPriority[right.tier] - tierPriority[left.tier];

    if (tierDifference !== 0) {
      return tierDifference;
    }

    // 2. Shortest distance
    const distanceDifference = left.distanceMiles - right.distanceMiles;

    if (distanceDifference !== 0) {
      return distanceDifference;
    }

    // 3. Fewest impressions
    const impressionDifference = left.impressions - right.impressions;

    if (impressionDifference !== 0) {
      return impressionDifference;
    }

    // 4. Stable final tie-breaker
    return left.id - right.id;
  });

  // Safe fallback: render no sponsor if no candidate qualifies.
  return eligibleSponsors[0] ?? null;
}