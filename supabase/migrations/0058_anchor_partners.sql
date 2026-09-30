-- Fase 3.6: Empresas Âncoras. Contrato anual + entregas por parceiro
-- institucional, e página própria com lojas (caso do Shopping São Caetano).
alter table institutional_partners add column if not exists slug text;
alter table institutional_partners add column if not exists description text;
alter table institutional_partners add column if not exists cover_url text;
alter table institutional_partners add column if not exists has_page boolean not null default false;
create unique index if not exists institutional_partners_slug_key on institutional_partners (slug) where slug is not null;

-- Contrato (normalmente anual) firmado com a âncora.
create table if not exists anchor_contracts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references institutional_partners(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  value_cents integer check (value_cents is null or value_cents >= 0),
  status text not null default 'ativo' check (status in ('ativo', 'encerrado', 'cancelado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);
create index if not exists anchor_contracts_partner_idx on anchor_contracts (partner_id, status);

-- Entregas combinadas no contrato (post, destaque na home, evento...).
create table if not exists anchor_deliverables (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references anchor_contracts(id) on delete cascade,
  title text not null,
  due_on date,
  status text not null default 'pendente' check (status in ('pendente', 'realizada', 'cancelada')),
  delivered_on date,
  evidence_url text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists anchor_deliverables_contract_idx on anchor_deliverables (contract_id, status);

-- Lojas listadas na página da âncora. Destaque é sempre pago: só vale com
-- highlight_paid_until >= hoje e valor registrado (ver anchors.ts).
create table if not exists anchor_stores (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references institutional_partners(id) on delete cascade,
  name text not null,
  segment text,
  floor text,
  description text,
  logo_url text,
  instagram text,
  website text,
  active boolean not null default true,
  highlight_paid_until date,
  highlight_value_cents integer check (highlight_value_cents is null or highlight_value_cents > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (highlight_paid_until is null or highlight_value_cents is not null)
);
create index if not exists anchor_stores_partner_idx on anchor_stores (partner_id, active);

alter table anchor_contracts enable row level security;
alter table anchor_deliverables enable row level security;
alter table anchor_stores enable row level security;

drop trigger if exists anchor_contracts_set_updated_at on anchor_contracts;
create trigger anchor_contracts_set_updated_at
  before update on anchor_contracts
  for each row execute function set_updated_at();

-- Shopping São Caetano entra como rascunho: só vai ao ar depois que o admin
-- confirmar a autorização real do vínculo (regra de institutional_partners).
insert into institutional_partners (name, partnership_type, tier, status, slug, has_page, authorization_note, description)
select 'Shopping São Caetano', 'Âncora — shopping', 'ancora_fundadora', 'rascunho', 'shopping-sao-caetano', true,
       'Aguardando autorização formal do vínculo.',
       'Lojas e serviços do Shopping São Caetano, parceiro âncora do Cerâmica Hub.'
where not exists (select 1 from institutional_partners where slug = 'shopping-sao-caetano');
