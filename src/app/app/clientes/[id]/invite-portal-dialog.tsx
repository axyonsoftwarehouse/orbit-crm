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
  // Cada abertura começa do zero (sem o link do convite anterior).
  const [session, setSession] = useState(0)

  if (alreadyActive) {
    return (
      <Badge variant="secondary" className="text-[10px]">
        Portal ativo
      </Badge>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setSession((value) => value + 1)
        setOpen(next)
      }}
    >
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Acesso ao portal</DialogTitle>
        </DialogHeader>
        <InviteBody
          key={session}
          contactId={contactId}
          companyId={companyId}
          contactName={contactName}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function InviteBody({
  contactId,
  companyId,
  contactName,
  onClose,
}: {
  contactId: string
  companyId: string
  contactName: string
  onClose: () => void
}) {
  const [state, formAction, isPending] = useActionState<
    InviteContactState,
    FormData
  >(inviteContactToPortalAction, undefined)

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    else if (state?.error) toast.error(state.error)
  }, [state])

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      toast.success("Link copiado.")
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie.")
    }
  }

  const link = state?.inviteLink

  return (
    <>
      {link ? (
        <div className="space-y-4">
          <p className="text-sm">{state?.success}</p>
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">
              Link do convite (vale por 7 dias e só pode ser usado uma vez):
            </p>
            <div className="flex gap-2">
              <Input value={link} readOnly onFocus={(e) => e.target.select()} />
              <Button
                type="button"
                variant="outline"
                onClick={() => copyLink(link)}
              >
                Copiar
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={onClose}>
              Concluir
            </Button>
          </DialogFooter>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="contact_id" value={contactId} />
          <input type="hidden" name="company_id" value={companyId} />
          <p className="text-muted-foreground text-sm">
            Vamos enviar um convite por e-mail para{" "}
            <strong>{contactName}</strong>. Pelo link, o cliente cria a própria
            senha e entra no portal. Um convite novo substitui o anterior.
          </p>
          {state?.error ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando..." : "Enviar convite"}
            </Button>
          </DialogFooter>
        </form>
      )}
    </>
  )
}
