-- Central de Marketing: publicações reservadas pela empresa (Stories, newsletter, conteúdo editorial),
-- exclusividade por segmento nos espaços e biblioteca de mídias.

-- Exclusividade: um espaço marcado assim não vende o mesmo período a duas empresas da mesma categoria.
alter table ad_placements add column if not exists exclusive_by_category boolean not null default false;
update ad_placements set exclusive_by_category = true where key in ('hero_capa', 'hero_lateral');

-- Produtos de publicação: o que a equipe publica em nome da empresa, em data/horário marcados.
create table if not exists publication_products (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  content_kind text not null check (content_kind in ('post', 'destaque_empresa', 'newsletter', 'evento', 'banner')),
  channel text not null check (channel in ('instagram', 'email', 'site', 'eventos')),
  price_cents integer not null check (price_cents >= 0),
  -- horários oferecidos no dia (HH:MM); vazio = sem horário (só a data)
  time_slots text[] not null default '{}',
  -- dias da semana permitidos (0 = domingo ... 6 = sábado); vazio = qualquer dia
  weekdays integer[] not null default '{}',
  capacity_per_slot integer not null default 1 check (capacity_per_slot >= 1),
  lead_days integer not null default 3 check (lead_days >= 0),
  image_width integer,
  image_height integer,
  creative_specs text,
  sellable boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists publication_bookings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references publication_products(id) on delete restrict,
  business_id uuid not null references businesses(id) on delete cascade,
  content_item_id uuid references content_items(id) on delete set null,
  scheduled_for date not null,
  time_slot text not null default '',
  title text not null,
  body text,
  image_url text,
  link_url text,
  price_cents integer not null default 0 check (price_cents >= 0),
  -- incluído = consumiu o benefício do plano (sem cobrança)
  payment_status text not null default 'pendente' check (payment_status in ('pendente', 'pago', 'isento', 'incluido')),
  status text not null default 'aguardando' check (status in ('aguardando', 'aprovado', 'correcao', 'publicado', 'cancelado')),
  correction_note text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists publication_bookings_slot_idx on publication_bookings (product_id, scheduled_for, time_slot) where status <> 'cancelado';
create index if not exists publication_bookings_business_idx on publication_bookings (business_id, scheduled_for);

insert into publication_products (key, name, description, content_kind, channel, price_cents, time_slots, weekdays, capacity_per_slot, lead_days, image_width, image_height, creative_specs, sort_order) values
  ('story_hub', 'Story no Instagram do Hub', 'Sua arte nos Stories do Cerâmica Hub, no dia e horário escolhidos.', 'post', 'instagram', 9000, '{12:00,19:00}', '{}', 1, 3, 1080, 1920, 'Arte vertical 1080×1920px (JPG/PNG).', 10),
  ('newsletter_destaque', 'Destaque na newsletter', 'Seu bloco (imagem, texto e botão) na newsletter semanal.', 'newsletter', 'email', 25000, '{08:00}', '{4}', 3, 5, 1200, 628, 'Imagem 1200×628px, título e texto curto.', 20),
  ('editorial_materia', 'Conteúdo editorial (matéria)', 'Matéria ou entrevista sobre a sua empresa no Hub e nas redes.', 'destaque_empresa', 'site', 45000, '{}', '{}', 1, 10, 1600, 900, 'Imagem de capa 1600×900px e briefing do assunto.', 30)
on conflict (key) do nothing;

alter table publication_products enable row level security;
alter table publication_bookings enable row level security;

-- Biblioteca de mídias da empresa.
create table if not exists business_media (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  kind text not null check (kind in ('logo', 'foto', 'video', 'banner', 'story', 'documento')),
  name text not null,
  url text not null,
  width integer,
  height integer,
  bytes integer,
  created_at timestamptz not null default now()
);
create index if not exists business_media_business_idx on business_media (business_id, kind, created_at desc);
alter table business_media enable row level security;
