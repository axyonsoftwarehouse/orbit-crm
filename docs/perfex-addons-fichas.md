# Fichas dos addons do Perfex — nível 2

> Gerado a partir das árvores extraídas do catálogo. **162 produtos distintos** (de 261 pacotes),
> um por pasta de módulo com `install.php`. Complementa [`perfex-addons.md`](perfex-addons.md),
> que lista os pacotes; aqui cada produto tem menus, tabelas, controllers/rotas e models.

## O que esta ficha é — e o que não é

**É** o retrato estrutural do addon: o que ele registra no menu, que tabelas cria, quais controllers
expõem quais métodos e que seções de configuração adiciona. Serve para decidir se o addon cobre uma
lacuna e para saber onde ler depois.

**Não é** leitura de regra de negócio. "Controllers/rotas" mostra os nomes dos métodos, não o que eles
fazem; "tabelas" mostra o schema que o addon cria, não como os dados se relacionam. A análise funcional
de um produto continua sendo trabalho separado (como foi feito em [`perfex/`](perfex/00-visao-geral.md)).

Nem todo pacote do catálogo tem ficha: 29 não têm módulo instalável (temas, apps móveis, gateways sem
`install.php` e 4 pacotes que falharam na extração). Versões repetidas e cópias `_nulled` foram
consolidadas na mesma ficha; a coluna **Pacotes** mostra quantas havia.

O grupo **Instalação / pacote** reúne os módulos que vinham dentro de bundles e da instalação completa
(`backup`, `goals`, `surveys`, `einvoice`...), não addons comprados à parte.

**Como usar:** procure pelo menu (`chart_of_accounts`, `whatsapp`) ou pela tabela (`acc_*`, `loy_*`)
para descobrir qual produto cobre o assunto; os controllers indicam onde ler o comportamento.

## Resumo por categoria

| Categoria                    | Produtos | Com rotas | Com tabelas |
| ---------------------------- | -------- | --------- | ----------- |
| Plataforma e operação        | 22       | 21        | 12          |
| Comunicação                  | 14       | 12        | 9           |
| Vendas e CRM                 | 18       | 16        | 15          |
| Projetos, tarefas e horas    | 13       | 13        | 12          |
| Operação e verticais         | 12       | 12        | 11          |
| Pagamentos                   | 7        | 7         | 0           |
| Documentos e utilitários     | 7        | 7         | 6           |
| IA e automação               | 7        | 5         | 6           |
| Tema / aparência             | 9        | 3         | 1           |
| Financeiro e contábil        | 7        | 7         | 3           |
| Marketing e captação         | 7        | 7         | 5           |
| Relatórios, BI e visual      | 9        | 9         | 8           |
| RH e equipe                  | 4        | 4         | 4           |
| Aplicativos (mobile/desktop) | 3        | 2         | 1           |
| SaaS / multi-tenant          | 2        | 2         | 1           |
| Atendimento e suporte        | 4        | 4         | 2           |
| Instalação / pacote          | 17       | 16        | 13          |

Total: **162 produtos**.

## 3. Plataforma e operação

### addon statuses

slug: `si_custom_status` · 1 pacote(s) · 3 PHP · 34 KB · 4 hook(s)

- **Menus:** si_custom_status_project_statuses_menu | si_custom_status_setup_menu | si_custom_status_task_statuses_menu
- **Tabelas:** si_custom_status si_custom_status_default
- **Controllers/rotas:** Si_custom_status: statuses, status, delete_status, save_edit_default_status, change_default_status
- **Models:** Si_custom_status_model

### addon validation

slug: `si_validate` · 1 pacote(s) · 2 PHP · 26 KB · 7 hook(s)

- **Menus:** si_validate_settings
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

### aws s3 integration

slug: `aws_integration` · 1 pacote(s) · 3 PHP · 37148 KB · 26 hook(s)

- **Menus:** aws_integration
- **Tabelas:** s3_files
- **Controllers/rotas:** Aws_integration: setup_hooks
- **Models:** —

### custom data tables

slug: `customtables` · 1 pacote(s) · 2 PHP · 731 KB · 4 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Customtables: store, reset, table, get, save, reset || Env_ver: activate, upgrade_database
- **Models:** Customtables_model

### custom javascript module for perfex

slug: `inject_javascript` · 1 pacote(s) · 2 PHP · 12 KB · 4 hook(s)

- **Menus:** inject_javascript
- **Tabelas:** —
- **Controllers/rotas:** Inject_javascript: reset, save, enable, disable
- **Models:** —

### elite custom js and css

slug: `elite_custom_js_css` · 1 pacote(s) · 2 PHP · 305 KB · 10 hook(s)

- **Menus:** elite_custom_css | elite_custom_js | elite_custom_js_css
- **Tabelas:** —
- **Controllers/rotas:** EliteCustomJsCss: form, save, delete, status, name
- **Models:** Elite_custom_js_css_model

### flexible backup and restore module for perfex

slug: `flexibackup` · 2 pacote(s) · 2 PHP · 83006 KB · 6 hook(s)

- **Menus:** —
- **Tabelas:** flexibackup
- **Controllers/rotas:** Flexibackup: ajax, settings, schedule_backup, backup_now, download_backup, delete_backup, upload_to_remote, restore_backup, onedrive
- **Models:** Flexibackup_model

### importsync csv mapping

slug: `importsync` · 1 pacote(s) · 2 PHP · 66 KB · 6 hook(s)

- **Menus:** importsync | importsync_import_staff | importsync_manage_mappings | importsync_sync_csv
- **Tabelas:** importsync_csv_mapped
- **Controllers/rotas:** Importsync: manage_mappings, csv_mappings, get_csv_columns, map_csv, delete_mapping, import_staff || Lecverify: activate
- **Models:** Importsync_model

### logtracker the powerful log tracking

slug: `logtracker` · 1 pacote(s) · 2 PHP · 684 KB · 5 hook(s)

- **Menus:** logtracker
- **Tabelas:** —
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Logtracker: view, get_table_data, create, download, delete, delete, send
- **Models:** —

### multichannel two factor authentication

slug: `mfa` · 1 pacote(s) · 2 PHP · 748 KB · 5 hook(s)

- **Menus:** mfa | mfa_management | mfa_report | mfa_setting
- **Tabelas:** mfa_history_login mfa_options mfa_security_code mfa_send_code_logs
- **Controllers/rotas:** Mfa: settings, mfa_setting, mfa_management, mfa_manage, create_secret_key, delete_history, mfa_reports, history_login_table_rp, history_send_code_table_rp, login_per_month_rp, send_test_message, create_qr_code, list_users_of_role || Mfa_auth: multi_factor_authentication, mfa_check_auth
- **Models:** Mfa_model

### perfex graphql api query all crms data including custom modules

slug: `graphql` · 1 pacote(s) · 2 PHP · 3011 KB · 2 hook(s)

- **Menus:** graphql | graphql_token | graphqlapi_guide
- **Tabelas:** —
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Graphqlusermanagement: regenerate_token
- **Models:** Graphql_model

### perfex mod automation manager

slug: `automation_manager` · 2 pacote(s) · 3 PHP · 71 KB · 6 hook(s)

- **Menus:** automation
- **Tabelas:** automation_actions automation_triggers automations
- **Controllers/rotas:** Automation_manager: table, create, store, edit, update, delete, activate, deactivate
- **Models:** Automation_model

### perfex mod custom links

slug: `custom_links` · 2 pacote(s) · 4 PHP · 237 KB · 3 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Custom_link: iframe || Custom_links: link, delete, iframe, filter_staff
- **Models:** Custom_links_model

### perfex mod language translations

slug: `translations` · 2 pacote(s) · 4 PHP · 125 KB · 3 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Translations: save_one, undo_one, publish_file, add, pull_from_files, attempt_change_permissions
- **Models:** Translations_model

### perfshield the powerful security toolset

slug: `perfshield` · 1 pacote(s) · 2 PHP · 705 KB · 14 hook(s)

- **Menus:** —
- **Tabelas:** blacklist perfshield_logs
- **Controllers/rotas:** Admin_security: reset_session || Client_security: reset_session || Env_ver: activate, upgrade_database || Perfshield: brute, get_table_data, add, get, remove, update, is, add, remove, save, clear
- **Models:** Perfshield_model

### polyutilities

slug: `poly_utilities` · 1 pacote(s) · 2 PHP · 2038 KB · 18 hook(s)

- **Menus:** poly_utilities_banners | poly_utilities_custom_menu_extend | poly_utilities_name | poly_utilities_projects | poly_utilities_scripts_extend | poly_utilities_settings | poly_utilities_shortcut_menu_ext…
- **Tabelas:** —
- **Controllers/rotas:** Article: details || Media: announcements || Poly_utilities: scripts, scripts_add, styles, styles_add, quick_access, ajax_default_settings, custom_menu, ajax_reinit_configs, ajax_sidebar_menu_items, ajax_custom_sidebar_menu_items, ajax_setup_menu_items, ajax_custom_setup_menu_items, ajax_client_menu_items, update_custom_clients_menu, ajax_custom_clients_menu_items, ajax_roles, …
- **Models:** Project_name_patterns_model

### reminder

slug: `reminder` · 2 pacote(s) · 3 PHP · 424 KB · 9 hook(s)

- **Menus:** reminder
- **Tabelas:** reminder_service_value reminder_services tblreminder_activity
- **Controllers/rotas:** Reminder: list_reminder, get_contact_data_values, services, getreminderadd, reminder_new, reminder_new_service, reminder_service_delete, table, get_reminder_data_ajax, delete_reminder_activity, delete, complete_reminder, reopen_reminder, add_reminder_comment, get_reminder_activity, reset_filters_session, get_related_doc, getreminder, add_note, get_notes
- **Models:** Reminder_model

### REST API Module for Perfex CRM

slug: `api` · 6 pacote(s) · 4 PHP · 14200 KB · 7 hook(s)

- **Menus:** api | api_guide | api_management | api_reporting | api_sandbox | api_settings | api_webhooks | automation_connectors | user_statistics
- **Tabelas:** api_limit api_security_log api_usage_logs api_webhook_logs api_webhooks user_api user_api_permissions user_api_quotas
- **Controllers/rotas:** Api: _remap, api_management, user_stats, api_guide, user, update_user_quotas, create_user, edit_user, delete_user, get_user_stats_data, clean_logs, settings, save_settings, webhooks, webhook, delete_webhook, test_webhook, webhook_logs, generate_postman_collection, generate_postman, generate_connector_manifest, automation_connectors, connectors, connectors_blocked || API_Contro…
- **Models:** Api_metrics_model Api_model Authentication_model Calendar_model Client_groups_model Client_vault_entries_model Clients_model Contract_types_model Contracts_mod…

### rest api for perfex customers

slug: `customers_api` · 2 pacote(s) · 2 PHP · 893 KB · 8 hook(s)

- **Menus:** api_settings | customers_api
- **Tabelas:** —
- **Controllers/rotas:** Env_ver: activate, upgrade_database || RestController: __destruct, _remap, response, set_response, get, options, head, post, put, delete, patch, query, validation_errors
- **Models:** Customers_api_model

### team password

slug: `team_password` · 1 pacote(s) · 2 PHP · 6069 KB · 14 hook(s)

- **Menus:** category_management | setting_tp | statistical | team_password | tp_dashboard
- **Tabelas:** permission team_password_category tp_bank_account tp_credit_card tp_email tp_logs tp_normal tp_server tp_share tp_software_license
- **Controllers/rotas:** Team_password: category_management, category_management_table, delete_category_management, team_password_mgt, add_normal, normal_table, delete_normal, view_normal, add_permission, permission_table, permission_table_by_cate, delete_permision_by_cate, delete_permision, add_share, share_table, share_table_by_cate, delete_share_by_cate, delete_share, bank_account_table, delete_ban…
- **Models:** Team_password_model

### webhooks

