import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const GROUP_ID = "22222222-2222-4222-8222-222222222222"

const state = vi.hoisted(() => ({
  membership: null as { tenantId: string; role: string } | null,
  supabase: null as unknown,
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/lib/auth", () => ({
  getUser: async () => ({ id: "33333333-3333-4333-8333-333333333333" }),
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { importItemsAction } from "@/server/actions/items"

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

describe("importItemsAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "member" }
  })

  it("linha inválida impede qualquer gravação", async () => {
    const mock = createSupabaseMock()
    state.supabase = mock.client

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
    const mock = createSupabaseMock({
      items: { data: [{ description: "INSTALAÇÃO" }], error: null },
      item_groups: {
        data: [{ id: GROUP_ID, name: "Serviços" }],
        error: null,
      },
    })
    state.supabase = mock.client

    const rows = JSON.stringify([
      { description: "Instalação", rate: 10 },
      { description: "Manutenção", rate: 20, group: "Serviços" },
      { description: "Licença", rate: 30, group: "Licenças" },
    ])
    const result = await importItemsAction(undefined, form({ rows }))

    expect(result).toMatchObject({ created: 2, skipped: 1, groupsCreated: 1 })

    const groupInsert = mock
      .callsFor("item_groups")[1]!
      .find((call) => call.method === "insert")?.args[0] as {
      name: string
    }[]
    expect(groupInsert).toEqual([{ tenant_id: TENANT, name: "Licenças" }])

    const itemInsert = mock
      .callsFor("items")[1]!
      .find((call) => call.method === "insert")?.args[0] as {
      description: string
      group_id: string | null
    }[]
    expect(itemInsert.map((row) => row.description)).toEqual([
      "Manutenção",
      "Licença",
    ])
    expect(itemInsert[0]!.group_id).toBe(GROUP_ID)
  })
})
