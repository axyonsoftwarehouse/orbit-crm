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
  createPlanAction,
  updatePlanAction,
  type PlanFormState,
} from "@/server/actions/platform"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export type PlanRow = {
  id: string
  name: string
  description: string | null
  price: number
  interval: string
  trial_days: number
  most_popular: boolean
  limits: Record<string, number | null> | null
}

const LIMIT_FIELDS = [
  { key: "clients", label: "Clientes" },
  { key: "projects", label: "Projetos" },
  { key: "tasks", label: "Tarefas" },
  { key: "tickets", label: "Tickets" },
  { key: "leads", label: "Leads" },
]

export function PlanFormDialog({
  plan,
  label,
}: {
  plan?: PlanRow
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = plan ? updatePlanAction : createPlanAction
  const [state, formAction, isPending] = useActionState<
    PlanFormState,
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
            variant={plan ? "outline" : "default"}
            size={plan ? "sm" : "default"}
          />
        }
      >
        {plan ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar plano" : "Novo plano"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {plan ? <input type="hidden" name="id" value={plan.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="plan-name">Nome *</Label>
            <Input
              id="plan-name"
              name="name"
              defaultValue={plan?.name ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-desc">Descrição</Label>
            <Textarea
              id="plan-desc"
              name="description"
              rows={2}
              defaultValue={plan?.description ?? ""}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="plan-price">Preço</Label>
              <Input
                id="plan-price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={plan?.price ?? 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-interval">Ciclo</Label>
              <select
                id="plan-interval"
                name="interval"
                defaultValue={plan?.interval ?? "monthly"}
                className={fieldClass}
              >
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-trial">Trial (dias)</Label>
              <Input
                id="plan-trial"
                name="trial_days"
                type="number"
                min="0"
                defaultValue={plan?.trial_days ?? 0}
              />
            </div>
          </div>

          <div>
            <div className="text-muted-foreground mb-1 text-xs">
              Limites por recurso (deixe vazio para ilimitado)
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {LIMIT_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label htmlFor={`lim-${field.key}`} className="text-xs">
                    {field.label}
                  </Label>
                  <Input
                    id={`lim-${field.key}`}
                    name={`limits_${field.key}`}
                    type="number"
                    min="0"
                    defaultValue={plan?.limits?.[field.key] ?? ""}
                  />
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="most_popular"
              defaultChecked={plan?.most_popular ?? false}
              className="accent-primary size-4"
            />
            Marcar como “mais popular”
          </label>

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
