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
  ITEM_IMPORT_MAX_ROWS,
  itemImportTemplate,
  parseItemsCsv,
  type ItemImportRow,
} from "@/lib/items/import"
import { importItemsAction, type ItemImportState } from "@/server/actions/items"

const MAX_BYTES = 2 * 1024 * 1024

export function ImportItemsDialog({
  descriptions,
  groups,
}: {
  descriptions: string[]
  groups: string[]
}) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ItemImportRow[]>([])
  const [newGroups, setNewGroups] = useState<string[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [state, formAction, isPending] = useActionState<
    ItemImportState,
    FormData
  >(importItemsAction, undefined)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      setRows([])
      setNewGroups([])
      toast.success(state.success)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  const valid = rows.filter((row) => row.status === "ok")
  const duplicates = rows.filter((row) => row.status === "duplicate")
  const invalid = rows.filter((row) => row.status === "invalid")
  const preview = rows.slice(0, 50)

  async function handleFile(file: File | undefined) {
    setParseError(null)
    setRows([])
    setNewGroups([])
    if (!file) return

    if (file.size > MAX_BYTES) {
      setParseError("Arquivo muito grande (máximo 2 MB).")
      return
    }

    const result = parseItemsCsv(await file.text(), { descriptions, groups })
    setParseError(result.error)
    setRows(result.rows)
    setNewGroups(result.newGroups)
  }

  function downloadTemplate() {
    const blob = new Blob([itemImportTemplate()], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "modelo-itens.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const payload = JSON.stringify(valid.map((row) => row.data))

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (value) {
          setRows([])
          setNewGroups([])
          setParseError(null)
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        Importar CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar itens</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="rows" value={payload} />

          <div className="space-y-2">
            <Label htmlFor="items-csv">Arquivo CSV</Label>
            <Input
              id="items-csv"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">
                Até {ITEM_IMPORT_MAX_ROWS} linhas e 2 MB.
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={downloadTemplate}
              >
                Baixar modelo
              </Button>
            </div>
          </div>

          {parseError ? (
            <p className="text-destructive text-sm" role="alert">
              {parseError}
            </p>
          ) : null}

          {rows.length > 0 ? (
            <>
              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span>{valid.length} válida(s)</span>
                <span>{duplicates.length} duplicada(s)</span>
                <span>{invalid.length} inválida(s)</span>
                <span>{newGroups.length} grupo(s) novo(s)</span>
              </div>

              {invalid.length > 0 ? (
                <p className="text-destructive text-sm" role="alert">
                  Corrija as linhas inválidas no arquivo e envie de novo. Nada é
                  importado enquanto houver erro.
                </p>
              ) : null}

              <div className="max-h-64 overflow-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-xs">
                    <tr>
                      <th className="px-2 py-1.5">Linha</th>
                      <th className="px-2 py-1.5">Descrição</th>
                      <th className="px-2 py-1.5">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row) => (
                      <tr key={row.line} className="border-t">
                        <td className="text-muted-foreground px-2 py-1.5">
                          {row.line}
                        </td>
                        <td className="max-w-64 truncate px-2 py-1.5">
                          {row.data?.description ?? "—"}
                        </td>
                        <td className="px-2 py-1.5">
                          {row.status === "ok"
                            ? "Válida"
                            : row.status === "duplicate"
                              ? "Duplicada"
                              : (row.message ?? "Inválida")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > preview.length ? (
                <p className="text-muted-foreground text-xs">
                  Mostrando as primeiras {preview.length} linhas de{" "}
                  {rows.length}.
                </p>
              ) : null}
            </>
          ) : null}

          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending || valid.length === 0 || invalid.length > 0}
            >
              {isPending
                ? "Importando..."
                : `Importar ${valid.length} item(ns)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
