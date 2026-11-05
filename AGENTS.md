# AGENTS.md

## Projeto

Orbit CRM — CRM SaaS multi-tenant em Next.js 15 (App Router) + Supabase
(Postgres, Auth, Storage, RLS). Todo dado é isolado por `tenant_id` via RLS.

## Comandos

Antes de concluir qualquer alteração, rode (todos precisam passar):

```bash
npm run format:check   # Prettier
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Vitest (unitários)
npm run build          # next build
```

Outros:

```bash
npm run dev            # servidor de desenvolvimento
npm run test:watch     # Vitest em watch
npm run test:rls       # isolamento RLS (usa as variáveis NEXT_PUBLIC_SUPABASE_*; ver "Testes")
npm run test:e2e       # Playwright
npm run format         # Prettier --write
```

Banco (Supabase CLI):

```bash
npm run db:start       # Supabase local
npm run db:reset       # recria o banco local + migrations + seed
npm run db:types       # regenera src/lib/database.types.ts a partir do remoto
npx supabase db push --linked --yes   # aplica migrations no projeto remoto
npx supabase migration list --linked  # confere local x remoto
```

## Fluxo de trabalho

- Branch por tarefa; PR para `main` (o CI exige format/lint/typecheck/test/build).
- Mensagens de commit no padrão `tipo: descrição` (ex.: `feat:`, `fix(security):`, `docs:`), em português.
- **Nunca** use `git add .` / `git add -A` — adicione arquivos explicitamente.
- Migrations são SQL em `supabase/migrations/` com numeração sequencial; **não** edite migrations já aplicadas, crie uma nova.

## Variáveis de ambiente

Definidas em `.env.local` (não versionado) e na Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; ignora RLS)
- `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `SUPER_ADMIN_EMAILS`, `CRON_SECRET`

## Arquitetura e regras

- **Server actions** em `src/server/actions/` — revalidam autorização e o tenant a cada chamada; nunca confie em IDs vindos do cliente.
- **Queries** em `src/server/queries/` e helpers em `src/server/` (`email`, `notifications`, `reminders`, `plan-limits`).
- **Auth/tenant**: `src/lib/auth.ts` (`getUser`, `getMemberships`, `requireSuperAdmin`), `src/lib/tenant.ts` (`getActiveMembership`). Papéis: `owner` > `admin` > `member`.
- **Supabase**: `src/lib/supabase/server.ts` (SSR), `admin.ts` (service role, só em fluxos controlados), `middleware.ts` (sessão).
- **Portal do cliente** usa um `contacts.user_id` e políticas RLS específicas (`is_client_of_company`, `client_can_view_*`).
- Erros de banco: use `dbError(contexto, error, mensagem?)` de `src/lib/db-error.ts` (loga no servidor e devolve mensagem genérica).

## Testes

- Unitários em `tests/unit/`, RLS em `tests/rls/`, E2E em `tests/e2e/`.
- `tests/rls/isolation.test.ts` cria tenants/usuários descartáveis no banco
  apontado por `NEXT_PUBLIC_SUPABASE_URL` e limpa no `afterAll`. Prefira rodar
  contra o **Supabase local** (Docker), como o CI faz:

  ```bash
  npx supabase start
  eval "$(npx supabase status -o env | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
  NEXT_PUBLIC_SUPABASE_URL=$API_URL NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY \
    SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY npm run test:rls
  ```

  Variáveis já exportadas têm precedência sobre o `.env.local`. Sem elas, o
  teste lê o `.env.local` e roda contra o projeto **remoto** (produção).

- O CI (`ci.yml`) roda format/lint/typecheck/unit/build; o `rls.yml` roda o
  `test:rls` contra um Supabase local no runner.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): em PR e `main` roda format, lint,
  typecheck, unit e build.
- **RLS** (`.github/workflows/rls.yml`): em PR e `main` sobe um Supabase
  **local** no runner (`supabase start`: migrations + seed) e roda `test:rls`
  contra ele. Não usa secrets nem toca a produção.
- **Migrations** (`.github/workflows/migrate.yml`): no push para `main` que
  altere `supabase/migrations/**`, aplica `supabase db push` na **produção**.
- **Deploy**: a Vercel faz Preview por PR e Produção no `main` (integração Git).

### Secrets (Settings → Secrets and variables → Actions)

| Secret                  | Obrigatório | Uso                                            |
| ----------------------- | ----------- | ---------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | sim         | token pessoal (supabase.com/dashboard/account) |
| `SUPABASE_DB_PASSWORD`  | sim         | senha do banco de produção                     |
| `SUPABASE_PROJECT_ID`   | sim         | ref do projeto de produção                     |

### Ambientes (plano Hobby: 2 projetos)

O plano Hobby permite 2 projetos e ambos já estão em uso, então **não há projeto
de testes nem de staging**. Decisões:

- **RLS no CI**: roda contra o Supabase **local** no próprio runner
  (`supabase start`), sem projeto na nuvem.
- **Previews da Vercel**: usam o banco de **produção**. Mitigação:
  - testar apenas através de um **tenant de preview** dedicado (e usuários
    próprios deste tenant), aproveitando o isolamento por `tenant_id`/RLS;
  - **não** rodar operações destrutivas (importações em massa, exclusões amplas)
    a partir de um Preview;
  - manter `NEXT_PUBLIC_DEMO_LOGIN` desligado.

### Setup inicial (uma vez)

1. Gerar um Personal Access Token e configurar `SUPABASE_ACCESS_TOKEN`,
   `SUPABASE_DB_PASSWORD` e `SUPABASE_PROJECT_ID` (habilita as migrations
   automáticas no `main`).
2. Proteção de branch em `main`: exigir PR e os checks
   `Format, lint, types, testes e build` e `Isolamento RLS`.
