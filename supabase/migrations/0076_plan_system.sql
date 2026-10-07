-- Sistema central de planos, permissoes e limites (aditivo; nada e apagado).
--
-- Camadas de protecao: interface -> aplicacao (src/lib/plans + acoes) -> BANCO (funcoes e triggers abaixo).
-- Recursos de cada plano ficam em `plan_features` (editaveis no admin); `plans` e o catalogo de planos.
-- RLS ligado sem policy em todas as tabelas novas: so o servidor (service_role) acessa.
-- Backup logico das regras anteriores: docs/backup/regras-de-plano-2026-10-07.json

-- ---------------------------------------------------------------------------------------------------------------
-- 1) Catalogo de planos e recursos
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists plans (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  name text not null,
  description text,
  rank integer not null default 0,
  active boolean not null default true,
  is_public boolean not null default true,
  is_system boolean not null default false,
  billing_type text not null default 'mensal' check (billing_type in ('mensal', 'personalizado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table plans enable row level security;

insert into plans (key, name, description, rank, is_system, billing_type) values
  ('presenca', 'Presença Gratuita', 'Comece sua presença no Cerâmica sem custo.', 0, true, 'mensal'),
  ('profissional', 'Profissional', 'Página comercial padronizada, para empresas que já querem crescer.', 1, true, 'mensal'),
  ('destaque', 'Destaque', 'Para quem quer aparecer primeiro e ser visto por mais gente.', 2, true, 'mensal'),
  ('experiencia', 'Experiência', 'Landing page completa e personalizada, com serviços ilimitados.', 3, true, 'mensal'),
  ('premium', 'Premium', 'A maior visibilidade dentro do ecossistema Cerâmica.', 4, true, 'mensal'),
  ('patrocinador', 'Patrocinador', 'Proposta sob medida, com base no Experiência e benefícios ativados na negociação.', 5, true, 'personalizado')
on conflict (key) do nothing;

create table if not exists plan_features (
  plan_key text not null references plans(key) on delete cascade on update cascade,
  feature_key text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (plan_key, feature_key)
);
alter table plan_features enable row level security;

-- ---------------------------------------------------------------------------------------------------------------
-- 2) A chave do plano passa a apontar para `plans` (permite planos novos no futuro)
-- ---------------------------------------------------------------------------------------------------------------
alter table businesses drop constraint if exists businesses_plan_check;
alter table subscriptions drop constraint if exists subscriptions_plan_check;
alter table products drop constraint if exists products_plan_key_check;

alter table businesses drop constraint if exists businesses_plan_fkey;
alter table businesses add constraint businesses_plan_fkey foreign key (plan) references plans(key) on update cascade;
alter table subscriptions drop constraint if exists subscriptions_plan_fkey;
alter table subscriptions add constraint subscriptions_plan_fkey foreign key (plan) references plans(key) on update cascade;
alter table products drop constraint if exists products_plan_key_fkey;
alter table products add constraint products_plan_key_fkey foreign key (plan_key) references plans(key) on update cascade on delete set null;

-- ---------------------------------------------------------------------------------------------------------------
-- 3) Estado do plano na empresa
-- ---------------------------------------------------------------------------------------------------------------
alter table businesses
  add column if not exists plan_status text not null default 'active'
    check (plan_status in ('active', 'trialing', 'pending', 'past_due', 'canceled', 'expired', 'suspended')),
  add column if not exists plan_started_at timestamptz,
  add column if not exists plan_expires_at timestamptz,
  add column if not exists plan_updated_at timestamptz not null default now(),
  add column if not exists billing_cycle text not null default 'free'
    check (billing_cycle in ('free', 'monthly', 'yearly', 'courtesy', 'custom')),
  add column if not exists manual_override boolean not null default false,
  add column if not exists plan_discount_percent numeric(5, 2) check (plan_discount_percent is null or (plan_discount_percent >= 0 and plan_discount_percent <= 100)),
  add column if not exists plan_notes text,
  -- false = perfil sem proprietario validado: a pagina publica convida a "reivindicar este perfil"
  add column if not exists owner_validated boolean not null default true;

-- Retrocompatibilidade: plano pago sem assinatura ativa foi concedido pelo admin -> vira cortesia (nao vence sozinho).
update businesses b
set plan_started_at = coalesce(b.plan_started_at, b.created_at),
    billing_cycle = case when b.plan = 'presenca' then 'free' else 'courtesy' end,
    manual_override = (b.plan <> 'presenca' and not exists (select 1 from subscriptions s where s.business_id = b.id and s.status = 'active'))
where b.plan_started_at is null;

update businesses b
set plan_expires_at = s.ends_at, plan_started_at = coalesce(s.started_at, b.plan_started_at), billing_cycle = 'monthly', manual_override = false
from (
  select distinct on (business_id) business_id, started_at, ends_at
  from subscriptions where status = 'active' order by business_id, ends_at desc nulls last
) s
where s.business_id = b.id and b.plan <> 'presenca';

alter table platform_settings add column if not exists plan_grace_days integer not null default 7 check (plan_grace_days >= 0 and plan_grace_days <= 90);

-- Itens de galeria passam a poder ficar inativos (downgrade: o excedente fica salvo, sem aparecer).
alter table business_photos add column if not exists active boolean not null default true;

-- Plano Patrocinador tambem existe no catalogo comercial (preco sob consulta).
insert into products (slug, name, category, billing_type, plan_key, sort_order, description, limits)
values ('plano-patrocinador', 'Patrocinador', 'plano', 'personalizado', 'patrocinador', 70,
        'Base do plano Experiencia + proposta personalizada; beneficios adicionais ativados na negociacao.', '{}'::jsonb)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------------------------------------------
-- 4) Overrides, historico, entregas e reivindicacoes
-- ---------------------------------------------------------------------------------------------------------------
create table if not exists company_feature_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  feature_key text not null,
  value jsonb not null,
  reason text,
  starts_at timestamptz,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (business_id, feature_key)
);
create index if not exists company_feature_overrides_business_idx on company_feature_overrides (business_id);
alter table company_feature_overrides enable row level security;

