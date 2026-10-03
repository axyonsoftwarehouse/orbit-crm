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
import {
  createGoalAction,
  updateGoalAction,
  type GoalFormState,
} from "@/server/actions/goals"
import type { Goal } from "@/server/queries/goals"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

function monthDefaults() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const iso = (date: Date) => date.toLocaleDateString("en-CA")
  return { start: iso(start), end: iso(end) }
}

export function GoalFormDialog({
  goal,
  label,
}: {
  goal?: Goal
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = goal ? updateGoalAction : createGoalAction
  const [state, formAction, isPending] = useActionState<
    GoalFormState,
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

  const defaults = monthDefaults()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={goal ? "outline" : "default"}
            size={goal ? "sm" : "default"}
          />
        }
      >
        {goal ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar meta" : "Nova meta"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {goal ? <input type="hidden" name="id" value={goal.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="goal-title">Título</Label>
            <Input
              id="goal-title"
              name="title"
              defaultValue={goal?.title ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-metric">Métrica</Label>
            <select
              id="goal-metric"
              name="metric"
              defaultValue={goal?.metric ?? "revenue"}
              className={fieldClass}
            >
              <option value="revenue">Faturamento (R$)</option>
              <option value="leads">Novos leads</option>
              <option value="hours">Horas faturáveis</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="goal-start">Início *</Label>
              <Input
                id="goal-start"
                name="period_start"
                type="date"
                defaultValue={goal?.period_start ?? defaults.start}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal-end">Fim *</Label>
              <Input
                id="goal-end"
                name="period_end"
                type="date"
                defaultValue={goal?.period_end ?? defaults.end}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-target">Meta *</Label>
            <Input
              id="goal-target"
              name="target"
              type="number"
              step="0.01"
              min="0"
              defaultValue={goal?.target ?? ""}
              required
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
