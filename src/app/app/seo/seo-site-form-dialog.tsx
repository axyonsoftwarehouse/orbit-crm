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
import { SEO_CHECK_INTERVAL_LABELS } from "@/lib/constants"
import {
  createSeoSiteAction,
  type SeoSiteFormState,
} from "@/server/actions/seo"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function SeoSiteFormDialog({
  companies,
  label = "Novo site",
}: {
  companies: { id: string; name: string }[]
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<
    SeoSiteFormState,
    FormData
  >(createSeoSiteAction, undefined)

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
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo site monitorado</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seo-site-url">URL *</Label>
            <Input
              id="seo-site-url"
              name="url"
              type="url"
              placeholder="https://exemplo.com"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seo-site-label">Nome</Label>
              <Input
                id="seo-site-label"
                name="label"
                placeholder="Site institucional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo-site-company">Cliente</Label>
              <select
                id="seo-site-company"
                name="company_id"
                className={fieldClass}
              >
                <option value="">— Nenhum —</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo-site-monitoring">
              Monitoramento automático
            </Label>
            <select
              id="seo-site-monitoring"
              name="check_interval_days"
              defaultValue="0"
              className={fieldClass}
            >
              {Object.entries(SEO_CHECK_INTERVAL_LABELS).map(
                ([value, optionLabel]) => (
                  <option key={value} value={value}>
                    {optionLabel}
                  </option>
                ),
              )}
            </select>
          </div>

          <p className="text-muted-foreground text-xs">
            A auditoria verifica a página inicial e segue redirecionamentos
            HTTP. Sites internos ou endereços privados são bloqueados.
          </p>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
