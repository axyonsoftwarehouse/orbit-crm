import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/format"
import { listPortalArticles, listPortalFaqs } from "@/server/queries/portal"

export default async function PortalHelpPage() {
  const [articles, faqs] = await Promise.all([
    listPortalArticles(),
    listPortalFaqs(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Central de ajuda
        </h1>
        <p className="text-muted-foreground text-sm">
          Artigos e perguntas frequentes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum artigo disponível ainda.
          </p>
        ) : (
          articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="space-y-2">
                <Link
                  href={`/portal/ajuda/${article.id}`}
                  className="flex items-start gap-2"
                >
                  <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <BookOpen className="size-4" />
                  </span>
                  <span className="font-heading text-sm font-semibold hover:underline">
                    {article.title}
                  </span>
                </Link>
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {article.excerpt ?? "—"}
                </p>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  {article.category ? (
                    <Badge variant="outline">{article.category.name}</Badge>
                  ) : null}
                  <span>{formatDate(article.updated_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {faqs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perguntas frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="font-heading text-sm font-semibold">
                  {faq.question}
                </div>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {faq.answer ?? "—"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
