"use client"

import { Button } from "@/components/ui/button"
import { deleteEstimateAction } from "@/server/actions/estimates"

export function DeleteEstimateButton({ id }: { id: string }) {
  return (
    <form
      action={deleteEstimateAction}
      onSubmit={(event) => {
        if (!confirm("Excluir este orçamento?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm">
        Excluir
      </Button>
    </form>
  )
}
