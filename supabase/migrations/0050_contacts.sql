-- Contatos comerciais de uma empresa (aba "Contatos" da Empresa 360°) --
-- distinto de `business_staff` (login de verdade no painel da empresa).
-- Um contato aqui é só uma pessoa que o time comercial/atendimento fala
-- com, pode nem ter acesso ao painel (ex: financeiro da empresa, sócio).
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  job_title text,
  phone text,
  whatsapp text,
  email text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_business_id_idx on contacts (business_id);

alter table contacts enable row level security;

drop trigger if exists contacts_set_updated_at on contacts;
create trigger contacts_set_updated_at
  before update on contacts
  for each row execute function set_updated_at();
