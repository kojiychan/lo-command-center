"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { webinarFormSchema } from "@/domain/webinars";
import { getCurrentUser } from "@/server/auth/current-user";
import { createWebinarForUser } from "@/server/services/webinars";

export async function createWebinar(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  const parsed = webinarFormSchema.safeParse({
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

  const result = await createWebinarForUser(user.id, parsed.data);
  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/webinars");
  revalidatePath("/dashboard");
  redirect(`/webinars/${result.webinarId}`);
}
