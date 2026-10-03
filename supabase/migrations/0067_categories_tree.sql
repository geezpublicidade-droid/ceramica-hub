-- Descoberta de empresas (Etapa 2): taxonomia em arvore editavel pelo admin
-- (macrocategoria > subcategoria > especialidade) e vinculo N:N com empresas.
-- `businesses.category` (texto) continua existindo por compatibilidade: um
-- trigger mantem o vinculo da macrocategoria em sincronia com ele.
-- Slugs das macrocategorias = slug que o codigo ja gerava, pra nao quebrar URLs.

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references categories(id) on delete cascade,
  level smallint not null check (level between 1 and 3),
  slug text not null,
  name text not null,
  description text,
  icon text,
  translations jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((level = 1 and parent_id is null) or (level > 1 and parent_id is not null))
);

-- slug unico dentro do mesmo pai (macros: parent_id nulo)
create unique index if not exists categories_slug_unique
  on categories (coalesce(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);
create index if not exists categories_parent_idx on categories (parent_id, sort_order);

alter table categories enable row level security;

drop trigger if exists categories_set_updated_at on categories;
create trigger categories_set_updated_at
  before update on categories
  for each row execute function set_updated_at();

create table if not exists business_categories (
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (business_id, category_id)
);
create index if not exists business_categories_category_idx on business_categories (category_id);
alter table business_categories enable row level security;

-- Formas de atendimento (filtro "presencial/online"). Presencial por padrao,
-- porque todas as empresas ficam fisicamente no Espaco Ceramica.
alter table businesses
  add column if not exists serves_in_person boolean not null default true,
  add column if not exists serves_online boolean not null default false;

-- Macrocategorias (as 11 que ja existem hoje, com o mesmo slug).
insert into categories (level, slug, name, icon, sort_order) values
  (1, 'contabilidade-e-juridico', 'Contabilidade & Jurídico', 'scale', 10),
  (1, 'saude-e-estetica', 'Saúde & Estética', 'heart-pulse', 20),
  (1, 'alimentacao', 'Alimentação', 'utensils', 30),
  (1, 'moda-e-beleza', 'Moda & Beleza', 'sparkles', 40),
  (1, 'tecnologia-e-marketing', 'Tecnologia & Marketing', 'laptop', 50),
  (1, 'educacao', 'Educação', 'graduation-cap', 60),
  (1, 'design-e-arquitetura', 'Design & Arquitetura', 'ruler', 70),
  (1, 'investimentos', 'Investimentos', 'trending-up', 80),
  (1, 'direito', 'Direito', 'gavel', 90),
  (1, 'laboratorio', 'Laboratório', 'flask-conical', 100),
  (1, 'outros', 'Outros', 'layers', 110)
on conflict do nothing;

-- Subcategorias de Saúde & Estética e especialidades de Dentistas.
with saude as (select id from categories where level = 1 and slug = 'saude-e-estetica')
insert into categories (parent_id, level, slug, name, sort_order)
select saude.id, 2, v.slug, v.name, v.ord
from saude, (values
  ('dentistas', 'Dentistas', 10),
  ('clinicas-medicas', 'Clínicas médicas', 20),
  ('dermatologia', 'Dermatologia', 30),
  ('psicologia', 'Psicologia', 40),
  ('fisioterapia', 'Fisioterapia', 50),
  ('estetica', 'Estética', 60),
  ('saloes-de-beleza', 'Salões de beleza', 70),
  ('laboratorios', 'Laboratórios', 80)
) as v(slug, name, ord)
on conflict do nothing;

with dentistas as (
  select c.id from categories c join categories p on p.id = c.parent_id
  where c.level = 2 and c.slug = 'dentistas' and p.slug = 'saude-e-estetica'
)
insert into categories (parent_id, level, slug, name, sort_order)
select dentistas.id, 3, v.slug, v.name, v.ord
from dentistas, (values
  ('clinica-geral', 'Clínica geral', 10),
  ('ortodontia', 'Ortodontia', 20),
  ('implantes', 'Implantes', 30),
  ('harmonizacao-orofacial', 'Harmonização orofacial', 40),
  ('odontopediatria', 'Odontopediatria', 50),
  ('endodontia', 'Endodontia', 60),
  ('periodontia', 'Periodontia', 70)
) as v(slug, name, ord)
on conflict do nothing;

-- Backfill: toda empresa ganha o vinculo primario com a macro do seu texto.
insert into business_categories (business_id, category_id, is_primary)
select b.id, c.id, true
from businesses b
join categories c on c.level = 1 and c.name = b.category
on conflict (business_id, category_id) do update set is_primary = true;

-- Mantem o vinculo primario sincronizado quando `businesses.category` muda
-- (cadastro e edicao continuam gravando so o texto).
create or replace function sync_business_primary_category() returns trigger as $$
declare
  macro_id uuid;
begin
  select id into macro_id from categories where level = 1 and name = new.category limit 1;
  if macro_id is null then
    return new;
  end if;
  delete from business_categories bc
    using categories c
    where bc.business_id = new.id and bc.category_id = c.id and c.level = 1 and c.id <> macro_id;
  insert into business_categories (business_id, category_id, is_primary)
    values (new.id, macro_id, true)
    on conflict (business_id, category_id) do update set is_primary = true;
  return new;
end;
$$ language plpgsql;

drop trigger if exists businesses_sync_primary_category on businesses;
create trigger businesses_sync_primary_category
  after insert or update of category on businesses
  for each row execute function sync_business_primary_category();
