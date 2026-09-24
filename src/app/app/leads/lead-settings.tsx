"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createLeadSourceAction,
  createLeadStatusAction,
  deleteLeadSourceAction,
  deleteLeadStatusAction,
  type LeadFormState,
} from "@/server/actions/leads"
import type { LeadSource, LeadStatus } from "@/server/queries/leads"

export function LeadSettingsDialog({
  statuses,
  sources,
}: {
  statuses: LeadStatus[]
  sources: LeadSource[]
}) {
  const [open, setOpen] = useState(false)
  const [statusState, statusAction, statusPending] = useActionState<
    LeadFormState,
    FormData
  >(createLeadStatusAction, undefined)
  const [sourceState, sourceAction, sourcePending] = useActionState<
    LeadFormState,
    FormData
  >(createLeadSourceAction, undefined)

  useEffect(() => {
    if (statusState?.success) toast.success(statusState.success)
    else if (statusState?.error) toast.error(statusState.error)
  }, [statusState])
  useEffect(() => {
    if (sourceState?.success) toast.success(sourceState.success)
    else if (sourceState?.error) toast.error(sourceState.error)
  }, [sourceState])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Settings className="size-4" />
        Configurar
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Status e origens de leads</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] space-y-6 overflow-y-auto">
          <section>
            <h3 className="font-heading mb-2 text-sm font-semibold">Status</h3>
            <div className="space-y-1">
              {statuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}
                    {status.is_won ? (
                      <span className="text-muted-foreground text-xs">
                        · ganho
                      </span>
                    ) : null}
                    {status.is_lost ? (
                      <span className="text-muted-foreground text-xs">
                        · perdido
                      </span>
                    ) : null}
                  </span>
                  <form
                    action={deleteLeadStatusAction}
                    onSubmit={(event) => {
                      if (!confirm("Remover este status?"))
                        event.preventDefault()
                    }}
                  >
                    <input type="hidden" name="id" value={status.id} />
                    <button
                      type="submit"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remover status"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
            <form action={statusAction} className="mt-2 flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="st-name" className="text-xs">
                  Novo status
                </Label>
                <Input id="st-name" name="name" required />
              </div>
              <input
                type="color"
                name="color"
                defaultValue="#0062ff"
                className="h-8 w-10 cursor-pointer rounded border"
                aria-label="Cor"
              />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  name="is_won"
                  className="accent-primary size-4"
                />
                ganho
              </label>
              <Button type="submit" size="sm" disabled={statusPending}>
                <Plus className="size-4" />
              </Button>
            </form>
          </section>

          <section>
            <h3 className="font-heading mb-2 text-sm font-semibold">Origens</h3>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => (
                <span
                  key={source.id}
                  className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                >
                  {source.name}
                  <form
                    action={deleteLeadSourceAction}
                    onSubmit={(event) => {
                      if (!confirm("Remover esta origem?"))
                        event.preventDefault()
                    }}
                  >
                    <input type="hidden" name="id" value={source.id} />
                    <button
                      type="submit"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remover origem"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </form>
                </span>
              ))}
            </div>
            <form action={sourceAction} className="mt-2 flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="src-name" className="text-xs">
                  Nova origem
                </Label>
                <Input id="src-name" name="name" required />
              </div>
              <Button type="submit" size="sm" disabled={sourcePending}>
                <Plus className="size-4" />
              </Button>
            </form>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
