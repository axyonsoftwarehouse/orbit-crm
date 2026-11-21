# Catálogo de addons do Perfex CRM

> Levantamento de 20/11/2026 sobre `C:\Arquivos Importantes\Fontes de Inspiração\fontes\crm\Perfex CRM.rar`.
> Inventário bruto em `perfex-addons.csv` (uma linha por arquivo, com o nome original).

## 1. Método

O RAR do catálogo tem 3.831 entradas: **261 arquivos de addon** (225 `.zip` + 36 `.rar`), uma instalação
completa do Perfex 3.4.1 duplicada dentro e documentação. Os 261 arquivos foram extraídos para um diretório
temporário, com um nível de arquivo aninhado (`upload.zip`, `All Files/modulo.zip`), e analisados por leitura:

- **nome** — limpo do nome do arquivo (versão, `_nulled`, distribuidor);
- **módulo** — pasta que tem `install.php`, `init.php` ou `<pasta>.php`;
- **menus** — chaves registradas em `add_sidebar_menu_item` / 'name' =>;
- **tabelas** — nomes criados em `CREATE TABLE`, inclusive os montados com `db_prefix() . "nome"`;
- **PHP** — quantidade de arquivos do pacote (inclui vendor e assets).

Nada foi executado. Como vários são cópias "nulled" de produtos pagos, o código foi tratado como
material de leitura apenas — e há dois achados de segurança na seção 6.

## 2. Números

| Métrica                             | Valor |
| ----------------------------------- | ----- |
| Arquivos de addon                   | 261   |
| Addons com menu próprio             | 198   |
| Addons que criam tabelas            | 171   |
| Tabelas distintas criadas           | 844   |
| Variantes de **WhatsApp/SMS/bot**   | 14    |
| Variantes de **SaaS/multi-tenant**  | 8     |
| Variantes de **Temas**              | 12    |
| Variantes de **Pagamentos**         | 13    |
| Variantes de **IA**                 | 5     |
| Variantes de **App mobile/desktop** | 7     |

O catálogo tem muita duplicação: o mesmo addon aparece em 2–6 versões, quase sempre com uma cópia
`_nulled` ao lado da versão cheia. Para efeito de "o que existe no mercado", conte por produto, não por arquivo.

## 3. Taxonomia

| Categoria                    | Arquivos |
| ---------------------------- | -------- |
| Plataforma e operação        | 37       |
| Comunicação                  | 34       |
| Vendas e CRM                 | 27       |
| Projetos, tarefas e horas    | 20       |
| Operação e verticais         | 19       |
| Pagamentos                   | 16       |
| Documentos e utilitários     | 15       |
| IA e automação               | 14       |
| Tema / aparência             | 13       |
| Financeiro e contábil        | 11       |
| Marketing e captação         | 11       |
| Relatórios, BI e visual      | 10       |
| RH e equipe                  | 8        |
| Aplicativos (mobile/desktop) | 8        |
| SaaS / multi-tenant          | 8        |
| Atendimento e suporte        | 4        |
| Instalação / pacote          | 6        |

## 4. O que o catálogo diz sobre o mercado

- **WhatsApp é a maior demanda não atendida do Perfex.** São 14 arquivos entre WhatsApp, SMS e bot
  (`whatsapp-cloud-api` sozinho aparece em 6 versões, `whatsbot` em 2, mais `zender` e integrações por bot).
  Nenhuma é oficial. Para um CRM brasileiro, isso é sinal de que WhatsApp é requisito de compra, não diferencial.
- **Multi-tenant é o buraco estrutural do Perfex.** Oito arquivos, de pelo menos quatro fornecedores
  (`perfect-saas`, `saas-module`, `turnCRM`, `perfex-crm-saas-module`), tentando transformar uma instalação
  single-tenant em SaaS. É exatamente o que o Orbit resolveu na fundação com RLS — e o que esses addons
  remendam por cima.
- **Faturamento brasileiro/latino não está coberto.** Há `mercadopago`, `gerencianet`, `paystack`,
  `razorpay`, `xendit`, mas **nenhum emissor de NFS-e**. O módulo `einvoice` da distribuição cobre nota
  fiscal genérica.
- **O ecossistema cresce em volta do que o core não faz**: assinatura de documento, inbox de e-mail,
  catálogo de produtos, compras/fornecedores, RH/folha, estoque, field service e relatórios.

## 5. Cruzamento com as lacunas do Orbit

Ligação entre as lacunas de [`paridade-perfex-3.4.1.md`](paridade-perfex-3.4.1.md) e os addons que já resolvem
aquele problema (referência de escopo, não recomendação de instalação):

| Lacuna no Orbit                             | Prioridade | Addons que cobrem                                                                                                      |
| ------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Catálogo de itens e serviços                | P0         | `Inventory Management` (2 versões), `perfex-shop-ecommerce`, `purchase-management`                                     |
| Assinatura eletrônica de contrato           | P0         | `Flexform` (formulários), `document-management`, `qr-code` (não há e-sign dedicado)                                    |
| Notas de crédito / reembolsos               | P0         | `accounting-and-bookkeeping` (journal, reconcile, bills, budget)                                                       |
| Fatura recorrente / assinatura              | P0         | `subscription-as-products`, `wallet-module`                                                                            |
| Propostas comerciais                        | P0         | `Deals Management`, `omni-channel-sales`, `sales-agent-management`                                                     |
| Gateway de pagamento                        | P0         | 16 arquivos: Stripe SEPA, Mercado Pago, Gerencianet, Paystack, Razorpay, Xendit, GoCardless, Coinbase, BitPay, Shopier |
| Discussões / notas de projeto               | P1         | `whiteboard`, `mindmap`, `diagramy`                                                                                    |
| Respostas predefinidas e serviços de ticket | P1         | `allinone-support`, `perfex-crm-chat-tickets-app`                                                                      |
| Newsfeed interno                            | P1         | `perfex-crm-employee-chat`, `Perfex CRM Chat`                                                                          |
| Extrato do cliente                          | P1         | `financial-control-professional-expenses`                                                                              |
| Grupos de clientes                          | P2         | `customer-loyalty-and-memberships`                                                                                     |
| Cofre de senhas (vault)                     | P2         | `team-password`                                                                                                        |
| E-mail piping / IMAP                        | P2         | `Mailbox for Perfex`, `mailbox-webmail-client`                                                                         |
| 2FA                                         | P2         | `multichannel-two-factor-authentication`                                                                               |
| API pública e webhooks                      | P2         | `REST API` (3 versões), `perfex-graphql-api`, `webhooks` (3 versões)                                                   |

