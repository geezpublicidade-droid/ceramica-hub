-- Fase 5.3: clube de benefícios. Cada cupom revelado por um membro vira uma linha em `coupon_claims`,
-- com um token único (vai no QR Code). A empresa valida o token no balcão e o cupom passa a "utilizado".
-- `benefits.max_total_uses` limita quantos cupons podem ser emitidos (null = ilimitado).

alter table benefits add column if not exists max_total_uses integer check (max_total_uses is null or max_total_uses > 0);

create table if not exists coupon_claims (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references benefits(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  status text not null default 'revelado' check (status in ('revelado', 'utilizado')),
  claimed_at timestamptz not null default now(),
  used_at timestamptz,
  unique (benefit_id, member_id)
);

create index if not exists coupon_claims_business_idx on coupon_claims (business_id, claimed_at desc);
create index if not exists coupon_claims_member_idx on coupon_claims (member_id, claimed_at desc);

alter table coupon_claims enable row level security;

-- Cupons já revelados antes desta migration entram como "revelado" (histórico do membro continua igual).
insert into coupon_claims (benefit_id, member_id, business_id, claimed_at)
select distinct on (benefit_id, member_id) benefit_id, member_id, business_id, claimed_at
from (
  select
    (e.metadata->>'benefitId')::uuid as benefit_id,
    (e.metadata->>'memberId')::uuid as member_id,
    e.business_id,
    e.created_at as claimed_at
  from metrics_events e
  where e.event_type = 'coupon_redeemed'
    and e.business_id is not null
    and e.metadata->>'benefitId' ~ '^[0-9a-f-]{36}$'
    and e.metadata->>'memberId' ~ '^[0-9a-f-]{36}$'
) events
where exists (select 1 from benefits b where b.id = events.benefit_id)
  and exists (select 1 from members m where m.id = events.member_id)
order by benefit_id, member_id, claimed_at asc
on conflict (benefit_id, member_id) do nothing;
