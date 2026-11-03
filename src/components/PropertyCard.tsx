"use client";

import { useId, useState, type FormEvent } from "react";

export type PublicProperty = {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  sponsors: {
    id: string;
    name: string;
    tier: "gold" | "silver" | "bronze";
  }[];
};

const focusStyles =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

export default function PropertyCard({
  property,
}: {
  property: PublicProperty;
}) {
  const componentId = useId();
  const headingId = `${componentId}-heading`;
  const detailsId = `${componentId}-details`;
  const emailId = `${componentId}-email`;
  const messageId = `${componentId}-message`;
  const helpId = `${componentId}-help`;

  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const form = event.currentTarget;
    const values = new FormData(form);
    setSending(true);
    setFeedback("");
    setError("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: property.id,
          inquirer_email: values.get("email"),
          message: values.get("message"),
        }),
      });

      if (!response.ok) {
        setError(
          response.status === 400
            ? "Check your email and enter a message of at least 10 characters."
            : "Your inquiry could not be sent. Please try again.",
        );
        return;
      }

      form.reset();
      setFeedback("Your inquiry has been sent.");
    } catch {
      setError("Your inquiry could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <article
      aria-labelledby={headingId}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <header>
        <p className="text-sm font-semibold text-blue-700">
          Approved listing
        </p>
        <h3
          id={headingId}
          className="mt-2 break-words text-xl font-bold text-slate-900"
        >
          {property.address}
        </h3>
        <p className="mt-3 text-2xl font-bold text-slate-900">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2,
          }).format(property.price)}
        </p>
      </header>

      <ul className="my-5 space-y-2 text-slate-700">
        <li>{property.bedrooms} bedrooms</li>
        <li>{property.bathrooms} bathrooms</li>
        <li>
          {property.square_feet.toLocaleString("en-US")} square feet
        </li>
      </ul>

      <div className="mb-5 rounded-lg bg-blue-50 p-4">
        <p className="font-semibold text-slate-900">Community sponsors</p>
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {property.sponsors.map((sponsor) => (
            <li key={sponsor.id}>
              {sponsor.name}
              <span className="ml-2 font-semibold capitalize">
                · {sponsor.tier}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        aria-label={`${expanded ? "Hide" : "View"} details for ${property.address}`}
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((current) => !current)}
        className={`mt-auto rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 ${focusStyles}`}
      >
        {expanded ? "Hide details" : "View details"}
      </button>

      <div id={detailsId} hidden={!expanded} className="mt-5">
        <h4 className="text-lg font-semibold text-slate-900">
          Ask about this property
        </h4>
        <p id={helpId} className="mt-2 text-sm text-slate-600">
          Send your question to the property owner. Your inquiry is private
          to the owner and authorized administrators.
        </p>

        <form onSubmit={handleSubmit} className="mt-4">
          <fieldset disabled={sending} className="space-y-4">
            <legend className="sr-only">
              Inquiry about {property.address}
            </legend>

            <div>
              <label htmlFor={emailId} className="block font-medium text-slate-900">
                Your email
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                className={`mt-1 w-full rounded-lg border border-slate-400 p-3 text-slate-900 ${focusStyles}`}
              />
            </div>

            <div>
              <label htmlFor={messageId} className="block font-medium text-slate-900">
                Your message
              </label>
              <textarea
                id={messageId}
                name="message"
                required
                minLength={10}
                maxLength={5000}
                rows={4}
                aria-describedby={helpId}
                className={`mt-1 w-full rounded-lg border border-slate-400 p-3 text-slate-900 ${focusStyles}`}
              />
            </div>

            <button
              type="submit"
              className={`w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60 ${focusStyles}`}
            >
              {sending ? "Sending…" : "Send inquiry"}
            </button>
          </fieldset>

          <p role="status" className="mt-3 text-sm text-green-800">
            {feedback}
          </p>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-800">
              {error}
            </p>
          )}
        </form>
      </div>
    </article>
  );
}
