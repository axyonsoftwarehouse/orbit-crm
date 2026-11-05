# 8. Relatório de verificação

> Verificação do mapa de `main@29aac19`, executada em 09/10/2026. Todas as contagens foram obtidas por comando (Anexo A), não estimadas.

## 8.1 Cobertura

| Medida | Resultado |
|---|---:|
| Arquivos rastreados por `git ls-files` | 380 |
| Configuração (não é código) | 20 |
| Documentação (antes da geração: `AGENTS.md`, `PLANO.md`, `README.md`, `RELATORIO.md`) | 4 |
| Ativos (`.svg`, `.ico`, `.ttf`) | 13 |
| Lock (`package-lock.json`) | 1 |
| **Arquivos de código** | **342** |
| Fichas completas | 274 |
| Exceções em tabela (44 migrations + 19 primitivos de UI + 5 testes) | 68 |
| Conta `fichas + exceções` | 274 + 68 = 342 — **fecha** |

## 8.2 Reconciliação

- Cada um dos **342** arquivos de código está em exatamente um dos **18** módulos: **sim**.
- A soma das fichas dos módulos bate com o inventário ([00-inventario](arquivos/00-inventario.md)): **sim**.
- Todo arquivo citado nos **14** processos existe no inventário e possui ficha: **sim**.
- **Links internos**: verificador Markdown de links relativos. Todos os arquivos de destino existem (temáticos em `docs/mapa/`, módulos em `docs/mapa/arquivos/`).
- **Dependências internas**: todas resolvem para arquivo rastreado; "Depende de"/"Usado por" foram construídos a partir do mesmo grafo de imports (confirmados por `rg`/Grep pelos basenames e pelo alias `@/`).
- **Mermaid**: 41 blocos validados com a própria biblioteca `mermaid` (via `mermaid.parse` em ambiente Node + jsdom). **0 falhas** (§8.5).

## 8.3 Suficiência

| Pergunta por ficha | Resultado | Lacuna |
|---|---|---|
| O que faz? | preenchido em Propósito e Processo | detalhes internos muito extensos ficam pelos nomes de exports/tabelas |
| De quem depende? | imports internos, env e tabelas listados | carregamentos dinâmicos não literais podem escapar à análise estática |
| Quem usa? | grafo reverso de imports (Grep) | páginas/rotas e `layout.tsx` são pontos de entrada e podem não ter importador |
| Tem teste? | busca por export/recurso/endpoint nas suítes | cobertura por referência não equivale a cobertura de linha |
| Tem tela? | cruzamento de actions/queries com as páginas | chamadas construídas dinamicamente podem exigir inspeção manual |
| Em qual processo entra? | citado nos processos 2.1–2.13 | arquivos de suporte entram indiretamente |

## 8.4 Contagens do documento

