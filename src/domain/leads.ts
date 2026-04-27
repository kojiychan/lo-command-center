import { z } from "zod";

export const LEAD_STATUSES = [
  "registered",
  "attended",
  "no_show",
  "booked_call",
  "closed",
] as const;

export const FOLLOW_UP_STATUSES = ["none", "pending", "sent", "converted"] as const;

export const POST_WEBINAR_SEQUENCES = [
  "attended_cta",
  "no_show_one_on_one",
  "booked_call_prep",
  "closed_client_onboarding",
] as const;

export const leadStatusSchema = z.enum(LEAD_STATUSES);
export const followUpStatusSchema = z.enum(FOLLOW_UP_STATUSES);
export const postWebinarSequenceSchema = z.enum(POST_WEBINAR_SEQUENCES);

export type LeadStatus = z.infer<typeof leadStatusSchema>;
export type FollowUpStatus = z.infer<typeof followUpStatusSchema>;
export type PostWebinarSequence = z.infer<typeof postWebinarSequenceSchema>;

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  registered: "Registered",
  attended: "Attended",
  no_show: "No-show",
  booked_call: "Booked call",
  closed: "Closed",
};

export const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  none: "None",
  pending: "Needs follow-up",
  sent: "Follow-up sent",
  converted: "Converted",
};
