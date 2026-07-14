import type { ReminderTemplateKey } from "@/domain/reminders";

export type TemplateSeed = {
  template_key: ReminderTemplateKey;
  email_subject: string;
  email_body: string;
  sms_body: string;
  email_enabled: boolean;
  sms_enabled: boolean;
};

/**
 * Mortgage-LO tuned defaults. `{{first_name}}`, `{{host}}`, `{{title}}`, `{{time}}`, `{{date}}`,
 * `{{time_only}}`, `{{timezone}}`, and `{{join_link}}` are replaced in the sending layer.
 */
export const DEFAULT_REMINDER_TEMPLATES: TemplateSeed[] = [
  {
    template_key: "confirmation",
    email_subject: "You're in — First-time buyer webinar details inside",
    email_body: `Hi {{first_name}},

Thanks for reserving a seat for "{{title}}" with {{host}}.

Date: {{date}}
Time: {{time_only}}
Timezone: {{timezone}}

Why this matters: most first-time buyers leave money on the table because they don't know how down payment assistance, credits, and pre-approval timing actually work.

Add this to your calendar now — we'll send a few short reminders so you don't miss it.

Join link (save this): {{join_link}}

See you soon,
{{host}}`,
    sms_body: `{{first_name}}, you're registered for "{{title}}" with {{host}}. Calendar it now — link: {{join_link}}`,
    email_enabled: true,
    sms_enabled: true,
  },
  {
    template_key: "day_before",
    email_subject: "Tomorrow: your first-time homebuyer game plan",
    email_body: `Hi {{first_name}},

Quick heads-up — "{{title}}" is tomorrow with {{host}}.

We’ll cover down payment assistance basics, affordability, and what to prep for pre-approval so you can move forward with confidence.

Starts at {{time}} ({{user_local_time}} your time).

Join link: {{join_link}}

— {{host}}`,
    sms_body: `Reminder: "{{title}}" is in 24 hours. Starts at {{user_local_time}} your time. Join: {{join_link}}`,
    email_enabled: true,
    sms_enabled: true,
  },
  {
    template_key: "morning_of",
    email_subject: "Tonight: your homebuyer roadmap (and DPA options)",
    email_body: `Hi {{first_name}},

Quick reminder: {{host}} is hosting "{{title}}" today.

If you're exploring down payment assistance or want a clear plan before you tour homes, this session will save you weeks of guesswork.

Join link: {{join_link}}

— {{host}}`,
    sms_body: `Reminder: "{{title}}" is today with {{host}}. Join: {{join_link}}`,
    email_enabled: true,
    sms_enabled: true,
  },
  {
    template_key: "one_hour",
    email_subject: "Starting in 1 hour — grab your coffee",
    email_body: `Hi {{first_name}},

We're going live in about an hour for "{{title}}".

Bring your questions about credit, DPA programs, and what "approved" really means before you write an offer.

Join link: {{join_link}}

— {{host}}`,
    sms_body: `1 hour until "{{title}}" with {{host}}. Join: {{join_link}}`,
    email_enabled: true,
    sms_enabled: true,
  },
  {
    template_key: "ten_min",
    email_subject: "We're opening the room in 10 minutes",
    email_body: `Hi {{first_name}},

Doors open in ~10 minutes for "{{title}}".

If you're on your phone, you can still join — just tap the link:

{{join_link}}

— {{host}}`,
    sms_body: `10 min countdown — "{{title}}" with {{host}}. Join: {{join_link}}`,
    email_enabled: true,
    sms_enabled: true,
  },
  {
    template_key: "started",
    email_subject: "We're live — jump in now",
    email_body: `Hi {{first_name}},

We just started "{{title}}" — you're not late. Jump in here:

{{join_link}}

— {{host}}`,
    sms_body: `We're LIVE: "{{title}}" with {{host}}. Join now: {{join_link}}`,
    email_enabled: true,
    sms_enabled: true,
  },
  {
    template_key: "post_followup",
    email_subject: "Your next step (15-minute game plan)",
    email_body: `Hi {{first_name}},

Thanks for joining "{{title}}".

If you want a personalized plan for your price range, available programs, and a clear pre-approval checklist, book a quick 15-minute call with me:

{{book_call_link}}

No pressure — just clarity.

— {{host}}`,
    sms_body: `{{first_name}}, great having you at "{{title}}". Want a 15-min plan? Reply BOOK and {{host}} will send times.`,
    email_enabled: true,
    sms_enabled: true,
  },
  {
    template_key: "attended_cta",
    email_subject: "Ready for your personalized homebuying game plan?",
    email_body: `Hi {{first_name}},

Thanks again for attending "{{title}}".

The best next step is a quick one-on-one plan: we can map out your price range, down payment options, and what to prep before pre-approval.

Book a time here: {{book_call_link}}

— {{host}}`,
    sms_body: `{{first_name}}, thanks for joining. Want your personalized plan? Reply BOOK and {{host}} will send times.`,
    email_enabled: true,
    sms_enabled: true,
  },
  {
    template_key: "no_show_one_on_one",
    email_subject: "Missed the webinar? We can still map out your next step",
    email_body: `Hi {{first_name}},

Sorry we missed you at "{{title}}".

If homebuying is still on your mind, we can do a short one-on-one session instead and cover the parts that matter most for your situation.

Grab a time here: {{book_call_link}}

— {{host}}`,
    sms_body: `{{first_name}}, sorry we missed you. Want a quick 1:1 homebuyer plan instead? Reply YES and {{host}} will send times.`,
    email_enabled: true,
    sms_enabled: true,
  },
  {
    template_key: "booked_call_prep",
    email_subject: "Before our call: quick prep checklist",
    email_body: `Hi {{first_name}},

Looking forward to our call after "{{title}}".

To make it useful, bring rough monthly budget goals, income questions, and any questions about credit, DPA, or timing. No need to have everything perfect.

Talk soon,
{{host}}`,
    sms_body: `{{first_name}}, before our call: bring budget goals + questions about credit/DPA/timing. Talk soon — {{host}}`,
    email_enabled: true,
    sms_enabled: true,
  },
  {
    template_key: "closed_client_onboarding",
    email_subject: "Welcome — here’s what happens next",
    email_body: `Hi {{first_name}},

Excited to help you move forward.

Next, we’ll get your client onboarding started, confirm documents, and outline the milestones from here so nothing feels mysterious.

I’ll follow up with your next checklist shortly.

— {{host}}`,
    sms_body: `{{first_name}}, welcome aboard. Next up: onboarding checklist + document steps. I’ll send details shortly — {{host}}`,
    email_enabled: true,
    sms_enabled: true,
  },
];
