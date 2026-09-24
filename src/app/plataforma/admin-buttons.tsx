"use client"

import { Button } from "@/components/ui/button"
import { deletePlanAction, deleteTenantAction } from "@/server/actions/platform"

export function DeletePlanButton({ id }: { id: string }) {
  return (
    <form
      action={deletePlanAction}
      onSubmit={(event) => {
        if (!confirm("Excluir este plano?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-destructive"
      >
        Excluir
      </Button>
    </form>
  )
}

export function DeleteTenantButton({ id }: { id: string }) {
  return (
    <form
      action={deleteTenantAction}
      onSubmit={(event) => {
        if (
          !confirm(
            "Excluir esta empresa e TODOS os dados dela? Ação irreversível.",
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-destructive"
      >
        Excluir
      </Button>
    </form>
  )
}
