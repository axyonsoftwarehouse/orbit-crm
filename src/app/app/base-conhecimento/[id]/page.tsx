import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { getKbArticle, listKbCategories } from "@/server/queries/kb"
import { ArticleFormDialog } from "../article-form-dialog"
import { DeleteArticleIcon } from "../delete-icons"

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const article = await getKbArticle(active.tenantId, id)
  if (!article) notFound()

  const categories = await listKbCategories(active.tenantId)
  const categoryName =
    categories.find((c) => c.id === article.category_id)?.name ?? null

  return (
    <div className="space-y-6">
      <Link
        href="/app/base-conhecimento"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Base de conhecimento
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {categoryName ? (
              <Badge variant="outline">{categoryName}</Badge>
            ) : null}
            {article.is_published ? (
              <Badge variant="secondary">Publicado</Badge>
            ) : (
              <Badge variant="secondary">Rascunho</Badge>
            )}
            <span className="text-muted-foreground flex items-center gap-1">
              <Eye className="size-3.5" />
              {article.views} visualizações
            </span>
            <span className="text-muted-foreground">
              Atualizado em {formatDate(article.updated_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ArticleFormDialog
            article={article}
            categories={categories}
            label="Editar"
          />
          <DeleteArticleIcon id={article.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conteúdo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">
            {article.content || "Sem conteúdo."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
