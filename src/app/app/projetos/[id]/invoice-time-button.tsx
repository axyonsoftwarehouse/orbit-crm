"use client"

import { Button } from "@/components/ui/button"
import { invoiceBillableTimeAction } from "@/server/actions/invoices"

export function InvoiceTimeButton({ projectId }: { projectId: string }) {
  return (
    <form
      action={invoiceBillableTimeAction}
      onSubmit={(event) => {
        if (
          !confirm(
            "Gerar uma fatura com as horas faturáveis não faturadas deste projeto?",
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="project_id" value={projectId} />
      <Button type="submit" size="sm">
        Faturar horas
      </Button>
    </form>
  )
}
