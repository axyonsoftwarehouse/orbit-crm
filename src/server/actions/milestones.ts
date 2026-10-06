"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { milestoneSchema } from "@/lib/validations/milestones"

export type MilestoneFormState =
  { error?: string; success?: string } | undefined

function parseMilestone(formData: FormData) {
  return milestoneSchema.safeParse({
    project_id: formData.get("project_id"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    status: formData.get("status") ?? 1,
    color: formData.get("color") || undefined,
    start_date: formData.get("start_date") || undefined,
    due_date: formData.get("due_date") || undefined,
  })
}

export async function createMilestoneAction(
  _prevState: MilestoneFormState,
  formData: FormData,
): Promise<MilestoneFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = parseMilestone(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()

  const { count } = await supabase
    .from("milestones")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", active.tenantId)
    .eq("project_id", parsed.data.project_id)
    .is("deleted_at", null)

  const { error } = await supabase.from("milestones").insert({
    tenant_id: active.tenantId,
    created_by: user?.id,
    position: count ?? 0,
    ...parsed.data,
    date_finished: parsed.data.status === 3 ? new Date().toISOString() : null,
  })

  if (error) return dbError("milestones", error)

  revalidatePath(`/app/projetos/${parsed.data.project_id}`)
  return { success: "Marco criado." }
}

export async function updateMilestoneAction(
  _prevState: MilestoneFormState,
  formData: FormData,
): Promise<MilestoneFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Marco inválido." }

  const parsed = parseMilestone(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("milestones")
    .update({
      ...parsed.data,
      date_finished: parsed.data.status === 3 ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return dbError("milestones", error)

  revalidatePath(`/app/projetos/${parsed.data.project_id}`)
  return { success: "Marco atualizado." }
}

export async function deleteMilestoneAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const projectId = String(formData.get("project_id") ?? "")
  const supabase = await createClient()

  await supabase
    .from("tasks")
    .update({ milestone_id: null })
    .eq("milestone_id", id)
    .eq("tenant_id", active.tenantId)

  await supabase
    .from("milestones")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (projectId) revalidatePath(`/app/projetos/${projectId}`)
}
