import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock } from "./supabase-mock"

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock("@/server/notifications", () => ({
  createNotification: vi.fn(async () => undefined),
}))
vi.mock("@/server/email", () => ({
  sendTenantEmail: vi.fn(async () => ({ sent: true })),
}))

import { createNotification } from "@/server/notifications"
import { sendTenantEmail } from "@/server/email"
import { runLeadNextStepReminders } from "@/server/lead-next-step-reminders"

const TENANT = "11111111-1111-4111-8111-111111111111"
// 27/11/2026 06:00 em São Paulo (horário do cron).
const NOW = new Date("2026-11-27T09:00:00.000Z")

function step(overrides: Record<string, unknown> = {}) {
  return {
    id: "act-1",
    tenant_id: TENANT,
    lead_id: "lead-1",
    type: "call",
    author_id: "author-1",
    next_step_at: "2026-11-27T17:30:00.000Z",
    next_step_note: "Fechar proposta",
    lead: { name: "Padaria Sol", assignee_id: "owner-1", deleted_at: null },
    ...overrides,
  }
}

function setup(rows: unknown[], notifyEmail = true) {
  return createSupabaseMock({
    lead_activities: (calls) =>
      calls.some((c) => c.method === "update")
        ? { data: null, error: null }
        : { data: rows, error: null },
    profiles: { data: { notify_email: notifyEmail }, error: null },
  })
}

function withAuth(mock: ReturnType<typeof setup>) {
  Object.assign(mock.client, {
    auth: {
      admin: {
        getUserById: async (id: string) => ({
          data: { user: { email: `${id}@agencia.test` } },
        }),
      },
    },
  })
  return mock
}

describe("runLeadNextStepReminders", () => {
  beforeEach(() => {
    vi.mocked(createNotification).mockClear()
    vi.mocked(sendTenantEmail).mockClear()
  })

  it("avisa o responsável no sino e por e-mail e marca como lembrado", async () => {
    const mock = withAuth(setup([step()]))

    const result = await runLeadNextStepReminders(mock.client as never, NOW)

    expect(result).toEqual({ reminders: 1, emails: 1 })
    expect(createNotification).toHaveBeenCalledWith(mock.client, {
      tenantId: TENANT,
      userId: "owner-1",
      type: "lead_next_step",
      title: "Próximo passo hoje: Padaria Sol",
      body: "Hoje às 14:30: Fechar proposta",
      url: "/app/leads/lead-1",
    })
    expect(sendTenantEmail).toHaveBeenCalledWith(
      mock.client,
      expect.objectContaining({
        templateKey: "lead_next_step",
        to: "owner-1@agencia.test",
      }),
    )

    const query = mock.callsFor("lead_activities")[0]!
    expect(query).toContainEqual({
      method: "lt",
      args: ["next_step_at", "2026-11-28T03:00:00.000Z"],
    })
    expect(query).toContainEqual({
      method: "is",
      args: ["next_step_reminded_at", null],
    })
    const update = mock.callsFor("lead_activities")[1]!
    expect(update).toContainEqual({
      method: "update",
      args: [{ next_step_reminded_at: NOW.toISOString() }],
    })
    expect(update).toContainEqual({ method: "in", args: ["id", ["act-1"]] })
  })

  it("sem responsável, avisa quem registrou; atrasado vem marcado", async () => {
    const mock = withAuth(
      setup([
        step({
          next_step_at: "2026-11-25T13:00:00.000Z",
          lead: { name: "Padaria Sol", assignee_id: null, deleted_at: null },
        }),
      ]),
    )

    await runLeadNextStepReminders(mock.client as never, NOW)

    expect(createNotification).toHaveBeenCalledWith(
      mock.client,
      expect.objectContaining({
        userId: "author-1",
        title: "Próximo passo atrasado: Padaria Sol",
      }),
    )
  })

  it("respeita quem desligou o e-mail", async () => {
    const mock = withAuth(setup([step()], false))

    const result = await runLeadNextStepReminders(mock.client as never, NOW)

    expect(result).toEqual({ reminders: 1, emails: 0 })
    expect(sendTenantEmail).not.toHaveBeenCalled()
  })

  it("lead excluído não avisa, mas é marcado para não voltar", async () => {
    const mock = withAuth(
      setup([
        step({
          lead: {
            name: "Antigo",
            assignee_id: "owner-1",
            deleted_at: "2026-11-01T00:00:00Z",
          },
        }),
      ]),
    )

    const result = await runLeadNextStepReminders(mock.client as never, NOW)

    expect(result.reminders).toBe(0)
    expect(createNotification).not.toHaveBeenCalled()
    expect(mock.callsFor("lead_activities")).toHaveLength(2)
  })
})
