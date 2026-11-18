import { beforeEach, describe, expect, it, vi } from "vitest"
import { MockLanguageModelV4, convertArrayToReadableStream } from "ai/test"
import { mockUsage } from "./ai-test-utils"

const ID = "33333333-3333-4333-8333-333333333333"

const state = vi.hoisted(() => ({
  project: null as Record<string, unknown> | null,
  company: null as Record<string, unknown> | null,
  lead: null as Record<string, unknown> | null,
  ticket: null as Record<string, unknown> | null,
  model: null as unknown,
  prompts: [] as string[],
}))

vi.mock("@/lib/auth", () => ({
  getUser: async () => ({ id: "u1" }),
  getProfile: async () => ({ full_name: "Ana" }),
}))
vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => ({ tenantId: "t1", role: "member" }),
}))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }))
vi.mock("@/server/queries/projects", () => ({
  getProject: async () => state.project,
}))
vi.mock("@/server/queries/companies", () => ({
  getCompany: async () => state.company,
}))
vi.mock("@/server/queries/leads", () => ({ getLead: async () => state.lead }))
vi.mock("@/server/queries/tickets", () => ({
  getTicket: async () => state.ticket,
}))
vi.mock("@/server/ai/model", () => ({
  isAiConfigured: () => true,
  getChatModel: () => state.model,
}))
vi.mock("@/server/rate-limit", () => ({
  checkAiRateLimit: async () => "allowed",
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { POST as projectPOST } from "@/app/api/ai/projeto/route"
import { POST as leadPOST } from "@/app/api/ai/lead/route"
import { POST as ticketPOST } from "@/app/api/ai/ticket/route"

function model() {
  return new MockLanguageModelV4({
    doStream: async (options) => {
      const system = options.prompt.find((m) => m.role === "system")
      state.prompts.push(String(system?.content ?? ""))
      return {
        stream: convertArrayToReadableStream([
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "t" },
          { type: "text-delta", id: "t", delta: "ok" },
          { type: "text-end", id: "t" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: "stop" },
            usage: mockUsage,
          },
        ]),
      }
    },
  })
}

function request(field: string, id = ID) {
  return new Request("http://localhost/api/ai", {
    method: "POST",
    body: JSON.stringify({
      [field]: id,
      messages: [
        { id: "m1", role: "user", parts: [{ type: "text", text: "oi" }] },
      ],
    }),
  })
}

const cases = [
  {
    name: "projeto",
    POST: projectPOST,
    field: "projectId",
    key: "project" as const,
    notFound: "Projeto não encontrado.",
  },
  {
    name: "lead",
    POST: leadPOST,
    field: "leadId",
    key: "lead" as const,
    notFound: "Lead não encontrado.",
  },
  {
    name: "ticket",
    POST: ticketPOST,
    field: "ticketId",
    key: "ticket" as const,
    notFound: "Ticket não encontrado.",
  },
]

describe.each(cases)(
  "rota do assistente: $name",
  ({ POST, field, key, notFound }) => {
    beforeEach(() => {
      state.project = { id: ID, name: "Site novo", company_id: "c1" }
      state.company = { id: "c1", name: "Acme" }
      state.lead = { id: ID, name: "Maria" }
      state.ticket = { id: ID, formatted_number: "TK-7", subject: "Sem acesso" }
      state.model = model()
      state.prompts = []
    })

    it("entidade de outro tenant → 404 sem chamar o modelo", async () => {
      state[key] = null

      const res = await POST(request(field))

      expect(res.status).toBe(404)
      expect(await res.text()).toBe(notFound)
      expect(state.prompts).toEqual([])
    })

    it("ID inválido → 400", async () => {
      const res = await POST(request(field, "nao-e-uuid"))
      expect(res.status).toBe(400)
    })

    it("caso feliz responde em streaming", async () => {
      const res = await POST(request(field))
      expect(res.status).toBe(200)
      expect(await res.text()).toContain("ok")
      expect(state.prompts).toHaveLength(1)
    })
  },
)

describe("prompts por entidade", () => {
  beforeEach(() => {
    state.project = { id: ID, name: "Site novo", company_id: "c1" }
    state.company = { id: "c1", name: "Acme" }
    state.lead = { id: ID, name: "Maria" }
    state.ticket = { id: ID, formatted_number: "TK-7", subject: "Sem acesso" }
    state.model = model()
    state.prompts = []
  })

  it("projeto com cliente leva o ID para proposeTask", async () => {
    await (await projectPOST(request("projectId"))).text()
    expect(state.prompts[0]).toContain(
      'o projeto "Site novo" do cliente "Acme"',
    )
    expect(state.prompts[0]).toContain(`proposeTask com project_id "${ID}"`)
  })

  it("projeto sem cliente não promete criar tarefas", async () => {
    state.project = { id: ID, name: "Interno", company_id: null }
    await (await projectPOST(request("projectId"))).text()
    expect(state.prompts[0]).not.toContain("chame proposeTask")
    expect(state.prompts[0]).toContain("não pode criar tarefas")
  })

  it("lead e ticket identificam a entidade e as regras", async () => {
    await (await leadPOST(request("leadId"))).text()
    await (await ticketPOST(request("ticketId"))).text()
    expect(state.prompts[0]).toContain('o lead "Maria"')
    expect(state.prompts[1]).toContain('TK-7 ("Sem acesso")')
    expect(state.prompts[1]).toContain("nunca as cite nem revele")
  })
})
