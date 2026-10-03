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
import { Textarea } from "@/components/ui/textarea"
import { CONTRACT_STATUSES } from "@/lib/constants"
import {
  createContractAction,
  updateContractAction,
  type ContractFormState,
} from "@/server/actions/contracts"
import type { Contract } from "@/server/queries/contracts"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function ContractFormDialog({
  contract,
  companies,
  label,
}: {
  contract?: Contract
  companies: { id: string; name: string }[]
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = contract ? updateContractAction : createContractAction
  const [state, formAction, isPending] = useActionState<
    ContractFormState,
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={contract ? "outline" : "default"}
            size={contract ? "sm" : "default"}
          />
        }
      >
        {contract ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {contract ? "Editar contrato" : "Novo contrato"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {contract ? (
            <input type="hidden" name="id" value={contract.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="contract-title">Título *</Label>
            <Input
              id="contract-title"
              name="title"
              defaultValue={contract?.title ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contract-company">Cliente</Label>
              <select
                id="contract-company"
                name="company_id"
                defaultValue={contract?.company_id ?? ""}
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
              <Label htmlFor="contract-status">Status</Label>
              <select
                id="contract-status"
                name="status"
                defaultValue={String(contract?.status ?? 1)}
                className={fieldClass}
              >
                {Object.entries(CONTRACT_STATUSES).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract-value">Valor</Label>
              <Input
                id="contract-value"
                name="value"
                type="number"
                step="0.01"
                min="0"
                defaultValue={contract?.value ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract-start">Início</Label>
              <Input
                id="contract-start"
                name="start_date"
                type="date"
                defaultValue={contract?.start_date ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract-end">Término</Label>
              <Input
                id="contract-end"
                name="end_date"
                type="date"
                defaultValue={contract?.end_date ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-description">Descrição</Label>
            <Textarea
              id="contract-description"
              name="description"
              rows={3}
              defaultValue={contract?.description ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract-note">Observações</Label>
            <Textarea
              id="contract-note"
              name="note"
              rows={2}
              defaultValue={contract?.note ?? ""}
            />
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
