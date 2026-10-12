-- Páginas das Âncoras (spec: Shopping = Âncora + página própria + categorias +
-- Lojas em Destaque autorizadas). Campos institucionais, publicações da página
-- (eventos, experiências, novidades) e 4 Âncoras DE DEMONSTRAÇÃO para o
-- comercial mostrar como a página fica. Demo = is_demo: ganha faixa
-- "simulação comercial", noindex e fora do sitemap.

alter table institutional_partners add column if not exists is_demo boolean not null default false;
alter table institutional_partners add column if not exists tagline text;
alter table institutional_partners add column if not exists about text;
alter table institutional_partners add column if not exists address text;
alter table institutional_partners add column if not exists opening_hours text;
alter table institutional_partners add column if not exists directions_url text;
alter table institutional_partners add column if not exists whatsapp text;

create table if not exists anchor_posts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references institutional_partners(id) on delete cascade,
  kind text not null check (kind in ('evento', 'experiencia', 'novidade')),
  title text not null,
  body text,
  happens_on date,
  image_url text,
  link text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists anchor_posts_partner_idx on anchor_posts (partner_id, active, kind);
alter table anchor_posts enable row level security;
revoke all on anchor_posts from anon, authenticated;

-- ---- Âncoras de demonstração -------------------------------------------

-- Shopping São Caetano já existia como rascunho: vira demonstração publicada.
update institutional_partners set
  status = 'ativo', is_demo = true, has_page = true, sort_order = 1,
  logo_url = '/images/anchors/shopping-sao-caetano.svg',
  cover_url = '/images/ceramica-hub-eventos.webp',
  tagline = 'Compras, gastronomia, serviços e lazer a poucos passos do Complexo Cerâmica.',
  about = 'O Shopping São Caetano é a maior vitrine de varejo e serviços da região e, como Âncora Fundadora do Cerâmica Hub, reúne em um só lugar as lojas, os eventos e as novidades para quem trabalha, mora e circula pelo Complexo. Nesta página, o Shopping define o que aparece e o Cerâmica Hub opera: cards, materiais, mensuração e campanhas.',
  address = 'Alameda Terracota, s/n — Cerâmica, São Caetano do Sul/SP (endereço ilustrativo)',
  opening_hours = 'Seg a sáb, 10h às 22h · Dom e feriados, 14h às 20h (ilustrativo)',
  directions_url = 'https://www.google.com/maps/search/?api=1&query=Sao+Caetano+do+Sul',
  authorization_note = 'PÁGINA DE DEMONSTRAÇÃO COMERCIAL — conteúdo ilustrativo, sem autorização formal do parceiro. Não divulgar como parceria fechada.',
  description = 'Lojas e serviços do Shopping São Caetano, Âncora Fundadora do Cerâmica Hub.'
where slug = 'shopping-sao-caetano';

