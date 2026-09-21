-- 0039 esqueceu que business_name também era not null (só relaxou
-- business_id) -- pedido de membro não tem nome de empresa nenhum, então
-- o insert falhava. Achado rodando o smoke test desta sessão.
alter table data_deletion_requests alter column business_name drop not null;
