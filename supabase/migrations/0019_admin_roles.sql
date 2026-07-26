-- Sub-papéis internos do admin (super_admin, admin, financeiro, comercial,
-- moderador), previstos no escopo original mas nunca implementados — até
-- aqui só existia um admin "flat" sem distinção de permissão.
alter table admins
  add column if not exists role text not null default 'admin'
  check (role in ('super_admin', 'admin', 'financeiro', 'comercial', 'moderador'));

-- O único admin existente hoje é a conta da agência: vira super_admin
-- (acesso total, inclusive gestão de outros admins).
update admins set role = 'super_admin' where role = 'admin';
