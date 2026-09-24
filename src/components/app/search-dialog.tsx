"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { searchAction, type SearchResult } from "@/server/actions/search"

export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isPending, startTransition] = useTransition()

  function run(value: string) {
    setQuery(value)
    startTransition(async () => {
      setResults(await searchAction(value))
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) {
          setQuery("")
          setResults([])
        }
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            className="bg-muted text-muted-foreground hover:bg-muted/70 hidden h-9 items-center gap-2 rounded-full px-3 text-sm md:flex"
          />
        }
      >
        <Search className="size-4" />
        Buscar
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Buscar</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Clientes, projetos, tarefas..."
          value={query}
          onChange={(event) => run(event.target.value)}
        />
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {isPending && query.length >= 2 ? (
            <p className="text-muted-foreground p-2 text-sm">Buscando...</p>
          ) : null}
          {!isPending && query.length >= 2 && results.length === 0 ? (
            <p className="text-muted-foreground p-2 text-sm">
              Nada encontrado.
            </p>
          ) : null}
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              href={result.href}
              onClick={() => setOpen(false)}
              className="hover:bg-muted flex items-center justify-between rounded-md px-3 py-2 text-sm"
            >
              <span className="truncate">{result.title}</span>
              <span className="text-muted-foreground ml-3 shrink-0 text-xs capitalize">
                {result.type}
              </span>
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
