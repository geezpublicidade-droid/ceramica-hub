-- URL amigavel: /empresa/nome-da-empresa em vez de /empresa/<uuid>.
-- Tabela businesses esta vazia no momento desta migration (dados ficticios
-- ja removidos), entao nao ha necessidade de backfill.
alter table businesses add column if not exists slug text unique;

comment on column businesses.slug is 'Slug publico usado em /empresa/[slug]. Gerado no cadastro a partir do nome, com sufixo numerico em caso de colisao.';
