# Addons que importam ao Orbit — leitura funcional

> Terceiro nível do levantamento: os cinco addons que tocam lacunas do Orbit, lidos no código
> (schema do `install.php`, rotas dos controllers e models). Complementa
> [`perfex-addons-fichas.md`](../perfex-addons-fichas.md) (estrutural) e
> [`paridade-perfex-3.4.1.md`](../paridade-perfex-3.4.1.md) (lacunas).

## Como ler

| Nível | O que entrega                                 | Onde                                                    |
| ----- | --------------------------------------------- | ------------------------------------------------------- |
| 1     | Pacotes e temas                               | [`perfex-addons.md`](../perfex-addons.md)               |
| 2     | Estrutura por produto (menus, tabelas, rotas) | [`perfex-addons-fichas.md`](../perfex-addons-fichas.md) |
| 3     | **Comportamento dos 5 relevantes**            | este documento                                          |

**Limite:** li o `install.php` inteiro e a lista de rotas de todos; os models por completo no
subscription e no WhatsApp; nos outros, o schema e os fluxos que as rotas revelam. Onde não li o
corpo do método, digo "pelo nome da rota".

---

## 1. Inventory Management (`warehouse`)

**O que é:** um WMS completo dentro do Perfex — não um catálogo. 39 tabelas e ~160 rotas.

**Modelo de dados.** O item **não** ganha tabela própria: o addon estende `tblitems` com 21 colunas:
`commodity_code`, `commodity_barcode`, `commodity_type`, `warehouse_id`, `origin`, `color_id`,
`style_id`, `model_id`, `size_id`, `unit_id`, `sku_code`, `sku_name`, `purchase_price`,
`sub_group`, `commodity_name`, `color`, `guarantee`, `profif_ratio`, `active`, `long_descriptions`,
`series_id`, `parent_id`, `attributes`/`parent_attributes` (variações), `can_be_sold`,
`can_be_purchased`, `can_be_manufacturing`, `can_be_inventory`, `without_checking_warehouse`.
Tabelas próprias: `warehouse`, `inventory_manage` (estoque por depósito), `inventory_commodity_min`
(mínimo por item), `goods_receipt(_detail)`, `goods_delivery(_detail)`, `internal_delivery_note(_detail)`,
`stock_take(_detail)`, `wh_loss_adjustment(_detail)`, `wh_order_returns(_detail)`,
`wh_packing_lists(_detail)`, `wh_omni_shipments`, `wh_inventory_serial_numbers`,
`wh_approval_setting(_details)`, `wh_custom_fields`, `wh_activity_log`, catálogos de
`ware_color/size/style/body/unit/brand/model/series/sub_group`.

**Fluxos (pelas rotas):** compra → recebimento → estoque; entrega/saída; transferência interna;
packing list; shipment (com portal do cliente para acompanhar); devolução de pedido (venda e compra);
ajuste de perda; inventário (stock take); números de série; aprovação por etapas; reversão de
recebimento/entrega; importação XLSX de itens e de estoque inicial; etiqueta/código de barras;
relatórios de giro, avaliação e mínimo/máximo; preço de venda calculado (markup, arredondamento,
`profit_rate_by_purchase_price_sale`).

**Regras que valem:** estoque é por `(depósito, item)`; item pode ter pai e variações
(`parent_id` + `attributes`); mínimo por item gera alerta; recebimento/entrega podem exigir
aprovação; reversão devolve saldo.

**Veredito para o Orbit:** **não portar o WMS.** Aproveitar só o desenho do catálogo:
`code`/`sku`, `barcode`, `unit`, `group`/`subgroup`, `purchase_price` separado de `rate`,
`active`, e variações por `parent_id`. É exatamente o que a spec
[`catalogo-de-itens.md`](catalogo-de-itens.md) propõe — com a diferença de que aqui o campo
`purchase_price` existe desde o início (vale incluir).

---

## 2. Deals Management (`deals`)

**O que é:** um CRM de pipeline que roda **em paralelo** ao Perfex. 21 tabelas, controller de 135 KB
e seis models. Não é o módulo de propostas.

**Modelo:** `tbl_deals` (negócio), `tbl_deals_pipelines` e `tbl_deals_stages` (funil configurável),
`tbl_deals_source`, `tbl_deals_items` (itens do negócio), `tbl_deal_calls`, `tbl_deals_mettings`,
`tbl_deals_followups`, `tbl_deal_activity_log`, `tbl_deals_comments`, `tbl_deals_email(_preferences)`,
`tbl_deals_campaigns` + `campaign_steps` + `campaign_messages`,
`tbl_deals_automation_rules` + `automation_queue`, `tbl_integrations` + `accounts` + `events` +
`logs` + `tbl_sync_states`.

**Fluxos:** kanban por estágio (com ordenação e load-more), pipelines e estágios configuráveis,
origens, dono e múltiplos responsáveis, follow-ups com conclusão, reuniões, ligações, notas,
comentários, anexos, aprovação de negócio (`request_approval`/`approve`/`reject`), campanhas de
e-mail, regras de automação com fila, integrações com webhooks e "connectors", caixas de e-mail
próprias e relatórios.

