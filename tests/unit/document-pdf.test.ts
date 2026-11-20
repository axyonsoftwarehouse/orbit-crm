import { describe, expect, it } from "vitest"
import { createSupabaseMock } from "./supabase-mock"
import {
  documentFileName,
  renderDocumentPdf,
} from "@/server/document-sharing/pdf"
import {
  loadDocument,
  type DocumentView,
} from "@/server/document-sharing/load"

const view: DocumentView = {
  kind: "estimate",
  id: "e1",
  number: "EST-000001",
  status: 2,
  date: "2026-11-19",
  dueOrExpiry: "2026-12-19",
  currency: "BRL",
  subtotal: 3000,
  discountTotal: 0,
  totalTax: 0,
  adjustment: 0,
  total: 3000,
  paid: 0,
  clientNote: "Obrigado pela confiança — pagamento em 30 dias. 🙂",
  terms: "Validade de 30 dias.",
  items: [
    {
      id: "i1",
      description: "Gestão de redes sociais (mensal) – ação € promoção",
      qty: 1,
      rate: 3000,
      unit: null,
      tax_name: null,
      tax_rate: null,
      position: 0,
    },
  ],
  company: {
    name: "Padaria Sol",
    vat: "12.345.678/0001-90",
    address: "Rua das Flores, 100",
    city: "São Paulo",
    state: "SP",
    zip: "01000-000",
    country: "Brasil",
  },
  tenant: { name: "Agência Aurora", logoUrl: null, primaryColor: "#0062FF" },
}

function header(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes.slice(0, 5))
}

describe("renderDocumentPdf", () => {
  it("gera PDF com acentos, travessão, euro e emoji (trocado)", async () => {
    const bytes = await renderDocumentPdf(view)
    expect(header(bytes)).toBe("%PDF-")
    expect(bytes.length).toBeGreaterThan(1000)
  })

  it("documento sem itens e sem cliente não lança", async () => {
    const bytes = await renderDocumentPdf({
      ...view,
      kind: "invoice",
      items: [],
      company: null,
      clientNote: null,
      terms: null,
      paid: 1000,
    })
    expect(header(bytes)).toBe("%PDF-")
  })
})

describe("documentFileName", () => {
  it("usa o tipo e o número", () => {
    expect(documentFileName(view)).toBe("Orcamento-EST-000001.pdf")
    expect(
      documentFileName({ ...view, kind: "invoice", number: "INV-000001" }),
    ).toBe("Fatura-INV-000001.pdf")
  })
})

describe("loadDocument", () => {
  const estimateRow = {
    id: "e1",
    formatted_number: "EST-000001",
    status: 2,
    date: "2026-11-19",
    expiry_date: "2026-12-19",
    currency: "BRL",
    subtotal: 3000,
    discount_total: 0,
    total_tax: 0,
    adjustment: 0,
    total: 3000,
    client_note: null,
    terms: null,
    company: { name: "Padaria Sol", vat: null, address: null, city: null, state: null, zip: null, country: null },
  }

  it("monta a visão do documento com itens, pagamentos e marca", async () => {
    const mock = createSupabaseMock({
      invoices: { data: { ...estimateRow, formatted_number: "INV-000001", due_date: "2026-12-19" }, error: null },
      document_items: { data: [], error: null },
      payments: { data: [{ amount: 500 }, { amount: "250.50" }], error: null },
      tenants: { data: { name: "Agência Aurora", logo_url: null, primary_color: null }, error: null },
    })
    const result = await loadDocument(mock.client as never, "t1", "invoice", "e1")
    expect(result?.number).toBe("INV-000001")
    expect(result?.paid).toBe(750.5)
    expect(result?.dueOrExpiry).toBe("2026-12-19")
    expect(result?.tenant.name).toBe("Agência Aurora")
  })

  it("documento inexistente ou de outro tenant devolve null", async () => {
    const mock = createSupabaseMock({ estimates: { data: null, error: null } })
    expect(await loadDocument(mock.client as never, "t1", "estimate", "x")).toBeNull()
  })
})
