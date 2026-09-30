-- Catálogo comercial (Fase 2): tudo o que o Cerâmica Hub vende, com preço,
-- benefícios e limites editáveis pelo painel (nada fixo no código).
-- `plan_key` liga o produto a um plano de businesses.plan (quando aplicável);
-- `limits` guarda os limites do produto (ex.: maxPhotos) como JSON livre.
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in (
    'plano', 'publicidade', 'patrocinio', 'pagina_especial', 'servico_adicional'
  )),
  description text,
  billing_type text not null default 'mensal' check (billing_type in (
    'mensal', 'anual', 'unico', 'personalizado'
  )),
  monthly_price_cents integer check (monthly_price_cents is null or monthly_price_cents >= 0),
  yearly_price_cents integer check (yearly_price_cents is null or yearly_price_cents >= 0),
  benefits jsonb not null default '[]'::jsonb,
  limits jsonb not null default '{}'::jsonb,
  plan_key text check (plan_key is null or plan_key in (
    'presenca', 'profissional', 'destaque', 'experiencia', 'premium'
  )),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on products (category, sort_order);

alter table products enable row level security;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- Semente: os planos que já existem hoje (valores de PLAN_PRICES_CENTS) e o
-- plano sob medida Empresa Âncora (preço personalizado). Editáveis no painel.
insert into products (slug, name, category, billing_type, monthly_price_cents, yearly_price_cents, plan_key, sort_order, description, limits) values
  ('plano-presenca', 'Presença', 'plano', 'mensal', 0, 0, 'presenca', 10, 'Cadastro básico gratuito.', '{"maxServices":0,"maxPhotos":0,"maxPromotions":0}'),
  ('plano-profissional', 'Profissional', 'plano', 'mensal', 7900, 79000, 'profissional', 20, 'Plano de entrada pago.', '{"maxServices":3,"maxPhotos":3,"maxPromotions":1}'),
  ('plano-destaque', 'Destaque', 'plano', 'mensal', 14700, 147000, 'destaque', 30, 'Destaque nas buscas e cupons.', '{"maxServices":6,"maxPhotos":6,"maxPromotions":4}'),
  ('plano-experiencia', 'Experiência', 'plano', 'mensal', 29700, 297000, 'experiencia', 40, 'Vídeo e fotos ampliadas.', '{"maxPhotos":30,"maxPromotions":4}'),
  ('plano-premium', 'Premium', 'plano', 'mensal', 49700, 497000, 'premium', 50, 'Tudo do Experiência + Sala 3D.', '{"maxPhotos":30,"maxPromotions":4}'),
  ('plano-ancora', 'Empresa Âncora', 'patrocinio', 'personalizado', null, null, null, 60, 'Patrocínio sob medida, valor negociado por contrato.', '{}')
on conflict (slug) do nothing;
