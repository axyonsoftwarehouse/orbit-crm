# Orbit CRM — Planejamento

CRM SaaS multi-tenant, código novo, inspirado em funcionalidades/UX do Perfex CRM.
O Perfex é usado apenas como referência; nenhum código dele é reutilizado.

## 1. Visão

Produto comercial próprio, multi-tenant, que começa pelo **núcleo de entrega**
(clientes, projetos, tarefas, timesheet) e cresce em direção ao clone funcional
do Perfex (financeiro → portal do cliente → suporte → CRM comercial).

## 2. Decisões fechadas

| Área              | Decisão                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stack             | Next.js 15 (App Router, TS) + Supabase + Tailwind + shadcn/ui                                                                                                                        |
| Deploy            | Vercel (preview por PR) + Supabase; worker em Edge Functions                                                                                                                         |
| Multi-tenancy     | Banco único + `tenant_id` + **RLS**                                                                                                                                                  |
| Acesso a dados    | `supabase-js` (respeita RLS); RPC/Postgres para agregados                                                                                                                            |
| Render/mutations  | RSC + Server Actions + TanStack Query onde há interatividade                                                                                                                         |
| Usuários MVP      | Só equipe interna; papéis fixos Owner/Admin/Member                                                                                                                                   |
| Cliente do tenant | Empresa-cliente + contatos                                                                                                                                                           |
| Timesheet         | Timer + lançamento manual + faturável/valor-hora                                                                                                                                     |
| Empresas          | Criadas manualmente pelo super-admin (`/plataforma`)                                                                                                                                 |
| Usuário           | Pode pertencer a várias empresas, com troca de empresa                                                                                                                               |
| Tenant na URL     | Path/sessão (`/app`) com seletor; subdomínio depois                                                                                                                                  |
| Auth              | E-mail/senha + convite (Supabase Auth)                                                                                                                                               |
| E-mail            | Resend + React Email                                                                                                                                                                 |
| Cobrança          | Manual no MVP                                                                                                                                                                        |
| i18n              | Só pt-BR                                                                                                                                                                             |
| UI                | **Square Dashboard UI Kit**: Poppins (títulos) + Roboto (corpo), azul `#0062FF`, cards arredondados com sombra, sidebar branca com ativo azul, dark mode adaptado; cor primária fixa |
| Testes            | Vitest + Playwright + testes de RLS                                                                                                                                                  |
| Observabilidade   | Sentry + Vercel Analytics + logs estruturados                                                                                                                                        |

## 3. Arquitetura

- **Camadas:** `middleware.ts` (sessão + proteção de rota) → RSC (leitura) →
  Server Actions (mutações, Zod) → `supabase-js` sob RLS. TanStack Query apenas
  em telas interativas (timer, edição inline).
- **Isolamento:** toda tabela de negócio tem `tenant_id`; policies RLS usam
  funções `security definer` (`is_tenant_member`, `has_tenant_role`,
  `is_super_admin`). Super-admin faz bypass via flag em `profiles`.
- **Storage:** bucket `attachments` com policy por prefixo `tenant_id/...`.
- **Worker:** Edge Function agendada para e-mails/rotinas (base para lembretes).

## 4. Modelo de dados — Fase 0 (plataforma)

Globais: `profiles` (1:1 com `auth.users`), `tenants` (slug, cor, status, plano),
`memberships` (user × tenant × role), `invitations`.

Escopo do tenant (a partir da F1, com RLS): `companies`, `contacts`, `projects`,
`project_members`, `tasks`, `task_checklist_items`, `comments` (polimórfico),
`time_entries` (start/stop, faturável, rate), `attachments` (polimórfico).

Convenções: PK `uuid`, `created_at`/`updated_at`, soft delete (`deleted_at`),
índices em `(tenant_id, ...)`.

## 5. MVP — funcionalidades

Login/convite · seletor de empresa · Clientes (empresas + contatos) · Projetos
(membros, orçamento, status) · Tarefas com checklist, responsável, prazo e status
· Comentários · Anexos · Timesheet com timer e lançamentos faturáveis ·
Configurações da empresa.

Fora do MVP (por escolha): Kanban, Gantt/milestones, notificações, relatórios,
tags/campos personalizados, portal do cliente.

## 6. Roadmap por fases

