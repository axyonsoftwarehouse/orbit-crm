"use client"

import { Button } from "@/components/ui/button"
import { deleteItemAction } from "@/server/actions/items"

export function DeleteItemButton({ id }: { id: string }) {
  return (
    <form
      action={deleteItemAction}
      onSubmit={(event) => {
        if (!confirm("Excluir este item? Documentos emitidos não mudam.")) {
          event.preventDefault()
        }
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
