# Supabase

Supabase provides auth, Postgres storage, RLS, and trusted server-side access.

## Migrations

Migration files:

- `supabase/migrations/20260422000000_initial.sql`
- `supabase/migrations/20260423000000_timezone_reminders.sql`
- `supabase/migrations/20260425000000_presenter_credibility.sql`
- `supabase/migrations/20260425010000_post_webinar_sequences.sql`

## Tables

### `profiles`

One row per auth user.

Stores:

- account/profile basics
- presenter bio and credibility highlights
- optional profile image URL

### `webinars`

Owned by `profiles.id`.

Stores webinar details, schedule, timezone, host name, CTA text, and private join URL.

### `webinar_pages`

One public landing page per webinar.

Stores slug, headline, subheadline, button text, and optional hero image URL.

### `leads`

Stores webinar registrants.

Important constraints:

- Unique email per webinar via lowercased email index.
- `status` check constraint.
- `follow_up_status` check constraint.

### `lead_notes`

Stores notes attached to leads.

### `reminder_templates`

Stores user default templates and per-webinar templates.

Important indexes:

- User default unique key where `webinar_id is null`.
- Per-webinar unique key where `webinar_id is not null`.

### `reminder_events`

Stores scheduled or mocked send attempts by lead, webinar, template key, and channel.

### `testimonials`

Stores presenter testimonials reused across public webinar landing pages.

Unique by `(user_id, display_order)`.

## Auth and Ownership

Authenticated app routes are protected in `src/lib/supabase/middleware.ts`.

Ownership model:

- Users own webinars through `webinars.user_id`.
- Leads are authorized through their webinar.
- Reminder templates are scoped by `user_id` and optionally `webinar_id`.
- Testimonials are scoped by `user_id`.

Server helpers:

- `src/server/auth/current-user.ts`
- `src/server/auth/ownership.ts`

## Public Landing Page Data Access

Public landing pages use `src/server/public-webinar.ts`.

This uses the service-role client because the public page needs to fetch webinar/page/profile/testimonial data without exposing broader anonymous table reads.

The public response intentionally does not expose `join_url`. The join URL is returned only after successful registration in `registerForWebinar`.

## Service-Role Usage

`src/lib/supabase/admin.ts` creates a service-role Supabase client.

Used by:

- public registration in `src/app/actions/register.ts`
- public landing page reads in `src/server/public-webinar.ts`
- signup profile/testimonial writes after Supabase Auth account creation

The service role must stay server-only.

## Reminder Queue Behavior

Current reminder behavior is mocked:

- Registration creates `pending` reminder events based on `src/lib/reminder-schedule.ts`.
- Post-webinar automation actions insert `sent` reminder events immediately.
- Some older mock follow-up behavior updates existing reminder rows.
- No worker/cron sends real email/SMS today.

Recommended future implementation:

- Add a worker or scheduled job that reads `reminder_events` where `status = pending`.
- Render templates with lead/webinar data.
- Send through SendGrid/Twilio.
- Store provider IDs and errors in `provider_message` or a richer delivery table.
