-- benefits nunca ganhou created_at (só id/business_id/kind/title/description/active
-- desde a 0001), mas getOwnedPromotions ja ordenava por essa coluna -> 500 no /dashboard/editar
-- assim que uma empresa aprovada tinha alguma promocao/beneficio pra listar.
alter table benefits
  add column if not exists created_at timestamptz not null default now();
