"use server";

import {
  copyDefaultTemplatesToWebinarForUser,
  ensureDefaultReminderTemplatesForUser,
} from "@/server/services/reminders";

export async function ensureDefaultReminderTemplates(userId: string) {
  return ensureDefaultReminderTemplatesForUser(userId);
}

export async function copyDefaultTemplatesToWebinar(userId: string, webinarId: string) {
  return copyDefaultTemplatesToWebinarForUser(userId, webinarId);
}
