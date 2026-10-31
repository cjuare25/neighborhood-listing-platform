import Image from "next/image";

import PropertyCard from "@/components/PropertyCard";
import SponsorCard from "@/components/SponsorCard";

const featuredProperty = {
  id: 1,
  address: "125 Maple Street",
  city: "Los Angeles, CA",
  price: "$725,000",
  bedrooms: 3,
  bathrooms: 2,
  imageUrl: "/assets/property-listing.jpg",
  availabilityStatus: "ACTIVE" as const,
};

const featuredSponsor = {
  id: 1,
  name: "Down to Earth Coffee",
  tier: "GOLD" as const,
  destinationUrl: "https://example.com/down-to-earth-coffee",
  bannerUrl: "/assets/business-partner.jpg",
  status: "APPROVED" as const,
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">
            Neighborhood Property Listings
          </h1>

          <p className="mt-3 text-lg text-slate-700">
            Explore homes and trusted local partners in your community.
          </p>

          <nav aria-label="Neighborhood navigation" className="mt-5">
            <a
              href="#featured-properties-heading"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-700 bg-white px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <Image
                src="/assets/map-pin.svg"
                alt=""
                aria-hidden="true"
                width={24}
                height={24}
                sizes="24px"
                unoptimized
              />
              Browse this neighborhood
            </a>
          </nav>
        </header>

        <section aria-labelledby="featured-properties-heading">
          <h2
            id="featured-properties-heading"
            className="mb-5 text-2xl font-semibold text-slate-900"
          >
            Featured properties
          </h2>

          <PropertyCard property={featuredProperty} />
        </section>

        <section
          aria-labelledby="neighborhood-partner-heading"
          className="mt-10"
        >
          <h2
            id="neighborhood-partner-heading"
            className="mb-5 text-2xl font-semibold text-slate-900"
          >
            Neighborhood partner
          </h2>

          <SponsorCard sponsor={featuredSponsor} />
        </section>
      </div>
    </main>
  );
}