**Regras:** estágio move o negócio no funil; automação dispara por evento e enfileira execução;
aprovação é opcional por política; o negócio tem valor e itens próprios (não gera fatura
automaticamente — a conversão é manual).

**Veredito para o Orbit:** **referência, não código.** Dois usos:

1. o kanban de propostas que a spec [`propostas.md`](propostas.md) propõe já é o mesmo desenho
   (`pipelines`/`stages`), e vale adotar estágios configuráveis em vez de status fixos;
2. follow-up de proposta (lembrete, ligação, reunião) é o que falta depois do aceite — este addon
   mostra o formato.
   Não confundir com propostas: aqui não há documento assinável, numeração nem PDF.

---

## 3. Subscription as Products (`services`)

**O que é:** uma **vitrine de assinaturas no portal** — o cliente escolhe um produto e assina. Não
implementa recorrência: usa o módulo `subscriptions` do core (já especificado em
[`recorrencia.md`](recorrencia.md) na parte de fatura, e no gateway para a cobrança).

**Modelo:** `subscription_products`, `invoice_products`, `products_groups`,
`product_purchase_log`. Modelos pequenos (3–4 KB), sem regra de cobrança.

**Regras (lidas no model):** visibilidade do produto é filtrada por **grupo de cliente**
(`customer_group`) **e** por cliente específico (`client_id`), com registros "sem restrição"
(`OR customer_group IS NULL`); grupo de produto define a categoria; a compra é registrada em
`product_purchase_log`; o portal tem cadastro público com reCAPTCHA.

**Veredito para o Orbit:** **baixa prioridade.** Não resolve a recorrência (que depende do cron de
faturas) e não resolve cobrança. Guarda uma ideia útil para depois: **loja de serviços no portal com
preço por grupo de cliente** — encaixa quando existirem planos por segmento. Por ora, só a nota.

---

## 4. Mailbox (`mailbox`)

**O que é:** um webmail dentro do CRM. É o "e-mail piping" que a paridade lista como P2.

**Modelo:** `mail_inbox`, `mail_outbox`, `mail_conversation`, `mail_attachment`, `mail_clients`
(ligação e-mail ↔ cliente), `mail_tags` + `mail_email_tags`, `mail_rules`, `mail_auto_replies`,
`mail_folder_sync`.

**Fluxos (pelas rotas):** sincronizar caixa (manual e por cron), listar inbox/outbox, abrir conversa
por thread, responder, compor, baixar anexo, marcar tags, criar regras, auto-resposta, modelos de
e-mail próprios, **atribuir e-mail a cliente** (`assign_email_to_customer`, `assign_customers`),
**criar tarefa a partir do e-mail** (`assign_task`), OAuth para Google/Microsoft e teste de conexão.

**Regras:** conversa é agrupada por thread, não por mensagem; a ligação com cliente é por endereço;
regras classificam (tag) na entrada; auto-resposta responde uma vez por remetente/período.

**Veredito para o Orbit:** **é o desenho certo para o e-mail piping**, mas fica para depois do
gateway. O que importa copiar quando entrar: (a) thread por conversa, (b) regra → tag/cliente,
(c) "virar tarefa" e "virar ticket", (d) OAuth em vez de senha IMAP.

---

## 5. WhatsApp Cloud API (`whatsapp_api`)

**O que é:** mensageria **de saída** por template aprovado, com webhook de status — não é inbox de
conversa (isso é o `whatsbot`, outro produto).

**Modelo:** `whatsapp_templates` (nome, idioma, header/body/footer/buttons, contagem de parâmetros),
`whatsapp_templates_mapping` (liga template a um evento e a um destinatário), `whatsapp_api_debug_log`.
O model também implementa **login 2FA por WhatsApp** (código por mensagem, validade de 1 hora,
desligando o 2FA por app).

**Regras:** só envia template aprovado; parâmetros do corpo precisam bater com a contagem declarada;
o mapeamento define evento → template; tudo que sai fica no log de debug; o webhook atualiza status.

**Veredito para o Orbit:** **canal de notificação, não conversa.** Se entrar, entra como provedor de
mensagem no mesmo lugar do e-mail: fatura enviada, ticket respondido, lembrete de assinatura. O 2FA
por WhatsApp é uma alternativa barata ao app autenticador e conversa com o item "2FA" do roadmap.
Não construir inbox: sem histórico de conversa, sem atendimento por WhatsApp — isso é outro produto.

---

## Resumo

| Addon                    | O que é de fato                         | Veredito                                                   |
| ------------------------ | --------------------------------------- | ---------------------------------------------------------- |
| Inventory                | WMS com catálogo embutido em `tblitems` | Só o desenho do item (inclui `purchase_price` e variações) |
| Deals                    | CRM de pipeline paralelo                | Referência para kanban e follow-up de propostas            |
| Subscription as Products | Vitrine de assinaturas no portal        | Adiar; ideia de preço por grupo de cliente                 |
| Mailbox                  | Webmail com thread, regras e OAuth      | Desenho do e-mail piping (P2)                              |
| WhatsApp Cloud API       | Templates de saída + 2FA                | Canal de notificação (P2), não inbox                       |
