"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NewPasswordFields } from "@/components/auth/new-password-fields"
import {
  acceptPortalInvitationAction,
  type AcceptPortalInviteState,
} from "@/server/actions/portal-invite"

export function AcceptPortalInviteForm({
  token,
  email,
}: {
  token: string
  email: string
}) {
  const [state, formAction, isPending] = useActionState<
    AcceptPortalInviteState,
    FormData
  >(acceptPortalInvitationAction, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          value={email}
          autoComplete="username"
          readOnly
          disabled
        />
      </div>
      <NewPasswordFields />

      {state?.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Criando acesso..." : "Criar senha e entrar"}
      </Button>
    </form>
  )
}
