"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { DocumentItemsEditor } from "@/components/app/document-items-editor"
import { computeTotals, type LineItemInput } from "@/lib/documents/totals"
import { formatMoney } from "@/lib/format"
import {
  createEstimateAction,
  updateEstimateAction,
  type EstimateFormState,
} from "@/server/actions/estimates"
import type { DocumentItem, Estimate } from "@/server/queries/documents"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

function toInputs(items: DocumentItem[]): LineItemInput[] {
  if (items.length === 0) return [{ description: "", qty: 1, rate: 0 }]
  return items.map((item) => ({
    description: item.description,
    qty: Number(item.qty),
    rate: Number(item.rate),
    unit: item.unit,
    tax_name: item.tax_name,
    tax_rate: item.tax_rate !== null ? Number(item.tax_rate) : null,
  }))
}

export function EstimateFormDialog({
  estimate,
  items = [],
  companies,
  projects,
  defaultCurrency = "BRL",
  label,
}: {
  estimate?: Estimate
  items?: DocumentItem[]
  companies: { id: string; name: string }[]
  projects: { id: string; name: string }[]
  defaultCurrency?: string
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [lineItems, setLineItems] = useState<LineItemInput[]>(() =>
    toInputs(items),
  )
  const [discountType, setDiscountType] = useState<"before_tax" | "after_tax">(
    estimate?.discount_type ?? "before_tax",
  )
  const [discountPercent, setDiscountPercent] = useState(
    estimate?.discount_percent ? String(estimate.discount_percent) : "",
  )
  const [adjustment, setAdjustment] = useState(
    estimate?.adjustment ? String(estimate.adjustment) : "",
  )

  const action = estimate ? updateEstimateAction : createEstimateAction
  const [state, formAction, isPending] = useActionState<
    EstimateFormState,
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

  const currency = estimate?.currency ?? defaultCurrency
  const totals = useMemo(
    () =>
      computeTotals(lineItems, {
        discount_type: discountType,
        discount_percent: discountPercent ? Number(discountPercent) : null,
        adjustment: adjustment ? Number(adjustment) : null,
      }),
    [lineItems, discountType, discountPercent, adjustment],
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (value) {
          setLineItems(toInputs(items))
          setDiscountType(estimate?.discount_type ?? "before_tax")
          setDiscountPercent(
            estimate?.discount_percent ? String(estimate.discount_percent) : "",
          )
          setAdjustment(estimate?.adjustment ? String(estimate.adjustment) : "")
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant={estimate ? "outline" : "default"}
            size={estimate ? "sm" : "default"}
          />
        }
      >
        {estimate ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {estimate ? "Editar orçamento" : "Novo orçamento"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {estimate ? (
            <input type="hidden" name="id" value={estimate.id} />
          ) : null}
          <input type="hidden" name="items" value={JSON.stringify(lineItems)} />
          <input
            type="hidden"
            name="currency"
            value={estimate?.currency ?? defaultCurrency}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="est-company">Cliente</Label>
              <select
                id="est-company"
                name="company_id"
                defaultValue={estimate?.company_id ?? ""}
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
            <div className="space-y-2">
              <Label htmlFor="est-project">Projeto</Label>
              <select
                id="est-project"
                name="project_id"
                defaultValue={estimate?.project_id ?? ""}
                className={fieldClass}
              >
                <option value="">— Nenhum —</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-ref">Referência</Label>
              <Input
                id="est-ref"
                name="reference_no"
                defaultValue={estimate?.reference_no ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-date">Data *</Label>
              <Input
                id="est-date"
                name="date"
                type="date"
                defaultValue={
                  estimate?.date ?? new Date().toISOString().slice(0, 10)
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-expiry">Validade</Label>
              <Input
                id="est-expiry"
                name="expiry_date"
                type="date"
                defaultValue={estimate?.expiry_date ?? ""}
              />
            </div>
          </div>

          <DocumentItemsEditor items={lineItems} onChange={setLineItems} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="est-discount-type">Desconto</Label>
              <select
                id="est-discount-type"
                name="discount_type"
                value={discountType}
                onChange={(event) =>
                  setDiscountType(
                    event.target.value as "before_tax" | "after_tax",
                  )
                }
                className={fieldClass}
              >
                <option value="before_tax">Antes de impostos</option>
                <option value="after_tax">Depois de impostos</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-discount-percent">Desconto (%)</Label>
              <Input
                id="est-discount-percent"
                name="discount_percent"
                type="number"
                step="0.01"
                min="0"
                value={discountPercent}
                onChange={(event) => setDiscountPercent(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-adjustment">Ajuste</Label>
              <Input
                id="est-adjustment"
                name="adjustment"
                type="number"
                step="0.01"
                value={adjustment}
                onChange={(event) => setAdjustment(event.target.value)}
              />
            </div>
          </div>

          <div className="bg-muted/40 space-y-1 rounded-lg border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(totals.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impostos</span>
              <span>{formatMoney(totals.total_tax, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto</span>
              <span>- {formatMoney(totals.discount_total, currency)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{formatMoney(totals.total, currency)}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="est-client-note">Observações (cliente)</Label>
              <Textarea
                id="est-client-note"
                name="client_note"
                rows={2}
                defaultValue={estimate?.client_note ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-terms">Termos</Label>
              <Textarea
                id="est-terms"
                name="terms"
                rows={2}
                defaultValue={estimate?.terms ?? ""}
              />
            </div>
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
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
