import { createClient } from "@/lib/supabase/server"

export type TimeEntryRow = {
  id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  is_billable: boolean
  rate: number | null
  note: string | null
  project: { id: string; name: string } | null
  task: { id: string; name: string } | null
  user_name: string | null
}

type RawTimeEntry = Omit<TimeEntryRow, "user_name"> & {
  user: { id: string; full_name: string | null } | null
}

export type RunningEntry = {
  id: string
  started_at: string
  project_name: string | null
  task_name: string | null
}

export async function listTimeEntries(
  tenantId: string,
  options: { projectId?: string; taskId?: string } = {},
): Promise<TimeEntryRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("time_entries")
    .select(
      "id, started_at, ended_at, duration_seconds, is_billable, rate, note, project:projects(id, name), task:tasks(id, name), user:profiles(id, full_name)",
    )
    .eq("tenant_id", tenantId)

  if (options.projectId) query = query.eq("project_id", options.projectId)
  if (options.taskId) query = query.eq("task_id", options.taskId)

  const { data } = await query
    .order("started_at", { ascending: false })
    .limit(200)

  const rows = (data ?? []) as unknown as RawTimeEntry[]
  return rows.map((row) => ({
    ...row,
    user_name: row.user?.full_name ?? null,
  }))
}

export async function listTimeEntriesPage(
  tenantId: string,
  options: {
    page: number
    pageSize: number
    projectId?: string
    taskId?: string
  },
): Promise<{ rows: TimeEntryRow[]; total: number }> {
  const supabase = await createClient()
  let query = supabase
    .from("time_entries")
    .select(
      "id, started_at, ended_at, duration_seconds, is_billable, rate, note, project:projects(id, name), task:tasks(id, name), user:profiles(id, full_name)",
      { count: "exact" },
    )
    .eq("tenant_id", tenantId)

  if (options.projectId) query = query.eq("project_id", options.projectId)
  if (options.taskId) query = query.eq("task_id", options.taskId)

  const from = (options.page - 1) * options.pageSize
  const { data, count } = await query
    .order("started_at", { ascending: false })
    .range(from, from + options.pageSize - 1)

  const rows = (data ?? []) as unknown as RawTimeEntry[]
  return {
    rows: rows.map((row) => ({
      ...row,
      user_name: row.user?.full_name ?? null,
    })),
    total: count ?? 0,
  }
}

export async function summarizeTimeEntries(
  tenantId: string,
  options: { projectId?: string; taskId?: string } = {},
): Promise<{ seconds: number; billableAmount: number }> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("time_entries_summary", {
    p_tenant: tenantId,
    p_project: options.projectId ?? undefined,
    p_task: options.taskId ?? undefined,
  })

  const row = (data ?? [])[0] as
    { seconds: number; billable_amount: number } | undefined

  return {
    seconds: Number(row?.seconds ?? 0),
    billableAmount: Number(row?.billable_amount ?? 0),
  }
}

export async function getRunningEntry(
  tenantId: string,
  userId: string,
): Promise<RunningEntry | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("time_entries")
    .select("id, started_at, project:projects(name), task:tasks(name)")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .is("ended_at", null)
    .maybeSingle()

  if (!data) return null

  const row = data as unknown as {
    id: string
    started_at: string
    project: { name: string } | null
    task: { name: string } | null
  }

  return {
    id: row.id,
    started_at: row.started_at,
    project_name: row.project?.name ?? null,
    task_name: row.task?.name ?? null,
  }
}

export function entrySeconds(entry: TimeEntryRow): number {
  if (entry.duration_seconds !== null) return entry.duration_seconds
  return Math.max(
    0,
    Math.round((Date.now() - new Date(entry.started_at).getTime()) / 1000),
  )
}

export function sumSeconds(entries: TimeEntryRow[]): number {
  return entries.reduce((total, entry) => total + entrySeconds(entry), 0)
}

export function billableAmount(entries: TimeEntryRow[]): number {
  return entries.reduce((total, entry) => {
    if (!entry.is_billable || !entry.rate) return total
    return total + (entrySeconds(entry) / 3600) * Number(entry.rate)
  }, 0)
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`
}

export type BillableEntry = {
  id: string
  task_id: string | null
  task_name: string | null
  rate: number | null
  duration_seconds: number
}

export async function listUnbilledBillableEntries(
  tenantId: string,
  projectId: string,
): Promise<BillableEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("time_entries")
    .select("id, task_id, rate, duration_seconds, task:tasks(name)")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .eq("is_billable", true)
    .eq("billed", false)
    .not("ended_at", "is", null)

  return (
    (data ?? []) as unknown as {
      id: string
      task_id: string | null
      rate: number | null
      duration_seconds: number | null
      task: { name: string } | null
    }[]
  ).map((row) => ({
    id: row.id,
    task_id: row.task_id,
    task_name: row.task?.name ?? null,
    rate: row.rate !== null ? Number(row.rate) : null,
    duration_seconds: Number(row.duration_seconds ?? 0),
  }))
}

export type BillableSummary = {
  count: number
  seconds: number
  amount: number
}

export function summarizeBillable(entries: BillableEntry[]): BillableSummary {
  const seconds = entries.reduce(
    (total, entry) => total + entry.duration_seconds,
    0,
  )
  const amount = entries.reduce(
    (total, entry) =>
      total + (entry.duration_seconds / 3600) * Number(entry.rate ?? 0),
    0,
  )
  return { count: entries.length, seconds, amount }
}
