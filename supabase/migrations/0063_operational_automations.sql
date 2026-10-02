-- Fase 4.4: automações operacionais. Tarefas criadas por regra ficam marcadas em
-- tasks.auto_rule; a chave única (auto_rule, entity_id) garante uma tarefa por
-- regra e entidade, mesmo que o cron rode várias vezes ou a tarefa seja concluída
-- (NULL nunca conflita, então tarefas manuais não são afetadas).
alter table tasks add column if not exists auto_rule text;
create unique index if not exists tasks_auto_rule_entity_idx on tasks (auto_rule, entity_id);

-- Empresas aprovadas há mais de p_days sem nenhuma visita à página comercial na janela.
create or replace function inactive_business_ids(p_days integer)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select b.id
  from businesses b
  where b.status = 'approved'
    and b.created_at < now() - make_interval(days => p_days)
    and not exists (
      select 1 from metrics_events e
      where e.business_id = b.id
        and e.event_type = 'commercial_page_viewed'
        and e.created_at >= now() - make_interval(days => p_days)
    );
$$;

revoke all on function inactive_business_ids(integer) from public, anon, authenticated;
grant execute on function inactive_business_ids(integer) to service_role;

notify pgrst, 'reload schema';
