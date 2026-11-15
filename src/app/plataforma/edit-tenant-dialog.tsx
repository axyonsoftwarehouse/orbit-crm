"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
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
  updateTenantAction,
  type UpdateTenantState,
} from "@/server/actions/platform"

export function EditTenantDialog({
  tenant,
}: {
  tenant: { id: string; name: string; slug: string }
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<
    UpdateTenantState,
    FormData
  >(updateTenantAction, undefined)

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
        <Pencil className="size-3.5" />
        Editar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar empresa</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={tenant.id} />
          <div className="space-y-2">
            <Label htmlFor={`tenant-name-${tenant.id}`}>Nome *</Label>
            <Input
              id={`tenant-name-${tenant.id}`}
              name="name"
              defaultValue={tenant.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`tenant-slug-${tenant.id}`}>Slug *</Label>
            <Input
              id={`tenant-slug-${tenant.id}`}
              name="slug"
              defaultValue={tenant.slug}
              required
            />
            <p className="text-muted-foreground text-xs">
              Apenas minúsculas, números e hífen. Alterar o slug libera o
              anterior para outra empresa.
            </p>
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
