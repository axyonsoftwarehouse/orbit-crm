"use client"

import { Button } from "@/components/ui/button"
import { deleteTicketAction } from "@/server/actions/tickets"

export function DeleteTicketButton({ id }: { id: string }) {
  return (
    <form
      action={deleteTicketAction}
      onSubmit={(event) => {
        if (!confirm("Excluir este ticket?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm">
        Excluir
      </Button>
    </form>
  )
}