slug: `webhooks` · 3 pacote(s) · 2 PHP · 689 KB · 15 hook(s)

- **Menus:** webhook_log | webhooks
- **Tabelas:** webhooks_debug_log webhooks_master
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Webhooks: change_status_hook, change_debug_status_hook, delete_webhook, webhook, logs, clear_webhook_log, get_webhook_log_info
- **Models:** Webhooks_model

### workflow rules and automation module for perfex

slug: `flexiblewa` · 1 pacote(s) · 2 PHP · 102 KB · 4 hook(s)

- **Menus:** client | contract | estimate | expense | flexiblewa_days | flexiblewa_hours | flexiblewa_months | flexiblewa_weeks | invoice | lead | project | proposal | ticket
- **Tabelas:** flexibleworkflows
- **Controllers/rotas:** Flexiblewa: rule, delete_rule, ajax
- **Models:** Flexibleworkflow_model

## 4. Comunicação

### addon sms manager

slug: `si_sms` · 2 pacote(s) · 2 PHP · 133 KB · 24 hook(s)

- **Menus:** si_sms_custom_send_menu | si_sms_menu | si_sms_schedule_send_menu | si_sms_templates_menu
- **Tabelas:** si_sms_schedule si_sms_schedule_rel si_sms_templates
- **Controllers/rotas:** Si_sms: get_template, save_template, validate
- **Models:** Si_sms_model

### advanced email system

slug: `extended_email` · 2 pacote(s) · 2 PHP · 660 KB · 7 hook(s)

- **Menus:** extended_email | extended_email_form | extended_email_log_history
- **Tabelas:** extended_email_log_activity extended_email_settings
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Extended_email: save_staff_email_settings, get_email_settings, change_active_status, sent_smtp_test_email, email_log_activity, extended_email_log_history, extended_email_log_history_table, extended_email_clear_log
- **Models:** Extended_email_model

### custom sms email notifications for pefex

slug: `custom_email_and_sms_notifications` · 1 pacote(s) · 2 PHP · 677 KB · 12 hook(s)

- **Menus:** templates
- **Tabelas:** custom_templates
- **Controllers/rotas:** Email_sms: email_or_sms, send, send, send, twilio, msg91, clickatell || Env_ver: activate, upgrade_database || Template: save, delete, get_item_by_id, get_template_data
- **Models:** Custom_email_and_sms_notifications_model

### google workspace module perfex

slug: `google_drive` · 2 pacote(s) · 2 PHP · 82674 KB · 2 hook(s)

- **Menus:** google_drive | google_drive_google_docs | google_drive_google_sheets | google_drive_settings
- **Tabelas:** google_drives
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Google_drive: _create_client, _set_service, docs, sheets, save, view, delete, update_doc, update_sheet, integrate, redirects, settings, fetch_doc, fetch_sheet, reset_settings, save_settings
- **Models:** Google_drive_model

### mailchimp

slug: `mailchimp` · 1 pacote(s) · 3 PHP · 15673 KB · 11 hook(s)

- **Menus:** Mailchimp | menu_contacts
- **Tabelas:** mailchimp_activity_logs
- **Controllers/rotas:** Mailchimp: save_configuration, audience, add_audience, delete_audience, get_audience_data, audience_link_to_mailchimp, make_default_audience, audience_merge_field, audience_sync, all_member_sync_mc_to_jm, all_member_sync_jm_to_mc, get_contact_audience_selected_options, get_subscribed_checkbox_by_select_option, member_subscribe_unsubscribe, stores, add_stores, get_store_data, s…
- **Models:** Mailchimp_audience_model Mailchimp_store_model

### mailflow customers leads newsletter

slug: `mailflow` · 2 pacote(s) · 2 PHP · 63 KB · 2 hook(s)

- **Menus:** mailflow | mailflow_newsletter | mailflow_newsletter_history | mailflow_templates | mailflow_unsub_emails
- **Tabelas:** mailflow_email_templates mailflow_newsletter_history mailflow_unsubscribed_emails
- **Controllers/rotas:** Mailflow: manage, history, view_newsletter, send, total, get, manage_templates, create_template, delete_template, manage_unsubscribed_emails, remove_unsubscribed || Mailflowunsubscribe: opt_out
- **Models:** Mailflow_model

### mention and tag

slug: `mention` · 1 pacote(s) · 2 PHP · 163 KB · 7 hook(s)

- **Menus:** mention
- **Tabelas:** mention_post_comments mention_posts
- **Controllers/rotas:** Mention: get_staff_mentions, get_object_mentions, add_post, load_mention, get_post_data, load_mention_ajax, add_comment, init_post_comments, comment_single, remove_post_comment, delete_post || Mention_client: load_mention, init_post_comments, comment_single, remove_post_comment, get_staff_mentions, get_object_mentions, add_comment, load_mention_ajax, add_post, delete_post
- **Models:** Mention_model

### perfex crm employee chat

slug: `prchat` · 2 pacote(s) · 3 PHP · 6292 KB · 1 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Prchat_ClientsController: pusher, init, get, get, get, upload, update, load, search, trigger_ticket_event, handle || Prchat_Controller: initiate, initiate, users, get, get, get, get, get, get, get, update, pusher_auth, upload, group, reset, colorchange, delete, delete, delete, switch, chat_full_view, get, get, staff_announcement, clients_announcement_message, clients_announcem…
- **Models:** Prchat_model

### perfex crm video chat addon from livesmart

slug: `livesmart` · 1 pacote(s) · 2 PHP · 223 KB · 7 hook(s)

- **Menus:** als_livesmsart_dashboard
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

### pushover instant support notifications

slug: `pushover` · 1 pacote(s) · 2 PHP · 38 KB · 9 hook(s)

- **Menus:** settings_group_pushover
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

### slack alert

slug: `slack_alert` · 1 pacote(s) · 3 PHP · 25 KB · 4 hook(s)

- **Menus:** slack_alert_manage
- **Tabelas:** slack_alert
- **Controllers/rotas:** Slack_alert: manage
- **Models:** Slack

### whatsapp cloud api business integration

slug: `whatsapp_api` · 6 pacote(s) · 2 PHP · 1551 KB · 11 hook(s)

- **Menus:** —
- **Tabelas:** whatsapp_api_debug_log whatsapp_templates whatsapp_templates_mapping
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Template_mapping: template_mapping_table, add, get_template_map, save, delete, change_status_hook, change_debug_status_hook || Whatsapp_api: datatable, get_business_information, broadcast_messages, get_template_data, update || Whatsapp_api_webhook: account_review_update, account_update, business_capability_update, message_template_status_…
- **Models:** Whatsapp_api_model

### whatsapp cloud api interaction

slug: `whatsapp` · 3 pacote(s) · 4 PHP · 23368 KB · 11 hook(s)

- **Menus:** activity_log | bots | bulk_contacts | bulk_groups | campaigns | chat | documentation | log_activity | quick_replies | template | templates | whatsapp_bot | whatsapp_connection | whatsapp_contacts | w…
- **Tabelas:** —
- **Controllers/rotas:** Bots: table, botflow, form, save, update, change_active_status, delete_bot_files, delete, duplicate || BulkContacts: create, edit, store, update, delete, import, bulk_delete, bulk_assign_groups || Campaigns: campaign, save, get_table_data, delete, view, pause_resume_campaign, delete_campaign_files, get_template_map, get_filtered_leads || Env_ver: activate, upgrade_database || …
- **Models:** Botflow_model Bots_model Campaigns_model Contact_model Group_model QuickReply_model Whatsapp_interaction_model

### whatsapp

slug: `whatsapp_chat` · 1 pacote(s) · 2 PHP · 19 KB · 6 hook(s)

- **Menus:** whatsapp_chat
- **Tabelas:** —
- **Controllers/rotas:** Whatsapp_chat: reset, save, enable, disable
- **Models:** —

## 5. Vendas e CRM

### account planning

slug: `account_planning` · 1 pacote(s) · 2 PHP · 7178 KB · 9 hook(s)

- **Menus:** als_account_planning
- **Tabelas:** account_planning account_planning_current_service account_planning_financial account_planning_items account_planning_marketing_activities account_planning_objective account_planning_service_ability_offering account_plan…
- **Controllers/rotas:** Account_planning: table, new_account, add, delete, update_due_diligence, update_team_information, update_service_ability_offering, update_planning, view, client_change_data, objective, item, task, delete_objective, delete_item, delete_task, copy, delete_attachment, file, download_file
- **Models:** Account_planning_model

### advanced lead filters

slug: `si_lead_filters` · 1 pacote(s) · 2 PHP · 39 KB · 2 hook(s)

- **Menus:** si_lead_filters_menu | si_lf_submenu_filter_templates | si_lf_submenu_lead_filters
- **Tabelas:** si_lead_filter
- **Controllers/rotas:** Si_lead_filters: leads_filter
- **Models:** Si_lead_filter_model

### Affiliate Management Perfex CRM

slug: `affiliate` · 2 pacote(s) · 2 PHP · 3503 KB · 15 hook(s)

- **Menus:** affiliate | affiliate_logs | affiliate_orders | affiliate_program | als_dashboard | als_reports | members | settings | wallet
- **Tabelas:** affiliate_admin_permissions affiliate_admins affiliate_logs affiliate_order_item_taxs affiliate_order_items affiliate_orders affiliate_program_categorys affiliate_programs affiliate_setting_woo_store affiliate_transacti…
- **Controllers/rotas:** Affiliate: affiliate_orders, affiliate_logs, members, member, member_group, affiliate_member_table, registration_list_table, delete_member, affiliate_member_group_table, delete_member_group, affiliate_admin_table, add_affiliate_admin, delete_affiliate_admins, send_mail_members, affiliate_programs, affiliate_program, program_category, delete_program_category, program_category_t…
- **Models:** Affiliate_model Affiliate_store_model Authentication_affiliate_model Sync_woo_model

### affiliate

slug: `affiliate_management` · 2 pacote(s) · 3 PHP · 491 KB · 12 hook(s)

- **Menus:** affiliate_management_menu_title
- **Tabelas:** —
- **Controllers/rotas:** Affiliate_management: add_affiliate, update_affiliate_status, view_affiliate, assign_client_affiliate, referrals, remove_referral, commissions, payouts, update_payouts, groups, update_affiliate_group || Affiliate_management_client: register, join, signup, profile, update_affiliate_slug, payout, cancel_payout, invoice
- **Models:** Affiliate_management_model

### customer loyalty and memberships

slug: `loyalty` · 2 pacote(s) · 2 PHP · 537 KB · 21 hook(s)

- **Menus:** configuration | loyalty | loyalty_programs | membership | transation | user
- **Tabelas:** loy_card loy_mbs_program loy_mbs_rule loy_program_detail loy_program_discount_log loy_redeem_log loy_redemp_detail loy_rule loy_rule_detail loy_transation loy_voucher_inv_log
- **Controllers/rotas:** Loyalty: configruration, loyalty_setting, create_card, card_config, delete_card, loyalty_rule, create_loyalty_rule, loyalty_rule_form, table_loyalty_rule, delete_loyalty_rule, membership_rule, table_membership_rule, client_group_change, membership_rule_form, delete_membership_rule, delete_membership_program, membership_program, mbs_program, table_membership_program, membership…
- **Models:** Loyalty_model

### deals management

slug: `deals` · 2 pacote(s) · 4 PHP · 487 KB · 12 hook(s)

- **Menus:** acs_leads_sources_submenu | deals | deals_pipelines | deals_settings | deals_stages
- **Tabelas:** tbl_deal_activity_log tbl_deal_calls tbl_deals tbl_deals_comments tbl_deals_email tbl_deals_items tbl_deals_mettings tbl_deals_pipelines tbl_deals_source tbl_deals_stages
- **Controllers/rotas:** Deals: switch_kanban, kanban, deals_kanban_load_more, update_deal_satges, update_stage_order, add_deals_attachment, delete_attachment, deals, new_deal, sources, source_id, delete_source, pipelines, pipeline, delete_pipeline, stages, stage, save_settings, get, edit_comment, add_deals_comment, save_deals, update_customfield_po, send_promotions_email, delete_deals, save_sorting_s…
- **Models:** Datatabless Deals_model

