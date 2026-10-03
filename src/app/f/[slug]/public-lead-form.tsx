"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  submitPublicLeadAction,
  type PublicLeadState,
} from "@/server/actions/public-lead"

export function PublicLeadForm({ slug }: { slug: string }) {
  const [state, formAction, isPending] = useActionState<
    PublicLeadState,
    FormData
  >(submitPublicLeadAction, undefined)

  if (state?.success) {
    return (
      <p className="text-center text-sm text-[#12a06b] dark:text-[#3dd598]">
        {state.success}
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="space-y-2">
        <Label htmlFor="lead-name">Nome *</Label>
        <Input id="lead-name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-email">E-mail</Label>
        <Input id="lead-email" name="email" type="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-phone">Telefone</Label>
        <Input id="lead-phone" name="phone" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lead-message">Mensagem</Label>
        <Textarea id="lead-message" name="message" rows={3} />
      </div>

      {state?.error ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar"}
      </Button>
    </form>
  )
}
