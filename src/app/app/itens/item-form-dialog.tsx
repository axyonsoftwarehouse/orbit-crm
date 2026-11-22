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
import { Textarea } from "@/components/ui/textarea"
import {
  createItemAction,
  updateItemAction,
  type ItemFormState,
} from "@/server/actions/items"
import type { Item } from "@/server/queries/items"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function ItemFormDialog({
  item,
  groups,
  label,
}: {
  item?: Item
  groups: { id: string; name: string }[]
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = item ? updateItemAction : createItemAction
  const [state, formAction, isPending] = useActionState<
    ItemFormState,
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
        render={<Button variant={item ? "ghost" : "default"} size="sm" />}
      >
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item" : "Novo item"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {item ? <input type="hidden" name="id" value={item.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor="item-description">Descrição *</Label>
            <Input
              id="item-description"
              name="description"
              defaultValue={item?.description ?? ""}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-long">Descrição longa</Label>
            <Textarea
              id="item-long"
              name="long_description"
              defaultValue={item?.long_description ?? ""}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-group">Grupo</Label>
              <select
                id="item-group"
                name="group_id"
                defaultValue={item?.group_id ?? ""}
                className={fieldClass}
              >
                <option value="">Sem grupo</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-unit">Unidade</Label>
              <Input
                id="item-unit"
                name="unit"
                defaultValue={item?.unit ?? ""}
                maxLength={50}
                placeholder="h, un, mês"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-rate">Valor *</Label>
              <Input
                id="item-rate"
                name="rate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item?.rate ?? 0}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-purchase">Preço de compra</Label>
              <Input
                id="item-purchase"
                name="purchase_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item?.purchase_price ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-tax-name">Imposto</Label>
              <Input
                id="item-tax-name"
                name="tax_name"
                defaultValue={item?.tax_name ?? ""}
                maxLength={100}
                placeholder="ISS"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-tax-rate">Alíquota (%)</Label>
              <Input
                id="item-tax-rate"
                name="tax_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={item?.tax_rate ?? ""}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              defaultChecked={item?.active ?? true}
              className="accent-primary size-4"
            />
            Item ativo (aparece no seletor)
          </label>

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
