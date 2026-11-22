import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const USER = "22222222-2222-4222-8222-222222222222"
const PROJECT = "44444444-4444-4444-8444-444444444444"
const COMPANY = "33333333-3333-4333-8333-333333333333"

const state = vi.hoisted(() => ({
  membership: null as { tenantId: string; role: string } | null,
  supabase: null as unknown,
  unbilled: [] as unknown[],
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
vi.mock("@/server/queries/time", () => ({
  listUnbilledBillableEntries: async () => state.unbilled,
}))
vi.mock("@/server/documents", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/documents")>()),
  replaceDocumentItems: vi.fn(async () => ({ error: null })),
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
import {
  createInvoiceAction,
  invoiceBillableTimeAction,
  recordPaymentAction,
} from "@/server/actions/invoices"

function form(values: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

function updatesOf(calls: { method: string; args: unknown[] }[][]) {
  return calls
    .flatMap((query) => query)
    .filter((call) => call.method === "update")
    .map((call) => call.args[0])
}

describe("recordPaymentAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "member" }
  })

  function setup(payments: { amount: number }[]) {
    const mock = createSupabaseMock({
      payments: { data: payments, error: null },
      invoices: { data: { total: 1000, status: 1 }, error: null },
    })
    state.supabase = mock.client
    return mock
  }

  const valid = {
    invoice_id: "inv-1",
    amount: "400",
    payment_date: "2026-11-17",
  }

  it("pagamento parcial deixa a fatura parcialmente paga", async () => {
    const mock = setup([{ amount: 400 }])

    const result = await recordPaymentAction(undefined, form(valid))

    expect(result).toEqual({ success: "Pagamento registrado." })
    const insert = mock
      .callsFor("payments")[0]!
      .find((call) => call.method === "insert")
    expect(insert?.args[0]).toMatchObject({
      tenant_id: TENANT,
      invoice_id: "inv-1",
      amount: 400,
      created_by: USER,
    })
    expect(updatesOf(mock.callsFor("invoices"))).toEqual([{ status: 3 }])
  })

  it("pagamento que quita o total marca a fatura como paga", async () => {
    const mock = setup([{ amount: 600 }, { amount: 400 }])

    await recordPaymentAction(undefined, form(valid))

    expect(updatesOf(mock.callsFor("invoices"))).toEqual([{ status: 2 }])
  })

  it("não recalcula fatura cancelada", async () => {
    const mock = createSupabaseMock({
      invoices: { data: { total: 1000, status: 5 }, error: null },
    })
    state.supabase = mock.client

    await recordPaymentAction(undefined, form(valid))

    expect(updatesOf(mock.callsFor("invoices"))).toEqual([])
  })

  it("recusa valor inválido sem tocar no banco", async () => {
    const mock = setup([])

    const result = await recordPaymentAction(
      undefined,
      form({ ...valid, amount: "-5" }),
    )

    expect(result).toEqual({ error: "Informe um valor válido." })
    expect(mock.client.from).not.toHaveBeenCalled()
  })

  it("exige a data do pagamento", async () => {
    setup([])

    const result = await recordPaymentAction(
      undefined,
      form({ ...valid, payment_date: "" }),
    )

    expect(result).toEqual({ error: "Informe a data do pagamento." })
  })

  it("devolve mensagem genérica em erro de banco", async () => {
    const mock = createSupabaseMock({
      payments: { data: null, error: { message: "violates constraint x" } },
    })
    state.supabase = mock.client

    const result = await recordPaymentAction(undefined, form(valid))

    expect(result?.error).toBe(
      "Não foi possível concluir a operação. Tente novamente.",
    )
  })

  it("sem tenant ativo", async () => {
    state.membership = null

    await expect(recordPaymentAction(undefined, form(valid))).resolves.toEqual({
      error: "Nenhuma empresa ativa.",
    })
  })
})

describe("createInvoiceAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "member" }
    vi.mocked(replaceDocumentItems).mockClear()
  })

  const items = JSON.stringify([
    { description: "Consultoria", qty: 2, rate: 150 },
  ])

  it("cria a fatura numerada com o prefixo do tenant", async () => {
    const mock = createSupabaseMock(
      {
        tenants: { data: { invoice_prefix: "FAT-" }, error: null },
        invoices: { data: { id: "inv-9" }, error: null },
      },
      { next_document_number: { data: 42, error: null } },
    )
    state.supabase = mock.client

    const result = await createInvoiceAction(
      undefined,
      form({ date: "2026-11-17", items, company_id: COMPANY }),
    )

    expect(result).toEqual({ success: "Fatura criada." })
    expect(mock.client.rpc).toHaveBeenCalledWith("next_document_number", {
      p_tenant: TENANT,
      p_kind: "invoice",
    })
    const insert = mock
      .callsFor("invoices")[0]!
      .find((call) => call.method === "insert")
    expect(insert?.args[0]).toMatchObject({
      tenant_id: TENANT,
      number: 42,
      formatted_number: "FAT-000042",
      status: 1,
      total: 300,
    })
    expect(replaceDocumentItems).toHaveBeenCalledWith(
      mock.client,
      TENANT,
      "invoice",
      "inv-9",
      expect.any(Array),
    )
  })

  it("falha ao gerar o número", async () => {
    const mock = createSupabaseMock(
      {},
      { next_document_number: { data: null, error: { message: "boom" } } },
    )
    state.supabase = mock.client

    const result = await createInvoiceAction(
      undefined,
      form({ date: "2026-11-17", items }),
    )

    expect(result).toEqual({ error: "Falha ao gerar o número." })
    expect(mock.callsFor("invoices")).toEqual([])
  })
})

