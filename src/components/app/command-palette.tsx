"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CornerDownLeft, Plus, Search, type LucideIcon } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { filterCommands } from "@/lib/search"
import { searchAction, type SearchResult } from "@/server/actions/search"
import { NAV_ITEMS, NEW_ITEMS } from "./nav-items"

type Item = {
  id: string
  label: string
  hint: string | null
  href: string
  icon: LucideIcon
  group: string
  keywords?: string
}

const COMMANDS: Item[] = [
  ...NEW_ITEMS.map((item) => ({
    id: `new:${item.href}`,
    label: item.command,
    hint: null,
    href: item.href,
    icon: Plus,
    group: "Criar",
    keywords: `criar adicionar ${item.label}`,
  })),
  ...NAV_ITEMS.map((item) => ({
    id: `nav:${item.href}`,
    label: item.title,
    hint: null,
    href: item.href,
    icon: item.icon,
    group: "Ir para",
    keywords: "ir abrir pagina",
  })),
]

const SEARCH_DELAY_MS = 200

function resultItem(result: SearchResult): Item {
  return {
    id: `${result.type}:${result.id}`,
    label: result.title,
    hint: result.subtitle,
    href: result.href,
    icon: Search,
    group: result.type,
  }
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const requestId = useRef(0)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    const term = query.trim()
    const id = ++requestId.current
    if (term.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const found = await searchAction(term).catch(() => [])
      if (id !== requestId.current) return
      setResults(found)
      setSearching(false)
    }, SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [query])

  const items = useMemo(() => {
    const commands = filterCommands(COMMANDS, query)
    const visible = query.trim() ? commands.slice(0, 8) : commands
    return [...results.map(resultItem), ...visible]
  }, [query, results])

  useEffect(() => {
    setActive(0)
  }, [items])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [active])

  function close() {
    setOpen(false)
    setQuery("")
    setResults([])
  }

  function select(item: Item | undefined) {
    if (!item) return
    close()
    router.push(item.href)
  }

  function onInputKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, items.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      select(items[active])
    }
  }

  let lastGroup = ""

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-muted text-muted-foreground hover:bg-muted/70 hidden h-9 items-center gap-2 rounded-full px-3 text-sm md:flex"
      >
        <Search className="size-4" />
        Buscar
        <kbd className="bg-background ml-2 rounded border px-1.5 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </button>
      <Dialog
        open={open}
        onOpenChange={(value) => (value ? setOpen(true) : close())}
      >
        <DialogContent
          showCloseButton={false}
          className="top-[20%] translate-y-0 gap-0 p-0 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">Buscar e navegar</DialogTitle>
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="text-muted-foreground size-4 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Buscar clientes, leads, tarefas… ou digite um comando"
              aria-label="Buscar"
              role="combobox"
              aria-expanded
              aria-controls="command-palette-list"
              aria-activedescendant={
                items[active] ? `command-${active}` : undefined
              }
              className="h-12 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div
            ref={listRef}
            id="command-palette-list"
            role="listbox"
            className="max-h-96 overflow-y-auto p-2"
          >
            {searching && (
              <p className="text-muted-foreground px-2 py-1.5 text-xs">
                Buscando…
              </p>
            )}
            {!searching && items.length === 0 && (
              <p className="text-muted-foreground p-3 text-sm">
                Nada encontrado.
              </p>
            )}
            {items.map((item, index) => {
              const heading = item.group !== lastGroup ? item.group : null
              lastGroup = item.group
              const Icon = item.icon
              return (
                <div key={item.id}>
                  {heading && (
                    <p className="text-muted-foreground px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wider uppercase">
                      {heading}
                    </p>
                  )}
                  <div
                    id={`command-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={index === active}
                    onMouseMove={() => setActive(index)}
                    onClick={() => select(item)}
                    className="aria-selected:bg-muted flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm"
                  >
                    <Icon className="text-muted-foreground size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.hint && (
                      <span className="text-muted-foreground truncate text-xs">
                        {item.hint}
                      </span>
                    )}
                    {index === active && (
                      <CornerDownLeft className="text-muted-foreground ml-auto size-3.5 shrink-0" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
