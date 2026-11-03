import { z } from "zod";

export const inquirySchema = z
  .object({
    property_id: z.string().uuid(),
    inquirer_email: z.string().trim().max(254).regex(
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
      "Enter a valid email address.",
    ),
    message: z.string().trim().min(10).max(5000),
  })
  .strict();
