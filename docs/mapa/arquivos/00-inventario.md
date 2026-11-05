# Inventário de arquivos de código

> Fichas completas: **274** · Exceções em tabela: **68** · Total: **342** arquivos de código.

> Gerado a partir das fichas em docs/mapa/arquivos/. Migrations, testes e primitivos de UI viram linhas de tabela de exceção nos respectivos módulos.

#### Módulo 01 — Banco: migrations, seed e tipos

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/lib/database.types.ts` | src/lib | tipos TypeScript do banco, gerados automaticamente, usados para tipar os clientes Supabase do projeto inteiro. | completa | — | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) |
| `supabase/seed.sql` | supabase | ponto de entrada do seed do Supabase CLI em `supabase db reset`; hoje só contém comentários de orientação, sem inserir dados. | completa | — | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) |
| `supabase/migrations/0001_init_platform.sql` | supabase/migrations | Cria `profiles`, `tenants`, `memberships`, `invitations`; funções `is_tenant_member`, `has_tenant_role`, `is_super_admin`, `shares_tenant`, `set_... | tabela | Migração de fundação (plataforma/multi-tenant). | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0002_companies_contacts.sql` | supabase/migrations | Cria `companies` e `contacts` com FK composta `(id, tenant_id)`. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0003_projects.sql` | supabase/migrations | Cria `projects` e `project_members` (FK composta, RLS por membro). | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0004_tasks.sql` | supabase/migrations | Cria `tasks` e `task_checklist_items`. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0005_comments_attachments.sql` | supabase/migrations | Cria `comments` e `attachments`; funções `entity_belongs_to_tenant` e `storage_path_tenant`; cria o bucket privado `attachments` e as policies de... | tabela | Migração de schema + Storage. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0006_time_entries.sql` | supabase/migrations | Cria `time_entries`; índice único que garante um timer em execução por usuário. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0007_finance.sql` | supabase/migrations | Adiciona colunas financeiras em `tenants`; cria `invoices`, `estimates`, `document_items`, `payments`; função `next_document_number`; amplia `ent... | tabela | Migração de schema + função de numeração. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0008_client_portal.sql` | supabase/migrations | Adiciona `contacts.user_id`; funções do cliente `is_client_of_company`, `client_can_view_project`, `client_can_view_document`, `client_can_view_e... | tabela | Migração de portal/RPC. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0009_client_storage.sql` | supabase/migrations | Policy de leitura do bucket `attachments` pelo cliente (via `contacts`). | tabela | Migração de Storage (portal). | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0010_helpdesk.sql` | supabase/migrations | Colunas `ticket_prefix`/`next_ticket_number` em `tenants`; recria `next_document_number` (ticket); cria `departments`, `tickets`, `ticket_replies`;... | tabela | Migração de schema + função. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0011_knowledge_base.sql` | supabase/migrations | Cria `kb_categories`, `kb_articles`, `faqs`; policies de leitura pública para o cliente. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0012_client_tickets.sql` | supabase/migrations | Recria `next_document_number` (cliente pode criar ticket), `client_can_view_ticket` e `client_can_view_entity`; policies de ticket/resposta/departa... | tabela | Migração de RLS/RPC do portal. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0013_client_kb_categories.sql` | supabase/migrations | Policy de leitura de `kb_categories` pelo cliente. | tabela | Migração de RLS (portal). | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0014_leads.sql` | supabase/migrations | Cria `lead_statuses`, `lead_sources`, `leads`, `lead_activities`. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0015_plans.sql` | supabase/migrations | Cria `plans`; colunas de plano em `tenants` (`plan_id`, `plan_status`, `trial_ends_at`, `subscription_ends_at`); policies; insere 3 planos padrão. | tabela | Migração de schema + carga inicial. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0016_notifications.sql` | supabase/migrations | Cria `notifications`. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0017_roadmap_items.sql` | supabase/migrations | Cria `roadmap_items` (só super-admin) e insere o backlog inicial. | tabela | Migração de schema + carga. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0018_milestones.sql` | supabase/migrations | Cria `milestones`; adiciona `tasks.milestone_id` com FK composta; policy de leitura do cliente. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0019_tags.sql` | supabase/migrations | Cria `tags` e `taggables`; amplia `entity_belongs_to_tenant` para `company`/`lead`. | tabela | Migração de schema + função. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0020_custom_fields.sql` | supabase/migrations | Cria `custom_field_definitions` e `custom_field_values`. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0021_branding.sql` | supabase/migrations | Cria o bucket público `branding` e suas policies (leitura pública, escrita por tenant). | tabela | Migração de Storage. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0022_seed_backlog_suggestions.sql` | supabase/migrations | Insere sugestões de melhoria em `roadmap_items`. | tabela | Migração de dados (backlog). | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0023_time_summary.sql` | supabase/migrations | Cria a função `time_entries_summary` (RPC de totais de horas/valor). | tabela | Migração de RPC/agregação. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0024_expenses.sql` | supabase/migrations | Cria `expenses` (FK composta com project/company). | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0025_contracts.sql` | supabase/migrations | Cria `contracts`. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0026_roadmap_status.sql` | supabase/migrations | Atualiza status de itens do roadmap (`done`/`in_progress`). | tabela | Migração de dados. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0027_notifications_realtime.sql` | supabase/migrations | Adiciona `notifications` à publicação `supabase_realtime`; adiciona `profiles.notify_email`. | tabela | Migração de Realtime + coluna. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0028_calendar.sql` | supabase/migrations | Cria `calendar_events`. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0029_activity_log.sql` | supabase/migrations | Cria `activity_log`; função `log_activity` (security definer) e triggers de auditoria nas tabelas de negócio. | tabela | Migração de schema + auditoria. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0030_goals.sql` | supabase/migrations | Cria `goals`. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0031_email.sql` | supabase/migrations | Cria `email_templates` e `email_log`. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0032_web_to_lead.sql` | supabase/migrations | Colunas `web_to_lead_enabled`/`web_to_lead_source_id` em `tenants` + FK para `lead_sources`. | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0033_roadmap_status_2.sql` | supabase/migrations | Atualiza status do roadmap (fases F12–F16). | tabela | Migração de dados. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0034_portal_contracts_expenses.sql` | supabase/migrations | Policies do cliente para `contracts` e `expenses` (faturáveis). | tabela | Migração de RLS (portal). | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0035_task_dependencies.sql` | supabase/migrations | Cria `task_dependencies` (FK composta para tasks, sem auto-dependência). | tabela | Migração de schema. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0036_protect_super_admin.sql` | supabase/migrations | Revoga `update` de `profiles` e concede só colunas editáveis; função/trigger `protect_super_admin`. | tabela | Migração de segurança. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0037_security_high.sql` | supabase/migrations | Policies de `memberships` (só owner mexe em owner); `client_can_view_attachment_path`; trigger `protect_tenant_platform_columns`; policy de delete... | tabela | Migração de segurança (alto). | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0038_security_medium.sql` | supabase/migrations | Policy `notifications_insert`; `client_can_view_ticket` isolado por tenant; policy `tickets_client_select`. | tabela | Migração de segurança (médio). | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0039_security_low.sql` | supabase/migrations | Função `is_authenticated_staff` + policy `plans_select`; revoga `execute` de funções para `public`/`anon`. | tabela | Migração de segurança (baixo). | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0040_security_low_rls.sql` | supabase/migrations | Ajusta policies de leitura do portal (soft-delete), `notifications_update`, `email_log_insert`, `document_items_update`. | tabela | Migração de segurança/RLS. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0041_security_p0.sql` | supabase/migrations | Corrige achados P0: anexo exige `storage_path_tenant`; `memberships`/`invitations` só owner cria owner; `protect_contact_user_id`; `client_can_vie... | tabela | Migração de segurança (P0). | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0042_portal_reads.sql` | supabase/migrations | Cria RPCs `portal_contact`, `portal_list_projects`, `portal_get_project`, `portal_list_tasks`, `portal_list_milestones`; remove a leitura direta do... | tabela | Migração de RPC/portal. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0043_portal_contracts_expenses.sql` | supabase/migrations | Cria RPCs `portal_list_contracts` e `portal_list_expenses`; remove a leitura direta do cliente nessas tabelas. | tabela | Migração de RPC/portal. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |
| `supabase/migrations/0044_rate_limit_and_profile_email.sql` | supabase/migrations | Cria `rate_limit_hits` + função `check_rate_limit`; adiciona `profiles.email`; recria `handle_new_user` e cria `handle_user_email_update` + trigg... | tabela | Migração de schema + RPC de rate limit. | [01-banco-migrations-e-seed.md](01-banco-migrations-e-seed.md) §01 |

#### Módulo 02 — Núcleo da aplicação (src/lib) e sessão

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/middleware.ts` | src | Ponto de entrada do middleware do Next.js; delega toda requisição para `updateSession`, que renova a sessão e protege as rotas. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/supabase/middleware.ts` | src/lib/supabase | Renova a sessão Supabase a cada requisição e aplica a guarda de rotas (manda deslogados para login e logados para fora das telas de login). | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/supabase/server.ts` | src/lib/supabase | Criar o cliente Supabase para uso no servidor (RSC, Server Actions e route handlers), usando os cookies da sessão. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/supabase/client.ts` | src/lib/supabase | Criar o cliente Supabase no navegador (browser), para uso em componentes client. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/supabase/admin.ts` | src/lib/supabase | Criar o cliente Supabase com a `service role`, que **ignora o RLS**, para fluxos administrativos controlados no servidor. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/auth.ts` | src/lib | Centralizar leitura de sessão e conta: usuário logado, perfil, vínculos (memberships) com tenants e checagem de super-admin. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/tenant.ts` | src/lib | Resolver qual tenant (empresa) está ativo para o usuário logado, a partir das memberships. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/constants.ts` | src/lib | Fonte única de rótulos, cores e enums do domínio (status de projeto/tarefa/ticket, prioridades, billing, campos personalizados, despesas, formas... | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/env.ts` | src/lib | Validar e tipar as variáveis de ambiente do servidor com Zod, e listar os e-mails de super-admin. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/db-error.ts` | src/lib | Padronizar o tratamento de erro de banco nas Server Actions: loga no servidor e devolve uma mensagem genérica ao cliente. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/logger.ts` | src/lib | Logger mínimo que emite linhas JSON no console, com níveis `info`, `warn` e `error`. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/format.ts` | src/lib | Formatar valores para exibição em português: dinheiro (BRL por padrão) e data. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/pagination.ts` | src/lib | Definir o tamanho de página e interpretar o parâmetro `?page=` de forma segura. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/revalidate.ts` | src/lib | Revalidar os caminhos afetados quando uma entidade (tarefa/projeto/ticket) muda, incluindo as listas. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/slug.ts` | src/lib | Gerar um slug ASCII a partir de um texto (usado em artigos da base de conhecimento). | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/avatar.ts` | src/lib | Derivar iniciais e uma cor determinística a partir de um nome, para avatares sem imagem. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/utils.ts` | src/lib | Reexportar o utilitário `cn` (merge de classes Tailwind) usado pelos componentes de UI. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/csv.ts` | src/lib | Gerar e interpretar CSV (separador `;`) com proteção contra injeção de fórmula e suporte a aspas. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/leads-defaults.ts` | src/lib | Valores padrão semeados quando um tenant é criado: status de lead, origens de lead e departamentos de suporte. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/gantt.ts` | src/lib | Cálculo puro de cronograma para o Gantt: somar/diferenciar dias, propagar datas por dependências e detectar ciclos. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/reports.ts` | src/lib | Montar as linhas das tabelas de relatório (rentabilidade, produtividade e conversão de leads por origem) a partir de dados já lidos do banco. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/documents/totals.ts` | src/lib/documents | Calcular subtotal, imposto, desconto e total de um documento financeiro (orçamento/fatura) a partir dos itens e do cabeçalho. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/email.ts` | src/lib | Enviar e-mail transacional via API HTTP do Resend, degradando com segurança quando não há chave. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/lib/email-templates.ts` | src/lib | Guardar os templates de e-mail padrão (assunto/corpo) e as funções de renderização/escape. | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |
| `src/hooks/use-mobile.ts` | src/hooks | Hook React que informa se a viewport está no tamanho "mobile" (abaixo de 768px). | completa | — | [02-nucleo-lib-aplicacao.md](02-nucleo-lib-aplicacao.md) |

#### Módulo 03 — Validações Zod

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/lib/validations/auth.ts` | src/lib/validations | Valida o login (e-mail + senha) e a criação de um novo tenant/empresa. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/calendar.ts` | src/lib/validations | Valida os dados de um evento de agenda/calendário. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/clients.ts` | src/lib/validations | Valida o cadastro de clientes (empresas) e de contatos. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/contracts.ts` | src/lib/validations | Valida os dados de um contrato. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/custom-fields.ts` | src/lib/validations | Valida a definição de um campo personalizado (metadado), não o valor preenchido. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/documents.ts` | src/lib/validations | Valida documentos financeiros (orçamentos/faturas) com seus itens de linha. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/expenses.ts` | src/lib/validations | Valida o lançamento de uma despesa. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/fields.ts` | src/lib/validations | Reúne os construtores reutilizáveis de campos opcionais usados pelos demais schemas. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/goals.ts` | src/lib/validations | Valida uma meta (goal) de período. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/kb.ts` | src/lib/validations | Valida categorias, artigos e FAQs da base de conhecimento. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/leads.ts` | src/lib/validations | Valida o lead e suas entidades auxiliares (status, origem e atividade). | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/milestones.ts` | src/lib/validations | Valida um marco (milestone) de projeto. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/plan.ts` | src/lib/validations | Valida um plano comercial (usado no painel da plataforma/super-admin). | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/projects.ts` | src/lib/validations | Valida um projeto. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/public-lead.ts` | src/lib/validations | Valida o lead enviado por um formulário público (captação externa). | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/tags.ts` | src/lib/validations | Valida uma tag (etiqueta) com cor. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/tasks.ts` | src/lib/validations | Valida uma tarefa e um item de checklist. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/team.ts` | src/lib/validations | Valida o convite de um membro e a aceitação do convite. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/tenant.ts` | src/lib/validations | Valida as configurações da empresa (nome e cor primária de marca). | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/tickets.ts` | src/lib/validations | Valida um ticket de suporte e sua resposta. | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |
| `src/lib/validations/time.ts` | src/lib/validations | Valida um lançamento manual de horas (apontamento de tempo). | completa | — | [03-validacoes-zod.md](03-validacoes-zod.md) |

#### Módulo 04 — Helpers do servidor

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/server/permissions.ts` | src/server | define quem é "gerente" de um tenant, para as ações que só podem ser feitas por `owner` ou `admin`. | completa | — | [04-servidor-helpers.md](04-servidor-helpers.md) |
| `src/server/plan-limits.ts` | src/server | verificar se o tenant ainda pode criar novos registros de um recurso (clientes, projetos, tarefas, tickets, leads) conforme os limites do plano con... | completa | — | [04-servidor-helpers.md](04-servidor-helpers.md) |
| `src/server/documents.ts` | src/server | reunir os utilitários compartilhados por orçamentos (estimates) e faturas (invoices): ler o formulário, calcular os totais, gravar os itens, ler... | completa | — | [04-servidor-helpers.md](04-servidor-helpers.md) |
| `src/server/custom-fields.ts` | src/server | persistir os valores dos campos personalizados de uma entidade (cliente, projeto, tarefa, lead) a partir do `FormData` do formulário. | completa | — | [04-servidor-helpers.md](04-servidor-helpers.md) |
| `src/server/email.ts` | src/server | enviar e-mail transacional usando o template do tenant (com fallback para os padrões) e registrar o envio no log. | completa | — | [04-servidor-helpers.md](04-servidor-helpers.md) |
| `src/server/notifications.ts` | src/server | criar uma notificação in-app para um usuário do tenant. | completa | — | [04-servidor-helpers.md](04-servidor-helpers.md) |
| `src/server/reminders.ts` | src/server | job de lembretes que percorre os tenants e gera notificações + e-mails para tarefas a vencer e faturas vencidas. | completa | — | [04-servidor-helpers.md](04-servidor-helpers.md) |

