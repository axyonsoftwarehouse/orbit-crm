import { createClient } from "@/lib/supabase/server"

export type Milestone = {
  id: string
  project_id: string
  name: string
  description: string | null
  status: number
  color: string
  start_date: string | null
  due_date: string | null
  date_finished: string | null
  position: number
}

export type MilestoneListItem = Milestone & {
  task_count: number
  done_count: number
  progress: number
}

export type MilestoneOption = {
  id: string
  name: string
  project_id: string
}

const MILESTONE_COLUMNS =
  "id, project_id, name, description, status, color, start_date, due_date, date_finished, position"

export async function listMilestones(
  tenantId: string,
  projectId: string,
): Promise<MilestoneListItem[]> {
  const supabase = await createClient()
  const [{ data }, { data: tasks }] = await Promise.all([
    supabase
      .from("milestones")
      .select(MILESTONE_COLUMNS)
      .eq("tenant_id", tenantId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select("milestone_id, status")
      .eq("tenant_id", tenantId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .not("milestone_id", "is", null),
  ])

  const counts: Record<string, { done: number; total: number }> = {}
  for (const row of (tasks ?? []) as {
    milestone_id: string
    status: number
  }[]) {
    const entry = counts[row.milestone_id] ?? { done: 0, total: 0 }
    entry.total += 1
    if (row.status === 5) entry.done += 1
    counts[row.milestone_id] = entry
  }

  return ((data ?? []) as Milestone[]).map((milestone) => {
    const entry = counts[milestone.id]
    const total = entry?.total ?? 0
    const done = entry?.done ?? 0
    const progress =
      milestone.status === 3
        ? 100
        : total > 0
          ? Math.round((done / total) * 100)
          : 0

    return { ...milestone, task_count: total, done_count: done, progress }
  })
}

export async function listMilestoneOptions(
  tenantId: string,
): Promise<MilestoneOption[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("milestones")
    .select("id, name, project_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })

  return (data ?? []) as MilestoneOption[]
}

export async function getMilestone(
  tenantId: string,
  id: string,
): Promise<Milestone | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("milestones")
    .select(MILESTONE_COLUMNS)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  return (data as Milestone | null) ?? null
}
