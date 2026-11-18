import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import { createSupabaseMock, hasCall } from "./supabase-mock"

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { buildProjectTools } from "@/server/ai/assistant/tools-project"
import { buildLeadTools } from "@/server/ai/assistant/tools-lead"
import { buildTicketTools } from "@/server/ai/assistant/tools-ticket"

type Mock = ReturnType<typeof createSupabaseMock>
const db = (mock: Mock) => mock.client as unknown as SupabaseClient<Database>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function run(tool: any, input: unknown = {}) {
  return tool.execute(input, { toolCallId: "call-1", messages: [] })
}

function scoped(
  calls: { method: string; args: unknown[] }[],
  column: string,
  id: string,
) {
  return (
    hasCall(calls, "eq", "tenant_id", "t1") && hasCall(calls, "eq", column, id)
  )
}

describe("ferramentas do projeto", () => {
  function tools(mock: Mock, companyId: string | null = "c1") {
    return buildProjectTools({
      supabase: db(mock),
      tenantId: "t1",
      projectId: "p1",
      companyId,
    })
  }

  it("só oferece proposeTask quando o projeto tem cliente", () => {
    const mock = createSupabaseMock()
    expect(Object.keys(tools(mock))).toContain("proposeTask")
    expect(Object.keys(tools(mock, null))).not.toContain("proposeTask")
    const withClient = tools(mock) as Record<string, object>
    expect(withClient.proposeTask).not.toHaveProperty("execute")
  })

  it("listTasks filtra tenant, projeto e não concluídas", async () => {
    const mock = createSupabaseMock({
      tasks: {
        data: [
          {
            name: "Revisar layout",
            status: 1,
            priority: 3,
            due_date: "2026-11-10",
            assignee: { full_name: "Ana" },
          },
        ],
        error: null,
      },
    })

    const result = await run(tools(mock).listTasks)

    const calls = mock.callsFor("tasks")[0]!
    expect(scoped(calls, "project_id", "p1")).toBe(true)
    expect(hasCall(calls, "neq", "status", 5)).toBe(true)
    expect(result.tasks[0]).toMatchObject({
      name: "Revisar layout",
      assignee: "Ana",
    })
  })

  it("getTimeSummary soma horas, faturáveis e não faturadas", async () => {
    const mock = createSupabaseMock({
      time_entries: {
        data: [
          { duration_seconds: 3600, is_billable: true, billed: false },
          { duration_seconds: 1800, is_billable: true, billed: true },
          { duration_seconds: 900, is_billable: false, billed: false },
        ],
        error: null,
      },
    })

    const result = await run(tools(mock).getTimeSummary)

    expect(result).toEqual({
      total_hours: 1.75,
      billable_hours: 1.5,
      unbilled_billable_hours: 1,
    })
    expect(scoped(mock.callsFor("time_entries")[0]!, "project_id", "p1")).toBe(
      true,
    )
  })

  it("getProjectOverview não busca contatos sem cliente", async () => {
    const mock = createSupabaseMock({
      projects: { data: { name: "Site", status: 2 }, error: null },
      project_members: {
        data: [{ profile: { full_name: "Bia" } }],
        error: null,
      },
    })

    const result = await run(tools(mock, null).getProjectOverview)

    expect(mock.callsFor("contacts")).toEqual([])
    expect(result.team).toEqual(["Bia"])
    expect(scoped(mock.callsFor("projects")[0]!, "id", "p1")).toBe(true)
  })

  it("erro de banco vira mensagem genérica", async () => {
    const mock = createSupabaseMock({
      milestones: { data: null, error: { message: "relation x" } },
    })

    await expect(run(tools(mock).listMilestones)).resolves.toEqual({
      error: "Não foi possível consultar os dados.",
    })
  })
})

