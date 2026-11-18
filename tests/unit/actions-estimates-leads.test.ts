import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const USER = "22222222-2222-4222-8222-222222222222"
const COMPANY = "33333333-3333-4333-8333-333333333333"

const state = vi.hoisted(() => ({
  membership: null as { tenantId: string; role: string } | null,
  supabase: null as unknown,
  estimate: null as Record<string, unknown> | null,
  estimateItems: [] as unknown[],
  lead: null as Record<string, unknown> | null,
  statuses: [] as unknown[],
  planOk: true,
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/lib/auth", () => ({
  getUser: async () => ({ id: "22222222-2222-4222-8222-222222222222" }),
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))
vi.mock("@/server/queries/documents", () => ({
  getEstimate: async () => state.estimate,
  listDocumentItems: async () => state.estimateItems,
}))
vi.mock("@/server/queries/leads", () => ({
  getLead: async () => state.lead,
  listLeadStatuses: async () => state.statuses,
}))
vi.mock("@/server/plan-limits", () => ({
  checkPlanLimit: async () => ({ ok: state.planOk }),
}))
vi.mock("@/server/custom-fields", () => ({
  saveCustomFieldValues: vi.fn(),
}))
vi.mock("@/server/documents", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/documents")>()),
  replaceDocumentItems: vi.fn(async () => undefined),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { replaceDocumentItems } from "@/server/documents"
import { convertEstimateToInvoiceAction } from "@/server/actions/estimates"
import { convertLeadToCustomerAction } from "@/server/actions/leads"

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

function firstInsert(calls: { method: string; args: unknown[] }[][]) {
  return calls.flat().find((call) => call.method === "insert")?.args[0] as
    Record<string, unknown> | undefined
}

describe("convertEstimateToInvoiceAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "member" }
    vi.mocked(replaceDocumentItems).mockClear()
    state.estimate = {
      id: "est-1",
      date: "2026-11-01",
      company_id: COMPANY,
      project_id: null,
      currency: "BRL",
      subtotal: 500,
      discount_type: "before_tax",
      discount_percent: null,
      discount_total: 0,
      total_tax: 0,
      adjustment: 0,
      total: 500,
      client_note: "Obrigado",
      terms: null,
      reference_no: "REF-1",
    }
    state.estimateItems = [
      {
        description: "Landing page",
        qty: "1",
        rate: "500",
        unit: null,
        tax_name: null,
        tax_rate: null,
      },
    ]
  })

  it("copia valores e itens para a fatura e marca o orçamento", async () => {
    const mock = createSupabaseMock(
      { invoices: { data: { id: "inv-5" }, error: null } },
      { next_document_number: { data: 8, error: null } },
    )
    state.supabase = mock.client

    await expect(
      convertEstimateToInvoiceAction(form({ id: "est-1" })),
    ).rejects.toThrow("REDIRECT:/app/faturas/inv-5")

    expect(firstInsert(mock.callsFor("invoices"))).toMatchObject({
      tenant_id: TENANT,
      created_by: USER,
      number: 8,
      formatted_number: "INV-000008",
      company_id: COMPANY,
      total: 500,
      reference_no: "REF-1",
      due_date: "2026-12-01",
    })
    expect(vi.mocked(replaceDocumentItems).mock.calls[0]![4]).toEqual([
      {
        description: "Landing page",
        qty: 1,
        rate: 500,
        unit: null,
        tax_name: null,
        tax_rate: null,
      },
    ])
    const estimateUpdate = mock.callsFor("estimates")[0]!
    expect(
      hasCall(estimateUpdate, "update", { invoice_id: "inv-5", status: 4 }),
    ).toBe(true)
    expect(hasCall(estimateUpdate, "eq", "tenant_id", TENANT)).toBe(true)
  })

  it("orçamento inexistente (ou de outro tenant) não gera fatura", async () => {
    state.estimate = null
    const mock = createSupabaseMock()
    state.supabase = mock.client

    await convertEstimateToInvoiceAction(form({ id: "est-x" }))

    expect(mock.client.rpc).not.toHaveBeenCalled()
  })

  it("não marca o orçamento se a fatura falhar", async () => {
    const mock = createSupabaseMock(
      { invoices: { data: null, error: { message: "boom" } } },
      { next_document_number: { data: 8, error: null } },
    )
    state.supabase = mock.client

    await convertEstimateToInvoiceAction(form({ id: "est-1" }))

    expect(mock.callsFor("estimates")).toEqual([])
  })
})

