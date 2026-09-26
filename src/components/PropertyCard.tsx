"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Property = {
  id: number;
  address: string;
  city: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  imageUrl: string;
};

type PropertyCardProps = {
  property: Property;
};

export default function PropertyCard({ property }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFavorite = () => {
    setIsFavorite((current) => !current);
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md md:grid md:grid-cols-[2fr_3fr]">
      <div className="relative">
        <Image
          src={property.imageUrl}
          alt={`${property.address} property in ${property.city}`}
          width={800}
          height={600}
          className="h-56 w-full object-cover md:h-full"
        />

        <button
          type="button"
          onClick={handleFavorite}
          aria-label={`${isFavorite ? "Remove" : "Add"} ${property.address} ${
            isFavorite ? "from" : "to"
          } favorites`}
          className="absolute right-3 top-3 rounded-full bg-white px-3 py-2 text-xl shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
        </button>
      </div>

      <div className="flex flex-col justify-between gap-4 p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Featured property
          </p>

          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {property.address}
          </h3>

          <p className="mt-1 text-slate-600">{property.city}</p>
          <p className="mt-3 text-xl font-bold text-slate-900">
            {property.price}
          </p>

          <p className="mt-2 text-slate-700">
            {property.bedrooms} bedrooms · {property.bathrooms} bathrooms
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/properties/${property.id}`}
            className="rounded-lg bg-blue-700 px-4 py-3 text-center font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            View property
          </Link>

          <a
            href="tel:+15551234567"
            className="rounded-lg border border-blue-700 px-4 py-3 text-center font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Call agent
          </a>
        </div>
      </div>
    </article>
  );
}