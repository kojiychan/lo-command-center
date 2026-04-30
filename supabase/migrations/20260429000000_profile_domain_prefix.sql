-- Account-level webinar domain prefix

alter table public.profiles
add column if not exists domain_prefix text;

alter table public.profiles
drop constraint if exists profiles_domain_prefix_chk;

alter table public.profiles
add constraint profiles_domain_prefix_chk
check (
  domain_prefix is null
  or domain_prefix ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$'
);

create unique index if not exists profiles_domain_prefix_lower_idx
on public.profiles (lower(domain_prefix))
where domain_prefix is not null;
