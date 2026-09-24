import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"
import { getPortalArticle } from "@/server/queries/portal"

export default async function PortalArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const article = await getPortalArticle(id)
  if (!article) notFound()

  return (
    <div className="space-y-6">
      <Link
        href="/portal/ajuda"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Central de ajuda
      </Link>

      <div className="space-y-2">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {article.title}
        </h1>
        <div className="flex items-center gap-2 text-xs">
          {article.category ? (
            <Badge variant="outline">{article.category.name}</Badge>
          ) : null}
          <span className="text-muted-foreground">
            Atualizado em {formatDate(article.updated_at)}
          </span>
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