insert into institutional_partners (name, partnership_type, tier, status, slug, has_page, is_demo, sort_order, logo_url, cover_url, tagline, about, address, opening_hours, directions_url, description, authorization_note)
select * from (values
  ('Hospital Modelo', 'Âncora — saúde', 'ancora_fundadora', 'ativo', 'hospital-modelo', true, true, 2,
   '/images/anchors/hospital-modelo.svg', '/images/ceramica-hub-corporativo.webp',
   'Especialidades, exames e pronto atendimento para as empresas e pessoas do Complexo.',
   'Exemplo de página de Âncora do setor de saúde: o hospital apresenta especialidades, exames e serviços, e o Cerâmica Hub opera os cards, mede as visualizações e organiza as campanhas — o hospital aprova, o Hub executa.',
   'Av. Exemplo, 1000 — São Caetano do Sul/SP (ilustrativo)', 'Pronto atendimento 24h · Ambulatório seg a sex, 7h às 19h (ilustrativo)',
   'https://www.google.com/maps/search/?api=1&query=Sao+Caetano+do+Sul', 'Modelo de página de Âncora — saúde.',
   'PÁGINA DE DEMONSTRAÇÃO COMERCIAL — marca fictícia para simulação.'),
  ('Grand Hotel Modelo', 'Âncora — hotelaria', 'parceiro_premium', 'ativo', 'hotel-modelo', true, true, 3,
   '/images/anchors/hotel-modelo.svg', '/images/ceramica-hero-3.jpg',
   'Hospedagem, restaurante e eventos corporativos ao lado das torres.',
   'Exemplo de página de Âncora de hotelaria: hospedagem para quem visita as empresas do Complexo, restaurante, salões para eventos e spa, tudo com o mesmo modelo de governança — o hotel aprova, o Cerâmica Hub opera.',
   'Rua Exemplo, 200 — São Caetano do Sul/SP (ilustrativo)', 'Recepção 24h · Restaurante diariamente, 6h às 23h (ilustrativo)',
   'https://www.google.com/maps/search/?api=1&query=Sao+Caetano+do+Sul', 'Modelo de página de Âncora — hotelaria.',
   'PÁGINA DE DEMONSTRAÇÃO COMERCIAL — marca fictícia para simulação.'),
  ('Academia Modelo', 'Âncora — bem-estar', 'presenca_institucional', 'ativo', 'academia-modelo', true, true, 4,
   '/images/anchors/academia-modelo.svg', '/images/ceramica-hero-2.jpg',
   'Modalidades, planos corporativos e bem-estar para quem trabalha no Complexo.',
   'Exemplo de página de Âncora de bem-estar: modalidades, aulas e planos para empresas do Complexo, com cards operados pelo Cerâmica Hub e aprovados pela academia.',
   'Rua Exemplo, 300 — São Caetano do Sul/SP (ilustrativo)', 'Seg a sex, 5h30 às 23h · Sáb, 8h às 14h (ilustrativo)',
   'https://www.google.com/maps/search/?api=1&query=Sao+Caetano+do+Sul', 'Modelo de página de Âncora — bem-estar.',
   'PÁGINA DE DEMONSTRAÇÃO COMERCIAL — marca fictícia para simulação.')
) as v(name, partnership_type, tier, status, slug, has_page, is_demo, sort_order, logo_url, cover_url, tagline, about, address, opening_hours, directions_url, description, authorization_note)
where not exists (select 1 from institutional_partners p where p.slug = v.slug);

