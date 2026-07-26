-- Log de auditoria append-only pras acoes administrativas (aprovar/rejeitar
-- cadastro, confirmar pagamento, etc). Nunca editar/apagar uma linha depois
-- de gravada -- historico de decisao, nao estado atual.
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('admin', 'system')),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx on audit_logs (entity_type, entity_id);
create index if not exists audit_logs_actor_idx on audit_logs (actor_type, actor_id);

alter table audit_logs enable row level security;
