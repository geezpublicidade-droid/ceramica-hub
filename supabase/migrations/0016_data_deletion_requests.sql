-- LGPD: pedido de exclusao de dados passa por revisao do admin antes de
-- efetivar (a exclusao e irreversivel e pode ter implicacao financeira --
-- assinatura ativa, fatura pendente). Exportacao de dados (portabilidade)
-- e self-service instantaneo, nao precisa de fila -- so fica registrado em
-- audit_logs quando solicitado.
-- business_id sem FK/cascade de propósito: quando o pedido é atendido, a
-- empresa é excluída, mas este registro precisa sobreviver como histórico
-- de auditoria (igual ao padrão já usado em audit_logs).
create table if not exists data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  business_name text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  reason text,
  admin_notes text,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_admin_id uuid
);

create index if not exists data_deletion_requests_status_idx on data_deletion_requests (status);

alter table data_deletion_requests enable row level security;