### export customer details kyc compliance

slug: `si_export_customer` · 1 pacote(s) · 2 PHP · 98 KB · 5 hook(s)

- **Menus:** si_customer_services | si_expoert_customer_menu
- **Tabelas:** si_export_customer_kyc_files si_export_customer_services
- **Controllers/rotas:** Si_export_customer: export_customer_profile, export_customer_matrix, save_customer_files, get_customer_matrix, client_services_report
- **Models:** Si_export_customer_model

### Facebook Instagram Leads Perfex CRM

slug: `facebookleadsintegration` · 1 pacote(s) · 2 PHP · 1487 KB · 10 hook(s)

- **Menus:** facebookleadsintegration | fb_leads_field_mapping | fb_leads_settings | fb_leads_sync_history
- **Tabelas:** fb_leads_field_mappings fb_leads_logs fb_leads_pages fb_leads_retry_queue fb_leads_sync_history
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Facebookleadsintegration: wizard_test, debug, setup_wizard, sync_history, field_mapping, webhook, save_settings, test_connection, exchange_token, fetch_pages, update_page_settings, subscribe_page, unsubscribe_page, send_test_lead, save_field_mapping, process_retry_queue, get_stats, complete_setup
- **Models:** —

### facebook leads integration sync

slug: `facebook_leads_integration` · 1 pacote(s) · 2 PHP · 790 KB · 6 hook(s)

- **Menus:** facebook_leads_integration
- **Tabelas:** —
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Facebook_leads_integration: zapier, webhook, get, save, page, page, save, get, get_lead_data, dumy, update
- **Models:** —

### flexible lead scoring module for perfex

slug: `flexibleleadscore` · 2 pacote(s) · 2 PHP · 99 KB · 10 hook(s)

- **Menus:** —
- **Tabelas:** flexiblels_criteria flexiblels_lead_scores
- **Controllers/rotas:** Flexibleleadscore: reports, add_criteria, get_criteria, activate, delete_criteria, ajax
- **Models:** Flexibleleadscore_criteria_model Flexibleleadscore_leadscore_model Flexleads_model Flexwebtolead_model

### google lead finder

slug: `flexibleleadfinder` · 1 pacote(s) · 2 PHP · 72 KB · 2 hook(s)

- **Menus:** —
- **Tabelas:** flexibleleadfinder flexibleleadfindercontacts
- **Controllers/rotas:** Flexibleleadfinder: view, delete, delete_contact, sync_contact, sync_all, new_search, settings, delete_all_searches
- **Models:** Flexibleleadfinder_model Flexibleleadfindercontacts_model Flexibleleadfindercountry_model

### indiamart leads integration

slug: `si_indiamart_leads` · 1 pacote(s) · 2 PHP · 22 KB · 4 hook(s)

- **Menus:** si_indiamart_leads_settings
- **Tabelas:** si_iml_activity_log
- **Controllers/rotas:** —
- **Models:** Si_indiamart_leads_model

### lead follow up scheduler

slug: `si_lead_followup` · 2 pacote(s) · 2 PHP · 53 KB · 4 hook(s)

- **Menus:** si_lead_followup_menu | si_lead_followup_schedule_send_submenu
- **Tabelas:** si_lead_followup_schedule si_lead_followup_schedule_rel
- **Controllers/rotas:** —
- **Models:** Si_lead_followup_model

### lead manager for perfex module

slug: `lead_manager` · 3 pacote(s) · 3 PHP · 11939 KB · 21 hook(s)

- **Menus:** lead_manager | lead_manager_dashboard | lead_manager_lead | lead_manager_lead_chats | lead_manager_lead_mailbox | lead_manager_whatsapp_menu | lead_manager_zoom_meetings
- **Tabelas:** emailtemplates lead_manager_conference lead_manager_conversation lead_manager_mailbox lead_manager_mailbox_attachments lead_manager_mailbox_settings lead_manager_meeting_remark lead_manager_whatsapp lead_manager_whatsap…
- **Controllers/rotas:** Api: user_token, delete_user_token || Call_control: handle, handle, handle, get_lead_id_by_number, record, get, get, hold, hold, wait, unhold, unhold, confrence, connfrence, add, busy, get_staff_by_twilio_number, get_lead_name_by_number, add, get, active_twilio_account, active_twilio_account_curl, delete, update, transfer, add || Code_envato: module_activation || Env_var_guzze…
- **Models:** Lead_manager_api_model Lead_manager_model

### multipage web to lead form

slug: `multi_page_wtl` · 1 pacote(s) · 4 PHP · 107 KB · 4 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Leads: save_form_data, form, forms, delete_form, sources, source, delete_source, statuses, status, delete_status, add_note, validate_unique_field || Multi_page_wtl: form, mpwtl_custom_css
- **Models:** —

### omni channel sales

slug: `omni_sales` · 2 pacote(s) · 2 PHP · 1652 KB · 9 hook(s)

- **Menus:** diary_sync | omni_sales | omni_sales_channel | order_list | portal | report | trade_discount
- **Tabelas:** cart cart_detailt omni_log_discount omni_log_sync_woo omni_master_channel_woocommere omni_trade_discount sales_channel sales_channel_detailt woocommere_store woocommere_store_detailt
- **Controllers/rotas:** Omni_sales: omni_sales_channel, add_omni_sales_channel, invoice_list, diary_sync, report, pos, change_active_channel, add_product_channel, add_product_management_table, get_list_product, add_product, delete_product, order_list, order_list_table, get_cart_data, view_order_detailt, add_woocommerce_store, add_channel_woocommerce, table_channel_woocommerce, detail_channel_wcm, del…
- **Models:** Omni_sales_model

### sales agent management

slug: `sales_agent` · 1 pacote(s) · 2 PHP · 2348 KB · 14 hook(s)

- **Menus:** sa_dashboard | sa_management | sa_orders | sa_programs | sa_settings | sales_agent
- **Tabelas:** currency_rate_logs currency_rates sa_approval_details sa_approval_setting sa_client_groups sa_clients sa_goods_delivery sa_goods_delivery_detail sa_goods_delivery_invoices_pr_orders sa_goods_receipt sa_goods_receipt_det…
- **Controllers/rotas:** Authentication_sales_agent: admin, login, register, forgot_password, reset_password, logout, recaptcha, layout, data, view, title, disable, disable, disable || Gtsverify: activate || Portal: layout, data, view, title, disable, disable, disable, profile, remove_profile_image, programs, program_table, program_detail, table_program_items, join_program, company, clients, client, c…
- **Models:** Authentication_sale_agent_model Sales_agent_model

### sales commission program

slug: `commission` · 1 pacote(s) · 2 PHP · 2055 KB · 11 hook(s)

- **Menus:** applicable_client | applicable_staff | commission | commission_policy | commission_receipt | settings | statistics
- **Tabelas:** applicable_staff commission commission_hierarchy commission_policy commission_receipt commission_receipt_detail commission_salesadmin_group list_widget
- **Controllers/rotas:** Commission: manage_commission, commission_policy, applicable_staff, new_commission_policy, update_commission_policy, delete_commission_policy, new_applicable_staff, delete_applicable_staff, commission_table, commission_chart, dashboard_commission_chart, applicable_staff_table, commission_policy_table, get_data_detail_commission_table, recalculate, client_groups_change, recalcu…
- **Models:** Commission_model

## 6. Projetos, tarefas e horas

### advanced task timesheet manager

slug: `si_timesheet` · 2 pacote(s) · 3 PHP · 112 KB · 4 hook(s)

- **Menus:** si_ts_main_menu | si_ts_timesheet_summary_menu | si_ts_timesheet_templates_menu | si_ts_timesheets_menu
- **Tabelas:** si_timesheet_filter
- **Controllers/rotas:** Si_timesheet: get_calendar_data, edit_timesheet, save_timesheet, view_timesheet, delete_timesheet, ajax_search_assign_task_to_timer, timesheet_summary
- **Models:** Si_timesheet_model

### advanced to do manager

slug: `si_todo` · 1 pacote(s) · 2 PHP · 51 KB · 3 hook(s)

- **Menus:** si_todo_category_menu | si_todo_list_menu | si_todo_main_menu | si_todo_settings_menu
- **Tabelas:** si_todos si_todos_category si_todos_settings
- **Controllers/rotas:** Si_todo: todo, get_by_id, change_todo_status, update_todo_items_order, delete_todo_item, category_list, category, get_category_by_id, update_todo_categories_order, delete_todo_category, settings
- **Models:** Si_todo_model

### custom task filters

slug: `si_task_filters` · 3 pacote(s) · 3 PHP · 83 KB · 2 hook(s)

- **Menus:** custom_reports | tasks_filter | tasks_filter_templates
- **Tabelas:** si_task_filter
- **Controllers/rotas:** Si_task_filters: tasks_report
- **Models:** Si_task_filter_model

### perfex mod advanced task manager

slug: `advanced_task_status_manager` · 1 pacote(s) · 2 PHP · 53 KB · 11 hook(s)

- **Menus:** —
- **Tabelas:** project_status_can_change project_statuses task_status_can_change task_status_dont_have_staff task_statuses
- **Controllers/rotas:** Advanced_task_status_manager: project, create_task, create_project, store_task, store_project, edit_task_status, edit_project_status, update_task, update_project, delete_task_status, delete_project_status
- **Models:** Project_status_model Task_status_model

### project roadmap advanced reporting

slug: `project_roadmap` · 1 pacote(s) · 2 PHP · 485 KB · 7 hook(s)

- **Menus:** project_roadmap
- **Tabelas:** list_widget
- **Controllers/rotas:** Project_roadmap: project_roadmap_table, view_project_roadmap, add_project_roadmap_filter_widget, remove_project_roadmap_filter_widget, project_roadmap_tasks
- **Models:** Project_roadmap_model

### project sprints management for perfex

slug: `flexagile` · 1 pacote(s) · 2 PHP · 77 KB · 7 hook(s)

- **Menus:** —
- **Tabelas:** flexagilesprints flexagiletasks
- **Controllers/rotas:** Flexagile: create_edit_sprint, view, start, complete, delete, settings, create_invoice, ajax
- **Models:** Flexagilesprint_model Flexagiletasks_model

### project task manage

slug: `task_manage` · 1 pacote(s) · 2 PHP · 263 KB · 8 hook(s)

- **Menus:** projects | task_manage_groups | task_manage_groups_pipeline
- **Tabelas:** task_manage_custom_fields_values task_manage_groups task_manage_milestones task_manage_tasks
- **Controllers/rotas:** Manage: lists, group_detail, group_save, group_change_status, group_delete, detail, list_tasks, save_task, task_detail, delete_task, milestone_detail, save_milestone, delete_milestone, add_checklist, save_task_group_order, check_project_page, project_task_diagrams, check_the_db || Task_projects: lists, diagram_detail, pipeline, pipeline_content, group_pipeline, group_pipeline_…
- **Models:** Task_manage_model

### project templates

slug: `project_templates` · 1 pacote(s) · 4 PHP · 226 KB · 3 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Project_templates: table, template, delete_project_template, copy, view, save_note, upload_file, change_file_visibility, remove_file, bulk_action_files, download_all_files, milestone, milestones, milestones_kanban, delete_milestone, milestones_kanban_load_more, update_milestones_order, change_milestone_color, update_task_milestone, file, update_file_data, create_project
- **Models:** Project_templates_model

### staff workload

slug: `resource_workload` · 1 pacote(s) · 2 PHP · 1948 KB · 5 hook(s)

