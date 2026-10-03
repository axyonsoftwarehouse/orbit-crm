"use client"

import { Button } from "@/components/ui/button"
import { deleteCustomFieldAction } from "@/server/actions/custom-fields"

export function DeleteCustomFieldButton({
  id,
  label,
}: {
  id: string
  label: string
}) {
  return (
    <form
      action={deleteCustomFieldAction}
      onSubmit={(event) => {
        if (!confirm(`Excluir o campo "${label}" e seus valores?`))
          event.preventDefault()
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
