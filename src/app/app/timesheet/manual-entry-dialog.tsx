"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
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
  addManualEntryAction,
  type ManualEntryState,
} from "@/server/actions/time"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function ManualEntryDialog({
  projects,
  tasks,
}: {
  projects: { id: string; name: string }[]
  tasks: { id: string; name: string; project_id: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [projectId, setProjectId] = useState("")
  const [state, formAction, isPending] = useActionState<
    ManualEntryState,
    FormData
  >(addManualEntryAction, undefined)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      toast.success(state.success)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  const filteredTasks = useMemo(
    () => tasks.filter((task) => task.project_id === projectId),
    [tasks, projectId],
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (value) setProjectId("")
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="size-4" />
        Lançamento manual
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lançamento manual</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entry-project">Projeto *</Label>
              <select
                id="entry-project"
                name="project_id"
                required
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                className={fieldClass}
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-task">Tarefa</Label>
              <select
                id="entry-task"
                name="task_id"
                className={fieldClass}
                defaultValue=""
              >
                <option value="">Sem tarefa</option>
                {filteredTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-date">Data *</Label>
              <Input
                id="entry-date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-hours">Horas *</Label>
              <Input
                id="entry-hours"
                name="hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                defaultValue="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-rate">Valor/hora</Label>
              <Input
                id="entry-rate"
                name="rate"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
            <label className="flex items-end gap-2 pb-1.5 text-sm">
              <input
                type="checkbox"
                name="is_billable"
                className="accent-primary size-4"
              />
              Faturável
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-note">Nota</Label>
            <Textarea id="entry-note" name="note" rows={2} />
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
