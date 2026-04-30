-- Webinar template support

alter table public.webinars
add column if not exists template_type text not null default 'fthb'
  check (template_type in ('fthb', 'investor', 'self_employed'));

alter table public.webinar_pages
add column if not exists hero_bullets jsonb not null default '[]'::jsonb,
add column if not exists agenda_items jsonb not null default '[]'::jsonb;
