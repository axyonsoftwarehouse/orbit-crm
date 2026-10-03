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
  createCalendarEventAction,
  updateCalendarEventAction,
  type CalendarFormState,
} from "@/server/actions/calendar"
import type { CalendarEvent } from "@/server/queries/calendar"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

function toInput(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function EventFormDialog({
  event,
  companies,
  projects,
  label,
}: {
  event?: CalendarEvent
  companies: { id: string; name: string }[]
  projects: { id: string; name: string }[]
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = event ? updateCalendarEventAction : createCalendarEventAction
  const [state, formAction, isPending] = useActionState<
    CalendarFormState,
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

  const startDefault = event
    ? toInput(event.start_at)
    : toInput(new Date().toISOString())

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={event ? "outline" : "default"}
            size={event ? "sm" : "default"}
          />
        }
      >
        {event ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? "Editar evento" : "Novo evento"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {event ? <input type="hidden" name="id" value={event.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="event-title">Título *</Label>
            <Input
              id="event-title"
              name="title"
              defaultValue={event?.title ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="event-start">Início *</Label>
              <Input
                id="event-start"
                name="start_at"
                type="datetime-local"
                defaultValue={startDefault}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">Término</Label>
              <Input
                id="event-end"
                name="end_at"
                type="datetime-local"
                defaultValue={toInput(event?.end_at)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-company">Cliente</Label>
              <select
                id="event-company"
                name="company_id"
                defaultValue={event?.company_id ?? ""}
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
              <Label htmlFor="event-project">Projeto</Label>
              <select
                id="event-project"
                name="project_id"
                defaultValue={event?.project_id ?? ""}
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
            <Label htmlFor="event-description">Descrição</Label>
            <Textarea
              id="event-description"
              name="description"
              rows={3}
              defaultValue={event?.description ?? ""}
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