-- ---- Lojas / serviços ---------------------------------------------------
-- (nome, segmento, andar, descrição, destaque pago?) -- nomes fictícios.
with data(slug, name, segment, floor, description, highlighted, ord) as (values
  ('shopping-sao-caetano', 'Atelier Aurora', 'Moda', 'Piso L1', 'Moda feminina e acessórios com curadoria de marcas autorais.', true, 1),
  ('shopping-sao-caetano', 'Café Vila Nova', 'Gastronomia', 'Piso L1', 'Cafeteria com cafés especiais, brunch e espaço para reuniões rápidas.', true, 2),
  ('shopping-sao-caetano', 'Forno & Fogo', 'Gastronomia', 'Piso L3', 'Pizzaria de forno a lenha, almoço executivo e happy hour.', true, 3),
  ('shopping-sao-caetano', 'Espaço Pele Viva', 'Saúde & Beleza', 'Piso L2', 'Estética facial e corporal, com avaliação gratuita.', true, 4),
  ('shopping-sao-caetano', 'Studio Fio de Ouro', 'Saúde & Beleza', 'Piso L2', 'Salão de beleza: cabelo, unhas e maquiagem.', true, 5),
  ('shopping-sao-caetano', 'Game Hub Arena', 'Entretenimento', 'Piso L3', 'Arena de jogos, realidade virtual e festas.', true, 6),
  ('shopping-sao-caetano', 'Casa Linho', 'Moda', 'Piso L1', 'Moda casual e básicos de algodão e linho.', false, 7),
  ('shopping-sao-caetano', 'Studio Maré Kids', 'Moda', 'Piso L2', 'Roupas infantis confortáveis e resistentes.', false, 8),
  ('shopping-sao-caetano', 'Cantina Bela Mesa', 'Gastronomia', 'Piso L3', 'Massas frescas e pratos para dividir.', false, 9),
  ('shopping-sao-caetano', 'Ótica Horizonte', 'Serviços', 'Piso L1', 'Óculos de grau e solar, exame de vista no local.', false, 10),
  ('shopping-sao-caetano', 'Lavanderia Express', 'Serviços', 'Piso G1', 'Lavagem e passadoria em até 24 horas.', false, 11),
  ('shopping-sao-caetano', 'Lar Contemporâneo', 'Casa & Decoração', 'Piso L2', 'Decoração, utilidades e presentes para a casa.', false, 12),
  ('shopping-sao-caetano', 'CineArte', 'Entretenimento', 'Piso L3', 'Salas de cinema com sessões de estreia e clássicos.', false, 13),
  ('hospital-modelo', 'Cardiologia', 'Especialidades', 'Ambulatório A', 'Check-up cardiológico, ecocardiograma e teste ergométrico.', true, 1),
  ('hospital-modelo', 'Ortopedia e Traumatologia', 'Especialidades', 'Ambulatório B', 'Coluna, joelho, ombro e reabilitação.', true, 2),
  ('hospital-modelo', 'Diagnóstico por Imagem', 'Exames', 'Térreo', 'Ressonância, tomografia, ultrassom e raio-X.', true, 3),
  ('hospital-modelo', 'Check-up Executivo', 'Exames', 'Ambulatório A', 'Bateria completa de exames em uma manhã, para empresas do Complexo.', true, 4),
  ('hospital-modelo', 'Pediatria', 'Especialidades', 'Ambulatório C', 'Atendimento pediátrico com agendamento online.', false, 5),
  ('hospital-modelo', 'Pronto Atendimento 24h', 'Urgência', 'Térreo', 'Atendimento de urgência e emergência.', false, 6),
  ('hotel-modelo', 'Suítes Executivas', 'Hospedagem', 'Torre Hotel', 'Suítes com área de trabalho e tarifa corporativa para empresas do Complexo.', true, 1),
  ('hotel-modelo', 'Restaurante Vista', 'Gastronomia', 'Térreo', 'Almoço executivo e jantar com vista para as torres.', true, 2),
  ('hotel-modelo', 'Salões de Eventos', 'Eventos', 'Mezanino', 'Salões para reuniões, treinamentos e confraternizações.', true, 3),
  ('hotel-modelo', 'Spa e Bem-estar', 'Bem-estar', 'Cobertura', 'Massagens, sauna e piscina aquecida.', false, 4),
  ('academia-modelo', 'Musculação', 'Modalidades', 'Piso 1', 'Equipamentos modernos e acompanhamento de instrutores.', true, 1),
  ('academia-modelo', 'Aulas Funcionais', 'Modalidades', 'Piso 2', 'Treinos em grupo de alta intensidade, em horários flexíveis.', true, 2),
  ('academia-modelo', 'Plano Corporativo', 'Planos', 'Recepção', 'Condições especiais para as empresas do Complexo e seus times.', true, 3),
  ('academia-modelo', 'Pilates', 'Modalidades', 'Piso 2', 'Aulas de Pilates solo e aparelhos.', false, 4),
  ('academia-modelo', 'Natação', 'Modalidades', 'Piso -1', 'Piscina semiolímpica aquecida.', false, 5)
)
insert into anchor_stores (partner_id, name, segment, floor, description, highlight_paid_until, highlight_value_cents, sort_order)
select p.id, d.name, d.segment, d.floor, d.description,
       case when d.highlighted then date '2027-12-31' end,
       case when d.highlighted then 19700 end,
       d.ord
from data d
join institutional_partners p on p.slug = d.slug
where not exists (select 1 from anchor_stores s where s.partner_id = p.id and s.name = d.name);

