# Catálogo de itens — especificação de porte (Perfex 3.4.1 → Orbit)

> Fase 2 do plano C. Evidências em `perfex crm/` (extração 3.4.1).
> Relacionado: [`paridade-perfex-3.4.1.md`](../paridade-perfex-3.4.1.md) (§3, P0),
> [`notas-de-credito.md`](notas-de-credito.md), [`recorrencia.md`](recorrencia.md).

## 1. O que é (e por que é P0)

Hoje toda linha de orçamento/fatura é digitada do zero: descrição, quantidade, valor e imposto.
O Perfex tem um catálogo simples (produtos e serviços) que preenche a linha com um clique e serve de
base para o seletor com busca. Sem ele, o atrito aparece em todo documento emitido.

## 2. Como o Perfex faz

### 2.1 Dados

| Tabela            | Campos                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------- |
| `tblitems`        | `description`, `long_description`, `rate`, `tax`, `tax2`, `unit`, `group_id`           |
| `tblitems_groups` | `name`                                                                                 |
| `tblitem_tax`     | impostos aplicados por linha de documento (`taxname`, `taxrate`, `rel_type`, `rel_id`) |

- `tax` e `tax2` são **referências ao catálogo de impostos** (`tbltaxes`), legado de duas alíquotas.
- Item tem campos personalizados (`fieldto = 'items'` e `'items_pr'`).
- Não há distinção de tipo produto/serviço: é tudo item.

### 2.2 Funcionalidades

| Função               | Onde                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| CRUD                 | `admin/Invoice_items.php::manage`                                                              |
| Grupos (CRUD)        | `add_group`, `update_group`, `delete_group`                                                    |
| Duplicar item        | `Invoice_items::copy` → `Invoice_items_model::copy`                                            |
| Busca (AJAX)         | `Invoice_items::search` → `Invoice_items_model::search($q)`                                    |
| Importar CSV         | `Invoice_items::import` (biblioteca `import/import_items`, com simulação e download de modelo) |
| Excluir em massa     | `Invoice_items::bulk_action`                                                                   |
| Seleção no documento | `get_grouped()` se o total de itens ≤ `ajax_on_total_items()`, senão busca AJAX                |
| Preencher linha      | `get_item_by_id` devolve descrição, valor, unidade, impostos e campos personalizados           |

### 2.3 Regras observadas

- Excluir grupo **não** move os itens: eles ficam com `group_id` órfão (o Perfex não reatribui).
- Item não tem estoque, preço por cliente nem preço por moeda.
- O valor do item é copiado para a linha no momento da escolha — mudar o catálogo depois **não**
  altera documentos existentes.
- Imposto do item é sugerido, mas o documento pode sobrescrever por linha.

## 3. Regras a portar (com as correções)

| #   | Regra                                                                | Perfex | Orbit deve                                                |
| --- | -------------------------------------------------------------------- | ------ | --------------------------------------------------------- |
| R1  | CRUD com grupo, descrição, descrição longa, valor, unidade e imposto | ✅     | ✅                                                        |
| R2  | Escolher item preenche a linha sem alterar documentos existentes     | ✅     | ✅ (+ `item_id` na linha para rastrear origem)            |
| R3  | Busca por texto no seletor                                           | ✅     | ✅                                                        |
| R4  | Duplicar item                                                        | ✅     | ✅                                                        |
| R5  | Importar CSV com simulação                                           | ✅     | ✅ (reaproveitar o importador de clientes/leads)          |
| R6  | Excluir grupo trata itens órfãos                                     | ❌     | ✅ pede para escolher: mover para "Sem grupo" ou bloquear |
| R7  | Item desativado não aparece no seletor                               | ❌     | ✅ flag `active`                                          |
| R8  | Preço congelado na linha                                             | ✅     | ✅ (já é assim em `document_items`)                       |

## 4. Proposta para o Orbit

### 4.1 Banco

```sql
create table public.item_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  group_id uuid references public.item_groups (id) on delete set null,
  description text not null,
  long_description text,
  rate numeric(15,2) not null default 0,
  purchase_price numeric(15,2),
  unit text,
  tax_name text,
  tax_rate numeric(15,2),
  active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.document_items
  add column if not exists item_id uuid references public.items (id) on delete set null;
```

`item_id` é só rastreabilidade: continua valendo o que está na linha, mesmo se o item mudar.
`purchase_price` entrou depois da leitura do addon `Inventory`, que separa preço de compra do preço
de venda (`rate`) desde o início — é o campo que permite calcular margem sem inventar número.
Imposto fica em texto (`tax_name`/`tax_rate`) para casar com `document_items`; quando o catálogo de
impostos entrar (item "Multi-moeda e impostos configuráveis"), o item passa a apontar para o imposto.

### 4.2 Server actions (`src/server/actions/items.ts`)

| Action                                                                      | Regra                                                        |
| --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `createItemAction` / `updateItemAction`                                     | valida com Zod; `rate >= 0`                                  |
| `deleteItemAction`                                                          | soft delete; documentos existentes não mudam                 |
| `duplicateItemAction`                                                       | copia com sufixo "(cópia)"                                   |
| `createItemGroupAction` / `updateItemGroupAction` / `deleteItemGroupAction` | excluir grupo exige decisão sobre os itens                   |
| `importItemsAction`                                                         | CSV com simulação, reaproveitando `server/actions/import.ts` |
| `searchItemsAction`                                                         | usado pelo seletor (limite 20)                               |

Leitura por `src/server/queries/items.ts`.

### 4.3 Interface

- `/app/itens` — lista com busca, filtro por grupo, ações (editar, duplicar, excluir) e importar CSV.
- `/app/itens/grupos` — CRUD de grupos com contagem de itens.
- No editor de linha (`document-items-editor.tsx`): botão **"Do catálogo"** abre um combobox com
  busca; ao escolher, preenche descrição, valor, unidade e imposto e grava `item_id`.
  O editor continua aceitando linha livre.
- Em configurações: prefixo e numeração não se aplicam (item não tem número).

### 4.4 Validação (Zod)

`itemSchema`: `description` (1–200), `long_description?`, `rate >= 0`, `unit?`,
`tax_rate` (0–100) e `tax_name?` (par: um sem o outro é erro), `group_id?`, `active`.

## 5. Decisões que precisam do seu aval

1. **Imposto no item**: texto livre (proposto, alinhado ao modelo atual) ou esperar o catálogo de
   impostos e já nascer com FK? Se o catálogo de impostos entrar em seguida, vale fazer junto.
2. **Produto x serviço**: o Perfex não separa. Recomendo não separar agora; um campo `kind` só faz
   sentido com estoque.
3. **Preço por moeda**: o Orbit ainda é moeda única por documento. Se multi-moeda entrar, o item
   precisa de tabela de preços — fica fora deste corte.
4. **Importação CSV**: entrar na primeira versão ou depois? É barato reaproveitar o importador, mas
   adiciona superfície de teste.

## 6. Testes

Unitários (`tests/unit/items.test.ts`):

- item escolhido preenche a linha e grava `item_id`;
- alterar o item depois não muda documento emitido;
- excluir grupo com itens respeita a decisão (mover ou bloquear);
- importação CSV: linha inválida não grava nada em modo simulação.

RLS (`tests/rls/items.test.ts`):

- tenant A não lê item do B;
- item de outro tenant não pode ser usado em documento (FK + checagem de tenant).

## 7. Fora de escopo

- Estoque, fornecedor e compra (addons `Inventory` / `purchase-management`).
- Preço por cliente ou por contrato.
- Imagem do item e catálogo público.
