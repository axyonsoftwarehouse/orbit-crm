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
import { PAYMENT_MODES } from "@/lib/constants"
import {
  recordPaymentAction,
  type InvoiceFormState,
} from "@/server/actions/invoices"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function RecordPaymentDialog({
  invoiceId,
  amountDue,
  label = "Registrar pagamento",
}: {
  invoiceId: string
  amountDue: number
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<
    InvoiceFormState,
    FormData
  >(recordPaymentAction, undefined)

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
      <DialogTrigger render={<Button />}>{label}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="invoice_id" value={invoiceId} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Valor *</Label>
              <Input
                id="pay-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={amountDue > 0 ? amountDue.toFixed(2) : ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-date">Data *</Label>
              <Input
                id="pay-date"
                name="payment_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-mode">Forma</Label>
              <select
                id="pay-mode"
                name="payment_mode"
                defaultValue="Pix"
                className={fieldClass}
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-tx">Transação</Label>
              <Input id="pay-tx" name="transaction_id" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-note">Nota</Label>
            <Textarea id="pay-note" name="note" rows={2} />
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
              {isPending ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
