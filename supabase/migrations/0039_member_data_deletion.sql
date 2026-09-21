-- Direito ao esquecimento (LGPD) também pro membro -- reaproveita
-- data_deletion_requests (mesma fila de revisão do admin em /admin/lgpd)
-- em vez de criar uma tabela paralela só pra trocar "business" por
-- "member". `business_id` vira opcional pra caber pedido de membro.
alter table data_deletion_requests
  alter column business_id drop not null,
  add column if not exists requester_type text not null default 'business' check (requester_type in ('business', 'member')),
  add column if not exists member_id uuid,
  add column if not exists member_name text;
