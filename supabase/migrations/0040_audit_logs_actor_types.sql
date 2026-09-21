-- audit_logs.actor_type só aceitava 'admin'/'system' desde a migration
-- 0011, mas requestDataExport/requestDataDeletion (lgpd.ts) já inserem
-- actor_type='business' desde então -- bug pré-existente, silencioso
-- (o insert falha e ninguém checa o erro, só o pedido em si não é
-- registrado no log de auditoria). Corrige junto com a extensão pra
-- 'member' que a LGPD do membro precisa.
alter table audit_logs drop constraint if exists audit_logs_actor_type_check;
alter table audit_logs add constraint audit_logs_actor_type_check
  check (actor_type in ('admin', 'system', 'business', 'member'));
