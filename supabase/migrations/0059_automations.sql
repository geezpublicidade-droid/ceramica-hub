-- Fase 3.7: automações de e-mail (boas-vindas, cadastro incompleto, pedido de
-- aprovação, lembrete de publicação, relatório mensal, campanha encerrada,
-- renovação, reativação, novo lead).
-- automation_log garante que cada aviso sai uma única vez: (automation,
-- dedupe_key) é único. O token permite descadastro pelo link do rodapé.
create table if not exists automation_log (
  id uuid primary key default gen_random_uuid(),
  automation text not null,
  dedupe_key text not null,
  recipient_email text not null,
  business_id uuid references businesses(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  attempts integer not null default 0,
  error text,
  unsubscribe_token text not null unique default encode(gen_random_bytes(16), 'hex'),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (automation, dedupe_key, recipient_email)
);
create index if not exists automation_log_automation_idx on automation_log (automation, created_at desc);

-- Liga/desliga por automação. Sem linha = ligada.
create table if not exists automation_settings (
  automation text primary key,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table automation_log enable row level security;
alter table automation_settings enable row level security;