## 6. Segurança: o catálogo não é seguro

Quatro fatos que importam antes de qualquer uso:

1. Quase tudo é **cópia "nulled"** de produto pago, distribuída por sites de pirataria (`nullcave.club`,
   `_nulled` no nome). Não há garantia de integridade nem de atualização.
2. **Backdoor confirmado** em `cloudlinkd-perfex-v3`: `libraries/Sms_msgbucket_perfex.php` guarda um blob
   cifrado e termina em `eval(base64_decode($decrypted_code))` — o arquivo inteiro é um payload ofuscado.
3. **Web shell deixado no pacote** de `recruitment-management-for-perfex-crm`: o arquivo
   `recruitment/uploads/candidate/files/9/fman.php` (899 KB) é o **phpFileManager 1.7.8**, um gerenciador de
   arquivos PHP completo — leitura, escrita e execução — dentro de uma pasta `uploads/` que normalmente é
   servida pela web. É o tipo de arquivo que transforma um CRM em servidor de invasão.
4. Nenhum arquivo do catálogo foi executado. A varredura foi estática (13 arquivos com `eval`; os outros 11
   são bibliotecas legítimas — dompdf, Doctrine, PHPUnit, CodeIgniter Xmlrpc, php-cs-fixer).

**Recomendação:** use este acervo como referência de escopo (o que existe, como se chama, que tabelas cria),
nunca como código de produção. Se algum desses dois pacotes foi instalado em ambiente seu, trate como
comprometido: remova, troque credenciais e audite os acessos.

## 7. Plataforma e operação

| Addon                                                           | Módulo                         | Menus                                                                  | Tabelas                                       | PHP   |
| --------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | ----- |
| addon statuses                                                  | si_custom_status               | custom_status_project_statuses_menu, custom_status_setup_menu, custom… | si_custom_status si_custom_status_default     | 14    |
| addon validation                                                | si_validate                    | validate_settings                                                      | —                                             | 8     |
| adjustable table list headings                                  | table_manage                   | —                                                                      | table_manage_table_fields table_manage_table… | 11    |
| advanced automation manager                                     | automation_manager             | automation                                                             | automation_actions automation_triggers autom… | 24    |
| aws s3 integration                                              | Arn ; aws_integration ; Compo… | aws_integration                                                        | s3_files                                      | 2727  |
| cloudlinkd perfex v3                                            | cloudlinkd_perfex ; Helpers    | —                                                                      | —                                             | 269   |
| custom data tables                                              | config ; customtables          | contracts, customers, estimates, expenses, invoices, leads, projects,… | —                                             | 238   |
| custom javascript                                               | inject_javascript              | inject_javascript                                                      | —                                             | 26    |
| custom links                                                    | custom_links                   | —                                                                      | —                                             | 46    |
| elite custom js and css                                         | elite_custom_js_css            | elite_custom_css, elite_custom_js, elite_custom_js_css                 | —                                             | 18    |
| extra settings                                                  | extra_setting                  | es_settings                                                            | —                                             | 40    |
| flexible backup and restore                                     | Arn ; Composer ; Credentials … | Flexi Backup                                                           | flexibackup                                   | 22229 |
| flexible backup and restore                                     | Arn ; Composer ; Credentials … | Flexi Backup                                                           | flexibackup                                   | 6783  |
| importsync csv mapping                                          | importsync                     | importsync, importsync_import_staff, importsync_manage_mappings, impo… | importsync_csv_mapped                         | 19    |
| language translations                                           | translations                   | —                                                                      | —                                             | 38    |
| logtracker the powerful log tracking                            | config ; logtracker            | logtracker                                                             | —                                             | 111   |
| multichannel two factor authentication                          | mfa                            | mfa, mfa_management, mfa_report, mfa_setting                           | mfa_history_login mfa_options mfa_security_c… | 43    |
| perfex crm arabic language translation                          | —                              | —                                                                      | —                                             | 15    |
| perfex graphql api query all crms data including custom modules | Error ; Executor ; graphql ; … | graphql, graphql_token, graphqlapi_guide                               | —                                             | 548   |
| perfex mod automation manager                                   | automation_manager             | automation                                                             | automation_actions automation_triggers autom… | 14    |
| perfex mod custom links                                         | custom_links                   | —                                                                      | —                                             | 45    |
| perfex mod language translations                                | translations                   | —                                                                      | —                                             | 37    |
| perfshield the powerful security toolset                        | perfshield                     | —                                                                      | blacklist perfshield_logs                     | 230   |
| polyutilities                                                   | poly_utilities                 | clients_nav_kb, clients_nav_login, clients_nav_register, poly_utiliti… | —                                             | 67    |
| reminder                                                        | reminder                       | reminder, Reminder SETTINGS, reminder_services                         | reminder_service_value reminder_services tbl… | 60    |
| reminder                                                        | reminder                       | reminder                                                               | tblreminder_activity                          | 35    |
| rest api                                                        | api                            | api, api_guide, api_management                                         | tbluser_api_permissions user_api user_api_pe… | 147   |
| rest api                                                        | customers_api                  | api_settings, customer_rest_api, customers_api                         | —                                             | 232   |
| rest api                                                        | api                            | api, api_guide, api_management                                         | tbluser_api_permissions user_api user_api_pe… | 136   |
| rest api                                                        | api                            | api, api_guide, api_management                                         | user_api                                      | 112   |
| REST API Module for                                             | API                            | api, api_guide, api_management, api_reporting, api_sandbox, api_setti… | api_limit api_security_log api_usage_logs ap… | 232   |
| team password                                                   | team_password                  | category_management, setting_tp, statistical, team_password, tp_dashb… | permission team_password_category tp_bank_ac… | 346   |
| toast master                                                    | toast_master                   | toast_master                                                           | —                                             | 6     |
| webhooks                                                        | config ; webhooks              | —                                                                      | scheduled_webhooks webhooks_debug_log webhoo… | 127   |
| webhooks                                                        | config ; webhooks              | —                                                                      | webhooks_debug_log webhooks_master            | 118   |
| webhooks                                                        | webhooks                       | webhook_log, webhooks                                                  | webhooks_debug_log webhooks_master            | 89    |
| workflow rules and automation                                   | flexiblewa                     | client, contract, estimate, expense, flexiblewa_days, flexiblewa_hour… | flexibleworkflows                             | 28    |

