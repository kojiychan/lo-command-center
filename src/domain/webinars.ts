import { z } from "zod";

export const webinarFormSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  starts_at: z.string().min(1),
  timezone: z.string().min(1),
  host_name: z.string().min(1),
  cta_text: z.string().optional(),
  join_url: z.string().url(),
  headline: z.string().min(3),
  subheadline: z.string().optional(),
  button_text: z.string().min(2),
  hero_image_url: z.union([z.string().url(), z.literal("")]).optional(),
  slug: z.string().optional(),
});

export type WebinarFormInput = z.infer<typeof webinarFormSchema>;
