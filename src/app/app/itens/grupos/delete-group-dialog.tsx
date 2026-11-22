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
import { Label } from "@/components/ui/label"
import {
  deleteItemGroupAction,
  type ItemGroupFormState,
} from "@/server/actions/items"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function DeleteGroupDialog({
  group,
  groups,
}: {
  group: { id: string; name: string; count: number }
  groups: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const others = groups.filter((item) => item.id !== group.id)
  const [state, formAction, isPending] = useActionState<
    ItemGroupFormState,
    FormData
  >(deleteItemGroupAction, undefined)

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
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
          />
        }
      >
        Excluir
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir grupo</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={group.id} />
          {group.count > 0 ? (
            <>
              <p className="text-muted-foreground text-sm">
                Este grupo tem {group.count} item(ns). Escolha para onde mover
                antes de excluir.
              </p>
              <input type="hidden" name="mode" value="move" />
              <div className="space-y-2">
                <Label htmlFor={`group-target-${group.id}`}>Mover para</Label>
                <select
                  id={`group-target-${group.id}`}
                  name="target_group_id"
                  defaultValue=""
                  className={fieldClass}
                >
                  <option value="">Sem grupo</option>
                  {others.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Excluir o grupo &quot;{group.name}&quot;? Nenhum item será
              apagado.
            </p>
          )}
          <DialogFooter>
            <Button
              type="submit"
              variant="outline"
              className="text-destructive"
              disabled={isPending}
            >
              {isPending
                ? "Excluindo..."
                : group.count > 0
                  ? "Mover e excluir"
                  : "Excluir grupo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
