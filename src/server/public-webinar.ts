import { createAdminClient } from "@/lib/supabase/admin";

export type PublicPresenter = {
  full_name: string | null;
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
  presenter: PublicPresenter | null;
  testimonials: PublicTestimonial[];
  webinar: {
    user_id: string;
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
        user_id,
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
        user_id: string;
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
        "full_name, short_bio, years_experience, families_helped, total_loan_volume, specialty_focus, license_states, profile_image_url",
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
      presenter: profile ?? null,
      testimonials: testimonials ?? [],
      webinar: {
        user_id: w.user_id,
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
