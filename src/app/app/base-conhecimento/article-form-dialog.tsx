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
  createKbArticleAction,
  updateKbArticleAction,
  type KbFormState,
} from "@/server/actions/kb"
import type { KbArticle } from "@/server/queries/kb"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export function ArticleFormDialog({
  article,
  categories,
  label,
}: {
  article?: KbArticle
  categories: { id: string; name: string }[]
  label: string
}) {
  const [open, setOpen] = useState(false)
  const action = article ? updateKbArticleAction : createKbArticleAction
  const [state, formAction, isPending] = useActionState<KbFormState, FormData>(
    action,
    undefined,
  )

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
            variant={article ? "outline" : "default"}
            size={article ? "sm" : "default"}
          />
        }
      >
        {article ? null : <Plus className="size-4" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{article ? "Editar artigo" : "Novo artigo"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {article ? (
            <input type="hidden" name="id" value={article.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="kb-title">Título *</Label>
            <Input
              id="kb-title"
              name="title"
              defaultValue={article?.title ?? ""}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="kb-category">Categoria</Label>
              <select
                id="kb-category"
                name="category_id"
                defaultValue={article?.category_id ?? ""}
                className={fieldClass}
              >
                <option value="">— Nenhuma —</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-end gap-2 pb-1.5 text-sm">
              <input
                type="checkbox"
                name="is_published"
                defaultChecked={article?.is_published ?? false}
                className="accent-primary size-4"
              />
              Publicado (visível para clientes)
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kb-excerpt">Resumo</Label>
            <Input
              id="kb-excerpt"
              name="excerpt"
              defaultValue={article?.excerpt ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kb-content">Conteúdo</Label>
            <Textarea
              id="kb-content"
              name="content"
              rows={12}
              defaultValue={article?.content ?? ""}
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
