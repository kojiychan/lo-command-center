import { z } from "zod";

export const REMINDER_TEMPLATE_KEYS = [
  "confirmation",
  "day_before",
  "morning_of",
  "one_hour",
  "ten_min",
  "started",
  "post_followup",
  "attended_cta",
  "no_show_one_on_one",
  "booked_call_prep",
  "closed_client_onboarding",
] as const;

export const REMINDER_TEMPLATE_DISPLAY_ORDER = [
  "confirmation",
  "day_before",
  "morning_of",
  "one_hour",
  "ten_min",
  "started",
  "attended_cta",
  "no_show_one_on_one",
  "booked_call_prep",
  "closed_client_onboarding",
  "post_followup",
] as const satisfies readonly (typeof REMINDER_TEMPLATE_KEYS)[number][];

export const REMINDER_CHANNELS = ["email", "sms"] as const;

export const REMINDER_EVENT_STATUSES = [
  "pending",
  "queued",
  "sent",
  "failed",
  "skipped",
] as const;

export const reminderTemplateKeySchema = z.enum(REMINDER_TEMPLATE_KEYS);
export const reminderChannelSchema = z.enum(REMINDER_CHANNELS);
export const reminderEventStatusSchema = z.enum(REMINDER_EVENT_STATUSES);

export type ReminderTemplateKey = z.infer<typeof reminderTemplateKeySchema>;
export type ReminderChannel = z.infer<typeof reminderChannelSchema>;
export type ReminderEventStatus = z.infer<typeof reminderEventStatusSchema>;

export const REMINDER_LABELS: Record<ReminderTemplateKey, string> = {
  confirmation: "Immediate confirmation",
  day_before: "Day-before reminder",
  morning_of: "Morning of webinar",
  one_hour: "1 hour before",
  ten_min: "10 minutes before",
  started: "Webinar just started",
  post_followup: "Post-webinar follow-up",
  attended_cta: "Attended: CTA reminder",
  no_show_one_on_one: "No-show: 1:1 invite",
  booked_call_prep: "Booked call prep",
  closed_client_onboarding: "Closed: client onboarding",
};

export const editableReminderTemplateSchema = z.object({
  template_key: reminderTemplateKeySchema,
  email_enabled: z.boolean(),
  sms_enabled: z.boolean(),
  email_subject: z.string().trim(),
  email_body: z.string(),
  sms_body: z.string(),
});
