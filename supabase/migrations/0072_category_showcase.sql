-- Vitrine da categoria: conteudo do hero, painel comercial lateral, texto de SEO e
-- criativo das campanhas patrocinadas. Tudo editavel no admin; nada fixo no codigo.
-- Campo nulo = a pagina usa o texto/imagem padrao (subcategoria herda da macro).

alter table categories
  add column if not exists hero_title text,
  add column if not exists hero_description text,
  add column if not exists hero_helper text,
  add column if not exists hero_image_url text,
  add column if not exists hero_image_mobile_url text,
  add column if not exists hero_image_alt text,
  add column if not exists highlights_text text,
  add column if not exists seo_text text,
  add column if not exists ad_enabled boolean not null default true,
  add column if not exists ad_eyebrow text,
  add column if not exists ad_text text,
  add column if not exists ad_cta_label text,
  add column if not exists ad_cta_url text;

-- Criativo da campanha patrocinada: sem preenchimento, o slide usa capa, nome e descricao da empresa.
alter table category_placements
  add column if not exists headline text,
  add column if not exists description text,
  add column if not exists cta_label text,
  add column if not exists target_url text,
  add column if not exists image_url text,
  add column if not exists image_mobile_url text;

-- Alimentacao: "Cafeterias e padarias" vira duas subcategorias (nao ha empresa vinculada ainda).
update categories c
set slug = 'cafeterias', name = 'Cafeterias',
    keywords = array['cafe', 'cafeteria', 'expresso', 'cappuccino', 'cafezinho']
from categories m
where c.parent_id = m.id and m.slug = 'alimentacao' and c.slug = 'cafeterias-e-padarias';

insert into categories (parent_id, level, slug, name, sort_order, keywords)
select m.id, 2, 'padarias', 'Padarias', 125, array['padaria', 'pao', 'paes', 'panificadora', 'padoca']
from categories m where m.level = 1 and m.slug = 'alimentacao'
on conflict do nothing;

update categories c set name = 'Confeitarias e doces'
from categories m
where c.parent_id = m.id and m.slug = 'alimentacao' and c.slug = 'confeitaria-e-doces';

-- Conteudo inicial da vitrine de Alimentacao.
update categories set
  hero_title = 'Alimentação no Espaço Cerâmica',
  hero_description = 'Restaurantes, cafeterias, padarias, lanchonetes e muito mais para o seu dia a dia no Cerâmica.',
  hero_image_url = '/images/ceramica-hub-gastronomia.webp',
  hero_image_alt = 'Mesas de restaurante no Espaço Cerâmica',
  highlights_text = 'Marcas que fazem parte do dia a dia no Espaço Cerâmica.',
  ad_eyebrow = 'Anuncie nesta categoria',
  ad_text = 'Conecte sua marca a quem vive, trabalha e circula pelo Cerâmica.',
  ad_cta_label = 'Quero anunciar'
where level = 1 and slug = 'alimentacao' and hero_title is null;
