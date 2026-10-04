# Orbit CRM — Relatório de Escopo e Estado do Projeto

> Documento único, com duas leituras: **negócio** (seções 1–3 e 9) e **técnica**
> (seções 4–8 e 10–13). Atualizado em outubro/2026.
> Fonte da verdade do planejamento: `PLANO.md` e a tabela `roadmap_items`
> (migrations `0017`, `0022` e `0026`).

---

## 1. Sumário executivo

O Orbit CRM é um **CRM SaaS multi-tenant** de código próprio, com funcionalidades
inspiradas nas melhores práticas de CRMs de gestão de serviços. Cobre hoje todo o ciclo
de **entrega** (clientes → projetos → tarefas → horas) e os módulos
**financeiro, comercial, atendimento e portal do cliente**, além de itens de
**plataforma SaaS** (planos/limites, notificações, relatórios, branding e equipe).

- **Fases concluídas:** F0 a F18, além de melhorias transversais (tipagem do banco,
  paginação das listas, import/export CSV, confiabilidade e engajamento).
- **Migrations:** 33 (`0001`–`0034`).
- **Testes:** 48 unitários + 93 de isolamento RLS (todos verdes).
- **Cobertura funcional:** clientes, projetos, tarefas, horas, financeiro (orçamento,
  fatura, pagamento, despesa, contrato), comercial, captação web-to-lead, atendimento,
  portal do cliente (incluindo contratos e despesas faturáveis), calendário, metas,
  atividades (auditoria), modelos de e-mail, tags/campos, planos e branding.
- **Falta do plano original:** apenas **cobrança automática** (F6) — adiada por decisão.

**Recomendação:** o produto é um MVP comercializável. Os próximos saltos são
**(a)** monetização (cobrança/assinaturas e pagamento online) e **(b)** itens
enterprise (API/webhooks, 2FA, permissões). Observabilidade e CI já estão ativos
(Vercel Analytics/Speed Insights, logger estruturado e workflows no GitHub Actions).
O detalhamento está nas seções 9 e 10.

---

## 2. Visão do produto (negócio)

**Proposta de valor:** centralizar clientes, projetos, horas, financeiro e
atendimento em um só lugar, com portal de autoatendimento para o cliente final.

**Público-alvo:** agências, consultorias e prestadores de serviço que trabalham
por projeto/hora e precisam faturar horas e acompanhar a rentabilidade.

**Diferenciais já presentes:**

- Multi-empresa real (um usuário pode pertencer a vários workspaces e alternar).
- Portal do cliente somente-leitura com aprovação de orçamento.
- Financeiro completo (orçamento → fatura → pagamento → faturar horas).
- Marca própria por empresa (cor primária e logo aplicados na interface).

---

## 3. Escopo entregue (visão de negócio)

