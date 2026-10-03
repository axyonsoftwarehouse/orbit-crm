import { createClient } from "@/lib/supabase/server"

export type GoalMetric = "revenue" | "leads" | "hours"

export type Goal = {
  id: string
  title: string | null
  metric: GoalMetric
  period_start: string
  period_end: string
  target: number
}

export type GoalWithProgress = Goal & {
  achieved: number
  progress: number
}

async function achievedFor(tenantId: string, goal: Goal): Promise<number> {
  const supabase = await createClient()
  const from = `${goal.period_start}T00:00:00`
  const to = `${goal.period_end}T23:59:59`

  if (goal.metric === "revenue") {
    const { data } = await supabase
      .from("invoices")
      .select("total")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .neq("status", 5)
      .gte("date", goal.period_start)
      .lte("date", goal.period_end)
    return (data ?? []).reduce((sum, row) => sum + Number(row.total), 0)
  }

  if (goal.metric === "leads") {
    const { count } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .gte("created_at", from)
      .lte("created_at", to)
    return count ?? 0
  }

  const { data } = await supabase
    .from("time_entries")
    .select("duration_seconds")
    .eq("tenant_id", tenantId)
    .eq("is_billable", true)
    .gte("started_at", from)
    .lte("started_at", to)
  const seconds = (data ?? []).reduce(
    (sum, row) => sum + Number(row.duration_seconds ?? 0),
    0,
  )
  return Math.round((seconds / 3600) * 100) / 100
}

export async function listGoals(tenantId: string): Promise<GoalWithProgress[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("goals")
    .select("id, title, metric, period_start, period_end, target")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("period_end", { ascending: false })

  const goals = (data ?? []) as Goal[]

  return Promise.all(
    goals.map(async (goal) => {
      const achieved = await achievedFor(tenantId, goal)
      const target = Number(goal.target)
      const progress = target > 0 ? Math.round((achieved / target) * 100) : 0
      return { ...goal, target, achieved, progress }
    }),
  )
}

export async function getGoal(
  tenantId: string,
  id: string,
): Promise<Goal | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("goals")
    .select("id, title, metric, period_start, period_end, target")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()
  return (data as Goal | null) ?? null
}
