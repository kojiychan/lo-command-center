"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const pageViewSchema = z.object({
  webinarId: z.string().uuid(),
  slug: z.string().min(1),
  visitorId: z.string().min(8).max(128).optional(),
  referrer: z.string().max(500).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(180).optional(),
});

function optionalText(value: string | undefined) {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : null;
}

export async function trackWebinarPageView(input: unknown): Promise<void> {
  const parsed = pageViewSchema.safeParse(input);
  if (!parsed.success) {
    return;
  }

  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const headerStore = headers();
  const userAgent = headerStore.get("user-agent");

  await admin.from("webinar_page_views").insert({
    webinar_id: parsed.data.webinarId,
    slug: parsed.data.slug,
    visitor_id: optionalText(parsed.data.visitorId),
    referrer: optionalText(parsed.data.referrer),
    utm_source: optionalText(parsed.data.utmSource),
    utm_medium: optionalText(parsed.data.utmMedium),
    utm_campaign: optionalText(parsed.data.utmCampaign),
    user_agent: userAgent,
  });
}
