"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  acceptInvitationAction,
  acceptInvitationAsCurrentUserAction,
  type TeamFormState,
} from "@/server/actions/team"

export function AcceptInvitationForm({
  token,
  email,
  tenantName,
  loggedEmail,
}: {
  token: string
  email: string
  tenantName: string
  loggedEmail: string | null
}) {
  const sameUser =
    loggedEmail !== null && loggedEmail.toLowerCase() === email.toLowerCase()
  const [state, formAction, isPending] = useActionState<
    TeamFormState,
    FormData
  >(acceptInvitationAction, undefined)

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  if (sameUser) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <div className="space-y-1">
          <h1 className="font-heading text-xl font-semibold">
            Aceitar convite
          </h1>
          <p className="text-muted-foreground text-sm">
            Você foi convidado para <strong>{tenantName}</strong>.
          </p>
        </div>
        <form action={acceptInvitationAsCurrentUserAction}>
          <input type="hidden" name="token" value={token} />
          <Button type="submit" className="w-full">
            Aceitar convite
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <div className="space-y-1">
        <h1 className="font-heading text-xl font-semibold">Aceitar convite</h1>
        <p className="text-muted-foreground text-sm">
          Você foi convidado para <strong>{tenantName}</strong> como{" "}
          <strong>{email}</strong>. Defina seu nome e uma senha para entrar.
        </p>
      </div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        <div className="space-y-2">
          <Label htmlFor="invite-name">Seu nome *</Label>
          <Input id="invite-name" name="full_name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-password">Senha *</Label>
          <Input
            id="invite-password"
            name="password"
            type="password"
            minLength={8}
            required
          />
          <p className="text-muted-foreground text-xs">
            Mínimo de 8 caracteres.
          </p>
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Entrando..." : "Aceitar e entrar"}
        </Button>
      </form>
    </div>
  )
}
