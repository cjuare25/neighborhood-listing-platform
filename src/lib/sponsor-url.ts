import { z } from "zod";

const rawIpv4Pattern = /^(?:\d{1,3}\.){3}\d{1,3}$/;

const sponsorUrlSchema = z
  .string()
  .trim()
  .min(1, "Sponsor URL is required.")
  .superRefine((value, context) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(value);
    } catch {
      context.addIssue({
        code: "custom",
        message: "Sponsor URL must be a valid absolute URL.",
      });
      return;
    }

    if (parsedUrl.protocol !== "https:") {
      context.addIssue({
        code: "custom",
        message: "Sponsor URL must use HTTPS.",
      });
      return;
    }

    const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, "");

    if (rawIpv4Pattern.test(hostname) || hostname.includes(":")) {
      context.addIssue({
        code: "custom",
        message: "Sponsor URL cannot use a raw IP address.",
      });
      return;
    }

    if (hostname === "localhost" || !hostname.includes(".")) {
      context.addIssue({
        code: "custom",
        message: "Sponsor URL must use a public hostname.",
      });
      return;
    }

    if (parsedUrl.username || parsedUrl.password) {
      context.addIssue({
        code: "custom",
        message: "Sponsor URL cannot contain embedded credentials.",
      });
    }
  });

export const sponsorDestinationInputSchema = z.object({
  destinationUrl: sponsorUrlSchema,
});

export type SponsorUrlValidationResult =
  | {
      success: true;
      data: {
        destinationUrl: string;
      };
    }
  | {
      success: false;
      error: {
        code: "INVALID_SPONSOR_URL";
        field: "destinationUrl";
        issues: Array<{
          path: string;
          message: string;
        }>;
      };
    };

export function validateSponsorDestinationUrl(
  input: unknown,
): SponsorUrlValidationResult {
  const result = sponsorDestinationInputSchema.safeParse(input);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: {
      code: "INVALID_SPONSOR_URL",
      field: "destinationUrl",
      issues: result.error.issues.map((issue) => ({
        path: issue.path.join(".") || "destinationUrl",
        message: issue.message,
      })),
    },
  };
}