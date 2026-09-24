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
import {
  createLeadAction,
  updateLeadAction,
  type LeadFormState,
} from "@/server/actions/leads"
import type { Lead, LeadSource, LeadStatus } from "@/server/queries/leads"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function LeadFormDialog({
  lead,
  statuses,
  sources,
  members,
  label,
}: {
  lead?: Lead
  statuses: LeadStatus[]
  sources: LeadSource[]
  members: { user_id: string; full_name: string | null }[]
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = lead ? updateLeadAction : createLeadAction
  const [state, formAction, isPending] = useActionState<
    LeadFormState,
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={lead ? "outline" : "default"}
            size={lead ? "sm" : "default"}
          />
        }
      >
        {lead ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {lead ? <input type="hidden" name="id" value={lead.id} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lead-name">Nome *</Label>
              <Input
                id="lead-name"
                name="name"
                defaultValue={lead?.name ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-company">Empresa</Label>
              <Input
                id="lead-company"
                name="company"
                defaultValue={lead?.company ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-title">Cargo</Label>
              <Input
                id="lead-title"
                name="title"
                defaultValue={lead?.title ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-email">E-mail</Label>
              <Input
                id="lead-email"
                name="email"
                type="email"
                defaultValue={lead?.email ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-phone">Telefone</Label>
              <Input
                id="lead-phone"
                name="phone"
                defaultValue={lead?.phone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-website">Site</Label>
              <Input
                id="lead-website"
                name="website"
                defaultValue={lead?.website ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-status">Status</Label>
              <select
                id="lead-status"
                name="status_id"
                defaultValue={lead?.status_id ?? ""}
                className={fieldClass}
              >
                <option value="">— Nenhum —</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-source">Origem</Label>
              <select
                id="lead-source"
                name="source_id"
                defaultValue={lead?.source_id ?? ""}
                className={fieldClass}
              >
                <option value="">— Nenhuma —</option>
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-value">Valor</Label>
              <Input
                id="lead-value"
                name="value"
                type="number"
                step="0.01"
                min="0"
                defaultValue={lead?.value ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-assignee">Responsável</Label>
              <select
                id="lead-assignee"
                name="assignee_id"
                defaultValue={lead?.assignee_id ?? ""}
                className={fieldClass}
              >
                <option value="">— Ninguém —</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.full_name ?? member.user_id}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-city">Cidade</Label>
              <Input
                id="lead-city"
                name="city"
                defaultValue={lead?.city ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-country">País</Label>
              <Input
                id="lead-country"
                name="country"
                defaultValue={lead?.country ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-description">Descrição</Label>
            <Textarea
              id="lead-description"
              name="description"
              rows={3}
              defaultValue={lead?.description ?? ""}
            />
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
