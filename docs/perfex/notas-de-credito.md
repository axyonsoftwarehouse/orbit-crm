# Notas de crédito — especificação de porte (Perfex 3.4.1 → Orbit)

> Fase 2 do plano C: comportamento lido no código do Perfex, traduzido para o modelo do Orbit.
> Evidências relativas a `perfex crm/` na extração do pacote 3.4.1.
> Relacionado: [`paridade-perfex-3.4.1.md`](../paridade-perfex-3.4.1.md) (§3, P0),
> [`perfex-addons.md`](../perfex-addons.md) (referência: `accounting-and-bookkeeping`).

## 1. O que é (e por que é P0)

Nota de crédito é o documento que **devolve valor** de uma venda: cliente devolveu item,
cobrança a maior, desconto retroativo, cancelamento parcial. No Orbit hoje o único caminho é
editar a fatura — o que corrompe o histórico e o total já pago.

O Perfex resolve com três peças: o documento, a **aplicação** do crédito em faturas e o
**reembolso** em dinheiro. O saldo da nota é `total − aplicado − reembolsado`, e crédito
aplicado **conta como pagamento** para o status da fatura.

## 2. Como o Perfex faz

### 2.1 Dados

| Tabela                        | Papel               | Campos relevantes                                                                                                                                                                                                   |
| ----------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tblcreditnotes`              | documento           | `clientid`, `number`, `prefix`, `number_format`, `formatted_number`, `date`, `status`, `currency`, `subtotal`, `discount_*`, `total_tax`, `adjustment`, `total`, `adminnote`, `clientnote`, `terms`, `reference_no` |
| `tblcredits`                  | aplicação em fatura | `invoice_id`, `credit_id`, `staff_id`, `date`, `date_applied`, `amount`                                                                                                                                             |
| `tblcreditnote_refunds`       | reembolso           | `credit_note_id`, `staff_id`, `refunded_on`, `payment_mode`, `amount`, `note`, `created_at`                                                                                                                         |
| `tblitemable` / `tblitem_tax` | itens               | `rel_type = 'credit_note'`                                                                                                                                                                                          |

Itens, impostos, anexos e campos personalizados (`fieldto = 'credit_note'` e `items`) são os mesmos
mecanismos de fatura/orçamento — o Perfex reaproveita tudo.

### 2.2 Status e transições

`Credit_notes_model::get_statuses()` → **1 aberta · 2 fechada · 3 anulada**.

| De      | Para    | Regra                                                                             |
| ------- | ------- | --------------------------------------------------------------------------------- |
| aberta  | fechada | automático quando `aplicado + reembolsado == total` (`update_credit_note_status`) |
| aberta  | anulada | manual, só se status ≠ 2/3 **e** `credits_used == 0` (`mark_void`)                |
| anulada | aberta  | manual, sem outras condições (`mark_open`)                                        |
| fechada | —       | não reabre                                                                        |

### 2.3 Numeração

`prefix` + `number_format` (1 = sequencial, 2 = por ano, 3 = ano curto, 4 = ano/mês), guardados no
documento no momento da criação; `next_credit_note_number` é um `option` global. Excluir a última
nota devolve o número (`is_last_credit_note`). Editar a data revalida unicidade por ano
(`validate_number`).

### 2.4 Criação

- **Manual**: cliente, data, itens, impostos, desconto (`before_tax`/`after_tax`), ajuste,
  moeda, notas (cliente/admin), termos, anexos, campos personalizados.
- **A partir de uma fatura** (`credit_note_from_invoice`): copia cliente, itens, impostos,
  desconto, ajuste, notas, endereços e `reference_no = número da fatura`; depois **aplica o crédito
  automaticamente** pelo `total_left_to_pay` da fatura e recalcula o status. Se a fatura era
  rascunho, ela deixa de ser (recebe número).

### 2.5 Aplicação do crédito em faturas

Duas portas, mesma regra: pela nota (`apply_credits_to_invoices`) e pela fatura
(`apply_invoice_credits`).

- Só faturas **do mesmo cliente**.
- Só nos status `não paga (1) · parcial (3) · rascunho (6) · vencida (4)`
  (`invoices_statuses_available_for_credits`).
- A UI limita ao `min(saldo da nota, falta pagar da fatura)`; o servidor **não valida**
  (só rejeita `amount == 0`). É uma frouxidão a corrigir no porte.
- Cada aplicação vira uma linha em `tblcredits` e dispara `update_invoice_status(force)`.

### 2.6 Efeito na fatura

Crédito é tratado como pagamento:

```text
outstanding = total − Σ pagamentos − Σ créditos aplicados
```

`update_invoice_status` soma pagamentos + créditos e marca: `pago` se quitar, `parcial` se houver
algo e faltar, `não paga`/`vencida` conforme vencimento. Rascunho e cancelada não são recalculados.

### 2.7 Reembolso

- Exige permissão de **editar** nota; valor ≠ 0; data, forma de pagamento (catálogo de
  `payment_modes`, exceto os de despesa) e observação.
- Reembolso também consome saldo e pode fechar a nota.
- Editar/excluir reembolso recalcula o status.

### 2.8 Saldo e proteções

```text
saldo = total − Σ aplicações − Σ reembolsos
```

- Excluir nota: bloqueado se houver crédito aplicado **ou** status fechada.
- Anular: bloqueado se houver crédito aplicado.
- Aplicação individual pode ser excluída (`delete_applied_credit`) e recalcula nota **e** fatura.

### 2.9 Permissões e portal

- Staff: `view`, `view_own`, `create`, `edit`, `delete` em `credit_notes`; `view_own` restringe a
  `addedfrom == staff`.
- O portal do cliente **não tem lista de notas de crédito**: o cliente recebe por e-mail/PDF
  (permissão de contato `credit_note_emails`) e vê o efeito no **extrato**
  (`statement.php`: linha "crédito aplicado").
- PDF próprio (`credit_note_pdf.php`) e envio com anexo opcional.

## 3. Regras a portar (com as correções)

| #   | Regra                                                    | Perfex                  | Orbit deve                                 |
| --- | -------------------------------------------------------- | ----------------------- | ------------------------------------------ |
| R1  | Saldo = total − aplicado − reembolsado                   | ✅                      | ✅                                         |
| R2  | Fecha sozinha quando saldo = 0                           | ✅                      | ✅                                         |
| R3  | Anular só sem crédito aplicado                           | ✅                      | ✅ (e sem reembolso)                       |
| R4  | Excluir só sem aplicação                                 | ✅ (e status ≠ fechada) | ✅ (e sem reembolso)                       |
| R5  | Crédito conta como pagamento no status da fatura         | ✅                      | ✅                                         |
| R6  | Só faturas do mesmo cliente                              | ✅                      | ✅ + mesmo `tenant_id`                     |
| R7  | Só faturas em aberto/parcial/rascunho                    | ✅                      | ✅                                         |
| R8  | Valor aplicado ≤ saldo da nota **e** ≤ falta pagar       | só na UI                | ✅ no servidor                             |
| R9  | Aplicar não pode deixar saldo negativo                   | implícito               | ✅ constraint                              |
| R10 | Nota a partir de fatura aplica o crédito automaticamente | ✅                      | ✅ (opcional no formulário)                |
| R11 | Numeração sequencial por tenant                          | global + ano            | ✅ sequencial por tenant (padrão do Orbit) |
| R12 | Aplicação/reembolso guardam autor e data                 | ✅                      | ✅                                         |
| R13 | Cliente vê o efeito no extrato                           | ✅                      | ✅ (extrato é P1; até lá, PDF no portal)   |

## 4. Proposta para o Orbit

### 4.1 Banco

```sql
-- tenants
alter table public.tenants
  add column if not exists credit_note_prefix text not null default 'CR-',
  add column if not exists next_credit_note_number integer not null default 1;

