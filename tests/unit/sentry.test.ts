import { describe, expect, it, vi } from "vitest"
import type { ErrorEvent } from "@sentry/nextjs"

const captureMessage = vi.hoisted(() => vi.fn())
vi.mock("@sentry/nextjs", () => ({ captureMessage }))

import { scrubEvent, sentryOptions } from "@/lib/sentry-options"
import { logger } from "@/lib/logger"

describe("sentryOptions", () => {
  it("fica desligado sem DSN", () => {
    expect(sentryOptions(undefined)).toMatchObject({
      enabled: false,
      sendDefaultPii: false,
    })
  })

  it("liga com DSN", () => {
    expect(sentryOptions("https://key@o1.ingest.sentry.io/1").enabled).toBe(
      true,
    )
  })
})

describe("scrubEvent", () => {
  it("remove cookies, corpo, cabeçalhos sensíveis e dados do usuário", () => {
    const event = scrubEvent({
      type: undefined,
      user: { id: "u1", email: "a@b.test", ip_address: "1.2.3.4" },
      request: {
        url: "https://crm.test/app",
        cookies: { sb: "secret" },
        data: { password: "x" },
        headers: {
          Cookie: "sb=secret",
          Authorization: "Bearer x",
          "user-agent": "vitest",
        },
      },
    } as ErrorEvent)

    expect(event.user).toEqual({ id: "u1" })
    expect(event.request).toEqual({
      url: "https://crm.test/app",
      headers: { "user-agent": "vitest" },
    })
  })
})

describe("logger", () => {
  it("envia erros ao Sentry com o contexto", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})

    logger.error("db.invoices", { error: "boom" })

    expect(captureMessage).toHaveBeenCalledWith("db.invoices", {
      level: "error",
      extra: { error: "boom" },
    })
  })

  it("não envia avisos", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    captureMessage.mockClear()

    logger.warn("algo")

    expect(captureMessage).not.toHaveBeenCalled()
  })
})
