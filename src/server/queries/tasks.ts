import { createClient } from "@/lib/supabase/server"

export type TaskListRow = {
  id: string
  name: string
  description: string | null
  status: number
  priority: number
  start_date: string | null
  due_date: string | null
  assignee_id: string | null
  assignee_name: string | null
  project: { id: string; name: string } | null
}

export type Task = {
  id: string
  project_id: string
  name: string
  description: string | null
  status: number
  priority: number
  start_date: string | null
  due_date: string | null
  date_finished: string | null
  assignee_id: string | null
  billable: boolean
  hourly_rate: number | null
}

export type ChecklistItem = {
  id: string
  title: string
  is_done: boolean
  position: number
}

type RawTask = {
  id: string
  name: string
  description: string | null
  status: number
  priority: number
  start_date: string | null
  due_date: string | null
  assignee_id: string | null
  project: { id: string; name: string } | null
}

async function attachAssigneeNames(rows: RawTask[]): Promise<TaskListRow[]> {
  const ids = Array.from(
    new Set(rows.map((row) => row.assignee_id).filter(Boolean) as string[]),
  )

  const nameById = new Map<string, string | null>()
  if (ids.length > 0) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids)
    for (const profile of (data ?? []) as {
      id: string
      full_name: string | null
    }[]) {
      nameById.set(profile.id, profile.full_name)
    }
  }

  return rows.map((row) => ({
    ...row,
    assignee_name: row.assignee_id
      ? (nameById.get(row.assignee_id) ?? null)
      : null,
  }))
}

export async function listTasks(
  tenantId: string,
  options: { projectId?: string } = {},
): Promise<TaskListRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("tasks")
    .select(
      "id, name, description, status, priority, start_date, due_date, assignee_id, project:projects(id, name)",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)

  if (options.projectId) {
    query = query.eq("project_id", options.projectId)
  }

  const { data } = await query.order("due_date", {
    ascending: true,
    nullsFirst: false,
  })

  return attachAssigneeNames((data ?? []) as unknown as RawTask[])
}

export async function getTask(
  tenantId: string,
  id: string,
): Promise<Task | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  return (data as Task | null) ?? null
}

export async function listChecklist(
  tenantId: string,
  taskId: string,
): Promise<ChecklistItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("task_checklist_items")
    .select("id, title, is_done, position")
    .eq("task_id", taskId)
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })

  return (data ?? []) as ChecklistItem[]
}

export async function taskCountsByProject(
  tenantId: string,
): Promise<Record<string, { done: number; total: number }>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tasks")
    .select("project_id, status")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)

  const counts: Record<string, { done: number; total: number }> = {}
  for (const row of (data ?? []) as { project_id: string; status: number }[]) {
    const entry = counts[row.project_id] ?? { done: 0, total: 0 }
    entry.total += 1
    if (row.status === 5) entry.done += 1
    counts[row.project_id] = entry
  }
  return counts
}

export function progressFromCounts(
  counts: { done: number; total: number } | undefined,
): number {
  if (!counts || counts.total === 0) return 0
  return Math.round((counts.done / counts.total) * 100)
}
