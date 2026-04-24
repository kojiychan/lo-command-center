-- Timezone + reminder enhancements
-- 1) Store registrant timezone for personalization
-- 2) Add `day_before` template key support

alter table public.leads
add column if not exists user_timezone text;

-- Expand reminder template key check constraint to include day_before
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
    'post_followup'
  )
);

