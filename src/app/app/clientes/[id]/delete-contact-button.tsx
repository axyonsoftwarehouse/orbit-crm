"use client"

import { Button } from "@/components/ui/button"
import { deleteContactAction } from "@/server/actions/contacts"

export function DeleteContactButton({
  id,
  companyId,
}: {
  id: string
  companyId: string
}) {
  return (
    <form
      action={deleteContactAction}
      onSubmit={(event) => {
        if (!confirm("Remover este contato?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="company_id" value={companyId} />
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
