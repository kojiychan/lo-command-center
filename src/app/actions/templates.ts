"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ReminderTemplateKey } from "@/types/database";

const keySchema = z.enum([
  "confirmation",
  "day_before",
  "morning_of",
  "one_hour",
  "ten_min",
  "started",
  "post_followup",
]);

export async function updateUserReminderTemplate(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const templateKey = keySchema.safeParse(String(formData.get("template_key") ?? ""));
  if (!templateKey.success) {
    return;
  }

  const emailEnabled = String(formData.get("email_enabled") ?? "") === "on";
  const smsEnabled = String(formData.get("sms_enabled") ?? "") === "on";
  const emailSubject = String(formData.get("email_subject") ?? "").trim();
  const emailBody = String(formData.get("email_body") ?? "");
  const smsBody = String(formData.get("sms_body") ?? "");

  const { error } = await supabase
    .from("reminder_templates")
    .update({
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
      email_subject: emailSubject.length ? emailSubject : null,
      email_body: emailBody,
      sms_body: smsBody,
    })
    .eq("user_id", user.id)
    .is("webinar_id", null)
    .eq("template_key", templateKey.data);

  if (error) {
    return;
  }

  revalidatePath("/settings");
}

export async function updateWebinarReminderTemplate(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const webinarId = String(formData.get("webinar_id") ?? "");
  const templateKey = keySchema.safeParse(String(formData.get("template_key") ?? ""));
  if (!webinarId || !templateKey.success) {
    return;
  }

  const { data: webinar, error: webinarError } = await supabase
    .from("webinars")
    .select("id")
    .eq("id", webinarId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (webinarError || !webinar) {
    return;
  }

  const emailEnabled = String(formData.get("email_enabled") ?? "") === "on";
  const smsEnabled = String(formData.get("sms_enabled") ?? "") === "on";
  const emailSubject = String(formData.get("email_subject") ?? "").trim();
  const emailBody = String(formData.get("email_body") ?? "");
  const smsBody = String(formData.get("sms_body") ?? "");

  const { error } = await supabase
    .from("reminder_templates")
    .update({
      email_enabled: emailEnabled,
      sms_enabled: smsEnabled,
      email_subject: emailSubject.length ? emailSubject : null,
      email_body: emailBody,
      sms_body: smsBody,
    })
    .eq("user_id", user.id)
    .eq("webinar_id", webinarId)
    .eq("template_key", templateKey.data as ReminderTemplateKey);

  if (error) {
    return;
  }

  revalidatePath(`/webinars/${webinarId}`);
  revalidatePath("/settings");
}
