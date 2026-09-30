-- Fase 3.1: calendário de conteúdo + fluxo de aprovação.
-- Um content_item é qualquer peça planejada (post, newsletter, banner,
-- campanha, evento, data comemorativa...). O status segue o fluxo
-- Ideia -> Planejamento -> Em produção -> Aguardando aprovação -> Aprovado
-- -> Agendado -> Publicado (ou Cancelado).
create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'post' check (kind in (
    'post', 'destaque_empresa', 'campanha', 'evento', 'data_comemorativa',
    'newsletter', 'banner', 'publicacao_ancora'
  )),
  title text not null,
  briefing text,
  body text,
  channel text check (channel in (
    'site', 'email', 'instagram', 'whatsapp', 'banner', 'carrossel_logos',
    'pagina_empresa', 'eventos', 'midia_externa'
  )),
  status text not null default 'ideia' check (status in (
    'ideia', 'planejamento', 'em_producao', 'aguardando_aprovacao',
    'aprovado', 'agendado', 'publicado', 'cancelado'
  )),
  business_id uuid references businesses(id) on delete set null,
  scheduled_for date not null,
  published_at timestamptz,
  owner_admin_id uuid references admins(id) on delete set null,
  created_by uuid references admins(id) on delete set null,
  updated_by uuid references admins(id) on delete set null,
  approved_by uuid references admins(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_scheduled_idx on content_items (scheduled_for);
create index if not exists content_items_status_idx on content_items (status);
create index if not exists content_items_business_idx on content_items (business_id);

-- Versões anteriores: um retrato de título/briefing/corpo/status a cada
-- alteração, com quem alterou.
create table if not exists content_item_versions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  version_number integer not null,
  title text not null,
  briefing text,
  body text,
  status text not null,
  changed_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (content_item_id, version_number)
);

create table if not exists content_item_comments (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  admin_id uuid references admins(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists content_item_comments_item_idx on content_item_comments (content_item_id, created_at);

alter table content_items enable row level security;
alter table content_item_versions enable row level security;
alter table content_item_comments enable row level security;

drop trigger if exists content_items_set_updated_at on content_items;
create trigger content_items_set_updated_at
  before update on content_items
  for each row execute function set_updated_at();
