"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { checklistItemSchema, taskSchema } from "@/lib/validations/tasks"
import { saveCustomFieldValues } from "@/server/custom-fields"
import { checkPlanLimit } from "@/server/plan-limits"
import { dbError } from "@/lib/db-error"

export type TaskFormState = { error?: string; success?: string } | undefined

function parseTask(formData: FormData) {
  return taskSchema.safeParse({
    project_id: formData.get("project_id") || undefined,
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    status: formData.get("status") ?? 1,
    priority: formData.get("priority") ?? 2,
    start_date: formData.get("start_date") || undefined,
    due_date: formData.get("due_date") || undefined,
    assignee_id: formData.get("assignee_id") || undefined,
    milestone_id: formData.get("milestone_id") || undefined,
    billable: formData.get("billable") === "on",
    hourly_rate: formData.get("hourly_rate"),
  })
}

export async function createTaskAction(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const limit = await checkPlanLimit(active.tenantId, "tasks")
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }

  const parsed = parseTask(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      tenant_id: active.tenantId,
      created_by: user?.id,
      ...parsed.data,
      date_finished: parsed.data.status === 5 ? new Date().toISOString() : null,
    })
    .select("id")
    .single()

  if (error) return dbError("tasks", error)

  await saveCustomFieldValues(
    supabase,
    active.tenantId,
    "task",
    data.id,
    formData,
  )

  revalidatePath("/app/tarefas")
  revalidatePath("/app/projetos")
  revalidatePath(`/app/projetos/${parsed.data.project_id}`)
  return { success: "Tarefa criada." }
}

export async function updateTaskAction(
  _prevState: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Tarefa inválida." }

  const parsed = parseTask(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("tasks")
    .update({
      ...parsed.data,
      date_finished: parsed.data.status === 5 ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return dbError("tasks", error)

  await saveCustomFieldValues(supabase, active.tenantId, "task", id, formData)

  revalidatePath("/app/tarefas")
  revalidatePath(`/app/tarefas/${id}`)
  revalidatePath("/app/projetos")
  revalidatePath(`/app/projetos/${parsed.data.project_id}`)
  return { success: "Tarefa atualizada." }
}

export async function deleteTaskAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const projectId = String(formData.get("project_id") ?? "")
  const redirectTo = String(formData.get("redirect_to") ?? "/app/tarefas")

  const supabase = await createClient()
  await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/tarefas")
  revalidatePath("/app/projetos")
  if (projectId) revalidatePath(`/app/projetos/${projectId}`)
  redirect(redirectTo)
}

export async function updateTaskStatusAction(input: {
  id: string
  status: number
}) {
  const active = await getActiveMembership()
  if (!active) return
  if (!input.id || ![1, 2, 3, 4, 5].includes(input.status)) return

  const supabase = await createClient()
  await supabase
    .from("tasks")
    .update({
      status: input.status,
      date_finished: input.status === 5 ? new Date().toISOString() : null,
    })
    .eq("id", input.id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/tarefas")
  revalidatePath(`/app/tarefas/${input.id}`)
}

export async function addChecklistItemAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const taskId = String(formData.get("task_id") ?? "")
  const parsed = checklistItemSchema.safeParse({ title: formData.get("title") })
  if (!taskId || !parsed.success) return

  const supabase = await createClient()
  await supabase.from("task_checklist_items").insert({
    tenant_id: active.tenantId,
    task_id: taskId,
    title: parsed.data.title,
  })

  revalidatePath(`/app/tarefas/${taskId}`)
}

export async function toggleChecklistItemAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const taskId = String(formData.get("task_id") ?? "")
  const done = String(formData.get("done") ?? "0") === "1"
  if (!id || !taskId) return

  const supabase = await createClient()
  await supabase
    .from("task_checklist_items")
    .update({ is_done: done })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath(`/app/tarefas/${taskId}`)
}

export async function deleteChecklistItemAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const taskId = String(formData.get("task_id") ?? "")
  if (!id || !taskId) return

  const supabase = await createClient()
  await supabase
    .from("task_checklist_items")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath(`/app/tarefas/${taskId}`)
}
