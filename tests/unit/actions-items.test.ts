import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const USER = "22222222-2222-4222-8222-222222222222"
const ITEM_ID = "33333333-3333-4333-8333-333333333333"
const GROUP_ID = "44444444-4444-4444-8444-444444444444"

const state = vi.hoisted(() => ({
  membership: null as { tenantId: string; role: string } | null,
  supabase: null as unknown,
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/lib/auth", () => ({
  getUser: async () => ({ id: "22222222-2222-4222-8222-222222222222" }),
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import {
  createItemAction,
  createItemGroupAction,
  deleteItemAction,
  deleteItemGroupAction,
  duplicateItemAction,
  toggleItemActiveAction,
  updateItemAction,
} from "@/server/actions/items"

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

function firstInsert(calls: { method: string; args: unknown[] }[][]) {
  return calls.flat().find((call) => call.method === "insert")?.args[0] as
    | Record<string, unknown>
    | undefined
}

const detalhe = {
  id: ITEM_ID,
  tenant_id: TENANT,
  group_id: null,
  description: "Instalação",
  long_description: null,
  rate: 100,
  purchase_price: null,
  unit: "h",
  tax_name: "ISS",
  tax_rate: 5,
  active: true,
}

describe("ações de item", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "admin" }
  })

  it("cria item do tenant com created_by", async () => {
    const mock = createSupabaseMock({ items: { data: null, error: null } })
    state.supabase = mock.client

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
    expect(firstInsert(mock.callsFor("items"))).toMatchObject({
      tenant_id: TENANT,
      created_by: USER,
      description: "Instalação",
      rate: 150,
      tax_name: "ISS",
      tax_rate: 5,
      active: true,
    })
  })

  it("recusa imposto sem par", async () => {
    state.supabase = createSupabaseMock().client

    const result = await createItemAction(
      undefined,
      form({ description: "X", rate: "1", tax_name: "ISS" }),
    )

    expect(result?.error).toMatch(/junto/)
  })

  it("exclusão exige manager e é soft delete", async () => {
    state.membership = { tenantId: TENANT, role: "member" }
    const memberMock = createSupabaseMock()
    state.supabase = memberMock.client
    await deleteItemAction(form({ id: ITEM_ID }))
    expect(memberMock.callsFor("items")).toHaveLength(0)

    state.membership = { tenantId: TENANT, role: "admin" }
    const adminMock = createSupabaseMock()
    state.supabase = adminMock.client
    await deleteItemAction(form({ id: ITEM_ID }))
    const update = adminMock
      .callsFor("items")[0]!
      .find((call) => call.method === "update")
    expect(typeof (update?.args[0] as { deleted_at: string }).deleted_at).toBe(
      "string",
    )
  })

  it("duplicar copia e trunca a descrição em 200 com ' (cópia)'", async () => {
    const mock = createSupabaseMock({
      items: {
        data: { ...detalhe, description: "a".repeat(195) },
        error: null,
      },
    })
    state.supabase = mock.client

    await duplicateItemAction(form({ id: ITEM_ID }))

    const inserted = firstInsert(mock.callsFor("items"))
    expect(inserted?.description).toHaveLength(200)
    expect(String(inserted?.description).endsWith(" (cópia)")).toBe(true)
  })

  it("não toca document_items ao atualizar item", async () => {
    const mock = createSupabaseMock({ items: { data: null, error: null } })
    state.supabase = mock.client

    const result = await updateItemAction(
      undefined,
      form({ id: ITEM_ID, description: "Novo", rate: "10", active: "on" }),
    )

    expect(result).toEqual({ success: "Item atualizado." })
    expect(mock.callsFor("document_items")).toHaveLength(0)
  })

  it("alterna a situação do item", async () => {
    const mock = createSupabaseMock({
      items: { data: { active: true }, error: null },
    })
    state.supabase = mock.client

    await toggleItemActiveAction(form({ id: ITEM_ID }))

    expect(
      hasCall(mock.callsFor("items")[1]!, "update", { active: false }),
    ).toBe(true)
  })
})

describe("ações de grupo", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "admin" }
  })

  it("excluir grupo com itens exige mode=move e move antes de apagar", async () => {
    const blockMock = createSupabaseMock({
      items: { data: [], error: null, count: 2 },
    })
    state.supabase = blockMock.client

    await deleteItemGroupAction(form({ id: GROUP_ID, mode: "block" }))

    expect(
      blockMock.callsFor("items").some((calls) => hasCall(calls, "update")),
    ).toBe(false)
    expect(
      blockMock
        .callsFor("item_groups")
        .some((calls) => hasCall(calls, "delete")),
    ).toBe(false)

    const moveMock = createSupabaseMock({
      items: { data: [], error: null, count: 2 },
    })
    state.supabase = moveMock.client

    await deleteItemGroupAction(
      form({ id: GROUP_ID, mode: "move", target_group_id: "" }),
    )

    expect(
      hasCall(moveMock.callsFor("items")[1]!, "update", { group_id: null }),
    ).toBe(true)
    expect(
      moveMock.callsFor("item_groups").some((calls) => hasCall(calls, "delete")),
    ).toBe(true)
  })

  it("cria grupo e devolve mensagem amigável no nome duplicado", async () => {
    const okMock = createSupabaseMock({
      item_groups: { data: null, error: null },
    })
    state.supabase = okMock.client

    expect(
      await createItemGroupAction(undefined, form({ name: "Serviços" })),
    ).toEqual({ success: "Grupo criado." })

    state.supabase = createSupabaseMock({
      item_groups: {
        data: null,
        error: { message: "duplicate key value violates unique constraint" },
      },
    }).client

    const duplicated = await createItemGroupAction(
      undefined,
      form({ name: "Serviços" }),
    )
    expect(duplicated?.error).toMatch(/já existe/i)
  })
})