describe("convertLeadToCustomerAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "member" }
    state.planOk = true
    state.statuses = [
      { id: "st-new", is_won: false },
      { id: "st-won", is_won: true },
    ]
    state.lead = {
      id: "lead-1",
      name: "Maria da Silva",
      company: "Acme",
      email: "maria@acme.test",
      phone: "11999990000",
      website: null,
      city: "São Paulo",
      state: "SP",
      country: "BR",
      title: "CEO",
      status_id: "st-new",
      converted_company_id: null,
    }
  })

  function setup(company: unknown = { id: "co-1" }) {
    const mock = createSupabaseMock({
      companies: { data: company, error: company ? null : { message: "x" } },
    })
    state.supabase = mock.client
    return mock
  }

  it("cria cliente e contato, marca o lead como ganho e registra a atividade", async () => {
    const mock = setup()

    await expect(
      convertLeadToCustomerAction(form({ id: "lead-1" })),
    ).rejects.toThrow("REDIRECT:/app/clientes/co-1")

    expect(firstInsert(mock.callsFor("companies"))).toMatchObject({
      tenant_id: TENANT,
      name: "Acme",
      created_by: USER,
    })
    expect(firstInsert(mock.callsFor("contacts"))).toMatchObject({
      tenant_id: TENANT,
      company_id: "co-1",
      first_name: "Maria",
      last_name: "da Silva",
      email: "maria@acme.test",
      is_primary: true,
    })
    const leadUpdate = mock.callsFor("leads")[0]!
    const update = leadUpdate.find((call) => call.method === "update")
    expect(update?.args[0]).toMatchObject({
      converted_company_id: "co-1",
      lost: false,
      status_id: "st-won",
    })
    expect(hasCall(leadUpdate, "eq", "tenant_id", TENANT)).toBe(true)
    expect(firstInsert(mock.callsFor("lead_activities"))).toMatchObject({
      tenant_id: TENANT,
      lead_id: "lead-1",
    })
  })

  it("lead já convertido só redireciona para o cliente", async () => {
    state.lead = { ...state.lead!, converted_company_id: "co-old" }
    const mock = setup()

    await expect(
      convertLeadToCustomerAction(form({ id: "lead-1" })),
    ).rejects.toThrow("REDIRECT:/app/clientes/co-old")
    expect(mock.client.from).not.toHaveBeenCalled()
  })

  it("respeita o limite de clientes do plano", async () => {
    state.planOk = false
    const mock = setup()

    await expect(
      convertLeadToCustomerAction(form({ id: "lead-1" })),
    ).rejects.toThrow("REDIRECT:/app/leads/lead-1")
    expect(mock.client.from).not.toHaveBeenCalled()
  })

  it("sem empresa no lead usa o nome da pessoa", async () => {
    state.lead = { ...state.lead!, company: null, name: "João" }
    const mock = setup()

    await expect(
      convertLeadToCustomerAction(form({ id: "lead-1" })),
    ).rejects.toThrow("REDIRECT")

    expect(firstInsert(mock.callsFor("companies"))).toMatchObject({
      name: "João",
    })
    expect(firstInsert(mock.callsFor("contacts"))).toMatchObject({
      first_name: "João",
      last_name: null,
    })
  })

  it("falha ao criar o cliente não altera o lead", async () => {
    const mock = setup(null)

    await convertLeadToCustomerAction(form({ id: "lead-1" }))

    expect(mock.callsFor("contacts")).toEqual([])
    expect(mock.callsFor("leads")).toEqual([])
  })
})