create table if not exists plan_change_history (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  kind text not null check (kind in (
    'baseline', 'upgrade', 'downgrade', 'plan_change', 'renewal', 'payment', 'trial_start', 'trial_end',
    'suspend', 'reactivate', 'cancel', 'courtesy', 'override_set', 'override_removed', 'status_change',
    'auto_downgrade', 'auto_expire', 'dates_change', 'discount', 'note'
  )),
  from_plan text,
  to_plan text,
  from_status text,
  to_status text,
  effective_at timestamptz not null default now(),
  reason text,
  metadata jsonb,
  changed_by_type text not null default 'system' check (changed_by_type in ('admin', 'business', 'system')),
  changed_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists plan_change_history_business_idx on plan_change_history (business_id, created_at desc);
alter table plan_change_history enable row level security;

insert into plan_change_history (business_id, kind, to_plan, to_status, reason, changed_by_type)
select id, 'baseline', plan, plan_status, 'Estado inicial ao ativar o sistema de planos', 'system'
from businesses
where not exists (select 1 from plan_change_history h where h.business_id = businesses.id);

create table if not exists company_plan_deliverables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  kind text not null check (kind in (
    'tour3d_production', 'networking_event', 'networking_meal', 'marketing_action', 'institutional_content', 'special_action'
  )),
  title text not null,
  cycle_start date,
  cycle_end date,
  status text not null default 'planned' check (status in ('planned', 'scheduled', 'delivered', 'canceled')),
  scheduled_for date,
  delivered_at timestamptz,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists company_plan_deliverables_business_idx on company_plan_deliverables (business_id, status);
alter table company_plan_deliverables enable row level security;

create table if not exists profile_claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  claimant_name text not null,
  claimant_email text not null,
  claimant_phone text,
  role_in_company text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now()
);
create index if not exists profile_claims_status_idx on profile_claims (status, created_at desc);
alter table profile_claims enable row level security;