| Item | Contagem | Origem |
|---|---:|---|
| Módulos | 18 | arquivos em `docs/mapa/arquivos/` |
| Processos | 14 | seções `## 2.x` de [02-processos](02-processos.md) |
| Funcionalidades | 41 | linhas de tabela de [03-funcionalidades](03-funcionalidades.md) |
| Páginas (`page.tsx`) | 44 | `git ls-files` |
| Layouts (`layout.tsx`) | 5 | `git ls-files` |
| Rotas de API (`route.ts`) | 2 | `git ls-files` (`/api/cron/reminders`, `/app/exportar/[entity]`) |
| Server actions | 31 | `src/server/actions/*.ts` |
| Queries | 23 | `src/server/queries/*.ts` |
| Migrations | 44 | `supabase/migrations/*.sql` |
| Tabelas | 44 | blocos `create table` nas migrations |
| Funções SQL (`create function`) | 43 | migrations (inclui `security definer` e RPCs do portal) |
| Policies RLS (`create policy`) | 189 | migrations |
| Triggers (`create trigger`) | 29 | migrations |
| Buckets de Storage | 2 | `attachments` (privado), `branding` (público) |
| Enums no banco | 0 | status são inteiros/texto (`src/lib/constants.ts`) |
| Arquivos de teste | 7 | `tests/` |
| Testes (casos) | 57 unit + 118 RLS | `RELATORIO.md` §7 |
| Diagramas Mermaid | 41 | blocos ` ```mermaid ` em `docs/mapa/` |

## 8.5 Mermaid

Foram extraídos **41 blocos Mermaid** e validados com a biblioteca `mermaid` (`mermaid.parse`, em Node com jsdom): **41 válidos, 0 falhas**. Tipos usados: `flowchart TD`, `flowchart LR`, `sequenceDiagram` e `erDiagram`.

## 8.6 Dúvidas e limites

- **`src/lib/database.types.ts`** lista **43** tabelas, mas as migrations criam **44** (`rate_limit_hits` da migration `0044` não aparece nos tipos). Pode ser que os tipos estejam desatualizados (regenerar com `npm run db:types`) ou que a tabela tenha sido excluída de propósito por não ter RLS/grants. Registrado em [06-problemas-e-dividas](06-problemas-e-dividas.md) §6.1 (#13).
- As contagens de **testes (57 + 118)** vêm do `RELATORIO.md`; não foram recontadas caso a caso (a suíte de RLS roda contra o Supabase remoto).
- Cobertura de teste das fichas foi inferida por referência de export/recurso/endpoint, não por relatório de cobertura de linhas.
- Não há teste de navegador/componente que prove a integração visual das páginas (só um smoke de Playwright).
- Não foram lidos valores de `.env`/`.env.local`; somente os **nomes** de `.env.example`.
- `config.toml` foi documentado no módulo 01, mas **não** conta como arquivo de código (é configuração).

## Anexo A — comandos e contagens

| Comando | Uso | Resultado |
|---|---|---|
| `git ls-files` | universo rastreado | 380 |
| filtro por extensão + exclusão de configs/docs/assets/lock | arquivos de código | 342 |
| `git ls-files | Where page.tsx / layout.tsx / route.ts` | telas, layouts e rotas | 44 / 5 / 2 |
| `ls src/server/actions`, `ls src/server/queries` | actions e queries | 31 / 23 |
| `Select-String 'create (table|function|policy|trigger)'` nas migrations | schema | 44 / 43 / 189 / 29 |
| `Select-String '^```mermaid'` em `docs/mapa/**` | diagramas | 41 |
| `mermaid.parse` (biblioteca) sobre os 41 blocos | validação de sintaxe | 0 falhas |
| verificador de links relativos | links internos | todos resolvem |

## Anexo B — ignorados e motivo

| Grupo | Motivo |
|---|---|
| `node_modules/` | dependências reinstaláveis |
| `.next/`, `build/`, `out/` | artefatos gerados |
| `.vercel/` | estado local do deploy |
| `.git/` | metadados do repositório |
| `.env`, `.env.local` | segredos; apenas `.env.example` foi lido |
| `package-lock.json` | lock rastreado, contado, não lido linha a linha |
| `src/app/fonts/**` e `public/*.svg`, `favicon.ico` | ativos binários |
| `next-env.d.ts`, `tsconfig.tsbuildinfo` | gerados |

## Anexo C — índice de rotas

Rotas de página do App Router (uma linha por segmento de topo; as rotas de API são as duas `route.ts`).

| Rota | Acesso | Ficha em |
|---|---|---|
| `/` | pública (redireciona para `/app` ou `/login`) | [11](arquivos/11-app-nucleo-auth-e-publico.md) §11.2 |
| `/login` | pública | [11](arquivos/11-app-nucleo-auth-e-publico.md) §11.8 |
| `/convite/[token]` | pública (aceite de convite) | [11](arquivos/11-app-nucleo-auth-e-publico.md) §11.10 |
| `/f/[slug]` | pública (captação/web-to-lead) | [11](arquivos/11-app-nucleo-auth-e-publico.md) §11.13 |
| `/app` | sessão (membro de um tenant) | [12](arquivos/12-app-painel-e-clientes.md) §12.2 |
| `/app/clientes`, `/app/clientes/[id]` | sessão | [12](arquivos/12-app-painel-e-clientes.md) §12.4/§12.7 |
| `/app/projetos`, `/app/projetos/[id]` | sessão | [13](arquivos/13-app-projetos-e-tarefas.md) §13.1/§13.4 |
| `/app/tarefas`, `/app/tarefas/[id]` | sessão | [13](arquivos/13-app-projetos-e-tarefas.md) §13.9/§13.14 |
| `/app/orcamentos`, `/app/orcamentos/[id]` | sessão | [14](arquivos/14-app-financeiro.md) §14.1/§14.4 |
| `/app/faturas`, `/app/faturas/[id]` | sessão | [14](arquivos/14-app-financeiro.md) §14.5/§14.10 |
| `/app/despesas`, `/app/contratos`, `/app/timesheet`, `/app/metas`, `/app/relatorios` | sessão | [14](arquivos/14-app-financeiro.md) |
| `/app/leads`, `/app/leads/[id]`, `/app/tickets`, `/app/tickets/[id]`, `/app/base-conhecimento`, `/app/base-conhecimento/[id]`, `/app/calendario`, `/app/atividades` | sessão | [15](arquivos/15-app-comercial-e-atendimento.md), [12](arquivos/12-app-painel-e-clientes.md) §12.3 |
| `/app/configuracoes` | sessão | [16](arquivos/16-app-configuracoes-e-plataforma.md) §16.1 |
| `/plataforma` | super-admin | [16](arquivos/16-app-configuracoes-e-plataforma.md) §16.18 |
| `/portal`, `/portal/login` | cliente (contato do portal) | [17](arquivos/17-portal-do-cliente.md) §17.1/§17.4 |
| `/portal/projetos`, `/orcamentos`, `/faturas`, `/contratos`, `/despesas`, `/tickets`, `/ajuda` | cliente | [17](arquivos/17-portal-do-cliente.md) |
| `GET /api/cron/reminders` | `Bearer CRON_SECRET` (cron) | [11](arquivos/11-app-nucleo-auth-e-publico.md) §11.12 |
| `GET /app/exportar/[entity]` | sessão (exportação CSV) | [14](arquivos/14-app-financeiro.md) §14.24 |
