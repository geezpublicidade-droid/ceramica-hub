-- Fase 5.2: programa de indicações (empresa indica empresa, membro indica empresa).
-- Cada empresa e cada membro ganha um código; quem se cadastra pelo link fica registrado em `referrals`.
-- A recompensa é combinada pelo admin (texto livre) e marcada como concedida à mão.

alter table businesses add column if not exists referral_code text unique default upper(substr(md5(gen_random_uuid()::text), 1, 8));
alter table members add column if not exists referral_code text unique default upper(substr(md5(gen_random_uuid()::text), 1, 8));

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_type text not null check (referrer_type in ('business', 'member')),
  referrer_id uuid not null,
  referred_business_id uuid not null unique references businesses(id) on delete cascade,
  status text not null default 'cadastrada' check (status in ('cadastrada', 'convertida')),
  reward_status text not null default 'nenhuma' check (reward_status in ('nenhuma', 'pendente', 'concedida')),
  reward_note text,
  created_at timestamptz not null default now(),
  converted_at timestamptz,
  rewarded_at timestamptz
);

create index if not exists referrals_referrer_idx on referrals (referrer_type, referrer_id);

alter table referrals enable row level security;
