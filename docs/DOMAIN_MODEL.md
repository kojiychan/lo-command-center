# Domain Model

This document describes the current app model as implemented in code and migrations.

## Webinar

Table: `webinars`

A webinar belongs to one authenticated user/profile.

Important fields:

- `id`
- `user_id`
- `title`
- `description`
- `starts_at`
- `timezone`
- `host_name`
- `cta_text`
- `join_url`

Used by:

- `src/server/queries/webinars.ts`
- `src/server/services/webinars.ts`
- `src/app/w/[slug]/page.tsx`

## Webinar Page

Table: `webinar_pages`

One public landing page per webinar.

Important fields:

- `webinar_id`
- `slug`
- `headline`
- `subheadline`
- `button_text`
- `hero_image_url`

Public route: `/w/[slug]`.

## Lead

Table: `leads`

A lead is a registrant for a webinar.

Important fields:

- `webinar_id`
- `first_name`
- `last_name`
- `email`
- `phone`
- `user_timezone`
- `status`
- `follow_up_status`
- `registered_at`

Public registration is handled in `src/app/actions/register.ts`.

## Lead Status

Source of truth: `src/domain/leads.ts`.

Current values:

- `registered`
- `attended`
- `no_show`
- `booked_call`
- `closed`

Important limitation: `status` currently mixes attendance and sales progression. For example, moving a lead from `attended` to `booked_call` removes it from attended counts. A future schema should likely split this into `attendance_status` and `pipeline_stage`.

## Follow-Up Status

Source of truth: `src/domain/leads.ts`.

Current values:

- `none`
- `pending`
- `sent`
- `converted`

This tracks follow-up state separately from lead status, but it is still broad and not a full sequence/audit model.

## Reminder Template

Table: `reminder_templates`

Templates may be user defaults (`webinar_id` is null) or per-webinar copies.

Source of truth for keys and labels: `src/domain/reminders.ts`.

Current keys:

- `confirmation`
- `day_before`
- `morning_of`
- `one_hour`
- `ten_min`
- `started`
- `post_followup`
- `attended_cta`
- `no_show_one_on_one`
- `booked_call_prep`
- `closed_client_onboarding`

Default content is seeded from `src/lib/reminder-defaults.ts`.

## Reminder Event

Table: `reminder_events`

Represents one channel send attempt for one lead.

Important fields:

- `lead_id`
- `webinar_id`
- `template_key`
- `channel`
- `scheduled_for`
- `status`
- `provider_message`

Current behavior is mocked. The app creates or updates rows, but no SendGrid/Twilio call happens.

## Presenter Profile

Table: `profiles`

Profiles are created for auth users and now include landing-page credibility fields:

- `full_name`
- `company_name`
- `short_bio`
- `years_experience`
- `families_helped`
- `total_loan_volume`
- `specialty_focus`
- `license_states`
- `profile_image_url`

`license_states` is presenter credibility metadata only. It is not the webinar location/state.

## Testimonials

Table: `testimonials`

Testimonials belong to a user/profile and are reused on that user's webinar landing pages.

Fields:

- `user_id`
- `reviewer_name`
- `reviewer_context`
- `review_text`
- `rating`
- `display_order`

Signup currently collects exactly three testimonials and stores them with display orders 1, 2, and 3.
