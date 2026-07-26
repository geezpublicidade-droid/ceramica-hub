-- Tabela generica (EAV) pra tradução automatica (DeepL) do conteudo cadastrado
-- pelas proprias empresas (nome, descricao, servicos, beneficios, oportunidades).
-- Generica em vez de colunas _en/_es/_zh por tabela: qualquer campo traduzivel
-- novo so precisa de um novo valor de `field`, sem migration nova.
create table if not exists content_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('business', 'benefit', 'opportunity', 'business_service', 'virtual_tour_scene')),
  entity_id uuid not null,
  locale text not null check (locale in ('en', 'es', 'zh')),
  field text not null,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, locale, field)
);

create index if not exists content_translations_lookup_idx on content_translations (entity_type, locale, entity_id);

-- RLS habilitado sem policy, mesmo padrao das tabelas anteriores: acesso
-- exclusivamente via createServiceClient() (service role key), anon key nunca usada.
alter table content_translations enable row level security;
