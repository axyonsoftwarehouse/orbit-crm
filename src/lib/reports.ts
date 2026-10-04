export type ProfitRow = {
  id: string
  label: string
  revenue: number
  expense: number
  margin: number
}

export function buildProfitability(
  labels: { id: string; label: string }[],
  revenueBy: Map<string, number>,
  expenseBy: Map<string, number>,
): ProfitRow[] {
  const labelById = new Map(labels.map((item) => [item.id, item.label]))
  const ids = new Set<string>([...revenueBy.keys(), ...expenseBy.keys()])

  return [...ids]
    .map((id) => {
      const revenue = revenueBy.get(id) ?? 0
      const expense = expenseBy.get(id) ?? 0
      return {
        id,
        label: labelById.get(id) ?? "—",
        revenue,
        expense,
        margin: revenue - expense,
      }
    })
    .sort((a, b) => b.margin - a.margin)
}

export type ProductivityRow = {
  userId: string
  name: string
  tasksDone: number
  seconds: number
  billableAmount: number
}

export function buildProductivity(
  members: { user_id: string; full_name: string | null }[],
  tasks: { assignee_id: string | null; status: number; updated_at: string }[],
  entries: {
    user_id: string
    duration_seconds: number | null
    is_billable: boolean
    rate: number | null
  }[],
  sinceMs: number,
): ProductivityRow[] {
  const nameById = new Map(members.map((m) => [m.user_id, m.full_name]))
  const tasksDone = new Map<string, number>()
  for (const task of tasks) {
    if (task.status !== 5 || !task.assignee_id) continue
    if (new Date(task.updated_at).getTime() < sinceMs) continue
    tasksDone.set(task.assignee_id, (tasksDone.get(task.assignee_id) ?? 0) + 1)
  }

  const timeByUser = new Map<
    string,
    { seconds: number; billableAmount: number }
  >()
  for (const entry of entries) {
    const current = timeByUser.get(entry.user_id) ?? {
      seconds: 0,
      billableAmount: 0,
    }
    const seconds = Number(entry.duration_seconds ?? 0)
    current.seconds += seconds
    if (entry.is_billable) {
      current.billableAmount += (seconds / 3600) * Number(entry.rate ?? 0)
    }
    timeByUser.set(entry.user_id, current)
  }

  const ids = new Set<string>([
    ...tasksDone.keys(),
    ...timeByUser.keys(),
    ...members.map((m) => m.user_id),
  ])

  return [...ids]
    .map((id) => {
      const time = timeByUser.get(id)
      return {
        userId: id,
        name: nameById.get(id) ?? "—",
        tasksDone: tasksDone.get(id) ?? 0,
        seconds: time?.seconds ?? 0,
        billableAmount: time?.billableAmount ?? 0,
      }
    })
    .filter((row) => row.tasksDone > 0 || row.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds || b.tasksDone - a.tasksDone)
}

export type LeadConversionRow = {
  sourceId: string | null
  source: string
  total: number
  won: number
  lost: number
  open: number
  rate: number
  wonValue: number
}

export function buildLeadConversionBySource(
  leads: {
    source: { id: string; name: string } | null
    status: { id: string } | null
    value: number | null
  }[],
  statuses: { id: string; is_won: boolean; is_lost: boolean }[],
): LeadConversionRow[] {
  const statusById = new Map(statuses.map((status) => [status.id, status]))
  const groups = new Map<string, LeadConversionRow>()

  for (const lead of leads) {
    const sourceId = lead.source?.id ?? null
    const key = sourceId ?? "__none"
    const row = groups.get(key) ?? {
      sourceId,
      source: lead.source?.name ?? "Sem origem",
      total: 0,
      won: 0,
      lost: 0,
      open: 0,
      rate: 0,
      wonValue: 0,
    }

    const status = lead.status ? statusById.get(lead.status.id) : undefined
    row.total += 1
    if (status?.is_won) {
      row.won += 1
      row.wonValue += Number(lead.value ?? 0)
    } else if (status?.is_lost) {
      row.lost += 1
    } else {
      row.open += 1
    }
    groups.set(key, row)
  }

  return [...groups.values()]
    .map((row) => ({
      ...row,
      rate: row.total > 0 ? Math.round((row.won / row.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}
