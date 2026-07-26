-- Multiplos usuarios por empresa (business_staff) — login separado do
-- business_owner, mesma business_id, mas sem poder mexer em cobranca,
-- excluir a conta ou gerenciar a propria equipe (isso fica so com o owner).
create table if not exists business_staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  name text not null,
  created_at timestamptz not null default now()
);

alter table business_staff enable row level security;

create index if not exists business_staff_business_id_idx on business_staff(business_id);
