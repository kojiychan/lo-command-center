alter table public.webinars
add column if not exists bonzo_pipeline_id text,
add column if not exists bonzo_pipeline_name text,
add column if not exists bonzo_stage_id text,
add column if not exists bonzo_stage_name text;

create index if not exists webinars_bonzo_stage_id_idx
  on public.webinars (bonzo_stage_id)
  where bonzo_stage_id is not null;
