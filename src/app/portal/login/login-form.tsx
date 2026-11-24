"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  portalSignInAction,
  type PortalAuthState,
} from "@/server/actions/portal"

export function PortalLoginForm() {
  const [state, formAction, isPending] = useActionState<
    PortalAuthState,
    FormData
  >(portalSignInAction, undefined)

  return (
    <form action={formAction} className="space-y-4">
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
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Link
            href="/portal/esqueci-senha"
            className="text-muted-foreground text-xs hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Entrando..." : "Entrar no portal"}
      </Button>
    </form>
  )
}
