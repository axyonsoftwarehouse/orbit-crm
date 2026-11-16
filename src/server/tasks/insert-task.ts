import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"
import type { TaskInput } from "@/lib/validations/tasks"
import { checkPlanLimit } from "@/server/plan-limits"
import { dbError } from "@/lib/db-error"

/**
 * Insere uma tarefa já validada: aplica o limite do plano, grava
 * `created_by`/`date_finished` e revalida as páginas de tarefas e projetos.
 * Custom fields ficam a cargo de quem chama.
 */
export async function insertTask(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  userId: string | undefined,
  input: TaskInput,
): Promise<{ id: string } | { error: string }> {
  const limit = await checkPlanLimit(tenantId, "tasks")
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      tenant_id: tenantId,
      created_by: userId,
      ...input,
      date_finished: input.status === 5 ? new Date().toISOString() : null,
    })
    .select("id")
    .single()

  if (error || !data) return dbError("tasks", error)

  revalidatePath("/app/tarefas")
  revalidatePath("/app/projetos")
  revalidatePath(`/app/projetos/${input.project_id}`)
  return { id: data.id }
}
