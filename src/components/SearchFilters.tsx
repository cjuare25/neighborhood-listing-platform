"use client";

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { SearchFiltersProps } from "@/types";

export default function SearchFilters({
  cities,
  onSearch,
  initialFilters,
}: SearchFiltersProps) {
  const id = useId();
  const cityRef = useRef<HTMLSelectElement>(null);
  const bedroomsRef = useRef<HTMLSelectElement>(null);
  const [error, setError] = useState<{
    field: "city" | "minBedrooms";
    message: string;
  } | null>(null);

  const cityId = `${id}-city`;
  const bedroomsId = `${id}-bedrooms`;
  const errorId = `${id}-error`;
  const bedroomOptions = [0, 1, 2, 3, 4];
  const initialCity = cities.includes(initialFilters?.city ?? "")
    ? initialFilters?.city
    : "";
  const initialBedrooms = bedroomOptions.includes(
    initialFilters?.minBedrooms ?? 0,
  )
    ? initialFilters?.minBedrooms ?? 0
    : 0;

  const controlClass =
    "mt-2 w-full rounded-lg border border-slate-500 bg-white px-3 py-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const city = data.get("city");
    const bedrooms = data.get("minBedrooms");

    if (typeof city !== "string" || (city !== "" && !cities.includes(city))) {
      setError({
        field: "city",
        message: "Choose a city from the available options.",
      });
      cityRef.current?.focus();
      return;
    }

    const minBedrooms = typeof bedrooms === "string" ? Number(bedrooms) : NaN;

    if (
      bedrooms === "" ||
      !Number.isFinite(minBedrooms) ||
      !Number.isInteger(minBedrooms) ||
      !bedroomOptions.includes(minBedrooms)
    ) {
      setError({
        field: "minBedrooms",
        message: "Choose a minimum bedroom count from the available options.",
      });
      bedroomsRef.current?.focus();
      return;
    }

    setError(null);
    onSearch({ city, minBedrooms });
  }

  return (
    <form
      aria-label="Search properties"
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border border-slate-300 bg-white p-5"
    >
      <fieldset>
        <legend className="text-lg font-semibold text-slate-900">
          Filter properties
        </legend>

        {error && (
          <p id={errorId} role="alert" className="mt-3 font-medium text-red-800">
            {error.message}
          </p>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={cityId} className="font-medium text-slate-900">
              City
            </label>
            <select
              ref={cityRef}
              id={cityId}
              name="city"
              defaultValue={initialCity}
              aria-invalid={error?.field === "city" || undefined}
              aria-describedby={error?.field === "city" ? errorId : undefined}
              className={controlClass}
            >
              <option value="">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={bedroomsId} className="font-medium text-slate-900">
              Minimum bedrooms
            </label>
            <select
              ref={bedroomsRef}
              id={bedroomsId}
              name="minBedrooms"
              defaultValue={initialBedrooms}
              aria-invalid={error?.field === "minBedrooms" || undefined}
              aria-describedby={
                error?.field === "minBedrooms" ? errorId : undefined
              }
              className={controlClass}
            >
              {bedroomOptions.map((count) => (
                <option key={count} value={count}>
                  {count === 0 ? "Any bedroom count" : `${count}+ bedrooms`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="mt-5 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          Search properties
        </button>
      </fieldset>
    </form>
  );
}
