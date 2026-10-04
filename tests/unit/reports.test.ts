import { describe, expect, it } from "vitest"
import {
  buildLeadConversionBySource,
  buildProductivity,
  buildProfitability,
} from "@/lib/reports"

describe("buildProfitability", () => {
  it("calcula margem por rótulo e ordena desc", () => {
    const rows = buildProfitability(
      [
        { id: "p1", label: "Projeto A" },
        { id: "p2", label: "Projeto B" },
      ],
      new Map([
        ["p1", 1000],
        ["p2", 400],
      ]),
      new Map([
        ["p1", 300],
        ["p2", 500],
      ]),
    )

    expect(rows).toEqual([
      {
        id: "p1",
        label: "Projeto A",
        revenue: 1000,
        expense: 300,
        margin: 700,
      },
      {
        id: "p2",
        label: "Projeto B",
        revenue: 400,
        expense: 500,
        margin: -100,
      },
    ])
  })

  it("inclui itens só com despesa ou só com receita", () => {
    const rows = buildProfitability(
      [{ id: "p1", label: "Projeto A" }],
      new Map([["p1", 100]]),
      new Map([["p2", 50]]),
    )
    expect(rows).toHaveLength(2)
    expect(rows.find((row) => row.id === "p2")?.margin).toBe(-50)
  })

  it("usa fallback quando não há rótulo", () => {
    const rows = buildProfitability([], new Map([["p1", 10]]), new Map())
    expect(rows[0].label).toBe("—")
  })
})

describe("buildProductivity", () => {
  const since = new Date("2026-01-01T00:00:00.000Z").getTime()

  it("conta tarefas concluídas no período e agrega horas", () => {
    const rows = buildProductivity(
      [
        { user_id: "u1", full_name: "Ana" },
        { user_id: "u2", full_name: "Bia" },
      ],
      [
        {
          assignee_id: "u1",
          status: 5,
          updated_at: "2026-02-01T00:00:00.000Z",
        },
        {
          assignee_id: "u1",
          status: 5,
          updated_at: "2025-12-01T00:00:00.000Z",
        },
        {
          assignee_id: "u1",
          status: 4,
          updated_at: "2026-02-02T00:00:00.000Z",
        },
      ],
      [
        {
          user_id: "u1",
          duration_seconds: 7200,
          is_billable: true,
          rate: 100,
        },
        {
          user_id: "u2",
          duration_seconds: 3600,
          is_billable: false,
          rate: null,
        },
      ],
      since,
    )

    const ana = rows.find((row) => row.userId === "u1")!
    expect(ana.name).toBe("Ana")
    expect(ana.tasksDone).toBe(1)
    expect(ana.seconds).toBe(7200)
    expect(ana.billableAmount).toBe(200)

    const bia = rows.find((row) => row.userId === "u2")!
    expect(bia.tasksDone).toBe(0)
    expect(bia.billableAmount).toBe(0)
  })

  it("ignora pessoas sem tarefas nem horas", () => {
    const rows = buildProductivity(
      [
        { user_id: "u1", full_name: "Ana" },
        { user_id: "u2", full_name: "Bia" },
      ],
      [],
      [],
      since,
    )
    expect(rows).toHaveLength(0)
  })
})

describe("buildLeadConversionBySource", () => {
  const statuses = [
    { id: "s-new", is_won: false, is_lost: false },
    { id: "s-won", is_won: true, is_lost: false },
    { id: "s-lost", is_won: false, is_lost: true },
  ]

  it("calcula total, ganhos, perdidos, abertos e conversão", () => {
    const rows = buildLeadConversionBySource(
      [
        {
          source: { id: "src1", name: "Site" },
          status: { id: "s-won" },
          value: 100,
        },
        {
          source: { id: "src1", name: "Site" },
          status: { id: "s-lost" },
          value: 50,
        },
        {
          source: { id: "src1", name: "Site" },
          status: { id: "s-new" },
          value: 20,
        },
        { source: null, status: { id: "s-won" }, value: 30 },
      ],
      statuses,
    )

    const site = rows.find((row) => row.sourceId === "src1")!
    expect(site.total).toBe(3)
    expect(site.won).toBe(1)
    expect(site.lost).toBe(1)
    expect(site.open).toBe(1)
    expect(site.rate).toBe(33)
    expect(site.wonValue).toBe(100)

    const none = rows.find((row) => row.sourceId === null)!
    expect(none.source).toBe("Sem origem")
    expect(none.rate).toBe(100)
  })

  it("ordena por total desc", () => {
    const rows = buildLeadConversionBySource(
      [
        { source: { id: "a", name: "A" }, status: { id: "s-won" }, value: 1 },
        { source: { id: "b", name: "B" }, status: { id: "s-won" }, value: 1 },
        { source: { id: "b", name: "B" }, status: { id: "s-won" }, value: 1 },
      ],
      statuses,
    )
    expect(rows[0].sourceId).toBe("b")
  })
})
