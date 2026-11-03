import PropertyGrid from "@/components/PropertyGrid";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Neighborhood Property Listings
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-700">
            Explore approved homes and the community sponsors supporting them.
          </p>
        </header>

        <section aria-labelledby="properties-heading">
          <h2
            id="properties-heading"
            className="mb-6 text-2xl font-semibold text-slate-900"
          >
            Available properties
          </h2>
          <PropertyGrid />
        </section>
      </div>
    </main>
  );
}
