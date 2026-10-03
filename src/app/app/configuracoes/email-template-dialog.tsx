"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import {
  saveEmailTemplateAction,
  type EmailTemplateState,
} from "@/server/actions/email"

export function EmailTemplateDialog({
  templateKey,
  label,
  description,
  subject,
  body,
  variables,
}: {
  templateKey: string
  label: string
  description: string
  subject: string
  body: string
  variables: string[]
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<
    EmailTemplateState,
    FormData
  >(saveEmailTemplateAction, undefined)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      toast.success(state.success)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Editar
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="key" value={templateKey} />
          <p className="text-muted-foreground text-xs">{description}</p>

          <div className="space-y-2">
            <Label htmlFor="template-subject">Assunto</Label>
            <Input
              id="template-subject"
              name="subject"
              defaultValue={subject}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-body">Corpo (HTML)</Label>
            <Textarea
              id="template-body"
              name="body"
              rows={7}
              defaultValue={body}
              required
            />
          </div>

          {variables.length > 0 ? (
            <p className="text-muted-foreground text-xs">
              Variáveis disponíveis:{" "}
              {variables.map((v) => `{{${v}}}`).join(", ")}
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
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
