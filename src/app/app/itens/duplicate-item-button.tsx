"use client"

import { Button } from "@/components/ui/button"
import { duplicateItemAction } from "@/server/actions/items"

export function DuplicateItemButton({ id }: { id: string }) {
  return (
    <form action={duplicateItemAction}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm">
        Duplicar
      </Button>
    </form>
  )
}
