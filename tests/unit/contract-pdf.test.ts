import { describe, expect, it } from "vitest"
import {
  contractFileName,
  renderContractPdf,
} from "@/server/document-sharing/contract-pdf"
import type { ContractView } from "@/server/document-sharing/contract-view"

const base: ContractView = {
  id: "c1",
  title: "Contrato de serviço",
  body: "Entre {{empresa.nome}} e a contratante, fica ajustado o presente contrato.",
  value: 1500,
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  status: 1,
  signedAt: null,
  signatureUrl: null,
  acceptance: null,
  company: {
    name: "ACME",
    vat: "123",
    address: null,
    city: null,
    state: null,
    zip: null,
    country: null,
  },
  tenant: {
    name: "Orbit",
    logoUrl: null,
    primaryColor: "#0062FF",
    legalText: null,
  },
}

describe("renderContractPdf", () => {
  it("gera um PDF válido para contrato pendente", async () => {
    const bytes = await renderContractPdf(base)
    expect(bytes.length).toBeGreaterThan(1024)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-")
  })

  it("gera o PDF de contrato assinado sem quebrar sem imagem", async () => {
    const bytes = await renderContractPdf({
      ...base,
      signedAt: "2026-02-01T12:00:00Z",
      acceptance: {
        firstname: "Ana",
        lastname: "Souza",
        email: "ana@acme.com",
        date: "2026-02-01T12:00:00Z",
        ip: "1.2.3.4",
        userAgent: "vitest",
        hash: "a".repeat(64),
      },
    })
    expect(bytes.length).toBeGreaterThan(1024)
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-")
  })
})

describe("contractFileName", () => {
  it("usa o título sem acento e sem espaço", () => {
    expect(contractFileName(base)).toBe("Contrato-Contrato-de-servico.pdf")
  })
})
