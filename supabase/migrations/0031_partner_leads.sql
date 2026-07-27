create table if not exists partner_leads (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  message text,
  status text not null default 'novo' check (status in ('novo', 'em_contato', 'convertido', 'descartado')),
  created_at timestamptz not null default now()
);
