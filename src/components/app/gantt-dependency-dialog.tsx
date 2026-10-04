"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Link2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  addTaskDependencyAction,
  removeTaskDependencyAction,
  type GanttState,
} from "@/server/actions/gantt"

type Option = { id: string; name: string }

type Dependency = {
  id: string
  task_id: string
  depends_on_task_id: string
}

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"

export function GanttDependencyDialog({
  projectId,
  task,
  tasks,
  dependencies,
}: {
  projectId: string
  task: Option
  tasks: Option[]
  dependencies: Dependency[]
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<GanttState, FormData>(
    addTaskDependencyAction,
    undefined,
  )

  useEffect(() => {
    if (state?.success) toast.success(state.success)
    else if (state?.error) toast.error(state.error)
  }, [state])

  const nameById = new Map(tasks.map((item) => [item.id, item.name]))
  const predecessors = dependencies.filter((dep) => dep.task_id === task.id)
  const predecessorIds = new Set(
    predecessors.map((dep) => dep.depends_on_task_id),
  )
  const candidates = tasks.filter(
    (item) => item.id !== task.id && !predecessorIds.has(item.id),
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" title="Dependências" />}
      >
        <Link2 className="size-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dependências</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">{task.name}</p>

          <div className="space-y-2">
            <Label>Predecessoras</Label>
            {predecessors.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma dependência ainda.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {predecessors.map((dep) => (
                  <li
                    key={dep.id}
                    className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm"
                  >
                    <span className="truncate">
                      {nameById.get(dep.depends_on_task_id) ?? "—"}
                    </span>
                    <RemoveDependencyButton id={dep.id} projectId={projectId} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form action={formAction} className="space-y-2">
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="task_id" value={task.id} />
            <Label htmlFor={`dep-${task.id}`}>Adicionar predecessora</Label>
            <div className="flex gap-2">
              <select
                id={`dep-${task.id}`}
                name="depends_on_task_id"
                defaultValue=""
                disabled={candidates.length === 0}
                className={fieldClass}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {candidates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                disabled={isPending || candidates.length === 0}
              >
                Adicionar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RemoveDependencyButton({
  id,
  projectId,
}: {
  id: string
  projectId: string
}) {
  return (
    <form
      action={async (formData) => {
        const result = await removeTaskDependencyAction(formData)
        if (result?.error) toast.error(result.error)
        else if (result?.success) toast.success(result.success)
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="project_id" value={projectId} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        title="Remover dependência"
      >
        <X className="size-3.5" />
      </Button>
    </form>
  )
}