- **Menus:** overview | resource_workload | settings
- **Tabelas:** standard_workload workload_dayoff
- **Controllers/rotas:** Resource_workload: get_data_workload, get_data_capacity, get_data_timeline, get_data_chart, task_date_change, workload_kanban, setting, add_update_dayoff, delete_dayoff, add_standard_workload, delete_standard_workload, update_setting, workload_chart, update_task_assigned, workload_kanban_load_more, insert_data
- **Models:** Resource_workload_model

### tasks bookmark

slug: `task_bookmarks` · 1 pacote(s) · 2 PHP · 70 KB · 8 hook(s)

- **Menus:** task_bookmarks
- **Tabelas:** list_widget task_bookmarks task_bookmarks_detail
- **Controllers/rotas:** Task_bookmarks: task_bookmarks_list_task_filter, task_bookmarks_list_task_add, view_task_bookmarks_list_task, task_bookmark, get_task_bookmarks, delete_task_bookmarks, view_task_bookmarks, add_task_bookmarks_widget, remove_task_bookmarks_widget, change_task_bookmarks, add_task_bookmarks, get_task_data, remove_task_bookmarks
- **Models:** Task_bookmarks_model

### tasks bookmark

slug: `taskbookmarks` · 1 pacote(s) · 2 PHP · 658 KB · 8 hook(s)

- **Menus:** taskbookmarks
- **Tabelas:** list_widget taskbookmarks taskbookmarks_detail
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Taskbookmarks: taskbookmarks_list_task_filter, taskbookmarks_list_task_add, view_taskbookmarks_list_task, taskbookmark, get_taskbookmarks, delete_taskbookmarks, view_taskbookmarks, add_taskbookmarks_widget, remove_taskbookmarks_widget, change_taskbookmarks, add_taskbookmarks, get_task_data, remove_taskbookmarks
- **Models:** Taskbookmarks_model

### task templates

slug: `task_templates` · 2 pacote(s) · 4 PHP · 1529 KB · 4 hook(s)

- **Menus:** —
- **Tabelas:** task_templates_que
- **Controllers/rotas:** Task_templates: task, get_template_by_id, table, delete_task_template, remove_task_attachment, download_files, copy, create_task
- **Models:** Task_templates_model

### timesheets and leave management

slug: `timesheets` · 1 pacote(s) · 2 PHP · 10249 KB · 14 hook(s)

- **Menus:** attendance | leave | reports | route_management | settings | shift_management | shift_type | shiftwork | timesheets_and_leave | workplace_mgt
- **Tabelas:** check_in_out day_off leave_of_the_year manage_leave shift_type timesheets_additional_timesheet timesheets_approval_details timesheets_approval_setting timesheets_day_off timesheets_go_bussiness_advance_payment timesheet…
- **Controllers/rotas:** Api_timesheets: login_post, logout_post, check_in_out_post, add_leave_application_post, staff_get, type_of_leave_custom_get, calculate_number_days_off_post, get_date_leave_post, get_history_check_in_out_post, get_timesheets_option_get, get_route_point_check_in_out_post, server_time_get || API_timesheets_Controller: __destruct, _remap, response, set_response, get, options, head…
- **Models:** Timesheets_model

## 7. Operação e verticais

### appointly perfex crm appointments

slug: `appointly` · 3 pacote(s) · 3 PHP · 6169 KB · 16 hook(s)

- **Menus:** appointly_company_schedule | appointly_module_name | appointly_staff_working_hours | appointment_analytics_and_reports_menu_label | appointment_appointments | appointment_history_label_menu_label | a…
- **Tabelas:** appointly_company_schedule appointly_service_staff appointly_services appointly_staff_working_hours
- **Controllers/rotas:** Appointments: get, create_page, update_page, view, update, table, fetch_contact_data, create, delete, approve, finished, mark_as_ongoing_appointment, cancel_appointment, mark_as_no_show, send_appointment_early_reminders, add, request, get, new, update_outlook_event, send_appointment_custom_email, edit_from_view, delete, save_blocked_days_ajax, get_available_hours, get_availabl…
- **Models:** Appointly_attendees_model Appointly_model Googlecalendar Reports_model Service_model

### catering management

slug: `catering_management_module` · 1 pacote(s) · 2 PHP · 611 KB · 6 hook(s)

- **Menus:** allergens | catering_management | cmm_event_types | cmm_events | dietary_types | item_categories | menu_items | menu_sections | menus | packages
- **Tabelas:** catering_allergens catering_dietary_types catering_event_menu catering_event_menu_history catering_event_menu_items catering_event_notes catering_event_staff catering_ingredients catering_menu_categories catering_menu_i…
- **Controllers/rotas:** Allergens: table, add, update, delete, toggle_active, get, update_order || Categories: table, category, delete_category, update_category_order || Dietary_types: table, add, update, delete, toggle_active, get, update_order || Events: table, events_kanban, update_order, view, event, delete_event, update_event_status, upload_attachment, delete_attachment, get_calendar_events, eve…
- **Models:** Catering_allergens_model Catering_dietary_types_model Catering_event_menu_model Catering_event_notes_model Catering_event_staff_model Catering_event_types_mode…

### fleet management

slug: `fleet` · 1 pacote(s) · 2 PHP · 2024 KB · 10 hook(s)

- **Menus:** benefit_and_penalty | bookings | dashboard | driver | event | fleet | fuel | garage | inspections | insurances | maintenance | parts | report | settings | transactions | vehicle | work_orders | work_…
- **Tabelas:** fleet_maintenances
- **Controllers/rotas:** Fleet: vehicles, settings, vehicle_groups_table, vehicle_group, delete_vehicle_group, get_data_vehicle_group, vehicle_types_table, vehicle_type, delete_vehicle_type, get_data_vehicle_type, delete_vehicle, vehicles_table, driver, delete_driver, drivers, drivers_table, driver_detail, vehicle, vehicle_detail, driver_document, add_driver_document_attachment, driver_documents_table…
- **Models:** Fleet_model

### flexacademy perfex learning management system

slug: `flexacademy` · 1 pacote(s) · 2 PHP · 2774 KB · 5 hook(s)

- **Menus:** —
- **Tabelas:** flexacademy_categories flexacademy_certificate_templates flexacademy_certificates flexacademy_courses flexacademy_enrollments flexacademy_instructors flexacademy_lesson_progress flexacademy_lessons flexacademy_orders fl…
- **Controllers/rotas:** Clientflexacademy: details, ajax, cart, my_courses, certificate, course_player || Flexacademy: delete_instructor, add_edit_instructor, course_info, add_edit_quiz_question, add_edit_quiz, delete_quiz, add_edit_lesson, add_edit_section, delete_section, delete_enrollment, delete_lesson, settings, courses, enrollments, enroll_student, staff_courses, staff_enrollments, staff_course…
- **Models:** Flexacademy_categories_model Flexacademy_certificates_model Flexacademy_courses_model Flexacademy_enrollments_model Flexacademy_instructors_model Flexacademy_l…

### flexstage event management and ticket booking module for perfex

slug: `flexstage` · 1 pacote(s) · 2 PHP · 8899 KB · 7 hook(s)

- **Menus:** flexstage
- **Tabelas:** flexcategories flexemaillists flexevents fleximages flexinvitationsemailsendcron flexinvitationsendlog flexlistemails flexsocialchannels flexspeakers flexticketorders flextickets flexticketsales flexvideos fmlcustomfiel…
- **Controllers/rotas:** Flexevent: tickets, success || Flexstage: event_details, send_invitation, add_event, categories, category, delete_category, delete_event, upload_image, remove_image, remove_ticket, remove_speaker, change_event_status, change_auto_sync_attendees, mail_lists, mail_list, mail_list_view, delete_mail_list, add_email_to_list, remove_email_from_mail_list, import_emails, date_check
- **Models:** Flexcalendarevent_model Flexcategory_model Flexemaillist_model Fleximage_model Flexsocialchannel_model Flexspeaker_model Flexstage_model Flexticket_model Flext…

### Logistics Management Perfex CRM

slug: `logistic` · 2 pacote(s) · 2 PHP · 3565 KB · 11 hook(s)

- **Menus:** lg_consolidated | lg_dashboard | lg_locker_packages | lg_pickup | lg_pre_alert_list | lg_recipient | lg_reports | lg_settings | lg_shipping | lg_users | logistic
- **Tabelas:** currency_rate_logs currency_rates lg_action_history lg_agency_group lg_cities lg_client_address lg_consolidated lg_consolidated_detail lg_consolidation_delivery_shipment lg_countries lg_logistics_services lg_office_grou…
- **Controllers/rotas:** Client: packages, package_detail, export_package_shipment, export_package_label, file_package, file_shipment_package, pre_alert_list, pre_alert, file_pre_alert, delete_pre_alert_attachment, delete_pre_alert, recipients, recipient, add_address_row, delete_recipient, get_state_by_country, get_city_by_state, shipping, shipment, get_currency_rate, get_client_address_option, get_cl…
- **Models:** Logistic_model

### manufacturing management

slug: `manufacturing` · 1 pacote(s) · 2 PHP · 2951 KB · 8 hook(s)

- **Menus:** manufacturing_name | mrp_bills_of_materials | mrp_dashboard | mrp_manufaturing_orders | mrp_product_variants | mrp_products | mrp_routings | mrp_settings | mrp_work_centers | mrp_work_orders
- **Tabelas:** mrp_bill_of_material_details mrp_bill_of_materials mrp_manufacturing_order_details mrp_manufacturing_orders mrp_option mrp_routing_details mrp_routings mrp_unit_measure_categories mrp_work_centers mrp_work_order_details…
- **Controllers/rotas:** Gtsverify: activate || Manufacturing: setting, work_center_manage, work_center_table, work_center_modal, add_edit_work_center, view_work_center, delete_work_center, working_hour_table, add_edit_working_hour, delete_working_hour, routing_manage, routing_table, routing_modal, add_routing_modal, delete_routing, operation_manage, operation_table, operation_modal, add_edit_operatio…
- **Models:** Manufacturing_model

### perfex shop ecommerce

slug: `products` · 1 pacote(s) · 2 PHP · 613 KB · 13 hook(s)

- **Menus:** add_new_order | order_history | order_report | products | products_categories | quantities_report
- **Tabelas:** order_items order_master product_categories product_master
- **Controllers/rotas:** Client: my_cart, filter, add_cart, remove_cart, get_currency, place_order || Products: add_product, edit, delete, order_history, order_report, custom_report, quantities_report, test || Products_categories: category, delete_category || Staff_order: get_product_data
- **Models:** Order_model Product_category_model Products_model Reports_model

### Property Tenants Perfex CRM

slug: `propertybase` · 1 pacote(s) · 2 PHP · 35100 KB · 24 hook(s)

- **Menus:** propertybase | propertybase_maintenance_requests | propertybase_modules | propertybase_properties | propertybase_qr_scanner | propertybase_reports | propertybase_themes | settings
- **Tabelas:** propertybase_amenities propertybase_amenities_types propertybase_area_types propertybase_categories propertybase_energy_efficiency_types propertybase_maintenance_request_files propertybase_ownership_types propertybase_p…
- **Controllers/rotas:** Landingpage: property, submit_lead || Lecverify: activate || Maintenance_requests: view, delete || Propertybase: manage, view, create, delete, property_status, save_property_status, delete_property_event, revocate_property, queue_uploaded_file, delete_image, update_images_order, bulk_property_agent_transfer, import_properties, add_note, upload_attachment, get_notes, client_cha…
- **Models:** Propertyamenities_model PropertyAmenitiesTypes_model PropertyAreaTypes_model PropertyAudits_model Propertybase_model Propertycategories_model PropertyEnergyEff…

### Service Management Perfex CRM

slug: `service_management` · 2 pacote(s) · 2 PHP · 494 KB · 8 hook(s)