- **F0 — Fundação:** repo, Supabase, auth, tenants/memberships, RLS base + testes,
  shell UI, CI/CD. ✅ **concluída**
  - Testes de isolamento RLS via API (`npm run test:rls`) — 8/8 passando.
  - Observabilidade (Sentry/Analytics) fica para o deploy na Vercel.
- **F1 — MVP Entrega** ✅ **concluída**
  - ✅ **F1.1 — Clientes + Contatos** (migration `0002`, CRUD, RLS + testes de isolamento).
  - ✅ **F1.2 — Projetos + membros** (migration `0003`, status 1–5, billing type, orçamento, equipe, RLS + testes).
  - ✅ **F1.3 — Tarefas + checklist** (migration `0004`, status 1–5, prioridade 1–4, responsável, checklist e progresso do projeto por tarefas concluídas).
  - ✅ **F1.4 — Comentários + Anexos** (migration `0005`, `comments`/`attachments` polimórficos, bucket `attachments` privado com RLS por tenant, upload direto pelo browser).
  - ✅ **F1.5 — Timesheet** (migration `0006`, timer start/stop + lançamento manual, faturável/valor-hora, um timer por usuário, totais por tarefa/projeto).
- **F2 — Financeiro** ✅ **concluída**
  - ✅ **F2.1 — Orçamentos** (migration `0007`: `estimates` + `document_items`, status 1–5, desconto/imposto por item, numeração por tenant, conversão em fatura).
  - ✅ **F2.2 — Faturas + Pagamentos** (`invoices`, `payments`, status derivado dos pagamentos, registro/remoção de pagamento, vencidas).
  - ✅ **F2.3 — Faturar horas** (gera fatura a partir de `time_entries` faturáveis e não faturadas, agrupando por tarefa/valor-hora e marcando `billed`).
- **F3 — Portal do cliente** ✅ **concluída**
  - Acesso por **convite do staff** (contato → cria usuário e vincula), em `/portal` separado.
  - Cliente vê **Projetos, Tarefas, Arquivos, Orçamentos e Faturas** (somente leitura via RLS por empresa).
  - **Aprovação de orçamento** pelo cliente via RPC segura (`client_respond_estimate`).
- **F4 — Help desk** ✅ **concluída**
  - ✅ **F4.1 — Tickets** (migration `0010`: `departments`, `tickets` com numeração `TCK-`, `ticket_replies` com nota interna, anexos; status/prioridade/tipo; telas lista + detalhe).
  - ✅ **F4.2 — Base de conhecimento + FAQ** (migration `0011`: `kb_categories`, `kb_articles` com slug/publish/views, `faqs`; abas Artigos/Categorias/FAQ).
  - ✅ **F4.3 — Help desk no portal** (migration `0012`/`0013`: cliente abre/acompanha tickets, respostas sem notas internas, lê artigos/FAQ publicados; abas Tickets e Ajuda no portal).
- **F5 — CRM comercial** ✅ **concluída**
  - ✅ **F5.1 — Leads** (migration `0014`: `lead_statuses` configuráveis, `lead_sources`, `leads` com valor/responsável, `lead_activities`; lista, detalhe com timeline, gestão de status/origens e **conversão em cliente**).
  - ✅ **F5.2 — Pipeline Kanban** (board com **drag-and-drop** entre colunas de status; toggle Lista/Kanban).
- **F6 — Plataforma SaaS** (em andamento)
  - ✅ **F6.1 — Planos & limites** (migration `0015`: `plans` com preço/trial/limites por recurso/“mais popular”; assinatura no `tenant`; gestão no `/plataforma`; **enforcement de limites** ao criar clientes/projetos/tarefas/tickets/leads).
  - ✅ **F6.4 — Relatórios** (`/app/relatorios` com período 30/90/365 dias: **funil de leads**, **financeiro** — faturado/recebido/em aberto + faturamento 6 meses + top clientes — e **horas** por projeto/pessoa; inspirado nos relatórios do módulo de contabilidade).
  - ✅ **F6.3 — Notificações + e-mail + lembretes** (migration `0016`: `notifications` + sino no topbar; `sendEmail` via Resend; rota `/api/cron/reminders` agendada no `vercel.json` para tarefas vencendo e faturas vencidas).
  - ✅ **F6.2 — Subdomínio por tenant** (resolução por host no middleware + `getActiveTenant` com fallback para cookie/sessão; **inativo** até definir `NEXT_PUBLIC_ROOT_DOMAIN` e DNS wildcard).
  - ⏳ Demais itens do F6: cobrança automática.
