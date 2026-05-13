import { createAdminClient } from "@/lib/supabase/admin";
import type { WebinarTemplateId } from "@/domain/webinars";

export type PublicPresenter = {
  full_name: string | null;
  domain_prefix: string | null;
  short_bio: string | null;
  years_experience: number | null;
  families_helped: number | null;
  total_loan_volume: string | null;
  specialty_focus: string | null;
  license_states: string | null;
  profile_image_url: string | null;
};

export type PublicTestimonial = {
  id: string;
  reviewer_name: string;
  reviewer_context: string | null;
  review_text: string;
  rating: number;
  display_order: number;
};

export type PublicWebinarLanding = {
  slug: string;
  headline: string;
  subheadline: string | null;
  button_text: string;
  hero_image_url: string | null;
  meta_pixel_id: string | null;
  hero_bullets: string[];
  agenda_items: string[];
  presenter: PublicPresenter | null;
  testimonials: PublicTestimonial[];
  webinar: {
    id: string;
    user_id: string;
    template_type: WebinarTemplateId;
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
      meta_pixel_id,
      hero_bullets,
      agenda_items,
      webinars (
        user_id,
        id,
        template_type,
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
        id: string;
        user_id: string;
        template_type: WebinarTemplateId;
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

  const [{ data: profile }, { data: testimonials }] = await Promise.all([
    admin
      .from("profiles")
      .select(
        "full_name, domain_prefix, short_bio, years_experience, families_helped, total_loan_volume, specialty_focus, license_states, profile_image_url",
      )
      .eq("id", w.user_id)
      .maybeSingle(),
    admin
      .from("testimonials")
      .select("id, reviewer_name, reviewer_context, review_text, rating, display_order")
      .eq("user_id", w.user_id)
      .order("display_order", { ascending: true })
      .limit(3),
  ]);

  return {
    data: {
      slug: data.slug,
      headline: data.headline,
      subheadline: data.subheadline,
      button_text: data.button_text,
      hero_image_url: data.hero_image_url,
      meta_pixel_id: data.meta_pixel_id,
      hero_bullets: normalizeStringArray(data.hero_bullets),
      agenda_items: normalizeStringArray(data.agenda_items),
      presenter: profile ?? null,
      testimonials: testimonials ?? [],
      webinar: {
        id: w.id,
        user_id: w.user_id,
        template_type: w.template_type,
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

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}
