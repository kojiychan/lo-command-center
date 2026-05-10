-- Phase 1 Twilio SMS support with future-proof provider settings

create table if not exists public.user_sms_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  sms_provider text not null default 'platform_twilio'
    check (sms_provider in ('platform_twilio', 'dedicated_twilio', 'byo_twilio')),
  default_from_number text,
  messaging_service_sid text,
  twilio_subaccount_sid text,
  byo_account_sid text,
  byo_auth_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_sms_settings enable row level security;

create policy "user_sms_settings_owner_all"
  on public.user_sms_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists set_user_sms_settings_updated_at on public.user_sms_settings;
create trigger set_user_sms_settings_updated_at
  before update on public.user_sms_settings
  for each row execute function public.set_updated_at();

create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  webinar_id uuid references public.webinars (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  direction text not null check (direction in ('outbound', 'inbound')),
  to_number text,
  from_number text,
  body text not null default '',
  twilio_message_sid text,
  status text not null default 'queued',
  error_code text,
  error_message text,
  provider text not null default 'twilio',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists sms_messages_user_id_idx on public.sms_messages (user_id);
create index if not exists sms_messages_webinar_id_idx on public.sms_messages (webinar_id);
create index if not exists sms_messages_lead_id_idx on public.sms_messages (lead_id);
create index if not exists sms_messages_twilio_sid_idx on public.sms_messages (twilio_message_sid);
create index if not exists sms_messages_created_at_idx on public.sms_messages (created_at desc);

alter table public.sms_messages enable row level security;

create policy "sms_messages_owner_select"
  on public.sms_messages for select
  using (auth.uid() = user_id);

-- Inserts/updates are performed by trusted server actions and webhooks using the service role.
