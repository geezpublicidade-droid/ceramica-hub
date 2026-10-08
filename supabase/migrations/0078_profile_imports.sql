-- Importacao de perfil (Google) e rascunho completo do wizard de cadastro.
-- Guarda o que a empresa informou/importou alem do que o plano permite exibir hoje, para aplicar
-- depois (upgrade de plano, "Aplicar ao perfil"). RLS ligado sem policy: so o servidor acessa.

create table if not exists business_profile_imports (
  business_id uuid primary key references businesses(id) on delete cascade,
  -- de onde veio: wizard (preenchido a mao) ou google (importado)
  source text not null default 'wizard' check (source in ('wizard', 'google')),
  google_place_id text,
  google_maps_url text,
  -- ProfileDraft completo (src/lib/profile/draft.ts)
  payload jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table business_profile_imports enable row level security;
revoke all on business_profile_imports from anon, authenticated;
