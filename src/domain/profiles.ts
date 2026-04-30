import { z } from "zod";

export const WEBINAR_BASE_DOMAIN = "realestatewebinar.com";

const domainPrefixPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const domainPrefixSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Domain prefix is required.")
  .max(63, "Domain prefix must be 63 characters or fewer.")
  .regex(
    domainPrefixPattern,
    "Use only letters, numbers, and hyphens. Start and end with a letter or number.",
  );

export const optionalDomainPrefixSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(
    (value) => value === "" || domainPrefixPattern.test(value),
    "Use only letters, numbers, and hyphens. Start and end with a letter or number.",
  )
  .transform((value) => (value === "" ? null : value));

export function formatWebinarDomain(prefix: string | null | undefined) {
  return prefix ? `${prefix}.${WEBINAR_BASE_DOMAIN}` : WEBINAR_BASE_DOMAIN;
}
