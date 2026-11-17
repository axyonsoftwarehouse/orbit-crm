# Orbit CRM — Relatório de Escopo e Estado do Projeto

> Documento único, com duas leituras: **negócio** (seções 1–3 e 9) e **técnica**
> (seções 4–8 e 10–13). Atualizado em 17/11/2026 (`main@1189a18`).
> Fonte da verdade do planejamento: `PLANO.md` e a tabela `roadmap_items`
> (migrations `0017`, `0022` e `0026`). O mapa detalhado por arquivo está em
> `docs/mapa/` (dívidas em `docs/mapa/06-problemas-e-dividas.md`).

---

## 1. Sumário executivo

O Orbit CRM é um **CRM SaaS multi-tenant** de código próprio, com funcionalidades
inspiradas nas melhores práticas de CRMs de gestão de serviços. Cobre hoje todo o ciclo
de **entrega** (clientes → projetos → tarefas → horas) e os módulos
**financeiro, comercial, atendimento, marketing (SEO e Social) e portal do cliente**,
além de itens de **plataforma SaaS** (planos/limites, notificações, relatórios,
branding e equipe) e de um **assistente de IA** na página do cliente.

- **Fases concluídas:** F0 a F19, além de melhorias transversais (tipagem do banco,
  paginação das listas, import/export CSV, confiabilidade e engajamento), hardening de
  segurança, módulos de **SEO** e **Social** (com publicação nativa no Instagram e no
  LinkedIn) e **IA** via OpenRouter.
- **Migrations:** 54 (`0001`–`0054`), aplicadas no projeto remoto.
- **Testes:** 211 unitários (26 arquivos) + 156 de isolamento RLS, que rodam contra um
  Supabase **local** no CI.
- **Cobertura funcional:** clientes, projetos (com **Gantt interativo** e dependências),
  tarefas, horas, financeiro (orçamento, fatura, pagamento, despesa, contrato), comercial,
  captação web-to-lead, atendimento, auditoria de SEO, gestão de redes sociais, portal do
  cliente, calendário, metas, atividades (auditoria), modelos de e-mail, tags/campos,
  planos, branding e assistente de IA.
- **Falta do plano original:** apenas **cobrança automática** (F6) — adiada por decisão.

**Recomendação:** o produto é um MVP comercializável. Os próximos saltos são
**(a)** monetização (cobrança/assinaturas e pagamento online) e **(b)** itens
enterprise (API/webhooks, 2FA, permissões). Do lado técnico, os maiores buracos são o
**Sentry** e a **falta de testes de server actions e de E2E autenticado**. O
detalhamento está nas seções 9 e 10.

---

## 2. Visão do produto (negócio)

**Proposta de valor:** centralizar clientes, projetos, horas, financeiro, atendimento e
marketing em um só lugar, com portal de autoatendimento para o cliente final.

**Público-alvo:** agências, consultorias e prestadores de serviço que trabalham
por projeto/hora e precisam faturar horas e acompanhar a rentabilidade.

**Diferenciais já presentes:**

- Multi-empresa real (um usuário pode pertencer a vários workspaces e alternar).
- Portal do cliente somente-leitura com aprovação de orçamento e de posts do Social.
- Financeiro completo (orçamento → fatura → pagamento → faturar horas).
- Marketing para agências: auditoria técnica de SEO com relatório em PDF e calendário
  de redes sociais com aprovação do cliente e publicação nativa.
- Assistente de IA por cliente, que resume o contexto e propõe tarefas e e-mails.
- Marca própria por empresa (cor primária e logo aplicados na interface).

---

## 3. Escopo entregue (visão de negócio)

