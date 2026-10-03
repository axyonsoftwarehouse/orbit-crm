"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Upload } from "lucide-react"
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
import type { ImportState } from "@/server/actions/import"

export function ImportCsvDialog({
  action,
  hint,
  label = "Importar CSV",
}: {
  action: (state: ImportState, formData: FormData) => Promise<ImportState>
  hint: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(action, undefined)

  useEffect(() => {
    if (state?.success) {
      toast.success(state.success)
      for (const item of (state.errors ?? []).slice(0, 3)) toast.error(item)
      setOpen(false)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Upload className="size-4" />
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar CSV</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="import-file">Arquivo CSV *</Label>
            <Input
              id="import-file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
            />
            <p className="text-muted-foreground text-xs">{hint}</p>
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
              {isPending ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
