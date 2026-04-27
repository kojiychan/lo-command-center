# Roadmap

This roadmap separates what is implemented from what is planned or recommended.

## Implemented MVP Capabilities

- Supabase email/password auth.
- Signup onboarding for presenter bio, optional credibility highlights, profile image URL, and three testimonials.
- Webinar creation with public landing page fields.
- Public webinar landing pages at `/w/[slug]`.
- Public registration with duplicate-email protection per webinar.
- Reminder template defaults and per-webinar template copies.
- Scheduled reminder event rows for registrants.
- Dashboard summary metrics and recent leads.
- Webinar workspace with overview, lead board, reminders, and follow-up tabs.
- Cross-webinar pipeline board at `/pipeline`.
- Dragging leads between pipeline columns.
- Mocked post-webinar automation sequences.
- Presenter bio/highlights/testimonials on landing pages.

## Near-Term Product Improvements

- Replace mocked reminder/event behavior with real SendGrid and Twilio sending.
- Add a proper reminder worker/cron.
- Add profile/settings editing for presenter bio, headshot URL, and testimonials after signup.
- Add Supabase Storage uploads for headshots and webinar hero images.
- Add preview/test-send buttons for reminder templates.
- Add clearer success/error feedback for automation buttons.
- Improve mobile behavior for wide pipeline boards.

## Important Data Model Improvement

Current lead `status` is overloaded:

- attendance state: `registered`, `attended`, `no_show`
- sales progression: `booked_call`, `closed`

This causes reporting issues. For example, moving an attended lead to `booked_call` removes that lead from attended counts.

Recommended future split:

- `attendance_status`: `registered`, `attended`, `no_show`
- `pipeline_stage`: `registered`, `follow_up`, `booked_call`, `closed`, etc.

This should be handled as a deliberate migration with UI/reporting updates.

## Larger Future Bets

- Multi-step automation builder for webinar and post-webinar sequences.
- Real CRM integrations.
- Calendar booking integration.
- Per-webinar audience/location settings.
- Analytics by traffic source and webinar cohort.
- Lead scoring based on attendance, clicks, replies, and booked calls.
- Generated Supabase TypeScript types and stronger data-access tests.

## Not Currently Implemented

- Real email/SMS delivery.
- File uploads.
- Payment or subscription billing.
- Multi-user teams.
- Rich automation branching.
- Separate attendance and sales pipeline fields.