## 8. Comunicação

| Addon                                         | Módulo                         | Menus                                                                  | Tabelas                                       | PHP   |
| --------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | ----- |
| addon sms manager                             | si_sms                         | sms_custom_send_menu, sms_menu, sms_schedule_send_menu, sms_settings,… | si_sms_schedule si_sms_schedule_rel si_sms_t… | 31    |
| addon sms manager                             | si_sms                         | sms_custom_send_menu, sms_menu, sms_schedule_send_menu, sms_settings,… | si_sms_schedule si_sms_schedule_rel si_sms_t… | 20    |
| advanced email system                         | config ; extended_email        | —                                                                      | extended_email_log_activity extended_email_s… | 111   |
| advanced email system                         | extended_email                 | extended_email, extended_email_form, extended_email_log_history        | extended_email_log_activity extended_email_s… | 102   |
| Custom SMS Email                              | customemailandsmsnotifications | Custom Email/SMS, General, Invoices, Marketing, message_history, Proj… | custom_email_sms custom_email_sms_queue cust… | 123   |
| custom sms email notifications for pefex      | custom_email_and_sms_notifica… | Custom Email/SMS, Send a Notification, sms_module_title, templates     | custom_templates                              | 85    |
| drag and drop perfex crm email builder        | perfex_email_builder           | edit_an_email_template                                                 | _perfex_email_builder                         | 10    |
| google workspace module perfex                | AndroidEnterprise ; Calendar … | google_drive, google_drive_google_docs, google_drive_google_sheets, g… | google_drives                                 | 28760 |
| Mailbox for                                   | Carbon ; clock ; Container ; … | contacts, email_templates, Emails, mailbox, mailbox_auto_replies, mai… | mail_attachment mail_auto_replies mail_clien… | 1933  |
| mailbox webmail client                        | mailbox                        | mailbox, mailbox_setting                                               | mail_attachment mail_conversation mail_inbox… | 112   |
| mailbox webmail client                        | mailbox                        | mailbox                                                                | mail_attachment mail_inbox mail_outbox        | 90    |
| mailchimp                                     | Cache ; Call ; Command ; Comp… | --, Mailchimp, mailchimp_audience, mailchimp_configuration, mailchimp… | mailchimp_activity_logs                       | 2414  |
| mailflow customers leads newsletter           | mailflow                       | mailflow, mailflow_newsletter, mailflow_newsletter_history, mailflow_… | mailflow_email_templates mailflow_newsletter… | 22    |
| MailFlow v1.2.0                               | mailflow                       | mailflow, mailflow_integrations, mailflow_newsletter, mailflow_newsle… | mailflow_email_templates mailflow_newsletter… | 33    |
| mention and tag                               | mention                        | mention                                                                | mention_post_comments mention_posts           | 13    |
| Perfex CRM Chat                               | Anthropic ; Deepseek ; Deseri… | AI Chatbot, Analytics, Conversations, Messaging, Settings, Support     | —                                             | 665   |
| perfex crm chat tickets app for support board | supportboard                   | Support Board                                                          | —                                             | 16    |
| perfex crm employee chat                      | prchat                         | Chat                                                                   | —                                             | 91    |
| perfex crm video chat addon from livesmart    | livesmart                      | livesmsart_dashboard, settings_group_livesmart                         | —                                             | 145   |
| pushover instant support notifications        | pushover                       | settings_group_pushover                                                | —                                             | 9     |
| sendinblue sms notification                   | Helpers ; sendin               | —                                                                      | —                                             | 540   |
| sendinblue sms notification                   | sendin                         | —                                                                      | —                                             | 507   |
| slack alert                                   | slack_alert                    | slack_alert_manage                                                     | slack_alert                                   | 8     |
| whatsapp                                      | whatsapp_chat                  | whatsapp_chat                                                          | —                                             | 27    |
| whatsapp cloud api business integration       | config ; whatsapp_api          | —                                                                      | scheduled_whatsapp_messages whatsapp_api_deb… | 137   |
| whatsapp cloud api business integration       | config ; whatsapp_api          | —                                                                      | scheduled_whatsapp_messages whatsapp_api_deb… | 139   |
| whatsapp cloud api business integration       | config ; whatsapp_api          | —                                                                      | whatsapp_api_debug_log whatsapp_templates wh… | 131   |
| whatsapp cloud api business integration       | whatsapp_api                   | broadcast_messages, template_list, template_mapping, whatsapp, whatsa… | whatsapp_api_debug_log whatsapp_templates wh… | 95    |
| whatsapp cloud api business integration       | whatsapp_api                   | broadcast_messages, template_list, template_mapping, whatsapp, whatsa… | whatsapp_api_debug_log whatsapp_templates wh… | 116   |
| whatsapp cloud api business integration       | whatsapp_api                   | broadcast_messages, template_list, template_mapping, whatsapp, whatsa… | whatsapp_api_debug_log whatsapp_templates wh… | 122   |
| whatsapp cloud api interaction                | numbers ; whatsapp             | activity_log, body_data, bots, bulk_contacts, bulk_groups, campaigns,… | —                                             | 650   |
| whatsapp cloud api interaction                | BusinessProfileRequest ; Load… | activity_log, body_data, bots, campaigns, category, chat, documentati… | whatsapp_activity_log whatsapp_bot whatsapp_… | 879   |
| whatsapp cloud api interaction                | whatsapp                       | activity_log, body_data, bots, bulk_contacts, bulk_groups, campaigns,… | —                                             | 643   |
| zender perfex crm sms plugin                  | Helpers                        | —                                                                      | —                                             | 268   |

## 9. Vendas e CRM