- **Menus:** service_management
- **Tabelas:** service_api_tokens service_inventory_parts service_job_images service_job_logs service_job_parts service_jobs technician_activity technicians
- **Controllers/rotas:** Api: test, login, jobs, technician_jobs, start, complete, resend_otp || Service_management: job, view, start_job, complete_job, resend_otp_ajax, change_status, delete_job, technicians, technician, delete_technician, inventory, part, delete_part, reports, report_technicians_table, report_status_table, settings, generate_invoice, verify, do_verify
- **Models:** Service_management_model

### supplier management

slug: `supplier` · 1 pacote(s) · 2 PHP · 362 KB · 8 hook(s)

- **Menus:** suppliers
- **Tabelas:** —
- **Controllers/rotas:** Product_services: items_create, edit, delete || Supplier: table, all_contacts, client, export, check_duplicate_customer_name, save_longitude_and_latitude, form_contact, confirm_registration, update_file_share_visibility, delete_contact_profile_image, mark_as_active, consents, update_all_proposal_emails_linked_to_customer, assign_admins, delete_customer_admin, delete_contact, c…
- **Models:** Client_vault_entries_model Clients_model Items_model

### Warranty Management Perfex CRM

slug: `warranty_management` · 1 pacote(s) · 2 PHP · 1841 KB · 11 hook(s)

- **Menus:** mrp_settings | warranties_management_name | wm_terms_conditions | wm_warranty_claim_information | wm_warranty_informations
- **Tabelas:** wm_timeline_logs wm_warranty_claim_information_details wm_warranty_claim_informations wm_warranty_process_details wm_warranty_process_time_trackings wm_warranty_receipt_process wm_warranty_receipt_process_details
- **Controllers/rotas:** Gtsverify: activate || Warranty_management: setting, wm_check_box_setting, prefix_number, warranty_receipt_process_table, warranty_receipt_process_modal, add_warranty_receipt_process_modal, delete_warranty_receipt_process, process_manage, process_table, process_modal, add_edit_process, delete_process, wm_view_attachment_file, delete_process_attachment_file, warranty_informatio…
- **Models:** Warranty_management_model

## 8. Pagamentos

### bitpay payment gateway

slug: `bitpay_gateway` · 1 pacote(s) · 2 PHP · 2436 KB · 1 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Process: complete_purchase
- **Models:** —

### cashfree payment gateway

slug: `cashfree` · 1 pacote(s) · 3 PHP · 21 KB · 4 hook(s)

- **Menus:** cashfree_settings
- **Tabelas:** —
- **Controllers/rotas:** Cashfree: pay, success || Settings: validate
- **Models:** —

### gocardless payment gateway

slug: `gocardless_gateway` · 2 pacote(s) · 2 PHP · 2344 KB · 4 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Payments: gocardless || Process: complete_purchase
- **Models:** —

### perfex mercadopago

slug: `mercadopago_gateway` · 3 pacote(s) · 2 PHP · 244 KB · 1 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Process: complete_purchase
- **Models:** —

### stripe sepa direct debit payment gateway for perfex

slug: `stripe_sepa` · 1 pacote(s) · 2 PHP · 781 KB · 5 hook(s)

- **Menus:** stripe_sepa
- **Tabelas:** —
- **Controllers/rotas:** Env_ver: activate, upgrade_database
- **Models:** Stripe_sepa_invoices_model

### swiss qr bill

slug: `swissqrbill` · 1 pacote(s) · 2 PHP · 73940 KB · 7 hook(s)

- **Menus:** swissqrbill_settings_menu
- **Tabelas:** —
- **Controllers/rotas:** Client: view || Lecverify: activate || Swissqrbill: view, settings
- **Models:** —

### wallet

slug: `wallet` · 1 pacote(s) · 4 PHP · 251 KB · 9 hook(s)

- **Menus:** settings | wallet_dashboard_menu
- **Tabelas:** —
- **Controllers/rotas:** Wallet: transact, revalidate_funding, invoice || Wallet_admin: view_wallet, update_withdraw_request
- **Models:** —

## 9. Documentos e utilitários

### AssetCentral

slug: `assetcentral` · 2 pacote(s) · 2 PHP · 974 KB · 11 hook(s)

- **Menus:** assetcentral | assetcentral_appreciations_menu | assetcentral_audit_menu | assetcentral_depreciation_menu | assetcentral_menu | assetcentral_my_assets_menu | assetcentral_qr_scanner | assetcentral_re…
- **Tabelas:** assetcentral_asset_assigned assetcentral_asset_audits assetcentral_asset_categories assetcentral_asset_events assetcentral_asset_history assetcentral_asset_locations assetcentral_asset_maintenance assetcentral_asset_req…
- **Controllers/rotas:** Assetcentral: manage_assets, create_asset, delete_asset, view_asset, load_asset_single_audits, import_assets, upload_attachment, asset_status, save_asset_status, delete_asset_event, revocate_asset, manage_my_assets, manage_project_assets, manage_audits, create_audit, filter_audit_assets, delete_audit, view_audit, manage_requests, create_requests, delete_requests, manage_apprec…
- **Models:** Assetcentral_model

### Domain Manager for Perfex CRM

slug: `domain_manager` · 2 pacote(s) · 2 PHP · 110 KB · 4 hook(s)

- **Menus:** domain_manager | domain_manager_domain_list | domain_manager_hosting_list
- **Tabelas:** domain_manager hosting_details
- **Controllers/rotas:** Domain_manager: create, save_domain_manager, view, edit, update_domain_manager, delete, setting, domain_manager_table, hosting_list, hosting_create, save_hosting, edit_hosting, update_hosting, delete_hosting
- **Models:** Domain_manager_model Hosting_details_model

### file sharing

slug: `file_sharing` · 2 pacote(s) · 3 PHP · 6439 KB · 13 hook(s)

- **Menus:** download_management | file_management | file_sharing | reports | setting_file_sharing | sharing
- **Tabelas:** fs_downloads fs_file_overview fs_genenal_ip_share fs_setting_configuration fs_setting_configuration_relationship fs_sharing_relationship fs_sharings
- **Controllers/rotas:** File_sharing: switch_html, manage, file_sharing_media_connector, get, setting, change_staff_permissions, new_root_main, new_folder, add_new_share, add_new_config, delete_config, update_field, update_sharing_permission, update_setting, download_management, sharing, download_management_table, sharing_table, sharing_detail_table, reports, edit_sharing, delete_sharing, sharing_cha…
- **Models:** File_sharing_model

### meetlink manager

slug: `meetlink_manager` · 1 pacote(s) · 2 PHP · 81 KB · 6 hook(s)

- **Menus:** meeting_services | meetings | meetlink_manager
- **Tabelas:** meeting_invitations meeting_participants meeting_services meetings
- **Controllers/rotas:** Meetlink_manager: add, view, edit, delete, settings || Services: add, delete_services
- **Models:** Meeting_invitations_model Meeting_participants_model Meeting_services_model Meetings_model

### pdf customizer

slug: `custom_pdf` · 1 pacote(s) · 2 PHP · 788 KB · 3 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Custom_pdf: settings, store, remove_pdf_image, pdf || Env_ver: activate, upgrade_database
- **Models:** —

### Perfex CRM Document Management

slug: `document_management` · 2 pacote(s) · 2 PHP · 41791 KB · 13 hook(s)

- **Menus:** dmg_documents | dmg_file_management | dmg_settings
- **Tabelas:** dmg_approval_detail_eids dmg_approval_details dmg_approval_setting dmg_audit_logs dmg_custom_fields dmg_file_versions dmg_items dmg_remiders dmg_share_logs
- **Controllers/rotas:** Document_management: create_new_section, delete_section, upload_file, settings, edit_file, custom_field_table, add_custom_field, delete_custom_field, get_custom_field_data, get_custom_field, preview, download_folder, bulk_delete_item, bulk_download_item, get_folder_list, bulk_duplicate_item, bulk_move_item, editdocument2, editdocument, upload_version_file, delete_log, restore_…
- **Models:** Document_management_model

### perfex zoom meeting module

slug: `zoom_meetings` · 2 pacote(s) · 2 PHP · 1801 KB · 3 hook(s)

- **Menus:** zoom | zoom_add_registrant | zoom_api_settings | zoom_create_meeting | zoom_meeting_list
- **Tabelas:** zoom zoom_meetings
- **Controllers/rotas:** Client: meeting_list, api_meeting_submit || Zoom_meetings: authenticate, authorize, authorized, create_meeting, api_meeting, api_meeting_submit, add_registrant, submit_registrant
- **Models:** Zoom_model

## 10. IA e automação

### imabotmail accounting and bookkeeping

slug: `accounting` · 3 pacote(s) · 2 PHP · 5155 KB · 11 hook(s)

- **Menus:** accounting_report | als_accounting | chart_of_accounts | dashboard | journal_entry | reconcile | setting | transaction | transfer
- **Tabelas:** acc_account_history acc_account_type_details acc_accounts acc_banking_rule_details acc_banking_rules acc_expense_category_mappings acc_item_automatics acc_journal_entries acc_payment_mode_mappings acc_reconciles acc_tax…
- **Controllers/rotas:** Accounting: transaction, sales_table, sales_invoice_table, expenses_table, banking_table, chart_of_accounts, setting, update_general_setting, update_automatic_conversion, accounts_table, account, get_data_convert, convert, transfer, transfer_table, add_transfer, journal_entry, journal_entry_table, new_journal_entry, delete_journal_entry, report, rp_balance_sheet, rp_balance_sh…
- **Models:** Accounting_model

### LeadPilot

slug: `ai_lead_manager` · 2 pacote(s) · 2 PHP · 1236 KB · 17 hook(s)

- **Menus:** alm_call_logs
- **Tabelas:** alm_call_logs
- **Controllers/rotas:** Ai_lead_manager: get_bland_voices, get_vapi_voices, add_knowledgebase, delete_knowledgebase || Call_logs: table, call_log_relations, get_call_data || Env_ver: activate, upgrade_database || Webhooks: bland_ai, vapi_ai_inbound, vapi_ai_outbound
- **Models:** Call_logs_model

### Perfex AiWriter

slug: `aiwriter` · 8 pacote(s) · 2 PHP · 131 KB · 9 hook(s)

- **Menus:** AiWriter | aiwriter_setting | setting | usage_cases | writer
- **Tabelas:** aiwriter_usage_cases
- **Controllers/rotas:** Aiwriter: setting, case, add_case, delete_case, edit_case, reset_case, writer, save_setting, ajax || Client: ajax
- **Models:** Aiwriter_model

### perfex crm and telegrambot

slug: `upload` · 1 pacote(s) · 2 PHP · 10 KB · 0 hook(s)

- **Menus:** —
- **Tabelas:** telegram
- **Controllers/rotas:** —
- **Models:** Telegram_model

### perfex crm and telegrambot chat

slug: `telegram_chat` · 4 pacote(s) · 3 PHP · 6 KB · 1 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

### publishx ai powered cms

slug: `publishx` · 1 pacote(s) · 2 PHP · 1966 KB · 4 hook(s)

- **Menus:** publishx | publishx_categories | publishx_languages | publishx_posts | publishx_themes | settings
- **Tabelas:** publishx_categories publishx_languages publishx_posts
- **Controllers/rotas:** Blog: post || Publishx: posts, post, delete_post, remove_post_featured_image, categories, category, delete_category, languages, language, delete_language, settings, remove_blog_logo, remove_blog_favicon_logo, themes, activate_theme, post || Publishx_client: blog
- **Models:** Publishx_model

### WhatsBot

slug: `whatsbot` · 3 pacote(s) · 2 PHP · 28850 KB · 69 hook(s)

