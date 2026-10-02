-- Fase 4.1: metas mensais do dashboard executivo. Uma linha por (mês, métrica);
-- o painel compara o realizado com o alvo e com o mês anterior.
-- Métricas aceitas: revenue_cents, new_businesses, new_contracts,
-- renewal_rate (percentual 0-100), ad_occupancy (percentual 0-100).
create table if not exists business_goals (
  id uuid primary key default gen_random_uuid(),
  month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  metric text not null check (metric in ('revenue_cents', 'new_businesses', 'new_contracts', 'renewal_rate', 'ad_occupancy')),
  target numeric not null check (target >= 0),
  updated_by_admin_id uuid references admins(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (month, metric)
);

alter table business_goals enable row level security;
