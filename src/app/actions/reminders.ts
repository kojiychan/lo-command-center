"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_REMINDER_TEMPLATES } from "@/lib/reminder-defaults";

export async function ensureDefaultReminderTemplates(userId: string) {
  const supabase = await createClient();

  const rows = DEFAULT_REMINDER_TEMPLATES.map((t) => ({
    user_id: userId,
    webinar_id: null,
    template_key: t.template_key,
    email_enabled: t.email_enabled,
    sms_enabled: t.sms_enabled,
    email_subject: t.email_subject,
    email_body: t.email_body,
    sms_body: t.sms_body,
  }));

  // Insert any missing defaults (idempotent thanks to partial unique indexes).
  // For Supabase PostgREST, `onConflict` must match a unique index.
  // We use a partial unique index on (user_id, template_key) where webinar_id is null.
  // Upsert will succeed for missing rows and no-op for existing ones.
  const { error } = await supabase
    .from("reminder_templates")
    .upsert(rows, { onConflict: "user_id,template_key" });

  if (error) {
    console.error(error);
  }
}

export async function copyDefaultTemplatesToWebinar(userId: string, webinarId: string) {
  const supabase = await createClient();

  const { data: defaults, error } = await supabase
    .from("reminder_templates")
    .select("*")
    .eq("user_id", userId)
    .is("webinar_id", null);

  if (error || !defaults?.length) {
    await ensureDefaultReminderTemplates(userId);
    const retry = await supabase
      .from("reminder_templates")
      .select("*")
      .eq("user_id", userId)
      .is("webinar_id", null);

    if (retry.error || !retry.data?.length) {
      console.error(retry.error);
      return;
    }

    await insertWebinarCopies(supabase, userId, webinarId, retry.data);
    return;
  }

  await insertWebinarCopies(supabase, userId, webinarId, defaults);
}

async function insertWebinarCopies(
  supabase: SupabaseClient,
  userId: string,
  webinarId: string,
  defaults: Array<Record<string, unknown>>,
) {
  const rows = defaults.map((row) => ({
    user_id: userId,
    webinar_id: webinarId,
    template_key: row.template_key,
    email_enabled: row.email_enabled,
    sms_enabled: row.sms_enabled,
    email_subject: row.email_subject,
    email_body: row.email_body,
    sms_body: row.sms_body,
  }));

  const { error } = await supabase.from("reminder_templates").insert(rows);
  if (error) {
    console.error(error);
  }
}