describe("ferramentas do lead", () => {
  it("getLeadOverview achata status e origem e filtra pelo tenant", async () => {
    const mock = createSupabaseMock({
      leads: {
        data: {
          name: "Maria",
          email: "maria@acme.test",
          status: { name: "Negociação" },
          source: { name: "Site" },
        },
        error: null,
      },
    })
    const tools = buildLeadTools({
      supabase: db(mock),
      tenantId: "t1",
      leadId: "l1",
    })

    const result = await run(tools.getLeadOverview)

    expect(result.lead).toMatchObject({
      name: "Maria",
      status: "Negociação",
      source: "Site",
    })
    expect(scoped(mock.callsFor("leads")[0]!, "id", "l1")).toBe(true)
  })

  it("listActivities é do lead e do tenant", async () => {
    const mock = createSupabaseMock({
      lead_activities: {
        data: [
          { description: "Ligou", created_at: "2026-11-01", author: null },
        ],
        error: null,
      },
    })
    const tools = buildLeadTools({
      supabase: db(mock),
      tenantId: "t1",
      leadId: "l1",
    })

    const result = await run(tools.listActivities)

    expect(result.activities).toHaveLength(1)
    expect(scoped(mock.callsFor("lead_activities")[0]!, "lead_id", "l1")).toBe(
      true,
    )
  })
})

describe("ferramentas do ticket", () => {
  function tools(mock: Mock) {
    return buildTicketTools({
      supabase: db(mock),
      tenantId: "t1",
      ticketId: "k1",
    })
  }

  it("listReplies marca notas internas e quem respondeu", async () => {
    const mock = createSupabaseMock({
      ticket_replies: {
        data: [
          {
            body: "Não consigo entrar",
            is_internal: false,
            created_at: "1",
            contact_id: "ct1",
          },
          {
            body: "Cliente inadimplente",
            is_internal: true,
            created_at: "2",
            contact_id: null,
          },
        ],
        error: null,
      },
    })

    const result = await run(tools(mock).listReplies)

    expect(result.replies).toEqual([
      {
        from: "cliente",
        internal: false,
        created_at: "1",
        body: "Não consigo entrar",
      },
      {
        from: "equipe",
        internal: true,
        created_at: "2",
        body: "Cliente inadimplente",
      },
    ])
    expect(scoped(mock.callsFor("ticket_replies")[0]!, "ticket_id", "k1")).toBe(
      true,
    )
  })

  it("searchKnowledgeBase busca só publicados, no tenant, com termo saneado", async () => {
    const mock = createSupabaseMock({
      kb_articles: {
        data: [
          { title: "Redefinir senha", excerpt: null, content: "Passo a passo" },
        ],
        error: null,
      },
      faqs: {
        data: [{ question: "Esqueci a senha", answer: "Use o link" }],
        error: null,
      },
    })

    const result = await run(tools(mock).searchKnowledgeBase, {
      query: "senha,id.eq.1",
    })

    const kb = mock.callsFor("kb_articles")[0]!
    const faq = mock.callsFor("faqs")[0]!
    for (const calls of [kb, faq]) {
      expect(hasCall(calls, "eq", "tenant_id", "t1")).toBe(true)
      expect(hasCall(calls, "eq", "is_published", true)).toBe(true)
    }
    expect(
      hasCall(
        kb,
        "or",
        "title.ilike.%senha id.eq.1%,content.ilike.%senha id.eq.1%",
      ),
    ).toBe(true)
    expect(result).toEqual({
      articles: [{ title: "Redefinir senha", content: "Passo a passo" }],
      faqs: [{ question: "Esqueci a senha", answer: "Use o link" }],
    })
  })

  it("getTicket traduz status e prioridade e encurta a descrição", async () => {
    const mock = createSupabaseMock({
      tickets: {
        data: {
          formatted_number: "TK-1",
          subject: "Acesso",
          details: "x".repeat(5000),
          status: 1,
          priority: 2,
          created_at: "2026-11-01",
          company: { name: "Acme" },
          contact: { first_name: "Ana", last_name: "Lima" },
        },
        error: null,
      },
    })

    const result = await run(tools(mock).getTicket)

    expect(result.ticket.company).toBe("Acme")
    expect(result.ticket.contact).toBe("Ana Lima")
    expect(typeof result.ticket.status).toBe("string")
    expect(result.ticket.details.length).toBeLessThanOrEqual(4001)
    expect(scoped(mock.callsFor("tickets")[0]!, "id", "k1")).toBe(true)
  })

  it("draftReply não tem execute", () => {
    expect(tools(createSupabaseMock()).draftReply).not.toHaveProperty("execute")
  })
})
