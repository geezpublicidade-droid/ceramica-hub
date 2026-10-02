-- Fases 4.5/4.6: dados agregados para pontuação de clientes e inteligência de marketing.
-- Ambas as funções usam o now() do banco e ficam restritas ao service_role.

-- Visitas à página comercial e cliques de contato por empresa: janela atual (últimos p_days)
-- e janela anterior (os p_days antes dela), pra comparar tendência.
create or replace function business_engagement(p_days integer)
returns table (business_id uuid, views integer, clicks integer, prev_views integer, prev_clicks integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.business_id,
    (count(*) filter (where e.event_type = 'commercial_page_viewed' and e.created_at >= now() - make_interval(days => p_days)))::integer,
    (count(*) filter (where e.event_type in ('whatsapp_clicked', 'phone_clicked', 'website_clicked', 'directions_clicked') and e.created_at >= now() - make_interval(days => p_days)))::integer,
    (count(*) filter (where e.event_type = 'commercial_page_viewed' and e.created_at < now() - make_interval(days => p_days)))::integer,
    (count(*) filter (where e.event_type in ('whatsapp_clicked', 'phone_clicked', 'website_clicked', 'directions_clicked') and e.created_at < now() - make_interval(days => p_days)))::integer
  from metrics_events e
  where e.business_id is not null
    and e.created_at >= now() - make_interval(days => p_days * 2)
  group by e.business_id;
$$;

-- Visitas ao portal por dia da semana (0 = domingo) e por hora, no horário de Brasília.
create or replace function portal_visit_rhythm(p_days integer)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with v as (
    select created_at at time zone 'America/Sao_Paulo' as t
    from metrics_events
    where event_type = 'portal_page_viewed'
      and created_at >= now() - make_interval(days => p_days)
  )
  select jsonb_build_object(
    'by_weekday', coalesce((select jsonb_agg(r order by r.k) from (
      select extract(dow from t)::integer as k, count(*) as total from v group by 1) r), '[]'),
    'by_hour', coalesce((select jsonb_agg(r order by r.k) from (
      select extract(hour from t)::integer as k, count(*) as total from v group by 1) r), '[]')
  );
$$;

revoke all on function business_engagement(integer) from public, anon, authenticated;
revoke all on function portal_visit_rhythm(integer) from public, anon, authenticated;
grant execute on function business_engagement(integer) to service_role;
grant execute on function portal_visit_rhythm(integer) to service_role;

notify pgrst, 'reload schema';
