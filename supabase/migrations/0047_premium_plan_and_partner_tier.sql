-- Plano Premium (acima de Experiência) + níveis de parceiro institucional.
alter table businesses drop constraint if exists businesses_plan_check;
alter table businesses add constraint businesses_plan_check
  check (plan in ('presenca', 'profissional', 'destaque', 'experiencia', 'premium'));

alter table subscriptions drop constraint if exists subscriptions_plan_check;
alter table subscriptions add constraint subscriptions_plan_check
  check (plan in ('profissional', 'destaque', 'experiencia', 'premium'));

-- Nível do parceiro institucional. Só 'ancora_fundadora' recebe o selo
-- "Parceiro Fundador" e ocupa uma das cotas iniciais (limite de 7, controlado no admin).
alter table institutional_partners
  add column if not exists tier text not null default 'parceiro_premium'
  check (tier in ('ancora_fundadora', 'parceiro_premium', 'presenca_institucional', 'parceiro_ecossistema'));