| Addon                                  | Módulo                         | Menus                                                                  | Tabelas                                       | PHP  |
| -------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | ---- |
| account planning                       | account_planning               | account_planning                                                       | account_planning account_planning_current_se… | 17   |
| advanced lead filters                  | si_lead_filters                | lead_filters_menu, lf_submenu_filter_templates, lf_submenu_lead_filte… | si_lead_filter                                | 9    |
| affiliate                              | affiliate_management           | Affiliate Payout Request, Affiliate Payout Request Update, Affiliate … | —                                             | 71   |
| affiliate management                   | affiliate ; affiliate_program… | affiliate, affiliate_logs, affiliate_orders, affiliate_product, affil… | affiliate_admin_permissions affiliate_admins… | 140  |
| Affiliate Management                   | affiliate ; affiliate_program… | affiliate, affiliate_logs, affiliate_orders, affiliate_product, affil… | affiliate_admin_permissions affiliate_admins… | 280  |
| Affiliate Module                       | affiliate_management           | Affiliate Payout Request, Affiliate Payout Request Update, Affiliate … | —                                             | 71   |
| customer loyalty and memberships       | loyalty ; loyalty_rule ; memb… | Birthday, configuration, loyalty, loyalty_programs, membership, trans… | loy_card loy_mbs_program loy_mbs_rule loy_pr… | 63   |
| customer loyalty and memberships       | loyalty ; loyalty_rule ; memb… | configuration, loyalty, loyalty_programs, membership, transation, user | loy_card loy_mbs_program loy_mbs_rule loy_pr… | 54   |
| deals management                       | deals                          | <span class="text-white">, leads_sources_submenu, Deal Send Email, de… | tbl_deal_activity_log tbl_deal_calls tbl_dea… | 102  |
| Deals Management                       | deals                          | leads_sources_submenu, automation, Campaigns, Connectors, Dashboard, … | tbl_deal_activity_log tbl_deal_calls tbl_dea… | 98   |
| export customer details kyc compliance | si_export_customer             | customer_matrix, customer_services, customer_settings, expoert_custom… | si_export_customer_kyc_files si_export_custo… | 20   |
| Facebook Instagram Leads               | facebookleadsintegration       | Facebook Lead Ads, facebookleadsintegration, fb_leads_field_mapping, … | fb_leads_field_mappings fb_leads_logs fb_lea… | 100  |
| facebook leads integration sync        | Facebook ; facebook_leads_int… | facebook_leads_integration                                             | —                                             | 150  |
| flexible lead scoring                  | flexibleleadscore              | —                                                                      | flexiblels_criteria flexiblels_lead_scores    | 52   |
| Flexible Lead Scoring for              | flexibleleadscore              | —                                                                      | flexiblels_criteria flexiblels_lead_scores    | 52   |
| google lead finder                     | flexibleleadfinder             | —                                                                      | flexibleleadfinder flexibleleadfindercontacts | 40   |
| indiamart leads integration            | si_indiamart_leads             | indiamart_leads_settings                                               | si_iml_activity_log                           | 8    |
| lead follow up scheduler               | si_lead_followup               | lead_followup_menu, lead_followup_schedule_send_submenu, lead_followu… | si_lead_followup_schedule si_lead_followup_s… | 13   |
| lead follow up scheduler               | si_lead_followup               | lead_followup_menu, lead_followup_schedule_send_submenu, lead_followu… | si_lead_followup_schedule si_lead_followup_s… | 13   |
| lead manager                           | CredentialList ; Jwt ; lead_m… | Is twilio number whats app enabled, lead_manager, lead_manager_dashbo… | lead_manager_conference lead_manager_convers… | 2156 |
| lead manager                           | CredentialList ; Jwt ; lead_m… | Is twilio number whats app enabled, lead_manager, lead_manager_dashbo… | emailtemplates lead_manager_conference lead_… | 2269 |
| Lead Manager                           | CredentialList ; Jwt ; lead_m… | Is twilio number whats app enabled, lead_manager, lead_manager_ai_cha… | lead_manager_conference lead_manager_convers… | 2368 |
| multipage web to lead form             | multi_page_wtl                 | —                                                                      | —                                             | 19   |
| omni channel sales                     | cart ; HttpClient ; omni_sale… | customer_report, diary_sync, fixed, Mpesatrans, omni_sales, omni_sale… | cart cart_detailt omni_cart_payment omni_cre… | 352  |
| omni channel sales                     | cart ; HttpClient ; omni_sale… | diary_sync, omni_sales, omni_sales_channel, order_list, portal, POS, … | cart cart_detailt omni_log_discount omni_log… | 77   |
| sales agent management                 | invoices ; sale_agent ; sales… | sa_dashboard, sa_management, sa_orders, sa_programs, sa_settings, sal… | currency_rate_logs currency_rates sa_approva… | 180  |
| sales commission program               | commission                     | applicable_client, applicable_staff, commission, commission_policy, c… | applicable_staff commission commission_hiera… | 63   |

## 10. Projetos, tarefas e horas

| Addon                              | Módulo                       | Menus                                                                  | Tabelas                                       | PHP |
| ---------------------------------- | ---------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- | --- |
| Advanced Task Timesheet            | si_timesheet ; timesheet     | timesheet_settings, ts_main_menu, ts_timesheet_summary_menu, ts_times… | si_timesheet_filter                           | 27  |
| advanced task timesheet manager    | si_timesheet ; timesheet     | timesheet_settings, ts_main_menu, ts_timesheet_summary_menu, ts_times… | si_timesheet_filter                           | 29  |
| advanced to do manager             | si_todo                      | todo_category_menu, todo_list_menu, todo_main_menu, todo_settings_menu | si_todos si_todos_category si_todos_settings  | 14  |
| custom task filters                | si_task_filters              | custom_reports, tasks_filter, tasks_filter_templates                   | si_task_filter                                | 33  |
| custom task filters                | si_task_filters              | custom_reports, tasks_filter, tasks_filter_templates                   | si_task_filter                                | 25  |
| perfex mod advanced task manager   | advanced_task_status_manager | —                                                                      | project_status_can_change project_statuses t… | 14  |
| project kanban view                | project_kanban               | —                                                                      | project_kanban_settings                       | 20  |
| project roadmap advanced reporting | projectroadmap               | projectroadmap                                                         | list_widget                                   | 99  |
| project roadmap advanced reporting | project_roadmap              | project_roadmap                                                        | list_widget                                   | 13  |
| project sprints management         | flexagile                    | —                                                                      | flexagilesprints flexagiletasks               | 32  |
| project task manage                | task_manage                  | projects, task_manage_groups, task_manage_groups_pipeline              | task_manage_custom_fields_values task_manage… | 34  |
| project templates                  | project_templates            | —                                                                      | —                                             | 47  |
| staff workload                     | resource_workload            | overview, resource_workload, settings                                  | standard_workload workload_dayoff             | 49  |
| task filters                       | si_task_filters              | custom_reports, tasks_filter, tasks_filter_templates                   | si_task_filter                                | 12  |
| task templates                     | task_templates               | —                                                                      | tbltask_templates_que                         | 37  |
| Task Templates                     | task_templates               | —                                                                      | tbltask_templates_que                         | 37  |
| tasks bookmark                     | taskbookmarks                | taskbookmarks                                                          | list_widget taskbookmarks taskbookmarks_deta… | 98  |
| tasks bookmark                     | task_bookmarks               | task_bookmarks                                                         | list_widget task_bookmarks task_bookmarks_de… | 12  |
| timesheets and leave management    | timesheets ; XLSXReader      | attendance, leave, reports, route_management, settings, shift_managem… | check_in_out day_off leave_of_the_year manag… | 358 |
| zapier                             | api                          | api_management, zapier, zapier_interface                               | tbluser_api_permissions user_api user_api_pe… | 144 |

