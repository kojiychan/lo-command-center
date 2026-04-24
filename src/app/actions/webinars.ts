"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { copyDefaultTemplatesToWebinar } from "@/app/actions/reminders";

const schema = z.object({
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

export async function createWebinar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  const parsed = schema.safeParse({
    title,
    description: String(formData.get("description") ?? "").trim() || undefined,
    starts_at: String(formData.get("starts_at") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
    host_name: String(formData.get("host_name") ?? "").trim(),
    cta_text: String(formData.get("cta_text") ?? "").trim() || undefined,
    join_url: String(formData.get("join_url") ?? "").trim(),
    headline: String(formData.get("headline") ?? "").trim(),
    subheadline: String(formData.get("subheadline") ?? "").trim() || undefined,
    button_text: String(formData.get("button_text") ?? "").trim(),
    hero_image_url: String(formData.get("hero_image_url") ?? "").trim(),
    slug: rawSlug || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const slug = slugify(parsed.data.slug && parsed.data.slug.length > 0 ? parsed.data.slug : title);

  const { data: webinar, error: webinarError } = await supabase
    .from("webinars")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      starts_at: parsed.data.starts_at,
      timezone: parsed.data.timezone,
      host_name: parsed.data.host_name,
      cta_text: parsed.data.cta_text ?? null,
      join_url: parsed.data.join_url,
    })
    .select("id")
    .single();

  if (webinarError || !webinar) {
    return { error: webinarError?.message ?? "Could not create webinar" };
  }

  const { error: pageError } = await supabase.from("webinar_pages").insert({
    webinar_id: webinar.id,
    slug,
    headline: parsed.data.headline,
    subheadline: parsed.data.subheadline ?? null,
    button_text: parsed.data.button_text,
    hero_image_url:
      parsed.data.hero_image_url && parsed.data.hero_image_url.length > 0
        ? parsed.data.hero_image_url
        : null,
  });

  if (pageError) {
    await supabase.from("webinars").delete().eq("id", webinar.id);
    return { error: pageError.message };
  }

  await copyDefaultTemplatesToWebinar(user.id, webinar.id);

  revalidatePath("/webinars");
  revalidatePath("/dashboard");
  redirect(`/webinars/${webinar.id}`);
}
