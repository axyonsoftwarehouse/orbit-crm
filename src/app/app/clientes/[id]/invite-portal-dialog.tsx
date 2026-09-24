"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  inviteContactToPortalAction,
  type InviteContactState,
} from "@/server/actions/contacts"

export function InvitePortalDialog({
  contactId,
  companyId,
  contactName,
  hasEmail,
  alreadyActive,
}: {
  contactId: string
  companyId: string
  contactName: string
  hasEmail: boolean
  alreadyActive: boolean
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<
    InviteContactState,
    FormData
  >(inviteContactToPortalAction, undefined)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      toast.success(state.success)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  if (alreadyActive) {
    return (
      <Badge variant="secondary" className="text-[10px]">
        Portal ativo
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasEmail}
            title={hasEmail ? undefined : "Cadastre um e-mail para o contato"}
          />
        }
      >
        Dar acesso
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Acesso ao portal</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="contact_id" value={contactId} />
          <input type="hidden" name="company_id" value={companyId} />
          <p className="text-muted-foreground text-sm">
            Defina uma senha inicial para <strong>{contactName}</strong> acessar
            o portal do cliente.
          </p>
          <div className="space-y-2">
            <Label htmlFor="portal-pass">Senha (mínimo 8)</Label>
            <Input
              id="portal-pass"
              name="password"
              type="text"
              minLength={8}
              required
            />
            <p className="text-muted-foreground text-xs">
              Compartilhe o e-mail e esta senha com o cliente.
            </p>
          </div>
          {state?.error ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar acesso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
