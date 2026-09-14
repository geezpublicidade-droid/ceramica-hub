-- Forum de Negocios / agenda de eventos B2B (masterplan 2026-2030, pilar --
-- "Comunidade" -- Q3 do calendario de ativacao: "Forum de negocios, agenda
-- B2B e acoes com ancoras"). Mesmo padrao de hotels/meeting_spaces: curado
-- pelo admin, sem inscricao automatica (link externo ou WhatsApp), status
-- simples draft/active/inactive. Ordenado por data (starts_at), nao por
-- sort_order manual -- eventos ja tem ordem natural cronologica.
create table if not exists business_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null default 'forum_negocios' check (event_type in ('forum_negocios', 'workshop', 'networking', 'outro')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  cover_photo_url text,
  registration_link text,
  whatsapp text,
  capacity int,
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_events_status_starts_at_idx on business_events(status, starts_at);
