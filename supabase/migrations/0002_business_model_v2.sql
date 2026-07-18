-- Evolução do modelo de negócio: 3 planos (Presença/Destaque/Experiência),
-- Página Comercial Inteligente (hero completo, serviços, visita virtual
-- preparada-mas-desativada, selos), config de benefício Geez/crédito de
-- site (global, desativado até o admin ligar) e eventos de métricas.

-- 1) Planos: free/destaque -> presenca/destaque/experiencia.
-- "destaque" mantém o mesmo nome (agora é o nível do meio), só "free" muda de rótulo.
alter table businesses drop constraint if exists businesses_plan_check;
update businesses set plan = 'presenca' where plan = 'free';
alter table businesses
  add constraint businesses_plan_check check (plan in ('presenca', 'destaque', 'experiencia'));
alter table businesses alter column plan set default 'presenca';

-- 2) Campos da Página Comercial Inteligente (hero completo + contato + segurança).
alter table businesses
  add column if not exists cover_photo_url text,
  add column if not exists website_url text,
  add column if not exists booking_url text,
  add column if not exists opening_hours text,
  add column if not exists video_url text,
  add column if not exists image_usage_authorized boolean not null default false;

-- 3) "Visite nossa sala" — estrutura preparada, tudo desativado por padrão.
-- has_virtual_visit / virtual_visit_active controlam a visibilidade do botão e da
-- seção; enquanto false, nada disso aparece pro visitante.
alter table businesses
  add column if not exists has_virtual_visit boolean not null default false,
  add column if not exists virtual_visit_type text
    check (virtual_visit_type in ('photos', 'video', 'iframe_360', 'matterport', 'external_url')),
  add column if not exists virtual_visit_url text,
  add column if not exists virtual_visit_provider text,
  add column if not exists virtual_visit_thumbnail text,
  add column if not exists virtual_visit_description text,
  add column if not exists virtual_visit_active boolean not null default false;

-- 4) Selos administrativos — só aparecem quando aprovados pelo admin.
-- "Empresa verificada" já existe (= status='approved'); "Visita virtual disponível"
-- já existe (= virtual_visit_active). Faltam estes dois:
alter table businesses
  add column if not exists address_verified boolean not null default false,
  add column if not exists photographed boolean not null default false,
  add column if not exists founder boolean not null default false;

-- 5) Serviços da empresa (cards da seção "Serviços").
create table if not exists business_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  description text,
  photo_url text,
  starting_price numeric,
  sort_order int not null default 0
);
alter table business_services enable row level security;

-- 6) Promoções ganham validade e cupom (a tabela `benefits` já existia pro CRUD
-- self-service planejado; só estende com os campos que a spec pede).
alter table benefits
  add column if not exists valid_until date,
  add column if not exists coupon_code text;

-- 7) Config global do benefício Geez e do crédito de site — uma linha só,
-- tudo desativado até o admin configurar. Nunca aplicar desconto/crédito
-- automaticamente sem essa tabela dizer que está ativo.
create table if not exists platform_settings (
  id boolean primary key default true check (id),
  geez_discount_enabled boolean not null default false,
  geez_discount_max_percentage int not null default 50,
  geez_discount_terms text,
  geez_monthly_slots_limit int,
  site_credit_enabled boolean not null default false,
  site_credit_percentage int not null default 0,
  site_credit_month_limit int,
  site_credit_maximum numeric,
  site_credit_terms text
);
alter table platform_settings enable row level security;
insert into platform_settings (id) values (true) on conflict (id) do nothing;

-- 8) Eventos de métricas — log de append only, sem dado inventado no painel:
-- se não tem linha aqui, o painel mostra 0/vazio.
create table if not exists metrics_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table metrics_events enable row level security;
create index if not exists metrics_events_business_id_idx on metrics_events (business_id);
create index if not exists metrics_events_event_type_idx on metrics_events (event_type);
