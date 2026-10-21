"use client"

import { Button } from "@/components/ui/button"
import { deleteSocialAccountAction } from "@/server/actions/social"

export function DeleteSocialAccountButton({ id }: { id: string }) {
  return (
    <form
      action={deleteSocialAccountAction}
      onSubmit={(event) => {
        if (!confirm("Remover esta conta social?")) event.preventDefault()
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
