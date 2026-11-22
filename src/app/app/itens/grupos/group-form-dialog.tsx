"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
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
  createItemGroupAction,
  updateItemGroupAction,
  type ItemGroupFormState,
} from "@/server/actions/items"

export function GroupFormDialog({
  group,
  label,
}: {
  group?: { id: string; name: string }
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = group ? updateItemGroupAction : createItemGroupAction
  const [state, formAction, isPending] = useActionState<
    ItemGroupFormState,
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
        render={<Button variant={group ? "ghost" : "default"} size="sm" />}
      >
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{group ? "Editar grupo" : "Novo grupo"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {group ? <input type="hidden" name="id" value={group.id} /> : null}
          <div className="space-y-2">
            <Label htmlFor="group-name">Nome *</Label>
            <Input
              id="group-name"
              name="name"
              defaultValue={group?.name ?? ""}
              maxLength={100}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
