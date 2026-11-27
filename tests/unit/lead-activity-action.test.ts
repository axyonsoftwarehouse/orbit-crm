import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const LEAD = "44444444-4444-4444-8444-444444444444"

const state = vi.hoisted(() => ({
  membership: null as { tenantId: string; role: string } | null,
  supabase: null as unknown,
  lead: null as Record<string, unknown> | null,
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/lib/auth", () => ({
  getUser: async () => ({ id: "user-1" }),
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))
vi.mock("@/server/queries/leads", () => ({
  getLead: async () => state.lead,
  listLeadStatuses: async () => [],
}))
vi.mock("@/server/plan-limits", () => ({ checkPlanLimit: vi.fn() }))
vi.mock("@/server/custom-fields", () => ({ saveCustomFieldValues: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { addLeadActivityAction } from "@/server/actions/leads"

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

describe("addLeadActivityAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "member" }
    state.lead = { id: LEAD }
    state.supabase = createSupabaseMock().client
  })

  it("registra a atividade com tipo e sem próximo passo", async () => {
    const mock = createSupabaseMock()
    state.supabase = mock.client

    const result = await addLeadActivityAction(
      undefined,
      form({ lead_id: LEAD, type: "whatsapp", description: "Mandei proposta" }),
    )

    expect(result?.success).toBe("Atividade registrada.")
    const calls = mock.callsFor("lead_activities")
    expect(calls).toHaveLength(1)
    expect(calls[0]).toContainEqual({
      method: "insert",
      args: [
        {
          tenant_id: TENANT,
          lead_id: LEAD,
          author_id: "user-1",
          type: "whatsapp",
          description: "Mandei proposta",
          next_step_at: null,
          next_step_note: null,
        },
      ],
    })
  })

  it("com próximo passo, fecha o anterior em aberto e agenda o novo", async () => {
    const mock = createSupabaseMock()
    state.supabase = mock.client

    const result = await addLeadActivityAction(
      undefined,
      form({
        lead_id: LEAD,
        type: "call",
        description: "Pediu retorno",
        next_step_at: "2026-12-01T14:30",
        next_step_note: "Ligar de novo",
      }),
    )

    expect(result?.success).toContain("próximo passo agendado")
    const [close, insert] = mock.callsFor("lead_activities")
    expect(close).toContainEqual({ method: "eq", args: ["lead_id", LEAD] })
    expect(close).toContainEqual({
      method: "is",
      args: ["next_step_done_at", null],
    })
    expect(insert).toContainEqual(
      expect.objectContaining({
        method: "insert",
        args: [
          expect.objectContaining({
            next_step_at: "2026-12-01T17:30:00.000Z",
            next_step_note: "Ligar de novo",
          }),
        ],
      }),
    )
  })

  it("tipo desconhecido vira nota; lead de outro tenant é recusado", async () => {
    const mock = createSupabaseMock()
    state.supabase = mock.client
    await addLeadActivityAction(
      undefined,
      form({ lead_id: LEAD, type: "fax", description: "x" }),
    )
    expect(mock.callsFor("lead_activities")[0]).toContainEqual(
      expect.objectContaining({
        args: [expect.objectContaining({ type: "note" })],
      }),
    )

    state.lead = null
    const refused = await addLeadActivityAction(
      undefined,
      form({ lead_id: LEAD, description: "x" }),
    )
    expect(refused).toEqual({ error: "Lead não encontrado." })
  })

  it("data inválida devolve erro sem gravar", async () => {
    const mock = createSupabaseMock()
    state.supabase = mock.client

    const result = await addLeadActivityAction(
      undefined,
      form({ lead_id: LEAD, description: "x", next_step_at: "ontem" }),
    )

    expect(result).toEqual({ error: "Data do próximo passo inválida." })
    expect(mock.callsFor("lead_activities")).toHaveLength(0)
  })
})
