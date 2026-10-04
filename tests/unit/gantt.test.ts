import { describe, expect, it } from "vitest"
import {
  addDays,
  diffDays,
  normalizeSchedule,
  wouldCreateCycle,
} from "@/lib/gantt"

describe("addDays / diffDays", () => {
  it("soma dias corretamente", () => {
    expect(addDays("2026-01-30", 3)).toBe("2026-02-02")
    expect(addDays("2026-02-01", -1)).toBe("2026-01-31")
  })

  it("calcula a diferença em dias", () => {
    expect(diffDays("2026-03-10", "2026-03-01")).toBe(9)
    expect(diffDays("2026-03-01", "2026-03-10")).toBe(-9)
  })
})

describe("normalizeSchedule", () => {
  const tasks = [
    { id: "a", start_date: "2026-01-01", due_date: "2026-01-05" },
    { id: "b", start_date: "2026-01-04", due_date: "2026-01-08" },
    { id: "c", start_date: "2026-01-09", due_date: "2026-01-12" },
  ]
  const dependencies = [
    { task_id: "b", depends_on_task_id: "a" },
    { task_id: "c", depends_on_task_id: "b" },
  ]

  it("empurra a sucessora quando o término ultrapassa o início dela", () => {
    const changes = normalizeSchedule(tasks, dependencies, {
      id: "a",
      start_date: "2026-01-01",
      due_date: "2026-01-06",
    })
    const b = changes.find((change) => change.id === "b")
    const c = changes.find((change) => change.id === "c")
    expect(b).toEqual({
      id: "b",
      start_date: "2026-01-07",
      due_date: "2026-01-11",
    })
    expect(c).toEqual({
      id: "c",
      start_date: "2026-01-12",
      due_date: "2026-01-15",
    })
  })

  it("não altera sucessoras já posicionadas depois", () => {
    const changes = normalizeSchedule(tasks, dependencies, {
      id: "a",
      start_date: "2026-01-01",
      due_date: "2026-01-02",
    })
    expect(changes.find((change) => change.id === "b")).toBeUndefined()
    expect(changes.find((change) => change.id === "c")).toBeUndefined()
  })

  it("retorna apenas a tarefa editada quando não há dependências", () => {
    const changes = normalizeSchedule(tasks, [], {
      id: "b",
      start_date: "2026-02-01",
      due_date: "2026-02-05",
    })
    expect(changes).toEqual([
      { id: "b", start_date: "2026-02-01", due_date: "2026-02-05" },
    ])
  })

  it("ignora tarefa editada inexistente", () => {
    const changes = normalizeSchedule(tasks, dependencies, {
      id: "z",
      start_date: "2026-01-01",
      due_date: "2026-01-02",
    })
    expect(changes).toEqual([])
  })
})

describe("wouldCreateCycle", () => {
  const dependencies = [
    { task_id: "b", depends_on_task_id: "a" },
    { task_id: "c", depends_on_task_id: "b" },
  ]

  it("detecta ciclo indireto", () => {
    expect(wouldCreateCycle(dependencies, "a", "c")).toBe(true)
  })

  it("permite aresta sem ciclo", () => {
    expect(wouldCreateCycle(dependencies, "c", "a")).toBe(false)
    expect(wouldCreateCycle(dependencies, "d", "a")).toBe(false)
  })

  it("trata autodependência como ciclo", () => {
    expect(wouldCreateCycle(dependencies, "a", "a")).toBe(true)
  })
})
