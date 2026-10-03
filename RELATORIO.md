# Orbit CRM — Relatório de Escopo e Estado do Projeto

> Documento único, com duas leituras: **negócio** (seções 1–3 e 9) e **técnica**
> (seções 4–8 e 10–13). Atualizado em outubro/2026.
> Fonte da verdade do planejamento: `PLANO.md` e a tabela `roadmap_items`
> (migration `0017`/`0022`).

---

## 1. Sumário executivo

O Orbit CRM é um **CRM SaaS multi-tenant** de código próprio, com funcionalidades
inspiradas nas melhores práticas de CRMs de gestão de serviços. Cobre hoje todo o ciclo
de **entrega** (clientes → projetos → tarefas → horas) e os módulos
**financeiro, comercial, atendimento e portal do cliente**, além de itens de
**plataforma SaaS** (planos/limites, notificações, relatórios, branding e equipe).

- **Fases concluídas:** F0 a F11.
- **Migrations:** 25 (`0001`–`0025`).
- **Testes:** 29 unitários + 75 de isolamento RLS (todos verdes).
- **Falta do plano original:** apenas **cobrança automática** (F6) — adiada por decisão.
- **Backlog organizado:** ~50 itens em `roadmap_items` (features, melhorias e
  dívida técnica), dos quais 6 já foram entregues e precisam de atualização de status.

**Recomendação:** o produto já é um MVP comercializável de gestão de serviços.
O próximo salto de valor está em **(a)** fechar a monetização (cobrança/assinaturas
e pagamento online) e **(b)** consolidar confiabilidade (observabilidade, CI com
e2e/RLS e testes locais). O detalhamento está nas seções 9 e 10.

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

| Módulo                | O que o cliente pode fazer                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empresas e equipe** | Criar workspace, convidar equipe por e-mail (papéis), gerenciar membros e branding (nome, cor, logo).                                       |
| **Clientes**          | Cadastrar empresas e contatos, importar/exportar CSV, convidar contato para o portal.                                                       |
| **Leads (CRM)**       | Pipeline Kanban, status/origens configuráveis, atividades, conversão em cliente, importar/exportar CSV.                                     |
| **Projetos**          | Equipe, orçamento/valores, prazos, progresso, **marcos** e **cronograma (Gantt)**.                                                          |
| **Tarefas**           | Lista/Kanban, checklist, responsável, prioridade, prazo, vínculo a marcos.                                                                  |
| **Timesheet**         | Timer e lançamento manual, faturável/valor-hora, totais e exportação.                                                                       |
| **Orçamentos**        | Itens, desconto/imposto, numeração, conversão em fatura, aprovação pelo cliente no portal.                                                  |
| **Faturas**           | Pagamentos parciais, status, vencimento, faturar horas apontadas.                                                                           |
| **Despesas**          | Custos por categoria/projeto/cliente, faturável, relatórios e dashboard.                                                                    |
| **Contratos**         | Vigência, valor, status e alerta de vencido.                                                                                                |
| **Relatórios**        | Funil de leads, financeiro, despesas e horas (períodos 30/90/365 dias).                                                                     |
| **Atendimento**       | Tickets (departamentos, prioridade, notas internas, anexos) + base de conhecimento/FAQ.                                                     |
| **Portal do cliente** | Projetos, tarefas, arquivos, marcos, orçamentos, faturas, tickets e ajuda — somente leitura + aprovação de orçamento e abertura de tickets. |
| **SaaS/Plataforma**   | Planos e limites por recurso, painel super-admin, notificações no app, e-mails e lembretes automáticos.                                     |
| **Dados**             | Tags por registro, campos personalizados por entidade, exportação/importação CSV.                                                           |

---

## 4. Arquitetura e stack (técnico)

- **Frontend/Backend:** Next.js 15 (App Router, TypeScript, RSC + Server Actions).
- **UI:** Tailwind CSS v4 + shadcn/ui (base-ui) + lucide-react; tema claro/escuro;
  identidade visual "Square Dashboard UI Kit".
- **Dados/Auth:** Supabase (Postgres + Auth + Storage + RLS). Clientes Supabase
  **tipados** com `src/lib/database.types.ts` (gerado via `npm run db:types`).
- **Interatividade pontual:** TanStack Query (timer/telas dinâmicas).
- **E-mail:** Resend (via `fetch`, sem SDK) com templates em HTML.
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

- `src/app/app/*` — área interna (14 rotas).
- `src/app/portal/(portal)/*` — portal do cliente.
- `src/app/plataforma/*` — super-admin.
- `src/app/(auth)/*` — login e aceite de convite.
- `src/server/{queries,actions}` — acesso a dados e mutações.
- `src/lib/{validations,supabase,constants,pagination,csv,...}`.
- `supabase/migrations/*` — schema versionado.

---

## 5. Modelo de dados (37 tabelas)

**Plataforma:** `profiles`, `tenants`, `memberships`, `invitations`, `plans`,
`roadmap_items`, `notifications`.

**Entrega:** `companies`, `contacts`, `projects`, `project_members`, `milestones`,
`tasks`, `task_checklist_items`, `time_entries`, `comments`, `attachments`.

**Financeiro:** `estimates`, `invoices`, `payments`, `document_items`, `expenses`,
`contracts`.

**Comercial:** `leads`, `lead_statuses`, `lead_sources`, `lead_activities`.