## 11. Operação e verticais

| Addon                                         | Módulo                         | Menus                                                                  | Tabelas                                       | PHP  |
| --------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | ---- |
| appointly perfex crm appointments             | appointly ; Calendar ; Handler | appointly_company_schedule, appointly_module_name, appointly_staff_wo… | appointly_company_schedule appointly_service… | 813  |
| appointly perfex crm appointments             | appointly ; Calendar ; callba… | appointly_callbacks, appointly_module_name, appointment_appointments,… | —                                             | 807  |
| appointly perfex crm appointments             | appointly ; Calendar ; callba… | appointly_callbacks, appointly_module_name, appointment_appointments,… | —                                             | 596  |
| catering management                           | catering_management_module     | allergens, catering_management, cmm_event_types, cmm_events, dietary_… | catering_allergens catering_dietary_types ca… | 73   |
| fleet management                              | fleet                          | benefit_and_penalty, bookings, dashboard, driver, event, fleet, fuel,… | fleet_maintenances                            | 163  |
| flexacademy perfex learning management system | flexacademy                    | —                                                                      | flexacademy_categories flexacademy_certifica… | 196  |
| flexstage event management and ticket booking | Calculation ; Cell ; Chart ; … | Arial, clients, Event Attendees, flexstage, Flexstage Events, flexsta… | flexcategories flexemaillists flexevents fle… | 2034 |
| inventory management                          | warehouse ; XLSXReader         | _warehouse, internal_delivery_note, inventory_receipt_inventory_deliv… | goods_delivery goods_delivery_detail goods_d… | 257  |
| inventory management                          | warehouse                      | items, loss_adjustment, report, setting, stock_export, stock_import, … | goods_delivery goods_delivery_detail goods_r… | 291  |
| Inventory Management                          | warehouse ; XLSXReader         | _warehouse, internal_delivery_note, inventory_receipt_inventory_deliv… | currency_rate_logs currency_rates goods_deli… | 292  |
| logistics management                          | logistic ; phpqrcode ; pre_al… | lg_address_book, lg_consolidated, lg_dashboard, lg_locker_packages, l… | currency_rate_logs currency_rates lg_action_… | 219  |
| Logistics Management                          | logistic ; phpqrcode ; pre_al… | lg_address_book, lg_consolidated, lg_dashboard, lg_locker_packages, l… | currency_rate_logs currency_rates lg_action_… | 219  |
| manufacturing management                      | manufacturing ; unit_of_measu… | manufacturing_name, mrp_bills_of_materials, mrp_dashboard, mrp_manufa… | mrp_bill_of_material_details mrp_bill_of_mat… | 110  |
| perfex shop ecommerce                         | products                       | add_new_order, order_history, order_report, Products, products_catego… | order_items order_master product_categories … | 36   |
| Property Tenants                              | Decoder ; Detector ; property… | propertybase, propertybase_maintenance_requests, propertybase_modules… | propertybase_amenities propertybase_amenitie… | 229  |
| service management                            | contracts ; general ; service… | contract_list_client, project, service_management_name, sm_contract_a… | sm_contract_addendums sm_contract_comments s… | 109  |
| Service Management                            | service_management             | service_management, sm_jobs, sm_reports, sm_settings, sm_technicians   | service_api_tokens service_inventory_parts s… | 53   |
| supplier management                           | items ; supplier               | customer_map, items, product_and_service, suppliers                    | —                                             | 58   |
| Warranty Management                           | general ; warranty_claims ; w… | mrp_settings, warranties_management_name, wm_terms_conditions, wm_war… | wm_timeline_logs wm_warranty_claim_informati… | 68   |

## 12. Pagamentos

| Addon                                         | Módulo                         | Menus                                                                  | Tabelas | PHP  |
| --------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | ------- | ---- |
| bitpay payment gateway                        | Bitpay ; bitpay_gateway ; Cac… | blockquote, code, del, hr, img, li, pre, table                         | —       | 5716 |
| cashfree payment gateway                      | cashfree                       | cashfree_settings                                                      | —       | 9    |
| coinbase crypto payment gateway               | coinbase ; Webhook             | —                                                                      | —       | 178  |
| gocardless payment gateway                    | gocardless_gateway             | —                                                                      | —       | 320  |
| gocardless payment gateway                    | Cache ; Carbon ; Container ; … | blockquote, code, del, hr, img, li, pre, table                         | —       | 5080 |
| mercado pago payment gateway                  | mercadopago_gateway            | —                                                                      | —       | 30   |
| paystack payment gateway                      | paystack                       | —                                                                      | —       | 43   |
| paystack payment gateway                      | paystack                       | —                                                                      | —       | 40   |
| perfex mercadopago                            | mercadopago_gateway            | —                                                                      | —       | 176  |
| razorpay payment gateway                      | razorpay                       | —                                                                      | —       | 125  |
| shopier payment gateway                       | shopier                        | —                                                                      | —       | 35   |
| stripe sepa direct debit payment gateway      | stripe_sepa                    | Stripe SEPA Consumer Email, Stripe SEPA Consumer IBAN, Stripe SEPA Co… | —       | 97   |
| swiss qr bill                                 | Builder ; Color ; EdgeIterato… | swissqrbill_settings_menu                                              | —       | 2017 |
| wallet                                        | wallet                         | settings, Wallet withdraw Request, Wallet Withdraw Request Update, wa… | —       | 49   |
| weboox plugin gerencianet para perfex crm api | —                              | —                                                                      | —       | 1    |
| xendit payment gateway                        | xendit_gateway                 | —                                                                      | —       | 3    |

## 13. Documentos e utilitários

