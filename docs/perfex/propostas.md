# Propostas — especificação de porte (Perfex 3.4.1 → Orbit)

> Fase 2 do plano C. Evidências em `perfex crm/` (extração 3.4.1).
> Relacionado: [`paridade-perfex-3.4.1.md`](../paridade-perfex-3.4.1.md) (§3, P0),
> [`notas-de-credito.md`](notas-de-credito.md), [`recorrencia.md`](recorrencia.md),
> [`catalogo-de-itens.md`](catalogo-de-itens.md).

## 1. O que é (e por que é P0)

Orçamento responde "quanto custa". **Proposta** é o documento comercial que o cliente **aceita ou
recusa**, com assinatura e registro de quem aceitou, quando e de onde. Hoje o Orbit para no
orçamento: não há prova de aceite, e o funil não fecha com documento assinado.

## 2. Como o Perfex faz

### 2.1 Dados

| Grupo         | Campos de `tblproposals`                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Identificação | `subject`, `content` (texto rico), `number`, `prefix`, `number_format`, `formatted_number`, `hash`, `short_link`           |
| Partes        | `rel_type` (`customer` ou `lead`), `rel_id`, `proposal_to`, `email`, `phone`, `address`, `city`, `state`, `zip`, `country` |
| Valores       | `currency`, `subtotal`, `discount_*`, `total_tax`, `adjustment`, `total`, `show_quantity_as`                               |
| Ciclo         | `date`, `datecreated`, `open_till`, `status`, `pipeline_order`, `is_expiry_notified`                                       |
| Responsável   | `addedfrom`, `assigned` (vendedor)                                                                                         |
| Aceite        | `acceptance_firstname`, `acceptance_lastname`, `acceptance_email`, `acceptance_date`, `acceptance_ip`, `signature`         |
| Conversão     | `estimate_id`, `invoice_id`, `date_converted`                                                                              |
| Portal        | `allow_comments`, `is_expiry_notified`                                                                                     |

Itens ficam em `tblitemable` com `rel_type = 'proposal'` e impostos em `tblitem_tax`.
Comentários em `tblproposal_comments`.

### 2.2 Status

`1 aberta · 2 aceita · 3 recusada · 4 enviada · 5 revisada · 6 rascunho`.
O pipeline usa a ordem **rascunho → enviada → aberta → revisada → aceita → recusada**.

- Salvar como rascunho mantém 6; enviar por e-mail promove 6 → 4.
- Reabrir uma proposta vencida empurra `open_till` para +7 dias.

### 2.3 Link público e aceite

`Proposal::index($id, $hash)` — **sem login** para lead, com login para cliente.
O aceite (`accept_proposal`):

1. `mark_action_status(3)` — só os status **aceita (2)** e **recusada (3)** podem vir do cliente;
   qualquer outro é revertido.
2. Desenha a assinatura em canvas → PNG salvo em `uploads/proposals/{id}`.
3. Grava `get_acceptance_info_array()`: nome, sobrenome, e-mail, data/hora e **IP**.
4. Se `proposal_auto_convert_to_invoice_on_client_accept = 1`, gera a fatura e redireciona para ela.
5. Notifica criador e responsável; envia e-mail de "aceita" para cliente e equipe.

Recusar (3) segue o mesmo caminho, sem assinatura, com e-mail para a equipe.

### 2.4 Seleção de itens pelo cliente

Na view pública, cada item tem checkbox (`item_selection_changed`): o cliente escolhe o que quer e o
total é recalculado no servidor. **Porém** a conversão em fatura copia **todos** os itens, ignorando
a seleção — o desconto combinado no aceite não chega à fatura. É um buraco a corrigir no porte.

### 2.5 Conversão e lembretes

- `convert_to_invoice`: exige `rel_type = customer`, copia itens, desconto, ajuste, moeda e
  vendedor; usa `invoice_due_after`; nasce não paga.
- `convert_to_estimate`: caminho equivalente.
- `send_expiry_reminder`: envia e-mail ao cliente e marca `is_expiry_notified` antes do envio
  (para não repetir se falhar).
- Visualizações são rastreadas (`tblviews_tracking`).

## 3. Regras a portar (com as correções)

| #   | Regra                                            | Perfex                   | Orbit deve                         |
| --- | ------------------------------------------------ | ------------------------ | ---------------------------------- |
| R1  | Proposta para **cliente ou lead**                | ✅                       | ✅ (`company_id` ou `lead_id`)     |
| R2  | Link público com token, sem login                | ✅                       | ✅ (reusar `document_links`)       |
| R3  | Aceite grava nome, e-mail, data, IP e assinatura | ✅                       | ✅ (+ `user_agent`)                |
| R4  | Só aceitar/recusar do lado do cliente            | ✅                       | ✅ imposto no servidor             |
| R5  | Converter em fatura/orçamento                    | ✅                       | ✅                                 |
| R6  | Conversão respeita a seleção de itens            | ❌                       | ✅ **corrigir**                    |
| R7  | Lembrete de expiração único                      | ✅                       | ✅                                 |
| R8  | Comentários no link público                      | ✅ (se `allow_comments`) | ✅                                 |
| R9  | Rastrear visualizações                           | ✅                       | ✅                                 |
| R10 | Rascunho não aparece no portal                   | ✅ por status            | ✅                                 |
| R11 | Aceite após `open_till`                          | permitido                | bloquear por padrão (configurável) |
| R12 | Auto-converter em fatura ao aceitar              | opcional                 | ✅ opção por tenant                |

## 4. Proposta para o Orbit

### 4.1 Banco

