# Paridade funcional: Orbit CRM × Perfex CRM 3.4.1

> Levantamento estático feito em 20/11/2026. Perfex lido do pacote
> `C:\Arquivos Importantes\Fontes de Inspiração\fontes\crm\Perfex v3.4.1.rar`
> (instalação completa, não o catálogo de addons do `Perfex CRM.rar`).
> Orbit lido de `main` em `C:\Users\werne\WebstormProjects\orbit-crm`.

## 1. Método e fontes

**Perfex (lado da referência).** O arquivo é um RAR com a instalação completa. Foi
extraído para `%TEMP%\opencode\perfex341` (60 MB, 3.031 arquivos) com:

```powershell
& "C:\Program Files\7-Zip\7z.exe" x "C:\Arquivos Importantes\Fontes de Inspiração\fontes\crm\Perfex v3.4.1.rar" `
  -o"$env:TEMP\opencode\perfex341" "Perfex v3.4.1\perfex crm\*" "Perfex v3.4.1\documentation\*" -y
```

Como é código PHP legível, não foi usado REA: o inventário sai do próprio fonte. As
fontes canônicas são:

| Fonte                                                                                              | O que define                                                                         |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `application\helpers\menu_helper.php`                                                              | menu lateral e menu de configuração (a lista de funcionalidades na ordem do produto) |
| `application\views\admin\settings\includes\*.php`                                                  | 27 abas de configuração                                                              |
| `application\controllers\admin\*.php` (45) e `application\controllers\*.php` (18, área do cliente) | rotas e ações                                                                        |
| `application\models\*.php` (46)                                                                    | comportamento por entidade                                                           |
| `install\database.sql`                                                                             | **117 tabelas**                                                                      |
| `application\views\themes\perfex\template_parts\navigation.php` + `themes_helper.php`              | menu do portal do cliente                                                            |
| `modules\`                                                                                         | 9 módulos que vêm na distribuição                                                    |

**Orbit (lado comparado).** Fontes: `docs\mapa\` (fichas 01–21), `supabase\migrations\`
(58 migrations, **52 tabelas**), `src\server\actions\` (37 arquivos, ~180 actions),
`src\app\app\` (32 páginas) e `src\app\portal\` (18 páginas). A documentação do
Orbit foi conferida contra o código nos pontos em que a resposta mudava; onde só a
ficha atestava, a linha está marcada como _ficha_.

**Legenda**

| Símbolo | Significado                                                                    |
| ------- | ------------------------------------------------------------------------------ |
| ✅      | portado — equivalente funcional                                                |
| 🟡      | parcial — existe, falta parte relevante                                        |
| ❌      | ausente — não há tela, action nem tabela                                       |
| ➖      | não se aplica — diferença de natureza (SaaS multi-tenant vs. instalação única) |
| ⭐      | além do Perfex core                                                            |

## 2. Resumo

| Métrica                | Perfex 3.4.1                                    | Orbit CRM                                            |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Tabelas                | 117                                             | 52                                                   |
| Telas de administração | 415 views                                       | 32 páginas                                           |
| Telas de portal        | 44 templates (inclui PDFs e login)              | 18 páginas                                           |
| Módulos de 1ª parte    | 9                                               | — (SEO e Social são nativos, sem paralelo no Perfex) |
| Papéis                 | N por papel customizável (matriz de permissões) | 3 fixos (owner/admin/member)                         |
| Idiomas                | 27                                              | 1 (pt-BR)                                            |
| Gateways de pagamento  | 10                                              | 0                                                    |
| Multi-moeda            | sim (catálogo + câmbio)                         | não (coluna `currency` em texto)                     |

**Leitura curta:** a espinha dorsal está portada e em vários pontos é melhor
(Gantt com dependências, RLS por tenant, Realtime, SEO, Social, assistente de IA).
As lacunas reais não são "esquecemos o CRM"; são **camadas de produto ao redor do
núcleo**: propostas, notas de crédito, recorrência/assinaturas, catálogo de itens e
impostos, gateways, assinatura eletrônica de contrato, e o conjunto de comunicação
(anúncios, newsfeed, surveys, e-mail piping).

Contagem das linhas abaixo (162 itens): **61 ✅ · 28 🟡 · 64 ❌ · 5 ➖ · 4 ⭐**.

### 2.1 Painel

| Perfex                                                 | Evidência Perfex                                       | Orbit                                   | Evidência Orbit         | Situação |
| ------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------- | ----------------------- | -------- |
| Painel com KPIs financeiros (pagamentos da semana/mês) | `Dashboard_model::get_weekly_payments_statistics`      | cartões de receita/fatura vencida       | `src/app/app/page.tsx`  | ✅       |
| Painel com projetos e tarefas                          | `projects_status_stats`                                | projetos + tarefas                      | `page.tsx`              | ✅       |
| Leads por status e tickets aguardando resposta         | `leads_status_stats`, `tickets_awaiting_reply_*`       | não há bloco de tickets/leads no painel | —                       | 🟡       |
| Próximos eventos (semana atual/próxima)                | `get_upcoming_events`, `get_upcoming_events_next_week` | calendário separado                     | `/app/calendario`       | 🟡       |
| Feed de atividade recente                              | `includes/notifications.php` + newsfeed                | feed de comentários/horas               | `page.tsx` (`FeedItem`) | ✅       |
| Painel diferente por papel/função                      | `Dashboard.php` por `staff_can`                        | mesmo painel para todos                 | `page.tsx`              | 🟡       |

## 3. Vendas

| Perfex                                                                                                      | Evidência Perfex                                                                                                      | Orbit                                   | Evidência Orbit                                                                  | Situação |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------- | -------- |
| Propostas (proposals) com aceite e assinatura                                                               | `admin/Proposals.php`, `Proposals_model`, `tblproposals` (`signature`, `acceptance_*`, `pipeline_order`)              | não existe                              | nenhuma tabela/rota `proposal`                                                   | ❌       |
| Proposta → fatura / proposta → estimativa                                                                   | `Proposals_model::convert_to_invoice`, `estimate_id`/`invoice_id` em `tblproposals`                                   | —                                       | —                                                                                | ❌       |
| Orçamentos (estimates)                                                                                      | `admin/Estimates.php`, `tblestimates`                                                                                 | `/app/orcamentos`                       | `actions/estimates.ts`, ficha [14](mapa/arquivos/14-app-financeiro.md)           | ✅       |
| Orçamento → fatura                                                                                          | `Estimates`                                                                                                           | `convertEstimateToInvoiceAction`        | `actions/estimates.ts`                                                           | ✅       |
| Aceite de orçamento pelo cliente                                                                            | portal `estimates.php`                                                                                                | portal com aceite                       | RPC `client_respond_estimate`, ficha [17](mapa/arquivos/17-portal-do-cliente.md) | ✅       |
| Faturas                                                                                                     | `admin/Invoices.php`, `tblinvoices`                                                                                   | `/app/faturas`                          | `actions/invoices.ts`                                                            | ✅       |
| Pagamentos parciais e status                                                                                | `tblinvoicepaymentrecords`                                                                                            | `payments`                              | tabela `payments`, `recordPaymentAction`                                         | ✅       |
| Numeração por formato/prefixo                                                                               | `get_option('invoice_number_format')`, `save_formatted_number`                                                        | `next_document_number` (RPC por tenant) | ficha [14](mapa/arquivos/14-app-financeiro.md) §14                               | ✅       |
| PDF de fatura e orçamento                                                                                   | `invoicepdf.php`, `estimatepdf.php`                                                                                   | `/[id]/pdf/route.ts`                    | `pdf-lib`                                                                        | ✅       |
| Envio por e-mail + histórico                                                                                | `Emails_model`, `tbltracked_mails`, `tblmail_queue`                                                                   | `email_log`, modelos editáveis          | `actions/email.ts`, `server/email.ts`                                            | ✅       |
| Link público do documento                                                                                   | `hash` em cada tabela                                                                                                 | `/d/[token]`                            | `public-document.ts`, `send-document.ts`                                         | ✅       |
| **Notas de crédito** (créditos, aplicação em fatura, reembolso)                                             | `admin/Credit_notes.php`, `Credit_notes_model` (38 métodos), `tblcreditnotes`, `tblcredits`, `tblcreditnote_refunds`  | não existe                              | sem tabela                                                                       | ❌       |
| **Assinaturas** (cobrança recorrente)                                                                       | `admin/Subscriptions.php`, `Subscriptions_model`, `tblsubscriptions` (`stripe_subscription_id`, `next_billing_cycle`) | não existe                              | planos do Orbit são do SaaS, não do cliente                                      | ❌       |
| **Fatura recorrente** (sem gateway)                                                                         | campos `recurring*` em `tblinvoices`                                                                                  | não existe                              | sem coluna `recurring`                                                           | ❌       |
| Catálogo de itens (produtos/serviços) com grupos                                                            | `admin/Invoice_items.php`, `tblitems`, `tblitems_groups`                                                              | não existe catálogo                     | `document_items` guarda descrição livre, sem `item_id`                           | ❌       |
| Impostos configuráveis e reutilizáveis                                                                      | `admin/Taxes.php`, `tbltaxes`, `tblitem_tax`                                                                          | imposto por linha, digitado             | `document_items.tax_name/tax_rate`                                               | 🟡       |
| Moedas múltiplas com câmbio                                                                                 | `admin/Currencies.php`, `tblcurrencies`, `get_customer_default_currency`                                              | moeda única por documento               | coluna `currency text default 'BRL'`                                             | 🟡       |
| Modos de pagamento configuráveis                                                                            | `admin/Paymentmodes.php`, `tblpayment_modes`                                                                          | texto livre                             | `payments.payment_mode`                                                          | 🟡       |
| Gateways (Stripe, PayPal, Mollie, Authorize, Braintree, 2Checkout, PayU, Instamojo, iDEAL, PayPal Checkout) | `controllers/gateways/*` (10 arquivos)                                                                                | nenhum                                  | não há rota de gateway                                                           | ❌       |
| Vendedor responsável (sales agent)                                                                          | `sale_agent` nas tabelas comerciais                                                                                   | responsável genérico                    | `assignee_id` em leads/tickets                                                   | 🟡       |
| Exportação CSV                                                                                              | módulo `exports`                                                                                                      | `/app/exportar/[entity]`                | ficha [14](mapa/arquivos/14-app-financeiro.md) §14.24                            | ✅       |

## 4. Financeiro e despesas

| Perfex                                        | Evidência Perfex                                                    | Orbit                            | Evidência Orbit                                      | Situação |
| --------------------------------------------- | ------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------- | -------- |
| Despesas com cliente/projeto e flag faturável | `admin/Expenses.php`, `tblexpenses`                                 | `/app/despesas`                  | `expenses` (`company_id`, `project_id`, `billable`)  | ✅       |
| Despesa faturável visível no portal           | `billable` + portal                                                 | portal mostra despesas           | `queries/portal.ts`                                  | ✅       |
| Categorias de despesa configuráveis           | `expenses/categories`, `tblexpenses_categories`                     | texto livre                      | `expenses.category`                                  | 🟡       |
| Impostos na despesa (`tax`, `tax2`)           | `tblexpenses`                                                       | não                              | —                                                    | ❌       |
| Despesa recorrente                            | `tblexpenses` (`recurring`, `repeat_every`, `cycles`)               | não                              | —                                                    | ❌       |
| Despesa → fatura automática                   | `create_invoice_billable`, `invoiceid`                              | fatura de horas sim; despesa não | `invoiceBillableTimeAction` só horas                 | 🟡       |
| Recibo/anexo na despesa                       | `tblexpenses` + anexo                                               | anexos só em task/project/ticket | `check (entity_type in ('task','project','ticket'))` | ❌       |
| Extrato do cliente (statement PDF)            | `Clients_model::get_statement`, `statement.php`, `statementpdf.php` | não existe                       | —                                                    | ❌       |
| Resumo de impostos (relatório)                | `Reports::tax_summary`                                              | não existe                       | —                                                    | ❌       |
| Receita por forma de pagamento                | `Reports::report_by_payment_modes`                                  | não existe                       | —                                                    | ❌       |

## 5. Contratos

| Perfex                                                  | Evidência Perfex                                                                       | Orbit                            | Evidência Orbit                                   | Situação |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------- | -------- |
| Contratos com cliente, valor e vigência                 | `admin/Contracts.php`, `tblcontracts`                                                  | `/app/contratos`                 | `contracts`                                       | ✅       |
| Tipos de contrato                                       | `contracts/types`, `tblcontracts_types`                                                | não existe                       | sem tabela                                        | ❌       |
| Renovação com histórico                                 | `Contracts_model::renew`, `tblcontract_renewals`                                       | não existe                       | —                                                 | ❌       |
| Comentários no contrato                                 | `tblcontract_comments`, `add_comment`                                                  | comentários só em task/project   | `check (entity_type in ('task','project'))`       | ❌       |
| **Assinatura eletrônica** com confirmação de identidade | `add_signature`, `mark_as_signed`, settings `e_sign`, `identity_confirmation_form.php` | não existe                       | sem coluna `signature` em `contracts`             | ❌       |
| Anexos do contrato                                      | `get_contract_attachments`                                                             | anexos só em task/project/ticket | `attachments`                                     | ❌       |
| PDF do contrato                                         | `contractpdf.php`                                                                      | não há rota de PDF para contrato | só fatura/orçamento/relatório SEO têm `pdf`       | 🟡       |
| Alerta de expiração                                     | `get_contracts_about_to_expire`                                                        | cron só cobre tarefa e fatura    | `server/reminders.ts`                             | ❌       |
| Assinatura visível no portal                            | `contracts.php` do tema                                                                | portal só leitura                | ficha [17](mapa/arquivos/17-portal-do-cliente.md) | 🟡       |

## 6. Projetos e tarefas

| Perfex                                                          | Evidência Perfex                                                 | Orbit                      | Evidência Orbit                                                      | Situação |
| --------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------- | -------- |
| Projeto com tipo de cobrança, custo, taxa/hora, horas estimadas | `tblprojects`                                                    | `projects` (mesmos campos) | migration `0005`/similares                                           | ✅       |
| Progresso manual ou por tarefas                                 | `progress_from_tasks`, `calc_progress_by_tasks`                  | sim                        | `projects.progress_from_tasks`                                       | ✅       |
| Membros da equipe                                               | `tblproject_members`                                             | sim                        | `addProjectMemberAction`                                             | ✅       |
| Marcos                                                          | `tblmilestones`, kanban de marcos                                | `/app/projetos`            | `milestones`, ficha [13](mapa/arquivos/13-app-projetos-e-tarefas.md) | ✅       |
| Tarefas com checklist, prioridade, prazo                        | `tbltasks`, `tbltask_checklist_items`                            | sim                        | `tasks`, `task_checklist_items`                                      | ✅       |
| Kanban de tarefas                                               | `AbstractKanban`                                                 | sim                        | `/app/tarefas`                                                       | ✅       |
| **Gantt**                                                       | `project_gantt.php` (frappe-gantt)                               | Gantt interativo           | `project-gantt.tsx`, `actions/gantt.ts`                              | ✅       |
| Dependências entre tarefas                                      | não existe                                                       | sim, com detecção de ciclo | `task_dependencies`                                                  | ⭐       |
| Discussões do projeto (threads)                                 | `tblprojectdiscussions`, `tblprojectdiscussioncomments`          | não existe                 | só comentários por entidade                                          | ❌       |
| Notas internas da equipe no projeto                             | `tblproject_notes`                                               | não existe                 | —                                                                    | ❌       |
| Arquivos do projeto com visibilidade ao cliente                 | `tblproject_files` (`visible_to_customer`)                       | anexos sem visibilidade    | `attachments`                                                        | 🟡       |
| Configurações do projeto (notificar contatos, ver tarefas etc.) | `tblproject_settings`, `contact_notification`, `notify_contacts` | não existe                 | —                                                                    | ❌       |
| Atividades do projeto                                           | `tblproject_activity`                                            | log de auditoria           | `activity_log`                                                       | ✅       |
| Fixar projeto na barra                                          | `tblpinned_projects`                                             | não                        | —                                                                    | ❌       |
| Tarefa recorrente                                               | `cancel_recurring_tasks`, campos `recurring`                     | não                        | —                                                                    | ❌       |
| Templates de checklist                                          | `tbltasks_checklist_templates`                                   | não                        | —                                                                    | ❌       |
| Seguidores de tarefa                                            | `tbltask_followers`                                              | não                        | —                                                                    | ❌       |
| Múltiplos responsáveis por tarefa                               | `tbltask_assigned`                                               | um responsável             | `tasks.assignee_id`                                                  | 🟡       |
| Comentários e anexos em tarefa                                  | `tbltask_comments`                                               | sim                        | `comments`, `attachments`                                            | ✅       |
| Timer e timesheet                                               | `tbltaskstimers`, `Timesheets`                                   | sim                        | `time_entries`, `actions/time.ts`                                    | ✅       |
| Faturar horas apontadas                                         | `get_billable_tasks`                                             | sim                        | `invoiceBillableTimeAction`                                          | ✅       |
| Aprovação de timesheet                                          | não existe no Perfex 3.4.1                                       | não                        | —                                                                    | ➖       |
| Tarefa pública (link sem login)                                 | `make_public`                                                    | não                        | —                                                                    | ❌       |
| Portal: projetos, tarefas, arquivos, marcos                     | `project.php`, `projects.php`                                    | sim                        | `queries/portal.ts` §05.16                                           | ✅       |

## 7. Atendimento

| Perfex                                | Evidência Perfex                                              | Orbit          | Evidência Orbit                                       | Situação |
| ------------------------------------- | ------------------------------------------------------------- | -------------- | ----------------------------------------------------- | -------- |
| Tickets com departamentos             | `admin/Tickets.php`, `tbldepartments`                         | `/app/tickets` | `tickets`, `departments`                              | ✅       |
| Notas internas na thread              | `ticket_replies` com `admin`                                  | sim            | `ticket_replies`                                      | ✅       |
| Anexos de ticket                      | `tblticket_attachments`                                       | sim            | `attachments`                                         | ✅       |
| Prioridades configuráveis             | `tickets/priorities`, `tbltickets_priorities`                 | fixas (1–4)    | `check (priority between 1 and 4)`                    | 🟡       |
| Status configuráveis com cor          | `tickets/statuses`, `tbltickets_status`                       | fixos (1–6)    | `check (status between 1 and 6)`                      | 🟡       |
| Serviços de ticket                    | `tickets/services`, `tblservices`                             | não            | —                                                     | ❌       |
| Respostas predefinidas                | `tickets/predefined_replies`, `tbltickets_predefined_replies` | não            | —                                                     | ❌       |
| Mesclar tickets                       | `services/MergeTickets.php`                                   | não            | —                                                     | ❌       |
| **E-mail piping** (ticket por e-mail) | `pipe.php`, `tbltickets_pipe_log`, `utilities/pipe_log`       | não            | `tickets.source` aceita `'email'` mas não há ingestão | ❌       |
| Filtros anti-spam                     | `spam_filters`, `tblspam_filters`                             | não            | —                                                     | ❌       |
| Ticket vinculado a projeto            | `get_projects_for_ticket`                                     | sim            | `tickets.project_id`                                  | ✅       |
| Portal: abrir e responder ticket      | `open_ticket.php`, `single_ticket.php`                        | sim            | `actions/portal.ts`                                   | ✅       |
| Base de conhecimento com grupos       | `admin/Knowledge_base.php`, `tblknowledge_base_groups`        | categorias     | `kb_categories`                                       | ✅       |
| Feedback de artigo (útil / não útil)  | `tblknowedge_base_article_feedback`                           | não            | `kb_articles.views` só                                | ❌       |
| FAQ                                   | grupo de KB                                                   | FAQ próprio    | `faqs`                                                | ✅       |
| Relatório de artigos acessados        | `Reports::knowledge_base_articles`                            | não            | —                                                     | ❌       |
| **Pesquisas / surveys**               | módulo `surveys`                                              | não            | —                                                     | ❌       |

## 8. CRM (leads)

| Perfex                                                      | Evidência Perfex                                        | Orbit                    | Evidência Orbit                 | Situação |
| ----------------------------------------------------------- | ------------------------------------------------------- | ------------------------ | ------------------------------- | -------- |
| Status e origens configuráveis                              | `leads/statuses`, `leads/sources`                       | sim                      | `lead_statuses`, `lead_sources` | ✅       |
| Kanban de leads                                             | `Leads` + kanban                                        | sim                      | `/app/leads`                    | ✅       |
| Log de atividade do lead                                    | `tbllead_activity_log`                                  | sim                      | `lead_activities`               | ✅       |
| Valor estimado do lead                                      | `tblleads.lead_value`                                   | sim                      | `leads.value`                   | ✅       |
| Conversão em cliente                                        | `date_converted`, `client_id`                           | sim                      | `convertLeadToCustomerAction`   | ✅       |
| Web-to-lead                                                 | `leads/forms`, `tblweb_to_lead`, `tblform_questions`    | um formulário por tenant | `/f/[slug]`, `public-lead.ts`   | 🟡       |
| Formulário com campos customizáveis e múltiplos formulários | `tblform_questions`, `tblform_question_box`             | não                      | —                               | ❌       |
| **Integração de e-mail → lead** (IMAP)                      | `leads/email_integration`, `tblleads_email_integration` | não                      | —                               | ❌       |
| Notas e arquivos do lead                                    | `tblleads` + `tblfiles`                                 | só descrição, sem anexo  | `leads.description`             | 🟡       |
| Filtros avançados salvos                                    | `tblfilters`, `tblfilter_defaults`                      | não                      | —                               | ❌       |
| Solicitações de orçamento (estimate request)                | `admin/Estimate_request.php`, `tblestimate_requests`    | não                      | —                               | ❌       |
| Marcar lead como perdido/junk                               | `lost`, `junk`                                          | perdido sim, junk não    | `leads.lost`                    | 🟡       |

## 9. Clientes e portal

| Perfex                                         | Evidência Perfex                                      | Orbit                              | Evidência Orbit                                                        | Situação |
| ---------------------------------------------- | ----------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------- | -------- |
| Clientes (empresas) e contatos                 | `admin/Clients.php`, `tblclients`, `tblcontacts`      | sim                                | `companies`, `contacts`                                                | ✅       |
| Convite de contato para o portal               | `tblcontacts.user_id`                                 | sim                                | `inviteContactToPortalAction`                                          | ✅       |
| Cadastro self-service do cliente               | `register.php`, `confirm_registration`                | não (convite)                      | ficha [03](mapa/03-funcionalidades.md) §3.1                            | ❌       |
| Verificação de e-mail do contato               | `verification_required.php`, `mark_email_as_verified` | não                                | —                                                                      | ❌       |
| Permissões por contato (o que cada contato vê) | `tblcontact_permissions`                              | papel único de portal              | RPCs de portal                                                         | 🟡       |
| Grupos de clientes                             | `clients/groups`, `tblcustomer_groups`                | não                                | —                                                                      | ❌       |
| Administradores da conta (responsáveis)        | `tblcustomer_admins`, `assign_admins`                 | não                                | —                                                                      | ❌       |
| Cofre de senhas do cliente                     | `tblvault`, `vault_entry_*`                           | não                                | —                                                                      | ❌       |
| Arquivos do cliente compartilhados             | `tblshared_customer_files`, `files.php`               | não há arquivo no nível do cliente | `attachments` só task/project/ticket                                   | ❌       |
| Faturamento/entrega separados                  | `get_customer_billing_and_shipping_details`           | endereço único                     | `companies.address`                                                    | 🟡       |
| Moeda padrão por cliente                       | `get_customer_default_currency`                       | não                                | —                                                                      | ❌       |
| Extrato do cliente                             | `statement.php`                                       | não                                | —                                                                      | ❌       |
| Importação de clientes                         | `Clients::import`                                     | sim                                | `importCompaniesAction`                                                | ✅       |
| Portal: faturas e despesas                     | `invoices.php`                                        | sim                                | ficha [17](mapa/arquivos/17-portal-do-cliente.md)                      | ✅       |
| Portal: pagamento com cartão                   | `credit_card.php`                                     | não                                | sem gateway                                                            | ❌       |
| Portal: contratos                              | `contracts.php`                                       | sim (leitura)                      | ficha [17](mapa/arquivos/17-portal-do-cliente.md)                      | ✅       |
| Portal: propostas                              | `proposals.php`, `viewproposal.php`                   | não existe                         | —                                                                      | ❌       |
| Portal: assinaturas                            | `subscriptions.php`                                   | não existe                         | —                                                                      | ❌       |
| Portal: anúncios                               | `announcements.php`                                   | não existe                         | —                                                                      | ❌       |
| Portal: GDPR                                   | `gdpr.php`, `consent.php`                             | não existe                         | —                                                                      | ❌       |
| Portal: perfil, empresa e contatos             | `profile.php`, `company_profile.php`, `contacts.php`  | parcial                            | ficha [17](mapa/arquivos/17-portal-do-cliente.md)                      | 🟡       |
| Portal: idioma                                 | `change_language`                                     | não                                | app pt-BR                                                              | ❌       |
| Portal: SEO e Social                           | não existe                                            | sim                                | fichas [19](mapa/arquivos/19-seo.md), [20](mapa/arquivos/20-social.md) | ⭐       |

## 10. Utilitários, relatórios e configuração

| Perfex                                                                                   | Evidência Perfex                                                           | Orbit                       | Evidência Orbit                                           | Situação |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------- | -------- |
| Calendário                                                                               | `utilities/calendar`                                                       | `/app/calendario`           | `calendar_events`                                         | ✅       |
| Metas (goals)                                                                            | módulo `goals`                                                             | `/app/metas`                | `goals`, `actions/goals.ts`                               | ✅       |
| Log de atividades                                                                        | `utilities/activity_log`, `tblactivity_log`                                | `/app/atividades` + trigger | `activity_log`                                            | ✅       |
| Notificações                                                                             | `tblnotifications`, `includes/notifications.php`                           | em tempo real               | `notifications-bell.tsx`                                  | ✅       |
| **Anúncios internos para a equipe**                                                      | `admin/Announcements.php`, `tblannouncements`                              | não                         | —                                                         | ❌       |
| **Newsfeed** (post, curtida, comentário)                                                 | `admin/Newsfeed.php`, `tblnewsfeed_*`                                      | não                         | —                                                         | ❌       |
| Biblioteca de mídia                                                                      | `utilities/media`                                                          | uploads por entidade        | `attachments`                                             | 🟡       |
| Exportador em massa de PDF                                                               | `utilities/bulk_pdf_exporter`                                              | não                         | —                                                         | ❌       |
| Todo pessoal                                                                             | `admin/Todo.php`, `tbltodos`                                               | não                         | —                                                         | ❌       |
| Lembretes                                                                                | `tblreminders`, `reminder_fields.php`                                      | cron de lembretes           | `server/reminders.ts` (_ficha_)                           | 🟡       |
| Backup                                                                                   | módulo `backup`                                                            | ➖ (Supabase)               | —                                                         | ➖       |
| Módulos e auto-update                                                                    | `admin/Mods.php`, `Auto_update.php`                                        | ➖ (SaaS)                   | —                                                         | ➖       |
| Menu setup (arrastar menu)                                                               | módulo `menu_setup`                                                        | ➖                          | —                                                         | ➖       |
| **Relatório de vendas**                                                                  | `Reports::sales`                                                           | sim                         | `lib/reports.ts`                                          | ✅       |
| Relatório de despesas                                                                    | `Reports::expenses`                                                        | sim                         | `lib/reports.ts`                                          | ✅       |
| Despesas vs. receita                                                                     | `Reports::expenses_vs_income`                                              | parcial                     | `lib/reports.ts`                                          | 🟡       |
| Relatório de leads                                                                       | `Reports::leads`, `leads_monthly_report`                                   | funil                       | `lib/reports.ts`                                          | ✅       |
| Relatório de horas/timesheet                                                             | `staff/timesheets?view=all`                                                | sim                         | `lib/reports.ts`                                          | ✅       |
| Relatórios de propostas, estimativas, faturas, notas de crédito, itens, clientes, grupos | `Reports::*` (8 relatórios)                                                | só os genéricos             | —                                                         | 🟡       |
| Exportação CSV dos relatórios                                                            | botões de export                                                           | sim                         | `exportar/[entity]`                                       | ✅       |
| Staff e departamentos                                                                    | `admin/Staff.php`, `Departments.php`                                       | sim                         | `profiles`, `departments`                                 | ✅       |
| **Permissões granulares por papel** (matriz feature × capability)                        | `Roles.php`, `tblroles`, `tblstaff_permissions`, `staff_can()`             | 3 papéis fixos              | ficha [03](mapa/03-funcionalidades.md) §3.1 ("planejada") | ❌       |
| Campos personalizados por entidade                                                       | `admin/Custom_fields.php`, `tblcustomfields`                               | sim                         | `custom_field_definitions`                                | ✅       |
| Tags                                                                                     | `tbltags`, `tbltaggables`                                                  | sim                         | `tags`, `taggables`                                       | ✅       |
| Modelos de e-mail editáveis                                                              | `admin/Emails.php`, `tblemailtemplates`                                    | sim                         | `email_templates`                                         | ✅       |
| SMTP configurável                                                                        | settings `email`                                                           | fixo via Resend (env)       | `server/email.ts`                                         | 🟡       |
| SMS                                                                                      | settings `sms`, `sms_helper.php`                                           | não                         | —                                                         | ❌       |
| Google (Calendar/Drive/API)                                                              | settings `google`, `Smtp_oauth_google`                                     | não                         | —                                                         | ❌       |
| Pusher (websockets)                                                                      | settings `pusher`                                                          | Supabase Realtime           | `notifications`                                           | ✅       |
| Cronjobs                                                                                 | settings `cronjob`                                                         | Vercel cron                 | `vercel.json`                                             | ✅       |
| PDF (papel, orientação, template)                                                        | settings `pdf`                                                             | fixo                        | `pdf-lib`                                                 | 🟡       |
| **GDPR / consentimentos**                                                                | `admin/Gdpr.php`, `tblgdpr_requests`, `tblconsents`, `tblconsent_purposes` | não                         | —                                                         | ❌       |
| Idiomas (27) e troca por usuário                                                         | `language/`, `change_language`                                             | um idioma                   | não há i18n no código                                     | ❌       |
| Localização (fuso, formato de data/número, moeda)                                        | settings `localization`                                                    | fuso por tenant no Social   | `social_settings.default_timezone`                        | 🟡       |
| Tema/branding                                                                            | settings + `theme_style`                                                   | cor + logo por tenant       | bucket `branding`                                         | ✅       |
| 2FA                                                                                      | `google_two_factor.php`                                                    | não                         | ficha [03](mapa/03-funcionalidades.md) ("planejada")      | ❌       |
| API pública / REST                                                                       | `api` (comentado no menu em 3.4.1)                                         | não                         | ficha [03](mapa/03-funcionalidades.md) ("planejada")      | ❌       |
| Painel SaaS: empresas, planos e limites                                                  | não existe (instalação única)                                              | sim                         | `/plataforma`                                             | ⭐       |
| Multi-tenant com RLS                                                                     | não existe                                                                 | sim                         | migrations + RLS                                          | ⭐       |

## 11. O que o Orbit tem e o Perfex core não tem

Estes itens não são "paridade": são diferenciação. Não conte com o Perfex como
referência para eles.

| Item                                                                                           | Onde                                                                                 |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Multi-tenant SaaS com RLS no Postgres                                                          | `MAPA_DO_PROJETO.md`                                                                 |
| Planos, limites por recurso e painel super-admin                                               | `lib/plan-limits.ts`, `/plataforma`                                                  |
| Gantt interativo com dependências e detecção de ciclo                                          | `project-gantt.tsx`, `task_dependencies`                                             |
| SEO: auditoria técnica de 26 verificações, agendamento, resumo com IA, PDF                     | ficha [19](mapa/arquivos/19-seo.md)                                                  |
| Social: posts, aprovação interna e no portal, calendário, publicação nativa Instagram/LinkedIn | fichas [20](mapa/arquivos/20-social.md), [21](mapa/arquivos/21-publicacao-nativa.md) |
| Assistente de IA que cria tarefas a partir de contexto                                         | `actions/assistant.ts`                                                               |
| Notificações em tempo real                                                                     | Supabase Realtime                                                                    |
| Web-to-lead com rate limit e honeypot                                                          | `public-lead.ts`                                                                     |
| Busca global                                                                                   | `actions/search.ts`                                                                  |

## 12. Lacunas priorizadas

Critério: **P0** = quebra um fluxo comercial inteiro (o cliente não fecha o ciclo
sem isso); **P1** = comum em operação de agência, contornável hoje; **P2** =
conforto/governança.

### P0 — fecham ciclo de receita

1. **Propostas** com aceite e assinatura (hoje o funil morre no orçamento; proposta é o documento que o cliente assina antes de virar projeto).
2. **Notas de crédito** e créditos aplicados em fatura (sem isso, estorno é edição manual de fatura paga).
3. **Fatura recorrente / assinatura** (contrato mensal é o modelo padrão de agência; hoje é fatura avulsa).
4. **Catálogo de itens + impostos reutilizáveis** (digitar linha e imposto a cada documento é o atrito diário).
5. **Assinatura eletrônica de contrato** com registro de IP/data (hoje contrato sem prova de aceite).
6. **Gateway de pagamento** (fatura existe, mas o cliente não paga dentro do sistema).

### P1 — operação

7. Categorias de despesa, de modo de pagamento e catálogo de moedas (hoje texto livre).
8. Discussões do projeto e notas internas (o conhecimento do projeto hoje vive fora).
9. Respostas predefinidas e serviços de ticket.
10. Permissões granulares por papel (3 papéis fixos não cobrem agência com financeiro restrito).
11. Anúncios internos e newsfeed (comunicação da equipe hoje não existe no app).
12. Portal: perfil/empresa/contatos editáveis; pagamento com cartão; extrato.
13. Múltiplos responsáveis por tarefa e seguidores.
14. Tipos de contrato e renovação com histórico.

### P2 — governança e escala

15. GDPR/consentimentos e exclusão de dados do titular.
16. Multi-idioma (se houver cliente fora do pt-BR).
17. 2FA, API pública e webhooks (já no roadmap).
18. E-mail piping, integração IMAP de leads, filtros anti-spam.
19. Surveys, bulk PDF, biblioteca de mídia, todo pessoal.
20. Relatórios específicos: impostos, por modo de pagamento, por grupo de clientes, itens, propostas.

## 13. Módulos que vêm na distribuição 3.4.1

Não são core, mas vieram no pacote. Vale saber o que existe:

| Módulo        | O que faz                      | Relação com o Orbit                            |
| ------------- | ------------------------------ | ---------------------------------------------- |
| `goals`       | metas de vendas/equipe         | **já é nativo** (`/app/metas`)                 |
| `surveys`     | pesquisas com resposta pública | ausente                                        |
| `exports`     | exportação CSV/Excel           | nativo (CSV)                                   |
| `openai`      | geração de texto com IA        | nativo, outro escopo (assistente + resumo SEO) |
| `backup`      | backup do banco                | ➖ (Supabase)                                  |
| `einvoice`    | nota fiscal eletrônica         | ausente — relevante se o alvo é Brasil (NFS-e) |
| `menu_setup`  | reordenar menu                 | ➖                                             |
| `theme_style` | customização visual            | branding nativo                                |
| `ideal`       | integração iDEAL (gateway)     | ausente                                        |

## 14. Divergência encontrada na documentação

`C:\Arquivos Importantes\Documentação Projetos\projetos\orbit-crm` **não é o mapa
atual**. É o retrato de 09/10/2026 (`main@29aac19`, 274 fichas, 18 módulos). O
`C:\Users\werne\WebstormProjects\orbit-crm\docs` está em 15/11/2026 (`main@5086092`,
326 fichas, 21 módulos):

| Arquivo                                 | Cópia em Documentação Projetos                | Original no projeto |
| --------------------------------------- | --------------------------------------------- | ------------------- |
| `mapa/03-funcionalidades.md`            | 7.670 bytes, sem SEO/Social/nativa            | 11.216 bytes        |
| `mapa/02-processos.md`                  | 26.502 bytes                                  | 36.486 bytes        |
| `mapa/arquivos/19-seo.md`               | ausente                                       | presente            |
| `mapa/arquivos/20-social.md`            | ausente                                       | presente            |
| `mapa/arquivos/21-publicacao-nativa.md` | ausente                                       | presente            |
| `mapa/arquivos/03-validacoes-zod.md`    | 20.246 bytes                                  | 19.655 bytes        |
| `MAPA_DO_PROJETO.md`                    | 7.014 bytes, sem as revisões de 04/11 e 15/11 | 9.113 bytes         |

Ou seja: antes de olhar paridade, vale **ressincronizar a cópia** — metade da
sensação de "não sei se está tudo documentado" vem daí. O mapeamento do Orbit é
bom; ele só está desatualizado no espelho.

### 14.1 Três pontos onde a ficha do próprio Orbit é otimista

Encontrados ao conferir a ficha [03](mapa/03-funcionalidades.md) contra o código:

| Ficha diz                                        | Código mostra                                                                                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Contratos — completa"                           | CRUD + leitura no portal. Sem anexo, sem comentário, sem PDF, sem assinatura (`contracts.ts` só tem create/update/delete)                         |
| "Comentários e anexos (polimórficos) — completa" | `comments` e `attachments` aceitam **apenas** `task`, `project` (e `ticket`, depois da `0010`); não é polimórfico em contrato, despesa ou empresa |
| "Despesas — completa"                            | não tem anexo de recibo nem categoria configurável (campo texto)                                                                                  |

Isso não invalida o mapa (o status "completa" segue o critério "tela + action +
banco"), mas para efeito de paridade com o Perfex essas três linhas descem de ✅
para ❌/🟡.

## 15. Limites deste levantamento

- **Estático.** Não subi o Perfex nem o Orbit. Tudo vem de leitura de código,
  schema e documentação. Comportamento em execução (ex.: o que o cron de lembretes
  realmente dispara) está marcado como _ficha_.
- **Perfex core + 9 módulos da distribuição.** O catálogo de ~200 addons do
  `Perfex CRM.rar` ficou fora, por decisão de escopo. Vários deles (appointly,
  accounting, affiliate, timesheet avançado) cobrem lacunas listadas aqui — se
  alguma virar prioridade, vale olhar o addon correspondente como referência.
- **Equivalência não é identidade.** Onde marquei ✅, o fluxo existe nos dois, mas
  o modelo de dados e a UX são diferentes (ex.: comentários polimórficos vs.
  tabelas por entidade).
- **Addons de terceiros.** O catálogo de 261 arquivos do `Perfex CRM.rar` foi
  indexado à parte em [`perfex-addons.md`](perfex-addons.md), com o cruzamento de
  cada lacuna deste relatório com os addons que a cobrem.
- **Contagem de linhas.** A tabela de status conta 61 ✅, 28 🟡, 64 ❌, 5 ➖ e 4 ⭐;
  itens agrupados (ex.: "gateways") contam como uma linha e vários recursos.
- **Tamanho das lacunas varia.** "Notas de crédito" e "newsfeed" pesam igual na
  contagem e são esforços muito diferentes; a priorização da §12 existe para isso.
