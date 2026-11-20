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
import { sendDocumentAction } from "@/server/actions/send-document"
import type { DocumentKind } from "@/server/queries/documents"

export type SendDocumentContact = {
  id: string
  name: string
  email: string | null
  isPrimary: boolean
}

export function SendDocumentDialog({
  kind,
  documentId,
  contacts,
}: {
  kind: DocumentKind
  documentId: string
  contacts: SendDocumentContact[]
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
  const noun = kind === "estimate" ? "orçamento" : "fatura"

  function toggle(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...current, id] : current.filter((value) => value !== id),
    )
  }

  function submit() {
    startTransition(async () => {
      const result = await sendDocumentAction({
        kind,
        id: documentId,
        contactIds: selected,
        message,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success ?? "Enviado.")
      setOpen(false)
      setMessage("")
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Send className="size-4" />
        Enviar ao cliente
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar {noun} ao cliente</DialogTitle>
        </DialogHeader>

        {withEmail.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum contato deste cliente tem e-mail. Cadastre o e-mail de um
            contato na página do cliente para enviar.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Destinatários</Label>
              <div className="space-y-1.5">
                {withEmail.map((contact) => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="accent-primary size-4"
                      checked={selected.includes(contact.id)}
                      onChange={(event) =>
                        toggle(contact.id, event.target.checked)
                      }
                      aria-label={`Enviar para ${contact.name}`}
                    />
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-muted-foreground">
                      {contact.email}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="send-message">Mensagem (opcional)</Label>
              <Textarea
                id="send-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={1000}
                placeholder="Aparece no corpo do e-mail."
              />
            </div>
            <p className="text-muted-foreground text-xs">
              O cliente recebe o PDF anexo e um link para ver
              {kind === "estimate" ? " e aceitar ou recusar" : ""} o {noun} sem
              precisar de login.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={submit}
            disabled={isPending || selected.length === 0}
          >
            {isPending ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
