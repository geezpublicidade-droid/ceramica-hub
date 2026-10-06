# Planejamento — outros layouts da landing da empresa

Hoje existe **um** layout (referência: "Sorriso Cerâmica", clínica). Ele funciona bem para quem **vende serviços com agendamento**
(saúde, estética, beleza). Outras empresas do Hub vendem de outro jeito, e a página precisa refletir isso sem virar uma página
feita à mão para cada cliente. Este documento propõe como crescer a partir do que já foi construído.

## Princípio: um motor, vários layouts

Não duplicamos páginas. O motor atual (`LandingPageEmpresa`, `business_landing`, editor de 11 abas, métricas, leads) continua único.
Um **layout** (template) é só uma configuração que decide:

1. **Quais seções existem e em que ordem** (padrão do layout; a empresa ainda pode reordenar/ocultar).
2. **Variante de cada seção** (ex.: "Serviços" vira "Cardápio", com grupos e preços).
3. **Microcopy** (Serviços → Cardápio / Produtos / Áreas de atuação; "Agendar" → "Pedir" / "Falar com especialista").
4. **Variante do hero** (dividido, imagem total, centrado) e **ação principal** (WhatsApp, pedido, formulário de diagnóstico).

Escolha do layout: coluna `template` em `business_landing` (padrão derivado da categoria). A empresa troca no editor (aba "Hero e
identidade visual") com pré-visualização; o admin pode forçar um layout.

## Catálogo proposto

| Layout | Para quem | Categorias do Hub (padrão) | Ação principal |
|---|---|---|---|
| **Serviços** (atual) | saúde, estética, beleza, laboratório | `saude-e-estetica`, `laboratorio`, `moda-e-beleza` (serviços) | Agendar pelo WhatsApp |
| **Gastronomia** | restaurantes, cafés, padarias, delivery | `alimentacao` | Pedir / reservar |
| **Varejo** | lojas, moda, produtos | `moda-e-beleza` (loja), `outros` | Falar com a loja / ver produto |
| **Corporativo (B2B)** | contabilidade, jurídico, tecnologia, arquitetura, investimentos | `contabilidade-e-juridico`, `direito`, `tecnologia-e-marketing`, `design-e-arquitetura`, `investimentos` | Pedir diagnóstico / proposta |
| **Educação** | escolas, cursos, treinamentos | `educacao` | Matrícula / aula experimental |
| **Essencial** | plano gratuito e quem quer o mínimo | todas, no plano Gratuito | WhatsApp |

Imobiliárias e hotéis seguem com as páginas próprias que já existem (não entram neste catálogo).

## O que muda em cada layout

**Gastronomia**
- Hero: foto grande de prato/ambiente, **"Aberto agora" em destaque**, botão **Pedir pelo WhatsApp** + links de delivery (iFood, 99Food, Keeta, link próprio).
- **Cardápio** em vez de Serviços: itens agrupados (Entradas, Pratos, Sobremesas, Bebidas), preço sempre visível, selos (vegano, sem glúten, mais pedido), foto por item.
- Faixa de horários por dia logo abaixo do hero; bloco de **reserva** (formulário de lead com nº de pessoas e horário).
- Galeria de pratos; avaliações; localização com estacionamento/acessibilidade (já existem).

**Varejo**
- Hero com **coleção/oferta da semana**; barra "Retire na loja / Entrega / Trocas".
- **Produtos** em grade com preço, "de/por", selo de novidade/promoção; clique abre WhatsApp com o produto (mesmo mecanismo de hoje).
- Seção de **marcas** e de **ofertas** (a oferta atual já existe; passa a aceitar várias).
- Sem agendamento; foco em "chamar a loja" e "como chegar".

**Corporativo (B2B)**
- Hero sóbrio, proposta de valor + botão **Pedir diagnóstico** (abre o formulário de lead, não só WhatsApp).
- Seções novas: **Áreas de atuação** (variante de Serviços, sem preço), **Números** (anos, clientes, projetos), **Como trabalhamos** (3–4 passos), **Equipe** (foto, cargo, registro profissional), **Casos/resultados**.
- Avaliações viram **depoimentos de clientes** (nome, empresa); registro profissional (OAB/CRC/CREA) na barra de confiança — já suportado.
- Atenção a regras de publicidade profissional (OAB, CFC): sem promessa de resultado e sem oferta com desconto onde for vedado.

**Educação**
- **Cursos/turmas** (nome, carga horária, dias/horários, vagas), **Professores**, **Metodologia/diferenciais**, valores opcionais, **Aula experimental / matrícula** (formulário).
- FAQ em destaque (mensalidade, bolsa, material); localização com acessibilidade.

**Essencial (gratuito)**
- Uma coluna enxuta: logo, nome, categoria, andar/sala, descrição, WhatsApp, telefone, Instagram, localização/horário. Sem galeria, FAQ nem formulário — é o "degrau" que mostra o valor dos planos pagos.

## Mudanças técnicas

**Dados (migration aditiva, sem tocar no que existe)**
- `business_landing.template text` (enum de CHECK) e `hero_variant text`.
- `business_services`: `group_label` (grupo do cardápio/catálogo), `badge`, `old_price` (para "de/por"), `external_url` (link do item).
- `business_landing.order_links jsonb` (iFood etc., validados como https) e `stats jsonb` (números do bloco "Números").
- Tabelas novas: `business_team_members` (nome, cargo, registro, foto, ordem), `business_cases` (título, resumo, resultado, imagem), `business_steps` (passos do "Como trabalhamos"). Todas com RLS ligado e filtradas por `business_id` como as atuais.

**Código**
- `src/lib/landing/templates.ts`: registro `TEMPLATES` (seções padrão, variantes, microcopy, hero, ação principal) + função `templateForCategory()`. Pura e testada.
- Seções por variante: `ServicesSection` ganha `variant: "cards" | "menu" | "products" | "areas" | "courses"`; novas `StatsBar`, `TeamSection`, `CasesSection`, `ProcessSection`, `ReservationBlock`, `OrderLinks`.
- Editor: aba "Hero e identidade visual" ganha o seletor de layout; abas novas aparecem só quando o layout usa (Equipe, Casos, Passos, Cardápio com grupos).
- i18n: textos por layout em `LandingEmpresa.templates.<layout>` (pt e en; es/zh caem para pt).
- Métricas: sem mudança (os mesmos eventos), mais `order_clicked` para links de delivery.

**Planos**: Essencial = Gratuito; Serviços/Gastronomia/Varejo a partir do Profissional; Corporativo e Educação a partir do Profissional;
variações com equipe, casos e várias ofertas no Destaque+. (Suposição — alinhar com a análise de planos em andamento.)

## Ordem sugerida de entrega

| Etapa | Entrega | Por quê nessa ordem |
|---|---|---|
| T0 | Registro de templates + seletor, **sem mudança visual** (todos os atuais ficam em "Serviços") | Cria a base; risco quase zero |
| T1 | **Essencial** | Menor; define o degrau do plano gratuito |
| T2 | **Gastronomia** | Categoria com mais apelo local e jornada diferente (pedido, horário) |
| T3 | **Corporativo (B2B)** | Maior volume de categorias do Hub (5 de 11); foco em geração de lead |
| T4 | **Varejo** | Reaproveita Produtos/Ofertas |
| T5 | **Educação** | Mais específico; entra por demanda |

Cada etapa: migration → seções novas → editor → testes → preview real com uma empresa → deploy.

## O que preciso de você para começar

1. **Imagem de referência de cada layout** (como foi a da clínica). Sem ela eu monto uma proposta, mas o fiel ao seu desenho só sai com a referência.
2. **Confirmar o mapeamento categoria → layout** da tabela acima (principalmente `moda-e-beleza`, que mistura loja e salão).
3. **Planos**: quais layouts ficam em quais planos (depende da análise de planos que ainda está aberta).
4. **Prioridade**: seguir T0→T5 ou começar por Gastronomia/Corporativo, conforme as empresas que você está vendendo agora.

## Riscos

- **Inflar o escopo**: cada layout novo multiplica o que testar e traduzir. Mitigação: motor único, variantes pequenas, entrega por etapa.
- **Páginas parecidas demais ou diferentes demais**: o Hub precisa manter a identidade (terracota, off-white, verde só no WhatsApp). Os layouts mudam **estrutura e texto**, não o design system.
- **Conteúdo regulado** (saúde, jurídico, contábil): o plano de publicidade já exige "Patrocinado" e proíbe promessa de resultado; cada layout herda a mesma moderação de avaliações e a mesma checagem de ofertas.
