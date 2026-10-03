"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { Plus, Tag as TagIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TAG_COLORS } from "@/lib/constants"
import {
  createTagForEntityAction,
  setEntityTagAction,
  type TagFormState,
} from "@/server/actions/tags"
import type { Tag, TaggedEntityType } from "@/server/queries/tags"

function TagCreateDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: TaggedEntityType
  entityId: string
}) {
  const [color, setColor] = useState<string>(TAG_COLORS[0])
  const [state, formAction, isPending] = useActionState<TagFormState, FormData>(
    createTagForEntityAction,
    undefined,
  )

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false)
      toast.success(state.success)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova tag</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="entity_type" value={entityType} />
          <input type="hidden" name="entity_id" value={entityId} />
          <div className="space-y-2">
            <Label htmlFor="tag-new-name">Nome *</Label>
            <Input id="tag-new-name" name="name" required autoFocus />
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
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TagPicker({
  entityType,
  entityId,
  assigned,
  all,
}: {
  entityType: TaggedEntityType
  entityId: string
  assigned: Tag[]
  all: Tag[]
}) {
  const [isPending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const assignedIds = new Set(assigned.map((tag) => tag.id))

  function setTag(tagId: string, assign: boolean) {
    startTransition(() =>
      setEntityTagAction({ tagId, entityType, entityId, assign }),
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {assigned.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
          style={{
            borderColor: `${tag.color}55`,
            backgroundColor: `${tag.color}14`,
          }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: tag.color }}
          />
          {tag.name}
          <button
            type="button"
            aria-label={`Remover ${tag.name}`}
            disabled={isPending}
            onClick={() => setTag(tag.id, false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs"
            />
          }
        >
          <TagIcon className="size-3" />
          Tags
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {all.length === 0 ? (
            <div className="text-muted-foreground px-2 py-1.5 text-xs">
              Nenhuma tag criada.
            </div>
          ) : (
            all.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag.id}
                checked={assignedIds.has(tag.id)}
                closeOnClick={false}
                onCheckedChange={(checked) => setTag(tag.id, checked)}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </DropdownMenuCheckboxItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nova tag…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TagCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        entityType={entityType}
        entityId={entityId}
      />
    </div>
  )
}
