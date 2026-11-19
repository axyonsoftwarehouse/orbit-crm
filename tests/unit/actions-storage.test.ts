import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  membership: null as { tenantId: string; role: string } | null,
  result: { ok: true } as { ok: boolean; message?: string },
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/server/plan-limits", () => ({
  checkStorageLimit: vi.fn(async () => state.result),
}))

import { checkStorageLimit } from "@/server/plan-limits"
import { checkStorageQuotaAction } from "@/server/actions/storage"

describe("checkStorageQuotaAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: "t1", role: "member" }
    state.result = { ok: true }
    vi.mocked(checkStorageLimit).mockClear()
  })

  it("sem empresa ativa, recusa", async () => {
    state.membership = null
    await expect(checkStorageQuotaAction(10)).resolves.toEqual({
      error: "Nenhuma empresa ativa.",
    })
  })

  it("devolve a mensagem quando a cota estoura", async () => {
    state.result = { ok: false, message: "Limite de armazenamento" }
    await expect(checkStorageQuotaAction(10)).resolves.toEqual({
      error: "Limite de armazenamento",
    })
    expect(checkStorageLimit).toHaveBeenCalledWith("t1", 10)
  })

  it("libera quando cabe", async () => {
    await expect(checkStorageQuotaAction(10)).resolves.toEqual({})
  })

  it("recusa tamanho inválido", async () => {
    await expect(checkStorageQuotaAction(-1)).resolves.toEqual({
      error: "Arquivo inválido.",
    })
    expect(checkStorageLimit).not.toHaveBeenCalled()
  })
})
