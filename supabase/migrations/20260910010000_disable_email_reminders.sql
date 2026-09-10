-- Bonzo CRM now handles email nurturing. Keep SMS reminders available, but
-- disable app-managed email reminders for existing and future templates.
alter table public.reminder_templates
alter column email_enabled set default false;

update public.reminder_templates
set email_enabled = false,
    updated_at = now()
where email_enabled = true;

update public.reminder_events
set status = 'skipped',
    provider_message = coalesce(provider_message, 'Skipped because app-managed email reminders are disabled.')
where channel = 'email'
  and status = 'pending';
