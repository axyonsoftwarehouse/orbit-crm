import { describe, expect, it } from "vitest"
import {
  buildTimeline,
  chunk,
  formatHours,
  summarizeFinance,
  sumHours,
} from "@/lib/client-360"

describe("summarizeFinance", () => {
  const invoices = [
    { id: "a", status: 1, total: 1000, due_date: "2026-11-01" }, // em aberto, vencida
    { id: "b", status: 3, total: 500, due_date: "2026-12-31" }, // parcial
    { id: "c", status: 2, total: 300, due_date: null }, // paga
    { id: "d", status: 5, total: 999, due_date: "2026-01-01" }, // cancelada
    { id: "e", status: 6, total: 777, due_date: "2026-01-01" }, // rascunho
  ]

  it("soma saldo em aberto, recebido e conta vencidas", () => {
    const result = summarizeFinance(
      invoices,
      [
        { invoice_id: "b", amount: 200 },
        { invoice_id: "c", amount: 300 },
        { invoice_id: "d", amount: 50 },
      ],
      "2026-11-27",
    )

    expect(result).toEqual({
      receivable: 1300,
      received: 500,
      overdueCount: 1,
    })
  })

  it("não deixa saldo negativo e não conta vencida já quitada", () => {
    const result = summarizeFinance(
      [{ id: "a", status: 1, total: 100, due_date: "2026-01-01" }],
      [{ invoice_id: "a", amount: 150 }],
      "2026-11-27",
    )
    expect(result).toEqual({ receivable: 0, received: 150, overdueCount: 0 })
  })

  it("arredonda centavos", () => {
    const result = summarizeFinance(
      [{ id: "a", status: 1, total: 0.3, due_date: null }],
      [
        { invoice_id: "a", amount: 0.1 },
        { invoice_id: "a", amount: 0.1 },
      ],
      "2026-11-27",
    )
    expect(result.receivable).toBe(0.1)
    expect(result.received).toBe(0.2)
  })
})

describe("horas", () => {
  it("soma durações ignorando entradas em andamento", () => {
    expect(
      sumHours([
        { duration_seconds: 3600 },
        { duration_seconds: 1800 },
        { duration_seconds: null },
      ]),
    ).toBe(1.5)
  })

  it("formata em pt-BR", () => {
    expect(formatHours(1.5)).toBe("1,5 h")
    expect(formatHours(0)).toBe("0 h")
  })
})

describe("buildTimeline", () => {
  it("junta anotações, conversão e auditoria em ordem decrescente", () => {
    const items = buildTimeline({
      leads: [
        { id: "l1", name: "Padaria", converted_at: "2026-11-10T12:00:00Z" },
      ],
      notes: [
        {
          id: "n1",
          lead_id: "l1",
          description: "Ligou pedindo proposta",
          created_at: "2026-11-05T10:00:00Z",
          author_name: "Ana",
        },
      ],
      audit: [
        {
          id: "a1",
          entity: "invoices",
          entity_id: "inv1",
          action: "insert",
          created_at: "2026-11-20T09:00:00Z",
          actor_name: "Bruno",
        },
        {
          id: "a2",
          entity: "estimates",
          entity_id: "est1",
          action: "delete",
          created_at: "2026-11-15T09:00:00Z",
          actor_name: null,
        },
        {
          id: "a3",
          entity: "tasks",
          entity_id: "t1",
          action: "insert",
          created_at: "2026-11-21T09:00:00Z",
          actor_name: null,
        },
      ],
      names: new Map([["inv1", "FAT-0001"]]),
    })

    expect(items.map((item) => item.id)).toEqual([
      "audit:a1",
      "audit:a2",
      "conversion:l1",
      "note:n1",
    ])
    expect(items[0]).toMatchObject({
      text: "Criou fatura FAT-0001",
      href: "/app/faturas/inv1",
      author: "Bruno",
    })
    // Excluído não tem link.
    expect(items[1]).toMatchObject({ text: "Excluiu orçamento", href: null })
    expect(items[2]?.text).toBe('Lead "Padaria" convertido em cliente')
    expect(items[3]).toMatchObject({
      kind: "note",
      text: "Ligou pedindo proposta",
      href: "/app/leads/l1",
    })
  })

  it("respeita o limite", () => {
    const audit = Array.from({ length: 10 }, (_, i) => ({
      id: `a${i}`,
      entity: "projects",
      entity_id: `p${i}`,
      action: "update",
      created_at: `2026-11-${String(10 + i).padStart(2, "0")}T00:00:00Z`,
      actor_name: null,
    }))
    const items = buildTimeline({ leads: [], notes: [], audit }, 3)
    expect(items.map((item) => item.id)).toEqual([
      "audit:a9",
      "audit:a8",
      "audit:a7",
    ])
  })
})

describe("chunk", () => {
  it("divide em blocos", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(chunk([], 2)).toEqual([])
  })
})
