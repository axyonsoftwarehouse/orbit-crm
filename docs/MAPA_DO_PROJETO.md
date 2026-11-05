# Mapa do Projeto: Orbit CRM

> Gerado em 09/10/2026 · branch `main` · commit `29aac19`.
> Cobertura: **274 fichas de 342 arquivos de código + 68 exceções em tabela · 18 módulos · 14 processos**.
>
> **Revisão de 04/11/2026 (`main@413c601`):** o [06 Problemas e dívidas](mapa/06-problemas-e-dividas.md) foi conferido item por item contra o código atual, e os comandos, a regra de CI e as sugestões resolvidas foram atualizados. As fichas e os demais capítulos continuam sendo um **retrato de `29aac19`**. Os módulos de **SEO** (migrations `0045`–`0048`) e **Social** (`0049`–`0052`) entraram depois e **ainda não estão mapeados**. Para o Social, ver [`docs/specs/social-media.md`](specs/social-media.md).

O **Orbit CRM** é um CRM SaaS **multi-tenant** (um sistema, várias empresas) para agências, consultorias e prestadores de serviço que trabalham por projeto/hora. Cobre todo o ciclo de **entrega** (clientes → projetos → tarefas → horas) e os módulos **financeiro** (orçamento, fatura, pagamento, despesa, contrato), **comercial** (leads/funil), **atendimento** (tickets e base de conhecimento), **calendário**, **metas**, **relatórios** e **portal do cliente**.

O produto é um app **Next.js 15** (App Router, React Server Components + Server Actions) sobre **Supabase** (Postgres, Auth, Storage e Realtime). O isolamento entre empresas é garantido no próprio Postgres por **Row Level Security (RLS)**: toda tabela de negócio tem `tenant_id`, o app conecta com a **anon key** (sujeita à RLS) e usa a **service role** só em fluxos administrativos controlados.

A leitura é feita por **componentes de servidor** (`src/server/queries/*`); a escrita por **server actions** (`src/server/actions/*`) que validam tudo com **Zod**, resolvem a empresa ativa e revalidam a rota. O **portal do cliente** lê exclusivamente por **RPCs `security definer`** (que projetam só colunas seguras) e o aceite de orçamento passa pela RPC `client_respond_estimate`.

A UI usa **Tailwind CSS v4** + **shadcn/ui** sobre `@base-ui/react` e `lucide-react`, com tema claro/escuro e **branding por tenant** (cor primária e logo). A interatividade pontual (timer, edição inline) usa **TanStack Query**; e-mails transacionais saem via **Resend** (sem SDK); há **notificações em tempo real** (Realtime) e **lembretes automáticos** por cron da Vercel.

Para quem: donos/gerentes (visão e configuração), a equipe (projetos, tarefas, horas, financeiro, CRM e atendimento) e o **cliente final** (portal somente leitura + abertura de tickets). A stack é Next.js 15 / React 19 / TypeScript na **Vercel**, **Supabase/Postgres**, **Zod** e **TanStack Query**.

## Como rodar

