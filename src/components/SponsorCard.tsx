import { validateSponsorDestinationUrl } from "@/lib/sponsor-url";

type SponsorCardProps = {
  sponsor: {
    id: number;
    name: string;
    tier: "SILVER" | "GOLD" | "PLATINUM";
    destinationUrl: string;
  };
};

export default function SponsorCard({ sponsor }: SponsorCardProps) {
  const validatedUrl = validateSponsorDestinationUrl({
    destinationUrl: sponsor.destinationUrl,
  });

  if (!validatedUrl.success) {
    return null;
  }

  const disclosureId = `sponsor-disclosure-${sponsor.id}`;
  const descriptionId = `sponsor-description-${sponsor.id}`;
  const titleId = `sponsor-title-${sponsor.id}`;

  return (
    <aside
      aria-labelledby={titleId}
      className="rounded-2xl border border-amber-300 bg-amber-50 p-6"
    >
      <p
        id={disclosureId}
        className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-900"
      >
        Sponsored Partner
      </p>

      <h2 id={titleId} className="text-xl font-bold text-gray-950">
        {sponsor.name}
      </h2>

      <p id={descriptionId} className="mt-2 text-gray-700">
        Local {sponsor.tier.toLowerCase()} sponsor supporting this
        neighborhood.
      </p>

      <a
        href={validatedUrl.data.destinationUrl}
        target="_blank"
        rel="sponsored noopener noreferrer"
        aria-label={`Sponsored Partner: Visit ${sponsor.name} website. Opens in a new tab.`}
        aria-describedby={`${disclosureId} ${descriptionId}`}
        className="mt-4 inline-flex rounded-lg bg-amber-900 px-4 py-2 font-semibold text-white hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2"
      >
        Visit sponsor
      </a>
    </aside>
  );
}