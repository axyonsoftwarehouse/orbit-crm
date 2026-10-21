"use client"

import { Button } from "@/components/ui/button"
import { deleteSeoSiteAction } from "@/server/actions/seo"

export function DeleteSeoSiteButton({ id }: { id: string }) {
  return (
    <form
      action={deleteSeoSiteAction}
      onSubmit={(event) => {
        if (!confirm("Remover este site e o histórico de auditorias?")) {
          event.preventDefault()
        }
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
