"use client"

import { Trash2 } from "lucide-react"
import { deletePaymentAction } from "@/server/actions/invoices"

export function DeletePaymentButton({
  id,
  invoiceId,
}: {
  id: string
  invoiceId: string
}) {
  return (
    <form
      action={deletePaymentAction}
      onSubmit={(event) => {
        if (!confirm("Remover este pagamento?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <button
        type="submit"
        aria-label="Remover pagamento"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  )
}