create table public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  company_id uuid,
  project_id uuid,
  number integer not null,
  prefix text not null,
  formatted_number text not null,
  status smallint not null default 1 check (status in (1, 2, 3)),
  date date not null default current_date,
  currency text not null default 'BRL',
  subtotal numeric(15,2) not null default 0,
  discount_type text not null default 'before_tax'
    check (discount_type in ('before_tax', 'after_tax')),
  discount_percent numeric(5,2),
  discount_total numeric(15,2) not null default 0,
  total_tax numeric(15,2) not null default 0,
  adjustment numeric(15,2) not null default 0,
  total numeric(15,2) not null default 0,
  client_note text,
  admin_note text,
  reference_invoice_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint credit_notes_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete set null (company_id)
);

create table public.credit_applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  credit_note_id uuid not null,
  invoice_id uuid not null,
  amount numeric(15,2) not null check (amount > 0),
  applied_by uuid references public.profiles (id) on delete set null,
  applied_at timestamptz not null default now(),
  constraint credit_app_note_fk foreign key (credit_note_id, tenant_id)
    references public.credit_notes (id, tenant_id) on delete cascade,
  constraint credit_app_invoice_fk foreign key (invoice_id, tenant_id)
    references public.invoices (id, tenant_id) on delete cascade
);

