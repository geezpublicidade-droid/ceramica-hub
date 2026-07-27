-- Area editorial do mega menu Corporate ("Networking do Mes" ou empresa
-- VIP) -- reaproveita o mesmo sistema de anuncios: so aparece com campanha
-- aprovada e ativa (AdSlot ja nao renderiza nada sem isso).
insert into ad_placements (key, name, description, width, height)
values ('mega_menu_corporate', 'Área editorial do mega menu (Corporate)', 'Banner pequeno dentro do mega menu Corporate -- Networking do mês ou empresa VIP', 280, 100)
on conflict (key) do nothing;
