-- Presenter credibility onboarding
-- Stores reusable presenter content for public webinar landing pages.

alter table public.profiles
add column if not exists short_bio text,
add column if not exists years_experience integer,
add column if not exists families_helped integer,
add column if not exists total_loan_volume text,
add column if not exists specialty_focus text,
add column if not exists license_states text,
add column if not exists profile_image_url text;

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reviewer_name text not null,
  reviewer_context text,
  review_text text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  display_order integer not null check (display_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists testimonials_user_display_order_idx
  on public.testimonials (user_id, display_order);

create index if not exists testimonials_user_id_idx
  on public.testimonials (user_id);

alter table public.testimonials enable row level security;

drop policy if exists "testimonials_owner_select" on public.testimonials;
create policy "testimonials_owner_select"
  on public.testimonials for select
  using (auth.uid() = user_id);

drop policy if exists "testimonials_owner_insert" on public.testimonials;
create policy "testimonials_owner_insert"
  on public.testimonials for insert
  with check (auth.uid() = user_id);

drop policy if exists "testimonials_owner_update" on public.testimonials;
create policy "testimonials_owner_update"
  on public.testimonials for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "testimonials_owner_delete" on public.testimonials;
create policy "testimonials_owner_delete"
  on public.testimonials for delete
  using (auth.uid() = user_id);

drop trigger if exists set_testimonials_updated_at on public.testimonials;
create trigger set_testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.set_updated_at();
