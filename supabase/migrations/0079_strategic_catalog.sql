-- Catálogo comercial do Resumo Estratégico (out/2026). Só preenche o que não existe:
-- valores na ponta baixa das faixas do documento, editáveis em /admin/produtos.
-- Preços dos planos NÃO mudam (decisão do usuário: manter 79/147/297/497).
insert into products (slug, name, category, billing_type, monthly_price_cents, yearly_price_cents, sort_order, description) values
  ('ancora-fundadora', 'Âncora Fundadora', 'patrocinio', 'anual', null, 2000000, 61,
   'Contrato anual, 7 cotas. Entrada antecipada R$ 20.000/ano (tabela R$ 25.000). Preço não é exibido no site: proposta individual.'),
  ('presenca-institucional', 'Presença Institucional na Home', 'patrocinio', 'mensal', 39000, 390000, 62,
   'Logo na faixa de marcas da home (máx. 10), sem o título de Âncora.'),
  ('capa-hero-7d', 'Destaque de capa — 7 dias', 'publicidade', 'unico', 150000, null, 70, 'Slide 2 ou 3 do hero. Faixa do documento: R$ 1.500–2.000.'),
  ('capa-hero-15d', 'Destaque de capa — 15 dias', 'publicidade', 'unico', 250000, null, 71, 'Faixa do documento: R$ 2.500–3.500.'),
  ('capa-hero-30d', 'Destaque de capa — 30 dias', 'publicidade', 'unico', 400000, null, 72, 'Faixa do documento: R$ 4.000–5.500.'),
  ('capa-campanha-especial', 'Campanha especial + capa + conteúdo', 'publicidade', 'unico', 500000, null, 73, 'Faixa do documento: R$ 5.000–7.500.'),
  ('ativacao-simples', 'Ativação simples (1 dia)', 'servico_adicional', 'unico', 250000, null, 80, 'Faixa: R$ 2.500–4.000. Custos de produção fora da cota.'),
  ('ativacao-premium', 'Ação premium / evento', 'servico_adicional', 'unico', 500000, null, 81, 'Faixa: R$ 5.000–8.000. Custos de produção fora da cota.'),
  ('campanha-digital-ativacao', 'Campanha digital + ativação', 'servico_adicional', 'unico', 600000, null, 82, 'Faixa: R$ 6.000–10.000.'),
  ('loja-destaque-ancora', 'Loja em Destaque (subecossistema)', 'publicidade', 'mensal', 19700, 197000, 90,
   'Loja de uma Âncora (ex.: Shopping). Faixa R$ 197–297/mês. Só aparece com autorização da Âncora.')
on conflict (slug) do nothing;
