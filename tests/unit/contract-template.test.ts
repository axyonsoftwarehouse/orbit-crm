import { describe, expect, it } from "vitest"
import {
  contractVars,
  hashContractContent,
  renderContractTemplate,
} from "@/lib/contracts/template"

describe("renderContractTemplate", () => {
  it("substitui placeholders conhecidos", () => {
    expect(
      renderContractTemplate("Oi {{cliente.nome}}", { "cliente.nome": "ACME" }),
    ).toEqual({ rendered: "Oi ACME", unresolved: [] })
  })

  it("mantém placeholder desconhecido e o lista uma vez só", () => {
    expect(
      renderContractTemplate("{{x.y}} {{x.y}} {{cliente.nome}}", {
        "cliente.nome": "A",
      }),
    ).toEqual({ rendered: "{{x.y}} {{x.y}} A", unresolved: ["x.y"] })
  })

  it("tolera espaços dentro das chaves", () => {
    expect(
      renderContractTemplate("{{ cliente.nome }}", { "cliente.nome": "B" })
        .rendered,
    ).toBe("B")
  })

  it("não interpreta chaves malformadas", () => {
    expect(renderContractTemplate("{{ }} {{a}}", { a: "1" }).rendered).toBe(
      "{{ }} 1",
    )
  })
})

describe("hashContractContent", () => {
  it("é estável e muda com o conteúdo", () => {
    expect(hashContractContent("abc")).toBe(hashContractContent("abc"))
    expect(hashContractContent("abc")).not.toBe(hashContractContent("abd"))
  })

  it("é sha-256 em hexadecimal", () => {
    expect(hashContractContent("abc")).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe("contractVars", () => {
  it("monta as variáveis a partir do contrato e do tenant", () => {
    const vars = contractVars({
      tenantName: "Orbit",
      companyName: "ACME",
      companyVat: "123",
      value: 1500,
      currency: "BRL",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      today: "2026-11-20",
    })

    expect(vars["empresa.nome"]).toBe("Orbit")
    expect(vars["cliente.nome"]).toBe("ACME")
    expect(vars["cliente.documento"]).toBe("123")
    expect(vars["contrato.valor"]).toContain("1.500")
    expect(vars["contrato.inicio"]).toBe("01/01/2026")
    expect(vars["contrato.fim"]).toBe("31/12/2026")
    expect(vars["data.hoje"]).toBe("20/11/2026")
  })

  it("usa vazio quando o dado não existe", () => {
    const vars = contractVars({
      tenantName: "Orbit",
      companyName: null,
      companyVat: null,
      value: null,
      currency: "BRL",
      startDate: null,
      endDate: null,
      today: "2026-11-20",
    })

    expect(vars["cliente.nome"]).toBe("")
    expect(vars["contrato.valor"]).toBe("")
    expect(vars["contrato.inicio"]).toBe("")
  })
})
