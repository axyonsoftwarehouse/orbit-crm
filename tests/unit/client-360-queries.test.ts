import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const COMPANY = "22222222-2222-4222-8222-222222222222"

const state = vi.hoisted(() => ({ client: null as unknown }))

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.client,
}))

import { getClient360 } from "@/server/queries/client-360"

describe("getClient360", () => {
  beforeEach(() => {
    state.client = createSupabaseMock().client
  })

  it("filtra tudo por tenant e cliente e monta totais e linha do tempo", async () => {
    const mock = createSupabaseMock({
      projects: {
        data: [
          { id: "p1", name: "Site", status: 2, progress: 40, deadline: null },
        ],
        error: null,
      },
      invoices: {
        data: [
          {
            id: "i1",
            formatted_number: "FAT-0001",
            status: 3,
            date: "2026-11-01",
            due_date: "2026-11-10",
            total: 1000,
            currency: "BRL",
          },
        ],
        error: null,
      },
      payments: {
        data: [{ id: "pay1", invoice_id: "i1", amount: 400 }],
        error: null,
      },
      time_entries: {
        data: [{ duration_seconds: 7200 }],
        error: null,
      },
      leads: {
        data: [
          { id: "l1", name: "Lead X", converted_at: "2026-10-01T00:00:00Z" },
        ],
        error: null,
      },
      lead_activities: {
        data: [
          {
            id: "n1",
            lead_id: "l1",
            description: "Primeira conversa",
            created_at: "2026-09-01T00:00:00Z",
            author: { full_name: "Ana" },
          },
        ],
        error: null,
      },
      activity_log: {
        data: [
          {
            id: "a1",
            entity: "invoices",
            entity_id: "i1",
            action: "insert",
            created_at: "2026-11-01T00:00:00Z",
            actor: { full_name: "Bruno" },
          },
        ],
        error: null,
      },
    })
    state.client = mock.client

    const result = await getClient360(TENANT, COMPANY)

    for (const table of [
      "projects",
      "estimates",
      "invoices",
      "contracts",
      "tickets",
      "social_posts",
    ]) {
      const calls = mock.callsFor(table)[0]!
      expect(hasCall(calls, "eq", "tenant_id", TENANT)).toBe(true)
      expect(hasCall(calls, "eq", "company_id", COMPANY)).toBe(true)
      expect(hasCall(calls, "is", "deleted_at", null)).toBe(true)
    }
    expect(
      hasCall(
        mock.callsFor("leads")[0]!,
        "eq",
        "converted_company_id",
        COMPANY,
      ),
    ).toBe(true)
    expect(
      hasCall(mock.callsFor("payments")[0]!, "in", "invoice_id", ["i1"]),
    ).toBe(true)
    expect(
      hasCall(mock.callsFor("time_entries")[0]!, "in", "project_id", ["p1"]),
    ).toBe(true)
    const auditCalls = mock.callsFor("activity_log")[0]!
    expect(hasCall(auditCalls, "eq", "tenant_id", TENANT)).toBe(true)
    const inCall = auditCalls.find((call) => call.method === "in")!
    expect(inCall.args[0]).toBe("entity_id")
    expect(inCall.args[1]).toEqual(
      expect.arrayContaining([COMPANY, "p1", "i1", "pay1"]),
    )

    expect(result.finance).toEqual({
      receivable: 600,
      received: 400,
      overdueCount: 1,
    })
    expect(result.hours).toBe(2)
    expect(result.timeline.map((item) => item.text)).toEqual([
      "Criou fatura FAT-0001",
      'Lead "Lead X" convertido em cliente',
      "Primeira conversa",
    ])
  })

  it("não consulta pagamentos, horas nem anotações quando não há vínculos", async () => {
    const mock = createSupabaseMock()
    state.client = mock.client

    const result = await getClient360(TENANT, COMPANY)

    expect(mock.callsFor("payments")).toHaveLength(0)
    expect(mock.callsFor("time_entries")).toHaveLength(0)
    expect(mock.callsFor("lead_activities")).toHaveLength(0)
    expect(result.finance).toEqual({
      receivable: 0,
      received: 0,
      overdueCount: 0,
    })
    expect(result.timeline).toEqual([])
  })
})
