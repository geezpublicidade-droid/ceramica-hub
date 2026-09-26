-- Mídia de Capa: slides 2 e 3 do hero da home (o slide 1 é sempre institucional).
-- Preço inicial de lançamento = 30 dias (R$ 4.000); ajustável em /admin/publicidade/espacos.
insert into ad_placements (key, name, description, width, height, monthly_price_cents)
values ('hero_capa', 'Mídia de Capa (hero da home)', 'Slides 2 e 3 do carrossel do hero -- imagem em tela cheia da área principal (~1600x760). O slide 1 é sempre institucional.', 1600, 760, 400000)
on conflict (key) do nothing;
