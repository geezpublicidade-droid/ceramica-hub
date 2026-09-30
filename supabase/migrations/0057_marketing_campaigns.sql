-- Fase 3.4: gestão de campanhas de marketing (Central de Marketing).
-- Uma campanha agrupa objetivo, público, período, orçamento, canais, peças
-- criativas e resultados. Calendário, e-mail, anúncios e leads se ligam a ela
-- por marketing_campaign_id, e os resultados são calculados a partir desses
-- vínculos (mais os números manuais de canais sem rastreio, como mídia externa).
create table if not exists marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  objective text,
  business_id uuid references businesses(id) on delete set null,
  audience_id uuid references marketing_audiences(id) on delete set null,
  starts_on date not null,
  ends_on date not null,
  budget_cents integer check (budget_cents is null or budget_cents >= 0),
  channels text[] not null default '{}',
  status text not null default 'rascunho' check (status in (
    'rascunho', 'aguardando_aprovacao', 'aprovada', 'ativa', 'encerrada', 'cancelada'
  )),
  owner_admin_id uuid references admins(id) on delete set null,
  approved_by uuid references admins(id) on delete set null,
  approved_at timestamptz,
  manual_views integer not null default 0 check (manual_views >= 0),
  manual_clicks integer not null default 0 check (manual_clicks >= 0),
  results_notes text,
  created_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create index if not exists marketing_campaigns_status_idx on marketing_campaigns (status);
create index if not exists marketing_campaigns_period_idx on marketing_campaigns (starts_on, ends_on);
create index if not exists marketing_campaigns_business_idx on marketing_campaigns (business_id);

-- Peças criativas da campanha (arte, texto, vídeo...). O arquivo em si fica
-- num link externo (Drive, Canva, Figma); aqui só se controla a peça.
create table if not exists marketing_campaign_creatives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references marketing_campaigns(id) on delete cascade,
  title text not null,
  channel text check (channel in (
    'site', 'email', 'instagram', 'whatsapp', 'banner', 'carrossel_logos',
    'pagina_empresa', 'eventos', 'midia_externa'
  )),
  asset_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists marketing_campaign_creatives_campaign_idx on marketing_campaign_creatives (campaign_id);

alter table marketing_campaigns enable row level security;
alter table marketing_campaign_creatives enable row level security;

drop trigger if exists marketing_campaigns_set_updated_at on marketing_campaigns;
create trigger marketing_campaigns_set_updated_at
  before update on marketing_campaigns
  for each row execute function set_updated_at();

-- Vínculos com as demais frentes. on delete set null: apagar a campanha não
-- apaga peça, disparo, anúncio nem lead.
alter table content_items add column if not exists marketing_campaign_id uuid references marketing_campaigns(id) on delete set null;
alter table email_campaigns add column if not exists marketing_campaign_id uuid references marketing_campaigns(id) on delete set null;
alter table ad_campaigns add column if not exists marketing_campaign_id uuid references marketing_campaigns(id) on delete set null;
alter table leads add column if not exists marketing_campaign_id uuid references marketing_campaigns(id) on delete set null;

create index if not exists content_items_marketing_campaign_idx on content_items (marketing_campaign_id);
create index if not exists email_campaigns_marketing_campaign_idx on email_campaigns (marketing_campaign_id);
create index if not exists ad_campaigns_marketing_campaign_idx on ad_campaigns (marketing_campaign_id);
create index if not exists leads_marketing_campaign_idx on leads (marketing_campaign_id);
