-- Cobranca manual (Fase 1): a empresa escolhe um plano pago, o sistema gera
-- um link de pagamento (Mercado Pago Checkout Pro) e o admin confirma
-- manualmente quando o pagamento cai -- sem webhook automatico ainda
-- (isso fica pra Fase 1.5, quando a automacao completa for implementada).
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  plan text not null check (plan in ('profissional', 'destaque', 'experiencia')),
  status text not null default 'pending' check (status in ('pending', 'active', 'past_due', 'canceled', 'expired')),
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  amount_cents integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'canceled')),
  mercadopago_link text,
  mercadopago_id text,
  confirmed_by_admin_id uuid,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_business_idx on subscriptions (business_id);
create index if not exists invoices_business_idx on invoices (business_id);
create index if not exists invoices_status_idx on invoices (status);

alter table subscriptions enable row level security;
alter table invoices enable row level security;
