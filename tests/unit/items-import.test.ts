import { describe, expect, it } from "vitest"
import { itemImportTemplate, parseItemsCsv } from "@/lib/items/import"

describe("parseItemsCsv", () => {
  it("mapeia cabeçalho com aliases e vírgula decimal", () => {
    const csv =
      "Nome;Categoria;Preço;Unidade;Imposto;Alíquota\nInstalação;Serviços;1.234,50;h;ISS;5"
    const result = parseItemsCsv(csv, { descriptions: [], groups: [] })
    expect(result.error).toBeNull()
    expect(result.rows[0]).toMatchObject({
      line: 2,
      status: "ok",
      data: {
        description: "Instalação",
        group: "Serviços",
        rate: 1234.5,
        unit: "h",
        tax_name: "ISS",
        tax_rate: 5,
      },
    })
  })

  it("marca duplicado por descrição normalizada (arquivo e existentes)", () => {
    const csv = "Descrição;Valor\nInstalacao;10\nInstalação;10\nManutenção;10"
    const result = parseItemsCsv(csv, {
      descriptions: ["INSTALAÇÃO"],
      groups: [],
    })
    expect(result.rows.map((row) => row.status)).toEqual([
      "duplicate",
      "duplicate",
      "ok",
    ])
  })

  it("linha inválida recebe número da linha e motivo", () => {
    const csv = "Descrição;Valor\nOk;10\n;20\nSem valor"
    const result = parseItemsCsv(csv, { descriptions: [], groups: [] })
    expect(result.rows[1]).toMatchObject({ line: 3, status: "invalid" })
    expect(result.rows[2]).toMatchObject({ line: 4, status: "invalid" })
  })

  it("exige nome e alíquota juntos e alíquota até 100", () => {
    const csv = "Descrição;Imposto;Alíquota\nA;ISS;\nB;ISS;120\nC;;5"
    expect(
      parseItemsCsv(csv, { descriptions: [], groups: [] }).rows.map(
        (row) => row.status,
      ),
    ).toEqual(["invalid", "invalid", "invalid"])
  })

  it("lista grupos novos sem repetir e ignora os existentes", () => {
    const csv = "Descrição;Valor;Grupo\nA;10;Serviços\nB;10;Serviços\nC;10;Licenças"
    const result = parseItemsCsv(csv, {
      descriptions: [],
      groups: ["serviços"],
    })
    expect(result.newGroups).toEqual(["Licenças"])
  })

  it("recusa mais de 1000 linhas de dados", () => {
    const csv =
      "Descrição\n" +
      Array.from({ length: 1001 }, (_, i) => `Item ${i}`).join("\n")
    expect(
      parseItemsCsv(csv, { descriptions: [], groups: [] }).error,
    ).toMatch(/1000/)
  })

  it("modelo sai com cabeçalho e duas linhas de exemplo", () => {
    const lines = itemImportTemplate().split(/\r?\n/)
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain("Descrição")
  })
})
