# 3. Estado das funcionalidades

> Cada funcionalidade com status, como sei (rotas/arquivos) e o que falta. Estado: `main@29aac19`; as linhas de SEO e Social foram acrescentadas em 04/11/2026 (`main@413c601`).
> Status: **completa** (tela + API/action + banco), **só API**, **só banco**, **parcial** ou **planejada**.

## 3.1 Tabela

| Funcionalidade | Status | Como sei | Falta |
|---|---|---|---|
| Login e cadastro de conta | completa | [`actions/auth.ts`](arquivos/06-servidor-actions-core.md) §06.1, `/login` | cadastro self-service (hoje é convite/super-admin) |
| Aceite de convite | completa | [`actions/team.ts`](arquivos/06-servidor-actions-core.md) §06.4, `/convite/[token]` | — |
| Seletor de empresa (multi-tenant) | completa | [`lib/tenant.ts`](arquivos/02-nucleo-lib-aplicacao.md) §02.9, [`app-sidebar`](arquivos/08-componentes-app-nucleo.md) §08.2 | subdomínio por tenant (inativo) |
| Clientes (empresas) + contatos | completa | [`actions/companies.ts`](arquivos/07-servidor-actions-negocio.md), [`actions/contacts.ts`](arquivos/07-servidor-actions-negocio.md), `/app/clientes` | — |
| Convite de contato para o portal | completa | `inviteContactToPortalAction`, `contacts.user_id` | — |
| Projetos (equipe, orçamento, prazos) | completa | [`actions/projects.ts`](arquivos/07-servidor-actions-negocio.md) §07.5, `/app/projetos` | — |
| Marcos do projeto | completa | [`actions/milestones.ts`](arquivos/07-servidor-actions-negocio.md) §07.9, `milestones` | — |
| Cronograma (Gantt) interativo + dependências | completa | [`project-gantt.tsx`](arquivos/09-componentes-dominio.md) §09.17, [`actions/gantt.ts`](arquivos/07-servidor-actions-negocio.md) §07.8 | visão de portfólio (todos os projetos) |
| Tarefas (lista/kanban, checklist, prioridade) | completa | [`actions/tasks.ts`](arquivos/07-servidor-actions-negocio.md) §07.6, `/app/tarefas` | — |
| Comentários e anexos (polimórficos) | completa | [`actions/comments.ts`](arquivos/06-servidor-actions-core.md), [`actions/attachments.ts`](arquivos/06-servidor-actions-core.md) | preview, upload múltiplo |
| Timesheet (timer + lançamento manual) | completa | [`actions/time.ts`](arquivos/07-servidor-actions-negocio.md) §07.7, `/app/timesheet` | fluxo de aprovação de horas |
| Orçamentos (itens, desconto/imposto, conversão) | completa | [`actions/estimates.ts`](arquivos/07-servidor-actions-negocio.md) §07.9, `/app/orcamentos` | — |
| Faturas e pagamentos parciais | completa | [`actions/invoices.ts`](arquivos/07-servidor-actions-negocio.md) §07.10, `/app/faturas` | pagamento online (gateway) |
| Faturar horas apontadas | completa | `invoiceBillableTimeAction` | — |
| Despesas | completa | [`actions/expenses.ts`](arquivos/07-servidor-actions-negocio.md) §07.11, `/app/despesas` | — |
| Contratos | completa | [`actions/contracts.ts`](arquivos/07-servidor-actions-negocio.md) §07.13, `/app/contratos` | — |
| Calendário | completa | [`actions/calendar.ts`](arquivos/06-servidor-actions-core.md) §06.12, `/app/calendario` | — |
| Metas | completa | [`actions/goals.ts`](arquivos/07-servidor-actions-negocio.md) §07.14, `/app/metas` | — |
| Log de auditoria (atividades) | completa | `activity_log` + trigger, `/app/atividades` | — |
| Relatórios (funil, financeiro, rentabilidade, produtividade, despesas, horas) | completa | [`reports.ts`](arquivos/02-nucleo-lib-aplicacao.md) §02.21, `/app/relatorios` | PDF (só CSV) |
| Exportação/importação CSV | completa | [`exportar/[entity]/route.ts`](arquivos/14-app-financeiro.md) §14.24, [`actions/import.ts`](arquivos/06-servidor-actions-core.md) §06.9 | — |
| Leads (lista/kanban, status/origens) | completa | [`actions/leads.ts`](arquivos/07-servidor-actions-negocio.md) §07.3, `/app/leads` | — |
| Conversão de lead em cliente | completa | [`actions/leads.ts`](arquivos/07-servidor-actions-negocio.md) §07.3 | — |
| Web-to-lead (formulário público) | completa | [`actions/public-lead.ts`](arquivos/07-servidor-actions-negocio.md) §07.13, `/f/[slug]` | — |
| Tickets + departamentos | completa | [`actions/tickets.ts`](arquivos/07-servidor-actions-negocio.md) §07.15, `/app/tickets` | — |
| Base de conhecimento + FAQ | completa | [`actions/kb.ts`](arquivos/06-servidor-actions-core.md) §06.15, `/app/base-conhecimento` | — |
| Portal do cliente (projetos, tarefas, arquivos, marcos) | completa | [`queries/portal.ts`](arquivos/05-servidor-queries.md) §05.16, [`17-portal-do-cliente.md`](arquivos/17-portal-do-cliente.md) | — |
| Portal: orçamento com aceite | completa | `respondEstimateAction` + RPC `client_respond_estimate` | — |
| Portal: faturas, contratos, despesas faturáveis | completa | [`queries/portal.ts`](arquivos/05-servidor-queries.md) §05.16 | — |
| Portal: tickets e ajuda | completa | [`actions/portal.ts`](arquivos/07-servidor-actions-negocio.md) §07.15 | — |
| Planos e limites por recurso | completa | [`plan-limits.ts`](arquivos/04-servidor-helpers.md) §04.2, `/plataforma` | enforcement só de clientes/projetos/tarefas/tickets/leads (`seo_sites` na action, mas sem campo no plano: #24) |
| Painel super-admin (empresas, planos) | completa | [`actions/platform.ts`](arquivos/06-servidor-actions-core.md) §06.5, `/plataforma` | tela de roadmap/backlog |
| Notificações em tempo real + preferências | completa | `notifications` (Realtime), [`notifications-bell.tsx`](arquivos/08-componentes-app-nucleo.md) §08.4 | — |
| E-mail: modelos editáveis + histórico | completa | [`actions/email.ts`](arquivos/06-servidor-actions-core.md) §06.7, [`server/email.ts`](arquivos/04-servidor-helpers.md) §04.5 | — |
| Lembretes automáticos (cron) | completa | [`server/reminders.ts`](arquivos/04-servidor-helpers.md) §04.7, `vercel.json` | — |
| Branding por tenant (cor + logo) | completa | [`company-settings-form.tsx`](arquivos/16-app-configuracoes-e-plataforma.md) §16.2, bucket `branding` | — |
| Tags e campos personalizados | completa | [`actions/tags.ts`](arquivos/06-servidor-actions-core.md) §06.10, [`actions/custom-fields.ts`](arquivos/06-servidor-actions-core.md) §06.11 | campos/tags no portal; tipos URL/moeda/multisseleção |
| SEO: sites monitorados e auditoria técnica (26 verificações, score) | completa | [`actions/seo.ts`](arquivos/19-seo.md) §19.2, [`seo/audit.ts`](arquivos/19-seo.md) §19.4, `/app/seo` | audita só a URL informada (sem rastreamento do site); limite de plano `seo_sites` não configurável ([06](06-problemas-e-dividas.md) #24) |
| SEO: monitoramento agendado (diário/semanal/mensal) | completa | [`seo/scheduled.ts`](arquivos/19-seo.md) §19.7, `/api/cron/seo` (`vercel.json`) | no máximo 3 sites por execução diária; sem notificação de queda de score |
| SEO: resumo com IA e relatório PDF | completa | [`seo/ai-summary.ts`](arquivos/19-seo.md) §19.6, [`relatorio/route.ts`](arquivos/19-seo.md) §19.16 | depende de `OPENAI_API_KEY`; sem rate limit |
| Portal: SEO (última auditoria concluída) | completa | RPCs `portal_list_seo_sites`/`portal_get_seo_audit`, [§19.18](arquivos/19-seo.md) | histórico no portal; testes de RLS (#25) |
| Social: contas, posts, destinos e prévia por rede | completa | [`actions/social.ts`](arquivos/20-social.md) §20.4, `/app/social`, `/app/social/contas` | conexão real com as redes (OAuth); limite de plano (#22); validação de conta × cliente no servidor (#28) |
| Social: fluxo de aprovação interno e agendamento | completa | [`social-post-actions.tsx`](arquivos/20-social.md) §20.16, processo [2.14](02-processos.md) | notificações de envio/aprovação (#29); fuso do agendamento (#27) |
| Social: calendário mensal | completa | [`calendario/page.tsx`](arquivos/20-social.md) §20.12 | dias calculados em UTC |
| Social: mídia (imagens) | completa | [`social-media-uploader.tsx`](arquivos/20-social.md) §20.19, bucket `social_media` | mídia no portal; validação de tipo/tamanho no servidor |
| Social: publicação manual + lembrete (cron) | completa | [`manual-publish-panel.tsx`](arquivos/20-social.md) §20.17, [`social/reminders.ts`](arquivos/20-social.md) §20.6 | publicação automática pelas APIs (status `publishing`/`failed` existem mas não são usados) |
| Portal: aprovar/rejeitar post do Social | completa | RPC `portal_respond_social_post`, [§20.22](arquivos/20-social.md) | testes de RLS (#23) |
| Social: configurações (`social_settings`) e IA | só banco | tabela `social_settings` (`0049`, `0050`) | nenhuma tela ou action lê/grava a tabela (#29) |
| Cobrança automática / assinaturas | planejada | único item pendente de F6 (`PLANO.md`) | Stripe/Asaas, faturamento recorrente |
| API pública + webhooks | planejada | não há rotas de API de negócio | — |
| 2FA e permissões granulares | planejada | hoje papéis fixos owner/admin/member | — |
| Sentry (rastreio de exceções) | planejada | há logger + Vercel Analytics, sem Sentry | — |

## 3.2 Notas por área

- **Entrega (clientes → projetos → tarefas → horas):** completa de ponta a ponta, incluindo Gantt interativo com dependências (detecção de ciclos e auto-deslocamento de sucessoras).
- **Financeiro:** orçamento → fatura → pagamento e "faturar horas" funcionam; a numeração é por tenant via RPC `next_document_number`. O cliente aprova orçamento no portal.
- **Comercial:** leads com Kanban, status/origens configuráveis, atividades e conversão em cliente; captação pública protegida por rate limit e honeypot.
- **Atendimento:** tickets com departamentos, prioridade e notas internas; base de conhecimento com artigos publicáveis e FAQ.
- **Plataforma (SaaS):** planos com limites e painel super-admin; falta a **cobrança automática** — hoje o plano é associado manualmente.
- **Marketing (SEO e Social):** SEO audita a página de cada site do cliente, com agendamento por cron, resumo com IA e PDF; o Social organiza posts com aprovação (interna ou no portal), calendário, mídia e publicação manual com lembrete. Detalhes em [19-seo](arquivos/19-seo.md) e [20-social](arquivos/20-social.md).
- **Portal do cliente:** somente leitura via RPCs `security definer` (não expõe colunas internas como custo/hora e `notes`), com rascunhos fora da visão do cliente.

> O roadmap detalhado e os itens adiados estão em `PLANO.md` e na tabela `roadmap_items` (migrations `0017`, `0022`, `0026`). Riscos e dívidas em [06-problemas-e-dividas](06-problemas-e-dividas.md) §6.