| Addon                          | Módulo                         | Menus                                                                  | Tabelas                                       | PHP |
| ------------------------------ | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | --- |
| assetcentral assets management | assetcentral ; Decoder ; Dete… | assetcentral, assetcentral_appreciations_menu, assetcentral_audit_men… | assetcentral_asset_assigned assetcentral_ass… | 128 |
| AssetCentral v1.0              | assetcentral ; Decoder ; Dete… | assetcentral, assetcentral_appreciations_menu, assetcentral_audit_men… | assetcentral_asset_assigned assetcentral_ass… | 128 |
| assets management              | assets                         | allocation, assets, depreciation, eviction, setting                    | asset_location asset_unit assets assets_acct… | 117 |
| assets management              | assets                         | allocation, asset, assets, depreciation, eviction, setting             | asset_location asset_unit assets assets_acct… | 28  |
| document management            | document_management ; Excepti… | dmg_documents, dmg_file_management, dmg_settings                       | dmg_approval_detail_eids dmg_approval_detail… | 797 |
| domain manager                 | domain_manager                 | domain_manager, domain_manager_projects, domain_manager_setting        | domain_manager                                | 15  |
| Domain Manager for             | domain_manager                 | domain_manager, domain_manager_domain_list, domain_manager_hosting_li… | domain_manager hosting_details                | 22  |
| file sharing                   | Dropbox ; file_sharing         | download_management, file_management, file_sharing, reports, setting_… | fs_downloads fs_file_overview fs_genenal_ip_… | 212 |
| file sharing                   | Dropbox ; file_sharing         | download_management, file_management, file_sharing, reports, setting_… | fs_downloads fs_file_overview fs_genenal_ip_… | 211 |
| meetlink manager               | meetlink_manager               | meeting_services, meetings, meetlink_manager, settings_meetlink        | meeting_invitations meeting_participants mee… | 28  |
| pdf customizer                 | config ; custom_pdf            | —                                                                      | —                                             | 123 |
| Perfex CRM Document Management | document_management ; Excepti… | dmg_documents, dmg_file_management, dmg_settings                       | dmg_approval_detail_eids dmg_approval_detail… | 797 |
| perfex zoom meeting            | zoom_meetings                  | zoom, Zoom Meeting, zoom_add_registrant, zoom_api_settings, zoom_crea… | zoom zoom_client zoom_client_meetings zoom_m… | 21  |
| perfex zoom meeting module     | zoom_meetings                  | zoom, Zoom Meeting, zoom_add_registrant, zoom_api_settings, zoom_crea… | zoom zoom_meetings                            | 221 |
| qr code addon                  | qrcode                         | qrcode                                                                 | —                                             | 13  |

## 14. IA e automação

| Addon                                                                          | Módulo                         | Menus                                                                  | Tabelas                                       | PHP  |
| ------------------------------------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | ---- |
| imabotmail accounting and bookkeeping                                          | accounting ; journal_entry ; … | accounting_report, accounting, chart_of_accounts, dashboard, journal_… | acc_account_history acc_account_type_details… | 116  |
| leadpilot smart ai call assistant lead automation                              | ai_lead_manager                | alm_call_logs, LeadPilot AI, leads_dt_last_call_ended_reason           | alm_call_logs                                 | 187  |
| LeadPilot v1.3.3                                                               | ai_lead_manager                | alm_call_logs, LeadPilot AI, leads_dt_last_call_ended_reason           | alm_call_logs                                 | 187  |
| Perfex AiWriter                                                                | aiwriter                       | AiWriter, aiwriter_setting, setting, usage_cases, writer               | aiwriter_usage_cases                          | 148  |
| perfex aiwriter openai base content generator ai writing and autoreplay module | aiwriter                       | AiWriter, aiwriter_setting, setting, usage_cases, writer               | aiwriter_usage_cases                          | 26   |
| perfex aiwriter openai base content generator ai writing and autoreplay module | aiwriter                       | AiWriter, aiwriter_setting, setting, usage_cases, writer               | aiwriter_usage_cases                          | 25   |
| perfex crm and telegrambot                                                     | upload_x                       | telegram, Telegram chat                                                | telegram                                      | 22   |
| perfex crm and telegrambot chat                                                | telegram_chat                  | telegram, Telegram chat                                                | —                                             | 5    |
| perfex crm and telegrambot chat module                                         | Collection ; InputMedia ; tel… | telegram, Telegram chat                                                | telegram_info                                 | 189  |
| Perfex CRM TelegramBot Notification                                            | Collection ; InputMedia ; tel… | telegram, Telegram chat                                                | telegram_info                                 | 189  |
| publishx ai powered cms                                                        | publishx                       | publishx, publishx_blog, publishx_categories, publishx_languages, pub… | publishx_categories publishx_languages publi… | 30   |
| WhatsBot v5.0 PerfexCRM                                                        | bot_flow ; Builder ; Business… | initiate_chat                                                          | wtc_activity_log wtc_ai_prompts wtc_bot wtc_… | 1693 |
| whatsbot whatsapp marketing bot chat                                           | bot_flow ; Builder ; Business… | —                                                                      | wtc_activity_log wtc_ai_prompts wtc_bot wtc_… | 1498 |
| whatsbot whatsapp marketing bot chat                                           | bot_flow ; BusinessProfileReq… | —                                                                      | wtc_activity_log wtc_ai_prompts wtc_bot wtc_… | 527  |

## 15. Tema / aparência

| Addon                            | Módulo                | Menus                                              | Tabelas                                       | PHP |
| -------------------------------- | --------------------- | -------------------------------------------------- | --------------------------------------------- | --- |
| dynamic customized theme         | si_custom_theme       | ct_settings, custom_staff_theme_menu, custom_theme | si_custom_theme_client si_custom_theme_list … | 32  |
| flat admin theme                 | flatadmintheme        | —                                                  | —                                             | 91  |
| flat admin theme                 | flat_admin_theme      | —                                                  | —                                             | 5   |
| perfex crm admin light theme     | admin_light_theme     | —                                                  | —                                             | 20  |
| perfex crm dark theme            | perfex_dark_theme     | —                                                  | —                                             | 12  |
| Perfex CRM Dark Theme            | perfex_dark_theme     | —                                                  | —                                             | 21  |
| perfex crm flat theme            | —                     | —                                                  | —                                             | 74  |
| perfex crm office theme          | perfex_office_theme   | —                                                  | —                                             | 14  |
| Perfex CRM v1.0.4 Flat Theme     | flatadmintheme        | —                                                  | —                                             | 91  |
| StyleFlow v1.0                   | styleflow             | styleflow                                          | —                                             | 57  |
| ultimate dark theme perfex crm   | ultimate_dark_theme   | —                                                  | —                                             | 9   |
| ultimate purple theme perfex crm | ultimate_purple_theme | —                                                  | —                                             | 22  |
| weboox pro theme                 | —                     | —                                                  | —                                             | 0   |

