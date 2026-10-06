-- Landing page dinamica da empresa (/empresa/[slug]). Tudo aditivo e idempotente.
-- A configuracao vive em `business_landing` (1:1) para nao mexer em `businesses` nem nas
-- consultas do diretorio. Sem linha em business_landing = a pagina usa os dados basicos da empresa.
-- RLS ligado sem policy em todas as tabelas: so o servidor (service_role) acessa.

create table if not exists business_landing (
  business_id uuid primary key references businesses(id) on delete cascade,
  -- rascunho nao aparece para o publico (so para a empresa/admin em ?preview=1)
  status text not null default 'published' check (status in ('draft', 'published')),

  -- hero
  hero_headline text,
  hero_subtitle text,
  hero_image_url text,
  hero_cta_kind text not null default 'servicos' check (hero_cta_kind in ('servicos', 'orcamento', 'agendar', 'cardapio')),
  hero_cta_label text,

  -- whatsapp
  whatsapp_phone text,
  whatsapp_message text,

  -- apresentacao
  about_problem text,
  about_benefit text,
  about_differentials text[] not null default '{}',
  about_audience text,

  -- barra de confianca (so aparece o que estiver preenchido)
  years_in_business integer check (years_in_business is null or years_in_business >= 0),
  response_time text,
  by_appointment boolean not null default false,
  professional_registry text,

  -- localizacao e contato
  parking_info text,
  accessibility_info text,
  reference_point text,
  -- {"mon":[["08:00","20:00"]],"tue":[...],...,"sun":[]} (dia ausente ou [] = fechado)
  opening_schedule jsonb,
  facebook_url text,
  tiktok_url text,
  youtube_url text,

  -- conversao
  lead_form_enabled boolean not null default false,
  final_cta_title text,
  final_cta_text text,
  final_cta_label text,

  -- secoes: ordem personalizada e desativadas (chaves em src/lib/landing/sections.ts)
  section_order text[] not null default '{}',
  sections_disabled text[] not null default '{}',

  seo_title text,
  seo_description text,

  updated_at timestamptz not null default now()
);
alter table business_landing enable row level security;

create table if not exists business_faqs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists business_faqs_business_idx on business_faqs (business_id, sort_order);
alter table business_faqs enable row level security;

-- Servicos: duracao, texto do botao e ocultacao sem apagar.
alter table business_services
  add column if not exists duration text,
  add column if not exists cta_label text,
  add column if not exists active boolean not null default true;

-- Galeria: foto ou video, legenda e texto alternativo.
alter table business_photos
  add column if not exists kind text not null default 'photo' check (kind in ('photo', 'video')),
  add column if not exists caption text,
  add column if not exists alt text;

-- Oferta exclusiva (benefits ja tem titulo, descricao, cupom e validade).
alter table benefits
  add column if not exists image_url text,
  add column if not exists cta_label text;

-- Leads gerados pelo formulario da landing, vinculados a empresa.
create table if not exists business_leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  service_id uuid references business_services(id) on delete set null,
  service_name text,
  message text,
  status text not null default 'novo'
    check (status in ('novo', 'em_atendimento', 'contatado', 'proposta_enviada', 'convertido', 'perdido')),
  -- LGPD: aceite registrado com a versao do texto
  consent_at timestamptz not null default now(),
  consent_version text not null default '1.0',
  -- origem e contexto
  source text,
  page_path text,
  device text,
  utm jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists business_leads_business_idx on business_leads (business_id, created_at desc);
create index if not exists business_leads_status_idx on business_leads (business_id, status);
alter table business_leads enable row level security;