#### Módulo 05 — Queries do servidor (leitura RSC)

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/server/queries/companies.ts` | src/server/queries | ler empresas (clientes) e seus contatos para as telas de clientes, projetos, faturas, orçamentos, tickets e calendário. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/projects.ts` | src/server/queries | ler projetos, seus responsáveis/membros e os membros do tenant, sempre recalculando o progresso a partir das tarefas quando marcado. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/tasks.ts` | src/server/queries | ler tarefas (listagem/detalhe), itens de checklist, dependências e contagens por projeto para o board e os cartões. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/time.ts` | src/server/queries | ler registros de horas (time entries), a entrada em andamento, resumos e horas faturáveis ainda não cobradas; também formata/calcula durações. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/comments.ts` | src/server/queries | listar os comentários de uma entidade genérica (projeto, tarefa, lead etc.), com o nome do autor. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/attachments.ts` | src/server/queries | listar anexos de uma entidade e gerar URLs assinadas temporárias do Storage para exibi-los. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/documents.ts` | src/server/queries | ler orçamentos (estimates), faturas (invoices), seus itens de linha e pagamentos — cobre as telas internas e do portal. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/expenses.ts` | src/server/queries | listar despesas com filtros por projeto/empresa, para a tela de despesas e exportação. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/contracts.ts` | src/server/queries | listar contratos com filtros por empresa/status e buscar um contrato por id. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/leads.ts` | src/server/queries | ler leads, seus status, origens e o histórico de atividades, para o kanban, formulários e relatórios. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/tickets.ts` | src/server/queries | ler tickets, departamentos e respostas do ticket (incluindo internas) para a tela de suporte. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/kb.ts` | src/server/queries | ler a base de conhecimento (categorias, artigos e FAQs); ao abrir um artigo, incrementa o contador de visualizações. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/calendar.ts` | src/server/queries | montar os itens do calendário mensal juntando eventos, tarefas, faturas e contratos. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/goals.ts` | src/server/queries | listar metas do tenant já com o valor alcançado e a porcentagem de progresso calculada. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/reports.ts` | src/server/queries | agregar todos os dados dos relatórios (financeiro, leads, produtividade, despesas, horas) num único objeto `ReportData` para a página de relató... | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/activity.ts` | src/server/queries | listar o log de atividades do tenant com paginação e filtro por entidade. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/notifications.ts` | src/server/queries | ler as notificações in-app de um usuário e contar as não lidas. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/tags.ts` | src/server/queries | ler tags e os vínculos tag↔entidade (taggables) para filtros/pickers de etiquetas. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/custom-fields.ts` | src/server/queries | ler as definições de campos personalizados de uma entidade e os valores preenchidos para uma entidade concreta. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/email.ts` | src/server/queries | ler os templates de e-mail do tenant (em mapa por chave) e o log dos últimos envios. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/team.ts` | src/server/queries | listar os membros do tenant (com papel e dados do perfil) e os convites pendentes. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/milestones.ts` | src/server/queries | listar marcos (milestones) de um projeto com contagem de tarefas e progresso, além de opções para selects. | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |
| `src/server/queries/portal.ts` | src/server/queries | ler os dados do **portal do cliente** (contact, projetos, tarefas, marcos, documentos, contratos, despesas, tickets e base de conhecimento), garant... | completa | — | [05-servidor-queries.md](05-servidor-queries.md) |

