import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"
import { filterCommands, normalizeText, sanitizeSearchTerm } from "@/lib/search"

const TENANT = "11111111-1111-4111-8111-111111111111"

const state = vi.hoisted(() => ({
  membership: null as { tenantId: string } | null,
  supabase: null as unknown,
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))

import { searchAction } from "@/server/actions/search"

describe("sanitizeSearchTerm", () => {
  it("remove a sintaxe de filtro do PostgREST e os curingas", () => {
    expect(sanitizeSearchTerm("acme,id.eq.1)")).toBe("acme id.eq.1")
    expect(sanitizeSearchTerm("50%_off")).toBe("50 off")
    expect(sanitizeSearchTerm("  a   b  ")).toBe("a b")
  })

  it("limita o tamanho", () => {
    expect(sanitizeSearchTerm("x".repeat(200))).toHaveLength(80)
  })
})

describe("filterCommands", () => {
  const commands = [
    { label: "Novo orçamento", keywords: "criar" },
    { label: "Orçamentos" },
    { label: "Faturas" },
  ]

  it("ignora acentos e maiúsculas", () => {
    expect(normalizeText("Orçamento ÁÉ")).toBe("orcamento ae")
    expect(filterCommands(commands, "ORCAMENTO").map((c) => c.label)).toEqual([
      "Novo orçamento",
      "Orçamentos",
    ])
  })

  it("exige todas as palavras e considera as palavras-chave", () => {
    expect(filterCommands(commands, "criar orc")).toEqual([commands[0]])
  })

  it("sem termo devolve tudo", () => {
    expect(filterCommands(commands, "  ")).toEqual(commands)
  })
})

describe("searchAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT }
  })

  it("busca em todas as entidades do tenant ativo e monta os links", async () => {
    const mock = createSupabaseMock({
      companies: {
        data: [{ id: "c1", name: "Acme", city: "SP" }],
        error: null,
      },
      contacts: {
        data: [
          {
            id: "ct1",
            first_name: "Ana",
            last_name: "Lima",
            email: "ana@acme.test",
            company_id: "c1",
          },
        ],
        error: null,
      },
      leads: {
        data: [{ id: "l1", name: "Bruno", company: "Acme Labs" }],
        error: null,
      },
      tickets: {
        data: [{ id: "t1", subject: "Acesso", formatted_number: "TK-1" }],
        error: null,
      },
      invoices: {
        data: [{ id: "i1", formatted_number: "INV-000001" }],
        error: null,
      },
    })
    state.supabase = mock.client

    const results = await searchAction("acme")

    expect(results.map((r) => [r.type, r.href])).toEqual([
      ["cliente", "/app/clientes/c1"],
      ["contato", "/app/clientes/c1"],
      ["lead", "/app/leads/l1"],
      ["ticket", "/app/tickets/t1"],
      ["fatura", "/app/faturas/i1"],
    ])
    expect(results[1]).toMatchObject({
      title: "Ana Lima",
      subtitle: "ana@acme.test",
    })

    const tables = mock.queries.map((q) => q.table)
    expect(tables).toEqual([
      "companies",
      "contacts",
      "leads",
      "projects",
      "tasks",
      "tickets",
      "invoices",
      "estimates",
      "seo_sites",
    ])
    for (const query of mock.queries) {
      expect(hasCall(query.calls, "eq", "tenant_id", TENANT)).toBe(true)
      expect(hasCall(query.calls, "is", "deleted_at", null)).toBe(true)
    }
  })

  it("o termo vai saneado para o filtro or()", async () => {
    const mock = createSupabaseMock()
    state.supabase = mock.client

    await searchAction("ana,id.eq.x")

    const leads = mock.callsFor("leads")[0]!
    expect(
      hasCall(
        leads,
        "or",
        "name.ilike.%ana id.eq.x%,company.ilike.%ana id.eq.x%,email.ilike.%ana id.eq.x%",
      ),
    ).toBe(true)
  })

  it("termo curto ou sem tenant não consulta o banco", async () => {
    const mock = createSupabaseMock()
    state.supabase = mock.client

    await expect(searchAction("a")).resolves.toEqual([])
    state.membership = null
    await expect(searchAction("acme")).resolves.toEqual([])
    expect(mock.client.from).not.toHaveBeenCalled()
  })
})