-- ---- Eventos, experiências e novidades -----------------------------------
with data(slug, kind, title, body, happens_on, image_url, ord) as (values
  ('shopping-sao-caetano', 'evento', 'Feira de Negócios Locais', 'Empresas do Complexo e lojistas do Shopping reunidos em um dia de networking e ofertas.', date '2026-11-14', '/images/ceramica-hub-eventos.webp', 1),
  ('shopping-sao-caetano', 'evento', 'Black Friday do Complexo', 'Condições especiais para quem trabalha no Cerâmica, com cupom do Hub.', date '2026-11-27', '/images/ceramica-hero-3.jpg', 2),
  ('shopping-sao-caetano', 'experiencia', 'Happy hour dos lojistas', 'Encontro mensal na praça de alimentação com música ao vivo.', null, '/images/ceramica-hub-gastronomia.webp', 3),
  ('shopping-sao-caetano', 'experiencia', 'Almoço executivo no Shopping', 'Menu fechado com preço especial para quem apresenta o cadastro do Hub.', null, '/images/ceramica-hub-gastronomia.webp', 4),
  ('shopping-sao-caetano', 'novidade', 'Nova ala de gastronomia no Piso L3', 'Três novos restaurantes chegam ao terceiro piso até o fim do ano.', date '2026-10-05', '/images/ceramica-hero-1.jpg', 5),
  ('shopping-sao-caetano', 'novidade', 'Estacionamento com desconto para o Complexo', 'Empresas cadastradas no Cerâmica Hub ganham tarifa reduzida.', date '2026-09-20', '/images/ceramica-hero-4.jpg', 6),
  ('hospital-modelo', 'evento', 'Semana de prevenção para empresas', 'Palestras e exames rápidos para os times do Complexo.', date '2026-11-10', '/images/ceramica-hub-eventos.webp', 1),
  ('hospital-modelo', 'novidade', 'Novo equipamento de ressonância', 'Exames mais rápidos e confortáveis a partir de novembro.', date '2026-10-08', '/images/ceramica-hub-corporativo.webp', 2),
  ('hotel-modelo', 'evento', 'Brunch de networking', 'Café da manhã de negócios para executivos das torres.', date '2026-11-05', '/images/ceramica-hub-eventos.webp', 1),
  ('hotel-modelo', 'experiencia', 'Pacote reunião + almoço', 'Sala de reunião e almoço para até 12 pessoas em um valor fechado.', null, '/images/ceramica-hub-corporativo.webp', 2),
  ('academia-modelo', 'evento', 'Desafio 30 dias', 'Desafio de condicionamento em grupo entre as empresas do Complexo.', date '2026-11-03', '/images/ceramica-hero-2.jpg', 1),
  ('academia-modelo', 'novidade', 'Aula experimental gratuita', 'Funcionários das empresas cadastradas ganham uma semana grátis.', date '2026-10-01', '/images/ceramica-hero-2.jpg', 2)
)
insert into anchor_posts (partner_id, kind, title, body, happens_on, image_url, sort_order)
select p.id, d.kind, d.title, d.body, d.happens_on, d.image_url, d.ord
from data d
join institutional_partners p on p.slug = d.slug
where not exists (select 1 from anchor_posts a where a.partner_id = p.id and a.title = d.title);

-- ---- Contrato e entregas (área administrativa de demonstração) ------------
insert into anchor_contracts (partner_id, starts_on, ends_on, value_cents, status, notes)
select p.id, date '2026-10-01', date '2027-09-30',
       case p.slug when 'shopping-sao-caetano' then 2000000 when 'hospital-modelo' then 2000000 when 'hotel-modelo' then 1200000 else 390000 end,
       'ativo', 'Contrato de demonstração.'
from institutional_partners p
where p.slug in ('shopping-sao-caetano', 'hospital-modelo', 'hotel-modelo', 'academia-modelo')
  and not exists (select 1 from anchor_contracts c where c.partner_id = p.id);

with data(title, due_on, done) as (values
  ('Logo no carrossel da home (12 meses)', date '2026-10-01', true),
  ('Página própria publicada', date '2026-10-15', true),
  ('Selo "Parceiro Fundador" ativo', date '2026-10-15', true),
  ('Conteúdo editorial do trimestre', date '2026-12-15', false),
  ('Ativação em evento do Complexo', date '2027-02-15', false),
  ('Relatório de exposição, cliques e interação', date '2027-03-31', false)
)
insert into anchor_deliverables (contract_id, title, due_on, status, delivered_on)
select c.id, d.title, d.due_on, case when d.done then 'realizada' else 'pendente' end, case when d.done then d.due_on end
from anchor_contracts c
join institutional_partners p on p.id = c.partner_id and p.is_demo
cross join data d
where not exists (select 1 from anchor_deliverables x where x.contract_id = c.id);
