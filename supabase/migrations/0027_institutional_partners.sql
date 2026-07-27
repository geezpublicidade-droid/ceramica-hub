-- Parceiros institucionais (prefeitura, shopping, hoteis parceiros, etc) --
-- NUNCA aparecem publicamente sem autorizacao confirmada pelo admin. O
-- status existe justamente pra impedir publicar vinculo institucional sem
-- documentacao real (ver DIAGRAMA SITE.pdf, secao "Bloco 2 - Apoio e Parceiros").
create table if not exists institutional_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  link text,
  partnership_type text not null,
  authorization_note text,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'aguardando_autorizacao', 'aprovado', 'ativo', 'inativo')),
  starts_at date,
  ends_at date,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists institutional_partners_status_idx on institutional_partners(status, sort_order);
