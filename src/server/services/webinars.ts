import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { copyDefaultTemplatesToWebinarForUser } from "@/server/services/reminders";
import type { WebinarFormInput } from "@/domain/webinars";

export async function createWebinarForUser(userId: string, input: WebinarFormInput) {
  const supabase = await createClient();
  const slug = slugify(input.slug && input.slug.length > 0 ? input.slug : input.title);

  const { data: webinar, error: webinarError } = await supabase
    .from("webinars")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      starts_at: input.starts_at,
      timezone: input.timezone,
      host_name: input.host_name,
      cta_text: input.cta_text ?? null,
      join_url: input.join_url,
    })
    .select("id")
    .single();

  if (webinarError || !webinar) {
    return { error: webinarError?.message ?? "Could not create webinar" };
  }

  const { error: pageError } = await supabase.from("webinar_pages").insert({
    webinar_id: webinar.id,
    slug,
    headline: input.headline,
    subheadline: input.subheadline ?? null,
    button_text: input.button_text,
    hero_image_url:
      input.hero_image_url && input.hero_image_url.length > 0
        ? input.hero_image_url
        : null,
  });

  if (pageError) {
    await supabase.from("webinars").delete().eq("id", webinar.id);
    return { error: pageError.message };
  }

  await copyDefaultTemplatesToWebinarForUser(userId, webinar.id);

  return { ok: true as const, webinarId: webinar.id };
}
