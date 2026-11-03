import { z } from "zod";

export const propertySchema = z
  .object({
    address: z.string().trim().min(5),
    price: z.number().nonnegative().max(9999999999.99),
    bedrooms: z.number().int().nonnegative().max(2147483647),
    bathrooms: z.number().nonnegative().max(99.9),
    square_feet: z.number().int().positive().max(2147483647),
  })
  .strict();

export type PropertyInput = z.infer<typeof propertySchema>;
