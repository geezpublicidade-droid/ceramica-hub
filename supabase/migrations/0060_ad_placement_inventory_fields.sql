-- Fase 3.8: inventário de espaços com mais detalhe comercial -- formato,
-- dimensão mobile, valor de produção do criativo e especificações do criativo.
alter table ad_placements
  add column if not exists format text check (format is null or format in (
    'banner', 'carrossel', 'logo', 'video', 'texto', 'pagina_dedicada', 'outro'
  )),
  add column if not exists mobile_width integer check (mobile_width is null or mobile_width > 0),
  add column if not exists mobile_height integer check (mobile_height is null or mobile_height > 0),
  add column if not exists production_price_cents integer check (production_price_cents is null or production_price_cents >= 0),
  add column if not exists creative_specs text,
  add column if not exists creative_deadline_days integer check (creative_deadline_days is null or creative_deadline_days >= 0);
