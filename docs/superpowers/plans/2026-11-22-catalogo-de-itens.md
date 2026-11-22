# Catálogo de itens e serviços — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cadastro reutilizável de produtos/serviços por tenant, com grupos, duplicação, importação CSV com prévia e um seletor "Do catálogo" que preenche a linha de orçamentos e faturas.

**Architecture:** Duas tabelas novas (`item_groups`, `items`) com RLS e integridade no banco; `document_items.item_id` só rastreia a origem. Um módulo puro (`src/lib/items/import.ts`) mapeia/valida CSV no cliente e é revalidado no servidor pela action. O editor de linha ganha coluna de unidade e um picker que recebe a lista de itens ativos da página.

**Tech Stack:** Next.js 15 (App Router, server actions), Supabase/Postgres com RLS, Zod, Vitest + Testing Library, `parseCsv`/`toCsv` de `src/lib/csv.ts`.

**Spec:** `docs/superpowers/specs/2026-11-22-catalogo-de-itens-design.md`

## Global Constraints

- Migrations novas `0064` e `0065`; nunca editar migration já aplicada.
- Toda action revalida `getActiveMembership()` e o `tenant_id`; IDs vindos do cliente nunca são confiados.
- RLS de leitura/escrita por `public.is_tenant_member(tenant_id)`; hard delete e soft delete de item por `public.has_tenant_role(tenant_id, array['owner','admin'])`.
- Erros de banco com `dbError(contexto, error, mensagem?)`; textos ao usuário em pt-BR.
- Importação: máximo 2 MB e 1000 linhas; nenhuma linha é gravada se qualquer linha for inválida; duplicado é a mesma descrição normalizada (sem acento, minúscula).
- `item_id` de outro tenant nunca entra em `document_items` (vira `null` no servidor; a policy é o backstop).
- Sem dependência nova. `src/lib/database.types.ts` editado à mão (não há token local para `npm run db:types`).
- Antes de fechar: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build`.

## Review Focus

- **CSV com 1001 linhas ou acima de 2 MB** → recusado inteiro, nada gravado (Task 2 e Task 11).
- **Descrição duplicada com acento/caixa** ("Instalação" × "instalacao") → marcada duplicada e ignorada (Task 2).
- **Grupo com itens apagado direto pela API** → banco recusa (`on delete restrict`), não fica órfão (Task 1).
- **`item_id` forjado de outro tenant** → anulado no servidor; insert direto é barrado pela policy (Task 1 e Task 8).
- **Editar item depois de emitido** → documento existente não muda (Task 8; Task 4 garante que update de item não toca `document_items`).
- **Importação com uma linha inválida** → nada é escrito (Task 6).

---

### Task 1: Schema, RLS e tipos

**Files:**

- Create: `supabase/migrations/0064_items_catalog.sql`
- Create: `supabase/migrations/0065_roadmap_items_catalog.sql`
- Modify: `src/lib/database.types.ts` (tabelas `item_groups` e `items`; `document_items.item_id`)
- Test: `tests/rls/isolation.test.ts`

**Interfaces:**

- Produces: tabelas `public.item_groups` (`id`, `tenant_id`, `name`, `created_at`, `updated_at`) e `public.items` (`id`, `tenant_id`, `group_id`, `description`, `long_description`, `rate`, `purchase_price`, `unit`, `tax_name`, `tax_rate`, `active`, `created_by`, `created_at`, `updated_at`, `deleted_at`); coluna `public.document_items.item_id`.

- [ ] **Step 1: Escrever a migration `0064`**

```sql
-- Catálogo de itens e serviços (paridade Perfex 3.4.1)
create table public.item_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name),
  unique (id, tenant_id)
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
  foreign key (group_id, tenant_id)
    references public.item_groups (id, tenant_id) on delete restrict
);

create index items_tenant_description_idx
  on public.items (tenant_id, description) where deleted_at is null;
create index items_group_idx on public.items (tenant_id, group_id);

alter table public.document_items
  add column if not exists item_id uuid references public.items (id) on delete set null;

alter table public.item_groups enable row level security;
alter table public.items enable row level security;

create policy "item_groups_select" on public.item_groups
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "item_groups_insert" on public.item_groups
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "item_groups_update" on public.item_groups
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "item_groups_delete" on public.item_groups
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

create policy "items_select" on public.items
  for select to authenticated using (public.is_tenant_member(tenant_id));
create policy "items_insert" on public.items
  for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy "items_update" on public.items
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));
create policy "items_delete" on public.items
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner', 'admin']));

drop trigger if exists items_protect_soft_delete on public.items;
create trigger items_protect_soft_delete
  before update on public.items
  for each row execute function public.protect_soft_delete();

-- item_id não pode apontar para item de outro tenant
drop policy if exists "document_items_insert" on public.document_items;
create policy "document_items_insert" on public.document_items
  for insert to authenticated
  with check (
    public.is_tenant_member(tenant_id)
    and public.entity_belongs_to_tenant(rel_type, rel_id, tenant_id)
    and (
      item_id is null
      or exists (
        select 1 from public.items i
        where i.id = item_id and i.tenant_id = document_items.tenant_id
      )
    )
  );

drop policy if exists "document_items_update" on public.document_items;
create policy "document_items_update" on public.document_items
  for update to authenticated using (public.is_tenant_member(tenant_id))
  with check (
    public.is_tenant_member(tenant_id)
    and (
      item_id is null
      or exists (
        select 1 from public.items i
        where i.id = item_id and i.tenant_id = document_items.tenant_id
      )
    )
  );