| Módulo                | O que o cliente pode fazer                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empresas e equipe** | Criar workspace, convidar equipe por e-mail (papéis), gerenciar membros e branding (nome, cor, logo).                                                                                                   |
| **Clientes**          | Cadastrar empresas e contatos, importar/exportar CSV, convidar contato para o portal.                                                                                                                   |
| **Leads (CRM)**       | Pipeline Kanban, status/origens configuráveis, atividades, conversão em cliente, importar/exportar CSV.                                                                                                 |
| **Captação**          | Formulário público por empresa (`/f/slug`) que cria leads, com anti-bot e origem configurável.                                                                                                          |
| **Projetos**          | Equipe, orçamento/valores, prazos, progresso, **marcos** e **cronograma (Gantt)**.                                                                                                                      |
| **Tarefas**           | Lista/Kanban, checklist, responsável, prioridade, prazo, vínculo a marcos.                                                                                                                              |
| **Timesheet**         | Timer e lançamento manual, faturável/valor-hora, totais e exportação.                                                                                                                                   |
| **Orçamentos**        | Itens, desconto/imposto, numeração, conversão em fatura, aprovação pelo cliente no portal.                                                                                                              |
| **Faturas**           | Pagamentos parciais, status, vencimento, faturar horas apontadas.                                                                                                                                       |
| **Despesas**          | Custos por categoria/projeto/cliente, faturável, relatórios e dashboard.                                                                                                                                |
| **Contratos**         | Vigência, valor, status e alerta de vencido.                                                                                                                                                            |
| **Calendário**        | Visão mensal agregando eventos, prazos de tarefas, faturas e contratos; cadastro de eventos.                                                                                                            |
| **Metas**             | Metas por período (faturamento, novos leads ou horas faturáveis) com acompanhamento do progresso.                                                                                                       |
| **Atividades**        | Trilha de auditoria (quem criou/atualizou/excluiu) com filtro por entidade.                                                                                                                             |
| **Relatórios**        | Funil de leads (com conversão por origem), financeiro, rentabilidade (margem por projeto/cliente), produtividade da equipe, despesas e horas (períodos 30/90/365 dias, com filtro por cliente/projeto). |
| **E-mail**            | Modelos editáveis (assunto/corpo com variáveis) e histórico de envios em Configurações.                                                                                                                 |
| **Atendimento**       | Tickets (departamentos, prioridade, notas internas, anexos) + base de conhecimento/FAQ.                                                                                                                 |
| **Portal do cliente** | Projetos, tarefas, arquivos, marcos, orçamentos, faturas, contratos, despesas faturáveis, tickets e ajuda — somente leitura + aprovação de orçamento e abertura de tickets.                             |
| **SaaS/Plataforma**   | Planos e limites por recurso, painel super-admin, notificações no app **em tempo real** com preferências de e-mail e lembretes automáticos.                                                             |
| **Dados**             | Tags por registro, campos personalizados por entidade, exportação/importação CSV.                                                                                                                       |

---

## 4. Arquitetura e stack (técnico)

- **Frontend/Backend:** Next.js 15 (App Router, TypeScript, RSC + Server Actions).
- **UI:** Tailwind CSS v4 + shadcn/ui (base-ui) + lucide-react; tema claro/escuro;
  identidade visual "Square Dashboard UI Kit".
- **Dados/Auth:** Supabase (Postgres + Auth + Storage + RLS). Clientes Supabase
  **tipados** com `src/lib/database.types.ts` (gerado via `npm run db:types`).
- **Interatividade pontual:** TanStack Query (timer/telas dinâmicas).
- **E-mail:** Resend (via `fetch`, sem SDK) com templates em HTML.
- **Observabilidade:** Vercel Analytics + Speed Insights no layout raiz e logger
  estruturado (`src/lib/logger.ts`).
- **Realtime:** Supabase Realtime na tabela `notifications`.
- **Testes:** Vitest (unit) + Vitest config de RLS (isolamento por API) + Playwright (e2e, scaffold).
- **Deploy:** Vercel (app) + Supabase (banco). Worker/rotinas via rota de cron do Vercel.
- **Padrões:** Zod para validação; mutações retornam `{ error | success }`;
  soft delete (`deleted_at`); toda tabela de negócio tem `tenant_id`.

### Camadas

```
middleware (sessão + tenant por subdomínio)
  → RSC pages (leitura)
  → Server Actions (mutações, Zod)
  → supabase-js sob RLS
```

### Estrutura de pastas (resumo)

- `src/app/app/*` — área interna (16 rotas).
- `src/app/portal/(portal)/*` — portal do cliente.
- `src/app/plataforma/*` — super-admin.
- `src/app/(auth)/*` — login e aceite de convite.
- `src/server/{queries,actions}` — acesso a dados e mutações.
- `src/lib/{validations,supabase,constants,pagination,csv,...}`.
- `supabase/migrations/*` — schema versionado.

---

## 5. Modelo de dados (42 tabelas)

**Plataforma:** `profiles`, `tenants`, `memberships`, `invitations`, `plans`,
`roadmap_items`, `notifications`.

