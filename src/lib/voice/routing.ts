import twilio from "twilio";

export interface VoiceListing {
  id: number;
  address: string;
  availability_status: string;
}

export type ListingLookup = (
  dialedNumber: string,
) => Promise<VoiceListing | null>;

export async function resolveVoiceListing(
  dialedNumber: string,
  lookup: ListingLookup,
): Promise<VoiceListing | null> {
  if (!/^\+[1-9]\d{7,14}$/.test(dialedNumber)) {
    throw new TypeError("Invalid dialed number.");
  }

  const listing = await lookup(dialedNumber);

  if (!listing || listing.availability_status !== "Active") {
    return null;
  }

  return listing;
}

export function buildUnmappedListingTwiml(): string {
  const response = new twilio.twiml.VoiceResponse();

  response.say(
    "Thank you for calling Neighborhood Listing Platform. " +
      "We could not find an active property for this number. " +
      "Please visit our website to browse available homes. Goodbye.",
  );
  response.hangup();

  return response.toString();
}
