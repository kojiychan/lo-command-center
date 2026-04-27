-- Post-webinar follow-up automation template keys

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'reminder_templates_key_chk'
      and conrelid = 'public.reminder_templates'::regclass
  ) then
    alter table public.reminder_templates
    drop constraint reminder_templates_key_chk;
  end if;
end $$;

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