create table public.credit_refunds (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  credit_note_id uuid not null,
  amount numeric(15,2) not null check (amount > 0),
  refunded_on date not null default current_date,
  payment_method text,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint credit_refund_note_fk foreign key (credit_note_id, tenant_id)
    references public.credit_notes (id, tenant_id) on delete cascade
);

-- itens reaproveitam document_items
alter table public.document_items drop constraint document_items_rel_type_check;
alter table public.document_items
  add constraint document_items_rel_type_check
  check (rel_type in ('estimate', 'invoice', 'credit_note'));
```

Índices: `(tenant_id, status)`, `(tenant_id, company_id)`, `(tenant_id, date)`,
`credit_applications (credit_note_id)`, `(invoice_id)`; `credit_refunds (credit_note_id)`.

Regra de saldo em SQL (uma view para leitura, para não repetir a conta em cada query):

```sql
create or replace view public.credit_note_balances
with (security_invoker = true) as
select n.id,
       n.tenant_id,
       n.total
         - coalesce((select sum(a.amount) from public.credit_applications a where a.credit_note_id = n.id), 0)
         - coalesce((select sum(r.amount) from public.credit_refunds r where r.credit_note_id = n.id), 0)
         as remaining
from public.credit_notes n
where n.deleted_at is null;
```

RLS: mesmo padrão das outras tabelas de negócio (`tenant_id` + `is_tenant_member`);
portal somente leitura via RPC `security definer` (`portal_list_credit_notes`,
`portal_get_credit_note`), sem colunas internas (`admin_note`).

Numeração: estender `next_document_number` com `p_kind = 'credit_note'`
(`tenants.next_credit_note_number`), mantendo a assinatura atual.

### 4.2 Server actions (`src/server/actions/credit-notes.ts`)

| Action                              | Regra                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `createCreditNoteAction`            | valida com Zod; numera via RPC; insere itens em `document_items`; recalcula totais no servidor |
| `updateCreditNoteAction`            | só se status ≠ 2; bloqueado se houver aplicação e os itens mudarem                             |
| `applyCreditToInvoiceAction`        | valida R8/R9 em transação; insere aplicação; recalcula nota e fatura                           |
| `removeCreditApplicationAction`     | remove aplicação; recalcula nota e fatura; registra atividade                                  |
| `createCreditRefundAction`          | valida saldo; insere; recalcula                                                                |
| `voidCreditNoteAction`              | exige `applied = 0 and refunded = 0`                                                           |
| `reopenCreditNoteAction`            | só de anulada                                                                                  |
| `deleteCreditNoteAction`            | exige `applied = 0 and refunded = 0`; soft delete                                              |
| `createCreditNoteFromInvoiceAction` | copia itens; opcionalmente aplica o crédito (default: sim)                                     |

Todas revalidam tenant e papel (owner/admin) como as de fatura.

### 4.3 Cálculo de status da fatura

Hoje `actions/invoices.ts` faz `paid = Σ payments` e decide o status. Passa a:

```text
recebido = Σ payments + Σ credit_applications (da fatura)
status   = 2 (pago) se recebido >= total
           3 (parcial) se 0 < recebido < total
           1 (aberto) caso contrário (vencida continua derivada de due_date)