**Pré-requisitos:** Node ≥ 20 e um projeto **Supabase** (ou o Supabase local via CLI). As variáveis obrigatórias estão em `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` server-only, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`/`EMAIL_FROM`, `SUPER_ADMIN_EMAILS`, `CRON_SECRET`); nenhum valor real foi copiado.

```text
// comandos do projeto (referência documental, não é trecho de código-fonte)
npm install
npm run dev            # http://localhost:3000
npm run build          # build de produção
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm test               # Vitest (unit)
npm run test:rls       # Vitest (isolamento RLS; prefira o Supabase local, ver AGENTS.md > Testes)
npm run test:e2e       # Playwright
npm run db:start       # Supabase local
npm run db:reset       # recria o banco local + migrations + seed
npm run db:types       # regenera src/lib/database.types.ts
npm run seed:demo      # popula o tenant de demonstração
```

**Pontos de entrada:** `/` (redireciona para `/app` ou `/login`), `/login`, `/app` (painel), `/portal` (cliente), `/plataforma` (super-admin), `/f/[slug]` (captação pública). Cron: `GET /api/cron/reminders` (09:00, `vercel.json`).

## Índice

| # | Arquivo | Conteúdo |
|---|---|---|
| — | [00-inventario](mapa/arquivos/00-inventario.md) | Todos os **342** arquivos de código: 274 fichas · 68 exceções |
| 01 | [Arquitetura](mapa/01-arquitetura.md) | Diagrama geral · 18 módulos · árvore de pastas · como rodar |
| 02 | [Processos](mapa/02-processos.md) | **14 processos** ponta a ponta, com `sequenceDiagram` |
| 03 | [Funcionalidades](mapa/03-funcionalidades.md) | **41** capacidades e lacunas (o que falta) |
| 04 | [Modelo de dados](mapa/04-modelo-de-dados.md) | **44 tabelas** · domínios de status · relações · `erDiagram` |
| 05 | [Regras e convenções](mapa/05-regras-e-convencoes.md) | transcritas · inferidas · sugeridas |
| 06 | [Problemas e dívidas](mapa/06-problemas-e-dividas.md) | 23 problemas/dívidas (estados revisados em 04/11) + sugestões ao caderno |
| 07 | [Glossário](mapa/07-glossario.md) | termos de domínio e arquitetura |
| 08 | [Verificação](mapa/08-verificacao.md) | cobertura, reconciliação, Anexo A (comandos) · B (ignorados) · C (rotas) |
| — | Módulos (fichas) | [01 banco](mapa/arquivos/01-banco-migrations-e-seed.md) · [02 núcleo](mapa/arquivos/02-nucleo-lib-aplicacao.md) · [03 validações](mapa/arquivos/03-validacoes-zod.md) · [04 helpers](mapa/arquivos/04-servidor-helpers.md) · [05 queries](mapa/arquivos/05-servidor-queries.md) · [06 actions-core](mapa/arquivos/06-servidor-actions-core.md) · [07 actions-negócio](mapa/arquivos/07-servidor-actions-negocio.md) · [08 componentes-app](mapa/arquivos/08-componentes-app-nucleo.md) · [09 componentes-domínio](mapa/arquivos/09-componentes-dominio.md) · [10 ui](mapa/arquivos/10-componentes-ui.md) · [11 app-base](mapa/arquivos/11-app-nucleo-auth-e-publico.md) · [12 painel/clientes](mapa/arquivos/12-app-painel-e-clientes.md) · [13 projetos/tarefas](mapa/arquivos/13-app-projetos-e-tarefas.md) · [14 financeiro](mapa/arquivos/14-app-financeiro.md) · [15 comercial/atendimento](mapa/arquivos/15-app-comercial-e-atendimento.md) · [16 config/plataforma](mapa/arquivos/16-app-configuracoes-e-plataforma.md) · [17 portal](mapa/arquivos/17-portal-do-cliente.md) · [18 testes/scripts](mapa/arquivos/18-testes-e-scripts.md) |

## Por onde começar a ler

1. Esta capa (você está aqui) — o que é e como rodar.
2. [02-processos](mapa/02-processos.md) — o "como funciona" ponta a ponta (login, convite, projeto/Gantt, horas, orçamento→fatura, portal, cron).
3. [01-arquitetura](mapa/01-arquitetura.md) — os 18 módulos e as camadas.
4. O módulo da sua área: dinheiro → [14 financeiro](mapa/arquivos/14-app-financeiro.md); dados/segurança → [04 modelo](mapa/04-modelo-de-dados.md) e [01 banco](mapa/arquivos/01-banco-migrations-e-seed.md); servidor → [06](mapa/arquivos/06-servidor-actions-core.md)/[07 actions](mapa/arquivos/07-servidor-actions-negocio.md); interface → [08](mapa/arquivos/08-componentes-app-nucleo.md) e [11](mapa/arquivos/11-app-nucleo-auth-e-publico.md).
5. Antes de mexer: [05 regras](mapa/05-regras-e-convencoes.md) e [06 problemas](mapa/06-problemas-e-dividas.md).

## Avisos

- **Este mapa é gerado** — não edite à mão. Anotações e decisões vão no `CADERNO_DO_PROJETO.md` (ainda não existe; sugestões de entrada em [06-problemas-e-dividas](mapa/06-problemas-e-dividas.md) §6.2).
- **Ignorados:** `node_modules/`, `.next/`, `.vercel/`, `.git/`, `.env`/`.env.local` (só o `.env.example` foi lido, para documentar **nomes** de variáveis), `package-lock.json`, `src/app/fonts/**`, `public/*.svg` e `favicon.ico`.
- **Segredos:** nenhum valor de `.env` foi copiado.
