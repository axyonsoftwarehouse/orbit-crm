# Fatura recorrente — especificação de porte (Perfex 3.4.1 → Orbit)

> Fase 2 do plano C. Evidências em `perfex crm/` (extração 3.4.1).
> Relacionado: [`paridade-perfex-3.4.1.md`](../paridade-perfex-3.4.1.md) (§3, P0),
> [`notas-de-credito.md`](notas-de-credito.md).

## 1. O que é (e por que é P0)

Contrato mensal é o modelo padrão de agência. Hoje o Orbit só emite fatura avulsa: o usuário
recria a mesma fatura todo mês, com os mesmos itens e datas. O Perfex resolve com **campos na
própria fatura** + um cron diário que **duplica** a fatura na data certa.

## 2. Como o Perfex faz

### 2.1 Configuração (na fatura)

| Campo                 | Papel                                    |
| --------------------- | ---------------------------------------- |
| `recurring`           | quantidade do intervalo (ex.: 1)         |
| `recurring_type`      | `DAY`, `WEEK`, `MONTH`, `YEAR`           |
| `custom_recurring`    | 0 força `MONTH` (ignora o tipo)          |
| `cycles`              | quantas repetições (0 = infinito)        |
| `total_cycles`        | quantas já foram geradas                 |
| `last_recurring_date` | âncora do próximo cálculo                |
| `is_recurring_from`   | id da fatura original (na fatura gerada) |

A recorrência mora **na fatura original** e não é copiada para as filhas — só a original gera.

### 2.2 Cron (`Cron_model::recurring_invoices`)

Roda uma vez por dia, na hora configurada (`invoice_auto_operations_hour`):

1. Seleciona faturas com `recurring != 0`, `(cycles != total_cycles OR cycles = 0)` e `status != 6`
   (rascunho). Se `invoices_create_invoice_from_recurring_only_on_paid_invoices = 1`, só as pagas.
2. `próxima = (last_recurring_date ?? date) + recurring recurring_type` (MONTH se `custom_recurring = 0`).
3. Se `hoje >= próxima`: gera uma fatura nova e atualiza a original
   (`last_recurring_date = próxima`, `total_cycles += 1`).
4. A fatura nova copia cliente, itens e impostos, desconto, ajuste, moeda, projeto, termos, nota do
   cliente, tags, campos personalizados e modos de pagamento permitidos. `adminnote` vai vazio.
5. Vencimento: mantém a **distância** entre data e vencimento da original; se não houver, usa
   `invoice_due_after` dias.
6. Status conforme `new_recurring_invoice_action`: `generate_and_send` (não paga + envia),
   `generate_unpaid` (não paga), `generate_draft` (rascunho).
7. Envia um resumo por e-mail para o criador, o vendedor e os admins.

### 2.3 Comportamento observado (e o que ele custa)

| Situação                | O que o Perfex faz                                              | Consequência                           |
| ----------------------- | --------------------------------------------------------------- | -------------------------------------- |
| Cron ficou 3 dias fora  | gera **uma** fatura, com data da primeira pendência             | as outras duas nunca aparecem          |
| Template editado depois | próximas faturas usam os itens **atuais** da original           | muda o passado contratual sem registro |
| Pausar recorrência      | `recurring = 0` (apaga a configuração)                          | perde histórico e cycles               |
| Repetir no mesmo dia    | sem trava; o avanço de `last_recurring_date` evita duplicar     | ok, mas depende da ordem               |
| Fatura original paga    | continua gerando (a menos que a opção "só pagas" esteja ligada) | ok                                     |

## 3. Regras a portar (com as correções)

| #   | Regra                                                 | Perfex | Orbit deve                                   |
| --- | ----------------------------------------------------- | ------ | -------------------------------------------- |
| R1  | Intervalo em dias/semanas/meses/anos                  | ✅     | ✅                                           |
| R2  | Ciclos finitos (`cycles`), 0 = infinito               | ✅     | ✅                                           |
| R3  | Faturas geradas copiam itens/impostos/desconto/ajuste | ✅     | ✅                                           |
| R4  | Vencimento herdado como deslocamento                  | ✅     | ✅                                           |
| R5  | Ação ao gerar: rascunho / não paga / enviar           | ✅     | ✅                                           |
| R6  | Só a origem recorre (filhas não recorrem)             | ✅     | ✅ (via `recurrence_id`)                     |
| R7  | Cron diário                                           | ✅     | ✅ (`/api/cron/invoices`)                    |
| R8  | Recuperar períodos perdidos                           | ❌     | ✅ gera todos os pendentes (cap 12/execução) |
| R9  | Idempotência por período                              | ❌     | ✅ `unique (recurrence_id, period_start)`    |
| R10 | Pausar/retomar sem perder configuração                | ❌     | ✅ `status = paused/active`                  |
| R11 | Template editável sem afetar o histórico              | ❌     | ✅ snapshot no momento da criação            |
| R12 | Fuso do tenant na data de geração                     | global | ✅ `tenant timezone`                         |

## 4. Proposta para o Orbit