| Módulo                | O que o cliente pode fazer                                                                                                                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Empresas e equipe** | Criar workspace, convidar equipe por e-mail (papéis), gerenciar membros e branding (nome, cor, logo).                                                                                                                                  |
| **Clientes**          | Cadastrar empresas e contatos, importar/exportar CSV, convidar contato para o portal.                                                                                                                                                  |
| **Assistente de IA**  | Na página do cliente, conversar com um assistente que lê o contexto do cliente (projetos, tarefas, faturas, orçamentos, tickets, contratos), propõe tarefas (criadas só após confirmação) e rascunha e-mails.                          |
| **Leads (CRM)**       | Pipeline Kanban, status/origens configuráveis, atividades, conversão em cliente, importar/exportar CSV.                                                                                                                                |
| **Captação**          | Formulário público por empresa (`/f/slug`) que cria leads, com anti-bot e origem configurável.                                                                                                                                         |
| **Projetos**          | Equipe, orçamento/valores, prazos, progresso, **marcos** e **cronograma (Gantt) interativo** (arrastar, redimensionar e dependências com auto-deslocamento).                                                                           |
| **Tarefas**           | Lista/Kanban, checklist, responsável, prioridade, prazo, vínculo a marcos.                                                                                                                                                             |
| **Timesheet**         | Timer e lançamento manual, faturável/valor-hora, totais e exportação.                                                                                                                                                                  |
| **Orçamentos**        | Itens, desconto/imposto, numeração, conversão em fatura, aprovação pelo cliente no portal.                                                                                                                                             |
| **Faturas**           | Pagamentos parciais, status, vencimento, faturar horas apontadas.                                                                                                                                                                      |
| **Despesas**          | Custos por categoria/projeto/cliente, faturável, relatórios e dashboard.                                                                                                                                                               |
| **Contratos**         | Vigência, valor, status e alerta de vencido.                                                                                                                                                                                           |
| **SEO**               | Sites monitorados por cliente, auditoria técnica da página (26 verificações e score), monitoramento agendado (diário/semanal/mensal), resumo com IA e relatório em PDF.                                                                |
| **Social**            | Contas por cliente, posts com destinos e prévia por rede, mídia (imagens), fluxo de aprovação interno e no portal, calendário mensal, publicação manual com lembrete e **publicação nativa** no Instagram e no LinkedIn (OAuth).       |
| **Calendário**        | Visão mensal agregando eventos, prazos de tarefas, faturas e contratos; cadastro de eventos.                                                                                                                                           |
| **Metas**             | Metas por período (faturamento, novos leads ou horas faturáveis) com acompanhamento do progresso.                                                                                                                                      |
| **Atividades**        | Trilha de auditoria (quem criou/atualizou/excluiu) com filtro por entidade.                                                                                                                                                            |
| **Relatórios**        | Funil de leads (com conversão por origem), financeiro, rentabilidade (margem por projeto/cliente), produtividade da equipe, despesas e horas (períodos 30/90/365 dias, filtro por cliente/projeto e **exportação CSV** por relatório). |
| **E-mail**            | Modelos editáveis (assunto/corpo com variáveis) e histórico de envios em Configurações.                                                                                                                                                |
| **Atendimento**       | Tickets (departamentos, prioridade, notas internas, anexos) + base de conhecimento/FAQ.                                                                                                                                                |
| **Portal do cliente** | Projetos, tarefas, arquivos, marcos, orçamentos, faturas, contratos, despesas faturáveis, SEO (última auditoria), Social (aprovar/rejeitar posts), tickets e ajuda.                                                                    |
| **SaaS/Plataforma**   | Planos e limites por recurso (incluindo sites de SEO, contas e posts do Social), painel super-admin, notificações no app **em tempo real** com preferências de e-mail e lembretes automáticos.                                         |
| **Dados**             | Tags por registro, campos personalizados por entidade, exportação/importação CSV.                                                                                                                                                      |

---

## 4. Arquitetura e stack (técnico)

- **Frontend/Backend:** Next.js 15 (App Router, TypeScript, RSC + Server Actions).
- **UI:** Tailwind CSS v4 + shadcn/ui (base-ui) + lucide-react; tema claro/escuro;
  identidade visual "Square Dashboard UI Kit".
