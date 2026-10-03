"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  updateNotificationPrefsAction,
  type NotificationPrefsState,
} from "@/server/actions/profile"

export function NotificationPrefsForm({
  notifyEmail,
}: {
  notifyEmail: boolean
}) {
  const [state, formAction, isPending] = useActionState<
    NotificationPrefsState,
    FormData
  >(updateNotificationPrefsAction, undefined)

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    else if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border p-5">
      <div>
        <h2 className="font-heading text-sm font-semibold">
          Preferências de notificação
        </h2>
        <p className="text-muted-foreground text-xs">
          Escolha como deseja receber os avisos.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="notify_email"
          defaultChecked={notifyEmail}
          className="accent-primary size-4"
        />
        Receber lembretes por e-mail (tarefas vencendo e faturas vencidas)
      </label>

      <p className="text-muted-foreground text-xs">
        As notificações no app aparecem em tempo real, independentemente desta
        opção.
      </p>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  )
}
