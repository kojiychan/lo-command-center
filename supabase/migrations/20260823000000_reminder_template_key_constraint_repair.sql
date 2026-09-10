-- Keep the database constraint aligned with src/domain/reminders.ts.
-- This is safe to re-run on projects that already accepted the newer follow-up keys.
alter table public.reminder_templates
drop constraint if exists reminder_templates_key_chk;

alter table public.reminder_templates
add constraint reminder_templates_key_chk check (
  template_key in (
    'confirmation',
    'day_before',
    'morning_of',
    'one_hour',
    'ten_min',
    'started',
    'post_followup',
    'attended_cta',
    'no_show_one_on_one',
    'booked_call_prep',
    'closed_client_onboarding'
  )
);
