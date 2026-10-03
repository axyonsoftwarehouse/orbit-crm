import { describe, expect, it } from "vitest"
import { toCsv } from "@/lib/csv"

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
