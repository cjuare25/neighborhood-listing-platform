import { z } from "zod";

import type { PropertyListing } from "@/types/PropertyListing";

export const propertyListingSchema: z.ZodType<PropertyListing> = z.object({
  id: z.number().int().positive(),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  price: z.number().positive(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().nonnegative(),
  imageUrl: z.string().url(),
  amenities: z.array(z.string().trim().min(1)).min(1),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  }),
  listedAt: z
    .string()
    .datetime()
    .refine((value) => new Date(value).getTime() <= Date.now(), {
      message: "Listing date cannot be in the future",
    }),
});

export function validatePropertyListing(
  payload: unknown,
): PropertyListing {
  return propertyListingSchema.parse(payload);
}
