import type { ReminderTemplateKey } from "@/types/database";

export const APP_NAME = "LO Command Center";

export const REMINDER_TEMPLATE_KEYS: ReminderTemplateKey[] = [
  "confirmation",
  "day_before",
  "morning_of",
  "one_hour",
  "ten_min",
  "started",
  "post_followup",
];

export const REMINDER_LABELS: Record<ReminderTemplateKey, string> = {
  confirmation: "Immediate confirmation",
  day_before: "24 hours before (day before)",
  morning_of: "Morning of webinar",
  one_hour: "1 hour before",
  ten_min: "10 minutes before",
  started: "Webinar just started",
  post_followup: "Post-webinar follow-up",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  registered: "Registered",
  attended: "Attended",
  no_show: "No-show",
  booked_call: "Booked call",
  closed: "Closed",
};

export const FOLLOW_UP_LABELS: Record<string, string> = {
  none: "None",
  pending: "Needs follow-up",
  sent: "Follow-up sent",
  converted: "Converted",
};
