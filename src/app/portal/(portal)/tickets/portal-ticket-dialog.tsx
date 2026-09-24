"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
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
import { TICKET_PRIORITIES, TICKET_TYPES } from "@/lib/constants"
import {
  createPortalTicketAction,
  type PortalTicketState,
} from "@/server/actions/portal"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function PortalTicketDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<
    PortalTicketState,
    FormData
  >(createPortalTicketAction, undefined)

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Novo ticket
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Abrir ticket</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pt-subject">Assunto *</Label>
            <Input id="pt-subject" name="subject" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pt-priority">Prioridade</Label>
              <select
                id="pt-priority"
                name="priority"
                defaultValue="2"
                className={fieldClass}
              >
                {Object.entries(TICKET_PRIORITIES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pt-type">Tipo</Label>
              <select
                id="pt-type"
                name="type"
                defaultValue="3"
                className={fieldClass}
              >
                {Object.entries(TICKET_TYPES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pt-details">Descrição</Label>
            <Textarea id="pt-details" name="details" rows={4} />
          </div>
          {state?.error ? (
            <p className="text-destructive text-sm">{state.error}</p>
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
              {isPending ? "Enviando..." : "Abrir ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
