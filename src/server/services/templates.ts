import { createClient } from "@/lib/supabase/server";
import { assertWebinarOwner } from "@/server/auth/ownership";
import type { ReminderTemplateKey } from "@/types/database";

export type ReminderTemplateUpdateInput = {
  templateKey: ReminderTemplateKey;
  emailEnabled: boolean;
  smsEnabled: boolean;
  emailSubject: string;
  emailBody: string;
  smsBody: string;
};

function templateUpdatePayload(input: ReminderTemplateUpdateInput) {
  return {
    email_enabled: input.emailEnabled,
    sms_enabled: input.smsEnabled,
    email_subject: input.emailSubject.length ? input.emailSubject : null,
    email_body: input.emailBody,
    sms_body: input.smsBody,
  };
}

export async function updateUserReminderTemplateForUser(
  userId: string,
  input: ReminderTemplateUpdateInput,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reminder_templates")
    .update(templateUpdatePayload(input))
    .eq("user_id", userId)
    .is("webinar_id", null)
    .eq("template_key", input.templateKey);

  if (error) {
    return { error: error.message };
  }

  return { ok: true as const };
}

export async function updateWebinarReminderTemplateForUser(
  userId: string,
  webinarId: string,
  input: ReminderTemplateUpdateInput,
) {
  const gate = await assertWebinarOwner(webinarId, userId);
  if (!gate.ok) {
    return { error: gate.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reminder_templates")
    .update(templateUpdatePayload(input))
    .eq("user_id", userId)
    .eq("webinar_id", webinarId)
    .eq("template_key", input.templateKey);

  if (error) {
    return { error: error.message };
  }

  return { ok: true as const };
}