- **Menus:** initiate_chat
- **Tabelas:** wtc_activity_log wtc_ai_prompts wtc_bot wtc_bot_flow wtc_campaign_data wtc_campaigns wtc_canned_reply wtc_catalog_sync_logs wtc_custom_label wtc_custom_whatsbot_cron wtc_drip_enrollments wtc_drip_log wtc_drip_sequences …
- **Controllers/rotas:** Ai_prompts: get_table_data, save_prompt, delete, is_prompt_name_exists, get || Analytics: get_campaign_analytics_data || Bots: bot, table, save, delete, save, change_active_status, delete_bot_files, clone_bot, check_trigger_keyword || Bot_flow: flow, save, delete, store_file || Bulk_campaigns: get_template_map, upload, download_sample, send || Campaigns: campaign, save, get_ta…
- **Models:** Ai_prompts_model Analytics_model Bot_flow_model Bots_model Bulk_campaigns_model Campaigns_model Canned_reply_model Catalog_model Catalog_sync_model Custom_labe…

## 11. Tema / aparência

### dynamic customized theme

slug: `si_custom_theme` · 1 pacote(s) · 3 PHP · 156 KB · 9 hook(s)

- **Menus:** si_custom_staff_theme_menu
- **Tabelas:** si_custom_theme_client si_custom_theme_list si_custom_theme_staff
- **Controllers/rotas:** Client_theme: login, get_theme || Si_custom_theme: reset_theme, get_theme, get_copy_theme, save, delete, upload_bg, remove_bg_image, get_theme_name_data_ajax, save_custome_theme_name, validate || Staff_theme: get_theme
- **Models:** Si_custom_theme_model

### flat admin theme

slug: `flat_admin_theme` · 1 pacote(s) · 3 PHP · 496 KB · 0 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

### Perfex CRM

slug: `flatadmintheme` · 2 pacote(s) · 3 PHP · 1087 KB · 3 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Env_ver: activate, upgrade_database
- **Models:** —

### perfex crm admin light theme

slug: `admin_light_theme` · 1 pacote(s) · 3 PHP · 1239 KB · 0 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

### perfex crm dark theme

slug: `perfex_dark_theme` · 3 pacote(s) · 3 PHP · 1302 KB · 0 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

### perfex crm office theme

slug: `perfex_office_theme` · 1 pacote(s) · 3 PHP · 3479 KB · 2 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

### StyleFlow

slug: `styleflow` · 2 pacote(s) · 2 PHP · 1442 KB · 6 hook(s)

- **Menus:** styleflow
- **Tabelas:** —
- **Controllers/rotas:** Styleflow: manage_invoice_templates, activate_invoice_template
- **Models:** Styleflow_model

### ultimate dark theme perfex crm

slug: `ultimate_dark_theme` · 1 pacote(s) · 3 PHP · 185 KB · 0 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

### ultimate purple theme perfex crm

slug: `ultimate_purple_theme` · 2 pacote(s) · 3 PHP · 102 KB · 0 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

## 12. Financeiro e contábil

### delivery note

slug: `delivery_notes` · 1 pacote(s) · 2 PHP · 897 KB · 31 hook(s)

- **Menus:** customer_permission_delivery_notes
- **Tabelas:** —
- **Controllers/rotas:** Client: dn, view, sign_delivery || Delivery_notes: list_delivery_notes, table, delivery_note, update_number_settings, validate_delivery_note_number, delete_attachment, get_delivery_note_data_ajax, add_note, get_notes, mark_action_status, send_to_email, convert_to_invoice, convert_from_estimate, convert_from_purchase_order, convert_from_invoice, copy, delete, clear_acceptance_i…
- **Models:** Delivery_note_custom_fields_model Delivery_notes_model

### financial control professional expenses weboox

slug: `bills` · 1 pacote(s) · 2 PHP · 606 KB · 4 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** Bills: list_invoices, bills_income, recurring, table, client_change_data, update_number_settings, validate_invoice_number, add_note, get_notes, pause_overdue_reminders, resume_overdue_reminders, mark_as_cancelled, unmark_as_cancelled, copy, get_merge_data, get_bill_expense_data, debugger, invoice, get_invoice_data_ajax, apply_credits, get_invoices_total, record_invoice_payment…
- **Models:** Cron_model Dashboard_model Invoices_model Reports_model Statement_model

### invoice builder

slug: `invoices_builder` · 1 pacote(s) · 2 PHP · 4164 KB · 11 hook(s)

- **Menus:** ib_build_invoices | ib_templates | invoices_builder
- **Tabelas:** ib_customfield ib_customfield_value ib_invoices_built ib_templates
- **Controllers/rotas:** Gtsverify: activate || Invoices_builder: templates, template, table_templates, xinvoice, change_template_active, preview_template, add_field, build_invoices, table_invoices_built, build_invoice, get_additional_infor, delete_template, edit_converted_invoice, delete_built_invoice, filter_project_by_customer, filter_invoice, check_fomula, pdf_view, load_contact_email, send_invoic…
- **Models:** Invoices_builder_model

### purchase management

slug: `purchase` · 3 pacote(s) · 2 PHP · 8099 KB · 29 hook(s)

- **Menus:** contracts | invoices | items | purchase | purchase_order | purchase_request | quotations | reports | setting | vendor | vendor_item
- **Tabelas:** pur_approval_details pur_approval_setting pur_contacts pur_contracts pur_estimate_detail pur_estimates pur_invoice_payment pur_invoices pur_order_detail pur_order_payment pur_orders pur_request pur_request_detail pur_un…
- **Controllers/rotas:** Authentication_vendor: admin, login, register, forgot_password, reset_password, logout, contact_email_exists, recaptcha, layout, data, view, title, disable, disable, disable || Purchase: vendors, table_vendor, vendor, setting, assign_vendor_admins, delete_vendor, form_contact, vendor_contacts, contact_email_exists, delete_vendor_contact, all_contacts, purchase_request, pur_req…
- **Models:** Authentication_vendor_model Purchase_model

### purchase order

slug: `purchase_orders` · 1 pacote(s) · 2 PHP · 794 KB · 25 hook(s)

- **Menus:** customer_permission_purchase_orders
- **Tabelas:** —
- **Controllers/rotas:** Client: po, view || Purchase_orders: list_purchase_orders, table, purchase_order, update_number_settings, validate_purchase_order_number, delete_attachment, get_purchase_order_data_ajax, get_purchase_orders_total, add_note, get_notes, mark_action_status, send_to_email, convert_to_invoice, convert_from_estimate, copy, delete, clear_acceptance_info, pdf, get_pipeline, pipeline_o…
- **Models:** Purchase_order_custom_fields_model Purchase_orders_model

### quickbooks online

slug: `quickbooks` · 2 pacote(s) · 4 PHP · 12521 KB · 23 hook(s)

- **Menus:** quickbooks_short
- **Tabelas:** qb_agencies qb_chart_accounts qb_items qb_taxes
- **Controllers/rotas:** Quickbooks: synchallaccounts, synchallclients, get_qb_clients, synchallitems, get_qb_items, get_item_income_acc_select_field, synchallinvoices, get_qb_invoice, synchallpayments, get_qb_payments, synchallexpenses, reset_all_sync, test || Quickbooks_auth: disconnect || Tax_agency: get_agency_select_field, synchalltaxes, manage, delete, tax_agency_name_exists, get_qb_taxes
- **Models:** Quickbooks_model

### subscription as products

slug: `services` · 1 pacote(s) · 2 PHP · 161 KB · 9 hook(s)

- **Menus:** invoice_products | product_groups | product_menu_purchase_log | products | subscription_products
- **Tabelas:** —
- **Controllers/rotas:** Products: table, create, add, delete, modal, subscription, invoice, purchase_log, groups, settings || Services: subscribe, register, public, recaptcha, category, invoice, details
- **Models:** Invoice_products_model Subscription_products_model

## 13. Marketing e captação

### bannercraft dynamic banner management

slug: `banner` · 1 pacote(s) · 2 PHP · 714 KB · 3 hook(s)

- **Menus:** —
- **Tabelas:** banner
- **Controllers/rotas:** Banner: manage, add, get, change, delete, save || Env_ver: activate, upgrade_database
- **Models:** Banner_model

### Flexform

slug: `flexform` · 1 pacote(s) · 2 PHP · 1516 KB · 3 hook(s)

- **Menus:** flexform_forms | flexform_my_forms | leads | tickets
- **Tabelas:** flexformblockanswer flexformblocks flexformblockslogic flexformcompleted flexforms
- **Controllers/rotas:** Clientflexform: vf, pending, spa, sp_submit, submit, nav || Flexform: pending, staff, new_form, update_form, update_block, update_logic, publish, responses, duplicate, delete
- **Models:** Flexform_model Flexformblockanswer_model Flexformblocks_model Flexformblockslogic_model Flexformcompleted_model

### marketing automation

slug: `ma` · 2 pacote(s) · 3 PHP · 27738 KB · 8 hook(s)

- **Menus:** campaigns | channels | components | dashboard | marketing_automation | points | reports | segments | settings | stages
- **Tabelas:** —
- **Controllers/rotas:** Gtsverify: activate || Ma: dashboard, segments, settings, category_table, category, delete_category, get_data_category, stage_table, stage, delete_stage, get_data_stage, stages, segment_table, segment, delete_segment, components, form, save_form_data, form_table, asset, add_asset_attachment, download_file, delete_asset, asset_table, points, point_action, point_trigger, point_a…
- **Models:** Ma_model

### myshopify

slug: `myshopify` · 1 pacote(s) · 2 PHP · 330 KB · 1 hook(s)

- **Menus:** my_shopify | my_shopify_categories | my_shopify_customers | my_shopify_discounts | my_shopify_orders | my_shopify_products
- **Tabelas:** myshopify_categories myshopify_customers myshopify_discounts myshopify_orders myshopify_products
- **Controllers/rotas:** Myshopify: products, customers, discounts, orders, order_details, categories, import, import_customers, import_orders, import_categories, import_discounts, verify
- **Models:** Shopify_model

### perfexlanding landingpage builder

slug: `zillapage` · 2 pacote(s) · 3 PHP · 56247 KB · 3 hook(s)

- **Menus:** admin_blocks | admin_templates | form_leads | landing_pages | setting | templates
- **Tabelas:** landing_page_blocks landing_page_form_data landing_page_settings landing_page_templates landing_pages
- **Controllers/rotas:** Blocks: delete, block || Landingpages: setting, templates, save, builder, loadbuilder, updatebuilder, searchicon, uploadimage, deleteimage, deletelandingpage || Leads: delete, get_convert_data_landingpage_leads, get_convert_form_data_to_leads, convert_to_lead, convert_to_customer, get_note_form_data, note_to_lead || Publishlandingpage: getpagejson, formsubmission, thankyou, ge…
- **Models:** Landingpage_model

### woocommerce

slug: `woocommerce` · 2 pacote(s) · 2 PHP · 335 KB · 4 hook(s)

- **Menus:** customers | orders | products | stores
- **Tabelas:** —
- **Controllers/rotas:** Misc: modal || Stores: modal, new, edit, delete, refresh, reset || Woocommerce: table, order, get_order, orders, products, customers, get_customer, update_woo, check_duplicate_woocomerce_customer, add_cutomer, import_cust, test_connection, manual_check, reset, delete, get_product, update, set, get, store || Woocommerce_invoice: check_customer, check_invoice, create_invoice
- **Models:** Stores_model Woocommerce_model

### Workshop Management Perfex CRM

slug: `workshop` · 1 pacote(s) · 4 PHP · 2942 KB · 18 hook(s)

- **Menus:** wshop_branches | wshop_dashboard | wshop_devices | wshop_inspections | wshop_labour_products | wshop_mechanics | wshop_repair_jobs | wshop_settings | wshop_workshops | wshop_workshops_name
- **Tabelas:** wshop_activity wshop_appointment_products wshop_appointment_types wshop_branches wshop_categories wshop_customfields wshop_customfieldsvalues wshop_delivery_methods wshop_devices wshop_fieldsets wshop_holidays wshop_ins…
- **Controllers/rotas:** Client: layout, repair_jobs, repair_job_detail, preview_file, inspections, inspection_detail, inspection_form_detail, devices, device_detail, track_repair, repair_job_print_label, repair_job_print_report || Gtsverify: activate || Workshop: setting, general, prefix_number, holiday_table, change_holiday_status, holiday, delete_holiday, holiday_days_off_exists, manufacturer_table…
- **Models:** Workshop_model

