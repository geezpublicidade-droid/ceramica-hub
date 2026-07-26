-- Modulo de publicidade (Fase 1.5): anunciante externo, inventario de
-- posicoes, campanhas com aprovacao manual do admin, criativos
-- desktop/mobile. Sem compra automatica de midia -- admin cadastra e
-- aprova tudo na mao (ver src/lib/actions/admin-ads.ts). Metricas
-- (impressao/clique/CTR) usam a tabela metrics_events ja existente, com
-- event_type 'ad_impression'/'ad_click' e metadata {campaignId}.

create table if not exists ad_accounts (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Posicoes de anuncio disponiveis no site -- cadastradas pelo admin, cada
-- uma com um "key" estavel que o codigo do site usa pra saber onde
-- renderizar (ver src/components/ads/AdSlot.tsx).
create table if not exists ad_placements (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  width integer not null,
  height integer not null,
  created_at timestamptz not null default now()
);

create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  ad_account_id uuid not null references ad_accounts(id) on delete cascade,
  placement_id uuid not null references ad_placements(id) on delete restrict,
  title text not null,
  target_url text not null,
  status text not null default 'pending_review' check (status in (
    'draft', 'pending_review', 'approved', 'scheduled', 'active', 'paused', 'completed', 'rejected'
  )),
  starts_at date not null,
  ends_at date not null,
  budget_cents integer,
  negotiated_value_cents integer,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table if not exists ad_creatives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references ad_campaigns(id) on delete cascade,
  device text not null check (device in ('desktop', 'mobile')),
  image_url text not null,
  alt_text text not null default '',
  unique (campaign_id, device)
);

create index if not exists ad_campaigns_status_idx on ad_campaigns (status);
create index if not exists ad_campaigns_placement_idx on ad_campaigns (placement_id, status);

alter table ad_accounts enable row level security;
alter table ad_placements enable row level security;
alter table ad_campaigns enable row level security;
alter table ad_creatives enable row level security;

-- Posicao inicial: banner acima do diretorio de empresas no /preview
-- (mesma pagina que hoje reune toda a narrativa da home).
insert into ad_placements (key, name, description, width, height)
values ('diretorio_topo', 'Topo do diretório', 'Banner acima da lista de empresas na home', 728, 90)
on conflict (key) do nothing;