#### Módulo 06 — Server actions — núcleo

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/server/actions/auth.ts` | src/server/actions | entrar no sistema com e-mail/senha e sair dele, usando o Supabase Auth. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/profile.ts` | src/server/actions | salvar a preferência do usuário de receber (ou não) notificações por e-mail. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/tenant.ts` | src/server/actions | trocar a empresa ativa do usuário e editar as configurações da empresa (nome, cor, logo e web-to-lead). | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/team.ts` | src/server/actions | gerenciar a equipe do tenant: convidar por e-mail, aceitar convite, trocar papéis e remover membros. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/platform.ts` | src/server/actions | ações do super-admin da plataforma: criar empresas (com dados iniciais) e gerenciar planos. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/notifications.ts` | src/server/actions | marcar uma ou todas as notificações do usuário como lidas. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/email.ts` | src/server/actions | salvar ou restaurar o padrão dos modelos de e-mail personalizados do tenant. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/search.ts` | src/server/actions | busca global por clientes, projetos e tarefas do tenant ativo (usada na paleta de busca). | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/import.ts` | src/server/actions | importar clientes ou leads a partir de um arquivo CSV, respeitando o limite do plano e ignorando duplicados. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/tags.ts` | src/server/actions | criar, editar, apagar tags e associá-las a entidades (cliente, projeto, tarefa, lead, ticket). | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/custom-fields.ts` | src/server/actions | gerenciar as definições de campos personalizados por entidade do tenant. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/calendar.ts` | src/server/actions | criar, editar e apagar (exclusão lógica) eventos da agenda. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/attachments.ts` | src/server/actions | registrar no banco um anexo já enviado ao Storage e apagar anexos. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/comments.ts` | src/server/actions | adicionar e apagar comentários em tarefas e projetos. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |
| `src/server/actions/kb.ts` | src/server/actions | gerenciar categorias, artigos e FAQs da base de conhecimento. | completa | — | [06-servidor-actions-core.md](06-servidor-actions-core.md) |

