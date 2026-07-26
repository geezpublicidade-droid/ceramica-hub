-- Blog editorial do Cerâmica Hub -- conteúdo autoral do admin, traduzido
-- via content_translations (mesmo padrão de benefícios/promoções).
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  cover_image_url text,
  author_name text not null default 'Cerâmica Hub',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_published_idx on blog_posts(status, published_at desc);
