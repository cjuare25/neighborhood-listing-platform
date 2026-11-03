"use client";

import { useEffect, useState } from "react";
import PropertyCard, { type PublicProperty } from "./PropertyCard";

export default function PropertyGrid() {
  const [properties, setProperties] = useState<PublicProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadProperties() {
      try {
        const response = await fetch("/api/properties", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Unable to load listings.");

        const body = await response.json();
        if (!Array.isArray(body.data)) {
          throw new Error("Unexpected listing response.");
        }

        if (!controller.signal.aborted) setProperties(body.data);
      } catch {
        if (!controller.signal.aborted) {
          setError("We could not load the listings. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadProperties();
    return () => controller.abort();
  }, []);

  if (loading) {
    return <p role="status" className="text-slate-700">Loading properties…</p>;
  }

  if (error) {
    return (
      <div>
        <p role="alert" className="text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!properties.length) {
    return (
      <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
        No approved properties with active sponsors are available right now.
        Please check back soon.
      </p>
    );
  }

  return (
    <>
      <p role="status" className="sr-only">
        {properties.length} properties available.
      </p>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </>
  );
}
