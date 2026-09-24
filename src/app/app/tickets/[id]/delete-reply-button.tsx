"use client"

import { Trash2 } from "lucide-react"
import { deleteTicketReplyAction } from "@/server/actions/tickets"

export function DeleteReplyButton({
  id,
  ticketId,
}: {
  id: string
  ticketId: string
}) {
  return (
    <form
      action={deleteTicketReplyAction}
      onSubmit={(event) => {
        if (!confirm("Remover esta resposta?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="ticket_id" value={ticketId} />
      <button
        type="submit"
        aria-label="Remover resposta"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  )
}
