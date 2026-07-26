insert into ad_placements (key, name, description, width, height)
values ('carrossel_home', 'Carrossel de anunciantes (home)', 'Cards em carrossel horizontal abaixo do banner do topo -- varios anunciantes pagantes exibidos ao mesmo tempo', 400, 500)
on conflict (key) do nothing;