-- ---------------------------------------------------------------------------------------------------------------
-- 5) Camada de BANCO: plano efetivo, valor de recurso e limites (espelham src/lib/plans/resolve.ts)
-- ---------------------------------------------------------------------------------------------------------------
create or replace function company_effective_plan(p_business uuid)
returns text
language plpgsql
stable
as $$
declare
  b record;
  grace integer;
  now_ts timestamptz := now();
  anchor timestamptz;
  base text;
  rank_base integer;
  rank_trial integer;
begin
  select plan, plan_status, plan_expires_at, plan_updated_at, plan_started_at, manual_override, trial_status, trial_plan, trial_ends_at
    into b from businesses where id = p_business;
  if not found then return 'presenca'; end if;

  select coalesce(plan_grace_days, 7) into grace from platform_settings limit 1;
  grace := coalesce(grace, 7);
  base := b.plan;

  if b.plan_status = 'suspended' then return 'presenca'; end if;

  if b.plan_status in ('pending', 'expired') then
    base := 'presenca';
  elsif b.plan_status = 'canceled' then
    if b.plan_expires_at is null or b.plan_expires_at <= now_ts then base := 'presenca'; end if;
  elsif not b.manual_override then
    anchor := b.plan_expires_at;
    if anchor is null and b.plan_status = 'past_due' then anchor := coalesce(b.plan_updated_at, b.plan_started_at); end if;
    if anchor is not null and (b.plan_status = 'past_due' or anchor <= now_ts) then
      if now_ts > anchor + make_interval(days => grace) then base := 'presenca'; end if;
    end if;
  end if;

  if b.trial_status = 'active' and b.trial_plan is not null and b.trial_ends_at is not null and b.trial_ends_at > now_ts then
    select rank into rank_trial from plans where key = b.trial_plan;
    select rank into rank_base from plans where key = base;
    if coalesce(rank_trial, 0) > coalesce(rank_base, 0) then base := b.trial_plan; end if;
  end if;

  return base;
end;
$$;

-- Valor do recurso: override ativo > plano efetivo. NULL = sem informacao (a aplicacao e a autoridade; o banco nao bloqueia).
create or replace function company_feature_value(p_business uuid, p_key text)
returns jsonb
language sql
stable
as $$
  select coalesce(
    (select o.value from company_feature_overrides o
      where o.business_id = p_business and o.feature_key = p_key
        and (o.starts_at is null or o.starts_at <= now()) and (o.expires_at is null or o.expires_at > now())),
    (select f.value from plan_features f where f.plan_key = company_effective_plan(p_business) and f.feature_key = p_key)
  );
$$;

