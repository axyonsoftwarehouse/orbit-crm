import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  SeoCheckStatusBadge,
  SeoScoreBadge,
  SeoSeverityBadge,
} from "@/components/app/seo-bits"
import { getPortalContact, getPortalSeoAudit } from "@/server/queries/portal"

const CATEGORIES = [
  "Conteúdo",
  "Técnico",
  "Performance",
  "Segurança",
  "Social",
] as const

function formatDateTime(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export default async function PortalSeoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getPortalContact()
  if (!contact) return null

  const audit = await getPortalSeoAudit(contact.company_id, id)
  if (!audit) notFound()

  const result = audit.result
  const checksByCategory = CATEGORIES.map((category) => ({
    category,
    checks: (result?.checks ?? []).filter(
      (check) => check.category === category,
    ),
  })).filter((group) => group.checks.length > 0)

  return (
    <div className="space-y-6">
      <Link
        href="/portal/seo"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        SEO
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="text-muted-foreground size-5" />
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              {audit.label}
            </h1>
          </div>
          <a
            href={audit.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            {audit.url}
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <SeoScoreBadge score={audit.score} />
      </div>

      {!result ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Nenhuma auditoria concluída para este site.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">Verificações</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {audit.checks_total}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">Aprovadas</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {result.summary.passed}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">Avisos</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                {result.summary.warnings}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">Falhas</CardTitle>
              </CardHeader>
              <CardContent className="text-destructive text-2xl font-semibold">
                {result.summary.failed}
              </CardContent>
            </Card>
          </div>

          <p className="text-muted-foreground text-sm">
            Auditoria concluída em {formatDateTime(audit.created_at)}.
          </p>

          <div className="space-y-4">
            {checksByCategory.map((group) => (
              <Card key={group.category}>
                <CardHeader>
                  <CardTitle className="text-base">{group.category}</CardTitle>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {group.checks.map((check) => (
                    <div
                      key={check.id}
                      className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {check.label}
                          </span>
                          <SeoSeverityBadge severity={check.severity} />
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {check.message}
                        </p>
                      </div>
                      <SeoCheckStatusBadge status={check.status} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