- **Dados/Auth:** Supabase (Postgres + Auth + Storage + RLS + Vault + `pg_cron`).
  Clientes Supabase **tipados** com `src/lib/database.types.ts` (gerado via
  `npm run db:types`).
- **Interatividade pontual:** TanStack Query (timer/telas dinâmicas).
- **IA:** Vercel AI SDK (`ai`, `@ai-sdk/react`) + `@openrouter/ai-sdk-provider`. Toda
  chamada passa por `getChatModel()` (`src/server/ai/model.ts`), que força provedores
  sem retenção de dados. Modelo padrão: `anthropic/claude-haiku-5.5`
  (`OPENROUTER_MODEL`). Sem `OPENROUTER_API_KEY`, a IA fica desligada.
- **E-mail:** Resend (via `fetch`, sem SDK) com templates em HTML.
- **Documentos:** `pdf-lib` (relatório de SEO) e `node-html-parser` (auditoria).
- **Observabilidade:** Vercel Analytics + Speed Insights no layout raiz e logger
  estruturado (`src/lib/logger.ts`).
- **Realtime:** Supabase Realtime na tabela `notifications`.
- **Testes:** Vitest (unit) + Vitest config de RLS (isolamento por API) + Playwright (e2e).
- **Deploy:** Vercel (app) + Supabase (banco). Rotinas via crons do Vercel e `pg_cron`
  (worker de publicação do Social).
- **Padrões:** Zod para validação; mutações retornam `{ error | success }`;
  soft delete (`deleted_at`); toda tabela de negócio tem `tenant_id`; erros de banco
  passam por `dbError()` (`src/lib/db-error.ts`).

### Camadas

```
middleware (sessão + tenant por subdomínio)
  → RSC pages (leitura)
  → Server Actions (mutações, Zod)  /  Route Handlers (IA, crons, OAuth)
  → supabase-js sob RLS
```

### Estrutura de pastas (resumo)

- `src/app/app/*` — área interna (21 rotas).
- `src/app/portal/(portal)/*` — portal do cliente.
- `src/app/plataforma/*` — super-admin.
- `src/app/(auth)/*` — login e aceite de convite.
- `src/app/api/*` — IA (`ai/cliente`), crons (`cron/reminders`, `cron/seo`) e Social
  (`social/connect`, `social/callback`, `social/publish`).
- `src/server/{queries,actions}` — acesso a dados e mutações.
- `src/server/{ai,seo,social,tasks}` — IA, auditoria de SEO, providers do Social e
  criação de tarefas.
- `src/lib/{validations,supabase,ai,documents,constants,pagination,csv,...}`.
- `supabase/migrations/*` — schema versionado.

---

## 5. Modelo de dados (52 tabelas)

**Plataforma:** `profiles` (com `email` sincronizado de `auth.users`), `tenants`,
`memberships`, `invitations`, `plans`, `roadmap_items`, `notifications`,
`rate_limit_hits` (rate limit distribuído de rotas públicas, login e IA).

**Entrega:** `companies`, `contacts`, `projects`, `project_members`, `milestones`,
`tasks`, `task_checklist_items`, `task_dependencies`, `time_entries`, `comments`,
`attachments`.

**Financeiro:** `estimates`, `invoices`, `payments`, `document_items`, `expenses`,
`contracts`.

**Comercial:** `leads`, `lead_statuses`, `lead_sources`, `lead_activities`.

**Atendimento:** `departments`, `tickets`, `ticket_replies`, `kb_categories`,
`kb_articles`, `faqs`.

**SEO:** `seo_sites`, `seo_audits`.

**Social:** `social_accounts`, `social_posts`, `social_post_targets`,
`social_post_events`, `social_media`, `social_settings`. Os tokens OAuth ficam no
Supabase Vault, acessados só por RPCs `service_role`.

**Agenda e auditoria:** `calendar_events`, `activity_log`.

**Metas:** `goals`.

**Comunicação:** `email_templates`, `email_log`.

