-- Fase 4.2: analytics do portal. Reaproveita metrics_events (novos tipos:
-- portal_page_viewed com metadata {path, source}, e search_no_results com {term}).
-- A agregação roda no banco: select de linhas cruas bate no limite de 1000 do PostgREST.
create index if not exists metrics_events_type_created_idx on metrics_events (event_type, created_at desc);

drop function if exists portal_analytics(timestamptz, timestamptz);

-- Janela relativa ao now() do banco: não depende do relógio de quem chama.
create or replace function portal_analytics(p_days integer)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ev as (
    select event_type, business_id, metadata, created_at
    from metrics_events
    where created_at >= now() - make_interval(days => p_days)
  ),
  views as (select * from ev where event_type = 'portal_page_viewed'),
  biz as (
    select
      business_id,
      count(*) filter (where event_type = 'commercial_page_viewed') as views,
      count(*) filter (where event_type in ('whatsapp_clicked', 'phone_clicked', 'website_clicked', 'directions_clicked')) as clicks
    from ev
    where business_id is not null
    group by business_id
  )
  select jsonb_build_object(
    'visits', (select count(*) from views),
    'top_pages', coalesce((
      select jsonb_agg(r) from (
        select metadata->>'path' as label, count(*) as total from views
        where metadata->>'path' is not null group by 1 order by 2 desc limit 10) r), '[]'),
    'top_sources', coalesce((
      select jsonb_agg(r) from (
        select coalesce(metadata->>'source', 'direto') as label, count(*) as total from views
        group by 1 order by 2 desc limit 8) r), '[]'),
    'top_categories', coalesce((
      select jsonb_agg(r) from (
        select split_part(metadata->>'path', '/', 3) as label, count(*) as total from views
        where metadata->>'path' like '/categoria/%' and split_part(metadata->>'path', '/', 3) <> ''
        group by 1 order by 2 desc limit 10) r), '[]'),
    'top_searches', coalesce((
      select jsonb_agg(r) from (
        select lower(metadata->>'term') as label, count(*) as total from ev
        where event_type = 'search_performed' and metadata->>'term' is not null
        group by 1 order by 2 desc limit 10) r), '[]'),
    'no_result_searches', coalesce((
      select jsonb_agg(r) from (
        select lower(metadata->>'term') as label, count(*) as total from ev
        where event_type = 'search_no_results' and metadata->>'term' is not null
        group by 1 order by 2 desc limit 10) r), '[]'),
    'clicks', jsonb_build_object(
      'whatsapp', (select count(*) from ev where event_type = 'whatsapp_clicked'),
      'phone', (select count(*) from ev where event_type = 'phone_clicked'),
      'website', (select count(*) from ev where event_type = 'website_clicked'),
      'directions', (select count(*) from ev where event_type = 'directions_clicked')),
    'top_businesses', coalesce((
      select jsonb_agg(r) from (
        select b.name as label, biz.views, biz.clicks
        from biz join businesses b on b.id = biz.business_id
        where biz.views > 0 order by biz.views desc limit 10) r), '[]'),
    'daily_visits', coalesce((
      select jsonb_agg(r order by r.day) from (
        select to_char(created_at at time zone 'America/Sao_Paulo', 'YYYY-MM-DD') as day, count(*) as total
        from views group by 1) r), '[]')
  );
$$;

revoke all on function portal_analytics(integer) from public, anon, authenticated;
grant execute on function portal_analytics(integer) to service_role;

notify pgrst, 'reload schema';
