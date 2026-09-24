"use client"

import { Button } from "@/components/ui/button"
import { deleteCompanyAction } from "@/server/actions/companies"

export function DeleteCompanyButton({ id }: { id: string }) {
  return (
    <form
      action={deleteCompanyAction}
      onSubmit={(event) => {
        if (!confirm("Excluir este cliente? Os contatos ficarão ocultos.")) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm">
        Excluir
      </Button>
    </form>
  )
}
