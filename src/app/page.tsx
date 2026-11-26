import Image from "next/image";

import ListingExplorer from "@/components/ListingExplorer";
import { sampleProperties } from "@/data/properties";
import SponsorBanner from "@/components/SponsorBanner";

const featuredSponsor = {
  id: 1,
  name: "Down to Earth Coffee",
  tier: "GOLD" as const,
  destinationUrl: "https://example.com/down-to-earth-coffee",
  bannerUrl: "/assets/business-partner.jpg",
  bannerAlt: "Down to Earth Coffee storefront with large windows and outdoor seating.",
  status: "APPROVED" as const,
};

export default function Home() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-slate-100 px-6 py-12">
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


        <ul
          aria-label="Platform features"
          className="mb-10 grid list-none gap-5 p-0 md:grid-cols-3"
        >
          <li className="rounded-xl border border-slate-300 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Listings
            </h2>
            <p className="mt-3 text-slate-700">
              Explore featured homes and save properties to your favorites.
            </p>
            <a
              href="#featured-properties-heading"
              className="mt-4 inline-block font-semibold text-blue-700 underline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Explore listings
            </a>
          </li>
          <li className="rounded-xl border border-slate-300 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Neighborhood sponsors
            </h2>
            <p className="mt-3 text-slate-700">
              Discover local businesses featured as neighborhood partners.
            </p>
            <a
              href="#neighborhood-partner-heading"
              className="mt-4 inline-block font-semibold text-blue-700 underline focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              Explore neighborhood sponsors
            </a>
          </li>
          <li className="rounded-xl border border-slate-300 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Voice help
            </h2>
            <p className="mt-3 text-slate-700">
              Planned webpage integration for spoken property questions
              and leasing assistance.
            </p>
            <p className="mt-4 font-semibold text-slate-800">
              Voice help is not connected to this webpage.
            </p>
          </li>
        </ul>

        <section aria-labelledby="featured-properties-heading">
          <h2
            id="featured-properties-heading"
            className="mb-5 text-2xl font-semibold text-slate-900"
          >
            Featured properties
          </h2>

          <ListingExplorer properties={sampleProperties} />
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

          <SponsorBanner sponsor={featuredSponsor} />
        </section>
      </div>
    </main>
  );
}