import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_REMINDER_TEMPLATES } from "@/lib/reminder-defaults";

type ReminderTemplateRow = {
  template_key: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  email_subject: string | null;
  email_body: string;
  sms_body: string;
};

export async function ensureDefaultReminderTemplatesForUser(userId: string) {
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

  const { data: existing, error: existingError } = await supabase
    .from("reminder_templates")
    .select("template_key")
    .eq("user_id", userId)
    .is("webinar_id", null);

  if (existingError) {
    console.error(existingError);
    return;
  }

  const existingKeys = new Set((existing ?? []).map((row) => row.template_key));
  const missingRows = rows.filter((row) => !existingKeys.has(row.template_key));

  if (missingRows.length === 0) {
    return;
  }

  const { error } = await supabase.from("reminder_templates").insert(missingRows);

  if (error) {
    console.error(error);
  }
}

export async function copyDefaultTemplatesToWebinarForUser(
  userId: string,
  webinarId: string,
) {
  const supabase = await createClient();

  const { data: defaults, error } = await supabase
    .from("reminder_templates")
    .select("*")
    .eq("user_id", userId)
    .is("webinar_id", null);

  if (error || !defaults?.length) {
    await ensureDefaultReminderTemplatesForUser(userId);
    const retry = await supabase
      .from("reminder_templates")
      .select("*")
      .eq("user_id", userId)
      .is("webinar_id", null);

    if (retry.error || !retry.data?.length) {
      console.error(retry.error);
      return;
    }

    await insertWebinarCopies(supabase, userId, webinarId, retry.data as ReminderTemplateRow[]);
    return;
  }

  await insertWebinarCopies(supabase, userId, webinarId, defaults as ReminderTemplateRow[]);
}

async function insertWebinarCopies(
  supabase: SupabaseClient,
  userId: string,
  webinarId: string,
  defaults: ReminderTemplateRow[],
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
