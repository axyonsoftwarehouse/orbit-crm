import { beforeEach, describe, expect, it, vi } from "vitest"
import { MockLanguageModelV4, convertArrayToReadableStream } from "ai/test"
import { mockUsage } from "./ai-test-utils"

const COMPANY = "33333333-3333-4333-8333-333333333333"

const state = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
  membership: { tenantId: "t1", role: "member" } as {
    tenantId: string
    role: string
  } | null,
  company: { id: "c1", name: "Padaria" } as { id: string; name: string } | null,
  configured: true,
  rateLimited: false,
  model: null as unknown,
}))

const { loggerError, getCompanyMock, buildToolsMock } = vi.hoisted(() => ({
  loggerError: vi.fn(),
  getCompanyMock: vi.fn(),
  buildToolsMock: vi.fn(() => ({})),
}))

vi.mock("@/lib/auth", () => ({
  getUser: async () => state.user,
  getProfile: async () => ({ full_name: "Ana" }),
}))
vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }))
vi.mock("@/server/queries/companies", () => ({ getCompany: getCompanyMock }))
vi.mock("@/server/ai/model", () => ({
  isAiConfigured: () => state.configured,
  getChatModel: () => state.model,
}))
vi.mock("@/server/rate-limit", () => ({
  isAiRateLimited: async () => state.rateLimited,
}))
vi.mock("@/server/ai/assistant/tools", () => ({
  buildAssistantTools: buildToolsMock,
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: loggerError },
}))

import { POST } from "@/app/api/ai/cliente/route"

function textStreamModel(text: string) {
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: convertArrayToReadableStream([
        { type: "stream-start", warnings: [] },
        { type: "text-start", id: "t" },
        { type: "text-delta", id: "t", delta: text },
        { type: "text-end", id: "t" },
        {
          type: "finish",
          finishReason: { unified: "stop", raw: "stop" },
          usage: mockUsage,
        },
      ]),
    }),
  })
}

function userMessage(i: number) {
  return {
    id: `m${i}`,
    role: "user",
    parts: [{ type: "text", text: `pergunta ${i}` }],
  }
}

function request(body: unknown) {
  return new Request("http://localhost/api/ai/cliente", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const validBody = { companyId: COMPANY, messages: [userMessage(1)] }

describe("POST /api/ai/cliente", () => {
  beforeEach(() => {
    state.user = { id: "u1" }
    state.membership = { tenantId: "t1", role: "member" }
    state.configured = true
    state.rateLimited = false
    state.model = textStreamModel("Olá do assistente")
    getCompanyMock.mockReset()
    getCompanyMock.mockResolvedValue({ id: COMPANY, name: "Padaria" })
    loggerError.mockReset()
  })

  it("sem usuário → 401", async () => {
    state.user = null
    expect((await POST(request(validBody))).status).toBe(401)
  })

  it("sem membership ativa → 403", async () => {
    state.membership = null
    expect((await POST(request(validBody))).status).toBe(403)
  })

  it("corpo inválido → 400", async () => {
    const res = await POST(request({ companyId: "x", messages: [] }))
    expect(res.status).toBe(400)
  })

  it("cliente de outro tenant → 404 sem chamar o modelo", async () => {
    getCompanyMock.mockResolvedValue(null)
    const model = state.model as MockLanguageModelV4

    const res = await POST(request(validBody))

    expect(res.status).toBe(404)
    expect(getCompanyMock).toHaveBeenCalledWith("t1", COMPANY)
    expect(model.doStreamCalls).toHaveLength(0)
  })

  it("sem chave → 503", async () => {
    state.configured = false
    const res = await POST(request(validBody))
    expect(res.status).toBe(503)
    await expect(res.json()).resolves.toEqual({
      error: "Assistente indisponível.",
    })
  })

  it("rate limit → 429", async () => {
    state.rateLimited = true
    const res = await POST(request(validBody))
    expect(res.status).toBe(429)
    await expect(res.json()).resolves.toEqual({
      error: "Muitas mensagens. Tente novamente em alguns minutos.",
    })
  })

  it("caso feliz → 200 com o texto do modelo", async () => {
    const res = await POST(request(validBody))

    expect(res.status).toBe(200)
    expect(await res.text()).toContain("Olá do assistente")
    expect(buildToolsMock).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "t1", companyId: COMPANY }),
    )
  })

  it("envia ao modelo no máximo as 20 últimas mensagens", async () => {
    const model = state.model as MockLanguageModelV4
    const messages = Array.from({ length: 30 }, (_, i) => userMessage(i))

    const res = await POST(request({ companyId: COMPANY, messages }))
    await res.text()

    const prompt = model.doStreamCalls[0]!.prompt
    const userTurns = prompt.filter((m) => m.role === "user")
    expect(userTurns).toHaveLength(20)
    expect(JSON.stringify(userTurns[0])).toContain("pergunta 10")
  })

  it("falha do provedor vira mensagem genérica e log", async () => {
    state.model = new MockLanguageModelV4({
      doStream: async () => {
        throw new Error("upstream 500")
      },
    })

    const res = await POST(request(validBody))
    const body = await res.text()

    expect(body).toContain("Não foi possível gerar a resposta agora.")
    expect(body).not.toContain("upstream 500")
    expect(loggerError).toHaveBeenCalledWith(
      "ai.assistant_failed",
      expect.anything(),
    )
  })
})
