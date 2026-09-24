"use client"

import { Trash2 } from "lucide-react"
import { deleteAttachmentAction } from "@/server/actions/attachments"

export function DeleteAttachmentButton({
  id,
  storagePath,
  entityType,
  entityId,
}: {
  id: string
  storagePath: string
  entityType: string
  entityId: string
}) {
  return (
    <form
      action={deleteAttachmentAction}
      onSubmit={(event) => {
        if (!confirm("Remover este anexo?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="storage_path" value={storagePath} />
      <input type="hidden" name="entity_type" value={entityType} />
      <input type="hidden" name="entity_id" value={entityId} />
      <button
        type="submit"
        aria-label="Remover anexo"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  )
}
