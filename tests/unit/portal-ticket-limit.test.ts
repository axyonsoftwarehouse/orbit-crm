import { describe, expect, it, vi } from "vitest"

const createClient = vi.hoisted(() => vi.fn())

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/lib/supabase/server", () => ({ createClient }))
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }))
vi.mock("@/server/queries/portal", () => ({
  getPortalContact: async () => ({
    id: "contact-1",
    tenant_id: "tenant-1",
    company_id: "co-1",
  }),
}))
vi.mock("@/server/plan-limits", () => ({
  checkPlanLimitWith: async () => ({
    ok: false,
    remaining: 0,
    message: "Seu plano permite até 10 tickets. Fale com a gente.",
  }),
}))
vi.mock("@/server/rate-limit", () => ({ isLoginRateLimited: vi.fn() }))
vi.mock("@/server/portal-notifications", () => ({
  notifyStaffEstimateResponse: vi.fn(),
  notifyStaffTicketOpened: vi.fn(),
  notifyStaffTicketReply: vi.fn(),
}))

import { createPortalTicketAction } from "@/server/actions/portal"

describe("createPortalTicketAction no limite do plano", () => {
  it("não mostra ao cliente detalhes do plano da agência", async () => {
    const data = new FormData()
    data.set("subject", "Site fora do ar")

    const result = await createPortalTicketAction(undefined, data)

    expect(result?.error).toBe(
      "Não foi possível abrir o chamado agora. Entre em contato com a equipe por outro canal.",
    )
    expect(result?.error).not.toMatch(/plano/i)
    expect(createClient).not.toHaveBeenCalled()
  })
})
