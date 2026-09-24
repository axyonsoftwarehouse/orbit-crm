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
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants"
import {
  createTaskAction,
  updateTaskAction,
  type TaskFormState,
} from "@/server/actions/tasks"
import type { Task } from "@/server/queries/tasks"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function TaskFormDialog({
  projects,
  members,
  task,
  defaultProjectId,
  label,
}: {
  projects: { id: string; name: string }[]
  members: { user_id: string; full_name: string | null }[]
  task?: Task
  defaultProjectId?: string
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = task ? updateTaskAction : createTaskAction
  const [state, formAction, isPending] = useActionState<
    TaskFormState,
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
            variant={task ? "outline" : "default"}
            size={task ? "sm" : "default"}
          />
        }
      >
        {task ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {task ? <input type="hidden" name="id" value={task.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="task-name">Título *</Label>
            <Input
              id="task-name"
              name="name"
              defaultValue={task?.name ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-project">Projeto *</Label>
              <select
                id="task-project"
                name="project_id"
                required
                defaultValue={task?.project_id ?? defaultProjectId ?? ""}
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
              <Label htmlFor="task-assignee">Responsável</Label>
              <select
                id="task-assignee"
                name="assignee_id"
                defaultValue={task?.assignee_id ?? ""}
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
              <Label htmlFor="task-status">Status</Label>
              <select
                id="task-status"
                name="status"
                defaultValue={String(task?.status ?? 1)}
                className={fieldClass}
              >
                {Object.entries(TASK_STATUSES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-priority">Prioridade</Label>
              <select
                id="task-priority"
                name="priority"
                defaultValue={String(task?.priority ?? 2)}
                className={fieldClass}
              >
                {Object.entries(TASK_PRIORITIES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-start">Início</Label>
              <Input
                id="task-start"
                name="start_date"
                type="date"
                defaultValue={task?.start_date ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Prazo</Label>
              <Input
                id="task-due"
                name="due_date"
                type="date"
                defaultValue={task?.due_date ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-rate">Valor/hora</Label>
              <Input
                id="task-rate"
                name="hourly_rate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={task?.hourly_rate ?? ""}
              />
            </div>
            <label className="flex items-end gap-2 pb-1.5 text-sm">
              <input
                type="checkbox"
                name="billable"
                defaultChecked={task?.billable ?? false}
                className="accent-primary size-4"
              />
              Faturável
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Descrição</Label>
            <Textarea
              id="task-description"
              name="description"
              rows={3}
              defaultValue={task?.description ?? ""}
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
