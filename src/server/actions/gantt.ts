"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import {
  normalizeSchedule,
  wouldCreateCycle,
  type ScheduleDependency,
  type ScheduleTask,
} from "@/lib/gantt"

export type GanttState = { error?: string; success?: string } | undefined

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isDate(value: string | null | undefined) {
  return value === null || value === undefined || DATE_RE.test(value)
}

async function loadProjectSchedule(
  tenantId: string,
  projectId: string,
): Promise<{ tasks: ScheduleTask[]; dependencies: ScheduleDependency[] }> {
  const supabase = await createClient()
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, start_date, due_date")
    .eq("tenant_id", tenantId)
    .eq("project_id", projectId)
    .is("deleted_at", null)

  const taskRows = (tasks ?? []) as ScheduleTask[]
  const ids = taskRows.map((task) => task.id)

  let dependencies: ScheduleDependency[] = []
  if (ids.length > 0) {
    const { data } = await supabase
      .from("task_dependencies")
      .select("task_id, depends_on_task_id")
      .eq("tenant_id", tenantId)
      .in("task_id", ids)
    dependencies = (data ?? []) as ScheduleDependency[]
  }

  return { tasks: taskRows, dependencies }
}

export async function updateTaskScheduleAction(input: {
  id: string
  projectId: string
  start_date: string | null
  due_date: string | null
}): Promise<GanttState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!input.id || !input.projectId) return { error: "Tarefa inválida." }
  if (!isDate(input.start_date) || !isDate(input.due_date)) {
    return { error: "Datas inválidas." }
  }
  if (input.start_date && input.due_date && input.start_date > input.due_date) {
    return { error: "A data de início não pode ser após o término." }
  }

  const { tasks, dependencies } = await loadProjectSchedule(
    active.tenantId,
    input.projectId,
  )

  const changes = normalizeSchedule(tasks, dependencies, {
    id: input.id,
    start_date: input.start_date,
    due_date: input.due_date,
  })
  if (changes.length === 0) return { success: "Cronograma atualizado." }

  const supabase = await createClient()
  for (const change of changes) {
    await supabase
      .from("tasks")
      .update({
        start_date: change.start_date,
        due_date: change.due_date,
      })
      .eq("id", change.id)
      .eq("tenant_id", active.tenantId)
  }

  revalidatePath("/app/tarefas")
  revalidatePath(`/app/projetos/${input.projectId}`)
  return { success: "Cronograma atualizado." }
}

export async function addTaskDependencyAction(
  _prevState: GanttState,
  formData: FormData,
): Promise<GanttState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const taskId = String(formData.get("task_id") ?? "")
  const dependsOnId = String(formData.get("depends_on_task_id") ?? "")
  const projectId = String(formData.get("project_id") ?? "")
  if (!taskId || !dependsOnId || !projectId) {
    return { error: "Dados inválidos." }
  }
  if (taskId === dependsOnId) {
    return { error: "Uma tarefa não pode depender de si mesma." }
  }

  const { dependencies } = await loadProjectSchedule(active.tenantId, projectId)
  if (wouldCreateCycle(dependencies, taskId, dependsOnId)) {
    return { error: "Essa dependência criaria um ciclo." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("task_dependencies").insert({
    tenant_id: active.tenantId,
    task_id: taskId,
    depends_on_task_id: dependsOnId,
    created_by: user?.id,
  })

  if (error) {
    if (error.code === "23505") return { error: "Dependência já existe." }
    return { error: error.message }
  }

  revalidatePath(`/app/projetos/${projectId}`)
  return { success: "Dependência adicionada." }
}

export async function removeTaskDependencyAction(
  formData: FormData,
): Promise<GanttState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  const projectId = String(formData.get("project_id") ?? "")
  if (!id) return { error: "Dados inválidos." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return { error: error.message }

  if (projectId) revalidatePath(`/app/projetos/${projectId}`)
  return { success: "Dependência removida." }
}
