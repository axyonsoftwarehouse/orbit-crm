# 6. Problemas, dívidas e sugestões para o caderno

> **6.1** problemas/dívidas/riscos (com evidência por arquivo+linha aproximada). **6.2** o que deveria virar entrada manual no `CADERNO_DO_PROJETO.md`. Este mapa **não** corrige nem edita o projeto. Levantamento original: `main@29aac19` (09/10/2026). **Estados revisados em 04/11/2026 contra `main@413c601`**, item por item.

## 6.1 Problemas, dívidas e riscos

Categorias: bug conhecido · dívida técnica · risco de segurança · código morto · falta de teste.

| # | Problema | Categoria | Evidência | Efeito | Estado |
|---|---|---|---|---|---|
| 1 | `src/lib/env.ts` valida o ambiente com Zod mas **nenhum arquivo o importa**; o resto lê `process.env.X!` cru | código morto | `src/lib/env.ts:22` (0 importadores de `@/lib/env`) | a validação de env não protege nada; env ausente estoura em runtime | **resolvido** em `3ba34df`: importado por `src/lib/email.ts`, `src/lib/supabase/server.ts` e `admin.ts` |
| 2 | `MANAGER_ROLES` duplicado em `team.ts` em vez de usar `isManager` | dívida técnica | `src/server/actions/team.ts:21` vs `src/server/permissions.ts:3` | risco de divergência de regra de papel | **resolvido** em `3ba34df`: `MANAGER_ROLES` não existe mais em `src/` |
| 3 | Deletes de `companies`/`projects`/`tasks` checam só a empresa ativa, **sem `isManager`** | risco de segurança | `src/server/actions/companies.ts` (delete), `projects.ts`, `tasks.ts` | um `member` pode excluir clientes/projetos/tarefas | **resolvido**: actions exigem `isManager` (`3ba34df`) e o banco também (migration `0052`, PR #20: trigger `protect_soft_delete` + policies de DELETE só para owner/admin; aplicada na produção em 04/11) |
| 4 | Nenhuma **server action** tem teste próprio (só helpers puros) | falta de teste | `tests/unit/*` cobre csv/gantt/reports/validations/rate-limit/seo/social (helpers) | regressões em fluxos (faturar horas, converter lead, convite) só aparecem em prod | aberto |
| 5 | Login sem rate limit; o limitador distribuído só é usado no formulário público | risco de segurança | `src/server/actions/auth.ts:9`; `check_rate_limit` só em `public-lead.ts:25` | brute force de senha | **resolvido** em `3ba34df`: `isLoginRateLimited` (`src/server/rate-limit.ts`) no login, com teste em `tests/unit/rate-limit.test.ts` |
| 6 | `enforcement` de plano só cobre clientes/projetos/tarefas/tickets/leads | dívida técnica | `src/server/plan-limits.ts:7` (`RESOURCE_TABLES`, agora também `seo_sites`) | tags, campos, marcos e storage crescem sem limite | aberto (parcial: `seo_sites` entrou) — ver também #22 |
| 7 | Testes de **RLS rodam contra o Supabase remoto** (sem banco local de teste) | dívida técnica | `tests/rls/isolation.test.ts`; `.github/workflows/rls.yml` | CI de RLS fica desligado sem projeto dedicado; risco de tocar produção | **resolvido** no PR #21: o CI sobe Supabase local (`supabase start`) e roda os 122 testes; `AGENTS.md` documenta o fluxo local |
| 8 | `migrate.yml` fica **desabilitado em silêncio** sem os secrets `SUPABASE_*` | dívida técnica | `.github/workflows/migrate.yml`; `AGENTS.md` | migrations não aplicam e ninguém é avisado | **resolvido** em 04/11: secrets configurados. Antes disso, 0049–0052 ficaram sem aplicar e foram enviadas à mão. Validar no próximo merge com migration |
| 9 | Possíveis **N+1** nas listas de projetos/tarefas (embeds/contagens) | dívida técnica | `src/server/queries/projects.ts`, `tasks.ts` | lentidão em tenants grandes | aberto (não reavaliado; `projects.ts` já agrega contagens via `taskCountsByProject`) |
| 10 | `src/components/app/placeholder.tsx` sem uso | código morto | busca por import retorna 0 | código morto | aberto |
| 11 | `breadcrumb`, `select` e `tabs` de `src/components/ui` **ainda sem uso** | código morto | busca por import retorna 0; ver [10-componentes-ui](arquivos/10-componentes-ui.md) §10 | peso de bundle/código não usado | aberto |
| 12 | `getKbArticle` incrementa `views` **durante a leitura** (efeito colateral no GET) | dívida técnica | `src/server/queries/kb.ts:93` (`views + 1`) | escrita em rota de leitura; concorrência e cache | aberto |
| 13 | `database.types.ts` lista **43 tabelas**, mas o schema tem **44** (`rate_limit_hits` ausente) | dívida técnica | `src/lib/database.types.ts` vs `0044_rate_limit_and_profile_email.sql` | tipos possivelmente desatualizados (`npm run db:types`) | **resolvido**: `rate_limit_hits` presente; `db:types` em 04/11 só reordenou o arquivo |
| 14 | RPC `client_respond_estimate` sem teste | falta de teste | `src/server/actions/portal.ts:48`; ausente em `tests/rls/isolation.test.ts` | aprovação de orçamento sem cobertura | aberto |
| 15 | E2E cobre só um **smoke** (redirecionamento e botão de login) | falta de teste | `tests/e2e/smoke.spec.ts` | integração visual dos fluxos sem cobertura | aberto (o job `E2E (Playwright)` agora roda no CI, mas segue só o smoke) |
| 16 | Previews da Vercel usam o **banco de produção** (sem staging) | risco de segurança | `AGENTS.md` §Ambientes | operação destrutiva em preview afeta prod (mitigado por tenant de preview) | mitigado |
| 17 | Anexos só com **upload simples** (sem preview, múltiplo, validação de tipo) | dívida técnica | `src/components/app/attachment-uploader.tsx` | UX e segurança de upload limitadas | aberto |
| 18 | Avisos `npm audit` remanescentes só em tooling de dev | dívida técnica | `npm audit` completo: 23 avisos (7 altos), todos de dev; `npm audit --omit=dev`: 0 | ruído no audit; produção com 0 | aberto. Em 04/11, `next` 15.5.29 e `zod` 4.6.7 (PR #19) zeraram os avisos de produção |
| 19 | **Cobrança manual** do plano (sem gateway/assinatura) | dívida técnica | `PLANO.md` F6 pendente | não escala; risco comercial | aberto |
| 20 | Sentry (rastreio de exceções) ainda não integrado | dívida técnica | `package.json` sem `@sentry/*` | exceções dependem de logs estruturados | aberto |
| 21 | Módulos de **SEO** (`0045`–`0048`) e **Social** (`0049`–`0052`) **não estão mapeados** | dívida técnica | entraram depois de `29aac19`; nenhum arquivo de `docs/mapa/` os descreve | o mapa não serve de guia para esses módulos | aberto. Enquanto isso, ver `docs/specs/social-media.md` |
| 22 | **Social sem limite de plano** para contas/posts, embora a spec diga que a Fase 1A tem | dívida técnica | `src/server/actions/social.ts` não chama `checkPlanLimit`; `SOCIAL_PROVIDER_LIMITS` (`src/lib/constants.ts:27`) é limite de **caracteres** por rede | contas e posts crescem sem limite; spec §14 diverge do código | aberto |
| 23 | **Social sem testes de RLS** | falta de teste | `tests/rls/isolation.test.ts` não referencia nenhuma tabela `social_*` | isolamento entre tenants e portal do Social sem cobertura (spec §15 exige) | aberto |

> Observações: `update*.dto`/tipos não são duplicados aqui (cada `validations/*` é fonte única). Não foram encontradas dependências circulares relevantes.

## 6.2 Sugestões para o caderno do projeto

> O projeto **não** tem `docs/CADERNO_DO_PROJETO.md` nesta execução. Abaixo, o que valeria registrar à mão (decisões implícitas, armadilhas e pontos que exigem decisão humana). **Nada aqui foi editado no projeto.**

1. **Política de autorização de escrita por papel.** ~~Decidir se excluir cliente/projeto/tarefa exige papel gerencial.~~ **Decidido em 04/11/2026:** só `owner`/`admin` excluem clientes, projetos e tarefas. `member` continua editando. A regra vale na action e no banco (`0052`).
2. **Stack de e-mail (Resend) sem SDK.** O envio é um `fetch` cru (`src/lib/email.ts`) e vira no-op sem chave. Decisão implícita: "sem `RESEND_API_KEY`, nada falha". Registrar a consequência (convites podem não chegar) e a expectativa de configuração.
3. **Preview na produção.** Decisão de usar o banco de produção nos previews (plano Hobby) com mitigação por "tenant de preview". Registrar como decisão consciente e suas salvaguardas (não rodar importações/exclusões em preview; manter `NEXT_PUBLIC_DEMO_LOGIN` desligado).
4. **Portal lê por RPC, não por policy direta.** Decisão de segurança tomada no hardening (`0042`/`0043`). Registrar para que futuras telas do portal sigam o padrão (nunca expor `cost`/`hourly_rate`/`notes`/`is_super_admin`).
5. **Numeração de documentos por tenant.** Decisão de gerar via RPC `next_document_number` (e não por sequência no app). Registrar a invariável: número só é único **por tenant** e o `formatted_number` usa prefixo do tenant.
6. **Testes de RLS contra o remoto.** **Decidido:** o CI usa Supabase local no runner (PR #21), sem projeto de testes na nuvem. Localmente, rodar contra o Supabase local (ver `AGENTS.md` > Testes). Sem variáveis exportadas, o teste lê o `.env.local` e roda contra a produção.
7. **Cobrança manual.** Decisão de adiar a monetização (F6). Registrar como o maior risco de escala e a direção sugerida (Stripe/Asaas).
8. **`src/lib/env.ts` órfão.** **Resolvido:** a validação de env foi adotada nos pontos de entrada (`3ba34df`).
9. **Migrations em produção.** Até 04/11/2026 o workflow `migrate.yml` passava "verde" sem aplicar nada (faltavam os secrets). Registrar: depois de todo merge com migration, conferir `npx supabase migration list --linked`.
