-- Cerâmica Hub — schema inicial (empresas, membros, admin)
-- RLS habilitado com deny-all em todas as tabelas: nenhuma policy é criada
-- de propósito. Todo acesso do app usa a service role key (server-only),
-- que ignora RLS. A anon key nunca é usada neste projeto.

create extension if not exists pgcrypto;

create table if not exists towers (
  id uuid primary key default gen_random_uuid(),
  complex_name text not null,
  name text not null,
  address text not null,
  cep text not null,
  active boolean not null default true,
  sort_order int not null default 0,
  unique (complex_name, name)
);

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  category text not null,
  description text,
  instagram text,
  phone text not null,
  tower_id uuid not null references towers(id),
  floor text not null,
  room_number text not null,
  logo_url text,
  plan text not null default 'free' check (plan in ('free', 'destaque')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  comprovante_path text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  url text not null,
  sort_order int not null default 0
);

create table if not exists benefits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  kind text not null,
  title text not null,
  description text,
  active boolean not null default true
);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  type text not null,
  title text not null,
  description text,
  active boolean not null default true
);

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists member_favorites (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (member_id, business_id)
);

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null
);

alter table towers enable row level security;
alter table businesses enable row level security;
alter table business_photos enable row level security;
alter table benefits enable row level security;
alter table opportunities enable row level security;
alter table members enable row level security;
alter table member_favorites enable row level security;
alter table admins enable row level security;

insert into storage.buckets (id, name, public)
values ('comprovantes', 'comprovantes', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('business-photos', 'business-photos', true)
on conflict (id) do nothing;
