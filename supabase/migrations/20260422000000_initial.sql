-- LO Command Center — initial schema
-- Run in Supabase SQL Editor or via `supabase db push` after linking the project.

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  company_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Webinars (owned by LO)
-- -----------------------------------------------------------------------------
create table public.webinars (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  timezone text not null default 'America/Los_Angeles',
  host_name text not null,
  cta_text text,
  join_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index webinars_user_id_idx on public.webinars (user_id);
create index webinars_starts_at_idx on public.webinars (starts_at);

alter table public.webinars enable row level security;

create policy "webinars_owner_all"
  on public.webinars for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Webinar landing pages (public slug + branding)
-- -----------------------------------------------------------------------------
create table public.webinar_pages (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null unique references public.webinars (id) on delete cascade,
  slug text not null unique,
  headline text not null,
  subheadline text,
  button_text text not null default 'Save my seat',
  hero_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index webinar_pages_webinar_id_idx on public.webinar_pages (webinar_id);

alter table public.webinar_pages enable row level security;

create policy "webinar_pages_owner_all"
  on public.webinar_pages for all
  using (
    exists (
      select 1 from public.webinars w
      where w.id = webinar_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.webinars w
      where w.id = webinar_id and w.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Leads (registrants)
-- status: registered | attended | no_show | booked_call | closed
-- follow_up_status: none | pending | sent | converted
-- -----------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  status text not null default 'registered'
    check (status in ('registered', 'attended', 'no_show', 'booked_call', 'closed')),
  follow_up_status text not null default 'none'
    check (follow_up_status in ('none', 'pending', 'sent', 'converted')),
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_webinar_id_idx on public.leads (webinar_id);
create index leads_registered_at_idx on public.leads (registered_at desc);

create unique index leads_webinar_email_lower_idx
  on public.leads (webinar_id, lower(email));

alter table public.leads enable row level security;

create policy "leads_owner_select"
  on public.leads for select
  using (
    exists (
      select 1 from public.webinars w
      where w.id = webinar_id and w.user_id = auth.uid()
    )
  );

create policy "leads_owner_update"
  on public.leads for update
  using (
    exists (
      select 1 from public.webinars w
      where w.id = webinar_id and w.user_id = auth.uid()
    )
  );

create policy "leads_owner_delete"
  on public.leads for delete
  using (
    exists (
      select 1 from public.webinars w
      where w.id = webinar_id and w.user_id = auth.uid()
    )
  );

-- Inserts happen via service role in server action (public registration).
-- If you prefer strict RLS-only flows later, add a SECURITY DEFINER RPC instead.

-- -----------------------------------------------------------------------------
-- Lead notes
-- -----------------------------------------------------------------------------
create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index lead_notes_lead_id_idx on public.lead_notes (lead_id);

alter table public.lead_notes enable row level security;

create policy "lead_notes_owner_all"
  on public.lead_notes for all
  using (
    exists (
      select 1
      from public.leads l
      join public.webinars w on w.id = l.webinar_id
      where l.id = lead_id and w.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.leads l
      join public.webinars w on w.id = l.webinar_id
      where l.id = lead_id and w.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- Reminder templates (user defaults webinar_id null, or per-webinar overrides)
-- template_key:
--   confirmation | morning_of | one_hour | ten_min | started | post_followup
-- -----------------------------------------------------------------------------
create table public.reminder_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  webinar_id uuid references public.webinars (id) on delete cascade,
  template_key text not null,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default true,
  email_subject text,
  email_body text not null default '',
  sms_body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminder_templates_key_chk check (
    template_key in (
      'confirmation',
      'morning_of',
      'one_hour',
      'ten_min',
      'started',
      'post_followup'
    )
  )
);

-- NOTE: Postgres UNIQUE treats NULLs as distinct; use partial indexes for defaults vs per-webinar.
create unique index reminder_templates_user_default_key_idx
  on public.reminder_templates (user_id, template_key)
  where webinar_id is null;

create unique index reminder_templates_webinar_key_idx
  on public.reminder_templates (webinar_id, template_key)
  where webinar_id is not null;

create index reminder_templates_user_idx on public.reminder_templates (user_id);
create index reminder_templates_webinar_idx on public.reminder_templates (webinar_id);

alter table public.reminder_templates enable row level security;

create policy "reminder_templates_owner_all"
  on public.reminder_templates for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Reminder events (scheduled / sent log — sending mocked in MVP UI)
-- -----------------------------------------------------------------------------
create table public.reminder_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  webinar_id uuid not null references public.webinars (id) on delete cascade,
  template_key text not null,
  channel text not null check (channel in ('email', 'sms')),
  scheduled_for timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'queued', 'sent', 'failed', 'skipped')),
  provider_message text,
  created_at timestamptz not null default now()
);

create index reminder_events_lead_idx on public.reminder_events (lead_id);
create index reminder_events_webinar_idx on public.reminder_events (webinar_id);
create index reminder_events_scheduled_idx on public.reminder_events (scheduled_for);

alter table public.reminder_events enable row level security;

create policy "reminder_events_owner_select"
  on public.reminder_events for select
  using (
    exists (
      select 1 from public.webinars w
      where w.id = webinar_id and w.user_id = auth.uid()
    )
  );

create policy "reminder_events_owner_update"
  on public.reminder_events for update
  using (
    exists (
      select 1 from public.webinars w
      where w.id = webinar_id and w.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- updated_at helper
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_webinars_updated_at
  before update on public.webinars
  for each row execute function public.set_updated_at();

create trigger set_webinar_pages_updated_at
  before update on public.webinar_pages
  for each row execute function public.set_updated_at();

create trigger set_leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create trigger set_reminder_templates_updated_at
  before update on public.reminder_templates
  for each row execute function public.set_updated_at();
