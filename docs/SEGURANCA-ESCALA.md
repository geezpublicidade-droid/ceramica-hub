# Segurança e escala — Cerâmica Hub

Meta: 3.000 empresas, bairro de São Caetano acessando, tráfego pago. Cenário de partida (estimado): 100–500 mil visitas/mês.
Stack alvo: Vercel Pro + Supabase Pro (compute maior sob demanda) + Cloudflare grátis (DNS/proxy/WAF) + Turnstile.

## A. Bloqueadores antes de abrir ao público
1. **Contas definitivas** (ver `MIGRACAO-CONTAS.md`), Supabase em plano **Pro** (backup diário; testar restauração uma vez).
2. **Variáveis de produção:** `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` + site key (hoje, sem secret, a verificação é pulada), `NEXT_PUBLIC_SENTRY_DSN`, `MERCADOPAGO_*`, `CRON_SECRET`, `AUTH_SECRET` novo.
3. **RLS:** `node --env-file=.env.local scripts/audit-rls.mjs` no banco novo (tem de dar OK) e depois de cada migration.
4. **Demos:** desativar as âncoras `is_demo` e trocar logos/capas fictícias; "Shopping São Caetano" só com autorização escrita.
5. **Rate limit** em toda ação pública que grava (busca, cadastro, lead, logs de métrica: já feito) — revisar login, recuperação de senha, upload e avaliações.

## B. Segurança (checklist)
- [ ] Cloudflare na frente (proxy laranja, SSL Full strict, "Bot Fight Mode", regra de rate limit em `/api/*` e login, desafio em países/ASNs atípicos se houver ataque).
- [ ] Vercel Firewall: regras de rate limit para `/api/search/smart`, `/api/og/*` (custo de CPU), login e cadastro.
- [ ] Cliques falsos de tráfego pago: métricas e leads devem ignorar bots conhecidos e repetições (mesmo IP/sessão em janela curta); relatório de campanha separa "válido" de "bruto".
- [ ] Login: bloqueio progressivo (`login_attempts` já existe), senha mínima, e-mail de aviso em login novo, 2FA para admin.
- [ ] Uploads: validar tipo real (não só extensão), limite de tamanho, bucket `comprovantes` privado com URL assinada de curta duração.
- [ ] Headers: HSTS/CSP/XFO já configurados; revisar CSP sem `unsafe-inline` quando possível (nonce).
- [ ] Segredos: nenhum no repositório; rotacionar chaves ao migrar; `service_role` só no servidor.
- [ ] LGPD: política de privacidade com cookies Google/Meta, consentimento já existe, exportação/exclusão de dados do titular.
- [ ] Auditoria (`/admin/seguranca`) com alerta por e-mail para ações sensíveis.
- [ ] Backup extra: `scripts/export-project.mjs` semanal para o Drive (JSON + storage).

## C. Performance (checklist)
- [ ] `loadViewCounts` (`company-discovery.ts`): lê até 50 mil linhas e conta em JS → trocar por RPC SQL agregada (`group by business_id`) ou tabela diária pré-agregada (`aggregate-analytics` já roda de madrugada). **Com 3.000 empresas o 50k estoura e o ranking fica errado.**
- [ ] `loadFacets`/`getBusinessCategoryLinks`/corpus de busca carregam todas as empresas por requisição: ok até ~500; com 3.000 mover filtro/ordenação/paginação para SQL com índices (categoria, torre, andar, status) e busca por `pg_trgm`/full-text.
- [ ] Páginas públicas (home, categoria, empresa, torre) em ISR/CDN com `s-maxage` e revalidação por tag ao editar empresa; nada de consulta por visita.
- [ ] Imagens: Vercel cobra por imagem de origem. Definir tamanhos máximos no upload (redimensionar com `sharp` na gravação), servir do Supabase Storage com cache longo; revisar os `<img>` crus e `next/image` com `sizes` corretos.
- [ ] `/api/og/*`: cache longo (`s-maxage`, `immutable` com versão) para não gerar a mesma arte milhares de vezes.
- [ ] Índices: `metrics_events (event_type, created_at)`, `(business_id, event_type, created_at)`; particionar ou arquivar eventos antigos (>180 dias) para tabela de resumo.
- [ ] Conexões: usar o pooler (porta 6543) em produção; checar limite de conexões do compute.
- [ ] Monitorar: Sentry (erros), Vercel Analytics/Speed Insights, Supabase Reports (CPU, conexões, queries lentas).

## D. Teste de carga (antes do tráfego pago)
1. Ambiente de preview apontando para o Supabase novo, populado com ~3.000 empresas sintéticas (marcadas, apagáveis).
2. k6 ou autocannon: home, `/empresas`, categoria com filtros, busca, perfil, `/api/search/smart`, login. Meta inicial: p95 < 800 ms a 50 req/s, 0 erros 5xx.
3. Observar CPU/conexões do Supabase e custo estimado da Vercel durante o teste.
4. Ajustar índices/cache e repetir; só então ligar anúncios, subindo o orçamento aos poucos.

## E. Ordem sugerida
1. Backup → contas → migração (A.1–A.3).
2. C (RPC de visitas, índices, cache, imagens) + B (Cloudflare, firewall, bots).
3. D (teste de carga) → A.4 (limpar demos) → abrir.
