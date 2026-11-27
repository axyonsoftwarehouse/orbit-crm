import { describe, expect, it } from "vitest"
import {
  addMonthsClamped,
  diffDays,
  dueOccurrences,
  nextOccurrenceDate,
  occurrenceDate,
  parseRecurrenceInput,
} from "@/lib/recurrence"

describe("addMonthsClamped", () => {
  it("mantém o dia e limita ao fim do mês", () => {
    expect(addMonthsClamped("2026-01-31", 1)).toBe("2026-02-28")
    expect(addMonthsClamped("2028-01-31", 1)).toBe("2028-02-29")
    expect(addMonthsClamped("2026-01-31", 3)).toBe("2026-04-30")
    expect(addMonthsClamped("2026-11-15", 2)).toBe("2027-01-15")
    expect(addMonthsClamped("2024-02-29", 12)).toBe("2025-02-28")
  })
})

describe("occurrenceDate", () => {
  it("calcula sempre a partir do modelo (sem escorregar)", () => {
    const dates = [1, 2, 3, 4].map((n) => occurrenceDate("2026-01-31", 1, n))
    expect(dates).toEqual([
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
    ])
  })

  it("trimestral e anual", () => {
    expect(occurrenceDate("2026-01-10", 3, 2)).toBe("2026-07-10")
    expect(occurrenceDate("2026-01-10", 12, 1)).toBe("2027-01-10")
  })
})

describe("diffDays", () => {
  it("conta dias atravessando meses e anos", () => {
    expect(diffDays("2026-01-25", "2026-02-04")).toBe(10)
    expect(diffDays("2026-12-31", "2027-01-01")).toBe(1)
  })
})

describe("dueOccurrences", () => {
  const template = {
    date: "2026-01-31",
    due_date: "2026-02-10",
    recurrence_interval_months: 1,
    recurrence_end_date: null,
  }

  it("gera só a próxima quando chega a data, mantendo o prazo", () => {
    expect(dueOccurrences(template, 0, "2026-02-27")).toEqual([])
    expect(dueOccurrences(template, 0, "2026-02-28")).toEqual([
      { sequence: 1, date: "2026-02-28", due_date: "2026-03-10" },
    ])
  })

  it("recupera ocorrências atrasadas sem repetir as já geradas", () => {
    expect(dueOccurrences(template, 1, "2026-05-01")).toEqual([
      { sequence: 2, date: "2026-03-31", due_date: "2026-04-10" },
      { sequence: 3, date: "2026-04-30", due_date: "2026-05-10" },
    ])
  })

  it("respeita a data final e o limite por execução", () => {
    expect(
      dueOccurrences(
        { ...template, recurrence_end_date: "2026-03-31" },
        0,
        "2026-12-31",
      ).map((o) => o.sequence),
    ).toEqual([1, 2])
    expect(dueOccurrences(template, 0, "2030-01-01", 3)).toHaveLength(3)
  })

  it("sem vencimento no modelo, gera sem vencimento", () => {
    expect(
      dueOccurrences({ ...template, due_date: null }, 0, "2026-02-28"),
    ).toEqual([{ sequence: 1, date: "2026-02-28", due_date: null }])
  })

  it("intervalo inválido não gera nada", () => {
    expect(
      dueOccurrences(
        { ...template, recurrence_interval_months: 2 },
        0,
        "2030-01-01",
      ),
    ).toEqual([])
  })
})

describe("nextOccurrenceDate", () => {
  it("mostra a próxima ou null depois do fim", () => {
    const template = {
      date: "2026-01-10",
      due_date: null,
      recurrence_interval_months: 3,
      recurrence_end_date: "2026-07-10",
    }
    expect(nextOccurrenceDate(template, 0)).toBe("2026-04-10")
    expect(nextOccurrenceDate(template, 1)).toBe("2026-07-10")
    expect(nextOccurrenceDate(template, 2)).toBeNull()
  })
})

describe("parseRecurrenceInput", () => {
  it("sem intervalo, não é recorrente", () => {
    expect(
      parseRecurrenceInput(
        { interval: "", endDate: "2027-01-01", autoSend: "on" },
        "2026-01-10",
      ),
    ).toEqual({
      values: {
        recurrence_interval_months: null,
        recurrence_end_date: null,
        recurrence_auto_send: false,
      },
    })
  })

  it("lê intervalo, fim e envio automático", () => {
    expect(
      parseRecurrenceInput(
        { interval: "3", endDate: "2027-01-01", autoSend: "on" },
        "2026-01-10",
      ),
    ).toEqual({
      values: {
        recurrence_interval_months: 3,
        recurrence_end_date: "2027-01-01",
        recurrence_auto_send: true,
      },
    })
  })

  it("rejeita intervalo inválido e fim antes da fatura", () => {
    expect(
      parseRecurrenceInput(
        { interval: "2", endDate: "", autoSend: null },
        "2026-01-10",
      ),
    ).toHaveProperty("error")
    expect(
      parseRecurrenceInput(
        { interval: "1", endDate: "2026-01-10", autoSend: null },
        "2026-01-10",
      ),
    ).toHaveProperty("error")
  })
})
