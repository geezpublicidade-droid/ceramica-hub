-- businesses.updated_at existe desde 0001_init.sql mas nunca é escrito em
-- UPDATE (só o INSERT usa o default). Necessário pro rótulo "Atualizado em"
-- e pro critério "conteúdo atualizado recentemente" do índice de presença
-- do painel (src/lib/services/presence-score.ts).
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists businesses_set_updated_at on businesses;
create trigger businesses_set_updated_at
  before update on businesses
  for each row
  execute function set_updated_at();
