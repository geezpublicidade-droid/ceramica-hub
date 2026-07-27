-- Hoteis parceiros (Business Travel) e auditorios/salas de reuniao --
-- ambos curados pelo admin, sem reserva automatica (documento pede
-- "solicitacao de informacoes" via WhatsApp/formulario, nao reserva real).
-- status simples (draft/active/inactive): draft = incompleto, so o admin ve;
-- active = publicado; inactive = tirado do ar sem apagar o cadastro.
create table if not exists hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  cover_photo_url text,
  booking_link text,
  whatsapp text,
  phone text,
  address text,
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists meeting_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  space_type text not null check (space_type in ('auditorio', 'sala_reuniao')),
  capacity int,
  description text,
  photo_url text,
  equipment text,
  tower_id uuid references towers(id),
  floor text,
  room_number text,
  pricing_info text,
  contact_whatsapp text,
  contact_link text,
  rules text,
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hotels_status_idx on hotels(status, sort_order);
create index if not exists meeting_spaces_status_idx on meeting_spaces(status, sort_order);
