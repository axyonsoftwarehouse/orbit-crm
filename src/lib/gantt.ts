export const DAY_MS = 86_400_000

export type ScheduleTask = {
  id: string
  start_date: string | null
  due_date: string | null
}

export type ScheduleDependency = {
  task_id: string
  depends_on_task_id: string
}

export type ScheduleChange = {
  id: string
  start_date: string | null
  due_date: string | null
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00`)
  value.setDate(value.getDate() + days)
  return value.toISOString().slice(0, 10)
}

export function diffDays(a: string, b: string): number {
  return Math.round(
    (new Date(`${a}T00:00:00`).getTime() -
      new Date(`${b}T00:00:00`).getTime()) /
      DAY_MS,
  )
}

export function normalizeSchedule(
  tasks: ScheduleTask[],
  dependencies: ScheduleDependency[],
  edited: { id: string; start_date: string | null; due_date: string | null },
): ScheduleChange[] {
  const byId = new Map<string, ScheduleTask>()
  for (const task of tasks) byId.set(task.id, { ...task })

  const editedTask = byId.get(edited.id)
  if (!editedTask) return []
  editedTask.start_date = edited.start_date
  editedTask.due_date = edited.due_date

  const successors = new Map<string, string[]>()
  for (const dep of dependencies) {
    const list = successors.get(dep.depends_on_task_id) ?? []
    list.push(dep.task_id)
    successors.set(dep.depends_on_task_id, list)
  }

  const queue = [edited.id]
  let guard = 0
  while (queue.length > 0 && guard < 100_000) {
    guard++
    const predId = queue.shift()!
    const pred = byId.get(predId)
    if (!pred) continue
    const predEnd = pred.due_date ?? pred.start_date
    if (!predEnd) continue

    const requiredStart = addDays(predEnd, 1)
    for (const succId of successors.get(predId) ?? []) {
      const succ = byId.get(succId)
      if (!succ) continue
      const currentStart = succ.start_date ?? succ.due_date
      if (!currentStart || currentStart >= requiredStart) continue

      const delta = diffDays(requiredStart, currentStart)
      if (succ.start_date) succ.start_date = addDays(succ.start_date, delta)
      if (succ.due_date) succ.due_date = addDays(succ.due_date, delta)
      queue.push(succId)
    }
  }

  const changes: ScheduleChange[] = []
  for (const task of byId.values()) {
    const original = tasks.find((item) => item.id === task.id)
    if (!original) continue
    if (
      task.start_date !== original.start_date ||
      task.due_date !== original.due_date
    ) {
      changes.push({
        id: task.id,
        start_date: task.start_date,
        due_date: task.due_date,
      })
    }
  }
  return changes
}

export function wouldCreateCycle(
  dependencies: ScheduleDependency[],
  taskId: string,
  dependsOnId: string,
): boolean {
  if (taskId === dependsOnId) return true

  const successors = new Map<string, string[]>()
  for (const dep of dependencies) {
    const list = successors.get(dep.depends_on_task_id) ?? []
    list.push(dep.task_id)
    successors.set(dep.depends_on_task_id, list)
  }

  const stack = [taskId]
  const seen = new Set<string>()
  while (stack.length > 0) {
    const current = stack.pop()!
    if (current === dependsOnId) return true
    if (seen.has(current)) continue
    seen.add(current)
    for (const next of successors.get(current) ?? []) stack.push(next)
  }
  return false
}
