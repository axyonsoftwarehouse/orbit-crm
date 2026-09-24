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
- **F4 — Help desk (tickets + KB).**
- **F5 — CRM comercial (leads/pipeline).**
- **F6 — Contratos, relatórios, notificações, i18n, cobrança automática, subdomínio.**

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
