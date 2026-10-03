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
import { TAG_COLORS } from "@/lib/constants"
import {
  createTagAction,
  updateTagAction,
  type TagFormState,
} from "@/server/actions/tags"
import type { Tag } from "@/server/queries/tags"

export function TagFormDialog({ tag, label }: { tag?: Tag; label: string }) {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState<string>(tag?.color ?? TAG_COLORS[0])
  const action = tag ? updateTagAction : createTagAction
  const [state, formAction, isPending] = useActionState<TagFormState, FormData>(
    action,
    undefined,
  )

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
            variant={tag ? "outline" : "default"}
            size={tag ? "sm" : "default"}
          />
        }
      >
        {tag ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{tag ? "Editar tag" : "Nova tag"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {tag ? <input type="hidden" name="id" value={tag.id} /> : null}
          <div className="space-y-2">
            <Label htmlFor="tag-name">Nome *</Label>
            <Input
              id="tag-name"
              name="name"
              defaultValue={tag?.name ?? ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex items-center gap-2">
              {TAG_COLORS.map((option) => (
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
                        color === option ? `0 0 0 2px ${option}55` : undefined,
                    }}
                  />
                </label>
              ))}
            </div>
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
