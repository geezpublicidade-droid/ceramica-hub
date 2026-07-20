-- Introduz o nivel gratuito real: 'presenca' passa a ser o plano gratuito
-- (R$0), e o antigo "Presenca R$47" vira 'profissional'. Tabela businesses
-- esta vazia no momento desta migration, entao nao ha dado a migrar.
alter table businesses drop constraint if exists businesses_plan_check;
alter table businesses add constraint businesses_plan_check
  check (plan in ('presenca', 'profissional', 'destaque', 'experiencia'));

alter table businesses alter column plan set default 'presenca';
