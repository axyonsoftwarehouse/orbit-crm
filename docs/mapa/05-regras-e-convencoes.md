# 5. Regras e convenções

> **5.1** transcritas (o que está escrito no projeto) · **5.2** inferidas do código · **5.3** sugeridas. Estado: `main@29aac19`.

## 5.1 Transcritas

### De `AGENTS.md`
- Antes de concluir qualquer alteração, rodar e passar: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Branch por tarefa; PR para `main` (o CI exige format/lint/typecheck/test/build).
- Mensagens de commit no padrão `tipo: descrição` (ex.: `feat:`, `fix(security):`, `docs:`), em português.
- **Nunca** usar `git add .` / `git add -A` — adicionar arquivos explicitamente.
- Migrations são SQL numerado em `supabase/migrations/`; **não** editar migration já aplicada, criar uma nova.
- Auth/tenant: `src/lib/auth.ts` (`getUser`, `getMemberships`, `requireSuperAdmin`), `src/lib/tenant.ts` (`getActiveMembership`); papéis `owner` > `admin` > `member`.
- Server actions em `src/server/actions/` revalidam autorização e tenant a cada chamada; nunca confiar em IDs vindos do cliente.
- Erros de banco: usar `dbError()` de `src/lib/db-error.ts` (loga no servidor e devolve mensagem genérica).

### De `PLANO.md` / `RELATORIO.md`
- Multi-tenancy: banco único + `tenant_id` + **RLS**; acesso a dados via `supabase-js` (respeita RLS); RPC/Postgres para agregados.
- Render/mutations: RSC + Server Actions + TanStack Query onde há interatividade.
- Convenções de schema: PK `uuid`; `created_at`/`updated_at`; soft delete (`deleted_at`); índices em `(tenant_id, ...)`; "unique id+tenant" para FKs compostas.
- Padrões: Zod para validação; mutações retornam `{ error | success }`; `revalidatePath`.
- Idioma pt-BR na UI; commits `tipo: descrição` sem acento no assunto.

### Configs (transcritas)
- `prettier`: sem ponto e vírgula, aspas duplas, `trailingComma: all`, plugin `prettier-plugin-tailwindcss` (`.prettierrc`).
- `typescript`: `strict: true`, `target ES2017`, alias `@/*` → `./src/*` (`tsconfig.json`).
- CI (`.github/workflows/ci.yml`): `format:check` → `lint` → `typecheck` → `test` → `npm audit --omit=dev --audit-level=high` → `build`; job separado de **E2E (Playwright)**.
- `migrate.yml` aplica migrations na produção no push para `main` que altere `supabase/migrations/**`; `rls.yml` sobe um Supabase local no runner e roda `test:rls` em todo PR e no `main` (desde o PR #21; antes dependia dos secrets `TEST_*`).

## 5.2 Inferidas do código

1. **Toda escrita passa por server action** (`"use server"`) que valida com Zod e resolve a empresa ativa (`getActiveMembership`) antes de tocar o banco — nenhuma action confia no `tenant_id` do cliente. *(padrão em 31 arquivos de actions.)*
2. **Leitura é RSC** via `src/server/queries/*` e `supabase-js` sob RLS; páginas não montam SQL nem usam service role. *(inferida em 23 arquivos de queries.)*
3. **Soft delete** com `deleted_at` em entidades editáveis (companies, projects, tasks, leads, estimates, invoices, expenses, contracts...); o hard delete aparece só em vínculos/tabelas filhas (memberships, invitations, task_dependencies, document_items).
4. **Status por inteiros** num único mapa por entidade em `src/lib/constants.ts` (não há enum no banco para isso).
5. **Numeração de documentos por tenant** via RPC `next_document_number(p_tenant, p_kind)` + `formatted_number` com prefixo do tenant (`src/lib/documents/totals.ts`/`src/server/documents.ts`).
6. **Erros de banco nunca vazam**: sempre `dbError(contexto, error)` devolvendo mensagem genérica ao cliente.
7. **Retorno padronizado** das actions: `{ error? } | { success? }` (e às vezes `inviteLink`).
8. **Revalidação explícita** com `revalidatePath` após cada mutação, cobrindo a lista e o detalhe.
9. **Valor monetário em `numeric`** no banco e `Number(...)` na aplicação; exibição via `formatMoney` (`src/lib/format.ts`).
10. **E-mail é no-op sem chave**: `sendEmail` retorna `{ skipped: true }` quando `RESEND_API_KEY` ausente, e todo envio é registrado em `email_log`.
11. **Portal lê só por RPC `security definer`** (não por tabela direta), para não expor colunas internas.
12. **UI reutiliza `src/components/ui`** (shadcn/base-ui) e o helper `cn` (reexportado em `src/lib/utils.ts`); sem CSS ad-hoc por tela.

## 5.3 Sugeridas

> Regras que o projeto **não tem** e que evitariam um problema real observado. São sugestões, não regras vigentes.

1. ✅ **Resolvido em `3ba34df`.** **Remover/usar `src/lib/env.ts`.** Ele valida as variáveis de ambiente com Zod, mas **nenhum arquivo o importa** (busca por `@/lib/env` retorna 0 consumidores), então as demais partes leem `process.env.X!` cru. *Problema: a validação existe mas não protege nada; um env ausente estoura em runtime.* Evidência: `src/lib/env.ts:22`.
2. ✅ **Resolvido em `3ba34df`.** **Fonte única para `MANAGER_ROLES`.** A lista `["owner","admin"]` é duplicada em [`src/server/actions/team.ts`](arquivos/06-servidor-actions-core.md) §06.4 (linha ~21) em vez de importar de `src/server/permissions.ts` (`isManager`). *Problema: risco de divergência.* Evidência: `src/server/actions/team.ts:21`.
3. ✅ **Resolvido** (actions em `3ba34df`; banco na migration `0052`). **Autorização para exclusões em `companies`/`projects`/`tasks`.** As actions de delete checam apenas a empresa ativa, sem `isManager` — hoje qualquer `member` pode excluir. *Problema: perda de dados por membro não-gerencial.* Evidência: `src/server/actions/companies.ts` (delete sem `isManager`), comparar com `src/server/actions/leads.ts` (`deleteLeadStatusAction` usa `isManager`).
4. **Testes para as server actions.** Há 57 unit e 118 de RLS, mas **nenhuma action** tem teste próprio (só helpers puros: csv, gantt, reports, validations). *Problema: regressões em fluxos (faturar horas, converter lead, aceitar convite) só aparecem em produção.*
5. ✅ **Resolvido em `3ba34df`.** **Rate limit no login.** O rate limit distribuído (`check_rate_limit`) é usado no formulário público, mas **não** em `signInAction`/`portalSignInAction`. *Problema: brute force de senha.* Evidência: `src/server/actions/auth.ts:9`.
6. **Limite de plano para tags, campos, marcos e storage.** O `enforcement` cobre clientes/projetos/tarefas/tickets/leads; os demais não têm limite. *Problema: um tenant pode crescer em recursos não limitados.* Evidência: `src/server/plan-limits.ts:4`.
7. **Validação de segredos do cron em tempo constante já existe — documentar.** A rota usa `timingSafeEqual` (bom); convém manter a regra "rotas públicas usam rate limit + comparação constante" de forma explícita. Evidência: `src/app/api/cron/reminders/route.ts:8`.
8. **Não acessar outra tabela fora do tenant.** Regra explicitada em `RELATORIO.md` §12; vale transformá-la em teste/lint (hoje a garantia é só a RLS).
