-- Agregacao diaria de metrics_events (log bruto, sem essa tabela cada
-- consulta de periodo precisaria varrer todas as linhas). Populada por
-- job diario (ver src/app/api/cron/aggregate-analytics/route.ts +
-- vercel.json), idempotente via upsert na chave unica.
-- business_id NOT NULL de proposito: eventos sem empresa associada (ex:
-- search_performed solto) ficam de fora dessa agregacao por ora -- Postgres
-- nao trata NULL como valor comparavel em unique constraint, o que quebraria
-- o upsert idempotente pra eventos "soltos".
create table if not exists analytics_daily (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  event_type text not null,
  day date not null,
  count integer not null default 0,
  unique (business_id, event_type, day)
);

create index if not exists analytics_daily_business_day_idx on analytics_daily (business_id, day);

alter table analytics_daily enable row level security;
