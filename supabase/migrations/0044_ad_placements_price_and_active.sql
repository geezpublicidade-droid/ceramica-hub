-- Catálogo de preços + arquivamento de posições de anúncio (admin de
-- inventário em /admin/publicidade/espacos). monthly_price_cents nulo =
-- "sob consulta" (sem tabela fixa pra essa posição ainda). active=false
-- arquiva a posição (some do formulário de nova campanha) sem apagar
-- histórico -- ad_campaigns referencia placement_id com "on delete restrict".
alter table ad_placements
  add column if not exists monthly_price_cents integer,
  add column if not exists active boolean not null default true;
