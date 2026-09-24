"use client"

import { Trash2 } from "lucide-react"
import { deleteTimeEntryAction } from "@/server/actions/time"

export function DeleteTimeEntryButton({ id }: { id: string }) {
  return (
    <form
      action={deleteTimeEntryAction}
      onSubmit={(event) => {
        if (!confirm("Remover este apontamento?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Remover apontamento"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  )
}