-- Limite numerico (ilimitado = 1e9; recurso ligado = 1e9; desligado = 0; sem informacao = NULL).
create or replace function company_feature_limit(p_business uuid, p_key text)
returns numeric
language plpgsql
stable
as $$
declare v jsonb := company_feature_value(p_business, p_key);
begin
  if v is null then return null; end if;
  if jsonb_typeof(v) = 'number' then return (v #>> '{}')::numeric; end if;
  if jsonb_typeof(v) = 'boolean' then return case when (v #>> '{}')::boolean then 1000000000 else 0 end; end if;
  if jsonb_typeof(v) = 'string' and (v #>> '{}') = 'unlimited' then return 1000000000; end if;
  return null;
end;
$$;

-- Triggers: bloqueiam ATIVAR/INSERIR conteudo acima do limite. Editar item ja ativo e desativar sao sempre permitidos
-- (downgrade nao apaga nem trava conteudo existente: o excedente so deixa de ser publicado pela aplicacao).
create or replace function enforce_plan_limit_services() returns trigger language plpgsql as $$
declare lim numeric; used integer;
begin
  if new.active is not true then return new; end if;
  if tg_op = 'UPDATE' and old.active is true then return new; end if;
  lim := company_feature_limit(new.business_id, 'services');
  if lim is null then return new; end if;
  select count(*) into used from business_services where business_id = new.business_id and active = true and id <> new.id;
  if used >= lim then raise exception 'PLAN_LIMIT:services' using errcode = 'P0001'; end if;
  return new;
end;
$$;

create or replace function enforce_plan_limit_media() returns trigger language plpgsql as $$
declare lim numeric; used integer; fkey text;
begin
  if new.active is not true then return new; end if;
  if tg_op = 'UPDATE' and old.active is true and old.kind = new.kind then return new; end if;
  fkey := case when new.kind = 'video' then 'featured_videos' else 'gallery_images' end;
  lim := company_feature_limit(new.business_id, fkey);
  if lim is null then return new; end if;
  select count(*) into used from business_photos
    where business_id = new.business_id and active = true and kind = new.kind and id <> new.id;
  if used >= lim then raise exception 'PLAN_LIMIT:%', fkey using errcode = 'P0001'; end if;
  return new;
end;
$$;

create or replace function enforce_plan_limit_promotions() returns trigger language plpgsql as $$
declare lim numeric; used integer; coupons jsonb;
begin
  if new.coupon_code is not null and btrim(new.coupon_code) <> '' then
    coupons := company_feature_value(new.business_id, 'trackable_coupons');
    if coupons is not null and coupons <> 'true'::jsonb then raise exception 'PLAN_FEATURE:trackable_coupons' using errcode = 'P0001'; end if;
  end if;
  if new.active is not true or (new.valid_until is not null and new.valid_until < current_date) then return new; end if;
  if tg_op = 'UPDATE' and old.active is true and (old.valid_until is null or old.valid_until >= current_date) then return new; end if;
  lim := company_feature_limit(new.business_id, 'active_promotions');
  if lim is null then return new; end if;
  select count(*) into used from benefits
    where business_id = new.business_id and active = true and (valid_until is null or valid_until >= current_date) and id <> new.id;
  if used >= lim then raise exception 'PLAN_LIMIT:active_promotions' using errcode = 'P0001'; end if;
  return new;
end;
$$;

create or replace function enforce_plan_feature_faq() returns trigger language plpgsql as $$
declare v jsonb;
begin
  if new.active is not true then return new; end if;
  v := company_feature_value(new.business_id, 'faq');
  if v is not null and v <> 'true'::jsonb then raise exception 'PLAN_FEATURE:faq' using errcode = 'P0001'; end if;
  return new;
end;
$$;

create or replace function enforce_plan_feature_lead_forms() returns trigger language plpgsql as $$
declare v jsonb;
begin
  v := company_feature_value(new.business_id, 'lead_forms');
  if v is not null and v <> 'true'::jsonb then raise exception 'PLAN_FEATURE:lead_forms' using errcode = 'P0001'; end if;
  return new;
end;
$$;

drop trigger if exists business_services_plan_limit on business_services;
create trigger business_services_plan_limit before insert or update of active on business_services
  for each row execute function enforce_plan_limit_services();

drop trigger if exists business_photos_plan_limit on business_photos;
create trigger business_photos_plan_limit before insert or update of active, kind on business_photos
  for each row execute function enforce_plan_limit_media();

drop trigger if exists benefits_plan_limit on benefits;
create trigger benefits_plan_limit before insert or update of active, valid_until, coupon_code on benefits
  for each row execute function enforce_plan_limit_promotions();

drop trigger if exists business_faqs_plan_feature on business_faqs;
create trigger business_faqs_plan_feature before insert or update of active on business_faqs
  for each row execute function enforce_plan_feature_faq();

drop trigger if exists business_leads_plan_feature on business_leads;
create trigger business_leads_plan_feature before insert on business_leads
  for each row execute function enforce_plan_feature_lead_forms();

-- Nenhuma funcao interna fica exposta a anon/authenticated.
revoke all on function company_effective_plan(uuid) from public, anon, authenticated;
revoke all on function company_feature_value(uuid, text) from public, anon, authenticated;
revoke all on function company_feature_limit(uuid, text) from public, anon, authenticated;
