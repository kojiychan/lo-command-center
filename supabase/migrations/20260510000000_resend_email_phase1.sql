-- Phase 1 email infrastructure with future Gmail/Outlook provider slots.

create table if not exists public.user_email_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_provider text not null default 'platform_resend'
    check (email_provider in ('platform_resend', 'connected_gmail', 'connected_outlook')),
  from_name text,
  from_email text,
  reply_to_email text,
  gmail_connected boolean not null default false,
  outlook_connected boolean not null default false,
  gmail_account_email text,
  outlook_account_email text,
  encrypted_gmail_refresh_token text,
  encrypted_outlook_refresh_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_email_settings enable row level security;

create policy "user_email_settings_owner_all"
  on public.user_email_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_user_email_settings_updated_at on public.user_email_settings;
create trigger set_user_email_settings_updated_at
  before update on public.user_email_settings
  for each row execute function public.set_updated_at();

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  webinar_id uuid references public.webinars (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  direction text not null default 'outbound' check (direction in ('outbound')),
  provider text not null default 'resend' check (provider in ('resend', 'gmail', 'outlook')),
  from_email text not null,
  from_name text,
  reply_to_email text,
  to_email text not null,
  subject text not null,
  html_body text not null default '',
  text_body text not null default '',
  provider_message_id text,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')),
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists email_messages_user_id_idx on public.email_messages (user_id);
create index if not exists email_messages_webinar_id_idx on public.email_messages (webinar_id);
create index if not exists email_messages_lead_id_idx on public.email_messages (lead_id);
create index if not exists email_messages_provider_message_id_idx on public.email_messages (provider_message_id);
create index if not exists email_messages_created_at_idx on public.email_messages (created_at desc);

alter table public.email_messages enable row level security;

create policy "email_messages_owner_select"
  on public.email_messages for select
  using (auth.uid() = user_id);

-- Inserts/updates are performed by trusted server actions, cron routes, and future provider webhooks.
