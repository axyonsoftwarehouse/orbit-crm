"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatMoney } from "@/lib/format"
import { normalizeItemKey } from "@/lib/items/import"
import type { ItemOption } from "@/server/queries/items"

export function ItemPicker({
  items,
  onSelect,
  disabled,
}: {
  items: ItemOption[]
  onSelect: (item: ItemOption) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

  const filtered = useMemo(() => {
    const key = normalizeItemKey(query)
    return items.filter(
      (item) =>
        item.active !== false &&
        (!key || normalizeItemKey(item.description).includes(key)),
    )
  }, [items, query])

  const grouped = useMemo(() => {
    const groups = new Map<string, { name: string; items: ItemOption[] }>()
    for (const item of filtered) {
      const name = item.group?.name ?? "Sem grupo"
      const group = groups.get(name) ?? { name, items: [] }
      group.items.push(item)
      groups.set(name, group)
    }
    return [...groups.values()]
  }, [filtered])

  function close() {
    setOpen(false)
    setQuery("")
    setActiveIndex(0)
  }

  function choose(item: ItemOption) {
    onSelect(item)
    close()
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      close()
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1))
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      const item = filtered[activeIndex]
      if (item) choose(item)
    }
  }

  let index = -1

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Plus className="size-4" />
        Do catálogo
      </Button>

      {open ? (
        <div className="bg-popover absolute z-50 mt-1 w-80 rounded-lg border p-2 shadow-md">
          <Input
            autoFocus
            placeholder="Buscar item"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
          <div className="mt-2 max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground px-2 py-3 text-sm">
                Nenhum item ativo encontrado.
              </p>
            ) : (
              grouped.map((group) => (
                <div key={group.name} className="py-1">
                  <p className="text-muted-foreground px-2 text-xs font-medium">
                    {group.name}
                  </p>
                  {group.items.map((item) => {
                    index += 1
                    const isActive = index === activeIndex
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                          isActive ? "bg-accent" : "hover:bg-accent/60"
                        }`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => choose(item)}
                      >
                        <span className="truncate">
                          <span className="block truncate">
                            {item.description}
                          </span>
                          {item.long_description ? (
                            <span className="text-muted-foreground block truncate text-xs">
                              {item.long_description.slice(0, 80)}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {formatMoney(Number(item.rate))}
                          {item.unit ? ` / ${item.unit}` : ""}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
