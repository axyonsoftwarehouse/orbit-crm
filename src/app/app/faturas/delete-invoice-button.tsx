"use client"

import { Button } from "@/components/ui/button"
import { deleteInvoiceAction } from "@/server/actions/invoices"

export function DeleteInvoiceButton({ id }: { id: string }) {
  return (
    <form
      action={deleteInvoiceAction}
      onSubmit={(event) => {
        if (!confirm("Excluir esta fatura?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm">
        Excluir
      </Button>
    </form>
  )
}
