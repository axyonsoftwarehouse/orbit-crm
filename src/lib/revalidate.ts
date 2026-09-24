import { revalidatePath } from "next/cache"

export function revalidateEntity(entityType: string, entityId: string) {
  if (entityType === "task") revalidatePath(`/app/tarefas/${entityId}`)
  else if (entityType === "project") revalidatePath(`/app/projetos/${entityId}`)
  else if (entityType === "ticket") revalidatePath(`/app/tickets/${entityId}`)
  revalidatePath("/app/tarefas")
  revalidatePath("/app/projetos")
}
