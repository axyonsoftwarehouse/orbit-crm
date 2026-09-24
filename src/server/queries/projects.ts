import { createClient } from "@/lib/supabase/server"
import { progressFromCounts, taskCountsByProject } from "@/server/queries/tasks"

export type ProjectListRow = {
  id: string
  name: string
  status: number
  deadline: string | null
  progress: number
  progress_from_tasks: boolean
  company: { id: string; name: string } | null
}

export type Project = {
  id: string
  company_id: string | null
  name: string
  description: string | null
  status: number
  billing_type: number
  start_date: string | null
  deadline: string | null
  date_finished: string | null
  progress: number
  progress_from_tasks: boolean
  project_cost: number | null
  rate_per_hour: number | null
  estimated_hours: number | null
}

export type ProjectMember = {
  user_id: string
  full_name: string | null
  avatar_url: string | null
}

export type TenantMember = {
  user_id: string
  role: string
  full_name: string | null
}

export async function listProjects(
  tenantId: string,
): Promise<ProjectListRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(
      "id, name, status, deadline, progress, progress_from_tasks, company:companies(id, name)",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  const projects = (data ?? []) as unknown as ProjectListRow[]
  const counts = await taskCountsByProject(tenantId)

  return projects.map((project) => ({
    ...project,
    progress: project.progress_from_tasks
      ? progressFromCounts(counts[project.id])
      : project.progress,
  }))
}

export async function getProject(
  tenantId: string,
  id: string,
): Promise<Project | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  return (data as Project | null) ?? null
}

export async function countMembersByProject(
  tenantId: string,
): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("tenant_id", tenantId)

  const counts: Record<string, number> = {}
  for (const row of (data ?? []) as { project_id: string }[]) {
    counts[row.project_id] = (counts[row.project_id] ?? 0) + 1
  }
  return counts
}

export async function listProjectMembers(
  tenantId: string,
  projectId: string,
): Promise<ProjectMember[]> {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)

  const ids = ((members ?? []) as { user_id: string }[]).map((m) => m.user_id)
  if (ids.length === 0) return []

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids)

  const byId = new Map(
    (
      (profiles ?? []) as {
        id: string
        full_name: string | null
        avatar_url: string | null
      }[]
    ).map((p) => [p.id, p]),
  )

  return ids.map((id) => ({
    user_id: id,
    full_name: byId.get(id)?.full_name ?? null,
    avatar_url: byId.get(id)?.avatar_url ?? null,
  }))
}

export async function listTenantMembers(
  tenantId: string,
): Promise<TenantMember[]> {
  const supabase = await createClient()
  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("tenant_id", tenantId)
    .eq("status", "active")

  const rows = (memberships ?? []) as { user_id: string; role: string }[]
  if (rows.length === 0) return []

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in(
      "id",
      rows.map((r) => r.user_id),
    )

  const nameById = new Map(
    ((profiles ?? []) as { id: string; full_name: string | null }[]).map(
      (p) => [p.id, p.full_name],
    ),
  )

  return rows.map((r) => ({
    user_id: r.user_id,
    role: r.role,
    full_name: nameById.get(r.user_id) ?? null,
  }))
}

export type ProjectMemberLite = {
  user_id: string
  full_name: string | null
}

export async function projectMembersByProject(
  tenantId: string,
): Promise<Record<string, ProjectMemberLite[]>> {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from("project_members")
    .select("project_id, user_id")
    .eq("tenant_id", tenantId)

  const rows = (members ?? []) as { project_id: string; user_id: string }[]
  if (rows.length === 0) return {}

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", Array.from(new Set(rows.map((r) => r.user_id))))

  const nameById = new Map(
    ((profiles ?? []) as { id: string; full_name: string | null }[]).map(
      (p) => [p.id, p.full_name],
    ),
  )

  const grouped: Record<string, ProjectMemberLite[]> = {}
  for (const row of rows) {
    ;(grouped[row.project_id] ??= []).push({
      user_id: row.user_id,
      full_name: nameById.get(row.user_id) ?? null,
    })
  }
  return grouped
}
