-- Fase 3.2: segmentação de público + e-mail marketing com LGPD.

-- Tags livres por empresa, usadas na segmentação.
alter table businesses add column if not exists tags text[] not null default '{}';

-- Públicos salvos. `filters` guarda os critérios (categoria, plano, torre,
-- âncora, status, período de cadastro, tags) -- ver AudienceFilters em
-- src/lib/services/marketing-audiences.ts.
create table if not exists marketing_audiences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  filters jsonb not null default '{}'::jsonb,
  created_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Consentimento de marketing por e-mail (LGPD). Só recebe campanha quem tem
-- consentimento ativo (revoked_at nulo) e não está em email_unsubscribes.
create table if not exists email_consents (
  email text primary key,
  business_id uuid references businesses(id) on delete set null,
  source text not null check (source in ('cadastro', 'admin', 'importacao')),
  note text,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- Lista de supressão: quem pediu descadastro nunca mais recebe.
create table if not exists email_unsubscribes (
  email text primary key,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in (
    'newsletter', 'promocional', 'comunicado', 'convite_evento', 'boas_vindas',
    'renovacao', 'reativacao', 'divulgacao_empresa'
  )),
  subject text not null,
  body_html text not null,
  created_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  subject text not null,
  body_html text not null,
  audience_id uuid references marketing_audiences(id) on delete set null,
  status text not null default 'rascunho' check (status in ('rascunho', 'enviando', 'enviada')),
  created_by uuid references admins(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Um registro por destinatário de cada disparo. Os timestamps são
-- preenchidos pelo envio (sent_at) e pelo webhook do provedor (demais).
create table if not exists email_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references email_campaigns(id) on delete cascade,
  business_id uuid references businesses(id) on delete set null,
  email text not null,
  unsubscribe_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  error text,
  provider_id text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_sends_campaign_idx on email_sends (campaign_id);
create index if not exists email_sends_provider_idx on email_sends (provider_id);

-- Lead atribuído a um disparo (métrica "leads gerados").
alter table leads add column if not exists email_campaign_id uuid references email_campaigns(id) on delete set null;

alter table marketing_audiences enable row level security;
alter table email_consents enable row level security;
alter table email_unsubscribes enable row level security;
alter table email_templates enable row level security;
alter table email_campaigns enable row level security;
alter table email_sends enable row level security;

drop trigger if exists marketing_audiences_set_updated_at on marketing_audiences;
create trigger marketing_audiences_set_updated_at
  before update on marketing_audiences
  for each row execute function set_updated_at();

drop trigger if exists email_templates_set_updated_at on email_templates;
create trigger email_templates_set_updated_at
  before update on email_templates
  for each row execute function set_updated_at();
