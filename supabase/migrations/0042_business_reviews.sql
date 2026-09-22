-- Avaliações de membros sobre empresas (nota 1-5 + comentário). Sempre
-- criada como "pendente" -- só aparece publicamente depois de um admin/
-- moderador aprovar (mesmo raciocínio de institutional_partners: nunca
-- publicar conteúdo de terceiro sem alguém conferir antes). Um membro só
-- pode ter uma avaliação por empresa (unique) -- reenviar atualiza a
-- existente e volta pro estado "pendente".
create table if not exists business_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'rejeitado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, member_id)
);

create index if not exists business_reviews_business_status_idx on business_reviews(business_id, status);
create index if not exists business_reviews_status_idx on business_reviews(status);
