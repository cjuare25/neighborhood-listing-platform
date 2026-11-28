"use client";

import Image from "next/image";
import Link from "next/link";

import type { PropertyCardProps } from "@/types";

export default function PropertyCard({
  property,
  isFavorite,
  onToggleFavorite,
}: PropertyCardProps) {
  const headingId = `property-title-${property.id}`;

  return (
    <article
      aria-labelledby={headingId}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md"
    >
      <div className="relative">
        <Image
          src={property.imageUrl}
          alt={property.imageAlt}
          width={1280}
          height={853}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="aspect-[3/2] w-full object-cover"
        />

        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={`${isFavorite ? "Remove" : "Add"} ${property.address} ${
            isFavorite ? "from" : "to"
          } favorites`}
          className="absolute right-3 top-3 rounded-full bg-white px-3 py-2 text-xl text-slate-900 shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Featured property
          </p>
          <h3
            id={headingId}
            className="mt-2 text-2xl font-bold text-slate-900"
          >
            {property.address}
          </h3>
          <p className="mt-1 text-slate-700">{property.city}</p>
          <p className="mt-3 text-xl font-bold text-slate-900">
            {property.price}
          </p>
        </div>

        <ul aria-label="Property facts" className="list-disc pl-5 text-slate-700">
          <li>{property.bedrooms} bedrooms</li>
          <li>{property.bathrooms} bathrooms</li>
        </ul>

        {(property.detailUrl || property.agentPhone) && (
          <div className="mt-auto flex flex-col gap-3">
            {property.detailUrl && (
              <Link
                href={property.detailUrl}
                className="rounded-lg bg-blue-700 px-4 py-3 text-center font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                View details for {property.address}
              </Link>
            )}

            {property.agentPhone && (
              <a
                href={`tel:${property.agentPhone}`}
                className="rounded-lg border border-blue-700 px-4 py-3 text-center font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Call the agent for {property.address}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
