"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createTenantAction,
  type CreateTenantState,
} from "@/server/actions/platform"

export function CreateTenantForm() {
  const [state, formAction, isPending] = useActionState<
    CreateTenantState,
    FormData
  >(createTenantAction, undefined)

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="name">Nome da empresa</Label>
          <Input id="name" name="name" placeholder="Acme Ltda" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (opcional)</Label>
          <Input id="slug" name="slug" placeholder="acme" />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Criando..." : "Criar empresa"}
        </Button>
      </div>

      {state?.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {state.success}
        </p>
      ) : null}
    </form>
  )
}
