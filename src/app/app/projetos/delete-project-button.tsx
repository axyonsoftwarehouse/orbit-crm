"use client"

import { Button } from "@/components/ui/button"
import { deleteProjectAction } from "@/server/actions/projects"

export function DeleteProjectButton({ id }: { id: string }) {
  return (
    <form
      action={deleteProjectAction}
      onSubmit={(event) => {
        if (!confirm("Excluir este projeto?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm">
        Excluir
      </Button>
    </form>
  )
}
