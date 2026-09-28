-- Expande os papéis internos do admin: além de super_admin/admin/financeiro/
-- comercial/moderador (migration 0019), a central de operação nova precisa
-- de marketing (campanhas/e-mail/conteúdo editorial), conteudo (blog/eventos/
-- avaliações), atendimento (suporte) e analista (só leitura de resultados).
alter table admins drop constraint if exists admins_role_check;
alter table admins add constraint admins_role_check
  check (role in ('super_admin', 'admin', 'financeiro', 'comercial', 'moderador', 'marketing', 'conteudo', 'atendimento', 'analista'));
