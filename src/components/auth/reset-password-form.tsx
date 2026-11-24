"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { NewPasswordFields } from "@/components/auth/new-password-fields"
import type { AuthArea } from "@/lib/validations/auth"
import {
  resetPasswordAction,
  type PasswordFormState,
} from "@/server/actions/password"

export function ResetPasswordForm({
  area,
  token,
}: {
  area: AuthArea
  token: string
}) {
  const [state, formAction, isPending] = useActionState<
    PasswordFormState,
    FormData
  >(resetPasswordAction, undefined)
  const forgotHref =
    area === "portal" ? "/portal/esqueci-senha" : "/esqueci-senha"

  if (!token) {
    return (
      <div className="space-y-4 text-sm">
        <p>Este link está incompleto. Peça um novo link de redefinição.</p>
        <Link href={forgotHref} className="text-primary hover:underline">
          Pedir novo link
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="area" value={area} />
      <input type="hidden" name="token" value={token} />
      <NewPasswordFields />

      {state?.error ? (
        <div className="space-y-1" role="alert">
          <p className="text-destructive text-sm">{state.error}</p>
          {state.needsNewLink ? (
            <Link
              href={forgotHref}
              className="text-primary text-sm hover:underline"
            >
              Pedir novo link
            </Link>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  )
}
