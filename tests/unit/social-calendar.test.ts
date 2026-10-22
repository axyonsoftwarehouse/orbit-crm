import { describe, expect, it } from "vitest"
import {
  addMonths,
  buildCalendarDays,
  monthKey,
  monthRange,
  parseMonth,
} from "@/lib/social-calendar"

describe("social calendar", () => {
  it("interpreta o mês da URL", () => {
    expect(parseMonth("2026-10")).toEqual({ year: 2026, month: 10 })
    expect(monthKey(parseMonth("2026-10"))).toBe("2026-10")
  })

  it("navega entre meses e anos", () => {
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({
      year: 2025,
      month: 12,
    })
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({
      year: 2027,
      month: 1,
    })
  })

  it("calcula o intervalo do mês em UTC", () => {
    expect(monthRange({ year: 2026, month: 2 })).toEqual({
      start: "2026-02-01T00:00:00.000Z",
      end: "2026-03-01T00:00:00.000Z",
    })
  })

  it("monta a grade com dias do mês anterior e seguinte", () => {
    const february = buildCalendarDays({ year: 2026, month: 2 })
    expect(february[0].key).toBe("2026-02-01")
    expect(february.at(-1)?.key).toBe("2026-02-28")
    expect(february.every((day) => day.inMonth)).toBe(true)

    const october = buildCalendarDays({ year: 2026, month: 10 })
    expect(october[0].key).toBe("2026-09-27")
    expect(october.length).toBe(35)
    expect(october.some((day) => !day.inMonth)).toBe(true)
  })
})
