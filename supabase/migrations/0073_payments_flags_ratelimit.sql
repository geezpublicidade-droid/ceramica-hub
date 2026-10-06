-- Plano estrategico: eventos de pagamento idempotentes (webhook), feature flags e rate limit.
-- Tudo aditivo e idempotente. RLS ligado sem policy: so o servidor (service_role) acessa.

-- Cada notificacao do provedor de pagamento vira uma linha; (provider, event_key) unico
-- garante que um webhook repetido seja processado uma unica vez.
create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercadopago',
  event_key text not null,
  event_type text,
  invoice_id uuid references invoices(id) on delete set null,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_key)
);
create index if not exists payment_events_invoice_idx on payment_events (invoice_id);
create index if not exists payment_events_status_idx on payment_events (status, created_at desc);
alter table payment_events enable row level security;

-- Recursos nao essenciais ficam atras de flag, ligaveis sem deploy.
create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);
alter table feature_flags enable row level security;

insert into feature_flags (key, enabled, description) values
  ('billing_auto_activation', true, 'Webhook do Mercado Pago ativa plano sozinho; desligado = so confirmacao manual no admin'),
  ('public_rate_limit', true, 'Limite de requisicoes em busca, cadastro e endpoints publicos')
on conflict (key) do nothing;

-- Rate limit por chave em janela fixa. Retorna true se a requisicao esta dentro do limite.
create table if not exists rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);
alter table rate_limits enable row level security;

create or replace function rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns boolean
language plpgsql
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into rate_limits (key, window_start, hits) values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = rate_limits.hits + 1
  returning hits into v_hits;

  -- limpeza oportunista de janelas antigas (1 em ~50 chamadas)
  if random() < 0.02 then
    delete from rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_max;
end;
$$;

revoke all on function rate_limit_hit(text, integer, integer) from public, anon, authenticated;