```

- [ ] **Step 2: Escrever a migration `0065`**

```sql
update public.roadmap_items
set status = 'in_progress'
where title = 'Catálogo de itens e serviços';
```

- [ ] **Step 3: Atualizar `src/lib/database.types.ts`**

Adicionar em `Tables`, em ordem alfabética, os blocos `item_groups` e `items` no mesmo formato gerado (`Row`/`Insert`/`Update`/`Relationships`), e `item_id: string | null` em `Row`, `item_id?: string | null` em `Insert`/`Update` de `document_items`.

`item_groups`: `id: string`, `tenant_id: string`, `name: string`, `created_at: string`, `updated_at: string`; `Insert` com `id?`, `created_at?`, `updated_at?`; `Relationships`: `item_groups_tenant_id_fkey` → `tenants`.

`items`: colunas do Step 1 com `number | null` em `rate`/`purchase_price`/`tax_rate`, `boolean` em `active`, `string | null` em `group_id`/`long_description`/`unit`/`tax_name`/`created_by`/`deleted_at`; `Insert` tornando opcionais `id`, `group_id`, `long_description`, `rate`, `purchase_price`, `unit`, `tax_name`, `tax_rate`, `active`, `created_by`, `created_at`, `updated_at`, `deleted_at`; `Relationships`: `items_tenant_id_fkey` → `tenants`, `items_group_id_tenant_id_fkey` → `item_groups`, `items_created_by_fkey` → `profiles`. Em `document_items.Relationships` acrescentar `document_items_item_id_fkey` → `items`.

- [ ] **Step 4: Escrever os testes RLS**

Em `tests/rls/isolation.test.ts`, declarar `let itemGroupAId = ""`/`itemGroupBId = ""`/`itemAId = ""`/`itemBId = ""` e, no `beforeAll`, depois dos `companies`, criar via `admin`:

```ts
const groupA = await admin
  .from("item_groups")
  .insert({ tenant_id: tenantA, name: `Grupo A ${suffix}` })
  .select("id")
  .single()
itemGroupAId = groupA.data!.id
// idem grupo B e:
const itemA = await admin
  .from("items")
  .insert({
    tenant_id: tenantA,
    group_id: itemGroupAId,
    description: `Item A ${suffix}`,
    rate: 10,
  })
  .select("id")
  .single()
itemAId = itemA.data!.id
// idem item B
```

E os casos:

```ts
it("A não lê item nem grupo do tenant B", async () => {
  const item = await clientA.from("items").select("id").eq("id", itemBId)
  const group = await clientA
    .from("item_groups")
    .select("id")
    .eq("id", itemGroupBId)
  expect(item.data).toEqual([])
  expect(group.data).toEqual([])
})

it("A não cria item apontando para grupo de outro tenant", async () => {
  const { error } = await clientA.from("items").insert({
    tenant_id: tenantA,
    group_id: itemGroupBId,
    description: "Cross",
    rate: 1,
  })
  expect(error).not.toBeNull()
})

it("A não apaga grupo com itens", async () => {
  const { error } = await clientA
    .from("item_groups")
    .delete()
    .eq("id", itemGroupAId)
  expect(error).not.toBeNull()
})

it("A não usa item de outro tenant em document_items", async () => {
  const { error } = await clientA.from("document_items").insert({
    tenant_id: tenantA,
    rel_type: "estimate",
    rel_id: estimateAId,
    description: "Cross item",
    qty: 1,
    rate: 1,
    item_id: itemBId,
  })
  expect(error).not.toBeNull()
})

it("A usa o próprio item em document_items", async () => {
  const { error } = await clientA.from("document_items").insert({
    tenant_id: tenantA,
    rel_type: "estimate",
    rel_id: estimateAId,
    description: "Item próprio",
    qty: 1,
    rate: 1,
    item_id: itemAId,
  })
  expect(error).toBeNull()
})
```

- [ ] **Step 5: Verificar**

Run: `npm run typecheck`
Expected: PASSA.

Run (com Docker): `npm run db:start && npm run db:reset` e depois
`eval` das variáveis locais (como no `AGENTS.md`) + `npm run test:rls`.
Expected: todos os casos novos passam; o job `Isolamento RLS` repete no CI.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0064_items_catalog.sql supabase/migrations/0065_roadmap_items_catalog.sql src/lib/database.types.ts tests/rls/isolation.test.ts
git commit -m "feat(items): schema do catálogo com RLS e item_id na linha"
```

### Task 2: Módulo puro de importação CSV

**Files:**

- Create: `src/lib/items/import.ts`
- Test: `tests/unit/items-import.test.ts`

**Interfaces:**

- Consumes: `parseCsv` e `toCsv` de `src/lib/csv.ts`.
- Produces:

```ts
export type ItemImportExisting = { descriptions: string[]; groups: string[] }
export type ItemImportData = {
  description: string
  long_description: string | null
  group: string | null
  rate: number
  unit: string | null
  tax_name: string | null
  tax_rate: number | null
}
export type ItemImportRow = {
  line: number
  status: "ok" | "duplicate" | "invalid"
  message: string | null
  data: ItemImportData | null
}
export const ITEM_IMPORT_MAX_ROWS = 1000
export const ITEM_IMPORT_HEADERS: string[]
export function normalizeItemKey(value: string): string
export function parseItemsCsv(
  text: string,
  existing: ItemImportExisting,
): {
  rows: ItemImportRow[]
  newGroups: string[]
  error: string | null
}
export function itemImportTemplate(): string
```

`normalizeItemKey` = `trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")`.

- [ ] **Step 1: Escrever o teste que falha**

Em `tests/unit/items-import.test.ts` cobrir:

