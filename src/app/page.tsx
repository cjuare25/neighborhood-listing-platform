import PropertyCard from "@/components/PropertyCard";

const featuredProperty = {
  id: 1,
  address: "125 Maple Street",
  city: "Los Angeles, CA",
  price: "$725,000",
  bedrooms: 3,
  bathrooms: 2,
  imageUrl: "/window.svg",
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
            Explore homes available in your community.
          </p>
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
      </div>
    </main>
  );
}