describe("invoiceBillableTimeAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "member" }
    vi.mocked(replaceDocumentItems).mockClear()
  })

  it("agrupa horas por tarefa e valor, fatura e marca como faturadas", async () => {
    state.unbilled = [
      {
        id: "t1",
        task_id: "a",
        task_name: "Design",
        rate: 100,
        duration_seconds: 3600,
      },
      {
        id: "t2",
        task_id: "a",
        task_name: "Design",
        rate: 100,
        duration_seconds: 1800,
      },
      {
        id: "t3",
        task_id: "b",
        task_name: "Dev",
        rate: 200,
        duration_seconds: 7200,
      },
    ]
    const mock = createSupabaseMock(
      {
        projects: { data: { company_id: COMPANY, name: "Site" }, error: null },
        invoices: { data: { id: "inv-7" }, error: null },
      },
      { next_document_number: { data: 3, error: null } },
    )
    state.supabase = mock.client

    await expect(
      invoiceBillableTimeAction(form({ project_id: PROJECT })),
    ).rejects.toThrow("REDIRECT:/app/faturas/inv-7")

    const projectQuery = mock.callsFor("projects")[0]!
    expect(hasCall(projectQuery, "eq", "tenant_id", TENANT)).toBe(true)

    const insert = mock
      .callsFor("invoices")[0]!
      .find((call) => call.method === "insert")
    expect(insert?.args[0]).toMatchObject({
      tenant_id: TENANT,
      company_id: COMPANY,
      project_id: PROJECT,
      subtotal: 550,
      total: 550,
    })

    expect(vi.mocked(replaceDocumentItems).mock.calls[0]![4]).toEqual([
      { description: "Design", qty: 1.5, rate: 100 },
      { description: "Dev", qty: 2, rate: 200 },
    ])

    const billed = mock.callsFor("time_entries")[0]!
    expect(hasCall(billed, "update", { billed: true })).toBe(true)
    expect(hasCall(billed, "in", "id", ["t1", "t2", "t3"])).toBe(true)
    expect(hasCall(billed, "eq", "tenant_id", TENANT)).toBe(true)
  })

  it("sem horas a faturar não cria nada", async () => {
    state.unbilled = []
    const mock = createSupabaseMock()
    state.supabase = mock.client

    await invoiceBillableTimeAction(form({ project_id: PROJECT }))

    expect(mock.client.rpc).not.toHaveBeenCalled()
    expect(mock.callsFor("invoices")).toEqual([])
  })

  it("não marca horas se a fatura falhar", async () => {
    state.unbilled = [
      {
        id: "t1",
        task_id: "a",
        task_name: "Design",
        rate: 100,
        duration_seconds: 3600,
      },
    ]
    const mock = createSupabaseMock(
      { invoices: { data: null, error: { message: "boom" } } },
      { next_document_number: { data: 3, error: null } },
    )
    state.supabase = mock.client

    await invoiceBillableTimeAction(form({ project_id: PROJECT }))

    expect(mock.callsFor("time_entries")).toEqual([])
  })
})
