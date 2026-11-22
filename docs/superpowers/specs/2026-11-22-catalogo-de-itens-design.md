# Catálogo de itens e serviços (paridade Perfex 3.4.1)

> Spec de referência do Perfex: [`docs/perfex/catalogo-de-itens.md`](../../perfex/catalogo-de-itens.md).
> Item de roadmap: "Catálogo de itens e serviços" (migration `0059`).

## Por quê

Hoje toda linha de orçamento e fatura é digitada do zero. Quem emite o mesmo serviço
toda semana redigita descrição, valor, unidade e imposto, e digita o imposto errado
uma vez a cada tanto. Um catálogo por tenant resolve o atrito e é pré-requisito de
propostas e fatura recorrente.

## Decisões (aprovadas com o usuário)

1. **Seletor busca no cliente**: a página carrega os itens ativos do tenant (1 query)
   e o combobox filtra localmente. Sem `searchItemsAction`, sem debounce. Se algum
   tenant chegar a milhares de itens, trocamos por busca no servidor depois.
2. **CSV com prévia no cliente**: o diálogo lê o arquivo, usa um módulo puro
   (`src/lib/items/import.ts`) para mapear/validar e mostra a tabela de prévia com
   erros por linha. A action recebe as linhas em JSON e **revalida tudo com Zod** —
   a prévia é só UI; a verdade é do servidor. Uma submissão, sem re-upload.
3. **Imposto como texto** (`tax_name` + `tax_rate`), alinhado a `document_items`;
   quando o catálogo de impostos entrar, o item passa a apontar para ele.
4. **Sem produto x serviço, sem preço por moeda, sem limite de plano** para itens.
5. **Grupos em sub-rota** `/app/itens/grupos`.
6. **Integridade também no banco** (não só na action), seguindo o precedente da
   `0052`: grupo com itens não pode ser apagado (`on delete restrict`) e
   `group_id`/`item_id` não aceitam referência de outro tenant (FK composta e
   policy).
7. **`tax_name` não aparece no editor nem no PDF**: o editor mantém só "Imp. %" e
   o documento guarda o nome para o futuro catálogo de impostos (mesmo
   comportamento do PDF atual, que imprime apenas a alíquota).
8. **`replaceDocumentItems` passa a inserir antes de apagar** e a devolver erro:
   hoje ele apaga as linhas antigas e ignora a falha do insert, o que deixa o
   documento sem itens em silêncio.

## Objetivos

1. **CRUD de itens** em `/app/itens`: descrição, descrição longa, grupo, valor,
   preço de compra (opcional), unidade, imposto (nome + %) e ativo/inativo. Busca por
   texto, filtro por grupo e por situação, com paginação.
2. **CRUD de grupos** em `/app/itens/grupos`, com contagem de itens. Excluir grupo com
   itens exige decisão: mover os itens para outro grupo (ou "Sem grupo") ou cancelar.
3. **Duplicar item**: copia todos os campos com sufixo " (cópia)" na descrição,
   truncando se necessário para caber em 200 caracteres.
4. **Do catálogo no editor de linha** (`DocumentItemsEditor`), usado por orçamentos e
   faturas: botão abre painel com busca; escolher um item acrescenta uma linha
   preenchida (descrição, valor, unidade, imposto) com `item_id`. A linha continua
   editável e o editor continua aceitando linha livre.
5. **Importação CSV** com prévia, download de modelo e relatório final.
6. **Rastreabilidade sem acoplamento**: `document_items.item_id` guarda a origem, mas
   alterar o item **não** altera documento emitido (os valores da linha são cópia).

## Modelo de dados (migration `0064`)

```sql
create table public.item_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name),
  unique (id, tenant_id) -- alvo da FK composta de items.group_id
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  group_id uuid,
  description text not null,
  long_description text,
  rate numeric(15, 2) not null default 0 check (rate >= 0),
  purchase_price numeric(15, 2) check (purchase_price >= 0),
  unit text,
  tax_name text,
  tax_rate numeric(15, 2) check (tax_rate >= 0 and tax_rate <= 100),
  active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- impede grupo de outro tenant; null não é checado (MATCH SIMPLE)
  foreign key (group_id, tenant_id)
    references public.item_groups (id, tenant_id) on delete restrict
);

create index items_tenant_active_idx on public.items (tenant_id, description)
  where deleted_at is null;
create index items_group_idx on public.items (tenant_id, group_id);

alter table public.document_items
  add column if not exists item_id uuid references public.items (id) on delete set null;
```