### 4.1 Banco

```sql
create table public.invoice_recurrences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  company_id uuid,
  title text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'finished')),
  interval_count integer not null default 1 check (interval_count > 0),
  interval_unit text not null default 'month'
    check (interval_unit in ('day', 'week', 'month', 'year')),
  starts_on date not null,
  next_run_on date not null,
  due_days integer,                       -- vencimento em dias a partir da emissão
  cycles integer not null default 0,      -- 0 = infinito
  cycles_done integer not null default 0,
  template jsonb not null,                -- snapshot: itens, desconto, ajuste, notas, termos
  action text not null default 'draft' check (action in ('draft', 'unpaid', 'send')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.invoices
  add column if not exists recurrence_id uuid references public.invoice_recurrences (id) on delete set null,
  add column if not exists recurrence_period date;

create unique index if not exists invoices_recurrence_period_key
  on public.invoices (recurrence_id, recurrence_period)
  where recurrence_id is not null;

alter table public.invoice_recurrences
  add constraint invoice_recurrences_company_fk foreign key (company_id, tenant_id)
  references public.companies (id, tenant_id) on delete set null (company_id);
```

**Por que tabela própria e não colunas na fatura** (como o Perfex): permite pausar, versionar o
template, guardar o período gerado (idempotência) e não polui a fatura com sete colunas que só
duas linhas usam. O custo é uma tabela a mais e o snapshot dos itens.

### 4.2 Geração (cron)

`GET /api/cron/invoices` (Vercel, diário, protegido por `CRON_SECRET` como os outros):

```text
para cada recorrência active com next_run_on <= hoje (no fuso do tenant):
  gera fatura para cada período pendente (até 12)
  marca recurrence_period (data de referência do período)
  next_run_on += intervalo; cycles_done += 1
  se cycles > 0 e cycles_done >= cycles: status = finished
  action = send  → envia e-mail com PDF
  action = draft → status 6; senão status 1
```

Idempotente: se o cron rodar duas vezes, o índice único impede duplicata (erro tratado como "já
gerado").

### 4.3 Server actions (`src/server/actions/recurrences.ts`)

| Action                                             | Regra                                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `createRecurrenceAction`                           | exige `company_id`, itens ≥ 1, data inicial; grava snapshot; `next_run_on = starts_on` |
| `updateRecurrenceAction`                           | só template e agendamento; nunca reescreve faturas já geradas                          |
| `pauseRecurrenceAction` / `resumeRecurrenceAction` | alterna `active`/`paused`; ao retomar, recalcula a próxima data (não gera retroativo)  |
| `deleteRecurrenceAction`                           | soft delete; faturas geradas ficam                                                     |
| `runRecurrenceNowAction`                           | gera um período manualmente (útil para teste e para antecipar)                         |

Todas exigem owner/admin, como as de fatura.

### 4.4 Interface

- `/app/recorrencias` — lista com status, próximo vencimento, ciclos (feitos/total), cliente e valor.
- `/app/recorrencias/[id]` — template (itens somente leitura + "editar template"), histórico de
  faturas geradas, botões pausar/retomar, gerar agora, excluir.
- Na fatura gerada: selo "recorrente" com link para a recorrência.
- No portal: nada específico (a fatura aparece normalmente).

### 4.5 Validação (Zod)

`recurrenceSchema`: `company_id`, `title`, `interval_count` (1–60), `interval_unit`, `starts_on`,
`due_days?` (0–120), `cycles?` (0–999), `action`, `items` (mesmo item de fatura), desconto/ajuste,
`client_note?`, `terms?`.

## 5. Decisões que precisam do seu aval

1. **Snapshot x referência**: guardar os itens no momento da criação (recomendado) ou ler sempre da
   última fatura? Snapshot é previsível; referência é mais barato e é o que o Perfex faz.
2. **Recuperação de períodos**: gerar todos os pendentes (recomendado, cap 12) ou um por execução
   (Perfex)?
3. **Cobrança automática**: esta especificação é de **emissão** de fatura. Baixa automática por
   gateway continua no item "Cobrança automática" do roadmap.
4. **Recorrência por contrato**: amarrar a recorrência a um contrato (gera fatura enquanto o
   contrato estiver vigente) é uma extensão natural, mas fica fora deste corte.

## 6. Testes

Unitários (`tests/unit/recurrences.test.ts`):

- próxima data para dia/semana/mês/ano (incluindo 31/01 + 1 mês);
- geração de 3 períodos pendentes em uma execução;
- idempotência: rodar duas vezes não duplica;
- `cycles` finito encerra em `finished`;
- pausa não gera; retomar não gera retroativo;
- vencimento herdado corretamente.

RLS (`tests/rls/recurrences.test.ts`):

- tenant A não lê nem edita recorrência do B;
- fatura gerada nasce com o `tenant_id` da recorrência.

## 7. Fora de escopo

- Assinaturas com gateway (Stripe/Mercado Pago) — item separado do roadmap.
- Recorrência de despesas (o Perfex tem; fica para o módulo financeiro).
- Recorrência de tarefas.
