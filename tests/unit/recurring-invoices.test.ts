import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock("@/server/document-sharing/deliver", () => ({
  deliverDocumentEmail: vi.fn(async () => ({ sent: 1, total: 1 })),
}))

import { deliverDocumentEmail } from "@/server/document-sharing/deliver"
import { runRecurringInvoices } from "@/server/recurring-invoices"

const TENANT = "11111111-1111-4111-8111-111111111111"
const TEMPLATE = "22222222-2222-4222-8222-222222222222"
const COMPANY = "33333333-3333-4333-8333-333333333333"

const template = {
  id: TEMPLATE,
  tenant_id: TENANT,
  created_by: "u1",
  formatted_number: "FAT-0001",
  date: "2026-01-31",
  due_date: "2026-02-10",
  recurrence_interval_months: 1,
  recurrence_end_date: null,
  recurrence_auto_send: false,
  company_id: COMPANY,
  project_id: null,
  currency: "BRL",
  discount_type: "none",
  discount_percent: null,
  discount_total: 0,
  subtotal: 500,
  total_tax: 0,
  adjustment: 0,
  total: 500,
  reference_no: null,
  client_note: "Mensalidade",
  terms: null,
}

type Call = { method: string; args: unknown[] }

function setup(options: {
  template?: Partial<typeof template>
  lastSequence?: number | null
  insertError?: { code: string; message: string }
  contact?: { email: string | null } | null
}) {
  let created = 0
  return createSupabaseMock(
    {
      invoices: (calls: Call[]) => {
        if (calls.some((c) => c.method === "insert")) {
          if (options.insertError) {
            return { data: null, error: options.insertError }
          }
          created++
          return {
            data: {
              id: `new-${created}`,
              formatted_number: `FAT-00${10 + created}`,
              total: 500,
              currency: "BRL",
              due_date: "2026-03-10",
            },
            error: null,
          }
        }
        if (hasCall(calls, "eq", "recurrence_parent_id", TEMPLATE)) {
          return {
            data:
              options.lastSequence == null
                ? null
                : { recurrence_sequence: options.lastSequence },
            error: null,
          }
        }
        return { data: [{ ...template, ...options.template }], error: null }
      },
      tenants: {
        data: { currency: "BRL", invoice_prefix: "FAT-" },
        error: null,
      },
      document_items: (calls: Call[]) =>
        calls.some((c) => c.method === "insert")
          ? { data: null, error: null }
          : {
              data: [
                {
                  description: "Gestão de redes (mensal)",
                  qty: 1,
                  rate: 500,
                  unit: null,
                  tax_name: null,
                  tax_rate: null,
                  item_id: null,
                  position: 0,
                },
              ],
              error: null,
            },
      contacts: { data: options.contact ?? null, error: null },
      memberships: { data: [{ user_id: "owner-1" }], error: null },
      notifications: { data: null, error: null },
    },
    { next_document_number: { data: 11, error: null } },
  )
}

function insertedRows(mock: ReturnType<typeof setup>, table: string) {
  return mock
    .callsFor(table)
    .flatMap((calls) => calls.filter((c) => c.method === "insert"))
    .map((c) => c.args[0])
}