```ts
it("mapeia cabeçalho com aliases e vírgula decimal", () => {
  const csv =
    "Nome;Categoria;Preço;Unidade;Imposto;Alíquota\nInstalação;Serviços;1.234,50;h;ISS;5"
  const result = parseItemsCsv(csv, { descriptions: [], groups: [] })
  expect(result.error).toBeNull()
  expect(result.rows[0]).toMatchObject({
    line: 2,
    status: "ok",
    data: {
      description: "Instalação",
      group: "Serviços",
      rate: 1234.5,
      unit: "h",
      tax_name: "ISS",
      tax_rate: 5,
    },
  })
})

it("marca duplicado por descrição normalizada (arquivo e existentes)", () => {
  const csv = "Descrição\nInstalacao\nInstalação\nManutenção"
  const result = parseItemsCsv(csv, {
    descriptions: ["INSTALAÇÃO"],
    groups: [],
  })
  expect(result.rows.map((row) => row.status)).toEqual([
    "duplicate",
    "duplicate",
    "ok",
  ])
})

it("linha inválida recebe número da linha e motivo", () => {
  const csv = "Descrição;Valor\nOk;10\n;20\nSem valor"
  const result = parseItemsCsv(csv, { descriptions: [], groups: [] })
  expect(result.rows[1]).toMatchObject({ line: 3, status: "invalid" })
  expect(result.rows[2]).toMatchObject({ line: 4, status: "invalid" })
})

it("exige nome e alíquota juntos e alíquota até 100", () => {
  const csv = "Descrição;Imposto;Alíquota\nA;ISS;\nB;ISS;120\nC;;5"
  expect(
    parseItemsCsv(csv, { descriptions: [], groups: [] }).rows.map(
      (r) => r.status,
    ),
  ).toEqual(["invalid", "invalid", "invalid"])
})

it("lista grupos novos sem repetir e ignora os existentes", () => {
  const csv = "Descrição;Grupo\nA;Serviços\nB;Serviços\nC;Licenças"
  const result = parseItemsCsv(csv, { descriptions: [], groups: ["serviços"] })
  expect(result.newGroups).toEqual(["Licenças"])
})

it("recusa mais de 1000 linhas de dados", () => {
  const csv =
    "Descrição\n" +
    Array.from({ length: 1001 }, (_, i) => `Item ${i}`).join("\n")
  expect(parseItemsCsv(csv, { descriptions: [], groups: [] }).error).toMatch(
    /1000/,
  )
})

it("modelo sai com cabeçalho e duas linhas de exemplo", () => {
  const lines = itemImportTemplate().split(/\r?\n/)
  expect(lines).toHaveLength(3)
  expect(lines[0]).toContain("Descrição")
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/items-import.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `src/lib/items/import.ts`**

Regras: cabeçalho obrigatório detectado por `parseCsv` + `normalizeItemKey` (sem cabeçalho → `error: "A primeira linha precisa ser o cabeçalho (Descrição, ...)."`); números com `Number(value.replace(/\./g, "").replace(",", "."))` quando houver vírgula, senão `Number(value)`; opcionais vazios viram `null`; duplicado não entra em `newGroups`; `rate` obrigatório e ≥ 0.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/items-import.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/items/import.ts tests/unit/items-import.test.ts
git commit -m "feat(items): parser de CSV do catálogo com prévia"
```

### Task 3: Queries do catálogo

**Files:**

- Create: `src/server/queries/items.ts`
- Test: `tests/unit/items-queries.test.ts`

**Interfaces:**

- Consumes: `createClient` de `@/lib/supabase/server`.
- Produces:

```ts
export type Item = {
  id: string
  group_id: string | null
  description: string
  long_description: string | null
  rate: number
  purchase_price: number | null
  unit: string | null
  tax_name: string | null
  tax_rate: number | null
  active: boolean
}
export type ItemOption = {
  id: string
  description: string
  long_description: string | null
  rate: number
  unit: string | null
  tax_name: string | null
  tax_rate: number | null
  active: boolean
  group: { id: string; name: string } | null
}
export type ItemListRow = ItemOption
export type ItemGroupOption = { id: string; name: string; count: number }
export type ItemFilters = {
  search?: string
  groupId?: string
  status?: "active" | "inactive" | "all"
}
export async function listItemsPage(
  tenantId: string,
  filters: ItemFilters & { page: number; pageSize: number },
): Promise<{ rows: ItemListRow[]; total: number }>
export async function listItemGroups(
  tenantId: string,
): Promise<ItemGroupOption[]>
export async function listItemOptions(tenantId: string): Promise<ItemOption[]>
export async function listItemDescriptions(tenantId: string): Promise<string[]>
export async function getItem(
  tenantId: string,
  id: string,
): Promise<Item | null>
```

- [ ] **Step 1: Escrever o teste que falha**

`tests/unit/items-queries.test.ts` com `createSupabaseMock`:

```ts
it("filtra por busca sem acento e situação, paginando", async () => {
  const mock = createSupabaseMock({ items: { data: [], error: null } })
  // mocka @/lib/supabase/server para devolver mock.client
  await listItemsPage(TENANT, {
    page: 2,
    pageSize: 20,
    search: "instal",
    groupId: GROUP,
    status: "inactive",
  })
  expect(
    hasCall(mock.callsFor("items")[0]!, "ilike", "description", "%instal%"),
  ).toBe(true)
  expect(hasCall(mock.callsFor("items")[0]!, "eq", "group_id", GROUP)).toBe(
    true,
  )
  expect(hasCall(mock.callsFor("items")[0]!, "eq", "active", false)).toBe(true)
  expect(hasCall(mock.callsFor("items")[0]!, "range", 20, 39)).toBe(true)
})

it("lista opções só ativas e não excluídas", async () => {
  const mock = createSupabaseMock({ items: { data: [], error: null } })
  await listItemOptions(TENANT)
  expect(hasCall(mock.callsFor("items")[0]!, "eq", "active", true)).toBe(true)
  expect(hasCall(mock.callsFor("items")[0]!, "is", "deleted_at", null)).toBe(
    true,
  )
})
```

