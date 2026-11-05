import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }))

import { checkPlanLimitWith, startOfMonthUtc } from "@/server/plan-limits"
import { PLAN_LIMIT_FIELDS } from "@/lib/constants"
import { planSchema } from "@/lib/validations/plan"

type Call = { method: string; args: unknown[] }

/**
 * Cliente Supabase falso: `tenants` devolve os limites do plano; qualquer
 * outra tabela devolve `count`. Registra as chamadas de filtro feitas na
 * consulta de contagem.
 */
function fakeClient(limits: Record<string, number | null>, count: number) {
  const countCalls: Call[] = []
  const countTables: string[] = []

  const client = {
    from(table: string) {
      if (table === "tenants") {
        const chain = {
          select: () => chain,
          eq: () => chain,
          maybeSingle: async () => ({ data: { plan: { limits } } }),
        }
        return chain
      }
      countTables.push(table)
      const chain: Record<string, unknown> = {}
      for (const method of ["select", "eq", "is", "gte"]) {
        chain[method] = (...args: unknown[]) => {
          countCalls.push({ method, args })
          return chain
        }
      }
      chain.then = (resolve: (value: { count: number }) => unknown) =>
        resolve({ count })
      return chain
    },
  }

  return {
    client: client as unknown as SupabaseClient,
    countCalls,
    countTables,
  }
}

describe("checkPlanLimitWith — Social", () => {
  it("bloqueia nova conta social quando o limite foi atingido", async () => {
    const { client, countTables, countCalls } = fakeClient(
      { social_accounts: 3 },
      3,
    )
    const result = await checkPlanLimitWith(client, "t1", "social_accounts")

    expect(result.ok).toBe(false)
    expect(countTables).toEqual(["social_accounts"])
    expect(countCalls).toContainEqual({
      method: "is",
      args: ["deleted_at", null],
    })
  })

  it("permite conta social abaixo do limite", async () => {
    const { client } = fakeClient({ social_accounts: 3 }, 2)
    const result = await checkPlanLimitWith(client, "t1", "social_accounts")
    expect(result).toEqual({ ok: true, remaining: 1 })
  })

  it("conta posts criados no mês corrente, inclusive excluídos", async () => {
    const now = new Date("2026-11-20T15:30:00Z")
    const { client, countTables, countCalls } = fakeClient(
      { social_posts_month: 10 },
      10,
    )
    const result = await checkPlanLimitWith(
      client,
      "t1",
      "social_posts_month",
      now,
    )

    expect(result.ok).toBe(false)
    expect(countTables).toEqual(["social_posts"])
    expect(countCalls).toContainEqual({
      method: "gte",
      args: ["created_at", "2026-11-01T00:00:00.000Z"],
    })
    expect(countCalls.some((c) => c.method === "is")).toBe(false)
  })

  it("sem limite configurado, não consulta a contagem", async () => {
    const { client, countTables } = fakeClient({}, 999)
    const result = await checkPlanLimitWith(client, "t1", "social_posts_month")
    expect(result).toEqual({ ok: true })
    expect(countTables).toEqual([])
  })
})

describe("startOfMonthUtc", () => {
  it("volta para o dia 1 às 00:00 UTC", () => {
    expect(
      startOfMonthUtc(new Date("2026-02-28T23:59:59Z")).toISOString(),
    ).toBe("2026-02-01T00:00:00.000Z")
  })
})

describe("planSchema", () => {
  it("aceita todas as chaves de limite, inclusive SEO e Social", () => {
    const limits = Object.fromEntries(
      PLAN_LIMIT_FIELDS.map((field) => [field.key, "5"]),
    )
    const parsed = planSchema.parse({ name: "Pro", limits })

    for (const key of [
      "clients",
      "seo_sites",
      "social_accounts",
      "social_posts_month",
    ]) {
      expect(parsed.limits[key as keyof typeof parsed.limits]).toBe(5)
    }
  })
})