```

Rascunho (6) e cancelada (5) não mudam. O mesmo cálculo alimenta `outstanding` nos relatórios.

### 4.4 Interface

- `/app/notas-de-credito` — lista com filtros (status, cliente, ano), coluna de saldo.
- `/app/notas-de-credito/[id]` — cabeçalho, itens, painéis **Créditos aplicados** e **Reembolsos**,
  botões: aplicar em fatura, reembolsar, anular/reabrir, PDF, enviar, excluir (condicionais).
- Na fatura: aba/seção "Créditos aplicados" + botão "Aplicar crédito" (espelho do Perfex) e
  "Gerar nota de crédito".
- No portal: lista somente leitura + PDF (decisão 5.3).

### 4.5 Formulários e validação (Zod)

`creditNoteSchema`: `company_id` (obrigatório), `date`, `project_id?`, itens ≥ 1 com
`description/qty/rate/tax_rate?`, `discount_type`, `discount_percent?`, `adjustment?`,
`client_note?`, `admin_note?`.
`creditApplicationSchema`: `invoice_id`, `amount > 0`.
`creditRefundSchema`: `amount > 0`, `refunded_on`, `payment_method?`, `note?`.

## 5. Decisões que precisam do seu aval

1. **Moeda**: o Orbit ainda tem moeda única por documento. A nota herda a da fatura de origem e
   não converte — igual ao Perfex, que também não converte (só exige que a fatura seja do mesmo
   cliente).
2. **Numeração**: manter sequencial por tenant (`CR-0001`), sem os quatro formatos do Perfex.
   Se você quiser ano no número, muda a coluna `prefix` na criação.
3. **Portal**: incluir lista de notas (Pefex não tem) ou só PDF por e-mail. Recomendo incluir:
   o crédito é do cliente, e esconder gera suporte.
4. **Reembolso com gateway**: nesta fase, reembolso é registro manual (data, forma, valor, nota).
   Estorno automático no Stripe/Mercado Pago fica para o módulo de cobrança.
5. **Edição de nota com crédito aplicado**: bloquear (mais seguro) ou permitir com recálculo?
   Recomendo bloquear itens e permitir só notas internas.

## 6. Testes

Unitários (`tests/unit/credit-notes.test.ts`):

- saldo após aplicar, após reembolsar, após remover aplicação;
- fechamento automático quando saldo = 0;
- bloqueio de anular/excluir com aplicação ou reembolso;
- R8: rejeitar aplicação acima do saldo da nota e acima da falta pagar da fatura;
- status da fatura com crédito parcial e com crédito total.

RLS (`tests/rls/credit-notes.test.ts`):

- tenant A não lê nem aplica nota do tenant B;
- aplicação com fatura de outro cliente é rejeitada;
- portal só vê notas da própria empresa e sem `admin_note`.

## 7. Fora de escopo

- Estorno automático em gateway (entra com cobrança).
- Nota de crédito fiscal / NFS-e.
- Conversão de nota em outro documento (o Perfex não tem).
- Carta de crédito para uso futuro fora de fatura (o Perfex só aplica em fatura).