- RLS nas duas tabelas com o padrão do projeto: `select`/`insert`/`update`/`delete`
  para `authenticated` usando/checando `public.is_tenant_member(tenant_id)`.
- `items`: `delete` só `owner`/`admin` (`has_tenant_role`) e trigger
  `protect_soft_delete` (da `0052`) para bloquear `deleted_at` de membro comum.
- **Isolamento do `item_id`**: a FK não garante tenant. `document_items_insert` e
  `document_items_update` passam a exigir
  `item_id is null or exists (select 1 from public.items i where i.id = item_id and i.tenant_id = document_items.tenant_id)`.
- Migration `0065` marca o item de roadmap como `in_progress` (mesmo padrão da `0063`).

**Descrição longa (decidido):** fica só no catálogo — cadastro, lista e texto
secundário no seletor. Não vai para a linha do documento nem para o PDF neste corte;
propostas podem usá-la depois.

## Servidor

`src/server/queries/items.ts`

- `listItemsPage(tenantId, { page, pageSize, search, groupId, active })` → `{ rows, total }`,
  com o grupo embutido (`group:item_groups(id, name)`).
- `listItemGroups(tenantId)` → grupos + `count` de itens ativos/não excluídos.
- `listItemOptions(tenantId)` → itens ativos não excluídos (id, descrição, valor,
  unidade, imposto, grupo) para o seletor do editor.
- `getItem(tenantId, id)`.

`src/server/actions/items.ts` (todas revalidam tenant e checagem de papel)

| Action                   | Regra                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `createItemAction`       | Zod; `rate >= 0`; par imposto completo ou vazio                                            |
| `updateItemAction`       | idem; documentos existentes não mudam                                                      |
| `deleteItemAction`       | soft delete (`deleted_at`), exige `isManager`                                              |
| `duplicateItemAction`    | sufixo " (cópia)"                                                                          |
| `toggleItemActiveAction` | alterna `active`                                                                           |
| `createItemGroupAction`  | nome único por tenant (mensagem amigável no conflito)                                      |
| `updateItemGroupAction`  | idem                                                                                       |
| `deleteItemGroupAction`  | com itens exige `mode=move` + `target_group_id` (vazio = sem grupo); sem escolha, bloqueia |
| `importItemsAction`      | recebe `rows` JSON, revalida com Zod, grava grupos novos e itens, deduplica                |

`src/lib/validations/items.ts`: `itemGroupSchema`, `itemSchema` (descrição 1–200,
descrição longa ≤ 5000, `rate >= 0`, `purchase_price` opcional `>= 0`, unidade ≤ 50,
`tax_rate` 0–100, `tax_name`/`tax_rate` em par, `group_id` uuid opcional, `active`) e
`importItemRowSchema`.

`src/server/documents.ts` (`replaceDocumentItems`)

- Resolve os `item_id` das linhas contra `items` do tenant antes de gravar; id
  desconhecido ou de outro tenant vira `null` (documento salva; nada de cross-tenant).
- Insere as linhas novas, **depois** apaga as antigas (ids lidos antes do insert). Se
  o insert falhar, devolve erro e as linhas antigas continuam intactas.
- Retorno `{ error: string | null }`; as 6 chamadas (`estimates.ts` ×3,
  `invoices.ts` ×3) passam a devolver `dbError`/mensagem ao usuário.

## Interface

- **`/app/itens`**: cabeçalho com contagem, "Novo item", "Importar CSV" e link para
  grupos; filtros `q`, `group`, `status` via GET; tabela com descrição (+ grupo),
  unidade, valor, imposto, situação e ações (editar, duplicar, excluir). Paginação
  igual a despesas.
- **`/app/itens/grupos`**: tabela nome + itens, criar/renomear; excluir abre diálogo
  pedindo o destino dos itens ou cancelamento.
