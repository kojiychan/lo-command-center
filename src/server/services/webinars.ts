import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { getWebinarTemplate } from "@/lib/webinarTemplates";
import { assertWebinarOwner } from "@/server/auth/ownership";
import { copyDefaultTemplatesToWebinarForUser } from "@/server/services/reminders";
import type { WebinarFormInput } from "@/domain/webinars";

export type WebinarContentUpdateInput = {
  title: string;
  description: string | null;
  startsAt?: string;
  timezone?: string;
  joinUrl?: string;
  ctaText: string | null;
  headline: string;
  subheadline: string | null;
  heroBullets: string[];
  agendaItems: string[];
  buttonText: string;
  metaPixelId?: string | null;
};

export async function createWebinarForUser(userId: string, input: WebinarFormInput) {
  const supabase = await createClient();
  const baseSlug = slugify(input.slug && input.slug.length > 0 ? input.slug : input.title);
  const slugResult = await nextAvailableSlug(supabase, baseSlug);
  if ("error" in slugResult) {
    return { error: slugResult.error };
  }

  const { data: webinar, error: webinarError } = await supabase
    .from("webinars")
    .insert({
      user_id: userId,
      template_type: input.template_type,
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
    slug: slugResult.slug,
    headline: input.headline,
    subheadline: input.subheadline ?? null,
    hero_bullets: input.hero_bullets,
    agenda_items: input.agenda_items,
    button_text: input.button_text,
    meta_pixel_id: input.meta_pixel_id || null,
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
  await applyTemplateReminderCopy(webinar.id, input.template_type);

  return { ok: true as const, webinarId: webinar.id };
}

async function nextAvailableSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseSlug: string,
) {
  const { data, error } = await supabase
    .from("webinar_pages")
    .select("slug")
    .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`);

  if (error) {
    return { error: error.message };
  }

  const usedSlugs = new Set((data ?? []).map((page) => page.slug));
  if (!usedSlugs.has(baseSlug)) {
    return { slug: baseSlug };
  }

  for (let suffix = 1; suffix < 1000; suffix += 1) {
    const candidate = `${baseSlug}-${suffix}`;
    if (!usedSlugs.has(candidate)) {
      return { slug: candidate };
    }
  }

  return { error: "Could not find an available URL ending. Try a more specific webinar title." };
}

export async function updateWebinarContentForUser(
  userId: string,
  webinarId: string,
  input: WebinarContentUpdateInput,
) {
  const gate = await assertWebinarOwner(webinarId, userId);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const supabase = await createClient();
  const { error: webinarError } = await supabase
    .from("webinars")
    .update({
      title: input.title,
      description: input.description,
      ...(input.startsAt ? { starts_at: input.startsAt } : {}),
      ...(input.timezone ? { timezone: input.timezone } : {}),
      ...(input.joinUrl ? { join_url: input.joinUrl } : {}),
      cta_text: input.ctaText,
    })
    .eq("id", webinarId);

  if (webinarError) {
    return { error: webinarError.message };
  }

  const { error: pageError } = await supabase
    .from("webinar_pages")
    .update({
      headline: input.headline,
      subheadline: input.subheadline,
      hero_bullets: input.heroBullets,
      agenda_items: input.agendaItems,
      button_text: input.buttonText,
      ...(typeof input.metaPixelId !== "undefined" ? { meta_pixel_id: input.metaPixelId } : {}),
    })
    .eq("webinar_id", webinarId);

  if (pageError) {
    return { error: pageError.message };
  }

  return { ok: true as const };
}

async function applyTemplateReminderCopy(
  webinarId: string,
  templateType: WebinarFormInput["template_type"],
) {
  const supabase = await createClient();
  const template = getWebinarTemplate(templateType);

  for (const reminder of template.reminders) {
    const { error } = await supabase
      .from("reminder_templates")
      .update({
        email_subject: reminder.emailSubject,
        email_body: reminder.emailBody,
        sms_body: reminder.smsBody,
      })
      .eq("webinar_id", webinarId)
      .eq("template_key", reminder.templateKey);

    if (error) {
      console.error(error);
    }
  }
}
