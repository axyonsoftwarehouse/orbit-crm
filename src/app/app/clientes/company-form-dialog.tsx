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
import {
  createCompanyAction,
  updateCompanyAction,
  type CompanyFormState,
} from "@/server/actions/companies"
import type { Company } from "@/server/queries/companies"

export function CompanyFormDialog({
  company,
  label,
}: {
  company?: Company
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = company ? updateCompanyAction : createCompanyAction
  const [state, formAction, isPending] = useActionState<
    CompanyFormState,
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
            variant={company ? "outline" : "default"}
            size={company ? "sm" : "default"}
          />
        }
      >
        {company ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {company ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {company ? (
            <input type="hidden" name="id" value={company.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="company-name">Nome *</Label>
            <Input
              id="company-name"
              name="name"
              defaultValue={company?.name ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-vat">CNPJ</Label>
              <Input
                id="company-vat"
                name="vat"
                defaultValue={company?.vat ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">Telefone</Label>
              <Input
                id="company-phone"
                name="phone"
                defaultValue={company?.phone ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-website">Site</Label>
              <Input
                id="company-website"
                name="website"
                defaultValue={company?.website ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-city">Cidade</Label>
              <Input
                id="company-city"
                name="city"
                defaultValue={company?.city ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-state">Estado</Label>
              <Input
                id="company-state"
                name="state"
                defaultValue={company?.state ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-country">País</Label>
              <Input
                id="company-country"
                name="country"
                defaultValue={company?.country ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-address">Endereço</Label>
            <Input
              id="company-address"
              name="address"
              defaultValue={company?.address ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-notes">Observações</Label>
            <Textarea
              id="company-notes"
              name="notes"
              defaultValue={company?.notes ?? ""}
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
