-- Canal de suporte unificado (empresas e membros), com histórico de
-- mensagens -- complementa o contato rápido por WhatsApp (que já existe em
-- todo canto do site, mas é sempre o WhatsApp de CADA empresa, nunca um
-- "WhatsApp de suporte da plataforma"). Sem RLS de verdade -- mesmo padrão
-- das tabelas criadas depois de 0001_init (ver nota em auth-guards.ts):
-- isolamento 100% pela aplicação via service-role, nunca client-side.
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  requester_type text not null check (requester_type in ('business', 'member')),
  business_id uuid references businesses(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  requester_name text not null,
  requester_contact text not null,
  subject text not null,
  status text not null default 'aberto' check (status in ('aberto', 'respondido', 'fechado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_requester_ref check (
    (requester_type = 'business' and business_id is not null and member_id is null) or
    (requester_type = 'member' and member_id is not null and business_id is null)
  )
);

create index if not exists support_tickets_business_id_idx on support_tickets(business_id);
create index if not exists support_tickets_member_id_idx on support_tickets(member_id);
create index if not exists support_tickets_status_idx on support_tickets(status);

drop trigger if exists support_tickets_set_updated_at on support_tickets;
create trigger support_tickets_set_updated_at
  before update on support_tickets
  for each row
  execute function set_updated_at();

-- Thread de mensagens do chamado -- primeira mensagem é o corpo original do
-- pedido (criada junto com o ticket), as seguintes são o vai-e-vem com o
-- admin. `sender_type = 'requester'` cobre tanto empresa quanto membro (já
-- dá pra saber quem é pelo `support_tickets.requester_type`, não precisa
-- repetir aqui).
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  sender_type text not null check (sender_type in ('requester', 'admin')),
  sender_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_ticket_id_idx on support_messages(ticket_id);