- **Item picker** (`src/components/app/item-picker.tsx`, client): `Input` de busca +
  lista agrupada por grupo, com preço, unidade e a descrição longa como texto
  secundário (truncada); teclado (setas/Enter/Esc) e clique. Sem resultado mostra
  "Nenhum item ativo encontrado".
- **`DocumentItemsEditor`**: nova coluna "Un." (60px) e botão "Do catálogo" acima da
  grade. A grade passa a ser `1fr 60px 70px 100px 90px 70px 32px`.
- **Diálogo de importação** (`src/app/app/itens/import-items-dialog.tsx`): input de
  arquivo, link "Baixar modelo", prévia com até 50 linhas (situação por linha),
  resumo (válidas, duplicadas, inválidas, grupos novos) e botão "Importar N itens".
- **Navegação**: "Itens" (`Package`) depois de "Faturas" em `nav-items.ts`; atalho
  "Novo item" em `NEW_ITEMS`.

## Importação CSV

Formato (cabeçalho obrigatório, aceita aliases sem acento; delimitador `;` ou `,`
detectado):

| Coluna               | Aliases                   | Regra                                      |
| -------------------- | ------------------------- | ------------------------------------------ |
| `descricao`          | nome, item                | obrigatória, 1–200                         |
| `grupo`              | grupo, categoria          | opcional; nome novo é criado na importação |
| `descricao_longa`    | descricao longa, detalhes | opcional, ≤ 5000                           |
| `valor`              | preco, rate               | ≥ 0; aceita vírgula decimal                |
| `unidade`            | unidade, unit             | opcional, ≤ 50                             |
| `imposto_nome`       | imposto, tax              | opcional; exige percentual                 |
| `imposto_percentual` | aliquota, imposto %       | 0–100; exige nome                          |

Regras: arquivo ≤ 2 MB e ≤ 1000 linhas; duplicado = mesma descrição
(case-insensitive, sem acento) já existente no tenant ou repetida no arquivo → ignora;
linha inválida → erro com número da linha; qualquer linha inválida impede a gravação
inteira (nada é escrito); grupos novos são criados antes dos itens e, se a inserção
dos itens falhar, são removidos. O modelo para download sai do mesmo módulo
(`toCsv` de `src/lib/csv.ts`) com duas linhas de exemplo. A página envia ao diálogo a
lista de descrições existentes (normalizadas) para a prévia marcar duplicados.

## O que não pode acontecer

- Ler, usar ou referenciar item de outro tenant (inclusive via `item_id` forjado).
- Alterar ou excluir item mudar documento já emitido.
- Excluir grupo deixar itens órfãos em silêncio.
- Importação gravar parte das linhas quando alguma é inválida.
- Importação aceitar arquivo acima do limite ou mais de 1000 linhas sem avisar.
- Item desativado aparecer no seletor de linha.

## Fora de escopo

Estoque, fornecedor e compra; preço por cliente/contrato ou por moeda; imagem do item;
catálogo público; campos personalizados de item; catálogo de impostos; reajuste em
massa; histórico de preço.

## Testes

- `tests/unit/items-import.test.ts`: mapeamento com/sem cabeçalho, vírgula decimal,
  aliases, dedupe interno e contra existentes, linha inválida, par de imposto, 1001
  linhas recusadas, modelo gerado.
- `tests/unit/actions-items.test.ts`: create/update com Zod; exclusão exige manager;
  duplicar trunca em 200; excluir grupo com itens exige decisão; importação inválida
  não insere nada; `replaceDocumentItems` anula `item_id` de outro tenant, mantém
  `item_id` válido e, se o insert falhar, preserva as linhas antigas.
- `tests/unit/document-pdf.test.ts` e `actions-estimates-leads`/`actions-invoices`:
  ajustar mocks ao novo retorno de `replaceDocumentItems`.
- `tests/unit/item-picker.test.tsx`: filtra sem acento/caixa, agrupa, não mostra
  inativo, Enter seleciona o primeiro.
- `tests/rls/isolation.test.ts` (novos casos): A não lê/grupo de B; A não insere
  `document_items` com item de B (erro de policy); A insere com item próprio.

## Verificação

```bash
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

`src/lib/database.types.ts` é atualizado à mão no mesmo formato gerado (não há token
local para `npm run db:types`); se o CLI estiver logado, regenerar é preferível.
