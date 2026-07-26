-- Registra o aceite de cada documento juridico no cadastro (versao, data,
-- empresa e IP) -- exigido pra comprovar consentimento depois, se precisar.
-- Nunca editar uma linha depois de gravada.
create table if not exists consent_acceptances (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  document_type text not null check (document_type in ('termos_de_uso', 'politica_de_privacidade', 'politica_de_cadastro')),
  version text not null,
  accepted_at timestamptz not null default now(),
  ip text
);

create index if not exists consent_acceptances_business_idx on consent_acceptances (business_id);

alter table consent_acceptances enable row level security;