**Entrega:** `companies`, `contacts`, `projects`, `project_members`, `milestones`,
`tasks`, `task_checklist_items`, `time_entries`, `comments`, `attachments`.

**Financeiro:** `estimates`, `invoices`, `payments`, `document_items`, `expenses`,
`contracts`.

**Comercial:** `leads`, `lead_statuses`, `lead_sources`, `lead_activities`.

**Atendimento:** `departments`, `tickets`, `ticket_replies`, `kb_categories`,
`kb_articles`, `faqs`.

**Agenda e auditoria:** `calendar_events`, `activity_log`.

**Metas:** `goals`.

**Comunicação:** `email_templates`, `email_log`.

**Transversais:** `tags`, `taggables`, `custom_field_definitions`,
`custom_field_values`.

**Buckets de Storage:** `attachments` (privado, prefixo por tenant) e `branding`
(público, logos por tenant).

### Convenções de schema

- PK `uuid`; `created_at`/`updated_at`; soft delete `deleted_at`.
- Índices em `(tenant_id, ...)`; "unique id+tenant" para FKs compostas.
- `updated_at` via trigger `set_updated_at()`.

---

## 6. Segurança e multi-tenancy

- **RLS habilitado em todas as tabelas de negócio.** Policies baseadas em funções
  `security definer`: `is_tenant_member`, `has_tenant_role`, `is_super_admin`,
  `shares_tenant`.
- **Portal do cliente** isolado por empresa/contato (`is_client_of_company`,
  `client_can_view_entity`), com RPC segura para aprovação de orçamento
  (`client_respond_estimate`).
- **Storage:** anexos privados com URL assinada (1h); escrita restrita ao tenant.
- **Convites:** token UUID por e-mail; aceite cria/reaproveita usuário e associa
  membership.
- **Super-admin:** bypass controlado por flag em `profiles`.

> **Risco nº 1 do projeto:** RLS. Por isso há uma suíte dedicada de testes de
> isolamento (88 casos) — ver seção 7/11 sobre rodá-los localmente.

---

## 7. Qualidade, testes e CI

- **Unit (Vitest):** 48 testes (schemas Zod: auth, tarefas, marcos, tags, campos,
  tenant, equipe, despesas, contratos, calendário, metas, templates, captação e CSV;
  agregações de relatórios: rentabilidade, produtividade e conversão por origem).
- **RLS (Vitest, ambiente node):** 93 testes de isolamento entre dois tenants,
  cobrindo seleção/inserção/atualização/exclusão, Storage, auditoria, e-mail e a
  leitura do portal (contratos e despesas faturáveis).
- **E2E:** Playwright configurado (smoke), cobertura a ampliar.
- **CI (GitHub Actions):** `ci.yml` roda `format:check`, `lint`, `typecheck`, `test` e
  `build` (com `concurrency`); `rls.yml` roda os testes de RLS **manualmente**
  (`workflow_dispatch`) contra um projeto dedicado. **Falta** job de e2e e `npm audit`.
- **Resiliência:** error boundaries (`error.tsx`, `global-error.tsx`, `not-found.tsx`).
- **Verificações locais padrão:** `lint`, `typecheck`, `format:check`, `test`,
  `test:rls`, `build`.

---

## 8. Operação e ambientes

