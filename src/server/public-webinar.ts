import { createAdminClient } from "@/lib/supabase/admin";

export type PublicWebinarLanding = {
  slug: string;
  headline: string;
  subheadline: string | null;
  button_text: string;
  hero_image_url: string | null;
  webinar: {
    title: string;
    description: string | null;
    starts_at: string;
    timezone: string;
    host_name: string;
    cta_text: string | null;
  };
};

/**
 * Public landing pages are fetched with the service role on the server only.
 *
 * Why: we intentionally avoid exposing `join_url` in any public/anon-readable shape.
 * After registration, `registerForWebinar` returns the join link directly to the registrant.
 */
export async function getPublicWebinarLanding(
  slug: string,
): Promise<{ data: PublicWebinarLanding } | { error: string }> {
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Server is missing Supabase configuration." };
  }

  const { data, error } = await admin
    .from("webinar_pages")
    .select(
      `
      slug,
      headline,
      subheadline,
      button_text,
      hero_image_url,
      webinars (
        title,
        description,
        starts_at,
        timezone,
        host_name,
        cta_text
      )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Not found" };
  }

  const rawWebinar = data.webinars as unknown;
  const w = (Array.isArray(rawWebinar) ? rawWebinar[0] : rawWebinar) as
    | {
        title: string;
        description: string | null;
        starts_at: string;
        timezone: string;
        host_name: string;
        cta_text: string | null;
      }
    | null
    | undefined;

  if (!w) {
    return { error: "Not found" };
  }

  return {
    data: {
      slug: data.slug,
      headline: data.headline,
      subheadline: data.subheadline,
      button_text: data.button_text,
      hero_image_url: data.hero_image_url,
      webinar: {
        title: w.title,
        description: w.description,
        starts_at: w.starts_at,
        timezone: w.timezone,
        host_name: w.host_name,
        cta_text: w.cta_text,
      },
    },
  };
}