#### Módulo 07 — Server actions — negócio

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/server/actions/companies.ts` | src/server/actions | Criar, editar e excluir (soft delete) clientes/empresas do tenant. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/contacts.ts` | src/server/actions | CRUD de contatos de um cliente e liberação de acesso ao portal do cliente. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/leads.ts` | src/server/actions | CRUD de leads, mudança de status (kanban), atividades, conversão em cliente e gestão de status/origens. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/public-lead.ts` | src/server/actions | Receber o envio do formulário público de captação ("web-to-lead") e criar o lead sem sessão. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/projects.ts` | src/server/actions | CRUD de projetos e gerência de membros (equipe) do projeto. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/tasks.ts` | src/server/actions | CRUD de tarefas, mudança de status e itens de checklist. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/time.ts` | src/server/actions | Apontamento de horas: cronômetro (iniciar/parar), lançamento manual e exclusão. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/gantt.ts` | src/server/actions | Editar datas das tarefas no cronograma e gerenciar dependências (com detecção de ciclo). | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/milestones.ts` | src/server/actions | CRUD de marcos (milestones) de um projeto. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/estimates.ts` | src/server/actions | CRUD de orçamentos, mudança de status e conversão de orçamento em fatura. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/invoices.ts` | src/server/actions | CRUD de faturas, pagamentos, recálculo de status e faturamento de horas de projeto. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/expenses.ts` | src/server/actions | CRUD de despesas, podendo vinculá-las a projeto/cliente. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/contracts.ts` | src/server/actions | CRUD de contratos de clientes. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/goals.ts` | src/server/actions | CRUD de metas por período e métrica. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/tickets.ts` | src/server/actions | CRUD de tickets de atendimento (staff), status, respostas internas/públicas e exclusão. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |
| `src/server/actions/portal.ts` | src/server/actions | Login/logout do portal do cliente, resposta a orçamentos e abertura de tickets pelo cliente. | completa | — | [07-servidor-actions-negocio.md](07-servidor-actions-negocio.md) |

#### Módulo 08 — Componentes do app — shell e widgets

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/components/providers.tsx` | src/components | Componente raiz cliente que envolve toda a aplicação com os provedores globais (tema, React Query, tooltip e toaster). | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/app-sidebar.tsx` | src/components/app | Barra lateral (`Sidebar` colapsável) com o logotipo/seletor de empresa e todos os links de navegação do app. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/user-menu.tsx` | src/components/app | Menu do usuário logado (avatar com iniciais) no cabeçalho, com a opção "Sair". | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/tenant-switcher.tsx` | src/components/app | Dropdown para trocar a empresa (tenant) ativa entre as memberships do usuário. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/notifications-bell.tsx` | src/components/app | Sino de notificações com contador de não lidas, lista suspensa e atualização em tempo real. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/theme-toggle.tsx` | src/components/app | Botão que alterna entre tema claro e escuro. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/new-menu.tsx` | src/components/app | Botão "Novo" no cabeçalho com atalhos para criar os principais registros. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/search-dialog.tsx` | src/components/app | Modal de busca global por clientes, projetos e tarefas. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/demo-credentials.tsx` | src/components/app | Bloco informativo nas telas de login que mostra credenciais demo e permite preencher o formulário com um clique. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/placeholder.tsx` | src/components/app | Placeholder de tela "em construção" com título e descrição. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/stat-card.tsx` | src/components/app | Card de indicador (KPI) com ícone, valor e rótulo, em cinco tons de cor. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/pagination.tsx` | src/components/app | Controle de paginação por query string com botões "Anterior"/"Próxima". | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/status-pill.tsx` | src/components/app | Pill/badge colorido para exibir o nome de um status com um ponto na cor correspondente. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/entity-avatar.tsx` | src/components/app | Avatar quadrado com iniciais e cor derivada do nome, para clientes e entidades. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/avatar-stack.tsx` | src/components/app | Pilha de avatares circulares (membros de um projeto) com contador de excedentes. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/export-button.tsx` | src/components/app | Botão de "Exportar CSV" que aponta para uma URL de download. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/import-csv-dialog.tsx` | src/components/app | Diálogo genérico de importação de CSV, parametrizado pela action de import. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/tag-filter.tsx` | src/components/app | Filtro horizontal de tags por query string nas telas de listagem. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |
| `src/components/app/tag-picker.tsx` | src/components/app | Seletor de tags de uma entidade (atribuir/remover) com criação inline, além do diálogo interno de nova tag. | completa | — | [08-componentes-app-nucleo.md](08-componentes-app-nucleo.md) |

#### Módulo 09 — Componentes de domínio

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/components/app/attachments-section.tsx` | src/components/app | painel de anexos de uma entidade (tarefa, projeto ou ticket): lista os arquivos já enviados e oferece o uploader e o botão de remover. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/attachment-uploader.tsx` | src/components/app | botão/label client que envia um arquivo ao bucket `attachments` do Supabase Storage e registra o metadado no banco. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/delete-attachment-button.tsx` | src/components/app | botão client que remove um anexo (registro + arquivo no Storage) com confirmação. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/comments-section.tsx` | src/components/app | painel de comentários de uma tarefa ou projeto, com lista, formulário de novo comentário e botão de remover para autor ou moderadores. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/delete-comment-button.tsx` | src/components/app | botão client que remove um comentário, com confirmação. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/delete-time-entry-button.tsx` | src/components/app | botão client que remove um apontamento de horas, com confirmação. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/time-entries-table.tsx` | src/components/app | tabela de apontamentos de horas com totais (duração e valor faturável), usada tanto em contexto de projeto/tarefa quanto globalmente com paginação... | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/contract-bits.tsx` | src/components/app | selo (`Badge`) que exibe o status de um contrato e destaca quando está vencido. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/milestone-bits.tsx` | src/components/app | selo que exibe o status de um marco (milestone) de projeto. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/project-bits.tsx` | src/components/app | reúne dois elementos visuais de projeto: o selo de status e a barra de progresso. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/task-bits.tsx` | src/components/app | selos de **status** e **prioridade** de tarefa. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/ticket-bits.tsx` | src/components/app | selos de **status**, **prioridade** e **tipo** de ticket. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/custom-field-inputs.tsx` | src/components/app | renderiza os campos personalizados de uma entidade como inputs de formulário (texto, número, data, select, textarea, checkbox) para uso dentro de... | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/custom-fields-view.tsx` | src/components/app | card somente-leitura que exibe os valores preenchidos dos campos personalizados de uma entidade (usado nas páginas de detalhe). | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/document-items-editor.tsx` | src/components/app | editor client de itens de orçamento/fatura: linhas com descrição, quantidade, valor e imposto, com adicionar/remover. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/document-status-badge.tsx` | src/components/app | selos de status para orçamentos (estimates) e faturas (invoices), destacando faturas vencidas. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/project-gantt.tsx` | src/components/app | cronograma (Gantt) interativo do projeto: barras de tarefas e marcadores de marco posicionados por data, com arrastar para mover/reajustar, linha d... | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |
| `src/components/app/gantt-dependency-dialog.tsx` | src/components/app | diálogo client para ver, adicionar e remover dependências (predecessoras) de uma tarefa no Gantt. | completa | — | [09-componentes-dominio.md](09-componentes-dominio.md) |

