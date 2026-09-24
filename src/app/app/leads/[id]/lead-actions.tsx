"use client"

import { Button } from "@/components/ui/button"
import {
  convertLeadToCustomerAction,
  deleteLeadAction,
} from "@/server/actions/leads"

export function DeleteLeadButton({ id }: { id: string }) {
  return (
    <form
      action={deleteLeadAction}
      onSubmit={(event) => {
        if (!confirm("Excluir este lead?")) event.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm">
        Excluir
      </Button>
    </form>
  )
}

export function ConvertLeadButton({ id }: { id: string }) {
  return (
    <form
      action={convertLeadToCustomerAction}
      onSubmit={(event) => {
        if (
          !confirm(
            "Converter este lead em cliente? Uma empresa e um contato serão criados.",
          )
        ) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" size="sm">
        Converter em cliente
      </Button>
    </form>
  )
}
