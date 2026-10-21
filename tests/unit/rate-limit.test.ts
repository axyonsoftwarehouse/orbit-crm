import { beforeEach, describe, expect, it, vi } from "vitest"

const rpcMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: rpcMock }),
}))

vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    }),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import {
  hashIdentifier,
  isLoginRateLimited,
  isRateLimited,
} from "@/server/rate-limit"

describe("rate limit", () => {
  beforeEach(() => {
    rpcMock.mockReset()
  })

  it("considera limitado quando a RPC retorna false", async () => {
    rpcMock.mockResolvedValue({ data: false, error: null })

    await expect(isRateLimited("test", 5, 60)).resolves.toBe(true)
    expect(rpcMock).toHaveBeenCalledWith("check_rate_limit", {
      p_bucket: "test",
      p_limit: 5,
      p_window_seconds: 60,
    })
  })

  it("libera quando a RPC retorna true", async () => {
    rpcMock.mockResolvedValue({ data: true, error: null })

    await expect(isRateLimited("test", 5, 60)).resolves.toBe(false)
  })

  it("falha aberto quando a RPC retorna erro", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } })

    await expect(isRateLimited("test", 5, 60)).resolves.toBe(false)
  })

  it("normaliza o e-mail no hash", () => {
    expect(hashIdentifier("  User@Example.COM ")).toBe(
      hashIdentifier("user@example.com"),
    )
  })

  it("aplica limite por IP e depois por e-mail", async () => {
    rpcMock
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null })

    await expect(isLoginRateLimited("User@Example.com")).resolves.toBe(true)
    expect(rpcMock).toHaveBeenNthCalledWith(1, "check_rate_limit", {
      p_bucket: "login:ip:203.0.113.10",
      p_limit: 20,
      p_window_seconds: 60,
    })
    expect(rpcMock).toHaveBeenNthCalledWith(2, "check_rate_limit", {
      p_bucket: `login:email:${hashIdentifier("user@example.com")}`,
      p_limit: 5,
      p_window_seconds: 60,
    })
  })
})