- **F7 — Marcos + Gantt** ✅ **concluída**
  - ✅ **F7.1 — Marcos do projeto** (migration `0018`: `milestones` por projeto, status 1–3, cor, ordem; `tasks.milestone_id` opcional com FK composta; progresso derivado das tarefas).
  - ✅ **F7.2 — Cronograma (Gantt)** (timeline read-only em CSS/SVG na página do projeto, escalas por data, clique abre a tarefa, marcos como losangos).
  - ✅ **F7.3 — Marcos no portal** (somente leitura no detalhe do projeto do cliente).
- **F8 — Tags + Campos personalizados** ✅ **concluída**
  - ✅ **F8.1 — Tags** (migration `0019`: `tags` + vínculo polimórfico `taggables`; projetos, tarefas, leads, tickets e clientes; chips no detalhe, filtro `?tag=` nas listas, gestão em Configurações).
  - ✅ **F8.2 — Campos personalizados** (migration `0020`: `custom_field_definitions` + `custom_field_values` polimórficos; clientes, projetos, tarefas e leads; tipos texto, texto longo, número, data, seleção e checkbox; definição em Configurações, edição nos dialogs e leitura no detalhe).
- **F9 — Empresa & Equipe** ✅ **concluída**
  - ✅ **F9.1 — Configurações da empresa** (migration `0021`: bucket público `branding`; nome, cor primária aplicada como CSS vars no `/app` e logo por tenant).
  - ✅ **F9.2 — Equipe & convites** (`invitations` antes sem uso: convidar por e-mail (Resend) com link `/convite/<token>`, papéis, remover membro, revogar convite e aceite que cria/reaproveita o usuário e associa o membership).
- **F10 — Despesas** ✅ **concluída**
  - ✅ **F10.1 — Despesas** (migration `0024`: `expenses` com categoria, valor, data, projeto/cliente, faturável e observações; RLS por tenant; `/app/despesas` com filtros por projeto/cliente e paginação).
- **F11 — Contratos** ✅ **concluída**
  - ✅ **F11.1 — Contratos** (migration `0025`: `contracts` com cliente, valor, vigência (início/término), status 1–3 e observações; RLS por tenant; `/app/contratos` com filtros por cliente/status e paginação; selo "Vencido" derivado).

> **Backlog / roadmap:** itens adiados do MVP e módulos futuros ficam registrados na
> tabela `roadmap_items` (migration `0017`), acesso restrito ao super-admin e futura
> tela em `/plataforma`. É a fonte única para planejar as próximas fases.

## 7. Design system (Square Dashboard UI Kit)

- Fontes: **Poppins** (títulos) e **Roboto** (corpo), via `next/font/local` com os arquivos do próprio kit.
- Cores: primária `#0062FF`; apoio `#FFC542`, `#50B5FF`, `#3DD598`, `#FF974A`, `#FF5A5A`, `#A461D8`.
- Forma: `--radius: 1rem`, cards com sombra suave, pills e botões arredondados.
- Shell: sidebar branca com item ativo azul; topbar com **Buscar** (busca real), **+ Novo**, tema e avatar; dashboard com cards de métrica.
- Listas em cards: **Clientes** e **Projetos** (agrupados, com progresso/prazo/avatares), **Tarefas** com visão **Lista/Kanban** e **detalhe em modal**.
- Login (painel azul + card) e Plataforma (header sticky + cards) no visual do kit.
- Tokens centralizados em `src/app/globals.css` (tema claro e escuro).

## 8. Riscos e atenção

- **RLS é o risco nº 1** — testes de isolamento obrigatórios desde a F0.
- **Escopo "clone do Perfex" é enorme** — disciplina no MVP evita nunca lançar.
- **Limites dos planos gratuitos** — Vercel Hobby sem domínio curinga (ok, usamos
  path); Supabase Free limita storage/egress/Edge invocations.
- **Cobrança manual** não escala — automatizar antes de crescer.
- **LGPD** e localização de dados a definir quando houver clientes reais.
