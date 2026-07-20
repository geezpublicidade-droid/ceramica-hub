-- Visita virtual 360 auto-hospedada: cada cena e uma foto panoramica (equirretangular)
-- que a propria empresa envia; navegacao entre cenas por lista, sem depender de
-- servico externo (Matterport etc). Exclusivo do plano Experiencia.
create table if not exists virtual_tour_scenes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  label text not null,
  image_url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table virtual_tour_scenes enable row level security;

insert into storage.buckets (id, name, public)
values ('virtual-tour', 'virtual-tour', true)
on conflict (id) do nothing;
