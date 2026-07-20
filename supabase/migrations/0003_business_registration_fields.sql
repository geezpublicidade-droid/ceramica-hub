-- Campos coletados no cadastro gratuito (etapa 1) que ainda nao existiam no schema.
alter table businesses
  add column if not exists responsible_name text,
  add column if not exists document text;

comment on column businesses.responsible_name is 'Nome da pessoa responsavel pelo cadastro, coletado na etapa 1 do formulario publico.';
comment on column businesses.document is 'CNPJ ou CPF profissional informado no cadastro. Nao exibido publicamente.';
