-- Propostas comerciais (Fase 2): criadas a partir de um lead ou empresa, com
-- itens do catálogo (products), desconto, validade e histórico.
-- Os itens guardam um "retrato" (nome, preço) do produto no momento da
-- proposta, pra que mudar o catálogo depois não reescreva propostas antigas.
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity,
  kind text not null default 'nova' check (kind in ('nova', 'renovacao')),

  lead_id uuid references leads(id) on delete set null,
  business_id uuid references businesses(id) on delete set null,
  client_name text not null,
  client_email text,

  status text not null default 'rascunho' check (status in (
    'rascunho', 'enviada', 'visualizada', 'negociacao', 'aceita', 'recusada', 'vencida'
  )),
  valid_until date,
  discount_percent numeric(5, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  terms text,
  notes text,

  -- Link público (/proposta/<token>) usado pra visualizar/imprimir em PDF e
  -- pra registrar a visualização do cliente.
  public_token text not null unique default encode(gen_random_bytes(16), 'hex'),

  owner_admin_id uuid references admins(id) on delete set null,
  sent_at timestamptz,
  viewed_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposals_status_idx on proposals (status);
create index if not exists proposals_lead_idx on proposals (lead_id);
create index if not exists proposals_business_idx on proposals (business_id);

create table if not exists proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null,
  period text not null default 'mensal' check (period in ('mensal', 'anual', 'unico', 'personalizado')),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null default 1 check (quantity > 0),
  sort_order integer not null default 0
);

create index if not exists proposal_items_proposal_idx on proposal_items (proposal_id);

-- Histórico de alterações: criação, edição, mudança de status, etc.
create table if not exists proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  admin_id uuid references admins(id) on delete set null,
  event_type text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists proposal_events_proposal_idx on proposal_events (proposal_id, created_at);

alter table proposals enable row level security;
alter table proposal_items enable row level security;
alter table proposal_events enable row level security;

drop trigger if exists proposals_set_updated_at on proposals;
create trigger proposals_set_updated_at
  before update on proposals
  for each row execute function set_updated_at();
