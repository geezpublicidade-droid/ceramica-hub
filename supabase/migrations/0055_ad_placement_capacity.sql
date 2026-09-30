-- Fase 3.3: capacidade por espaço publicitário. Um espaço normalmente vende
-- uma vaga por vez (max_concurrent = 1); espaços de rotação, como o carrossel
-- de anunciantes da home, comportam vários no mesmo período. A aprovação de
-- campanha checa essa capacidade (ver approveCampaign em admin-ads.ts).
alter table ad_placements
  add column if not exists max_concurrent integer not null default 1 check (max_concurrent >= 1);

update ad_placements set max_concurrent = 8 where key = 'carrossel_home';
