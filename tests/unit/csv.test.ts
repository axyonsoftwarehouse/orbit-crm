import { describe, expect, it } from "vitest"
import { parseCsv, toCsv } from "@/lib/csv"

describe("toCsv", () => {
  it("gera cabeçalho e linhas separadas por ;", () => {
    const csv = toCsv(
      ["A", "B"],
      [
        ["x", 1],
        ["y", null],
      ],
    )
    expect(csv).toBe("A;B\r\nx;1\r\ny;")
  })

  it("escapa células com ; aspas e quebras de linha", () => {
    const csv = toCsv(["A"], [["a;b"], ['c"d'], ["e\nf"]])
    expect(csv).toBe('A\r\n"a;b"\r\n"c""d"\r\n"e\nf"')
  })
})

describe("parseCsv", () => {
  it("detecta ; e preserva o cabeçalho", () => {
    const rows = parseCsv("Nome;Telefone\r\nACME;123")
    expect(rows).toEqual([
      ["Nome", "Telefone"],
      ["ACME", "123"],
    ])
  })

  it("respeita campos entre aspas com ; e aspas escapadas", () => {
    const rows = parseCsv('A;B\n"x;y";"a""b"')
    expect(rows).toEqual([
      ["A", "B"],
      ["x;y", 'a"b'],
    ])
  })

  it("ignora linhas vazias", () => {
    const rows = parseCsv("A;B\n\n1;2\n")
    expect(rows).toEqual([
      ["A", "B"],
      ["1", "2"],
    ])
  })
})
