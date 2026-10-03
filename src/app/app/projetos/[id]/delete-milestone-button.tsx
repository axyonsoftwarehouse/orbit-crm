"use client"

import { Button } from "@/components/ui/button"
import { deleteMilestoneAction } from "@/server/actions/milestones"

export function DeleteMilestoneButton({
  id,
  projectId,
}: {
  id: string
  projectId: string
}) {
  return (
    <form
      action={deleteMilestoneAction}
      onSubmit={(event) => {
        if (!confirm("Excluir este marco?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="project_id" value={projectId} />
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
