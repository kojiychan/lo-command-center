"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildDefaultReminderSchedule } from "@/lib/reminder-schedule";
import { sendTemplateSms } from "@/server/services/sms";

const registrationSchema = z.object({
  slug: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(7),
  user_tz: z.string().optional(),
});

export type RegisterState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; joinUrl: string };

export async function registerForWebinar(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      status: "error",
      message:
        "Server configuration error: missing `SUPABASE_SERVICE_ROLE_KEY`. Add it to `.env.local` for public registration.",
    };
  }

  const parsed = registrationSchema.safeParse({
    slug: String(formData.get("slug") ?? ""),
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    user_tz: String(formData.get("user_tz") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const { data: page, error: pageError } = await admin
    .from("webinar_pages")
    .select("webinar_id, slug")
    .eq("slug", parsed.data.slug)
    .maybeSingle();

  if (pageError || !page) {
    return { status: "error", message: "This registration page is not available." };
  }

  const { data: webinar, error: webinarError } = await admin
    .from("webinars")
    .select("join_url, starts_at, timezone")
    .eq("id", page.webinar_id)
    .maybeSingle();

  if (webinarError || !webinar) {
    return { status: "error", message: "This webinar is not available." };
  }

  const { data: inserted, error: insertError } = await admin
    .from("leads")
    .insert({
      webinar_id: page.webinar_id,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      user_timezone: parsed.data.user_tz ?? null,
      status: "registered",
      follow_up_status: "none",
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        status: "error",
        message: "You’re already registered for this webinar with that email.",
      };
    }
    return { status: "error", message: insertError.message };
  }

  const { data: templates, error: templatesError } = await admin
    .from("reminder_templates")
    .select("*")
    .eq("webinar_id", page.webinar_id);

  if (templatesError) {
    return { status: "error", message: templatesError.message };
  }

  const schedule = buildDefaultReminderSchedule(webinar.starts_at, webinar.timezone);

  const events: Array<{
    lead_id: string;
    webinar_id: string;
    template_key: string;
    channel: "email" | "sms";
    scheduled_for: string;
    status: "pending";
    provider_message: string | null;
  }> = [];

  for (const item of schedule) {
    const template = templates?.find((t) => t.template_key === item.template_key);
    if (!template) {
      continue;
    }

    if (template.email_enabled) {
      events.push({
        lead_id: inserted.id,
        webinar_id: page.webinar_id,
        template_key: item.template_key,
        channel: "email",
        scheduled_for: item.scheduled_for.toISOString(),
        status: "pending",
        provider_message:
          "MOCK: scheduled (connect SendGrid here; render `email_subject` + `email_body`).",
      });
    }

    if (template.sms_enabled) {
      events.push({
        lead_id: inserted.id,
        webinar_id: page.webinar_id,
        template_key: item.template_key,
        channel: "sms",
        scheduled_for: item.scheduled_for.toISOString(),
        status: "pending",
        provider_message:
          "MOCK: scheduled (connect Twilio here; render `sms_body` with TCPA-compliant sending windows).",
      });
    }
  }

  if (events.length > 0) {
    const { error: eventsError } = await admin.from("reminder_events").insert(events);
    if (eventsError) {
      return { status: "error", message: eventsError.message };
    }
  }

  const confirmationTemplate = templates?.find((t) => t.template_key === "confirmation");
  if (confirmationTemplate?.sms_enabled) {
    const { data: owner } = await admin
      .from("webinars")
      .select("user_id")
      .eq("id", page.webinar_id)
      .maybeSingle();

    if (owner?.user_id) {
      const smsResult = await sendTemplateSms({
        userId: owner.user_id,
        webinarId: page.webinar_id,
        leadId: inserted.id,
        templateKey: "confirmation",
      });

      if ("error" in smsResult) {
        console.error("Confirmation SMS failed:", smsResult.error);
      }
    }
  }

  return { status: "success", joinUrl: webinar.join_url };
}
