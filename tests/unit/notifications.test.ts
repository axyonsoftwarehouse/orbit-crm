import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock } from "./supabase-mock"

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { logger } from "@/lib/logger"
import { createNotification } from "@/server/notifications"

const input = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
  title: "Aviso",
}

describe("createNotification", () => {
  beforeEach(() => vi.mocked(logger.error).mockClear())

  it("devolve true quando o insert funciona", async () => {
    const { client } = createSupabaseMock({
      notifications: { data: null, error: null },
    })
    await expect(createNotification(client as never, input)).resolves.toBe(true)
    expect(logger.error).not.toHaveBeenCalled()
  })

  it("devolve false e loga quando o insert falha", async () => {
    const { client } = createSupabaseMock({
      notifications: { data: null, error: { message: "rls" } },
    })
    await expect(createNotification(client as never, input)).resolves.toBe(
      false,
    )
    expect(logger.error).toHaveBeenCalled()
  })
})
