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
import { CUSTOM_FIELD_TYPES, type CustomFieldEntity } from "@/lib/constants"
import {
  createCustomFieldAction,
  updateCustomFieldAction,
  type CustomFieldFormState,
} from "@/server/actions/custom-fields"
import type { CustomFieldDefinition } from "@/server/queries/custom-fields"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60)
}

export function CustomFieldFormDialog({
  entityType,
  field,
  label,
}: {
  entityType: CustomFieldEntity
  field?: CustomFieldDefinition
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string>(field?.field_type ?? "text")
  const [keyValue, setKeyValue] = useState(field?.key ?? "")
  const [keyTouched, setKeyTouched] = useState(Boolean(field))
  const action = field ? updateCustomFieldAction : createCustomFieldAction
  const [state, formAction, isPending] = useActionState<
    CustomFieldFormState,
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
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {field ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {field ? "Editar campo" : "Novo campo personalizado"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="entity_type" value={entityType} />
          {field ? <input type="hidden" name="id" value={field.id} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cf-label">Rótulo *</Label>
              <Input
                id="cf-label"
                name="label"
                defaultValue={field?.label ?? ""}
                required
                onChange={(event) => {
                  if (!keyTouched) setKeyValue(slugify(event.target.value))
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-key">Chave *</Label>
              <Input
                id="cf-key"
                name="key"
                value={keyValue}
                onChange={(event) => {
                  setKeyTouched(true)
                  setKeyValue(event.target.value)
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-type">Tipo</Label>
              <select
                id="cf-type"
                name="field_type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                className={fieldClass}
              >
                {Object.entries(CUSTOM_FIELD_TYPES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-position">Ordem</Label>
              <Input
                id="cf-position"
                name="position"
                type="number"
                min="0"
                defaultValue={field?.position ?? 0}
              />
            </div>
          </div>

          {type === "select" ? (
            <div className="space-y-2">
              <Label htmlFor="cf-options">Opções (uma por linha)</Label>
              <Textarea
                id="cf-options"
                name="options"
                rows={3}
                defaultValue={field?.options.join("\n") ?? ""}
              />
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="required"
              defaultChecked={field?.required ?? false}
              className="accent-primary size-4"
            />
            Obrigatório
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
