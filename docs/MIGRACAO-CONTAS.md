# Migração de contas — Cerâmica Hub

Roteiro para mover o projeto das contas provisórias (GitHub `geezpublicidade-droid`, Vercel `axisinvests-sudo`, Supabase atual) para as contas definitivas.
**Não executar nada de conta antes de o usuário confirmar que o Gmail/contas novos existem.** Este documento não contém segredos.

## 1. O que existe hoje

| Peça | Situação atual | Observação |
|---|---|---|
| Código | GitHub `geezpublicidade-droid/ceramica-hub` (branch `main`) | 74 migrations em `supabase/migrations` |
| Hospedagem | Vercel, time `axisinvests-sudos-projects`, projeto `ceramica-conection` | Projeto órfão `ceramica-hub` (zero deploys) pode ser apagado |
| Domínio | `ceramicahub.com.br` + `www`, registrado fora da Vercel (Third Party) | DNS fica no registrador/Cloudflare: só apontar de novo |
| Banco + Storage | Supabase `xrdklgvwxvwbpfqjddyx` (plano Free, sem backup automático) | Buckets: `comprovantes` (privado), `business-photos` e `virtual-tour` (públicos) |
| Login | NextAuth (credenciais + Google) | Não usa Supabase Auth |
| Cobrança | Mercado Pago (link) + webhook `/api/webhooks/mercadopago` | Webhook ainda sem chaves |
| E-mail | Resend | Sem chave em produção; webhook `/api/webhooks/resend` |
| Anti-bot / erros | Cloudflare Turnstile / Sentry | Sem chaves em produção |
| Analytics | GA4 e Meta Pixel via env | IDs ainda não criados |
| Crons (`vercel.json`) | `aggregate-analytics` 03h, `fetch-news` 08h, `automations` 14h (UTC) | Protegidos por `CRON_SECRET` |

## 2. Variáveis de ambiente (nomes; valores só no `.env.local` / painel Vercel)

- **Obrigatórias:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `AUTH_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`
- **Login Google:** `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (criar novo OAuth client e cadastrar `https://ceramicahub.com.br/api/auth/callback/google`)
- **Banco direto (scripts):** `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING` e afins (a integração Supabase↔Vercel gera sozinha)
- **Pagamento:** `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`
- **E-mail:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_WEBHOOK_SECRET`
- **Proteção/monitoramento:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_SENTRY_DSN`
- **Analytics:** `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`
- **Outros:** `DEEPL_API_KEY` (traduções), `NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE`

## 3. Ordem recomendada

1. **Backup antes de tudo** (conta atual ainda intacta): `node --env-file=.env.local scripts/export-project.mjs` grava todas as tabelas (JSON) e todos os arquivos dos buckets em `C:\Projetos\_backups\ceramica-hub-AAAA-MM-DD`. Contém dados pessoais: não versionar, não enviar. Guardar também uma cópia fora do PC.
2. **Contas novas** (usuário cria): GitHub, Vercel, Supabase (já em plano **Pro**, para ter backup diário), Mercado Pago, Resend, Cloudflare Turnstile, Sentry.
3. **GitHub:** criar o repositório na conta nova e `git remote set-url origin <novo>` + `git push -u origin main` (histórico completo vai junto).
4. **Supabase novo:** criar projeto (região São Paulo) e aplicar `0001`…`0074` na ordem com `node --env-file=.env.local scripts/run-sql.mjs <arquivo>` apontando para o `.env.local` do projeto novo. Recriar os 3 buckets com a mesma visibilidade.
5. **Importar dados:** carregar `tables/*.json` respeitando a ordem de chaves estrangeiras e subir os arquivos de `storage/` para os mesmos caminhos. (Falta escrever `scripts/import-project.mjs`, contraparte do export, e testá-lo num projeto vazio antes do corte.)
6. **Verificar:** `node --env-file=.env.local scripts/audit-rls.mjs` no banco novo (tem de dar OK) e comparar contagens com `manifest.json`.
7. **Vercel novo:** importar o repositório, cadastrar todas as variáveis da seção 2, conferir `vercel.json` (crons) e fazer um deploy de preview.
8. **Corte:** trocar o DNS de `ceramicahub.com.br`/`www` para o projeto novo, atualizar `NEXT_PUBLIC_SITE_URL`, cadastrar a URL do webhook do Mercado Pago/Resend e o redirect do Google, redeploy de produção.
9. **Pós-corte:** testar login (e-mail e Google), cadastro, upload de comprovante, pagamento de teste, cron manual (`/api/cron/*` com `CRON_SECRET`) e envio de e-mail. Só então desligar/apagar os projetos antigos.

## 4. Cuidados

- Trocar `AUTH_SECRET` desloga todo mundo (aceitável); as **senhas continuam válidas** (hash bcrypt vive no banco).
- Planejar o corte fora de horário de cadastro: congelar escritas entre o export final e a virada do DNS.
- O primeiro cron no projeto novo, com `RESEND_API_KEY` configurada, **envia e-mails reais** (boas-vindas e relatório executivo). Revisar `/admin/marketing/automacoes` antes de ligar a chave.
- Reconfigurar o `NEXT_PUBLIC_SITE_URL`: ele entra em links de pagamento, e-mails e imagens de compartilhamento.
- Depois de qualquer migration nova, rodar `scripts/audit-rls.mjs`.
