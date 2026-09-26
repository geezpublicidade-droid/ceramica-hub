-- Tipo de interesse do lead: anunciante ou patrocinador (escolhido no formulário público)
alter table partner_leads
  add column if not exists interest text not null default 'anunciante'
  check (interest in ('anunciante', 'patrocinador'));