```sql
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  company_id uuid,
  lead_id uuid references public.leads (id) on delete set null,
  project_id uuid,
  number integer not null,
  prefix text not null,
  formatted_number text not null,
  subject text not null,
  content text,
  status smallint not null default 6 check (status between 1 and 6),
  date date not null default current_date,
  open_till date,
  currency text not null default 'BRL',
  subtotal numeric(15,2) not null default 0,
  discount_type text not null default 'before_tax'
    check (discount_type in ('before_tax', 'after_tax')),
  discount_percent numeric(5,2),
  discount_total numeric(15,2) not null default 0,
  total_tax numeric(15,2) not null default 0,
  adjustment numeric(15,2) not null default 0,
  total numeric(15,2) not null default 0,
  assigned_to uuid references public.profiles (id) on delete set null,
  allow_comments boolean not null default true,
  acceptance_firstname text,
  acceptance_lastname text,
  acceptance_email text,
  acceptance_date timestamptz,
  acceptance_ip text,
  acceptance_user_agent text,
  signature_path text,
  accepted_at timestamptz,
  declined_at timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  is_expiry_notified boolean not null default false,
  converted_invoice_id uuid,
  converted_estimate_id uuid,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint proposals_party_check check (
    (company_id is not null and lead_id is null)
    or (company_id is null and lead_id is not null)
  ),
  constraint proposals_company_fk foreign key (company_id, tenant_id)
    references public.companies (id, tenant_id) on delete cascade
);
```

- `document_items.rel_type` passa a aceitar `'proposal'` e ganha `is_selected boolean default true`.
- `document_links.rel_type` passa a aceitar `'proposal'` (token público, já existe a infraestrutura).
- `comments.entity_type` passa a aceitar `'proposal'` (discussão no link público).
- `tenants`: `proposal_prefix` (default `PROP-`) e `next_proposal_number`.

### 4.2 Server actions (`src/server/actions/proposals.ts`)

| Action                                                     | Regra                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `createProposalAction`                                     | numera via `next_document_number('proposal')`; status 6 (rascunho) ou 1 |
| `updateProposalAction`                                     | bloqueado se status 2/3 (decidida)                                      |
| `sendProposalAction`                                       | e-mail com PDF; se status 6 → 1/4; gera token se não existir            |
| `duplicateProposalAction`                                  | copia itens e conteúdo; novo número                                     |
| `deleteProposalAction`                                     | bloqueado se convertida                                                 |
| `convertProposalToInvoiceAction`                           | **só itens `is_selected`**; nasce não paga                              |
| `convertProposalToEstimateAction`                          | idem                                                                    |
| `addProposalCommentAction` / `deleteProposalCommentAction` | comentário interno ou público                                           |
| `acceptProposalAction` (pública)                           | valida token, status e `open_till`; grava aceite + assinatura           |
| `declineProposalAction` (pública)                          | valida token e status                                                   |

### 4.3 Link público (`/p/[token]`)

Rota pública como `/d/[token]`, com layout próprio: cabeçalho da empresa, `subject`, `content`,
itens (com checkbox se o tenant permitir seleção), totais, `open_till`, botões **Aceitar** e
**Recusar**, área de assinatura (canvas) e comentários.

Assinatura: PNG em `proposals/{id}/signature.png` no bucket de documentos, com caminho gravado;
o registro legal é o conjunto `aceite (nome, e-mail, data, IP, UA) + PNG`.

### 4.4 Interface interna

- `/app/propostas` — lista + kanban por status (arrastar muda status, como leads/tarefas).
- `/app/propostas/[id]` — editor (conteúdo, itens, desconto, validade, responsável), prévia do link
  público, histórico (enviada, visualizada, aceita/recusada), botões converter/enviar/duplicar.
- No portal: lista de propostas (Perfex tem) com status e link.

### 4.5 Validação (Zod)

`proposalSchema`: `company_id` **ou** `lead_id` (exclusivo), `subject` (1–200), `content?`, `date`,
`open_till >= date`, itens ≥ 1, `discount_type`, `discount_percent?` (0–100), `adjustment?`,
`allow_comments`, `assigned_to?`.
`acceptProposalSchema`: `token`, `firstname`, `lastname`, `email`, `signature` (data URL, ≤ 512 KB).

## 5. Decisões que precisam do seu aval

1. **Peso legal da assinatura**: PNG desenhado + IP/UA é o que o Perfex faz. Se você precisa de
   validade jurídica forte, o caminho é provedor de assinatura (Assinafy/Clicksign/DocuSign) — muda
   o escopo. Recomendo começar como o Perfex e deixar o provedor como evolução.
2. **Seleção de itens pelo cliente**: portar (com a correção R6) ou deixar o cliente só aceitar o
   todo? Recomendo portar: é o que diferencia proposta de orçamento em negociação.
3. **Conteúdo rico**: o Perfex usa editor WYSIWYG. O Orbit não tem editor rico hoje; proponho
   Markdown com prévia por enquanto.
4. **Aceite vencido**: bloquear (recomendado) ou permitir com aviso.
5. **Auto-converter em fatura no aceite**: opção por tenant (recomendado) ou sempre manual.

## 6. Testes

Unitários (`tests/unit/proposals.test.ts`):

- token inválido/expirado não aceita;
- aceite grava os seis campos e não aceita duas vezes;
- recusa não gera assinatura;
- conversão copia **apenas** itens selecionados;
- status 6 não aparece no link público;
- lembrete de expiração envia uma vez só.

RLS (`tests/rls/proposals.test.ts`):

- tenant A não lê proposta do B;
- token de A não abre proposta de B (rota pública filtra por token);
- comentário público não expõe comentário interno.

## 7. Fora de escopo

- Assinatura com provedor externo (Clicksign etc.).
- Templates de proposta por segmento (o Perfex tem `tbltemplates`; entra depois).
- Solicitação de orçamento (estimate request) — outro item da paridade.
- Follow-up automático de proposta em negociação (existe como addon).
