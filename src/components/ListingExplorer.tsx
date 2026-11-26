"use client";

import { useState } from "react";
import PropertyCard from "@/components/PropertyCard";
import SearchFilters from "@/components/SearchFilters";
import type { Property, SearchFilterValues } from "@/types";

interface ListingExplorerProps {
  properties: readonly Property[];
}

export default function ListingExplorer({
  properties,
}: ListingExplorerProps) {
  const [filters, setFilters] = useState<SearchFilterValues>({
    city: "",
    minBedrooms: 0,
  });

  const cities = [...new Set(properties.map((property) => property.city))].sort();

  const matchingProperties = properties.filter(
    (property) =>
      (filters.city === "" || property.city === filters.city) &&
      property.bedrooms >= filters.minBedrooms,
  );

  return (
    <div>
      <p className="mb-5 text-slate-700">
        Demonstration listings share an illustrative property photograph.
      </p>

      <SearchFilters cities={cities} onSearch={setFilters} />

      <p role="status" className="mb-4 font-medium text-slate-900">
        {matchingProperties.length}{" "}
        {matchingProperties.length === 1 ? "property" : "properties"} found.
      </p>

      {matchingProperties.length > 0 ? (
        <ul
          aria-label="Property listings"
          className="grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-3"
        >
          {matchingProperties.map((property) => (
            <li key={property.id} className="min-w-0">
              <PropertyCard property={property} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-slate-300 bg-white p-5 text-slate-700">
          No properties match these filters. Try another city or a lower
          minimum bedroom count.
        </p>
      )}
    </div>
  );
}