#### Módulo 10 — Primitivos de UI

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/components/ui/button.tsx` | src/components/ui | Botão padrão do app, com variantes visuais e tamanhos prontos, embrulhando o `Button` do `@base-ui/react`. É a primitiva mais reutilizada da int... | completa | — | [10-componentes-ui.md](10-componentes-ui.md) |
| `src/components/ui/avatar.tsx` | src/components/ui | Exporta `Avatar`, `AvatarImage`, `AvatarFallback`, `AvatarBadge`, `AvatarGroup`, `AvatarGroupCount` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/badge.tsx` | src/components/ui | Exporta `Badge`, `badgeVariants` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/breadcrumb.tsx` | src/components/ui | Exporta `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/card.tsx` | src/components/ui | Exporta `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardAction`, `CardDescription`, `CardContent` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/checkbox.tsx` | src/components/ui | Exporta `Checkbox` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/dialog.tsx` | src/components/ui | Exporta `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, ... | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/dropdown-menu.tsx` | src/components/ui | Exporta `DropdownMenu`, `DropdownMenuPortal`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenu... | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/input.tsx` | src/components/ui | Exporta `Input` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/label.tsx` | src/components/ui | Exporta `Label` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/select.tsx` | src/components/ui | Exporta `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectValue`, `SelectSeparator`, `SelectScrollUpBu... | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/separator.tsx` | src/components/ui | Exporta `Separator` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/sheet.tsx` | src/components/ui | Exporta `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/sidebar.tsx` | src/components/ui | Exporta `Sidebar`, `SidebarProvider`, `SidebarTrigger`, `SidebarRail`, `SidebarInset`, `SidebarInput`, `SidebarHeader`, `SidebarFooter`, `SidebarSe... | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/skeleton.tsx` | src/components/ui | Exporta `Skeleton` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/sonner.tsx` | src/components/ui | Exporta `Toaster` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/table.tsx` | src/components/ui | Exporta `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/tabs.tsx` | src/components/ui | Exporta `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `tabsListVariants` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/textarea.tsx` | src/components/ui | Exporta `Textarea` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |
| `src/components/ui/tooltip.tsx` | src/components/ui | Exporta `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | tabela | Família homogênea de primitivos shadcn | [10-componentes-ui.md](10-componentes-ui.md) §10 |

#### Módulo 11 — App: layouts, autenticação e público

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/app/layout.tsx` | src/app | layout raiz da aplicação; monta o `<html>`/`<body>`, carrega as fontes, injeta o CSS global e envolve todas as páginas com os providers de tema,... | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/page.tsx` | src/app | página inicial da raiz `/`; apenas decide para onde mandar o visitante. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/error.tsx` | src/app | tela de erro padrão (error boundary) das rotas; mostra a mensagem e um botão para tentar de novo. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/global-error.tsx` | src/app | fallback de último nível quando o próprio layout raiz falha ao renderizar. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/not-found.tsx` | src/app | tela 404 padrão. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/globals.css` | src/app | folha de estilos global: importa o Tailwind e o CSS do shadcn, define o tema (cores claro/escuro), as fontes e tamanhos de texto do projeto. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/(auth)/layout.tsx` | src/app/(auth) | layout do grupo de rotas `(auth)` (login e convite); monta uma coluna lateral de marca e centraliza o conteúdo. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/(auth)/login/page.tsx` | src/app/(auth) | página de login do time (equipe), em `/login`. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/(auth)/login/login-form.tsx` | src/app/(auth) | formulário client de login que envia e-mail/senha para a server action e mostra erro. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/(auth)/convite/[token]/page.tsx` | src/app/(auth) | página de aceite de convite de equipe, aberta pelo link `/convite/<token>`. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/(auth)/convite/[token]/accept-invitation-form.tsx` | src/app/(auth) | formulário client que conclui o aceite do convite, com dois modos (usuário já logado x novo usuário). | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/api/cron/reminders/route.ts` | src/app/api | rota de API que dispara o job de lembretes (tarefas vencendo e faturas vencidas), protegida por segredo. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/f/[slug]/page.tsx` | src/app/f | página pública de captação de leads de um tenant, acessível por `/f/<slug>`. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |
| `src/app/f/[slug]/public-lead-form.tsx` | src/app/f | formulário público (client) que envia os dados do visitante como novo lead. | completa | — | [11-app-nucleo-auth-e-publico.md](11-app-nucleo-auth-e-publico.md) |

#### Módulo 12 — App: painel e clientes

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/app/app/layout.tsx` | src/app/app | Layout RSC de toda a área autenticada sob `/app`. Monta a barra lateral, o cabeçalho com busca/menus/notificações e aplica o tema de cores da e... | completa | — | [12-app-painel-e-clientes.md](12-app-painel-e-clientes.md) |
| `src/app/app/page.tsx` | src/app/app | Dashboard "Visão geral" (`/app`). Reúne indicadores, gráficos e listas resumidas da empresa ativa. | completa | — | [12-app-painel-e-clientes.md](12-app-painel-e-clientes.md) |
| `src/app/app/atividades/page.tsx` | src/app/app | Página "Atividades" (`/app/atividades`): trilha de auditoria da empresa, com filtro por entidade e paginação. | completa | — | [12-app-painel-e-clientes.md](12-app-painel-e-clientes.md) |
| `src/app/app/clientes/page.tsx` | src/app/app | Listagem de clientes/empresas (`/app/clientes`), com filtro por tag, contagem de contatos, exportação, importação CSV e botão de novo cliente. | completa | — | [12-app-painel-e-clientes.md](12-app-painel-e-clientes.md) |
| `src/app/app/clientes/company-form-dialog.tsx` | src/app/app | Dialog client de criar/editar cliente (empresa), reutilizado na listagem e no detalhe. Contém os campos de empresa e os campos personalizados. | completa | — | [12-app-painel-e-clientes.md](12-app-painel-e-clientes.md) |
| `src/app/app/clientes/delete-company-button.tsx` | src/app/app | Botão client que exclui (soft delete) um cliente, com confirmação. | completa | — | [12-app-painel-e-clientes.md](12-app-painel-e-clientes.md) |
| `src/app/app/clientes/[id]/page.tsx` | src/app/app | Página de detalhe do cliente (`/app/clientes/[id]`): dados da empresa, campos personalizados, tags e contatos. | completa | — | [12-app-painel-e-clientes.md](12-app-painel-e-clientes.md) |
| `src/app/app/clientes/[id]/contact-form-dialog.tsx` | src/app/app | Dialog client de criar/editar contato de um cliente. | completa | — | [12-app-painel-e-clientes.md](12-app-painel-e-clientes.md) |
| `src/app/app/clientes/[id]/delete-contact-button.tsx` | src/app/app | Botão client que remove (soft delete) um contato do cliente, com confirmação. | completa | — | [12-app-painel-e-clientes.md](12-app-painel-e-clientes.md) |
| `src/app/app/clientes/[id]/invite-portal-dialog.tsx` | src/app/app | Dialog client para liberar acesso do contato ao portal do cliente, definindo uma senha inicial. | completa | — | [12-app-painel-e-clientes.md](12-app-painel-e-clientes.md) |

