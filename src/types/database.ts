export type LeadStatus =
  | "registered"
  | "attended"
  | "no_show"
  | "booked_call"
  | "closed";

export type FollowUpStatus = "none" | "pending" | "sent" | "converted";

export type ReminderTemplateKey =
  | "confirmation"
  | "day_before"
  | "morning_of"
  | "one_hour"
  | "ten_min"
  | "started"
  | "post_followup";

export type ReminderChannel = "email" | "sms";

export type ReminderEventStatus =
  | "pending"
  | "queued"
  | "sent"
  | "failed"
  | "skipped";

export type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  created_at: string;
};

export type Webinar = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  starts_at: string;
  timezone: string;
  host_name: string;
  cta_text: string | null;
  join_url: string;
  created_at: string;
  updated_at: string;
};

export type WebinarPage = {
  id: string;
  webinar_id: string;
  slug: string;
  headline: string;
  subheadline: string | null;
  button_text: string;
  hero_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  webinar_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  user_timezone?: string | null;
  status: LeadStatus;
  follow_up_status: FollowUpStatus;
  registered_at: string;
  updated_at: string;
};

export type LeadNote = {
  id: string;
  lead_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

export type ReminderTemplate = {
  id: string;
  user_id: string;
  webinar_id: string | null;
  template_key: ReminderTemplateKey;
  email_enabled: boolean;
  sms_enabled: boolean;
  email_subject: string | null;
  email_body: string;
  sms_body: string;
  created_at: string;
  updated_at: string;
};

export type ReminderEvent = {
  id: string;
  lead_id: string;
  webinar_id: string;
  template_key: string;
  channel: ReminderChannel;
  scheduled_for: string;
  status: ReminderEventStatus;
  provider_message: string | null;
  created_at: string;
};

export type WebinarWithPage = Webinar & {
  webinar_pages: WebinarPage | null;
};

export type LeadWithWebinar = Lead & {
  webinars: Pick<Webinar, "id" | "title" | "starts_at"> | null;
};