`listItemGroups` devolve `count` a partir de `items(count)` no select: com
`{ data: [{ id, name, items: [{ count: 3 }] }], error: null }`, o resultado é
`[{ id, name, count: 3 }]`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/items-queries.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `src/server/queries/items.ts`**

Colunas do select: `"id, group_id, description, long_description, rate, purchase_price, unit, tax_name, tax_rate, active, group:item_groups(id, name)"`.
`status === "all"` não filtra `active`; ausente equivale a `"active"`. Busca com `.ilike("description", `%${search}%`)`. Ordem `description`. `listItemDescriptions` seleciona `description` de itens não excluídos e devolve `string[]`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/items-queries.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/queries/items.ts tests/unit/items-queries.test.ts
git commit -m "feat(items): queries do catálogo"
```

### Task 4: Ações de item (CRUD, duplicar, ativar)

**Files:**

- Create: `src/lib/validations/items.ts`
- Create: `src/server/actions/items.ts`
- Test: `tests/unit/actions-items.test.ts`

**Interfaces:**

- Consumes: `getActiveMembership`, `isManager`, `createClient`, `dbError`, `itemSchema`, `createSupabaseMock` (harness de teste).
- Produces:

```ts
export const itemGroupSchema // name 1–100
export const itemSchema // description 1–200, long_description ≤5000, rate ≥0,
// purchase_price? ≥0, unit? ≤50, tax_rate? 0–100 e par com tax_name,
// group_id? uuid, active boolean
export type ItemFormState = { error?: string; success?: string } | undefined
export async function createItemAction(
  _prev: ItemFormState,
  formData: FormData,
): Promise<ItemFormState>
export async function updateItemAction(
  _prev: ItemFormState,
  formData: FormData,
): Promise<ItemFormState>
export async function deleteItemAction(formData: FormData): Promise<void>
export async function duplicateItemAction(formData: FormData): Promise<void>
export async function toggleItemActiveAction(formData: FormData): Promise<void>
```

Campos do form: `id`, `description`, `long_description`, `group_id`, `rate`, `purchase_price`, `unit`, `tax_name`, `tax_rate`, `active` (`"on"`).

- [ ] **Step 1: Escrever o teste que falha**

Em `tests/unit/actions-items.test.ts`, usar o mesmo harness de mock de
`actions-estimates-leads.test.ts` + `createSupabaseMock`:

```ts
const state = vi.hoisted(() => ({
  membership: { tenantId: TENANT, role: "admin" } as {
    tenantId: string
    role: string
  },
  item: null as Record<string, unknown> | null,
  groupCount: 0,
  groupError: null as { message: string } | null,
}))
let mock: ReturnType<typeof createSupabaseMock>
// beforeEach: mock = createSupabaseMock({
//   items: () => ({ data: state.item ? [state.item] : [], error: null }),
//   item_groups: () => ({ data: [], error: state.groupError }),
// })
// vi.mock("@/lib/supabase/server", () => ({ createClient: async () => mock.client }))
const firstInsert = (calls: { method: string; args: unknown[] }[][]) =>
  calls.flat().find((call) => call.method === "insert")?.args[0] as
    Record<string, unknown> | undefined

it("cria item do tenant com created_by", async () => {
  const result = await createItemAction(
    undefined,
    form({
      description: "Instalação",
      rate: "150",
      tax_name: "ISS",
      tax_rate: "5",
      active: "on",
    }),
  )
  expect(result).toEqual({ success: "Item criado." })
  expect(firstInsert(mock.callsFor("items"))!).toMatchObject({
    tenant_id: TENANT,
    description: "Instalação",
    rate: 150,
    tax_name: "ISS",
    tax_rate: 5,
    active: true,
  })
})

it("recusa imposto sem par", async () => {
  const result = await createItemAction(
    undefined,
    form({ description: "X", rate: "1", tax_name: "ISS" }),
  )
  expect(result?.error).toMatch(/junto/)
})

it("exclusão exige manager e é soft delete", async () => {
  state.membership = { tenantId: TENANT, role: "member" }
  await deleteItemAction(form({ id: ITEM_ID }))
  expect(mock.callsFor("items")).toHaveLength(0)
  state.membership = { tenantId: TENANT, role: "admin" }
  await deleteItemAction(form({ id: ITEM_ID }))
  expect(
    hasCall(mock.callsFor("items")[0]!, "update", {
      deleted_at: expect.any(String),
    }),
  ).toBe(true)
})

it("duplicar copia e trunca a descrição em 200 com ' (cópia)'", async () => {
  state.item = { ...detalhe, description: "a".repeat(195) }
  mock = createSupabaseMock({ items: { data: [state.item], error: null } })
  await duplicateItemAction(form({ id: ITEM_ID }))
  const inserted = firstInsert(mock.callsFor("items"))
  expect(inserted!.description).toHaveLength(200)
  expect(String(inserted!.description).endsWith(" (cópia)")).toBe(true)
})

