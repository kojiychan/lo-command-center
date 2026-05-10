-- First-party webinar landing page view tracking

create table if not exists public.webinar_page_views (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid not null references public.webinars (id) on delete cascade,
  slug text not null,
  visitor_id text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists webinar_page_views_webinar_id_idx
on public.webinar_page_views (webinar_id);

create index if not exists webinar_page_views_created_at_idx
on public.webinar_page_views (created_at desc);

create index if not exists webinar_page_views_visitor_id_idx
on public.webinar_page_views (visitor_id)
where visitor_id is not null;

alter table public.webinar_page_views enable row level security;

drop policy if exists "webinar_page_views_owner_select" on public.webinar_page_views;

create policy "webinar_page_views_owner_select"
  on public.webinar_page_views for select
  using (
    exists (
      select 1 from public.webinars w
      where w.id = webinar_id and w.user_id = auth.uid()
    )
  );

-- Inserts happen through the app server service role so public landing pages do not need anon insert access.
