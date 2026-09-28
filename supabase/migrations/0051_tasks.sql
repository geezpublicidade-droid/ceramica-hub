-- Tarefas genéricas do painel administrativo — vinculadas a qualquer
-- entidade (lead, empresa, contato, campanha, etc), mesmo padrão de
-- entity_type/entity_id livre já usado em audit_logs (0011).
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  owner_admin_id uuid references admins(id) on delete set null,
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  due_at timestamptz,
  status text not null default 'pendente' check (status in ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_owner_idx on tasks (owner_admin_id);
create index if not exists tasks_status_idx on tasks (status);
create index if not exists tasks_entity_idx on tasks (entity_type, entity_id);

alter table tasks enable row level security;

drop trigger if exists tasks_set_updated_at on tasks;
create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();
