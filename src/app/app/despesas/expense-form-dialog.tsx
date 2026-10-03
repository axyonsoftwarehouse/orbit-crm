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
import { EXPENSE_CATEGORIES } from "@/lib/constants"
import {
  createExpenseAction,
  updateExpenseAction,
  type ExpenseFormState,
} from "@/server/actions/expenses"
import type { Expense } from "@/server/queries/expenses"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function ExpenseFormDialog({
  expense,
  projects,
  companies,
  label,
}: {
  expense?: Expense
  projects: { id: string; name: string }[]
  companies: { id: string; name: string }[]
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = expense ? updateExpenseAction : createExpenseAction
  const [state, formAction, isPending] = useActionState<
    ExpenseFormState,
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

  const today = new Date().toISOString().slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={expense ? "outline" : "default"}
            size={expense ? "sm" : "default"}
          />
        }
      >
        {expense ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Editar despesa" : "Nova despesa"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {expense ? (
            <input type="hidden" name="id" value={expense.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="expense-title">Descrição *</Label>
            <Input
              id="expense-title"
              name="title"
              defaultValue={expense?.title ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense-category">Categoria</Label>
              <Input
                id="expense-category"
                name="category"
                list="expense-categories"
                defaultValue={expense?.category ?? ""}
              />
              <datalist id="expense-categories">
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Valor *</Label>
              <Input
                id="expense-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                defaultValue={expense?.amount ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">Data *</Label>
              <Input
                id="expense-date"
                name="date"
                type="date"
                defaultValue={expense?.date ?? today}
                required
              />
            </div>
            <label className="flex items-end gap-2 pb-1.5 text-sm">
              <input
                type="checkbox"
                name="billable"
                defaultChecked={expense?.billable ?? false}
                className="accent-primary size-4"
              />
              Faturável
            </label>
            <div className="space-y-2">
              <Label htmlFor="expense-project">Projeto</Label>
              <select
                id="expense-project"
                name="project_id"
                defaultValue={expense?.project_id ?? ""}
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
            <div className="space-y-2">
              <Label htmlFor="expense-company">Cliente</Label>
              <select
                id="expense-company"
                name="company_id"
                defaultValue={expense?.company_id ?? ""}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-note">Observações</Label>
            <Textarea
              id="expense-note"
              name="note"
              rows={2}
              defaultValue={expense?.note ?? ""}
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
