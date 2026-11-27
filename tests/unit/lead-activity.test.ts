import { describe, expect, it } from "vitest"
import {
  endOfTodayUtc,
  formatNextStep,
  isLeadActivityType,
  leadActivityTypeLabel,
  parseNextStepInput,
} from "@/lib/lead-activity"

// 27/11/2026 10:00 em São Paulo (UTC-3).
const NOW = new Date("2026-11-27T13:00:00.000Z")

describe("lead-activity", () => {
  it("valida o tipo e dá o rótulo", () => {
    expect(isLeadActivityType("whatsapp")).toBe(true)
    expect(isLeadActivityType("fax")).toBe(false)
    expect(leadActivityTypeLabel("call")).toBe("Ligação")
    expect(leadActivityTypeLabel("x")).toBe("Nota")
  })

  it("sem data não há próximo passo (a nota é ignorada)", () => {
    expect(parseNextStepInput({ at: "", note: "ligar" })).toEqual({
      values: { next_step_at: null, next_step_note: null },
    })
  })

  it("converte o horário do Brasil para UTC", () => {
    expect(
      parseNextStepInput({ at: "2026-12-01T14:30", note: "  fechar  " }),
    ).toEqual({
      values: {
        next_step_at: "2026-12-01T17:30:00.000Z",
        next_step_note: "fechar",
      },
    })
  })

  it("rejeita data inválida e nota longa", () => {
    expect(parseNextStepInput({ at: "amanhã", note: "" })).toEqual({
      error: "Data do próximo passo inválida.",
    })
    expect(
      parseNextStepInput({ at: "2026-12-01T14:30", note: "x".repeat(501) }),
    ).toHaveProperty("error")
  })

  it("fim de hoje é a meia-noite seguinte no Brasil", () => {
    expect(endOfTodayUtc(NOW)).toBe("2026-11-28T03:00:00.000Z")
    // 23:30 de 27/11 em SP já é 28/11 em UTC, mas ainda é "hoje".
    expect(endOfTodayUtc(new Date("2026-11-28T02:30:00.000Z"))).toBe(
      "2026-11-28T03:00:00.000Z",
    )
  })

  it("formata hoje, amanhã, ontem e outras datas", () => {
    expect(formatNextStep("2026-11-27T17:30:00.000Z", NOW)).toBe(
      "Hoje às 14:30",
    )
    expect(formatNextStep("2026-11-28T12:00:00.000Z", NOW)).toBe(
      "Amanhã às 09:00",
    )
    expect(formatNextStep("2026-11-26T12:00:00.000Z", NOW)).toBe(
      "Ontem às 09:00",
    )
    expect(formatNextStep("2026-12-05T13:00:00.000Z", NOW)).toBe(
      "05/12/2026 às 10:00",
    )
  })
})
