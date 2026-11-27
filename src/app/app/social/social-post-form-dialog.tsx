"use client"

import { useActionState, useEffect, useState } from "react"
import { toast } from "sonner"
import { Pencil, Plus } from "lucide-react"
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
import { SOCIAL_PROVIDERS } from "@/lib/constants"
import { isAccountAllowedForCompany } from "@/lib/social-accounts"
import { SocialPreview } from "@/components/app/social-preview"
import {
  createSocialPostAction,
  updateSocialPostAction,
  type SocialFormState,
} from "@/server/actions/social"
import type { SocialAccount } from "@/server/queries/social"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

/** Post existente: o diálogo abre em modo de edição. */
export type EditableSocialPost = {
  id: string
  company: { id: string; name: string }
  content: string
  targetIds: string[]
  /** Salvar desfaz a aprovação (post aprovado/agendado que exige aprovação). */
  resetsApproval: boolean
}

export function SocialPostFormDialog({
  companies = [],
  accounts,
  approvalRequired = false,
  post,
}: {
  companies?: { id: string; name: string }[]
  accounts: SocialAccount[]
  approvalRequired?: boolean
  post?: EditableSocialPost
}) {
  const isEdit = Boolean(post)
  const [open, setOpen] = useState(false)
  const [companyId, setCompanyId] = useState(post?.company.id ?? "")
  const [content, setContent] = useState(post?.content ?? "")
  const [selectedIds, setSelectedIds] = useState<string[]>(
    post?.targetIds ?? [],
  )
  const [state, formAction, isPending] = useActionState<
    SocialFormState,
    FormData
  >(post ? updateSocialPostAction : createSocialPostAction, undefined)

  function handleOpenChange(next: boolean) {
    // Ao abrir a edição, parte sempre da versão salva do post.
    if (next && post) {
      setContent(post.content)
      setSelectedIds(post.targetIds)
    }
    setOpen(next)
  }

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      toast.success(state.success)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  const visibleAccounts = companyId
    ? accounts.filter((account) =>
        isAccountAllowedForCompany(account, companyId),
      )
    : accounts

  const selectedAccounts = visibleAccounts.filter((account) =>
    selectedIds.includes(account.id),
  )
  const hasInstagramTarget = selectedAccounts.some(
    (account) => account.provider === "instagram",
  )

  function toggleAccount(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {isEdit ? (
        <DialogTrigger render={<Button size="sm" variant="outline" />}>
          <Pencil className="size-3.5" />
          Editar
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="size-4" />
          Novo post
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar post" : "Novo post"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {post ? <input type="hidden" name="id" value={post.id} /> : null}
          {post?.resetsApproval ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              Este post já foi aprovado. Ao salvar, ele volta para rascunho,
              perde o agendamento e precisa ser enviado de novo para aprovação.
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="social-company">Cliente *</Label>
              {post ? (
                <p id="social-company" className="py-1.5 text-sm">
                  {post.company.name}
                </p>
              ) : (
                <select
                  id="social-company"
                  name="company_id"
                  required
                  value={companyId}
                  onChange={(event) => {
                    setCompanyId(event.target.value)
                    setSelectedIds([])
                  }}
                  className={fieldClass}
                >
                  <option value="">Selecione</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="social-content">Conteúdo *</Label>
              <Textarea
                id="social-content"
                name="content"
                rows={4}
                maxLength={5000}
                required
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Escreva o texto do post..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contas de destino *</Label>
            {visibleAccounts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma conta disponível. Cadastre uma conta em “Contas”.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {visibleAccounts.map((account) => (
                  <label
                    key={account.id}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="target_ids"
                      value={account.id}
                      checked={selectedIds.includes(account.id)}
                      onChange={() => toggleAccount(account.id)}
                    />
                    <span className="truncate">{account.display_name}</span>
                    <span className="text-muted-foreground ml-auto text-xs">
                      {SOCIAL_PROVIDERS[
                        account.provider as keyof typeof SOCIAL_PROVIDERS
                      ]?.label ?? account.provider}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {isEdit ? null : approvalRequired ? (
            <p className="text-muted-foreground text-xs">
              <input type="hidden" name="requires_approval" value="on" />
              Aprovação do cliente obrigatória. Owner/admin podem mudar em
              Social &gt; Configurações.
            </p>
          ) : (
            <label className="flex items-center gap-2 text-sm">
              <Input
                type="checkbox"
                name="requires_approval"
                className="size-4"
              />
              Exigir aprovação do cliente antes de publicar
            </label>
          )}

          {hasInstagramTarget ? (
            <p className="text-muted-foreground text-xs">
              O Instagram exige uma imagem. Anexe a imagem na página do post
              antes de agendar.
            </p>
          ) : null}

          {selectedAccounts.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Prévia por rede</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {selectedAccounts.map((account) => (
                  <SocialPreview
                    key={account.id}
                    provider={account.provider}
                    content={content}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Salvando..."
                  : "Criando..."
                : isEdit
                  ? "Salvar"
                  : "Criar post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
