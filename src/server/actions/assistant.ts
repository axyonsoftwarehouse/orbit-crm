"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { assistantTaskSchema } from "@/lib/ai/assistant-schemas"
import { taskSchema } from "@/lib/validations/tasks"
import { insertTask } from "@/server/tasks/insert-task"

export type AssistantTaskResult =
  { ok: true; taskId: string } | { ok: false; error: string }

/**
 * Cria a tarefa que o assistente propôs, depois da confirmação do usuário.
 * Nada vindo do cliente é confiável: projeto, cliente e responsável são
 * revalidados contra o tenant ativo antes do insert.
 */
export async function createAssistantTaskAction(
  input: unknown,
): Promise<AssistantTaskResult> {
  const parsed = assistantTaskSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const active = await getActiveMembership()
  if (!active) return { ok: false, error: "Nenhuma empresa ativa." }

  const user = await getUser()
  if (!user) return { ok: false, error: "Sessão expirada." }

  const { company_id, assignee_id, ...task } = parsed.data
  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", task.project_id)
    .eq("tenant_id", active.tenantId)
    .eq("company_id", company_id)
    .is("deleted_at", null)
    .maybeSingle()
  if (!project) {
    return { ok: false, error: "Projeto não encontrado para este cliente." }
  }

  const assignee = assignee_id ?? user.id
  if (assignee !== user.id) {
    const { data: member } = await supabase
      .from("memberships")
      .select("user_id")
      .eq("tenant_id", active.tenantId)
      .eq("user_id", assignee)
      .eq("status", "active")
      .maybeSingle()
    if (!member) return { ok: false, error: "Responsável inválido." }
  }

  const taskInput = taskSchema.safeParse({
    ...task,
    status: 1,
    billable: false,
    assignee_id: assignee,
  })
  if (!taskInput.success) {
    return {
      ok: false,
      error: taskInput.error.issues[0]?.message ?? "Dados inválidos.",
    }
  }

  const result = await insertTask(
    supabase,
    active.tenantId,
    user.id,
    taskInput.data,
  )
  if ("error" in result) return { ok: false, error: result.error }

  revalidatePath(`/app/clientes/${company_id}`)
  return { ok: true, taskId: result.id }
}
