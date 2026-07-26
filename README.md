# Cerâmica Hub

Guia local e rede de negócios do bairro Cerâmica (São Caetano do Sul). Next.js 16 (App
Router) + TypeScript + Supabase (Postgres via service-role key, sem Supabase Auth) +
NextAuth v5 (Credentials) + next-intl (pt/en/es/zh) + Vercel.

O site público ainda está atrás de uma tela "Coming Soon" em `/` — o conteúdo real
(diretório, cadastro, publicidade) já está pronto e pode ser conferido em `/preview`.

## Setup local

```bash
npm install
npm run dev          # http://localhost:3000
npm run build         # build de produção (roda antes de todo deploy)
npm run lint
```

Variáveis de ambiente ficam em `.env.local` (nunca commitado). Ver seção abaixo.

## Variáveis de ambiente

### Supabase / Postgres (auto-preenchidas pela integração Vercel↔Supabase)

Não precisam de ação manual — ao conectar o projeto Supabase ao projeto Vercel, todas
essas chegam sozinhas em toda branch/preview/produção:

- `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — **nunca** exposta ao cliente; é a única forma de acesso
  ao banco no app (ver `src/lib/supabase/server.ts`). RLS existe nas tabelas mas é
  "deny-all" inerte, porque a service-role ignora RLS — isolamento entre empresas é
  garantido na aplicação (ver comentário no topo de `src/lib/auth-guards.ts`).
- `POSTGRES_URL_NON_POOLING` — usada pelos scripts de manutenção (`scripts/*.mjs`), que
  rodam fora do runtime da Vercel e não usam o client `pg` via pooler.
- Demais (`SUPABASE_ANON_KEY`, `POSTGRES_PRISMA_URL`, etc.) existem por causa da
  integração mas não são usadas pelo código.

### Configuração própria do produto

| Variável | Obrigatória | Onde conseguir |
|---|---|---|
| `AUTH_SECRET` | Sim | Gerada uma vez (`npx auth secret`), já configurada. |
| `NEXT_PUBLIC_SITE_URL` | Sim | URL pública do site (`https://ceramicahub.com.br`). |
| `CRON_SECRET` | Sim | String aleatória própria — protege `/api/cron/*` contra chamada externa. |
| `DEEPL_API_KEY` | Sim (i18n dinâmico) | Conta DeepL API — sem ela, conteúdo cadastrado pelas empresas não é traduzido automaticamente pra en/es/zh. |

### Contas externas ainda pendentes (código já pronto, funciona em modo graceful no-op sem elas)

| Variável | Efeito sem configurar |
|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | Cobrança fica 100% manual (admin confirma pagamento em `/admin/financeiro`) — decisão consciente, pagamento automático fica pra depois do lançamento. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Formulário de cadastro fica sem proteção anti-spam/bot. |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` / `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Erros de produção não são reportados automaticamente. |

Quando qualquer uma dessas for configurada na Vercel, o recurso correspondente liga
sozinho no próximo deploy — nenhum código precisa mudar.

## Migrations

Não existe uma tabela de controle de migrations aplicadas — são arquivos numerados em
`supabase/migrations/`, aplicados manualmente e na ordem, uma vez cada. Pra aplicar uma
nova:

```bash
node --env-file=.env.local scripts/run-sql.mjs supabase/migrations/00XX_nome.sql
```

Convenções: sempre criar um arquivo novo (nunca editar um já aplicado), nunca fazer
`drop`/`delete` destrutivo sem necessidade real, e registros financeiros/auditoria/LGPD
nunca são apagados fisicamente (usar `status`/`archived_at` quando aplicável — ver
comentários em `0016_data_deletion_requests.sql` e `0017_analytics_daily.sql` pra
exemplos de decisões de schema já tomadas por esse motivo).

## Deploy

Deploy é manual (não há auto-deploy on push):

```bash
git push origin main
vercel --prod --yes
```

Por isso, qualquer página que dependa de dado que muda com frequência (empresa recém
aprovada, campanha de anúncio aprovada) precisa de `export const revalidate = <segundos>`
— sem isso, o Next.js gera a página como estática no momento do build e ela só atualiza
no próximo deploy manual (foi exatamente o bug corrigido em `/preview` e já existia como
padrão em `/empresa/[slug]`).

Cron job (`vercel.json`) roda diariamente às 3h (`/api/cron/aggregate-analytics`) —
Vercel Hobby permite no máximo 1x/dia por cron, por isso esse horário fixo.

## Backup e restauração

- **Automático**: o Supabase faz backup do banco conforme o plano do projeto (retenção
  maior com PITR nos planos pagos). **Ação pendente**: confirmar no dashboard do
  Supabase (Settings → Database → Backups) qual é a retenção atual do plano em uso, e
  ajustar depois da migração de conta pra Geez.
- **Manual sob demanda**: qualquer ferramenta com `pg_dump` funciona direto com a
  `POSTGRES_URL_NON_POOLING` do `.env.local` (este ambiente de desenvolvimento não tem
  `pg_dump` instalado):
  ```bash
  pg_dump "$POSTGRES_URL_NON_POOLING" -F c -f backup-$(date +%Y%m%d).dump
  ```
- **Restauração**: `pg_restore` do mesmo arquivo contra uma connection string de destino
  (nunca restaurar direto em produção sem antes validar num projeto Supabase separado).

## Rollback de deploy

```bash
vercel rollback        # volta pro deployment de produção anterior
```

Ou, pra reverter o código-fonte também: `git revert` do commit problemático, novo
`vercel --prod --yes`. Migrations de banco não têm rollback automático — reverter uma
migration aplicada exige escrever e rodar manualmente o SQL inverso (não existe
`down.sql` por migration hoje).

## Papéis do sistema

- `super_admin` / `admin` / `financeiro` / `comercial` / `moderador` — internos, cada um
  só acessa a área correspondente em `/admin/*` (gerenciados em `/admin/usuarios`, só
  visível pra `super_admin`).
- `business` (dono) / `business_staff` (equipe convidada pelo dono) — ambos logam em
  `/login` e caem no mesmo painel da empresa; só o dono mexe em cobrança, convida/remove
  equipe e pode solicitar exclusão da conta.
- `member` — perfil de visitante/profissional individual, sem empresa associada.

Detalhes de por que não há RLS "de verdade" no Postgres (e o que isso implica) estão
documentados em `src/lib/auth-guards.ts`.