**Transversais:** `tags`, `taggables`, `custom_field_definitions`,
`custom_field_values`.

**Buckets de Storage:** `attachments` (privado, prefixo por tenant), `branding`
(público, logos por tenant) e `social_media` (privado, mídia dos posts).

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
  `client_can_view_entity`), com RPCs seguras para aprovação de orçamento
  (`client_respond_estimate`) e de posts (`portal_respond_social_post`).
- **Leitura do portal via RPC** (`0042`/`0043`/`0046`): `projects`, `tasks`,
  `companies`, `profiles`, `contracts`, `expenses` e SEO são lidas por funções
  `security definer` que projetam apenas colunas seguras — não há leitura direta do
  cliente (evita expor custo/hora, `notes`, `is_super_admin` etc.).
- **Exclusão só por owner/admin** em clientes, projetos e tarefas, na action e no banco
  (`0052`: trigger `protect_soft_delete` + policies de DELETE).
- **Social:** destinos de um post só podem ser contas do mesmo cliente (validação na
  action e trigger da `0053`); tokens no Vault; worker de publicação com claim/retry.
- **Storage:** anexos privados com URL assinada (1h); escrita restrita ao tenant e o
  `storage_path` precisa pertencer ao tenant da linha (`0041`).
- **Convites/membros:** token UUID por e-mail; só owner concede o papel de `owner`
  (`0041`); `contacts.user_id` (acesso ao portal) só é alterável por owner/admin.
- **Rascunhos** não aparecem no portal (`estimates.status=1`, `invoices.status=6`).
- **Rate limit distribuído** (`rate_limit_hits` + `check_rate_limit`) no formulário
  público, no login e na IA (por usuário; a IA **falha fechado** se o limitador cair).
- **IA:** provedores sem retenção de dados; a tarefa proposta pelo assistente só é
  criada após confirmação do usuário, com o cliente revalidado no servidor.
- **Super-admin:** bypass controlado por flag em `profiles`.

> **Risco nº 1 do projeto:** RLS. Por isso há uma suíte dedicada de testes de
> isolamento (156 casos), que roda no CI contra um Supabase local.

---

## 7. Qualidade, testes e CI

- **Unit (Vitest):** 211 testes em 26 arquivos — schemas Zod, CSV, cronograma,
  agregações de relatórios, limites de plano, rate limit, SEO (auditoria e resumo com
  IA), Social (contas, calendário, lembretes, OAuth, tokens, providers e rotas de
  connect/callback/publish) e IA (modelo, prompt, ferramentas, rota de streaming, cards
  e criação de tarefa proposta).
- **RLS (Vitest, ambiente node):** 156 testes de isolamento entre dois tenants,
  cobrindo seleção/inserção/atualização/exclusão, Storage, auditoria, e-mail,
  dependências de tarefas, leitura do portal, SEO e Social (tabelas `social_*`, bucket
  `social_media`, RPCs do portal e recusa das RPCs `service_role`).
- **E2E:** Playwright (smoke: redirecionamento e tela de login) rodando no CI. Nenhum
  fluxo autenticado é coberto ainda.
- **CI (GitHub Actions):**
  - `ci.yml`: `format:check`, `lint`, `typecheck`, `test`, `npm audit --omit=dev` e
    `build`, além do job `E2E (Playwright)`.
  - `rls.yml`: sobe um Supabase **local** no runner (`supabase start`) e roda
    `test:rls`. Não usa secrets nem toca a produção.
  - `migrate.yml`: no push para `main` que altere `supabase/migrations/**`, aplica
    `supabase db push` na produção (secrets `SUPABASE_*` configurados desde 04/11/2026).
- **Resiliência:** error boundaries (`error.tsx`, `global-error.tsx`, `not-found.tsx`).
- **Verificações locais padrão:** `format:check`, `lint`, `typecheck`, `test`, `build`
  (e `test:rls` contra o Supabase local — ver `AGENTS.md`).

---

## 8. Operação e ambientes

