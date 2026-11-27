"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  convertLeadToCustomerAction,
  deleteLeadAction,
  type ConvertLeadState,
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
  const [state, formAction, isPending] = useActionState<
    ConvertLeadState,
    FormData
  >(convertLeadToCustomerAction, undefined)

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form
      action={formAction}
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
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Convertendo..." : "Converter em cliente"}
      </Button>
    </form>
  )
}
