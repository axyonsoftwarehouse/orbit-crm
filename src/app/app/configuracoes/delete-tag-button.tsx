"use client"

import { Button } from "@/components/ui/button"
import { deleteTagAction } from "@/server/actions/tags"

export function DeleteTagButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteTagAction}
      onSubmit={(event) => {
        if (!confirm(`Excluir a tag "${name}"?`)) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive"
      >
        Excluir
      </Button>
    </form>
  )
}
