-- Loja de publicidade: a empresa cadastrada reserva espaços direto no painel.
-- Campanha passa a poder pertencer a uma empresa (business_id) além do
-- anunciante externo (ad_account_id), com pagamento rastreado na campanha.
alter table ad_campaigns alter column ad_account_id drop not null;
alter table ad_campaigns add column if not exists business_id uuid references businesses(id) on delete cascade;
alter table ad_campaigns add column if not exists price_cents integer check (price_cents is null or price_cents >= 0);
alter table ad_campaigns add column if not exists payment_status text not null default 'nao_aplicavel'
  check (payment_status in ('nao_aplicavel', 'pendente', 'pago', 'isento'));
alter table ad_campaigns add column if not exists paid_at timestamptz;
alter table ad_campaigns add column if not exists source text not null default 'admin' check (source in ('admin', 'loja'));
alter table ad_campaigns drop constraint if exists ad_campaigns_owner_check;
alter table ad_campaigns add constraint ad_campaigns_owner_check check (ad_account_id is not null or business_id is not null);
create index if not exists ad_campaigns_business_idx on ad_campaigns (business_id, status);

-- Como cada espaço é vendido na loja.
alter table ad_placements add column if not exists sellable boolean not null default false;
alter table ad_placements add column if not exists location_label text;   -- "Home › topo, à direita"
alter table ad_placements add column if not exists page_path text;        -- página pública onde aparece
alter table ad_placements add column if not exists min_days integer not null default 7 check (min_days >= 1);
alter table ad_placements add column if not exists max_days integer not null default 90 check (max_days >= 1);
alter table ad_placements add column if not exists auto_approve boolean not null default false;

-- Espaços de página interna (faixa no meio/rodapé). Antes eram só "Anuncie aqui".
insert into ad_placements (key, name, description, width, height, mobile_width, mobile_height, format, max_concurrent) values
  ('empresas_meio', 'Lista de empresas — faixa no meio', 'Faixa entre os resultados da lista de empresas.', 1200, 240, 640, 320, 'banner', 1),
  ('empresas_rodape', 'Lista de empresas — rodapé', 'Faixa larga ao final da lista de empresas.', 1200, 240, 640, 320, 'banner', 1),
  ('busca_rodape', 'Busca — rodapé', 'Faixa ao final dos resultados de busca.', 1200, 240, 640, 320, 'banner', 1),
  ('noticias_rodape', 'Notícias — rodapé', 'Faixa ao final da página de notícias.', 1200, 240, 640, 320, 'banner', 1),
  ('blog_rodape', 'Blog — rodapé', 'Faixa ao final do blog e dos artigos.', 1200, 240, 640, 320, 'banner', 1),
  ('torres_rodape', 'Páginas das torres — rodapé', 'Faixa ao final das páginas de cada torre.', 1200, 240, 640, 320, 'banner', 1),
  ('forum_rodape', 'Fórum de Negócios — rodapé', 'Faixa ao final da página do Fórum de Negócios.', 1200, 240, 640, 320, 'banner', 1)
on conflict (key) do nothing;

-- Onde cada um aparece + condições de venda. Valores mensais iniciais (editáveis em
-- /admin/publicidade/espacos); só preenche o que ainda está sem preço.
update ad_placements set sellable = true, location_label = 'Home › capa (slides 2 e 3 do hero)', page_path = '/',
  min_days = 7, max_days = 60, monthly_price_cents = coalesce(monthly_price_cents, 400000) where key = 'hero_capa';
update ad_placements set sellable = true, location_label = 'Home › painel à direita do hero', page_path = '/',
  min_days = 7, max_days = 90, monthly_price_cents = coalesce(monthly_price_cents, 250000), max_concurrent = greatest(max_concurrent, 3) where key = 'hero_lateral';
update ad_placements set sellable = true, location_label = 'Lista de empresas › faixa no meio dos resultados', page_path = '/empresas',
  monthly_price_cents = coalesce(monthly_price_cents, 120000) where key = 'empresas_meio';
update ad_placements set sellable = true, location_label = 'Lista de empresas › rodapé', page_path = '/empresas',
  monthly_price_cents = coalesce(monthly_price_cents, 90000) where key = 'empresas_rodape';
update ad_placements set sellable = true, location_label = 'Busca › rodapé dos resultados', page_path = '/busca',
  monthly_price_cents = coalesce(monthly_price_cents, 70000) where key = 'busca_rodape';
update ad_placements set sellable = true, location_label = 'Notícias › rodapé', page_path = '/noticias',
  monthly_price_cents = coalesce(monthly_price_cents, 60000) where key = 'noticias_rodape';
update ad_placements set sellable = true, location_label = 'Blog › rodapé', page_path = '/blog',
  monthly_price_cents = coalesce(monthly_price_cents, 60000) where key = 'blog_rodape';
update ad_placements set sellable = true, location_label = 'Torres › rodapé de cada torre', page_path = '/torres',
  monthly_price_cents = coalesce(monthly_price_cents, 80000) where key = 'torres_rodape';
update ad_placements set sellable = true, location_label = 'Fórum de Negócios › rodapé', page_path = '/forum-de-negocios',
  monthly_price_cents = coalesce(monthly_price_cents, 80000) where key = 'forum_rodape';
