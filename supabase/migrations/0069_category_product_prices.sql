-- Preços iniciais das posições de destaque por categoria (editáveis em /admin/produtos).
-- Só preenche quando o preço ainda está em branco, então nunca sobrescreve valor definido pelo admin.
-- Referência: planos de R$ 79 a R$ 497 e mídia de capa da home a R$ 4.000; anual = 10x o mensal (2 meses de desconto, como nos planos).
update products set monthly_price_cents = 69000, yearly_price_cents = 690000
  where slug = 'categoria-lider' and monthly_price_cents is null;
update products set monthly_price_cents = 39000, yearly_price_cents = 390000
  where slug = 'categoria-premium' and monthly_price_cents is null;
update products set monthly_price_cents = 19000, yearly_price_cents = 190000
  where slug = 'categoria-destaque' and monthly_price_cents is null;