- **Variáveis de ambiente:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` (server-only), `RESEND_API_KEY`/`EMAIL_FROM`
  (e-mails; sem chave viram no-op), `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ROOT_DOMAIN` (subdomínio, inativo).
- **Migrations:** via `supabase db push` (projeto linkado). Scripts: `db:start/stop/reset`,
  `db:types`, `seed:demo`.
- **Cron:** `/api/cron/reminders` (tarefas vencendo e faturas vencidas) agendada no `vercel.json`.
- **Subdomínio por tenant:** código pronto (F6.2) porém **inativo** até configurar
  `NEXT_PUBLIC_ROOT_DOMAIN` + DNS wildcard.

---

## 9. O que falta — visão de negócio (priorizado)

**Prioridade alta (receita e retenção)**

1. **Cobrança automática / assinaturas** (Stripe/Asaas) — único item de F6 pendente.
2. **Pagamento online de faturas no portal** (gateway) — acelera o caixa.
3. **Faturas recorrentes / assinaturas**.
4. **Propostas com aceite online** (distinto de orçamento).

**Prioridade média (ampliação de valor)**

5. ~~**Relatórios adicionais** (produtividade, leads por origem, despesas)~~ ✅ **entregue na F18** (rentabilidade, produtividade, conversão por origem e filtros).
6. ~~**Contratos e despesas no portal do cliente**~~ ✅ **entregue na F17** (contratos + despesas faturáveis, somente leitura).
7. **Campos personalizados/tags no portal** e **tipos extras** (URL/moeda/multisseleção).

**Prioridade de plataforma (escala/enterprise)**

8. **API pública + webhooks**, **2FA**, **permissões granulares**.
9. **Multi-moeda e impostos**, **self-signup/onboarding** e ativação do subdomínio.
10. **Pesquisas (surveys)** e **anúncios** no portal.
11. **Gantt interativo** (drag/dependências) e **visão de portfólio**.

---

## 10. Backlog técnico e dívida (técnico)

| Item                                                   | Tipo     | Impacto | Observação                                                                 |
| ------------------------------------------------------ | -------- | ------- | -------------------------------------------------------------------------- |
| **Sentry** (erros)                                     | melhoria | médio   | Analytics/Speed Insights e logger já ativos; falta o rastreio de exceções. |
| **CI com e2e e `npm audit`**                           | melhoria | médio   | CI cobre format/lint/types/test/build; RLS é manual.                       |
| **RLS em banco local**                                 | dívida   | alto    | Hoje os testes de RLS rodam contra um projeto remoto dedicado.             |
| **`listTeamMembers` usa `admin.listUsers(200)`**       | dívida   | médio   | Escalabilidade/segurança: guardar e-mail em `profiles` ou RPC.             |
| **N+1 em projetos/tarefas**                            | dívida   | médio   | Revisar contagens/embeds em listas grandes.                                |
| **Enforcement de plano** p/ tags/campos/marcos/storage | melhoria | médio   | Hoje só clientes/projetos/tarefas/tickets/leads.                           |
| **Anexos**: preview, upload múltiplo, validação        | melhoria | médio   | Só upload simples hoje.                                                    |
| **`db:types` requer login** (`--linked`)               | dívida   | baixo   | Alternativa: gerar em CI/script com `--project-id`.                        |
| **Aprovação de horas (timesheet)**                     | feature  | médio   | Fluxo de aprovação antes de faturar.                                       |
| **Command palette (Cmd/Ctrl+K)**                       | melhoria | baixo   | Unificar a busca global.                                                   |
| **Rate limiting** em rotas públicas (convite/aceite)   | dívida   | médio   | Proteção contra abuso.                                                     |

> Os itens entregues foram refletidos no `roadmap_items` via migration `0026`
> (paginação, tipagem, importação CSV, despesas, contratos, etc.). Sugere-se, no
> futuro, expor uma tela de roadmap no `/plataforma`. O `Fim de linha (CRLF)`
> foi resolvido com `.gitattributes` (`eol=lf`).

---

## 11. Riscos e pontos de atenção

- **RLS** continua sendo o risco principal → manter e ampliar a suíte de isolamento
  e rodá-la em base dedicada.
- **Email** sem `RESEND_API_KEY` é no-op (não falha, mas não envia).
- **Cobrança manual** do plano não escala — automatizar antes de crescer.
- **LGPD/localização de dados** a definir quando houver clientes reais.
- **Limites de free tier** (Vercel/Supabase) e ausência de domínio curinga.

---

## 12. Convenções de desenvolvimento (para o time)

- **Idioma:** pt-BR na UI; commits no padrão `tipo: descrição` (Conventional Commits,
  sem acento no assunto).
- **Mutações:** Server Actions com Zod; retorno `{ error?, success? }`; `revalidatePath`.
- **Dados:** `supabase-js` tipado; nunca acessar outra tabela fora do tenant.
- **Schema:** sempre via migration versionada + RLS + índices + testes de isolamento.
- **UI:** reutilizar primitivos de `src/components/ui` e padrões existentes
  (listas em cards, dialogs com `useActionState`, pills de filtro via `searchParams`).
- **Qualidade:** rodar `lint`, `typecheck`, `format:check`, `test`, `test:rls`, `build`
  antes de abrir PR. Nada de comentários supérfluos; sem segredos no repositório.

---

## 13. Próximos passos sugeridos (fatiamento para o time)

1. **Confiabilidade (feito):** Vercel Analytics/Speed Insights + logger + error
   boundaries + CI (`format:check`/`concurrency`) + `rls.yml` manual + `.gitattributes`.
   Pendente: Sentry e job de e2e.
2. **Engajamento (feito):** notificações em tempo real + preferências, calendário e
   log de auditoria.
3. **Monetização (próxima):** cobrança automática + pagamento online no portal +
   faturas recorrentes.
4. **Enterprise (depois):** API/webhooks, 2FA, permissões granulares, multi-moeda.

---

## 14. Anexos

### Rotas internas (`/app`)

`/app` (dashboard), `clientes`, `leads`, `projetos`, `tarefas`, `timesheet`,
`calendario`, `orcamentos`, `faturas`, `despesas`, `contratos`, `metas`, `relatorios`,
`atividades`, `tickets`, `base-conhecimento`, `configuracoes`, `exportar/[entity]`.

### Rotas do portal (`/portal`)

`projetos`, `orcamentos`, `faturas`, `contratos`, `despesas`, `tickets`, `ajuda`.

### Rotas públicas

`/login`, `/convite/[token]` (aceite de convite) e `/f/[slug]` (formulário de captação).

### Scripts npm

`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:rls`,
`test:e2e`, `format`, `format:check`, `db:start`, `db:stop`, `db:reset`, `db:types`,
`seed:demo`.

### Dependências principais

Next 15, React 19, `@supabase/ssr`/`supabase-js`, `@base-ui/react`, `@tanstack/react-query`,
Tailwind 4, Zod, `lucide-react`, `sonner`, `next-themes`, `@vercel/analytics`,
`@vercel/speed-insights`.

---

## 15. Handoff — por onde continuar

**Estado atual:** F0–F18 concluídas; migrations `0001`–`0034` aplicadas no projeto
Supabase remoto; **48 testes unit + 93 de RLS** verdes; `typecheck`/`lint`/`format`/`build`
verdes; árvore Git limpa e sincronizada (`main`).

**Fonte da verdade:** `PLANO.md` (fases), `RELATORIO.md` (este documento) e a tabela
`roadmap_items` (backlog).

**Próxima fase sugerida (sem cobrança):** **Gantt interativo** (drag e dependências)
ou **exportação CSV/PDF dos relatórios**. Alternativas de mesmo porte: **API pública +
webhooks**, **2FA** e **cobrança automática**.

**Passo a passo para retomar:**

1. `git pull` na `main`; conferir `git status` limpo.
2. Ler `PLANO.md` (última fase) e `roadmap_items` (itens com status `backlog`).
3. Para uma nova feature: criar migration (`0035_...`) → `npx supabase db push` →
   `npm run db:types` → implementar (validations → queries → actions → UI) → somar testes.
4. Rodar: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`,
   `npm run test:rls`, `npm run build`.
5. Commit no padrão `tipo: descrição` e push (a credencial Git está fixada na conta
   `torinoorbit-dev`).

**Atenção:** `.env.local` aponta para o **Supabase remoto** e os testes de RLS rodam
contra ele; o login do `gh`/Supabase já está configurado nesta máquina.
