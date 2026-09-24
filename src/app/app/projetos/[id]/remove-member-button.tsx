"use client"

import { Button } from "@/components/ui/button"
import { removeProjectMemberAction } from "@/server/actions/projects"

export function RemoveMemberButton({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  return (
    <form
      action={removeProjectMemberAction}
      onSubmit={(event) => {
        if (!confirm("Remover este membro do projeto?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="user_id" value={userId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-destructive"
      >
        Remover
      </Button>
    </form>
  )
}
