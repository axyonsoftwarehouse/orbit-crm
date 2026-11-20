import { describe, expect, it } from "vitest"
import { addDaysIso, formatDate, formatDateTime, todayIso } from "@/lib/format"

describe("formatDate", () => {
  it("data pura (YYYY-MM-DD) sai exatamente como digitada, sem fuso", () => {
    expect(formatDate("2026-11-19")).toBe("19/11/2026")
    expect(formatDate("2026-01-01")).toBe("01/01/2026")
    expect(formatDate("2026-12-31", "Pacific/Kiritimati")).toBe("31/12/2026")
  })

  it("timestamp usa o fuso do Brasil por padrão, não o do servidor", () => {
    // 01:30 UTC do dia 20 ainda é dia 19 em São Paulo (UTC-3).
    expect(formatDate("2026-11-20T01:30:00Z")).toBe("19/11/2026")
  })

  it("timestamp respeita o fuso informado", () => {
    expect(formatDate("2026-11-20T01:30:00Z", "UTC")).toBe("20/11/2026")
  })

  it("vazio vira travessão", () => {
    expect(formatDate(null)).toBe("—")
    expect(formatDate("")).toBe("—")
  })
})

describe("formatDateTime", () => {
  it("mostra data e hora no fuso do Brasil", () => {
    expect(formatDateTime("2026-11-20T01:30:00Z")).toBe("19/11/2026, 22:30")
  })

  it("aceita opções de formato", () => {
    expect(
      formatDateTime("2026-11-20T01:30:00Z", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    ).toMatch(/19 de nov\.?,? 22:30/)
  })

  it("vazio vira travessão", () => {
    expect(formatDateTime(null)).toBe("—")
  })
})

describe("todayIso / addDaysIso", () => {
  it("o dia de hoje é calculado no fuso do Brasil", () => {
    expect(todayIso(new Date("2026-11-20T01:30:00Z"))).toBe("2026-11-19")
    expect(todayIso(new Date("2026-11-20T03:30:00Z"))).toBe("2026-11-20")
  })

  it("soma dias sobre a data pura, atravessando mês e ano", () => {
    expect(addDaysIso("2026-11-19", 30)).toBe("2026-12-19")
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDaysIso("2026-03-01", -1)).toBe("2026-02-28")
  })
})

describe("toDateKey", () => {
  it("data pura passa direto; timestamp vira o dia no fuso do Brasil", async () => {
    const { toDateKey } = await import("@/lib/format")
    expect(toDateKey("2026-11-19")).toBe("2026-11-19")
    expect(toDateKey("2026-11-20T01:30:00Z")).toBe("2026-11-19")
    expect(toDateKey("2026-11-20T01:30:00Z", "UTC")).toBe("2026-11-20")
  })
})
