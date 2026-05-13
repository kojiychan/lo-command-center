alter table public.webinar_pages
add column if not exists meta_pixel_id text;

alter table public.webinar_pages
drop constraint if exists webinar_pages_meta_pixel_id_chk;

alter table public.webinar_pages
add constraint webinar_pages_meta_pixel_id_chk
check (
  meta_pixel_id is null
  or meta_pixel_id ~ '^[0-9]{5,30}$'
);
