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
import { CustomFieldInputs } from "@/components/app/custom-field-inputs"
import { PROJECT_BILLING_TYPES, PROJECT_STATUSES } from "@/lib/constants"
import {
  createProjectAction,
  updateProjectAction,
  type ProjectFormState,
} from "@/server/actions/projects"
import type { Project } from "@/server/queries/projects"
import type { CustomFieldDefinition } from "@/server/queries/custom-fields"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function ProjectFormDialog({
  project,
  companies,
  customFields,
  customValues,
  label,
}: {
  project?: Project
  companies: { id: string; name: string }[]
  customFields?: CustomFieldDefinition[]
  customValues?: Record<string, string>
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = project ? updateProjectAction : createProjectAction
  const [state, formAction, isPending] = useActionState<
    ProjectFormState,
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
            variant={project ? "outline" : "default"}
            size={project ? "sm" : "default"}
          />
        }
      >
        {project ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {project ? "Editar projeto" : "Novo projeto"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {project ? (
            <input type="hidden" name="id" value={project.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="project-name">Nome *</Label>
            <Input
              id="project-name"
              name="name"
              defaultValue={project?.name ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-company">Cliente</Label>
              <select
                id="project-company"
                name="company_id"
                defaultValue={project?.company_id ?? ""}
                className={fieldClass}
              >
                <option value="">— Nenhum (interno) —</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <select
                id="project-status"
                name="status"
                defaultValue={String(project?.status ?? 1)}
                className={fieldClass}
              >
                {Object.entries(PROJECT_STATUSES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-billing">Tipo de cobrança</Label>
              <select
                id="project-billing"
                name="billing_type"
                defaultValue={String(project?.billing_type ?? 1)}
                className={fieldClass}
              >
                {Object.entries(PROJECT_BILLING_TYPES).map(
                  ([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-estimated">Horas estimadas</Label>
              <Input
                id="project-estimated"
                name="estimated_hours"
                type="number"
                step="0.01"
                min="0"
                defaultValue={project?.estimated_hours ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-start">Início</Label>
              <Input
                id="project-start"
                name="start_date"
                type="date"
                defaultValue={project?.start_date ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-deadline">Prazo</Label>
              <Input
                id="project-deadline"
                name="deadline"
                type="date"
                defaultValue={project?.deadline ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-cost">Valor fixo</Label>
              <Input
                id="project-cost"
                name="project_cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={project?.project_cost ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-rate">Valor/hora</Label>
              <Input
                id="project-rate"
                name="rate_per_hour"
                type="number"
                step="0.01"
                min="0"
                defaultValue={project?.rate_per_hour ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-progress">Progresso (%)</Label>
              <Input
                id="project-progress"
                name="progress"
                type="number"
                min="0"
                max="100"
                defaultValue={project?.progress ?? 0}
              />
            </div>
            <label className="flex items-end gap-2 pb-1.5 text-sm">
              <input
                type="checkbox"
                name="progress_from_tasks"
                defaultChecked={project?.progress_from_tasks ?? false}
                className="accent-primary size-4"
              />
              Calcular progresso pelas tarefas
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Descrição</Label>
            <Textarea
              id="project-description"
              name="description"
              rows={3}
              defaultValue={project?.description ?? ""}
            />
          </div>

          <CustomFieldInputs
            fields={customFields ?? []}
            values={customValues}
          />

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
