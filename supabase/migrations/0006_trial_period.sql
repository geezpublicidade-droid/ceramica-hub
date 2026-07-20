-- Trial de 14 dias do plano Destaque, oferecido automaticamente quando uma
-- empresa do plano gratuito e aprovada. Sem cobranca automatica: ao expirar,
-- o "plano efetivo" volta a ser o cadastrado (presenca) em tempo de leitura,
-- sem apagar nenhum dado da empresa.
alter table businesses
  add column if not exists trial_status text not null default 'none'
    check (trial_status in ('none', 'active', 'expired')),
  add column if not exists trial_plan text,
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz;

alter table platform_settings
  add column if not exists trial_enabled boolean not null default true,
  add column if not exists trial_plan text not null default 'destaque',
  add column if not exists trial_duration_days int not null default 14;
