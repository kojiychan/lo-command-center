"use server";

import { revalidatePath } from "next/cache";
import { reminderTemplateKeySchema } from "@/domain/reminders";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  updateUserReminderTemplateForUser,
  updateWebinarReminderTemplateForUser,
} from "@/server/services/templates";

function parseTemplateForm(formData: FormData) {
  const templateKey = reminderTemplateKeySchema.safeParse(
    String(formData.get("template_key") ?? ""),
  );

  if (!templateKey.success) {
    return null;
  }

  return {
    templateKey: templateKey.data,
    emailEnabled: String(formData.get("email_enabled") ?? "") === "on",
    smsEnabled: String(formData.get("sms_enabled") ?? "") === "on",
    emailSubject: String(formData.get("email_subject") ?? "").trim(),
    emailBody: String(formData.get("email_body") ?? ""),
    smsBody: String(formData.get("sms_body") ?? ""),
  };
}

export async function updateUserReminderTemplate(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const input = parseTemplateForm(formData);
  if (!input) {
    return;
  }

  const result = await updateUserReminderTemplateForUser(user.id, input);
  if ("error" in result) {
    return;
  }

  revalidatePath("/settings");
}

export async function updateWebinarReminderTemplate(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const webinarId = String(formData.get("webinar_id") ?? "");
  const input = parseTemplateForm(formData);
  if (!webinarId || !input) {
    return;
  }

  const result = await updateWebinarReminderTemplateForUser(user.id, webinarId, input);
  if ("error" in result) {
    return;
  }

  revalidatePath(`/webinars/${webinarId}`);
  revalidatePath("/settings");
}
