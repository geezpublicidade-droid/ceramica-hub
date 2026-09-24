insert into ad_placements (key, name, description, width, height)
values ('hero_lateral', 'Painel lateral do hero (home)', 'Coluna vertical ao lado do hero na home -- largura fluida (min. 260px, ~22% da tela), altura fixa de 760px em telas grandes', 320, 760)
on conflict (key) do nothing;