#### Módulo 13 — App: projetos e tarefas

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/app/app/projetos/page.tsx` | src/app/app | Listar os projetos do tenant ativo agrupados por status (Pendentes, Em andamento, Concluídos, Cancelados), com progresso, prazo, contagem de taref... | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/projetos/project-form-dialog.tsx` | src/app/app | Dialog de criar/editar projeto, reaproveitado nas telas de lista e detalhe. | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/projetos/delete-project-button.tsx` | src/app/app | Botão que exclui (soft delete) o projeto atual, com confirmação. | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/projetos/[id]/page.tsx` | src/app/app | Página de detalhe do projeto: visão geral, marcos, tarefas, cronograma (Gantt), equipe, faturamento de horas, timesheet, campos personalizados, c... | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/projetos/[id]/milestone-form-dialog.tsx` | src/app/app | Dialog de criar/editar marco do projeto, com seletor de cor. | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/projetos/[id]/delete-milestone-button.tsx` | src/app/app | Botão que exclui (soft delete) um marco do projeto. | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/projetos/[id]/remove-member-button.tsx` | src/app/app | Botão que remove um membro da equipe do projeto. | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/projetos/[id]/invoice-time-button.tsx` | src/app/app | Botão que gera uma fatura a partir das horas faturáveis não faturadas do projeto. | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/tarefas/page.tsx` | src/app/app | Listar as tarefas do tenant ativo em duas visões: lista agrupada por status ou quadro Kanban, com filtro por tag, paginação e criação de tarefa. | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/tarefas/task-form-dialog.tsx` | src/app/app | Dialog de criar/editar tarefa, com projeto, marco, responsável, datas, prioridade e faturamento. | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/tarefas/task-status-select.tsx` | src/app/app | Select de status inline que altera a tarefa e atualiza a tela sem recarregar. | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/tarefas/task-detail-dialog.tsx` | src/app/app | Dialog de pré-visualização da tarefa, aberto a partir do card do Kanban ou da linha da lista, com troca rápida de status e link para a página ... | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/tarefas/delete-task-button.tsx` | src/app/app | Botão que exclui (soft delete) a tarefa e redireciona para onde o usuário estava. | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |
| `src/app/app/tarefas/[id]/page.tsx` | src/app/app | Página de detalhe da tarefa: detalhes, checklist, campos personalizados, comentários, anexos e tempo registrado. | completa | — | [13-app-projetos-e-tarefas.md](13-app-projetos-e-tarefas.md) |

#### Módulo 14 — App: financeiro, horas, metas e relatórios

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/app/app/orcamentos/page.tsx` | src/app/app | Listar os orçamentos do tenant ativo em tabela paginada, com atalho de exportação CSV e botão para criar novo orçamento. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/orcamentos/estimate-form-dialog.tsx` | src/app/app | Dialog (client) para criar ou editar um orçamento, com editor de itens e cálculo de totais em tempo real. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/orcamentos/delete-estimate-button.tsx` | src/app/app | Botão (client) que exclui um orçamento após confirmação. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/orcamentos/[id]/page.tsx` | src/app/app | Detalhe de um orçamento: itens, resumo de valores, dados do cliente, mudança de status, conversão em fatura, edição e exclusão. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/faturas/page.tsx` | src/app/app | Listar as faturas do tenant ativo em tabela paginada, com exportação CSV e criação de nova fatura. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/faturas/invoice-form-dialog.tsx` | src/app/app | Dialog (client) para criar ou editar uma fatura, com editor de itens e cálculo de totais. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/faturas/record-payment-dialog.tsx` | src/app/app | Dialog (client) para registrar um pagamento vinculado a uma fatura. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/faturas/delete-invoice-button.tsx` | src/app/app | Botão (client) que exclui uma fatura após confirmação. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/faturas/delete-payment-button.tsx` | src/app/app | Ícone de lixeira (client) que remove um pagamento específico de uma fatura. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/faturas/[id]/page.tsx` | src/app/app | Detalhe de uma fatura: itens, resumo (faturado/pago/em aberto), dados, status e lista de pagamentos com registro/remoção. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/despesas/page.tsx` | src/app/app | Listar despesas com filtro por projeto e cliente, paginação, exportação CSV e criação/edição/exclusão por linha. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/despesas/expense-form-dialog.tsx` | src/app/app | Dialog (client) para criar ou editar uma despesa. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/despesas/delete-expense-button.tsx` | src/app/app | Botão (client) que exclui uma despesa após confirmação. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/contratos/page.tsx` | src/app/app | Listar contratos com filtro por cliente e status, paginação e ações de criar/editar/excluir. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/contratos/contract-form-dialog.tsx` | src/app/app | Dialog (client) para criar ou editar um contrato. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/contratos/delete-contract-button.tsx` | src/app/app | Botão (client) que exclui um contrato após confirmação. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/timesheet/page.tsx` | src/app/app | Tela de registro de horas: timer em andamento, lançamento manual, lista de apontamentos e exportação CSV. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/timesheet/timer-widget.tsx` | src/app/app | Widget (client) do cronômetro: mostra o tempo decorrido do apontamento em andamento (ou o formulário para iniciar um). | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/timesheet/manual-entry-dialog.tsx` | src/app/app | Dialog (client) para lançar horas manualmente. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/metas/page.tsx` | src/app/app | Exibir as metas do tenant em cards com barra de progresso, e permitir criar/editar/excluir. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/metas/goal-form-dialog.tsx` | src/app/app | Dialog (client) para criar ou editar uma meta. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/metas/delete-goal-button.tsx` | src/app/app | Botão (client) que exclui uma meta após confirmação. | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/relatorios/page.tsx` | src/app/app | Painel de relatórios com funil de leads, financeiro, rentabilidade, produtividade, despesas e horas, filtrável por período/cliente/projeto e exp... | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |
| `src/app/app/exportar/[entity]/route.ts` | src/app/app | Route handler que gera e devolve arquivos CSV do tenant ativo (clientes, leads, orçamentos, faturas, despesas, timesheet e relatórios). | completa | — | [14-app-financeiro.md](14-app-financeiro.md) |

