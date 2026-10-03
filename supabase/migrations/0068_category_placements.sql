-- Posicoes comerciais por categoria (Lider / Premium / Destaque). Preco e
-- beneficios ficam em `products` (nada fixo no codigo); cada contratacao e uma
-- linha em category_placements, ligada a empresa, categoria, proposta,
-- fatura, campanha e contrato. Vencida ou sem pagamento regular, a linha
-- simplesmente deixa de ser elegivel (filtro por data/status na consulta) e a
-- empresa volta sozinha para a listagem organica.

create extension if not exists btree_gist;

create table if not exists placement_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  badge_label text not null,
  description text,
  -- vagas por categoria no mesmo periodo; `exclusive` = vaga unica (Lider)
  max_slots integer not null check (max_slots >= 1),
  exclusive boolean not null default false,
  default_rotation_weight integer not null default 1 check (default_rotation_weight >= 1),
  product_id uuid references products(id) on delete set null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table placement_types enable row level security;

drop trigger if exists placement_types_set_updated_at on placement_types;
create trigger placement_types_set_updated_at
  before update on placement_types
  for each row execute function set_updated_at();

create table if not exists category_placements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  placement_type_id uuid not null references placement_types(id) on delete restrict,
  position integer not null default 0,
  rotation_weight integer not null default 1 check (rotation_weight >= 1),
  starts_at date not null,
  ends_at date not null,
  status text not null default 'reserved'
    check (status in ('reserved', 'active', 'paused', 'expired', 'cancelled')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'overdue', 'waived')),
  amount_cents integer check (amount_cents is null or amount_cents >= 0),
  offer_text text,
  contract_ref text,
  proposal_id uuid references proposals(id) on delete set null,
  invoice_id uuid references invoices(id) on delete set null,
  marketing_campaign_id uuid references marketing_campaigns(id) on delete set null,
  notes text,
  -- copia de placement_types.exclusive (mantida por trigger) para a constraint de exclusao
  exclusive boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create index if not exists category_placements_category_idx
  on category_placements (category_id, status, starts_at, ends_at);
create index if not exists category_placements_business_idx on category_placements (business_id);

-- Duas empresas nunca ocupam a mesma vaga exclusiva (Lider) da mesma categoria em datas que se cruzam.
alter table category_placements drop constraint if exists category_placements_no_exclusive_overlap;
alter table category_placements
  add constraint category_placements_no_exclusive_overlap
  exclude using gist (
    category_id with =,
    placement_type_id with =,
    daterange(starts_at, ends_at, '[]') with &&
  ) where (exclusive and status in ('reserved', 'active', 'paused'));

alter table category_placements enable row level security;

drop trigger if exists category_placements_set_updated_at on category_placements;
create trigger category_placements_set_updated_at
  before update on category_placements
  for each row execute function set_updated_at();

-- Antes de gravar: copia `exclusive` do tipo e barra estouro de vagas
-- (Premium ate 3, Destaque ate 6, ou o que o admin configurar).
create or replace function enforce_placement_capacity() returns trigger as $$
declare
  type_row placement_types%rowtype;
  occupied integer;
begin
  select * into type_row from placement_types where id = new.placement_type_id;
  new.exclusive := type_row.exclusive;

  if new.status in ('reserved', 'active', 'paused') then
    select count(*) into occupied
    from category_placements p
    where p.category_id = new.category_id
      and p.placement_type_id = new.placement_type_id
      and p.id <> new.id
      and p.status in ('reserved', 'active', 'paused')
      and daterange(p.starts_at, p.ends_at, '[]') && daterange(new.starts_at, new.ends_at, '[]');
    if occupied >= type_row.max_slots then
      raise exception 'Sem vaga disponivel para % nesta categoria no periodo informado', type_row.name
        using errcode = '23P01';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists category_placements_capacity on category_placements;
create trigger category_placements_capacity
  before insert or update on category_placements
  for each row execute function enforce_placement_capacity();

-- Produtos de publicidade por categoria: precos em branco, o admin define no painel de Produtos.
insert into products (slug, name, category, billing_type, description, sort_order) values
  ('categoria-lider', 'Líder da categoria', 'publicidade', 'mensal', 'Card grande no topo da categoria ou subcategoria. Uma vaga por categoria.', 200),
  ('categoria-premium', 'Destaque Premium na categoria', 'publicidade', 'mensal', 'Primeira fileira da categoria, abaixo do Líder. Até 3 vagas.', 210),
  ('categoria-destaque', 'Destaque na categoria', 'publicidade', 'mensal', 'Aparece antes da listagem comum da categoria. Até 6 vagas.', 220)
on conflict (slug) do nothing;

insert into placement_types (key, name, badge_label, description, max_slots, exclusive, default_rotation_weight, sort_order, product_id)
select v.key, v.name, v.badge, v.descr, v.slots, v.excl, 1, v.ord, p.id
from (values
  ('leader', 'Líder da categoria', 'Patrocinado', 'Card grande no topo, uma empresa por categoria.', 1, true, 10, 'categoria-lider'),
  ('premium', 'Premium', 'Premium', 'Primeira fileira, até três empresas.', 3, false, 20, 'categoria-premium'),
  ('featured', 'Destaque', 'Destaque', 'Antes da listagem comum, até seis empresas.', 6, false, 30, 'categoria-destaque')
) as v(key, name, badge, descr, slots, excl, ord, product_slug)
left join products p on p.slug = v.product_slug
on conflict (key) do nothing;
