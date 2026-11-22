import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const GROUP = "22222222-2222-4222-8222-222222222222"

const state = vi.hoisted(() => ({ client: null as unknown }))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.client,
}))

import {
  listItemGroups,
  listItemOptions,
  listItemsPage,
} from "@/server/queries/items"

describe("queries de itens", () => {
  beforeEach(() => {
    state.client = createSupabaseMock().client
  })

  it("filtra por busca, grupo e situação, paginando", async () => {
    const mock = createSupabaseMock({ items: { data: [], error: null } })
    state.client = mock.client

    await listItemsPage(TENANT, {
      page: 2,
      pageSize: 20,
      search: "instal",
      groupId: GROUP,
      status: "inactive",
    })

    const calls = mock.callsFor("items")[0]!
    expect(hasCall(calls, "ilike", "description", "%instal%")).toBe(true)
    expect(hasCall(calls, "eq", "group_id", GROUP)).toBe(true)
    expect(hasCall(calls, "eq", "active", false)).toBe(true)
    expect(hasCall(calls, "range", 20, 39)).toBe(true)
  })

  it("sem status filtra só ativos", async () => {
    const mock = createSupabaseMock({ items: { data: [], error: null } })
    state.client = mock.client

    await listItemsPage(TENANT, { page: 1, pageSize: 20 })

    expect(hasCall(mock.callsFor("items")[0]!, "eq", "active", true)).toBe(true)
  })

  it("lista opções só de itens ativos e não excluídos", async () => {
    const mock = createSupabaseMock({ items: { data: [], error: null } })
    state.client = mock.client

    await listItemOptions(TENANT)

    const calls = mock.callsFor("items")[0]!
    expect(hasCall(calls, "eq", "active", true)).toBe(true)
    expect(hasCall(calls, "is", "deleted_at", null)).toBe(true)
  })

  it("devolve a contagem de itens por grupo", async () => {
    state.client = createSupabaseMock({
      item_groups: {
        data: [
          { id: GROUP, name: "Serviços", items: [{ count: 3 }] },
          { id: "g2", name: "Sem itens", items: [] },
        ],
        error: null,
      },
    }).client

    const groups = await listItemGroups(TENANT)

    expect(groups).toEqual([
      { id: GROUP, name: "Serviços", count: 3 },
      { id: "g2", name: "Sem itens", count: 0 },
    ])
  })
})
