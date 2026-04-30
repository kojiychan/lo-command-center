import { z } from "zod";
import { WEBINAR_TEMPLATE_IDS } from "@/lib/webinarTemplates";

export const webinarTemplateIdSchema = z.enum(WEBINAR_TEMPLATE_IDS);

export const webinarFormSchema = z.object({
  template_type: webinarTemplateIdSchema,
  title: z.string().min(3),
  description: z.string().optional(),
  starts_at: z.string().min(1),
  timezone: z.string().min(1),
  host_name: z.string().min(1),
  cta_text: z.string().optional(),
  join_url: z.string().url(),
  headline: z.string().min(3),
  subheadline: z.string().optional(),
  hero_bullets: z.array(z.string().min(1)).min(1),
  agenda_items: z.array(z.string().min(1)).min(1),
  button_text: z.string().min(2),
  hero_image_url: z.union([z.string().url(), z.literal("")]).optional(),
  slug: z.string().optional(),
});

export type WebinarFormInput = z.infer<typeof webinarFormSchema>;
export type WebinarTemplateId = z.infer<typeof webinarTemplateIdSchema>;
