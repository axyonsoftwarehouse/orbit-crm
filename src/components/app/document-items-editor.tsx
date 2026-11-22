"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ItemPicker } from "@/components/app/item-picker"
import type { LineItemInput } from "@/lib/documents/totals"
import type { ItemOption } from "@/server/queries/items"

const gridClass = "grid grid-cols-[1fr_60px_70px_100px_90px_70px_32px] gap-2"

export function DocumentItemsEditor({
  items,
  onChange,
  catalog,
}: {
  items: LineItemInput[]
  onChange: (items: LineItemInput[]) => void
  catalog?: ItemOption[]
}) {
  function update(index: number, patch: Partial<LineItemInput>) {
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    )
  }

  function add() {
    onChange([...items, { description: "", qty: 1, rate: 0 }])
  }

  function addFromCatalog(item: ItemOption) {
    onChange([
      ...items,
      {
        description: item.description,
        qty: 1,
        rate: Number(item.rate),
        unit: item.unit,
        tax_name: item.tax_name,
        tax_rate: item.tax_rate !== null ? Number(item.tax_rate) : null,
        item_id: item.id,
      },
    ])
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {catalog ? (
        <div className="flex justify-end">
          <ItemPicker items={catalog} onSelect={addFromCatalog} />
        </div>
      ) : null}
      <div
        className={`${gridClass} text-muted-foreground items-center text-xs`}
      >
        <span>Descrição</span>
        <span>Qtd</span>
        <span>Valor</span>
        <span>Un.</span>
        <span>Imp. %</span>
        <span />
        <span />
      </div>
      {items.map((item, index) => (
        <div key={index} className={`${gridClass} items-center`}>
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
            value={item.unit ?? ""}
            placeholder="h"
            onChange={(event) =>
              update(index, { unit: event.target.value || null })
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
          <span />
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