- **Variáveis de ambiente** (ver `.env.example`):
  - App: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_ROOT_DOMAIN`
    (subdomínio, inativo), `NEXT_PUBLIC_DEMO_LOGIN` (manter desligado em produção).
  - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
    `SUPABASE_SERVICE_ROLE_KEY` (server-only).
  - E-mail: `RESEND_API_KEY`/`EMAIL_FROM` (sem chave viram no-op).
  - Plataforma: `SUPER_ADMIN_EMAILS`, `CRON_SECRET`.
  - IA: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`.
  - Social nativo: `SOCIAL_NATIVE_ENABLED`, `SOCIAL_PUBLISH_BATCH_SIZE`,
    `INSTAGRAM_*`, `LINKEDIN_*` (guia em `docs/social-native-setup.md`).
- **Ambientes:** plano Hobby com 2 projetos Supabase, ambos em uso — não há staging. Os
  Previews da Vercel usam o banco de produção (mitigação em `AGENTS.md`).
- **Migrations:** automáticas pelo `migrate.yml` no merge para `main`; manualmente via
  `npx supabase db push --linked --yes`. Conferir com
  `npx supabase migration list --linked`.
- **Crons:** `/api/cron/reminders` (09:00, tarefas vencendo, faturas vencidas e
  lembretes do Social) e `/api/cron/seo` (09:30, auditorias agendadas) no `vercel.json`;
  `/api/social/publish` chamado pelo `pg_cron` (worker de publicação nativa).
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

5. **Campos personalizados/tags no portal** e **tipos extras** (URL/moeda/multisseleção).
6. **Social:** notificações de envio/aprovação, aprovação obrigatória e tela de
   configurações (`social_settings` hoje só via SQL/callback).
7. **SEO:** rastreamento do site inteiro (hoje audita só a URL informada) e alerta de
   queda de score.
8. **IA:** levar o assistente a outras telas (projeto, lead, ticket) e usar IA no Social.

**Prioridade de plataforma (escala/enterprise)**

9. **API pública + webhooks**, **2FA**, **permissões granulares**.
10. **Multi-moeda e impostos**, **self-signup/onboarding** e ativação do subdomínio.
11. **Pesquisas (surveys)** e **anúncios** no portal.
12. **Visão de portfólio** de projetos.

---

## 10. Backlog técnico e dívida (técnico)

