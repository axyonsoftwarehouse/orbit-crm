"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { projectSchema } from "@/lib/validations/projects"
import { saveCustomFieldValues } from "@/server/custom-fields"
import { checkPlanLimit } from "@/server/plan-limits"
import { dbError } from "@/lib/db-error"

export type ProjectFormState = { error?: string; success?: string } | undefined

function parseProject(formData: FormData) {
  return projectSchema.safeParse({
    name: formData.get("name"),
    company_id: formData.get("company_id") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status") ?? 1,
    billing_type: formData.get("billing_type") ?? 1,
    start_date: formData.get("start_date") || undefined,
    deadline: formData.get("deadline") || undefined,
    progress: formData.get("progress") ?? 0,
    progress_from_tasks: formData.get("progress_from_tasks") === "on",
    project_cost: formData.get("project_cost"),
    rate_per_hour: formData.get("rate_per_hour"),
    estimated_hours: formData.get("estimated_hours"),
  })
}

export async function createProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const limit = await checkPlanLimit(active.tenantId, "projects")
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }

  const parsed = parseProject(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("projects")
    .insert({
      tenant_id: active.tenantId,
      created_by: user?.id,
      ...parsed.data,
      date_finished: parsed.data.status === 4 ? new Date().toISOString() : null,
    })
    .select("id")
    .single()

  if (error) return dbError("projects", error)

  await saveCustomFieldValues(
    supabase,
    active.tenantId,
    "project",
    data.id,
    formData,
  )

  revalidatePath("/app/projetos")
  return { success: "Projeto criado." }
}

export async function updateProjectAction(
  _prevState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Projeto inválido." }

  const parsed = parseProject(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("projects")
    .update({
      ...parsed.data,
      date_finished: parsed.data.status === 4 ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return dbError("projects", error)

  await saveCustomFieldValues(
    supabase,
    active.tenantId,
    "project",
    id,
    formData,
  )

  revalidatePath("/app/projetos")
  revalidatePath(`/app/projetos/${id}`)
  return { success: "Projeto atualizado." }
}

export async function deleteProjectAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/projetos")
  redirect("/app/projetos")
}

export async function addProjectMemberAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const projectId = String(formData.get("project_id") ?? "")
  const userId = String(formData.get("user_id") ?? "")
  if (!projectId || !userId) return

  const supabase = await createClient()
  const { data: membership } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("tenant_id", active.tenantId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle()
  if (!membership) return

  await supabase.from("project_members").insert({
    tenant_id: active.tenantId,
    project_id: projectId,
    user_id: userId,
  })

  revalidatePath(`/app/projetos/${projectId}`)
}

export async function removeProjectMemberAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const projectId = String(formData.get("project_id") ?? "")
  const userId = String(formData.get("user_id") ?? "")
  if (!projectId || !userId) return

  const supabase = await createClient()
  await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("tenant_id", active.tenantId)

  revalidatePath(`/app/projetos/${projectId}`)
}