describe("runRecurringInvoices", () => {
  beforeEach(() => {
    vi.mocked(deliverDocumentEmail).mockClear()
  })

  it("gera a ocorrência em rascunho, copia itens e avisa a agência", async () => {
    const mock = setup({ lastSequence: null })

    const result = await runRecurringInvoices(
      mock.client as never,
      "2026-02-28",
    )

    expect(result).toEqual({ templates: 1, generated: 1, sent: 0, failed: 0 })
    const [invoice] = insertedRows(mock, "invoices") as Record<
      string,
      unknown
    >[]
    expect(invoice).toMatchObject({
      tenant_id: TENANT,
      company_id: COMPANY,
      status: 6,
      date: "2026-02-28",
      due_date: "2026-03-10",
      formatted_number: "FAT-000011",
      recurrence_parent_id: TEMPLATE,
      recurrence_sequence: 1,
      total: 500,
    })
    expect(invoice).not.toHaveProperty("recurrence_interval_months")

    const [items] = insertedRows(mock, "document_items") as Record<
      string,
      unknown
    >[][]
    expect(items).toEqual([
      expect.objectContaining({
        rel_type: "invoice",
        rel_id: "new-1",
        description: "Gestão de redes (mensal)",
      }),
    ])

    const [notification] = insertedRows(mock, "notifications") as Record<
      string,
      unknown
    >[]
    expect(notification).toMatchObject({
      user_id: "owner-1",
      type: "invoice_recurring",
      url: "/app/faturas/new-1",
    })
    expect(String(notification.body)).toContain("rascunho")
    expect(deliverDocumentEmail).not.toHaveBeenCalled()
  })

  it("não gera antes da data nem repete ocorrências já geradas", async () => {
    const before = setup({ lastSequence: null })
    await runRecurringInvoices(before.client as never, "2026-02-27")
    expect(insertedRows(before, "invoices")).toHaveLength(0)

    const done = setup({ lastSequence: 1 })
    await runRecurringInvoices(done.client as never, "2026-03-30")
    expect(insertedRows(done, "invoices")).toHaveLength(0)
  })

  it("envia ao contato principal quando o envio automático está ligado", async () => {
    const mock = setup({
      template: { recurrence_auto_send: true },
      contact: { email: " cliente@padaria.test " },
    })

    const result = await runRecurringInvoices(
      mock.client as never,
      "2026-02-28",
    )

    expect(result.sent).toBe(1)
    expect(deliverDocumentEmail).toHaveBeenCalledWith(
      mock.client,
      expect.objectContaining({
        tenantId: TENANT,
        kind: "invoice",
        emails: ["cliente@padaria.test"],
        userId: null,
      }),
    )
    const contactCalls = mock.callsFor("contacts")[0]!
    expect(hasCall(contactCalls, "eq", "is_primary", true)).toBe(true)
    expect(hasCall(contactCalls, "eq", "company_id", COMPANY)).toBe(true)
  })

  it("sem contato principal com e-mail, fica em rascunho e avisa", async () => {
    const mock = setup({
      template: { recurrence_auto_send: true },
      contact: null,
    })

    const result = await runRecurringInvoices(
      mock.client as never,
      "2026-02-28",
    )

    expect(result).toMatchObject({ generated: 1, sent: 0 })
    expect(deliverDocumentEmail).not.toHaveBeenCalled()
    const [notification] = insertedRows(mock, "notifications") as Record<
      string,
      unknown
    >[]
    expect(String(notification.body)).toContain(
      "não tem contato principal com e-mail",
    )
  })

  it("falha no envio fica em rascunho com o motivo no aviso", async () => {
    vi.mocked(deliverDocumentEmail).mockResolvedValueOnce({
      error: "Não foi possível enviar o e-mail. Tente novamente.",
    })
    const mock = setup({
      template: { recurrence_auto_send: true },
      contact: { email: "cliente@padaria.test" },
    })

    const result = await runRecurringInvoices(
      mock.client as never,
      "2026-02-28",
    )

    expect(result).toMatchObject({ generated: 1, sent: 0 })
    const [notification] = insertedRows(mock, "notifications") as Record<
      string,
      unknown
    >[]
    expect(notification.body).toBe(
      "Mensalidade de FAT-0001. Não foi enviada: o envio para cliente@padaria.test falhou. Ficou em rascunho.",
    )
  })

  it("ocorrência duplicada (corrida) não quebra a execução", async () => {
    const mock = setup({
      insertError: { code: "23505", message: "duplicate key" },
    })

    const result = await runRecurringInvoices(
      mock.client as never,
      "2026-02-28",
    )

    expect(result).toEqual({ templates: 1, generated: 0, sent: 0, failed: 1 })
    expect(insertedRows(mock, "notifications")).toHaveLength(0)
  })
})
