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
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_TYPES,
} from "@/lib/constants"
import {
  createTicketAction,
  updateTicketAction,
  type TicketFormState,
} from "@/server/actions/tickets"
import type { Ticket } from "@/server/queries/tickets"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function TicketFormDialog({
  ticket,
  departments,
  companies,
  projects,
  members,
  label,
}: {
  ticket?: Ticket
  departments: { id: string; name: string }[]
  companies: { id: string; name: string }[]
  projects: { id: string; name: string }[]
  members: { user_id: string; full_name: string | null }[]
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = ticket ? updateTicketAction : createTicketAction
  const [state, formAction, isPending] = useActionState<
    TicketFormState,
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
            variant={ticket ? "outline" : "default"}
            size={ticket ? "sm" : "default"}
          />
        }
      >
        {ticket ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{ticket ? "Editar ticket" : "Novo ticket"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {ticket ? <input type="hidden" name="id" value={ticket.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Assunto *</Label>
            <Input
              id="ticket-subject"
              name="subject"
              defaultValue={ticket?.subject ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ticket-status">Status</Label>
              <select
                id="ticket-status"
                name="status"
                defaultValue={String(ticket?.status ?? 1)}
                className={fieldClass}
              >
                {Object.entries(TICKET_STATUSES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Prioridade</Label>
              <select
                id="ticket-priority"
                name="priority"
                defaultValue={String(ticket?.priority ?? 2)}
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
              <Label htmlFor="ticket-type">Tipo</Label>
              <select
                id="ticket-type"
                name="type"
                defaultValue={String(ticket?.type ?? 3)}
                className={fieldClass}
              >
                {Object.entries(TICKET_TYPES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-department">Departamento</Label>
              <select
                id="ticket-department"
                name="department_id"
                defaultValue={ticket?.department_id ?? ""}
                className={fieldClass}
              >
                <option value="">— Nenhum —</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-company">Cliente</Label>
              <select
                id="ticket-company"
                name="company_id"
                defaultValue={ticket?.company_id ?? ""}
                className={fieldClass}
              >
                <option value="">— Nenhum —</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-assignee">Responsável</Label>
              <select
                id="ticket-assignee"
                name="assignee_id"
                defaultValue={ticket?.assignee_id ?? ""}
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ticket-project">Projeto</Label>
              <select
                id="ticket-project"
                name="project_id"
                defaultValue={ticket?.project_id ?? ""}
                className={fieldClass}
              >
                <option value="">— Nenhum —</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-details">Descrição</Label>
            <Textarea
              id="ticket-details"
              name="details"
              rows={4}
              defaultValue={ticket?.details ?? ""}
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
