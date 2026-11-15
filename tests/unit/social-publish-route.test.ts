// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({
  native: true,
}))

const rpcMock = vi.hoisted(() => vi.fn())
const fromMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/env", () => ({
  socialNativeEnabled: () => state.native,
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: rpcMock, from: fromMock }),
}))

import { POST } from "@/app/api/social/publish/route"

function request(authorization?: string) {
  return new Request("https://app.example/api/social/publish", {
    method: "POST",
    headers: authorization ? { authorization } : undefined,
  })
}

function stalePostsChain() {
  const chain: Record<string, unknown> = {}
  for (const method of ["select", "eq", "is"]) {
    chain[method] = () => chain
  }
  chain.limit = async () => ({ data: [] })
  return chain
}

beforeEach(() => {
  state.native = true
  rpcMock.mockReset()
  fromMock.mockReset()
  delete process.env.CRON_SECRET
})

describe("POST /api/social/publish", () => {
  it("responde 503 sem CRON_SECRET", async () => {
    const response = await POST(request("Bearer qualquer"))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: "server_misconfigured",
    })
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("responde 401 com segredo errado", async () => {
    process.env.CRON_SECRET = "correto"

    const response = await POST(request("Bearer errado"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" })
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("não processa quando o modo nativo está desligado", async () => {
    process.env.CRON_SECRET = "correto"
    state.native = false

    const response = await POST(request("Bearer correto"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, skipped: true })
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("processa um lote vazio", async () => {
    process.env.CRON_SECRET = "correto"
    rpcMock.mockImplementation((fn: string) =>
      fn === "claim_social_publish_targets"
        ? { data: [], error: null }
        : { data: null, error: null },
    )
    fromMock.mockImplementation(() => stalePostsChain())

    const response = await POST(request("Bearer correto"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      processed: 0,
      published: 0,
      failed: 0,
      retried: 0,
    })
    expect(rpcMock).toHaveBeenCalledWith("reset_stale_social_targets", {
      p_minutes: 10,
    })
    expect(rpcMock).toHaveBeenCalledWith("claim_social_publish_targets", {
      p_limit: 5,
    })
  })

  it("responde 500 quando o claim falha", async () => {
    process.env.CRON_SECRET = "correto"
    rpcMock.mockImplementation((fn: string) =>
      fn === "claim_social_publish_targets"
        ? { data: null, error: { message: "boom" } }
        : { data: null, error: null },
    )

    const response = await POST(request("Bearer correto"))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "claim_failed" })
  })
})