## 14. Relatórios, BI e visual

### diagramy a complete diagram editor

slug: `diagramy` · 1 pacote(s) · 2 PHP · 872 KB · 9 hook(s)

- **Menus:** diagramy | diagramy_groups
- **Tabelas:** diagramy diagramy_groups
- **Controllers/rotas:** Clients: clients_preview || Diagramy: table, grid, gridview, get_diagramy_data, diagramy_create, preview, delete, switch_grid, groups, group, delete_group, publicpreview, get_data_by_task_id || Env_ver: activate, upgrade_database
- **Models:** Custom_model Diagramy_model

### google sheets

slug: `google_workspace` · 1 pacote(s) · 2 PHP · 22430 KB · 2 hook(s)

- **Menus:** google_workspace | google_workspace_google_docs | google_workspace_google_drive | google_workspace_google_forms | google_workspace_google_sheets | google_workspace_google_slides | google_workspace_se…
- **Tabelas:** google_workspaces
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Google_workspace: _create_client, _set_service, docs, sheets, slides, forms, drives, save, view, delete, update_doc, update_sheet, integrate, redirects, settings, fetch_docs, fetch_sheets, fetch_slides, fetch_forms, fetch_drives, reset_settings, save_settings
- **Models:** Google_workspace_model

### mindmap

slug: `mindmap` · 1 pacote(s) · 3 PHP · 11219 KB · 5 hook(s)

- **Menus:** mindmap | mindmap_groups
- **Tabelas:** mindmap mindmap_groups mindmapcomments
- **Controllers/rotas:** Mindmap: table, project_table, grid, get_mindmap_data, mindmap_create, preview, delete, switch_grid, groups, group, delete_group, download, update_mindmap, get_discussion_comments, add_discussion_comment, update_discussion_comment, update_discussion_comment_rating, delete_discussion_comment, send, view || View_mindmap: mind
- **Models:** Mindmap_model

### okrs objectives and key results

slug: `okr` · 1 pacote(s) · 2 PHP · 3739 KB · 8 hook(s)

- **Menus:** okr | okr_checkin | okr_dashboard | okr_report | okr_setting | okrs
- **Tabelas:** okr_approval_details okr_approval_setting okr_setting_category okr_setting_circulation okr_setting_evaluation_criteria okr_setting_question okr_setting_unit okrs okrs_checkin okrs_checkin_log okrs_key_result okrs_key_re…
- **Controllers/rotas:** Okr: dashboard, checkin, okrs, setting, table_circulation, setting_circulation, delete_setting_circulation, setting_question, table_question, delete_setting_question, setting_evaluation_criteria, table_evaluation_criteria, delete_setting_evaluation_criteria, new_object_main, okrs_new_main, get_not_child, objective_show, checkin_detailt, highcharts_detailt_checkin, add_check_in…
- **Models:** index Okr_model

### perfexdashboard dashboard builder

slug: `perfex_dashboard` · 1 pacote(s) · 2 PHP · 328 KB · 2 hook(s)

- **Menus:** all_dashboards | all_widgets | my_dashboard | perfex_dashboard | settings | widget_categories
- **Tabelas:** —
- **Controllers/rotas:** Api: lang, convert_string_to_key || Categories: store_category, api_get_category_data, update_category, destroy_category || Dashboards: my_dashboard, edit_dashboard, store_dashboard, clone_dashboard, update_dashboard, update_staff, add_widget, api_update_widgets_order, delete_dashboard, api_available_widgets || Widgets: template_demo, store_widget, update_widget, destroy_widge…
- **Models:** perfex_dashboard_model

### report builder

slug: `report_builder` · 1 pacote(s) · 2 PHP · 7557 KB · 8 hook(s)

- **Menus:** rb_report_management | rb_report_share | report_builder_name | report_template | rp_settings
- **Tabelas:** rb_aggregation_functions rb_categories rb_columns rb_data_source_filters rb_data_source_relationships rb_field_conditional_formattings rb_settings rb_sort_bys rb_templates
- **Controllers/rotas:** Gtsverify: activate || Report_builder: setting, report_manage, report_table, add_data_source, data_source_manage, relationship_table, relationship_modal, get_table_related_data, add_relationship, delete_relationship, category_setting, delete_category, general_setting, filter_table, filter_modal, get_list_fields, add_filter, delete_filter, get_next_step_report, column_manage, a…
- **Models:** Report_builder_model

### reportplus effortles automated reporting

slug: `reportplus` · 1 pacote(s) · 2 PHP · 442 KB · 3 hook(s)

- **Menus:** reportplus | reportplus_reports | settings
- **Tabelas:** reportplus_generated_reports
- **Controllers/rotas:** Reportplus: manage, generate_report, view_report, delete_report, settings
- **Models:** Reportplus_model

### spreadsheet online

slug: `spreadsheet_online` · 1 pacote(s) · 2 PHP · 15147 KB · 19 hook(s)

- **Menus:** SPREADSHEET_ONLINE
- **Tabelas:** spreadsheet_online_hash_share spreadsheet_online_my_folder spreadsheet_online_related
- **Controllers/rotas:** Spreadsheet_online: manage, add_edit_folder, new_file_view, delete_folder_file, get_file_sheet, get_folder_zip, update_share_spreadsheet_online, file_view_share, get_hash_staff, get_hash_client, get_related, update_related_spreadsheet_online, get_share_staff_client, get_my_folder, get_my_folder_get_hash, append_value_department, get_staff_all, append_value_group, get_client_al…
- **Models:** Spreadsheet_online_model

### whiteboard

slug: `whiteboard` · 1 pacote(s) · 3 PHP · 2413 KB · 5 hook(s)

- **Menus:** whiteboard | whiteboard_groups
- **Tabelas:** whiteboard whiteboard_groups whiteboardcomments
- **Controllers/rotas:** View_whiteboard: white || Whiteboard: table, whiteboard_table, grid, get_whiteboard_data, get_iframe_data, whiteboard_create, preview, delete, switch_grid, groups, group, delete_group, checkiframe, update_whiteboard, send, get_discussion_comments, add_discussion_comment, update_discussion_comment, update_discussion_comment_rating, delete_discussion_comment
- **Models:** Whiteboard_model

## 15. RH e equipe

### HR Records Perfex

slug: `hr_profile` · 2 pacote(s) · 2 PHP · 8987 KB · 7 hook(s)

- **Menus:** hr_dashboard | hr_dependent_persons | hr_hr_contracts | hr_hr_profile | hr_hr_records | hr_job_descriptions | hr_organizational_chart | hr_q_a | hr_receiving_staff_lable | hr_reports | hr_resignation…
- **Tabelas:** bonus_discipline bonus_discipline_detail checklist checklist_allocation group_checklist group_checklist_allocation hr_allocation_asset hr_allowance_type hr_checklist_allocation hr_contract_template hr_dependent_person h…
- **Controllers/rotas:** Gtsverify: activate || Hr_profile: dashboard, organizational_chart, get_data_department, delete, department, email_exists, test_imap_connection, reception_staff, table_reception_staff, setting, contract_type, delete_contract_type, allowance_type, delete_allowance_type, insurance_type, delete_insurance_type, insurance_conditions_setting, salary_form, delete_salary_form, table_p…
- **Models:** Hr_profile_model index Knowledge_base_q_a_model

### Perfex CRM HR Payroll

slug: `hr_payroll` · 2 pacote(s) · 2 PHP · 27330 KB · 12 hook(s)

- **Menus:** hr_bonus_kpi | hr_manage_attendance | hr_manage_employees | hr_pay_slip_templates | hr_pay_slips | hr_payroll | hrp_commission_manage | hrp_deduction_manage | hrp_income_tax | hrp_insurrance | hrp_re…
- **Tabelas:** currency_rate_logs currency_rates hr_payroll_option hrp_bonus_kpi hrp_commissions hrp_company_contributions_list hrp_customize_staff_payslip_columns hrp_earnings_list hrp_earnings_list_hr_records hrp_employees_timeshee_…
- **Controllers/rotas:** Gtsverify: activate || Hr_payroll: setting, setting_incometax_rates, setting_incometax_rebates, setting_earnings_list, setting_salary_deductions_list, setting_insurance_list, setting_company_contributions_list, data_integration, timesheet_integration_type_change, setting_earnings_list_hr_records, hr_payroll_permission_table, permission_modal, hr_payroll_update_permissions, sta…
- **Models:** Hr_payroll_model

### recruitment management

slug: `recruitment` · 2 pacote(s) · 2 PHP · 2879 KB · 4 hook(s)

- **Menus:** _recruitment_channel | campaign | candidate_profile | dashboard | interview_schedule | proposal | recruitment | setting
- **Tabelas:** cd_care cd_family_infor cd_interview cd_literacy cd_work_experience rec_campaign rec_campaign_form_web rec_candidate rec_cd_evaluation rec_criteria rec_evaluation_form rec_interview rec_job_position rec_list_criteria re…
- **Controllers/rotas:** Forms: wtl, l, ticket || Recruitment: setting, job_position, delete_job_position, recruitment_proposal, proposal, delete_recruitment_proposal, table_proposal, table_campaign, get_proposal_data_ajax, delete_proposal_attachment, file, approve_reject_proposal, recruitment_campaign, campaign, delete_recruitment_campaign, campaign_code_exists, get_campaign_data_ajax, campaign_file,…
- **Models:** Recruitment_model

### staff approvals management

slug: `approvify` · 1 pacote(s) · 2 PHP · 636 KB · 6 hook(s)

- **Menus:** approvify_categories | approvify_mod_name | approvify_my_requests | approvify_request | approvify_review_requests
- **Tabelas:** approvify_approval_categories approvify_request_activity approvify_request_approvals approvify_request_files approvify_requests
- **Controllers/rotas:** Approvify: manage_requests, manage_review_requests, create_request, view_request, refuse_request, approve_request, cancel_request, manage_created_requests, kanban, my_requests_kanban_load_more, manage_types, create_type, delete_type, update_type_status || Lecverify: activate
- **Models:** Approvify_model

## 16. Aplicativos (mobile/desktop)

### flutex perfex admin staff mobile app

slug: `flutex_admin_api` · 1 pacote(s) · 2 PHP · 873 KB · 4 hook(s)

- **Menus:** flutex_admin_settings
- **Tabelas:** —
- **Controllers/rotas:** Authentication: login_post, forgot, email_exists || Contracts: contracts_get, search_get, contracts_post, contracts_put, contracts_delete || Customers: customers_get, customers_summary, search_get, customers_post, customers_put, customers_delete, contacts_get, contacts_post, contacts_delete || Dashboard: dashboard_get, overview_get, notifications_get, invoices_summary, estimat…
- **Models:** —

### glofex adminemployee mobile app for perfex

slug: `mobile_app_api` · 1 pacote(s) · 2 PHP · 67 KB · 2 hook(s)

- **Menus:** Mobile app API
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

### perfex android app lead management app

slug: `perfex_mobile_app_api` · 1 pacote(s) · 4 PHP · 167 KB · 0 hook(s)

- **Menus:** —
- **Tabelas:** api_logs
- **Controllers/rotas:** BaseApiController: set_session, authentication_error || Perfex_mobile_app_api: login, validate_session, get_my_leads, get_lead, delete_my_lead, delete_my_customer, delete_contact, update_customer_active_status, update_contact_active_status, edit_my_lead, get_lead_status, get_initial_lead_form, get_lead_source, get_countries, add_lead, get_lead_activity_log, add_lead_activity_l…
- **Models:** —

## 17. SaaS / multi-tenant

### perfect saas powerful multitenancy

