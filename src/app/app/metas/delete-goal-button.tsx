"use client"

import { Button } from "@/components/ui/button"
import { deleteGoalAction } from "@/server/actions/goals"

export function DeleteGoalButton({ id }: { id: string }) {
  return (
    <form
      action={deleteGoalAction}
      onSubmit={(event) => {
        if (!confirm("Excluir esta meta?")) event.preventDefault()
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
