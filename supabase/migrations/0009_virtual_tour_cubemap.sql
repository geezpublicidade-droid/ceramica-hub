-- Suporta cenas em cubemap (6 faces), alem da foto unica equirretangular padrao.
-- Usado pros scans com scanner dedicado (ex: sala da propria Geez); o fluxo de
-- self-service dos clientes (upload de 1 foto panoramica) continua so equirectangular.
alter table virtual_tour_scenes
  add column if not exists kind text not null default 'equirectangular'
    check (kind in ('equirectangular', 'cubemap')),
  add column if not exists cubemap_urls text[],
  alter column image_url drop not null;
