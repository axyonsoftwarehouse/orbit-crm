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
import { SOCIAL_PROVIDERS } from "@/lib/constants"
import {
  createSocialAccountAction,
  type SocialFormState,
} from "@/server/actions/social"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function SocialAccountFormDialog({
  companies,
}: {
  companies: { id: string; name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState<
    SocialFormState,
    FormData
  >(createSocialAccountAction, undefined)

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
        Adicionar conta
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar conta</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="social-provider">Rede *</Label>
              <select
                id="social-provider"
                name="provider"
                required
                className={fieldClass}
              >
                {Object.entries(SOCIAL_PROVIDERS).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="social-company">Cliente</Label>
              <select
                id="social-company"
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
            <Label htmlFor="social-display-name">Nome exibido *</Label>
            <Input
              id="social-display-name"
              name="display_name"
              placeholder="Ex.: @orbitcrm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social-account-id">ID da conta na rede *</Label>
            <Input
              id="social-account-id"
              name="provider_account_id"
              placeholder="ID retornado pelo provedor"
              required
            />
          </div>

          <p className="text-muted-foreground text-xs">
            Cadastro manual para o MVP interno. A conexão OAuth via agregador
            entra na próxima etapa.
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
