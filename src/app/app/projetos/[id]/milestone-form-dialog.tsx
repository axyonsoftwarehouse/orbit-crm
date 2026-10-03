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
import { MILESTONE_COLORS, MILESTONE_STATUSES } from "@/lib/constants"
import {
  createMilestoneAction,
  updateMilestoneAction,
  type MilestoneFormState,
} from "@/server/actions/milestones"
import type { Milestone } from "@/server/queries/milestones"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function MilestoneFormDialog({
  projectId,
  milestone,
  label,
}: {
  projectId: string
  milestone?: Milestone
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState<string>(
    milestone?.color ?? MILESTONE_COLORS[0],
  )
  const action = milestone ? updateMilestoneAction : createMilestoneAction
  const [state, formAction, isPending] = useActionState<
    MilestoneFormState,
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
            variant={milestone ? "outline" : "default"}
            size={milestone ? "sm" : "default"}
          />
        }
      >
        {milestone ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{milestone ? "Editar marco" : "Novo marco"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="project_id" value={projectId} />
          {milestone ? (
            <input type="hidden" name="id" value={milestone.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="milestone-name">Nome *</Label>
            <Input
              id="milestone-name"
              name="name"
              defaultValue={milestone?.name ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="milestone-status">Status</Label>
              <select
                id="milestone-status"
                name="status"
                defaultValue={String(milestone?.status ?? 1)}
                className={fieldClass}
              >
                {Object.entries(MILESTONE_STATUSES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex items-center gap-2 pt-1">
                {MILESTONE_COLORS.map((option) => (
                  <label key={option} className="cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={option}
                      checked={color === option}
                      onChange={() => setColor(option)}
                      className="sr-only"
                    />
                    <span
                      className="block size-6 rounded-full"
                      style={{
                        backgroundColor: option,
                        boxShadow:
                          color === option
                            ? `0 0 0 2px ${option}55`
                            : undefined,
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-start">Início</Label>
              <Input
                id="milestone-start"
                name="start_date"
                type="date"
                defaultValue={milestone?.start_date ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-due">Prazo</Label>
              <Input
                id="milestone-due"
                name="due_date"
                type="date"
                defaultValue={milestone?.due_date ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestone-description">Descrição</Label>
            <Textarea
              id="milestone-description"
              name="description"
              rows={3}
              defaultValue={milestone?.description ?? ""}
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
