"use client"

import { Button } from "@/components/ui/button"
import { deleteCalendarEventAction } from "@/server/actions/calendar"

export function DeleteEventButton({ id }: { id: string }) {
  return (
    <form
      action={deleteCalendarEventAction}
      onSubmit={(event) => {
        if (!confirm("Excluir este evento?")) event.preventDefault()
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
