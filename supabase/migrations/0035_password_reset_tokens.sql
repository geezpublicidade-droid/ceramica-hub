-- "Esqueci minha senha" pro login de empresa. Guarda só o hash do token
-- (sha256), nunca o token em texto puro -- mesmo raciocínio de nunca
-- guardar senha em texto puro. Token de uso único, expira em 1h.
create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_business_id_idx on password_reset_tokens(business_id);
create index if not exists password_reset_tokens_token_hash_idx on password_reset_tokens(token_hash);
