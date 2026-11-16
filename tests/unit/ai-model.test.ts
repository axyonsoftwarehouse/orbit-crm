import { beforeEach, describe, expect, it, vi } from "vitest"

const envState = vi.hoisted(() => ({
  apiKey: "or-key" as string | undefined,
}))

const { createOpenRouterMock, chatMock } = vi.hoisted(() => {
  const chatMock = vi.fn(() => ({ modelId: "vendor/model-test" }))
  const createOpenRouterMock = vi.fn(() => ({ chat: chatMock }))
  return { createOpenRouterMock, chatMock }
})

vi.mock("@/lib/env", () => ({
  env: () => ({
    OPENROUTER_API_KEY: envState.apiKey,
    OPENROUTER_MODEL: "vendor/model-test",
  }),
}))

vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: createOpenRouterMock,
}))

import { AiError, getChatModel, isAiConfigured } from "@/server/ai/model"

describe("AI model (OpenRouter)", () => {
  beforeEach(() => {
    envState.apiKey = "or-key"
    createOpenRouterMock.mockClear()
    chatMock.mockClear()
  })

  it("usa a chave e o modelo do env com roteamento sem retenção", () => {
    getChatModel()
    expect(createOpenRouterMock).toHaveBeenCalledWith({ apiKey: "or-key" })
    expect(chatMock).toHaveBeenCalledWith("vendor/model-test", {
      provider: { data_collection: "deny", zdr: true },
    })
    expect(isAiConfigured()).toBe(true)
  })

  it("lança AiError sem chave", () => {
    envState.apiKey = undefined
    expect(() => getChatModel()).toThrow(AiError)
    expect(isAiConfigured()).toBe(false)
    expect(createOpenRouterMock).not.toHaveBeenCalled()
  })
})
