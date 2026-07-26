-- MFA (TOTP) obrigatorio pra administradores. mfa_enabled comeca false pra
-- todo admin existente -- no proximo login ele e direcionado pro setup
-- (ver /admin/mfa-setup) antes de conseguir usar qualquer outra tela do
-- admin. O segredo fica em texto puro na tabela (mesmo nivel de protecao
-- das outras colunas sensiveis aqui: acesso exclusivo via service role key,
-- RLS deny-all).
alter table admins
  add column if not exists mfa_secret text,
  add column if not exists mfa_enabled boolean not null default false;
