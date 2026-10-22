"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteSocialMediaAction } from "@/server/actions/social"

export function DeleteSocialMediaButton({
  id,
  postId,
}: {
  id: string
  postId: string
}) {
  return (
    <form
      action={deleteSocialMediaAction}
      onSubmit={(event) => {
        if (!confirm("Remover esta imagem?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="post_id" value={postId} />
      <Button
        type="submit"
        size="icon-xs"
        variant="destructive"
        aria-label="Remover imagem"
      >
        <Trash2 className="size-3" />
      </Button>
    </form>
  )
}
