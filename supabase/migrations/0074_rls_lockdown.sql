-- Auditoria de seguranca: 5 tabelas (blog_posts, partner_leads, institutional_partners,
-- password_reset_tokens, news_items) estavam com RLS desligado e legiveis pela chave anonima.
-- O app so acessa o banco pelo servidor com service_role (bypassa RLS), entao o fechamento e seguro.

-- 1) RLS ligado em TODA tabela do schema public que ainda estiver sem (deny-all sem policy).
do $$
declare t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security', t.relname);
    raise notice 'RLS ligado em %', t.relname;
  end loop;
end $$;

-- 2) Defesa em profundidade: papeis publicos do Supabase nao precisam de privilegio nenhum aqui.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- 3) Tabelas/funcoes criadas no futuro tambem nascem sem acesso para anon/authenticated.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
