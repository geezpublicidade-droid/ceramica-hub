-- Rate limiting de login sem depender de servico externo (Upstash/Redis):
-- cada tentativa fica registrada aqui, e authorize() em src/auth.ts consulta
-- as tentativas recentes por identifier (role:email) antes de checar a senha.
-- Sem indice de limpeza automatica por enquanto -- volume esperado e baixo
-- (diretorio de negocios local, nao um produto de massa).
create table if not exists login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  ip text,
  success boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists login_attempts_identifier_idx on login_attempts (identifier, created_at);

alter table login_attempts enable row level security;
