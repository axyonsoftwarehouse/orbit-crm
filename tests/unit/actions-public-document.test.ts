import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const state = vi.hoisted(() => ({
  admin: null as unknown,
  link: null as unknown,
  limited: false,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => state.admin,
}))
vi.mock("@/server/document-sharing/links", () => ({
  resolveDocumentLink: vi.fn(async () => state.link),
}))
vi.mock("@/server/rate-limit", () => ({
  getClientIp: async () => "1.2.3.4",
  isRateLimited: vi.fn(async () => state.limited),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { isRateLimited } from "@/server/rate-limit"
import { respondPublicEstimateAction } from "@/server/actions/public-document"

const link = {
  id: "l1",
  tenant_id: "t1",
  rel_type: "estimate",
  rel_id: "e1",
  expires_at: "2099-01-01T00:00:00Z",
}

function setup(
  estimate: Record<string, unknown> | null,
  updated: unknown[] = [{ status: 4 }],
) {
  const mock = createSupabaseMock({
    estimates: (calls) =>
      calls.some((call) => call.method === "update")
        ? { data: updated, error: null }
        : { data: estimate, error: null },
    document_links: { data: null, error: null },
  })
  state.admin = mock.client
  return mock
}

describe("respondPublicEstimateAction", () => {
  beforeEach(() => {
    state.link = link
    state.limited = false
    vi.mocked(isRateLimited).mockClear()
  })

  it("aplica limite por IP", async () => {
    state.limited = true
    setup({ id: "e1", status: 2, expiry_date: null })
    await expect(respondPublicEstimateAction("tok", true)).resolves.toEqual({
      error: "Muitas tentativas. Tente novamente em instantes.",
    })
    expect(isRateLimited).toHaveBeenCalledWith("doc:ip:1.2.3.4", 20, 600)
  })

  it("token inválido, expirado ou de fatura é recusado", async () => {
    setup({ id: "e1", status: 2, expiry_date: null })
    state.link = null
    await expect(respondPublicEstimateAction("tok", true)).resolves.toEqual({
      error: "Link inválido ou expirado.",
    })
    state.link = { ...link, rel_type: "invoice" }
    await expect(respondPublicEstimateAction("tok", true)).resolves.toEqual({
      error: "Link inválido ou expirado.",
    })
  })

  it("orçamento que não está Enviado devolve o status atual sem atualizar", async () => {
    const mock = setup({ id: "e1", status: 4, expiry_date: null })
    await expect(respondPublicEstimateAction("tok", false)).resolves.toEqual({
      status: 4,
    })
    const updated = mock
      .callsFor("estimates")
      .some((calls) => calls.some((call) => call.method === "update"))
    expect(updated).toBe(false)
  })

  it("orçamento vencido não pode ser aceito", async () => {
    setup({ id: "e1", status: 2, expiry_date: "2020-01-01" })
    await expect(respondPublicEstimateAction("tok", true)).resolves.toEqual({
      error: "Este orçamento venceu.",
    })
  })

  it("aceite grava 4 só se ainda estiver Enviado e marca a resposta no link", async () => {
    const mock = setup({ id: "e1", status: 2, expiry_date: "2099-12-31" })
    await expect(respondPublicEstimateAction("tok", true)).resolves.toEqual({
      status: 4,
    })
    const update = mock
      .callsFor("estimates")
      .find((calls) => calls.some((call) => call.method === "update"))!
    expect(hasCall(update, "update", { status: 4 })).toBe(true)
    expect(hasCall(update, "eq", "status", 2)).toBe(true)
    expect(hasCall(update, "eq", "tenant_id", "t1")).toBe(true)
    const linkUpdate = mock
      .callsFor("document_links")
      .find((calls) => calls.some((call) => call.method === "update"))
    expect(linkUpdate).toBeDefined()
  })

  it("recusa grava 3", async () => {
    const mock = setup({ id: "e1", status: 2, expiry_date: null }, [
      { status: 3 },
    ])
    await expect(respondPublicEstimateAction("tok", false)).resolves.toEqual({
      status: 3,
    })
    const update = mock
      .callsFor("estimates")
      .find((calls) => calls.some((call) => call.method === "update"))!
    expect(hasCall(update, "update", { status: 3 })).toBe(true)
  })

  it("corrida: se outro clique respondeu antes, devolve o status atual", async () => {
    const mock = createSupabaseMock({
      estimates: (calls) =>
        calls.some((call) => call.method === "update")
          ? { data: [], error: null }
          : calls.some(
                (call) => call.method === "select" && call.args[0] === "status",
              )
            ? { data: { status: 3 }, error: null }
            : { data: { id: "e1", status: 2, expiry_date: null }, error: null },
      document_links: { data: null, error: null },
    })
    state.admin = mock.client
    await expect(respondPublicEstimateAction("tok", true)).resolves.toEqual({
      status: 3,
    })
  })
})
