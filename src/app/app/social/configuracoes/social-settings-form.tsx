"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  updateSocialSettingsAction,
  type SocialFormState,
} from "@/server/actions/social"

export function SocialSettingsForm({
  approvalRequired,
}: {
  approvalRequired: boolean
}) {
  const [state, formAction, isPending] = useActionState<
    SocialFormState,
    FormData
  >(updateSocialSettingsAction, undefined)

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    else if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border p-5">
      <div>
        <h2 className="font-heading text-sm font-semibold">Aprovação</h2>
        <p className="text-muted-foreground text-xs">
          Com a opção ligada, todo post vai para aprovação do cliente no portal
          antes de ser agendado. O cliente recebe um e-mail quando há post
          aguardando.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="approval_required"
          defaultChecked={approvalRequired}
          className="accent-primary size-4"
        />
        Exigir aprovação do cliente em todos os posts
      </label>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  )
}
