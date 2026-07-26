-- Canal de noticias: agregador automatico (RSS), nunca reproduz o texto
-- completo -- so titulo/resumo/fonte, sempre linkando pro site de origem.
-- `link` e o dedup key (mesma noticia nao entra duas vezes a cada fetch).
create table if not exists news_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  link text not null unique,
  excerpt text,
  source_name text,
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

create index if not exists news_items_published_at_idx on news_items(published_at desc);
