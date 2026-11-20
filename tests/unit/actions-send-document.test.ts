import { beforeEach, describe, expect, it, vi } from "vitest"
import { createSupabaseMock, hasCall } from "./supabase-mock"

const TENANT = "11111111-1111-4111-8111-111111111111"
const COMPANY = "44444444-4444-4444-8444-444444444444"
const EST = "33333333-3333-4333-8333-333333333333"
const C1 = "55555555-5555-4555-8555-555555555555"
const C2 = "66666666-6666-4666-8666-666666666666"

const state = vi.hoisted(() => ({
  membership: null as { tenantId: string; role: string } | null,
  supabase: null as unknown,
  send: [] as { sent: boolean; skipped?: boolean }[],
}))

vi.mock("@/lib/tenant", () => ({
  getActiveMembership: async () => state.membership,
}))
vi.mock("@/lib/auth", () => ({ getUser: async () => ({ id: "u1" }) }))
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => state.supabase,
}))
vi.mock("@/lib/env", () => ({
  env: () => ({ NEXT_PUBLIC_SITE_URL: "https://crm.test" }),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock("@/server/document-sharing/load", () => ({
  loadDocument: vi.fn(async () => ({ kind: "estimate", number: "EST-000001" })),
}))
vi.mock("@/server/document-sharing/pdf", () => ({
  renderDocumentPdf: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
  documentFileName: () => "Orcamento-EST-000001.pdf",
}))
vi.mock("@/server/document-sharing/links", () => ({
  createDocumentLink: vi.fn(async () => ({ token: "tok123", id: "l1" })),
}))
vi.mock("@/server/email", () => ({
  sendTenantEmail: vi.fn(async () => state.send.shift() ?? { sent: true }),
}))

import { sendTenantEmail } from "@/server/email"
import { createDocumentLink } from "@/server/document-sharing/links"
import { sendDocumentAction } from "@/server/actions/send-document"

const estimate = {
  id: EST,
  company_id: COMPANY,
  status: 1,
  formatted_number: "EST-000001",
  total: 3000,
  currency: "BRL",
  date: "2026-11-19",
  expiry_date: "2026-12-19",
}

function setup(
  contacts: { id: string; email: string | null }[],
  doc: Record<string, unknown> | null = estimate,
  table = "estimates",
) {
  const mock = createSupabaseMock({
    [table]: { data: doc, error: null },
    contacts: { data: contacts, error: null },
    tenants: { data: { name: "Agência Aurora" }, error: null },
    document_links: { data: null, error: null },
  })
  state.supabase = mock.client
  return mock
}

function statusUpdate(
  mock: ReturnType<typeof createSupabaseMock>,
  table: string,
) {
  return mock
    .callsFor(table)
    .find((calls) => calls.some((call) => call.method === "update"))
}

describe("sendDocumentAction", () => {
  beforeEach(() => {
    state.membership = { tenantId: TENANT, role: "member" }
    state.send = []
    vi.mocked(sendTenantEmail).mockClear()
    vi.mocked(createDocumentLink).mockClear()
  })

  it("sem empresa ativa, recusa", async () => {
    state.membership = null
    setup([])
    const result = await sendDocumentAction({
      kind: "estimate",
      id: EST,
      contactIds: [C1],
    })
    expect(result.error).toBe("Nenhuma empresa ativa.")
  })

  it("contato sem e-mail ou de outro cliente é recusado", async () => {
    setup([
      { id: C1, email: "ana@cliente.test" },
      { id: C2, email: null },
    ])
    const result = await sendDocumentAction({
      kind: "estimate",
      id: EST,
      contactIds: [C1, C2],
    })
    expect(result.error).toBe("Selecione contatos deste cliente com e-mail.")
    expect(sendTenantEmail).not.toHaveBeenCalled()
  })

  it("envia um e-mail por contato, com PDF e link, e marca como enviado", async () => {
    const mock = setup([
      { id: C1, email: "ana@cliente.test" },
      { id: C2, email: "bia@cliente.test" },
    ])
    const result = await sendDocumentAction({
      kind: "estimate",
      id: EST,
      contactIds: [C1, C2],
      message: "Segue a proposta.",
    })

    expect(result).toMatchObject({ sent: 2 })
    expect(createDocumentLink).toHaveBeenCalledTimes(1)
    const calls = vi.mocked(sendTenantEmail).mock.calls
    expect(calls.map(([, params]) => params.to)).toEqual([
      "ana@cliente.test",
      "bia@cliente.test",
    ])
    const params = calls[0][1]
    expect(params.templateKey).toBe("estimate_sent")
    expect(params.vars.link).toBe("https://crm.test/d/tok123")
    expect(params.vars.message).toBe("Segue a proposta.")
    expect(params.attachments?.[0].filename).toBe("Orcamento-EST-000001.pdf")
    const update = statusUpdate(mock, "estimates")
    expect(update && hasCall(update, "update", { status: 2 })).toBe(true)
    expect(update && hasCall(update, "eq", "status", 1)).toBe(true)
  })

  it("fatura em rascunho passa a em aberto", async () => {
    const mock = setup(
      [{ id: C1, email: "ana@cliente.test" }],
      { ...estimate, status: 6, due_date: "2026-12-19" },
      "invoices",
    )
    await sendDocumentAction({ kind: "invoice", id: EST, contactIds: [C1] })
    expect(vi.mocked(sendTenantEmail).mock.calls[0][1].templateKey).toBe(
      "invoice_sent",
    )
    const update = statusUpdate(mock, "invoices")
    expect(update && hasCall(update, "update", { status: 1 })).toBe(true)
    expect(update && hasCall(update, "eq", "status", 6)).toBe(true)
  })

  it("um destinatário falhando não impede o outro", async () => {
    setup([
      { id: C1, email: "ana@cliente.test" },
      { id: C2, email: "bia@cliente.test" },
    ])
    state.send = [{ sent: false }, { sent: true }]
    const result = await sendDocumentAction({
      kind: "estimate",
      id: EST,
      contactIds: [C1, C2],
    })
    expect(result.sent).toBe(1)
    expect(sendTenantEmail).toHaveBeenCalledTimes(2)
  })

  it("sem Resend configurado, avisa e não muda o status", async () => {
    const mock = setup([{ id: C1, email: "ana@cliente.test" }])
    state.send = [{ sent: false, skipped: true }]
    const result = await sendDocumentAction({
      kind: "estimate",
      id: EST,
      contactIds: [C1],
    })
    expect(result.error).toBe(
      "E-mail não configurado. Configure o Resend para enviar documentos.",
    )
    expect(statusUpdate(mock, "estimates")).toBeUndefined()
    const revoked = mock
      .callsFor("document_links")
      .some((calls) => calls.some((call) => call.method === "update"))
    expect(revoked).toBe(true)
  })

  it("orçamento já respondido ou vencido e fatura cancelada não são enviados", async () => {
    for (const status of [3, 4, 5]) {
      setup([{ id: C1, email: "ana@cliente.test" }], { ...estimate, status })
      const result = await sendDocumentAction({
        kind: "estimate",
        id: EST,
        contactIds: [C1],
      })
      expect(result.error, `status ${status}`).toBe(
        "Este documento não pode mais ser enviado.",
      )
    }
    setup(
      [{ id: C1, email: "ana@cliente.test" }],
      { ...estimate, status: 5, due_date: null },
      "invoices",
    )
    const invoice = await sendDocumentAction({
      kind: "invoice",
      id: EST,
      contactIds: [C1],
    })
    expect(invoice.error).toBe("Este documento não pode mais ser enviado.")
    expect(sendTenantEmail).not.toHaveBeenCalled()
    expect(createDocumentLink).not.toHaveBeenCalled()
  })

  it("documento sem cliente não é enviado", async () => {
    setup([], { ...estimate, company_id: null })
    const result = await sendDocumentAction({
      kind: "estimate",
      id: EST,
      contactIds: [C1],
    })
    expect(result.error).toBe("Defina o cliente do documento antes de enviar.")
  })
})
