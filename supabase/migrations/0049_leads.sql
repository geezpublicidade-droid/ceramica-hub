-- CRM de leads geral (Fase 1 da central de operação) — distinto de
-- `partner_leads` (que continua só pro formulário público "Seja um
-- Parceiro"/anúncio). Esta tabela é o funil comercial completo: qualquer
-- oportunidade de negócio, prospectada ou recebida, entra aqui.
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),

  -- Dados de contato/empresa
  contact_name text not null,
  company_name text,
  job_title text,
  phone text,
  whatsapp text,
  email text,
  document text, -- CNPJ ou CPF, quando disponível

  -- Origem e classificação
  source text not null check (source in (
    'site', 'indicacao', 'prospeccao', 'evento', 'instagram', 'whatsapp',
    'formulario', 'visita_presencial', 'parceiro', 'importacao'
  )),
  category text,
  tower_id uuid references towers(id),
  product_interest text,
  plan_interest text,
  estimated_value_cents integer,
  temperature text not null default 'morno' check (temperature in ('frio', 'morno', 'quente')),

  -- Funil
  stage text not null default 'novo' check (stage in (
    'novo', 'primeiro_contato', 'qualificacao', 'reuniao_agendada',
    'proposta_enviada', 'negociacao', 'fechado', 'perdido'
  )),
  loss_reason text,

  -- Gestão
  owner_admin_id uuid references admins(id) on delete set null,
  next_action text,
  next_action_at timestamptz,
  last_contact_at timestamptz,
  notes text,

  -- Conversão (quando o lead vira empresa cadastrada de verdade)
  converted_business_id uuid references businesses(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_stage_idx on leads (stage);
create index if not exists leads_owner_idx on leads (owner_admin_id);
create index if not exists leads_created_at_idx on leads (created_at);

alter table leads enable row level security;

-- Reaproveita a função genérica set_updated_at() criada em 0037 pra businesses.
drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();
