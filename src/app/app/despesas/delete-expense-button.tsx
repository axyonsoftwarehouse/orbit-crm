"use client"

import { Button } from "@/components/ui/button"
import { deleteExpenseAction } from "@/server/actions/expenses"

export function DeleteExpenseButton({ id }: { id: string }) {
  return (
    <form
      action={deleteExpenseAction}
      onSubmit={(event) => {
        if (!confirm("Excluir esta despesa?")) event.preventDefault()
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
