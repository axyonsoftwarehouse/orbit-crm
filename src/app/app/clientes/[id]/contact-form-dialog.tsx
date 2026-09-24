"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  createContactAction,
  updateContactAction,
  type ContactFormState,
} from "@/server/actions/contacts"
import type { Contact } from "@/server/queries/companies"

export function ContactFormDialog({
  companyId,
  contact,
  label,
}: {
  companyId: string
  contact?: Contact
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [isPrimary, setIsPrimary] = useState(contact?.is_primary ?? false)
  const action = contact ? updateContactAction : createContactAction
  const [state, formAction, isPending] = useActionState<
    ContactFormState,
    FormData
  >(action, undefined)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      toast.success(state.success)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (value) setIsPrimary(contact?.is_primary ?? false)
      }}
    >
      <DialogTrigger
        render={<Button variant={contact ? "ghost" : "outline"} size="sm" />}
      >
        {contact ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {contact ? "Editar contato" : "Novo contato"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="company_id" value={companyId} />
          {contact ? (
            <input type="hidden" name="id" value={contact.id} />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contact-first">Nome *</Label>
              <Input
                id="contact-first"
                name="first_name"
                defaultValue={contact?.first_name ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-last">Sobrenome</Label>
              <Input
                id="contact-last"
                name="last_name"
                defaultValue={contact?.last_name ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">E-mail</Label>
              <Input
                id="contact-email"
                name="email"
                type="email"
                defaultValue={contact?.email ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Telefone</Label>
              <Input
                id="contact-phone"
                name="phone"
                defaultValue={contact?.phone ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-title">Cargo</Label>
            <Input
              id="contact-title"
              name="title"
              defaultValue={contact?.title ?? ""}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="contact-primary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
            />
            <input
              type="hidden"
              name="is_primary"
              value={isPrimary ? "on" : ""}
            />
            <Label htmlFor="contact-primary">Contato principal</Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