**Atendimento:** `departments`, `tickets`, `ticket_replies`, `kb_categories`,
`kb_articles`, `faqs`.

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
> isolamento (75 casos) — ver seção 7/11 sobre rodá-los localmente.

---

## 7. Qualidade, testes e CI

- **Unit (Vitest):** 29 testes (schemas Zod: auth, tarefas, marcos, tags, campos,
  tenant, equipe, despesas, contratos, CSV).
- **RLS (Vitest, ambiente node):** 75 testes de isolamento entre dois tenants,
  cobrindo seleção/inserção/atualização/exclusão e Storage.
- **E2E:** Playwright configurado (smoke), cobertura a ampliar.
- **CI (GitHub Actions):** `ci.yml` roda `npm ci`, `lint`, `typecheck`, `test` e `build`.
  **Falta** job de e2e/RLS e auditoria de dependências.
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
3. **Notificações em tempo real + preferências** por usuário/tipo.
4. **Faturas recorrentes / assinaturas**.
5. **Propostas com aceite online** (distinto de orçamento).

**Prioridade média (ampliação de valor)** 6. **Metas/goals de vendas** e dashboard comercial. 7. **Calendário** (tarefas/eventos/prazos). 8. **Relatórios adicionais** (produtividade, leads por origem) e **log de auditoria**. 9. **Modelos de e-mail editáveis + histórico de envios**. 10. **Contratos e despesas no portal do cliente** (visibilidade controlada). 11. **Campos personalizados/tags no portal** e **tipos extras** (URL/moeda/multisseleção).

**Prioridade de plataforma (escala/enterprise)** 12. **API pública + webhooks**, **2FA**, **permissões granulares**. 13. **Multi-moeda e impostos**, **self-signup/onboarding** e ativação do subdomínio. 14. **Pesquisas (surveys)**, **anúncios**, **web-to-lead** (formulários públicos). 15. **Gantt interativo** (drag/dependências) e **visão de portfólio**.

---

## 10. Backlog técnico e dívida (técnico)

| Item                                                   | Tipo     | Impacto | Observação                                                       |
| ------------------------------------------------------ | -------- | ------- | ---------------------------------------------------------------- |
| **Observabilidade** (Sentry + Analytics/logs)          | melhoria | alto    | Previsto no plano, ainda ausente.                                |
| **CI com e2e + RLS e audit**                           | melhoria | alto    | Existe CI básico; falta e2e/RLS/`npm audit`.                     |
| **RLS em banco local**                                 | dívida   | alto    | Hoje os testes rodam contra o remoto; risco de mutar dados.      |
| **`listTeamMembers` usa `admin.listUsers(200)`**       | dívida   | médio   | Escalabilidade/segurança: guardar e-mail em `profiles` ou RPC.   |
| **N+1 em projetos/tarefas**                            | dívida   | médio   | Revisar contagens/embeds em listas grandes.                      |
| **Enforcement de plano** p/ tags/campos/marcos/storage | melhoria | médio   | Hoje só clientes/projetos/tarefas/tickets/leads.                 |
| **Anexos**: preview, upload múltiplo, validação        | melhoria | médio   | Só upload simples hoje.                                          |
| **Fim de linha (CRLF/LF)**                             | dívida   | baixo   | `core.autocrlf=true` global gera ruído; adotar `.gitattributes`. |
| **`db:types` requer login** (`--linked`)               | dívida   | baixo   | Alternativa: gerar em CI/script com `--project-id`.              |
| **Aprovação de horas (timesheet)**                     | feature  | médio   | Fluxo de aprovação antes de faturar.                             |
| **Command palette (Cmd/Ctrl+K)**                       | melhoria | baixo   | Unificar a busca global.                                         |
| **Rate limiting** em rotas públicas (convite/aceite)   | dívida   | médio   | Proteção contra abuso.                                           |

> Os itens acima estão registrados em `roadmap_items`. Recomenda-se criar uma
> pequena migration para **atualizar o status** dos itens já entregues
> (paginação, tipagem, exportação, importação, despesas, contratos) e,
> futuramente, expor uma tela de roadmap no `/plataforma`.

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

1. **Confiabilidade (1ª sprint):** observabilidade (Sentry/Analytics) + CI com
   e2e/RLS + `.gitattributes` + atualizar status no `roadmap_items`.
2. **Monetização (2ª–3ª sprint):** cobrança automática + pagamento online no portal
   - faturas recorrentes.
3. **Engajamento (4ª sprint):** notificações em tempo real + preferências + calendário.
4. **Enterprise (depois):** API/webhooks, 2FA, permissões granulares, multi-moeda.

---

## 14. Anexos

### Rotas internas (`/app`)

`/app` (dashboard), `clientes`, `leads`, `projetos`, `tarefas`, `timesheet`,
`orcamentos`, `faturas`, `despesas`, `contratos`, `relatorios`, `tickets`,
`base-conhecimento`, `configuracoes`, `exportar/[entity]`.

### Rotas do portal (`/portal`)

`projetos`, `orcamentos`, `faturas`, `tickets`, `ajuda`.

### Scripts npm

`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:rls`,
`test:e2e`, `format`, `format:check`, `db:start`, `db:stop`, `db:reset`, `db:types`,
`seed:demo`.

### Dependências principais

Next 15, React 19, `@supabase/ssr`/`supabase-js`, `@base-ui/react`, `@tanstack/react-query`,
Tailwind 4, Zod, `lucide-react`, `sonner`, `next-themes`.
