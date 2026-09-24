import Link from "next/link"
import { Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { listFaqs, listKbArticles, listKbCategories } from "@/server/queries/kb"
import { ArticleFormDialog } from "./article-form-dialog"
import { CategoryFormDialog } from "./category-form-dialog"
import { FaqFormDialog } from "./faq-form-dialog"
import {
  DeleteArticleIcon,
  DeleteCategoryIcon,
  DeleteFaqIcon,
} from "./delete-icons"

const TABS = [
  { key: "artigos", label: "Artigos", href: "/app/base-conhecimento" },
  {
    key: "categorias",
    label: "Categorias",
    href: "/app/base-conhecimento?tab=categorias",
  },
  { key: "faq", label: "FAQ", href: "/app/base-conhecimento?tab=faq" },
]

export default async function KnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; categoria?: string }>
}) {
  const { tab = "artigos", categoria } = await searchParams

  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [articles, categories, faqs] = await Promise.all([
    listKbArticles(active.tenantId, { categoryId: categoria }),
    listKbCategories(active.tenantId),
    listFaqs(active.tenantId),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Base de conhecimento
          </h1>
          <p className="text-muted-foreground text-sm">
            {articles.length} artigo(s) · {faqs.length} FAQ ·{" "}
            {categories.length} categoria(s)
          </p>
        </div>
        {tab === "categorias" ? (
          <CategoryFormDialog />
        ) : tab === "faq" ? (
          <FaqFormDialog />
        ) : (
          <ArticleFormDialog categories={categories} label="Novo artigo" />
        )}
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              tab === item.key
                ? "border-primary text-primary font-medium"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "categorias" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma categoria ainda.
            </p>
          ) : (
            categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-heading text-sm font-semibold">
                      {category.name}
                    </div>
                    <div className="text-muted-foreground line-clamp-2 text-xs">
                      {category.description ?? "—"}
                    </div>
                  </div>
                  <DeleteCategoryIcon id={category.id} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : tab === "faq" ? (
        <div className="space-y-3">
          {faqs.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma FAQ ainda.</p>
          ) : (
            faqs.map((faq) => (
              <Card key={faq.id}>
                <CardContent className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-heading text-sm font-semibold">
                      {faq.question}
                    </div>
                    <div className="text-muted-foreground text-sm whitespace-pre-wrap">
                      {faq.answer ?? "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!faq.is_published ? (
                      <Badge variant="secondary">Rascunho</Badge>
                    ) : null}
                    <DeleteFaqIcon id={faq.id} />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <>
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/base-conhecimento"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  !categoria
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground",
                )}
              >
                Todos
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/app/base-conhecimento?categoria=${category.id}`}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    categoria === category.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum artigo ainda.
              </p>
            ) : (
              articles.map((article) => (
                <Card key={article.id}>
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/app/base-conhecimento/${article.id}`}
                        className="font-heading text-sm font-semibold hover:underline"
                      >
                        {article.title}
                      </Link>
                      <DeleteArticleIcon id={article.id} />
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-xs">
                      {article.excerpt ?? "—"}
                    </p>
                    <div className="text-muted-foreground flex items-center gap-3 text-xs">
                      {article.category ? (
                        <Badge variant="outline">{article.category.name}</Badge>
                      ) : null}
                      {article.is_published ? (
                        <Badge variant="secondary">Publicado</Badge>
                      ) : (
                        <Badge variant="secondary">Rascunho</Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="size-3.5" />
                        {article.views}
                      </span>
                      <span>{formatDate(article.updated_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
