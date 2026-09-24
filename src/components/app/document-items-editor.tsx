"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LineItemInput } from "@/lib/documents/totals"

export function DocumentItemsEditor({
  items,
  onChange,
}: {
  items: LineItemInput[]
  onChange: (items: LineItemInput[]) => void
}) {
  function update(index: number, patch: Partial<LineItemInput>) {
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    )
  }

  function add() {
    onChange([...items, { description: "", qty: 1, rate: 0 }])
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground grid grid-cols-[1fr_70px_100px_90px_32px] gap-2 text-xs">
        <span>Descrição</span>
        <span>Qtd</span>
        <span>Valor</span>
        <span>Imp. %</span>
        <span />
      </div>
      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-[1fr_70px_100px_90px_32px] items-center gap-2"
        >
          <Input
            value={item.description}
            placeholder="Descrição"
            onChange={(event) =>
              update(index, { description: event.target.value })
            }
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.qty}
            onChange={(event) =>
              update(index, { qty: Number(event.target.value) })
            }
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.rate}
            onChange={(event) =>
              update(index, { rate: Number(event.target.value) })
            }
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            value={item.tax_rate ?? ""}
            onChange={(event) =>
              update(index, {
                tax_rate:
                  event.target.value === "" ? null : Number(event.target.value),
              })
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={items.length === 1}
            onClick={() => remove(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" />
        Adicionar item
      </Button>
    </div>
  )
}
