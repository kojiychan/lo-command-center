"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { webinarFormSchema } from "@/domain/webinars";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  createWebinarForUser,
  updateWebinarContentForUser,
} from "@/server/services/webinars";

function linesFromFormValue(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function createWebinar(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  const parsed = webinarFormSchema.safeParse({
    template_type: String(formData.get("template_type") ?? ""),
    title,
    description: String(formData.get("description") ?? "").trim() || undefined,
    starts_at: String(formData.get("starts_at") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
    host_name: String(formData.get("host_name") ?? "").trim(),
    cta_text: String(formData.get("cta_text") ?? "").trim() || undefined,
    join_url: String(formData.get("join_url") ?? "").trim(),
    headline: String(formData.get("headline") ?? "").trim(),
    subheadline: String(formData.get("subheadline") ?? "").trim() || undefined,
    hero_bullets: linesFromFormValue(formData.get("hero_bullets")),
    agenda_items: linesFromFormValue(formData.get("agenda_items")),
    button_text: String(formData.get("button_text") ?? "").trim(),
    hero_image_url: "",
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

export async function updateWebinarContent(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const webinarId = String(formData.get("webinar_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const buttonText = String(formData.get("button_text") ?? "").trim();

  if (!webinarId || title.length < 3 || headline.length < 3 || buttonText.length < 2) {
    return { error: "Title, headline, and button text are required." };
  }

  const result = await updateWebinarContentForUser(user.id, webinarId, {
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    ctaText: String(formData.get("cta_text") ?? "").trim() || null,
    headline,
    subheadline: String(formData.get("subheadline") ?? "").trim() || null,
    heroBullets: linesFromFormValue(formData.get("hero_bullets")),
    agendaItems: linesFromFormValue(formData.get("agenda_items")),
    buttonText,
  });

  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath(`/webinars/${webinarId}`);
  revalidatePath("/webinars");
  return { ok: true };
}
