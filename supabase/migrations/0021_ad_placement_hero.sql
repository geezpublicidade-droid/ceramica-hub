insert into ad_placements (key, name, description, width, height)
values ('hero_abaixo', 'Abaixo da frase de destaque', 'Banner logo apos o headline principal, antes de qualquer outro conteudo', 1200, 200)
on conflict (key) do nothing;
