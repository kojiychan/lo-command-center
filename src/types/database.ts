import type {
  FollowUpStatus as DomainFollowUpStatus,
  LeadStatus as DomainLeadStatus,
} from "@/domain/leads";
import type {
  ReminderChannel as DomainReminderChannel,
  ReminderEventStatus as DomainReminderEventStatus,
  ReminderTemplateKey as DomainReminderTemplateKey,
} from "@/domain/reminders";
import type { WebinarTemplateId as DomainWebinarTemplateId } from "@/domain/webinars";

export type LeadStatus = DomainLeadStatus;

export type FollowUpStatus = DomainFollowUpStatus;

export type ReminderTemplateKey = DomainReminderTemplateKey;

export type ReminderChannel = DomainReminderChannel;

export type ReminderEventStatus = DomainReminderEventStatus;

export type WebinarTemplateId = DomainWebinarTemplateId;

export type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  domain_prefix: string | null;
  short_bio: string | null;
  years_experience: number | null;
  families_helped: number | null;
  total_loan_volume: string | null;
  specialty_focus: string | null;
  license_states: string | null;
  profile_image_url: string | null;
  created_at: string;
};

export type Testimonial = {
  id: string;
  user_id: string;
  reviewer_name: string;
  reviewer_context: string | null;
  review_text: string;
  rating: number;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Webinar = {
  id: string;
  user_id: string;
  template_type: WebinarTemplateId;
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
  hero_bullets: string[];
  agenda_items: string[];
  button_text: string;
  hero_image_url: string | null;
  meta_pixel_id: string | null;
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
  sms_messages?: SmsMessage[];
  email_messages?: EmailMessage[];
};

export type SmsMessage = {
  id: string;
  user_id: string;
  webinar_id: string | null;
  lead_id: string | null;
  direction: "outbound" | "inbound";
  to_number: string | null;
  from_number: string | null;
  body: string;
  twilio_message_sid: string | null;
  status: string;
  error_code: string | null;
  error_message: string | null;
  provider: "twilio";
  created_at: string;
  sent_at: string | null;
};

export type EmailMessage = {
  id: string;
  user_id: string;
  webinar_id: string | null;
  lead_id: string | null;
  direction: "outbound";
  provider: "resend" | "gmail" | "outlook";
  from_email: string;
  from_name: string | null;
  reply_to_email: string | null;
  to_email: string;
  subject: string;
  html_body: string;
  text_body: string;
  provider_message_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
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