| Item                                                   | Tipo     | Impacto | Observação                                                                             |
| ------------------------------------------------------ | -------- | ------- | -------------------------------------------------------------------------------------- |
| **Sentry** (erros)                                     | melhoria | médio   | Analytics/Speed Insights e logger já ativos; falta o rastreio de exceções.             |
| **Testes de server actions**                           | dívida   | alto    | Só os helpers e as actions do assistente têm teste; faturar horas, converter lead etc. |
| **E2E autenticado**                                    | dívida   | médio   | O Playwright cobre só o smoke de login.                                                |
| **Teste da RPC `client_respond_estimate`**             | dívida   | médio   | Aprovação de orçamento no portal sem cobertura de RLS.                                 |
| **Publicação nativa sem teste ponta a ponta**          | dívida   | médio   | Providers, tokens, OAuth e rotas têm unitários; falta o fluxo com banco/API reais.     |
| **N+1 em projetos/tarefas**                            | dívida   | médio   | Revisar contagens/embeds em listas grandes.                                            |
| **Enforcement de plano** p/ tags/campos/marcos/storage | melhoria | médio   | SEO e Social já têm limite; restam tags, campos, marcos e storage.                     |
| **Anexos**: preview, upload múltiplo, validação        | melhoria | médio   | Só upload simples hoje.                                                                |
| **`getKbArticle` grava `views` na leitura**            | dívida   | baixo   | Efeito colateral em rota de leitura.                                                   |
| **Código morto**                                       | dívida   | baixo   | `placeholder.tsx` e os componentes `breadcrumb`, `select` e `tabs` sem uso.            |
| **Avisos npm em tooling de dev**                       | dívida   | baixo   | Só em dependências de dev; `npm audit --omit=dev` está com 0.                          |
| **`db:types` requer login** (`--linked`)               | dívida   | baixo   | Alternativa: gerar em CI/script com `--project-id`.                                    |
| **Aprovação de horas (timesheet)**                     | feature  | médio   | Fluxo de aprovação antes de faturar.                                                   |
| **Command palette (Cmd/Ctrl+K)**                       | melhoria | baixo   | Unificar a busca global.                                                               |
| ~~**`migrate.yml` sem secrets**~~ ✅                   | dívida   | alto    | Secrets `SUPABASE_*` configurados em 04/11/2026.                                       |
| ~~**RLS em banco local**~~ ✅                          | dívida   | alto    | `rls.yml` sobe Supabase local no runner (PR #21).                                      |
| ~~**Rate limit no login**~~ ✅                         | dívida   | médio   | `isLoginRateLimited` em `src/server/rate-limit.ts`.                                    |
| ~~**Exclusão por `member`**~~ ✅                       | dívida   | alto    | Só owner/admin excluem, na action e no banco (`0052`).                                 |
| ~~**SEO e Social sem testes de RLS**~~ ✅              | dívida   | alto    | Blocos dedicados em `tests/rls/isolation.test.ts` (16/11/2026).                        |

> A lista completa, com evidência por arquivo, está em
> `docs/mapa/06-problemas-e-dividas.md`. O `Fim de linha (CRLF)` foi resolvido com
> `.gitattributes` (`eol=lf`).

---

## 11. Riscos e pontos de atenção

- **RLS** continua sendo o risco principal → manter e ampliar a suíte de isolamento a
  cada tabela ou RPC nova.
- **Previews usam a produção** (sem staging no plano Hobby): testar só com o tenant de
  preview e não rodar operações destrutivas a partir de um Preview.
- **Teste de RLS sem variáveis exportadas** lê o `.env.local` e roda contra a produção —
  sempre exportar as variáveis do Supabase local antes.
- **Migrations:** depois de todo merge com migration, conferir
  `npx supabase migration list --linked`.
- **Email** sem `RESEND_API_KEY` é no-op (não falha, mas não envia).
- **IA** depende de `OPENROUTER_API_KEY` e de custo variável por uso; o rate limit por
  usuário controla abuso.
- **Social nativo** depende de apps aprovados na Meta e no LinkedIn e de `pg_cron`.
- **Cobrança manual** do plano não escala — automatizar antes de crescer.
- **LGPD/localização de dados** a definir quando houver clientes reais.
- **Limites de free tier** (Vercel/Supabase) e ausência de domínio curinga.

---

## 12. Convenções de desenvolvimento (para o time)

- **Idioma:** pt-BR na UI; commits no padrão `tipo: descrição` (Conventional Commits),
  em português.
- **Git:** branch por tarefa e PR para `main`; nunca `git add .`/`git add -A`.
- **Mutações:** Server Actions com Zod; retorno `{ error?, success? }`; `revalidatePath`;
  revalidar autorização e tenant a cada chamada.
- **Dados:** `supabase-js` tipado; nunca acessar outra tabela fora do tenant.
- **Schema:** sempre via migration nova (nunca editar uma já aplicada) + RLS + índices +
  testes de isolamento.
- **IA:** toda chamada passa por `getChatModel()`.
- **UI:** reutilizar primitivos de `src/components/ui` e padrões existentes
  (listas em cards, dialogs com `useActionState`, pills de filtro via `searchParams`).
- **Qualidade:** rodar `format:check`, `lint`, `typecheck`, `test` e `build` antes de
  abrir PR (o CI exige todos). Nada de comentários supérfluos; sem segredos no
  repositório.

---

## 13. Próximos passos sugeridos (fatiamento para o time)

1. **Confiabilidade (quase feito):** Analytics/Speed Insights + logger + error
   boundaries + CI completo + RLS local + migrations automáticas. Pendente: Sentry.
2. **Cobertura de testes (próxima técnica):** server actions centrais (faturas,
   orçamentos, leads, convites) e E2E autenticado dos fluxos principais.
3. **Monetização (próxima de negócio):** cobrança automática + pagamento online no
   portal + faturas recorrentes.
4. **Marketing:** notificações e configurações do Social; rastreamento e alertas do SEO.
5. **Enterprise (depois):** API/webhooks, 2FA, permissões granulares, multi-moeda.

---

## 14. Anexos

### Rotas internas (`/app`)

`/app` (dashboard), `clientes`, `leads`, `projetos`, `tarefas`, `timesheet`,
`calendario`, `orcamentos`, `faturas`, `despesas`, `contratos`, `metas`, `relatorios`,
`atividades`, `tickets`, `base-conhecimento`, `seo` (com `[id]/relatorio`), `social`
(com `calendario` e `contas`), `configuracoes`, `exportar/[entity]`.

### Rotas do portal (`/portal`)

`projetos`, `orcamentos`, `faturas`, `contratos`, `despesas`, `seo`, `social`,
`tickets`, `ajuda`.

### Rotas públicas

`/login`, `/portal/login`, `/convite/[token]` (aceite de convite) e `/f/[slug]`
(formulário de captação).

### Rotas de API

`/api/ai/cliente` (streaming do assistente), `/api/cron/reminders`, `/api/cron/seo`,
`/api/social/connect/[provider]`, `/api/social/callback/[provider]` e
`/api/social/publish`.

### Scripts npm

`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:rls`,
`test:e2e`, `format`, `format:check`, `db:start`, `db:stop`, `db:reset`, `db:types`,
`seed:demo`.

### Dependências principais

Next 15, React 19, `@supabase/ssr`/`supabase-js`, `@base-ui/react`, `@tanstack/react-query`,
Tailwind 4, Zod, `ai`/`@ai-sdk/react`, `@openrouter/ai-sdk-provider`, `pdf-lib`,
`node-html-parser`, `lucide-react`, `sonner`, `next-themes`, `@vercel/analytics`,
`@vercel/speed-insights`.

---

## 15. Handoff — por onde continuar

**Estado atual:** F0–F19 concluídas; hardening de segurança aplicado; módulos de SEO,
Social (com publicação nativa) e assistente de IA na `main` (último merge: PR #32);
migrations `0001`–`0054` aplicadas no Supabase remoto; **211 testes unit + 156 de RLS**;
CI verde.

**Fonte da verdade:** `PLANO.md` (fases), `RELATORIO.md` (este documento),
`docs/mapa/` (mapa por arquivo e dívidas) e a tabela `roadmap_items` (backlog).

**Próxima fase sugerida:** **Sentry + testes de server actions** (técnico) ou
**cobrança automática** (negócio). Alternativas de mesmo porte: **API pública +
webhooks**, **2FA** e **visão de portfólio**.

**Passo a passo para retomar:**

1. `git pull` na `main`; conferir `git status` limpo.
2. Ler `PLANO.md` (última fase), `docs/mapa/06-problemas-e-dividas.md` e
   `roadmap_items` (itens com status `backlog`).
3. Criar uma branch para a tarefa. Para uma feature com banco: criar migration
   (`0055_...`) → testar no Supabase local (`npm run db:reset`) → implementar
   (validations → queries → actions → UI) → somar testes unitários e de RLS.
4. Rodar: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`,
   `npm run build` e `npm run test:rls` contra o Supabase local.
5. Commit no padrão `tipo: descrição` e PR para `main` em
   `axyonsoftwarehouse/orbit-crm`. O merge aplica a migration na produção pelo
   `migrate.yml`.

**Atenção:** `.env.local` aponta para o **Supabase remoto (produção)**. Para os testes
de RLS, exporte antes as variáveis do Supabase local (ver `AGENTS.md` > Testes).
