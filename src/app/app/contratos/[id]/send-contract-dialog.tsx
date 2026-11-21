"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { sendContractForSignatureAction } from "@/server/actions/contracts"

export type ContractContact = {
  id: string
  name: string
  email: string | null
  isPrimary: boolean
}

export function SendContractDialog({
  contractId,
  contacts,
}: {
  contractId: string
  contacts: ContractContact[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const withEmail = contacts.filter((contact) => contact.email)
  const [selected, setSelected] = useState<string[]>(() => {
    const primary = withEmail.find((contact) => contact.isPrimary)
    return primary ? [primary.id] : withEmail[0] ? [withEmail[0].id] : []
  })
  const [message, setMessage] = useState("")

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    )
  }

  function submit() {
    startTransition(async () => {
      const result = await sendContractForSignatureAction({
        id: contractId,
        contactIds: selected,
        message,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success ?? "Contrato enviado.")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Send className="size-4" />
            Enviar para assinatura
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar contrato para assinatura</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Contatos</Label>
            {withEmail.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                O cliente não tem contato com e-mail. Cadastre um contato para
                enviar.
              </p>
            ) : (
              withEmail.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(contact.id)}
                    onChange={(event) =>
                      toggle(contact.id, event.target.checked)
                    }
                  />
                  <span>
                    {contact.name}{" "}
                    <span className="text-muted-foreground">
                      ({contact.email})
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="contract-message">Mensagem (opcional)</Label>
            <Textarea
              id="contract-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={isPending || selected.length === 0}
          >
            {isPending ? "Enviando…" : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
