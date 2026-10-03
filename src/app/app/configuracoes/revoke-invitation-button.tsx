"use client"

import { Button } from "@/components/ui/button"
import { revokeInvitationAction } from "@/server/actions/team"

export function RevokeInvitationButton({ id }: { id: string }) {
  return (
    <form
      action={revokeInvitationAction}
      onSubmit={(event) => {
        if (!confirm("Revogar este convite?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive"
      >
        Revogar
      </Button>
    </form>
  )
}