slug: `saas` · 4 pacote(s) · 4 PHP · 126862 KB · 37 hook(s)

- **Menus:** affiliate | buy_modules | custom_domain | customize_packages | dashboard | find_my_company | packages | referrals | theme_builder
- **Tabelas:** filter_defaults filters tbl_saas_api_token tbl_saas_domain_requests tbl_saas_package_module
- **Controllers/rotas:** Affiliates: users, user, get, commission, referral, payout, stop_affiliate, payouts, change_payout, delete_payout, settings || Api: generate_token, token, delete_generate_token, generated_token, save_token || Auto_update: __destruct || Builder: update, builder, page, media_scan, media_upload, set_default_theme || Companies: companies, login_as_companies, create, reset_password…
- **Models:** Cms_media_model Cms_menu_model Cms_menuitems_model Datatables Saas_cron_model Saas_model

### turnCRM perfex crm saas module

slug: `perfex_saas` · 2 pacote(s) · 4 PHP · 2367 KB · 17 hook(s)

- **Menus:** perfex_saas_invoices | perfex_saas_packages | perfex_saas_settings | perfex_saas_tenants
- **Tabelas:** —
- **Controllers/rotas:** Api: caddy_domain_check || Perfex_saas_client: create, edit, deploy, delete, subscribe, magic_auth, check_slug
- **Models:** Perfex_saas_cron_model Perfex_saas_migration_model Perfex_saas_model

## 18. Atendimento e suporte

### allinone support module for perfex

slug: `support_contact` · 1 pacote(s) · 2 PHP · 122 KB · 6 hook(s)

- **Menus:** support_contact
- **Tabelas:** —
- **Controllers/rotas:** Support_contact: reset, save, enable, enablefrontend, enablebackend, disable, disablefrontend, disablebackend
- **Models:** —

### call log

slug: `call_log` · 1 pacote(s) · 3 PHP · 11096 KB · 0 hook(s)

- **Menus:** —
- **Tabelas:** call_logs
- **Controllers/rotas:** Call_logs: calculate_duration, table, grid, call_log_relations, get_call_log_data, call_log, records, records_table, preview, delete, get_contact, get_relation_data, overview, switch_grid, cl_types, cl_type, delete_type, call_directions, call_direction, delete_call_direction, get_lead_info, get_contact_info, new, udpate_sms_response, save_twilio, delete_record, download_record…
- **Models:** Call_logs_model

### perfex crm customer feedback

slug: `feedback` · 2 pacote(s) · 2 PHP · 24 KB · 2 hook(s)

- **Menus:** feedback | feedback_received | send_request
- **Tabelas:** feedback
- **Controllers/rotas:** Client: client_feedback, project, submit_project || Feedback: feedback_received
- **Models:** Feedback_model

### perfexwiki internal knowledge

slug: `wiki` · 1 pacote(s) · 2 PHP · 5803 KB · 2 hook(s)

- **Menus:** posted_by_me | wiki_articles | wiki_book | wiki_bookmark
- **Tabelas:** —
- **Controllers/rotas:** Articles: article, show, count, delete, validateslug, bookmark_switch, mindmap, mindmap_save || Books: book, delete
- **Models:** Wikiarticles_model Wikibooks_model

## 19. Instalação / pacote

### marketing business modules bundle

slug: `mmb` · 1 pacote(s) · 6 PHP · 2121 KB · 3 hook(s)

- **Menus:** —
- **Tabelas:** webhooks_debug_log webhooks_master whatsapp_api_debug_log whatsapp_templates whatsapp_templates_mapping
- **Controllers/rotas:** Custom_pdf: settings, store, remove_pdf_image, pdf || Env_ver: activate, upgrade_database || Log_details: whatsapp_log_details_table, clear_webhook_log, get_whatsapp_api_log_info || RestController: __destruct, _remap, response, set_response, get, options, head, post, put, delete, patch, query, validation_errors || Template_mapping: template_mapping_table, add, get_template_map…
- **Models:** Customers_api_model Webhooks_model Whatsapp_api_model

### perfex

slug: `menu_setup` · 2 pacote(s) · 2 PHP · 78 KB · 6 hook(s)

- **Menus:** main_menu | menu_builder | setup_menu
- **Tabelas:** —
- **Controllers/rotas:** Menu_setup: main_menu, update_aside_menu, reset_aside_menu, setup_menu, update_setup_menu, reset_setup_menu
- **Models:** —

### perfex

slug: `surveys` · 2 pacote(s) · 2 PHP · 6820 KB · 11 hook(s)

- **Menus:** surveys
- **Tabelas:** emaillists listemails maillistscustomfields maillistscustomfieldvalues surveyresultsets surveys surveysemailsendcron surveysendlog
- **Controllers/rotas:** Surveys: survey, send, remove_survey_send, results, delete, remove_question, remove_box_description, add_box_description, add_survey_question, update_question, update_survey_questions_orders, change_survey_status, mail_lists, mail_list, mail_list_view, add_email_to_list, remove_email_from_mail_list, remove_list_custom_field, import_emails, delete_mail_list
- **Models:** Surveys_model

### perfex

slug: `install` · 2 pacote(s) · 11 PHP · 278 KB · 0 hook(s)

- **Menus:** —
- **Tabelas:** —
- **Controllers/rotas:** —
- **Models:** —

### perfex

slug: `theme_style` · 2 pacote(s) · 2 PHP · 168 KB · 8 hook(s)

- **Menus:** theme_style
- **Tabelas:** —
- **Controllers/rotas:** Theme_style: reset, save
- **Models:** —

### perfex

slug: `backup` · 2 pacote(s) · 2 PHP · 568 KB · 6 hook(s)

- **Menus:** utility_backup
- **Tabelas:** —
- **Controllers/rotas:** Backup: download, make_backup_db, update_auto_backup_options, delete
- **Models:** —

### perfex

slug: `goals` · 3 pacote(s) · 2 PHP · 159 KB · 8 hook(s)

- **Menus:** goals
- **Tabelas:** goals
- **Controllers/rotas:** Goals: goal, delete, notify
- **Models:** Goals_model

### perfex addons

slug: `perfex_email_builder` · 2 pacote(s) · 2 PHP · 3095 KB · 4 hook(s)

- **Menus:** edit_an_email_template
- **Tabelas:** _perfex_email_builder
- **Controllers/rotas:** Perfex_email_builder: languages, merge, options, get, get, templates, update, change, update, revert, upload
- **Models:** EmailBuilder_model

### perfex addons

slug: `codecanyon-perfex-zoom-meeting-module` · 1 pacote(s) · 2 PHP · 41 KB · 0 hook(s)

- **Menus:** —
- **Tabelas:** zoom
- **Controllers/rotas:** Zoom: create_meeting, api_meeting, api_meeting_submit, add_registrant, submit_registrant
- **Models:** zoom_model

### perfex addons

slug: `warehouse` · 4 pacote(s) · 2 PHP · 7034 KB · 4 hook(s)

- **Menus:** items | loss_adjustment | report | setting | stock_export | stock_import | warehouse | warehouse_history
- **Tabelas:** goods_delivery goods_delivery_detail goods_receipt goods_receipt_detail goods_transaction_detail inventory_commodity_min inventory_manage stock_take stock_take_detail ware_body_type ware_color ware_commodity_type ware_s…
- **Controllers/rotas:** Warehouse: setting, commodity_type, delete_commodity_type, unit_type, delete_unit_type, size_type, delete_size_type, style_type, delete_style_type, body_type, delete_body_type, commodity_group_type, delete_commodity_group_type, warehouse_, delete_warehouse, table_commodity_list, commodity_list, get_commodity_data_ajax, add_commodity_list, delete_commodity, table_manage_goods_r…
- **Models:** Warehouse_model

### perfex business tools modules bundle

slug: `accountplanning` · 1 pacote(s) · 2 PHP · 7771 KB · 12 hook(s)

- **Menus:** als_accountplanning
- **Tabelas:** accountplanning accountplanning_current_service accountplanning_financial accountplanning_items accountplanning_marketing_activities accountplanning_objective accountplanning_service_ability_offering accountplanning_tas…
- **Controllers/rotas:** Accountplanning: table, new_account, add, delete, update_due_diligence, update_team_information, update_service_ability_offering, update_planning, view, client_change_data, objective, item, task, delete_objective, delete_item, delete_task, copy, delete_attachment, file, download_file || Env_ver: activate, upgrade_database
- **Models:** Accountplanning_model

### perfex business tools modules bundle

slug: `resourcebooking` · 2 pacote(s) · 2 PHP · 1066 KB · 7 hook(s)

- **Menus:** booking | resource | resource_group | resourcebooking | statistical
- **Tabelas:** booking booking_follower resource resource_group
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Resourcebooking: resource_group, delete_resource_group, resource_group_table, resources, delete_resource, resource_table, resource, manage_booking, booking_table, add_edit_booking, delete_booking, get_resource_by_group, get_resource_activity_now, booking, approve_booking, check_approve_booking, reject_list_booking, check_resourcebooking, …
- **Models:** Resourcebooking_model

### perfex business tools modules bundle

slug: `projectroadmap` · 2 pacote(s) · 2 PHP · 1074 KB · 10 hook(s)

- **Menus:** projectroadmap
- **Tabelas:** list_widget
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Projectroadmap: projectroadmap_table, view_projectroadmap, add_projectroadmap_filter_widget, remove_projectroadmap_filter_widget, projectroadmap_tasks
- **Models:** Projectroadmap_model

### perfex business tools modules bundle

slug: `customemailandsmsnotifications` · 2 pacote(s) · 2 PHP · 865 KB · 13 hook(s)

- **Menus:** templates
- **Tabelas:** custom_email_sms custom_templates
- **Controllers/rotas:** Email_sms: email_or_sms, send, send, send, twilio, msg91, clickatell || Env_ver: activate, upgrade_database || Template: save, delete, get_item_by_id, get_template_data
- **Models:** Customemailandsmsnotifications_model

### perfex business tools modules bundle

slug: `assets` · 3 pacote(s) · 2 PHP · 795 KB · 9 hook(s)

- **Menus:** allocation | assets | depreciation | eviction | setting
- **Tabelas:** asset_location asset_unit assets assets_acction_1 assets_acction_2 assets_group inventory_history
- **Controllers/rotas:** Assets: setting, asset_group, delete_assets_group, asset_unit, delete_asset_unit, asset_location, delete_asset_location, manage_assets, table_assets, asset, delete_assets, assets_code_exists, get_asset_data_ajax, file, delete_asset_attachment, allocation_asset, acction_code_exists, acction2_code_exists, get_asset_allocation_by_staff, revoke_asset, additional_asset, lost_asset,…
- **Models:** Assets_model

### perfex business tools modules bundle

slug: `mailbox` · 4 pacote(s) · 2 PHP · 755 KB · 9 hook(s)

- **Menus:** mailbox
- **Tabelas:** mail_attachment mail_inbox mail_outbox
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Mailbox: compose, table, inbox, outbox, update_field, reply, config
- **Models:** Mailbox_model

### perfex business tools modules bundle

slug: `hrm` · 2 pacote(s) · 2 PHP · 2744 KB · 7 hook(s)

- **Menus:** dashboard | hrm | insurrance | payroll | setting | staff | staff_contract | timekeeping
- **Tabelas:** allowance_type day_off hrm_option hrm_timesheet insurance_type job_position manage_leave payroll_table payroll_type province_city request request_approval_details request_files request_follow request_form request_log re…
- **Controllers/rotas:** Env_ver: activate, upgrade_database || Hrm: staff_infor, table, table_insurance, setting, payroll, payroll_type, payroll_table, latch_payslip, delete_payroll_type, member, delete_staff, hr_code_exists, contract_code_exists, job_position, delete_job_position, department, delete_department, workplace, delete_workplace, contract_type, delete_contract_type, allowance_type, delete_…
- **Models:** Hrm_model
