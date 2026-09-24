"use client"

import { Button } from "@/components/ui/button"
import { deleteCommentAction } from "@/server/actions/comments"

export function DeleteCommentButton({ id }: { id: string }) {
  return (
    <form
      action={deleteCommentAction}
      onSubmit={(event) => {
        if (!confirm("Remover este comentário?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive h-6 px-2 text-xs"
      >
        Remover
      </Button>
    </form>
  )
}
