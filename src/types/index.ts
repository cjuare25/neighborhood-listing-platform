// Shared compile-time contracts.
// Validate form values and external data at runtime before trusting them.

export type SponsorTier = "SILVER" | "GOLD" | "PLATINUM";
export type SponsorStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Property {
  id: number;
  address: string;
  city: string;
  /** Formatted display price, not a numeric value for calculations. */
  price: string;
  bedrooms: number;
  bathrooms: number;
  imageUrl: string;
  imageAlt: string;
  /** Omit when no working detail page exists. */
  detailUrl?: string;
  /** Omit when no verified contact number exists. */
  agentPhone?: string;
}

export interface Sponsor {
  id: number;
  name: string;
  tier: SponsorTier;
  destinationUrl: string;
  bannerUrl: string;
  bannerAlt: string;
  status: SponsorStatus;
}

export interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export interface SponsorBannerProps {
  sponsor: Sponsor;
}

export interface SearchFilterValues {
  /** Empty means all cities; otherwise validate against supplied cities. */
  city: string;
  /** Validate as a finite, nonnegative integer; zero means no minimum. */
  minBedrooms: number;
}

export interface SearchFiltersProps {
  cities: readonly string[];
  onSearch: (filters: SearchFilterValues) => void;
  /** Initial values only; subsequent changes do not reset the form. */
  initialFilters?: Partial<SearchFilterValues>;
}
