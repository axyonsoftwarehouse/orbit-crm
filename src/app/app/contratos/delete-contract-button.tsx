"use client"

import { Button } from "@/components/ui/button"
import { deleteContractAction } from "@/server/actions/contracts"

export function DeleteContractButton({ id }: { id: string }) {
  return (
    <form
      action={deleteContractAction}
      onSubmit={(event) => {
        if (!confirm("Excluir este contrato?")) event.preventDefault()
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