## 16. Financeiro e contábil

| Addon                                          | Módulo                         | Menus                                                                  | Tabelas                                       | PHP  |
| ---------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | ---- |
| accounting and bookkeeping                     | accounting ; journal_entry ; … | accounting_report, accounting_transfer, accounting, banking, bills, b… | acc_account_history acc_account_type_details… | 264  |
| accounting and bookkeeping                     | accounting ; journal_entry ; … | accounting_report, accounting_transfer, accounting, banking, budget, … | acc_account_history acc_account_type_details… | 185  |
| delivery note                                  | delivery_notes ; pipeline      | customer_permission_delivery_notes, Delivery Note Cancelled (Sent to … | —                                             | 83   |
| financial control professional expenses weboox | bills                          | Contas a Pagar, Contas a Pagar vs Renda                                | —                                             | 96   |
| invoice builder                                | invoices_builder ; phpqrcode   | ib_build_invoices, ib_templates, invoices_builder                      | ib_customfield ib_customfield_value ib_invoi… | 158  |
| invoice templates                              | styleflow                      | styleflow                                                              | —                                             | 57   |
| purchase management                            | purchase ; vendor_items ; XLS… | contracts, invoices, items, pur_debit_note, pur_return_orders, purcha… | currency_rate_logs currency_rates items_of_v… | 489  |
| purchase management                            | purchase ; vendor_items        | contracts, invoices, items, purchase, purchase_order, purchase_reques… | pur_approval_details pur_approval_setting pu… | 380  |
| purchase order                                 | pipeline ; purchase_orders     | customer_permission_purchase_orders, Purchase Order Cancelled (Sent t… | —                                             | 79   |
| quickbooks online                              | DataService ; OAuth1 ; Platfo… | propertyName, qb_tax_agency, quickbooks, quickbooks_short, Response    | qb_agencies qb_chart_accounts qb_items qb_ta… | 1088 |
| subscription as products                       | services                       | invoice_products, long_description, product_groups, product_menu_purc… | —                                             | 43   |

## 17. Marketing e captação

| Addon                                                  | Módulo                         | Menus                                                                  | Tabelas                                       | PHP |
| ------------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | --- |
| bannercraft dynamic banner management                  | banner ; config                | —                                                                      | banner                                        | 111 |
| Flexform v1.0.8                                        | flexform                       | flexform_forms, flexform_my_forms, leads, tickets                      | flexformblockanswer flexformblocks flexformb… | 248 |
| marketing automation                                   | ma ; sms                       | campaigns, channels, components, dashboard, gdpr_consent, lead_compan… | —                                             | 113 |
| marketing automation                                   | ma ; sms                       | dashboard, campaigns, channels, components, gdpr_consent, lead_compan… | —                                             | 147 |
| myshopify                                              | myshopify                      | my_shopify, my_shopify_categories, my_shopify_customers, my_shopify_d… | myshopify_categories myshopify_customers mys… | 136 |
| perfex crm addon for teleman telemarketing application | —                              | —                                                                      | —                                             | 2   |
| perfex zillapage                                       | spyc ; zillapage               | admin_blocks, admin_templates, form_leads, landing_pages, setting, te… | landing_page_blocks landing_page_form_data l… | 169 |
| perfexlanding landingpage builder                      | spyc ; zillapage               | admin_blocks, admin_templates, form_leads, landing_pages, setting, te… | landing_page_blocks landing_page_form_data l… | 173 |
| woocommerce                                            | HttpClient ; woocommerce       | customers, date_created, Default Store, orders, products, stores, Woo… | —                                             | 73  |
| wordfex                                                | wordfex                        | —                                                                      | —                                             | 3   |
| Workshop Management                                    | permissions ; prefixs ; reset… | ERROR:, FATAL:, No Inspections Found, SAFE MODE: ACTIVE, Workshop Doc… | wshop_activity wshop_appointment_products ws… | 214 |

## 18. Relatórios, BI e visual

| Addon                                    | Módulo                         | Menus                                                                  | Tabelas                                       | PHP   |
| ---------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | ----- |
| diagramy a complete diagram editor       | diagramy                       | diagramy, diagramy_groups                                              | diagramy diagramy_groups                      | 112   |
| google sheets                            | Calendar ; DataTransfer ; Dri… | google_workspace, google_workspace_google_docs, google_workspace_goog… | google_workspaces                             | 4950  |
| google sheets                            | AndroidEnterprise ; Calendar … | google_drive, google_drive_google_docs, google_drive_google_sheets, g… | google_drives                                 | 28760 |
| mindmap                                  | Comment ; CSSList ; mindmap ;… | mindmap, mindmap_groups                                                | mindmap mindmap_groups mindmapcomments        | 255   |
| okrs objectives and key results          | checkin ; okr                  | company, department, okr, okr_checkin, okr_dashboard, okr_report, okr… | okr_approval_details okr_approval_setting ok… | 66    |
| perfexdashboard dashboard builder        | perfex_dashboard               | all_dashboards, all_widgets, my_dashboard, perfex_dashboard, settings… | —                                             | 120   |
| report builder                           | report_builder                 | rb_report_management, rb_report_share, report_builder_name, report_te… | rb_aggregation_functions rb_categories rb_co… | 86    |
| reportplus effortles automated reporting | reportplus                     | reportplus, reportplus_reports, settings                               | reportplus_generated_reports                  | 86    |
| spreadsheet online                       | spreadsheet_online             | SPREADSHEET_ONLINE                                                     | spreadsheet_online_hash_share spreadsheet_on… | 52    |
| whiteboard                               | whiteboard                     | whiteboard, whiteboard_groups                                          | whiteboard whiteboard_groups whiteboardcomme… | 48    |

## 19. RH e equipe

| Addon                               | Módulo                         | Menus                                                                  | Tabelas                                       | PHP |
| ----------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | --- |
| hr payroll                          | hr_payroll ; XLSXReader        | hr_bonus_kpi, hr_manage_attendance, hr_manage_employees, hr_pay_slip_… | currency_rate_logs currency_rates hr_payroll… | 349 |
| hr records                          | hr_profile ; job_manage ; pos… | hr_dashboard, hr_dependent_persons, hr_hr_contracts, hr_hr_profile, h… | bonus_discipline bonus_discipline_detail che… | 398 |
| HR Records                          | hr_profile ; job_manage ; pos… | hr_dashboard, hr_dependent_persons, hr_hr_contracts, hr_hr_profile, h… | bonus_discipline bonus_discipline_detail che… | 406 |
| human resources management hr       | hrm ; insurance                | dashboard, hrm, insurrance, payroll, setting, staff, staff_contract, … | allowance_type day_off hrm_option hrm_timesh… | 36  |
| Perfex CRM HR Payroll               | hr_payroll ; XLSXReader        | hr_bonus_kpi, hr_manage_attendance, hr_manage_employees, hr_pay_slip_… | currency_rate_logs currency_rates hr_payroll… | 348 |
| recruitment management              | candidate_profile ; interview… | _recruitment_channel, campaign, candidate_profile, dashboard, intervi… | cd_care cd_family_infor cd_interview cd_lite… | 41  |
| staff approvals management          | approvify                      | approvify_categories, approvify_mod_name, approvify_my_requests, appr… | approvify_approval_categories approvify_requ… | 26  |
| staff outsourcing resources booking | resourcebooking                | booking, resource, resource_group, resourcebooking, statistical        | booking booking_follower resource resource_g… | 48  |

## 20. Aplicativos (mobile/desktop)

| Addon                                              | Módulo                | Menus                 | Tabelas  | PHP |
| -------------------------------------------------- | --------------------- | --------------------- | -------- | --- |
| client app                                         | api                   | Api                   | api      | 29  |
| flutex perfex admin staff mobile app               | flutex_admin_api      | flutex_admin_settings | —        | 115 |
| flutex perfex customer mobile app                  | —                     | —                     | —        | 1   |
| glofex adminemployee mobile app                    | mobile_app_api        | Mobile app API        | —        | 27  |
| mns perfex crm application for macos windows linux | —                     | —                     | —        | 0   |
| perfex android app lead management app             | perfex_mobile_app_api | —                     | api_logs | 9   |
| weboox convert perfex crm to app android           | —                     | —                     | —        | 0   |
| weboox convert perfex crm to app windows           | —                     | —                     | —        | 0   |

## 21. SaaS / multi-tenant

| Addon                              | Módulo                         | Menus                                                                  | Tabelas                                       | PHP |
| ---------------------------------- | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | --- |
| perfect saas powerful multitenancy | blogs ; creatives ; discovers… | <span class="text-danger">, <span class="tw-font-bold">, affiliate, b… | filter_defaults filters tbl_saas_api_token t… | 413 |
| perfex crm saas module             | controllers ; PHPSQLParser ; … | Admin Admin, confirm_text, submit                                      | —                                             | 857 |
| perfex crm saas module             | api ; Comparator ; finder ; p… | Auto removal of inactive CRM instance, Custom domain approved, Custom… | —                                             | 742 |
| saas                               | config ; saas ; tenants_stats  | —                                                                      | access client_plan cron_data keys limits log… | 217 |
| saas                               | config ; saas ; tenants_stats  | —                                                                      | access client_plan cron_data keys limits log… | 220 |
| SaaS Module                        | config ; saas ; tenants_stats  | —                                                                      | access client_plan cron_data keys limits log… | 213 |
| turnCRM perfex crm saas module     | perfex_saas ; PHPSQLParser     | Deployed CRM instance, Deployed CRM instance for admin, perfex_saas_i… | —                                             | 424 |
| turncrm perfex crm to saas         | controllers ; PHPSQLParser ; … | Admin Admin, confirm_text, saas_main_menu, submit                      | —                                             | 831 |

## 22. Atendimento e suporte

| Addon                         | Módulo                         | Menus                                                                  | Tabelas         | PHP  |
| ----------------------------- | ------------------------------ | ---------------------------------------------------------------------- | --------------- | ---- |
| allinone support              | support_contact                | support_contact                                                        | —               | 6    |
| call log                      | call_log 1.2.1_x ; Credential… | call_log_direction, call_logs, cl_type, goal, goals                    | call_logs goals | 2070 |
| perfex crm customer feedback  | feedback                       | feedback, feedback_received, send_request                              | feedback        | 11   |
| perfexwiki internal knowledge | wiki                           | permission_view_own, posted_by_me, wiki_articles, wiki_book, wiki_boo… | —               | 25   |

## 23. Instalação / pacote

| Addon                                | Módulo                         | Menus                                                                  | Tabelas                                       | PHP  |
| ------------------------------------ | ------------------------------ | ---------------------------------------------------------------------- | --------------------------------------------- | ---- |
| marketing business modules bundle    | config ; mmb ; settings        | api_settings, broadcast_messages, custom_pdf, customer_rest_api, cust… | access keys limits logs webhooks_debug_log w… | 185  |
| perfex                               | backup ; Cache ; Calculation … | Arial, blockquote, code, csv_export, Database, del, einvoice_module_b… | emaillists goals listemails maillistscustomf… | 9664 |
| Perfex                               | backup ; Cache ; Calculation … | Arial, blockquote, code, csv_export, Database, del, einvoice_module_b… | emaillists goals listemails maillistscustomf… | 9735 |
| perfex addons                        | candidate_profile ; codecanyo… | _recruitment_channel, campaign, candidate_profile, contracts, custome… | _perfex_email_builder cd_care cd_family_info… | 697  |
| perfex business tools modules bundle | accountplanning ; assets ; cu… | allocation, accountplanning, assets, booking, Custom Email/SMS, dashb… | accountplanning accountplanning_current_serv… | 1273 |
| Universal _ules Bundle               | Config                         | Affiliate, Aitools, Asset, Biolinks, Biometric, CyberSecurity, EInvoi… | —                                             | 4407 |

## 24. Como usar isto

Para o plano C (índice + especificação dos P0), o próximo passo é escolher **um** addon por lacuna P0 e ler
o código dele como referência de comportamento — não como código a copiar. Os candidatos naturais:
`accounting-and-bookkeeping` (notas de crédito e créditos aplicados), `Deals Management` (proposta/pipeline),
`subscription-as-products` (recorrência) e `Inventory Management` (catálogo + estoque).
