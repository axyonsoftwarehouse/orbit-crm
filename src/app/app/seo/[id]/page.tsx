import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink, Globe, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  SeoAuditStatusBadge,
  SeoCheckStatusBadge,
  SeoScoreBadge,
  SeoSeverityBadge,
} from "@/components/app/seo-bits"
import { formatDate } from "@/lib/format"
import { SEO_CHECK_INTERVAL_LABELS } from "@/lib/constants"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { updateSeoMonitoringAction } from "@/server/actions/seo"
import { isManager } from "@/server/permissions"
import {
  getLatestSeoAudit,
  getSeoSite,
  listSeoAuditHistory,
} from "@/server/queries/seo"
import { DeleteSeoSiteButton } from "../delete-seo-site-button"
import { RunAuditButton } from "../run-audit-button"

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

export default async function SeoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const site = await getSeoSite(active.tenantId, id)
  if (!site) notFound()

  const [audit, history] = await Promise.all([
    getLatestSeoAudit(active.tenantId, site.id),
    listSeoAuditHistory(active.tenantId, site.id),
  ])

  const result = audit?.result ?? null
  const checksByCategory = CATEGORIES.map((category) => ({
    category,
    checks: (result?.checks ?? []).filter(
      (check) => check.category === category,
    ),
  })).filter((group) => group.checks.length > 0)

  return (
    <div className="space-y-6">
      <Link
        href="/app/seo"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        SEO
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe className="text-muted-foreground size-5" />
            <h1 className="text-xl font-semibold tracking-tight">
              {site.label}
            </h1>
          </div>
          <a
            href={site.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            {site.url}
            <ExternalLink className="size-3.5" />
          </a>
          <p className="text-muted-foreground text-sm">
            {site.company?.name ?? "Sem cliente vinculado"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RunAuditButton siteId={site.id} />
          {isManager(active.role) ? <DeleteSeoSiteButton id={site.id} /> : null}
        </div>
      </div>

      {!audit ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <ShieldCheck className="text-muted-foreground size-6" />
            <p className="text-sm font-medium">Nenhuma auditoria ainda</p>
            <p className="text-muted-foreground text-sm">
              Execute a primeira auditoria para ver o score e os problemas
              encontrados.
            </p>
            <RunAuditButton siteId={site.id} label="Executar auditoria" />
          </CardContent>
        </Card>
      ) : audit.status === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle>Falha na auditoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-destructive text-sm">
              {audit.error ?? "Não foi possível executar a auditoria."}
            </p>
            <p className="text-muted-foreground text-xs">
              Executada em {formatDateTime(audit.created_at)}.
            </p>
          </CardContent>
        </Card>
      ) : audit.status === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Auditoria em andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              A página está sendo analisada. Recarregue em instantes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">Score</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <SeoScoreBadge score={audit.score} />
                <span className="text-muted-foreground text-xs">
                  de 100 pontos
                </span>
              </CardContent>
            </Card>
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
                {result?.summary.passed ?? 0}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-sm">Problemas</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
                {result?.summary.issuesTotal ?? audit.issues_total}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <SeoAuditStatusBadge status={audit.status} />
            <span className="text-muted-foreground">
              Executada em {formatDateTime(audit.created_at)}
            </span>
            {result ? (
              <span className="text-muted-foreground">
                · {result.summary.warnings} aviso(s), {result.summary.failed}{" "}
                falha(s)
              </span>
            ) : null}
          </div>

          {checksByCategory.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-8 text-center text-sm">
                Não há detalhes salvos para esta auditoria.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {checksByCategory.map((group) => (
                <Card key={group.category}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {group.category}
                    </CardTitle>
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
                          {check.details ? (
                            <p className="text-muted-foreground text-xs">
                              {check.details}
                            </p>
                          ) : null}
                        </div>
                        <SeoCheckStatusBadge status={check.status} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Monitoramento automático</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={updateSeoMonitoringAction}
            className="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="id" value={site.id} />
            <div className="space-y-1">
              <label
                htmlFor="seo-monitoring"
                className="text-muted-foreground text-xs"
              >
                Frequência
              </label>
              <select
                id="seo-monitoring"
                name="check_interval_days"
                defaultValue={String(site.check_interval_days)}
                className="border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"
              >
                {Object.entries(SEO_CHECK_INTERVAL_LABELS).map(
                  ([value, optionLabel]) => (
                    <option key={value} value={value}>
                      {optionLabel}
                    </option>
                  ),
                )}
              </select>
            </div>
            <Button type="submit" variant="outline" size="sm">
              Salvar
            </Button>
            <span className="text-muted-foreground text-xs">
              {site.next_audit_at
                ? `Próxima execução: ${formatDateTime(site.next_audit_at)}`
                : "Sem próxima execução agendada."}
            </span>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Verificações</TableHead>
                <TableHead>Problemas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground h-20 text-center text-sm"
                  >
                    Nenhuma auditoria registrada.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(item.created_at)}
                    </TableCell>
                    <TableCell>
                      <SeoAuditStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <SeoScoreBadge score={item.score} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.checks_total}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.issues_total}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Última verificação: {formatDate(audit?.created_at ?? null)}.
      </p>
    </div>
  )
}
