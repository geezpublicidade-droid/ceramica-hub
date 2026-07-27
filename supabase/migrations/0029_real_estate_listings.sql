-- Imoveis (venda/locacao de lajes e salas comerciais) -- mesma governanca
-- das duas partes anteriores (draft/active/inactive). Preco fica opcional
-- porque o documento probe inventar tarifa -- so preenche quem tiver o
-- dado real.
create table if not exists real_estate_listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  listing_type text not null check (listing_type in ('venda', 'locacao')),
  space_type text not null check (space_type in ('laje_inteira', 'sala_comercial')),
  area_m2 numeric,
  price_cents bigint,
  tower_id uuid references towers(id),
  floor text,
  room_number text,
  availability_status text not null default 'sob_consulta'
    check (availability_status in ('disponivel', 'indisponivel', 'sob_consulta')),
  agency_name text,
  contact_whatsapp text,
  contact_link text,
  photo_url text,
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists real_estate_listings_status_idx on real_estate_listings(status, sort_order);
