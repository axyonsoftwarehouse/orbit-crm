"use client"

import { Button } from "@/components/ui/button"
import { deleteTaskAction } from "@/server/actions/tasks"

export function DeleteTaskButton({
  id,
  projectId,
  redirectTo = "/app/tarefas",
}: {
  id: string
  projectId: string
  redirectTo?: string
}) {
  return (
    <form
      action={deleteTaskAction}
      onSubmit={(event) => {
        if (!confirm("Excluir esta tarefa?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <Button type="submit" variant="destructive" size="sm">
        Excluir
      </Button>
    </form>
  )
}