#### Módulo 15 — App: comercial, atendimento e calendário

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/app/app/leads/page.tsx` | src/app/app | Listar os leads do tenant em dois modos — tabela paginada (Lista) ou quadro Kanban por status — com filtros de status e tag, exportação, impo... | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/leads/lead-form-dialog.tsx` | src/app/app | Dialog de criar/editar lead, reaproveitado na lista e no detalhe. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/leads/lead-kanban.tsx` | src/app/app | Quadro Kanban de leads com colunas por status (mais uma coluna "Sem status") e arrastar-e-soltar para mudar o status. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/leads/lead-settings.tsx` | src/app/app | Dialog de configuração de status e origens de leads (criar e excluir). | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/leads/lead-status-select.tsx` | src/app/app | Select inline para trocar o status de um lead direto na página de detalhe. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/leads/[id]/page.tsx` | src/app/app | Página de detalhe do lead: dados, status rápido, tags, campos personalizados, atividades/registro de interações e ações de converter em clien... | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/leads/[id]/lead-actions.tsx` | src/app/app | Dois botões de ação do detalhe do lead: excluir (soft delete) e converter em cliente. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/tickets/page.tsx` | src/app/app | Listar os tickets do tenant com paginação, filtro por tag e criação de novo ticket. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/tickets/ticket-form-dialog.tsx` | src/app/app | Dialog de criar/editar ticket, reaproveitado na lista e no detalhe. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/tickets/delete-ticket-button.tsx` | src/app/app | Botão que exclui (soft delete) o ticket atual, com confirmação. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/tickets/[id]/page.tsx` | src/app/app | Página de detalhe do ticket: descrição, conversa (respostas e notas internas), anexos, detalhes, troca de status e edição/exclusão. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/tickets/[id]/delete-reply-button.tsx` | src/app/app | Botão (ícone de lixeira) que remove uma resposta/nota do ticket, com confirmação. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/base-conhecimento/page.tsx` | src/app/app | Listar a base de conhecimento em três abas — Artigos (com filtro por categoria), Categorias e FAQ — permitindo criar e excluir cada tipo. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/base-conhecimento/article-form-dialog.tsx` | src/app/app | Dialog de criar/editar artigo da base de conhecimento. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/base-conhecimento/category-form-dialog.tsx` | src/app/app | Dialog de criação de categoria da base de conhecimento. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/base-conhecimento/faq-form-dialog.tsx` | src/app/app | Dialog de criação de FAQ (pergunta/resposta). | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/base-conhecimento/delete-icons.tsx` | src/app/app | Três ícones de exclusão (artigo, categoria e FAQ) com confirmação, construídos sobre um `DeleteForm` interno. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/base-conhecimento/[id]/page.tsx` | src/app/app | Página de detalhe de um artigo da base de conhecimento (conteúdo, categoria, publicação, visualizações e ações de editar/excluir). | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/calendario/page.tsx` | src/app/app | Calendário mensal que reúne eventos do tenant e prazos de tarefas, faturas e contratos, com navegação de mês e gestão de eventos. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/calendario/event-form-dialog.tsx` | src/app/app | Dialog de criar/editar evento do calendário, com data/hora de início e término. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |
| `src/app/app/calendario/delete-event-button.tsx` | src/app/app | Botão que exclui (soft delete) um evento do calendário, com confirmação. | completa | — | [15-app-comercial-e-atendimento.md](15-app-comercial-e-atendimento.md) |

#### Módulo 16 — App: configurações e plataforma

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/app/app/configuracoes/page.tsx` | src/app/app | Página Server Component que monta a tela de Configurações do tenant ativo, com abas (empresa, equipe, tags, campos, notificações, e-mail, capt... | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/company-settings-form.tsx` | src/app/app | Formulário client da aba **Empresa** para editar nome, cor primária e logo do tenant; em modo leitura mostra os valores quando o usuário não po... | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/team-section.tsx` | src/app/app | Server Component que lista os membros do tenant e os convites pendentes, com ações de convidar, alterar papel, remover e revogar (quando o usuár... | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/invite-member-dialog.tsx` | src/app/app | Dialog client para convidar um membro por e-mail com papel (Membro/Administrador), exibindo o link do convite para copiar quando o envio de e-mail ... | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/member-row-actions.tsx` | src/app/app | Controles de linha de um membro: seletor de papel e botão remover (modo gerente) ou apenas o rótulo do papel (modo leitura). | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/revoke-invitation-button.tsx` | src/app/app | Botão client que revoga um convite pendente. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/tags-section.tsx` | src/app/app | Server Component que lista as tags do tenant com sua cor e oferece criar/editar (dialog) e excluir. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/tag-form-dialog.tsx` | src/app/app | Dialog client para criar ou editar uma tag (nome + cor escolhida entre `TAG_COLORS`). | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/delete-tag-button.tsx` | src/app/app | Botão client para excluir uma tag. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/custom-fields-section.tsx` | src/app/app | Server Component que agrupa os campos personalizados por entidade (`CUSTOM_FIELD_ENTITIES`) e permite criar/editar/excluir cada definição. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/custom-field-form-dialog.tsx` | src/app/app | Dialog client para criar/editar um campo personalizado (rótulo, chave gerada por `slugify`, tipo, ordem, opções e obrigatoriedade). | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/delete-custom-field-button.tsx` | src/app/app | Botão client para excluir uma definição de campo personalizado e seus valores. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/email-section.tsx` | src/app/app | Server Component da aba **E-mail**: lista os modelos (`EMAIL_TEMPLATES`) com indicação de personalização, variáveis detectadas e o log de envi... | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/email-template-dialog.tsx` | src/app/app | Dialog client para editar o assunto e o corpo (HTML) de um modelo de e-mail do tenant. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/reset-email-template-button.tsx` | src/app/app | Botão client que restaura o modelo de e-mail ao padrão (remove a personalização do tenant). | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/notification-prefs-form.tsx` | src/app/app | Formulário client da aba **Notificações** para o usuário escolher receber lembretes por e-mail. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/app/configuracoes/web-to-lead-form.tsx` | src/app/app | Formulário client da aba **Captação** para ativar o formulário público (web-to-lead), escolher a origem dos leads e copiar o link público; em... | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/plataforma/layout.tsx` | src/app/plataforma | Layout Server Component do painel da plataforma: força super-admin e monta o cabeçalho com o nome do app e link de volta ao app. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/plataforma/page.tsx` | src/app/plataforma | Página Server Component do painel da plataforma: cria novas empresas, gerencia planos e lista as empresas cadastradas com seleção de plano e exc... | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/plataforma/create-tenant-form.tsx` | src/app/plataforma | Formulário client para criar uma nova empresa (tenant) com nome e slug opcional. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/plataforma/plan-form-dialog.tsx` | src/app/plataforma | Dialog client para criar ou editar um plano (nome, descrição, preço, ciclo, trial, limites e "mais popular") e exporta o tipo `PlanRow`. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/plataforma/set-plan-select.tsx` | src/app/plataforma | Seletor client que define o plano de uma empresa na tabela da plataforma. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |
| `src/app/plataforma/admin-buttons.tsx` | src/app/plataforma | Botões client de exclusão de plano e de empresa no painel da plataforma. | completa | — | [16-app-configuracoes-e-plataforma.md](16-app-configuracoes-e-plataforma.md) |