it("não toca document_items ao atualizar item", async () => {
  await updateItemAction(
    undefined,
    form({ id: ITEM_ID, description: "Novo", rate: "10", active: "on" }),
  )
  expect(mock.callsFor("document_items")).toHaveLength(0)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/actions-items.test.ts`
Expected: FAIL — módulos não existem.

- [ ] **Step 3: Implementar validações e actions**

`deleteItemAction`/`toggleItemActiveAction` retornam sem efeito se não houver manager (delete) — toggle é liberado para membro. `duplicateItemAction` lê o item do tenant, monta `description` truncada em `200`, copia os demais campos, `active: true`. Todas revalidam `/app/itens` (e `/app/itens/grupos` quando mexem em grupo).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/actions-items.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/items.ts src/server/actions/items.ts tests/unit/actions-items.test.ts
git commit -m "feat(items): CRUD, duplicação e ativação de itens"
```

### Task 5: Ações de grupo (com decisão na exclusão)

**Files:**

- Modify: `src/server/actions/items.ts`
- Test: `tests/unit/actions-items.test.ts`

**Interfaces:**

- Produces:

```ts
export type ItemGroupFormState =
  { error?: string; success?: string } | undefined
export async function createItemGroupAction(
  _prev: ItemGroupFormState,
  formData: FormData,
): Promise<ItemGroupFormState>
export async function updateItemGroupAction(
  _prev: ItemGroupFormState,
  formData: FormData,
): Promise<ItemGroupFormState>
export async function deleteItemGroupAction(formData: FormData): Promise<void>
// deleteItemGroupAction lê: id, mode ("move" | "block"), target_group_id ("" = sem grupo)
```

- [ ] **Step 1: Escrever o teste que falha**

```ts
it("excluir grupo com itens exige mode=move e move antes de apagar", async () => {
  state.groupCount = 2
  await deleteItemGroupAction(form({ id: GROUP_ID, mode: "block" }))
  expect(mock.callsFor("items").some((calls) => hasCall(calls, "update"))).toBe(
    false,
  )
  expect(
    mock.callsFor("item_groups").some((calls) => hasCall(calls, "delete")),
  ).toBe(false)

  mock = createSupabaseMock({ items: { data: [], error: null, count: 2 } })
  await deleteItemGroupAction(
    form({ id: GROUP_ID, mode: "move", target_group_id: "" }),
  )
  expect(
    hasCall(mock.callsFor("items")[1]!, "update", { group_id: null }),
  ).toBe(true)
  expect(
    mock.callsFor("item_groups").some((calls) => hasCall(calls, "delete")),
  ).toBe(true)
})

// Nota: `createSupabaseMock` resolve a entrada como está; para o count, acrescente
// o campo `count` no resultado da tabela (o helper tipa só data/error).

it("nome de grupo duplicado devolve mensagem amigável", async () => {
  state.groupError = {
    message: "duplicate key value violates unique constraint",
  }
  mock = createSupabaseMock({
    item_groups: { data: null, error: state.groupError },
  })
  expect(
    (await createItemGroupAction(undefined, form({ name: "Serviços" })))?.error,
  ).toMatch(/já existe/)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/actions-items.test.ts`
Expected: FAIL — actions de grupo ausentes.

- [ ] **Step 3: Implementar**

Contar itens do grupo (`select id, { count: "exact", head: true }` com `eq group_id` e `is deleted_at null`). Se `count > 0`: sem `mode=move`, retorna sem apagar; com `move`, `update({ group_id: target_group_id || null })` filtrando `tenant_id` e `group_id = id`, depois `delete` do grupo. Exclusão só para manager.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/actions-items.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/actions/items.ts tests/unit/actions-items.test.ts
git commit -m "feat(items): grupos com movimentação na exclusão"
```

### Task 6: Ação de importação

**Files:**

- Modify: `src/server/actions/items.ts`
- Create: `src/lib/validations/items.ts` (acrescentar `importItemRowSchema` se ainda não existir)
- Test: `tests/unit/actions-items-import.test.ts`

**Interfaces:**

- Consumes: `importItemRowSchema`, `normalizeItemKey` de `@/lib/items/import`.
- Produces:

```ts
export type ItemImportState =
  | {
      error?: string
      success?: string
      created?: number
      skipped?: number
      groupsCreated?: number
    }
  | undefined
export async function importItemsAction(
  _prev: ItemImportState,
  formData: FormData,
): Promise<ItemImportState>
// formData: rows = JSON.stringify(ItemImportData[])
```

- [ ] **Step 1: Escrever o teste que falha**

```ts
it("linha inválida impede qualquer gravação", async () => {
  const rows = JSON.stringify([
    { description: "Ok", rate: 10 },
    { description: "", rate: 10 },
  ])
  const result = await importItemsAction(undefined, form({ rows }))
  expect(result?.error).toMatch(/linha 2/i)
  expect(mock.callsFor("items")).toHaveLength(0)
  expect(mock.callsFor("item_groups")).toHaveLength(0)
})

it("cria grupos novos, ignora duplicados e grava o resto", async () => {
  mock = createSupabaseMock({
    items: { data: [{ description: "INSTALAÇÃO" }], error: null },
    item_groups: { data: [{ id: GROUP_ID, name: "Serviços" }], error: null },
  })
  const rows = JSON.stringify([
    { description: "Instalação", rate: 10 },
    { description: "Manutenção", rate: 20, group: "Serviços" },
    { description: "Licença", rate: 30, group: "Licenças" },
  ])
  const result = await importItemsAction(undefined, form({ rows }))
  expect(result).toMatchObject({ created: 2, skipped: 1, groupsCreated: 1 })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/actions-items-import.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Ler `rows`, `JSON.parse` protegido, aplicar `importItemRowSchema` em cada linha; na primeira falha devolver `Linha ${index + 1}: ${issue.message}` sem gravar e **antes de qualquer consulta** (é isso que mantém `callsFor("items")` vazio no teste). Só depois deduplicar contra descrições do tenant (`listItemDescriptions`) e entre linhas. Criar grupos ausentes (comparação por `normalizeItemKey`), guardar ids criados; inserir itens em um único `insert`; se falhar, apagar os grupos criados nesta chamada e devolver `dbError`. `revalidatePath("/app/itens")`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/actions-items-import.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/actions/items.ts src/lib/validations/items.ts tests/unit/actions-items-import.test.ts
git commit -m "feat(items): importação CSV revalidada no servidor"
```

### Task 7: `item_id` na linha e `replaceDocumentItems` seguro

**Files:**

- Modify: `src/lib/documents/totals.ts`
- Modify: `src/lib/validations/documents.ts`
- Modify: `src/server/documents.ts`
- Modify: `src/server/queries/documents.ts` (`DocumentItem.item_id` e select de `listDocumentItems`)
- Modify: `src/server/actions/estimates.ts`, `src/server/actions/invoices.ts`
- Test: `tests/unit/document-items-replace.test.ts`
- Adjust: `tests/unit/actions-estimates-leads.test.ts`, `tests/unit/actions-invoices.test.ts`, `tests/unit/document-pdf.test.ts`

**Interfaces:**

- Produces:

```ts
// LineItemInput ganha:
item_id?: string | null
// lineItemSchema aceita item_id uuid opcional/null
export async function replaceDocumentItems(
  supabase: SupabaseClient, tenantId: string,
  relType: "estimate" | "invoice", relId: string, items: LineItemInput[],
): Promise<{ error: string | null }>
```

- [ ] **Step 1: Escrever o teste que falha**

`tests/unit/document-items-replace.test.ts`:

```ts
it("anula item_id de outro tenant e mantém o válido", async () => {
  const mock = createSupabaseMock({
    items: { data: [{ id: ITEM_OK }], error: null },
    document_items: (calls) =>
      calls.some((c) => c.method === "select")
        ? { data: [{ id: OLD_ID }], error: null }
        : { data: null, error: null },
  })
  const result = await replaceDocumentItems(
    mock.client as never,
    TENANT,
    "estimate",
    DOC,
    [
      { description: "A", qty: 1, rate: 1, item_id: ITEM_OK },
      { description: "B", qty: 1, rate: 1, item_id: "item-de-outro-tenant" },
    ],
  )
  expect(result.error).toBeNull()
  const inserted = firstInsert(mock.callsFor("document_items"))
  expect(
    inserted.map((row: { item_id: string | null }) => row.item_id),
  ).toEqual([ITEM_OK, null])
})

it("se o insert falhar, não apaga as linhas antigas", async () => {
  const mock = createSupabaseMock({
    document_items: (calls) =>
      calls.some((c) => c.method === "insert")
        ? { data: null, error: { message: "boom" } }
        : { data: [{ id: OLD_ID }], error: null },
  })
  const result = await replaceDocumentItems(
    mock.client as never,
    TENANT,
    "invoice",
    DOC,
    [{ description: "A", qty: 1, rate: 1 }],
  )
  expect(result.error).toMatch(/Não foi possível/)
  expect(
    mock.callsFor("document_items").some((calls) => hasCall(calls, "delete")),
  ).toBe(false)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/document-items-replace.test.ts`
Expected: FAIL — retorno/ordem atuais.

- [ ] **Step 3: Implementar**

`replaceDocumentItems`: buscar ids antigos; resolver `item_id` válido com um `select` em `items` (`id in [...]`, `tenant_id`, `deleted_at null`); inserir com `item_id`; se erro, `return dbError("document_items.replace", error, "Não foi possível salvar os itens do documento.")`; só então apagar `id in (ids antigos)`. Adicionar `item_id` ao `LineItemInput`, ao `lineItemSchema`, ao tipo `DocumentItem` e ao select de `listDocumentItems`.

Nas chamadas: create devolve `{ error: "Documento criado, mas os itens não foram salvos. Edite o documento e tente de novo." }`; update devolve o erro; `convertEstimateToInvoiceAction` apaga a fatura recém-criada e retorna.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/document-items-replace.test.ts tests/unit/actions-estimates-leads.test.ts tests/unit/actions-invoices.test.ts tests/unit/document-pdf.test.ts`
Expected: PASS (mocks atualizados para devolver `{ error: null }`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/documents/totals.ts src/lib/validations/documents.ts src/server/documents.ts src/server/actions/estimates.ts src/server/actions/invoices.ts tests/unit/document-items-replace.test.ts tests/unit/actions-estimates-leads.test.ts tests/unit/actions-invoices.test.ts tests/unit/document-pdf.test.ts
git commit -m "fix(documents): itens inseridos antes de apagar e item_id validado"
```

### Task 8: Picker e editor de linha

**Files:**

- Create: `src/components/app/item-picker.tsx`
- Modify: `src/components/app/document-items-editor.tsx`
- Modify: `src/app/app/orcamentos/estimate-form-dialog.tsx`, `src/app/app/faturas/invoice-form-dialog.tsx` (`toInputs` passa `item_id`)
- Test: `tests/unit/item-picker.test.tsx`, `tests/unit/document-items-editor.test.tsx`

**Interfaces:**

- Consumes: `ItemOption` de `@/server/queries/items`, `normalizeItemKey`.
- Produces:

```tsx
export function ItemPicker({
  items,
  onSelect,
  disabled,
}: {
  items: ItemOption[]
  onSelect: (item: ItemOption) => void
  disabled?: boolean
}): JSX.Element
// DocumentItemsEditor ganha props: catalog?: ItemOption[]
// Botão "Do catálogo" acrescenta linha:
// { description, qty: 1, rate, unit, tax_name, tax_rate, item_id }
```

- [ ] **Step 1: Escrever o teste que falha**

```tsx
const base = {
  long_description: null,
  rate: 10,
  unit: null,
  tax_name: null,
  tax_rate: null,
  group: null,
}

it("filtra sem acento/caixa e ignora inativo", async () => {
  render(
    <ItemPicker
      items={[
        { ...base, id: "1", description: "Instalação elétrica", active: true },
        { ...base, id: "2", description: "Instalação antiga", active: false },
        { ...base, id: "3", description: "Manutenção", active: true },
      ]}
      onSelect={vi.fn()}
    />,
  )
  await userEvent.click(screen.getByRole("button", { name: /do catálogo/i }))
  await userEvent.type(
    screen.getByPlaceholderText(/buscar item/i),
    "instalacao",
  )
  expect(screen.getByText("Instalação elétrica")).toBeInTheDocument()
  expect(screen.queryByText("Instalação antiga")).not.toBeInTheDocument()
  expect(screen.queryByText("Manutenção")).not.toBeInTheDocument()
})

it("Enter seleciona o primeiro resultado", async () => {
  const onSelect = vi.fn()
  render(
    <ItemPicker
      items={[{ ...base, id: "1", description: "Consultoria", active: true }]}
      onSelect={onSelect}
    />,
  )
  await userEvent.click(screen.getByRole("button", { name: /do catálogo/i }))
  await userEvent.type(
    screen.getByPlaceholderText(/buscar item/i),
    "consul{Enter}",
  )
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }))
})

it("escolher do catálogo acrescenta linha preenchida com item_id", async () => {
  const onChange = vi.fn()
  render(
    <DocumentItemsEditor
      items={[{ description: "", qty: 1, rate: 0 }]}
      onChange={onChange}
      catalog={[
        {
          id: "i1",
          description: "Instalação",
          long_description: null,
          rate: 150,
          unit: "h",
          tax_name: "ISS",
          tax_rate: 5,
          active: true,
          group: null,
        },
      ]}
    />,
  )
  await userEvent.click(screen.getByRole("button", { name: /do catálogo/i }))
  await userEvent.click(screen.getByText("Instalação"))
  expect(onChange).toHaveBeenCalledWith([
    { description: "", qty: 1, rate: 0 },
    {
      description: "Instalação",
      qty: 1,
      rate: 150,
      unit: "h",
      tax_name: "ISS",
      tax_rate: 5,
      item_id: "i1",
    },
  ])
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/item-picker.test.tsx tests/unit/document-items-editor.test.tsx`
Expected: FAIL — componente/prop não existem.

- [ ] **Step 3: Implementar**

Painel `absolute z-50` dentro de um `div.relative`, fecha em Escape/clique fora; lista agrupada por `group.name` ("Sem grupo" no fim); itens com `active === false` nunca renderizados; mostra `formatMoney(rate)` e unidade; teclado com índice ativo. No editor, coluna "Un." (60px) e grid `1fr 60px 70px 100px 90px 70px 32px`; o botão só aparece quando `catalog` é passado.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/item-picker.test.tsx tests/unit/document-items-editor.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/app/item-picker.tsx src/components/app/document-items-editor.tsx src/app/app/orcamentos/estimate-form-dialog.tsx src/app/app/faturas/invoice-form-dialog.tsx tests/unit/item-picker.test.tsx tests/unit/document-items-editor.test.tsx
git commit -m "feat(items): seletor do catálogo no editor de linha"
```

### Task 9: Página de grupos

**Files:**

- Create: `src/app/app/itens/grupos/page.tsx`
- Create: `src/app/app/itens/grupos/group-form-dialog.tsx`
- Create: `src/app/app/itens/grupos/delete-group-dialog.tsx`
- Test: coberto por `tests/unit/actions-items.test.ts` (ações); nenhum teste de página.

**Interfaces:**

- Consumes: `listItemGroups`, `createItemGroupAction`, `updateItemGroupAction`, `deleteItemGroupAction`, `isManager`.
- Produces: rota `/app/itens/grupos`.

- [ ] **Step 1: Implementar a página**

`getMemberships` + `getActiveTenant`; tabela com nome, contagem e ações; cabeçalho com "Voltar para itens" (`/app/itens`) e "Novo grupo". Sem grupos, estado vazio "Nenhum grupo cadastrado".

- [ ] **Step 2: Implementar os diálogos**

`GroupFormDialog` no padrão de `ExpenseFormDialog` (`useActionState` + `toast`); exclusão com `<select name="target_group_id">` listando os outros grupos e opção "Sem grupo"; botão de excluir desabilitado até escolher destino quando houver itens; `mode` hidden = `"move"`. Para manager, mostrar; para membro comum, exibir apenas leitura.

- [ ] **Step 3: Verificar**

Run: `npm run typecheck && npm run lint`
Expected: PASSA.

- [ ] **Step 4: Commit**

```bash
git add src/app/app/itens/grupos/page.tsx src/app/app/itens/grupos/group-form-dialog.tsx src/app/app/itens/grupos/delete-group-dialog.tsx
git commit -m "feat(items): tela de grupos do catálogo"
```

### Task 10: Página de itens

**Files:**

- Create: `src/app/app/itens/page.tsx`
- Create: `src/app/app/itens/item-form-dialog.tsx`
- Create: `src/app/app/itens/delete-item-button.tsx`
- Create: `src/app/app/itens/duplicate-item-button.tsx`
- Modify: `src/components/app/nav-items.ts`
- Test: nenhum de página; ações cobertas na Task 4.

**Interfaces:**

- Consumes: `listItemsPage`, `listItemGroups`, `getItem`, `createItemAction`, `updateItemAction`, `deleteItemAction`, `duplicateItemAction`, `toggleItemActiveAction`, `Pagination`, `formatMoney`.
- Produces: rota `/app/itens`; item `{ title: "Itens", href: "/app/itens", icon: Package }` em `NAV_ITEMS` depois de Faturas; `{ href: "/app/itens", label: "Item", command: "Novo item" }` em `NEW_ITEMS`.

- [ ] **Step 1: Implementar a página**

`searchParams`: `page`, `q`, `group`, `status`. Filtro GET com input de busca, select de grupo e select de situação (`Ativos`/`Inativos`/`Todos`). Tabela: descrição (+ descrição longa truncada em 80), grupo, unidade, valor, imposto (`tax_name` + `tax_rate%`), situação (`Badge`), ações. Paginação preservando filtros.

- [ ] **Step 2: Implementar o formulário**

`ItemFormDialog` com campos do `itemSchema`; grupo opcional; checkbox "Ativo"; `useActionState` + `toast` + fechar no sucesso. Edição recebe `item: Item`.

- [ ] **Step 3: Implementar ações de linha**

`DeleteItemButton` (form + `confirm`, só renderizado se `canManage`), `DuplicateItemButton` (form com `id`), botão de ativar/desativar (form com `id`).

- [ ] **Step 4: Verificar**

Run: `npm run typecheck && npm run lint`
Expected: PASSA.

- [ ] **Step 5: Commit**

```bash
git add src/app/app/itens/page.tsx src/app/app/itens/item-form-dialog.tsx src/app/app/itens/delete-item-button.tsx src/app/app/itens/duplicate-item-button.tsx src/components/app/nav-items.ts
git commit -m "feat(items): tela do catálogo com busca e filtros"
```

### Task 11: Diálogo de importação

**Files:**

- Create: `src/app/app/itens/import-items-dialog.tsx`
- Modify: `src/app/app/itens/page.tsx` (botão "Importar CSV" e props `descriptions`/`groups`)
- Test: `tests/unit/items-import-ui.test.tsx`

**Interfaces:**

- Consumes: `parseItemsCsv`, `itemImportTemplate`, `importItemsAction`, `ItemImportState`.
- Produces: `<ImportItemsDialog descriptions={string[]} groups={string[]} />`.

- [ ] **Step 1: Escrever o teste que falha**

Mockar a action antes de importar o componente (senão o `"use server"` tenta resolver o módulo do servidor no jsdom):

```tsx
vi.mock("@/server/actions/items", () => ({ importItemsAction: vi.fn() }))

it("mostra resumo e desabilita importar quando não há linhas válidas", async () => {
  render(<ImportItemsDialog descriptions={["Instalação"]} groups={[]} />)
  await userEvent.click(screen.getByRole("button", { name: /importar csv/i }))
  const file = new File(
    ["Descrição;Valor\nInstalação;10\nManutenção;"],
    "itens.csv",
    { type: "text/csv" },
  )
  await userEvent.upload(screen.getByLabelText(/arquivo csv/i), file)
  expect(await screen.findByText(/1 válida/i)).toBeInTheDocument()
  expect(screen.getByText(/1 duplicada/i)).toBeInTheDocument()
  expect(screen.getByText(/1 inválida/i)).toBeInTheDocument()
  expect(
    screen.getByRole("button", { name: /^importar 1 item/i }),
  ).toBeEnabled()
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run tests/unit/items-import-ui.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Input file com `accept=".csv,text/csv"`, limite de 2 MB (mensagem imediata), leitura com `file.text()`, prévia das primeiras 50 linhas com status colorido, resumo com os textos `"N válida(s)"`, `"N duplicada(s)"`, `"N inválida(s)"` e `"N grupo(s) novo(s)"`, botão "Baixar modelo" (Blob + `itemImportTemplate()`), `useActionState(importItemsAction)` com hidden `rows` contendo só as linhas `ok`; sucesso fecha e faz `toast.success` com `created`/`skipped`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run tests/unit/items-import-ui.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/app/itens/import-items-dialog.tsx src/app/app/itens/page.tsx tests/unit/items-import-ui.test.tsx
git commit -m "feat(items): importação com prévia e modelo CSV"
```

### Task 12: Ligar o catálogo a orçamentos e faturas

**Files:**

- Modify: `src/app/app/orcamentos/page.tsx`, `src/app/app/orcamentos/[id]/page.tsx`
- Modify: `src/app/app/faturas/page.tsx`, `src/app/app/faturas/[id]/page.tsx`
- Modify: `src/app/app/orcamentos/estimate-form-dialog.tsx`, `src/app/app/faturas/invoice-form-dialog.tsx`

**Interfaces:**

- Consumes: `listItemOptions`, `ItemOption`.
- Produces: prop `catalog: ItemOption[]` em `EstimateFormDialog`/`InvoiceFormDialog` e `catalog` em `DocumentItemsEditor` (já testado na Task 8).

- [ ] **Step 1: Implementar**

Nas 4 páginas, carregar `listItemOptions(active.tenantId)` em paralelo com as queries existentes e passar `catalog` ao diálogo; no diálogo, repassar ao editor e incluir `item_id: item.item_id ?? null` em `toInputs`.

- [ ] **Step 2: Verificar**

Run: `npm run typecheck && npm run lint && npx vitest run tests/unit/document-items-editor.test.tsx`
Expected: PASSA.

- [ ] **Step 3: Commit**

```bash
git add src/app/app/orcamentos/page.tsx "src/app/app/orcamentos/[id]/page.tsx" src/app/app/orcamentos/estimate-form-dialog.tsx src/app/app/faturas/page.tsx "src/app/app/faturas/[id]/page.tsx" src/app/app/faturas/invoice-form-dialog.tsx
git commit -m "feat(items): catálogo disponível no editor de orçamento e fatura"
```

### Task 13: Verificação final

**Files:** nenhum novo (correções de formatação que o Prettier apontar).

- [ ] **Step 1: Rodar a suíte completa**

Run: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build`
Expected: todos passam.

- [ ] **Step 2: Conferir manualmente (dev)**

Com `npm run dev`: criar grupo, item com imposto, duplicar, desativar (some do seletor), excluir grupo com item (move), importar CSV com uma linha inválida (nada grava), escolher item no orçamento e conferir valor/unidade no PDF.

- [ ] **Step 3: Commit de ajustes**

Rodar `npm run format` e adicionar explicitamente só os arquivos que ele alterou (nunca `git add .`/`-A`):

```bash
git status --short
git add <arquivos listados acima>
git commit -m "chore(items): formatação e ajustes finais"
```
