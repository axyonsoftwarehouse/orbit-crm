import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const { loggerError } = vi.hoisted(() => ({ loggerError: vi.fn() }))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: loggerError },
}))

import { buildAssistantTools } from "@/server/ai/assistant/tools"

function tools(mock: ReturnType<typeof createSupabaseMock>) {
  return buildAssistantTools({
    supabase: mock.client as unknown as SupabaseClient<Database>,
    tenantId: "t1",
    companyId: "c1",
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function run(tool: any, input: unknown = {}) {
  return tool.execute(input, { toolCallId: "call-1", messages: [] })
}

describe("assistant tools", () => {
  it("listProjects filtra por tenant e cliente", async () => {
    const mock = createSupabaseMock({
      projects: {
        data: [{ id: "p1", name: "Site", status: 2, deadline: null }],
        error: null,
      },
    })

    const result = await run(tools(mock).listProjects)

    const calls = mock.callsFor("projects")[0]!
    expect(hasCall(calls, "eq", "tenant_id", "t1")).toBe(true)
    expect(hasCall(calls, "eq", "company_id", "c1")).toBe(true)
    expect(hasCall(calls, "is", "deleted_at", null)).toBe(true)
    expect(hasCall(calls, "limit", 20)).toBe(true)
    expect(result.projects[0]).toMatchObject({
      id: "p1",
      name: "Site",
      status: "Em andamento",
    })
  })

  it("listProjects sem projetos devolve lista vazia", async () => {
    const mock = createSupabaseMock({ projects: { data: [], error: null } })

    await expect(run(tools(mock).listProjects)).resolves.toEqual({
      projects: [],
    })
  })

  it("listOpenTasks busca só tarefas dos projetos do cliente e não concluídas", async () => {
    const mock = createSupabaseMock({
      projects: { data: [{ id: "p1" }, { id: "p2" }], error: null },
      tasks: {
        data: [{ id: "k1", name: "Revisar", status: 1, priority: 2 }],
        error: null,
      },
    })

    const result = await run(tools(mock).listOpenTasks)

    const taskCalls = mock.callsFor("tasks")[0]!
    expect(hasCall(taskCalls, "eq", "tenant_id", "t1")).toBe(true)
    expect(hasCall(taskCalls, "in", "project_id", ["p1", "p2"])).toBe(true)
    expect(hasCall(taskCalls, "neq", "status", 5)).toBe(true)
    expect(result.tasks).toHaveLength(1)
  })

  it("listOpenTasks sem projetos não consulta tarefas", async () => {
    const mock = createSupabaseMock({ projects: { data: [], error: null } })

    await expect(run(tools(mock).listOpenTasks)).resolves.toEqual({
      tasks: [],
    })
    expect(mock.callsFor("tasks")).toHaveLength(0)
  })

  it("erro de banco vira mensagem genérica", async () => {
    const mock = createSupabaseMock({
      invoices: { data: null, error: { message: "relation broke" } },
    })

    await expect(run(tools(mock).listInvoices)).resolves.toEqual({
      error: "Não foi possível consultar os dados.",
    })
    expect(loggerError).toHaveBeenCalled()
  })

  it("getClientOverview traz o cliente e os contatos do tenant", async () => {
    const mock = createSupabaseMock({
      companies: { data: { id: "c1", name: "Padaria" }, error: null },
      contacts: {
        data: [{ first_name: "Ana", last_name: "Lima", email: "a@x.com" }],
        error: null,
      },
    })

    const result = await run(tools(mock).getClientOverview)

    expect(
      hasCall(mock.callsFor("contacts")[0]!, "eq", "company_id", "c1"),
    ).toBe(true)
    expect(
      hasCall(mock.callsFor("contacts")[0]!, "eq", "tenant_id", "t1"),
    ).toBe(true)
    expect(result.company.name).toBe("Padaria")
    expect(result.contacts[0].name).toBe("Ana Lima")
  })

  it("proposeTask e draftEmail não têm execute", () => {
    const set = tools(createSupabaseMock())
    expect(set.proposeTask.execute).toBeUndefined()
    expect(set.draftEmail.execute).toBeUndefined()
  })
})