#### Módulo 17 — Portal do cliente

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `src/app/portal/login/page.tsx` | src/app/portal | página de login do portal do cliente, em `/portal/login`; mostra o formulário de entrada e, em ambientes de demonstração, credenciais de exemplo. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/login/login-form.tsx` | src/app/portal | formulário client de login do portal; envia e-mail/senha para a server action e exibe o erro. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/layout.tsx` | src/app/portal | layout de todas as páginas internas do portal; exige sessão, verifica se o usuário é contato de algum cliente e monta o cabeçalho com a navega... | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/page.tsx` | src/app/portal | visão geral do portal; resume projetos ativos, orçamentos pendentes e valor em aberto e lista os itens mais recentes. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/portal-nav.tsx` | src/app/portal | barra de navegação do portal; destaca a seção atual. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/projetos/page.tsx` | src/app/portal | lista os projetos da empresa do cliente. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/projetos/[id]/page.tsx` | src/app/portal | detalhe de um projeto do cliente, com tarefas, marcos e arquivos. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/orcamentos/page.tsx` | src/app/portal | lista os orçamentos da empresa do cliente. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/orcamentos/[id]/page.tsx` | src/app/portal | detalhe do orçamento, com itens e os botões de aceitar/recusar (a aprovação do cliente). | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/faturas/page.tsx` | src/app/portal | lista as faturas da empresa do cliente. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/faturas/[id]/page.tsx` | src/app/portal | detalhe da fatura, com itens, resumo financeiro e pagamentos registrados. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/contratos/page.tsx` | src/app/portal | lista os contratos da empresa do cliente. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/despesas/page.tsx` | src/app/portal | lista as despesas faturáveis (custos repassados) vinculadas aos projetos do cliente. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/tickets/page.tsx` | src/app/portal | lista os tickets de suporte abertos pelo cliente e permite abrir um novo. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/tickets/[id]/page.tsx` | src/app/portal | detalhe do ticket, com a conversa e o formulário para o cliente responder. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/tickets/portal-ticket-dialog.tsx` | src/app/portal | diálogo client para o cliente abrir um novo ticket de suporte. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/ajuda/page.tsx` | src/app/portal | central de ajuda do portal, com artigos da base de conhecimento e perguntas frequentes. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |
| `src/app/portal/(portal)/ajuda/[id]/page.tsx` | src/app/portal | leitura de um artigo da central de ajuda. | completa | — | [17-portal-do-cliente.md](17-portal-do-cliente.md) |

#### Módulo 18 — Testes e scripts

| Arquivo | Camada | Propósito em 1 linha | Ficha? | Motivo da exceção | Ficha em |
|---|---|---|---|---|---|
| `scripts/seed-demo.mjs` | scripts | script Node avulso que apaga e repopula o tenant `easy-prospect` com dados de demonstração (empresas, contatos, projetos, tarefas, financeiro, he... | completa | — | [18-testes-e-scripts.md](18-testes-e-scripts.md) |
| `tests/setup.ts` | tests | arquivo de setup carregado pelo Vitest antes dos testes unitários; só registra os matchers extras do `jest-dom` no `expect`. | completa | — | [18-testes-e-scripts.md](18-testes-e-scripts.md) |
| `tests/rls/isolation.test.ts` | tests | teste de integração de RLS/isolamento que roda **contra um Supabase real** (não usa mock): prova que um usuário de um tenant nunca lê/escreve/... | completa | — | [18-testes-e-scripts.md](18-testes-e-scripts.md) |
| `tests/unit/csv.test.ts` | tests | `toCsv` e `parseCsv` de `src/lib/csv.ts`: cabeçalho/linhas com `;`, escape de `;`/aspas/quebras, `parseCsv` respeita campos entre aspas e ignora l... | tabela | Arquivo de teste | [18-testes-e-scripts.md](18-testes-e-scripts.md) §18 |
| `tests/unit/gantt.test.ts` | tests | Helpers de `src/lib/gantt.ts`: `addDays`/`diffDays`, `normalizeSchedule` (empurra sucessoras, não mexe nas já posicionadas, sem dependência, tar... | tabela | Arquivo de teste | [18-testes-e-scripts.md](18-testes-e-scripts.md) §18 |
| `tests/unit/reports.test.ts` | tests | Funções de `src/lib/reports.ts`: `buildProfitability` (margem e ordenação), `buildProductivity` (tarefas concluídas no período, horas, valor ... | tabela | Arquivo de teste | [18-testes-e-scripts.md](18-testes-e-scripts.md) §18 |
| `tests/unit/validations.test.ts` | tests | Validações Zod e utilitários: `signInSchema`, `milestoneSchema`, `tagSchema`, `customFieldDefinitionSchema`, `tenantSettingsSchema`, `inviteMemb... | tabela | Arquivo de teste | [18-testes-e-scripts.md](18-testes-e-scripts.md) §18 |
| `tests/e2e/smoke.spec.ts` | tests | Smoke de Playwright: a raiz redireciona para `/login` quando não autenticado e a página de login mostra o botão "Entrar". | tabela | Arquivo de teste | [18-testes-e-scripts.md](18-testes-e-scripts.md) §18 |
