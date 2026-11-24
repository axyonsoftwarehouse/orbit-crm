"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AuthArea } from "@/lib/validations/auth"
import {
  requestPasswordResetAction,
  type PasswordFormState,
} from "@/server/actions/password"

export function ForgotPasswordForm({ area }: { area: AuthArea }) {
  const [state, formAction, isPending] = useActionState<
    PasswordFormState,
    FormData
  >(requestPasswordResetAction, undefined)
  const loginHref = area === "portal" ? "/portal/login" : "/login"

  if (state?.success) {
    return (
      <div className="space-y-4">
        <p className="text-sm" role="status">
          {state.success}
        </p>
        <Link
          href={loginHref}
          className="text-primary block text-center text-sm hover:underline"
        >
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="area" value={area} />
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="voce@empresa.com"
          autoComplete="email"
          required
        />
      </div>

      {state?.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Enviando..." : "Enviar link"}
      </Button>
      <Link
        href={loginHref}
        className="text-muted-foreground block text-center text-sm hover:underline"
      >
        Voltar para o login
      </Link>
    </form>
  )
}
