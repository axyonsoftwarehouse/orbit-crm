import Link from "next/link"
import { ArrowUpRight, Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExportButton } from "@/components/app/export-button"
import { Pagination } from "@/components/app/pagination"
import { SeoAuditStatusBadge, SeoScoreBadge } from "@/components/app/seo-bits"
import { formatDate } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { PAGE_SIZE, parsePage } from "@/lib/pagination"
import { listCompanies } from "@/server/queries/companies"
import { listSeoSitesPage } from "@/server/queries/seo"
import { RunAuditButton } from "./run-audit-button"
import { SeoSiteFormDialog } from "./seo-site-form-dialog"

export default async function SeoPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const [companies, { rows: sites, total }] = await Promise.all([
    listCompanies(active.tenantId),
    listSeoSitesPage(active.tenantId, { page, pageSize: PAGE_SIZE }),
  ])

  const companyOptions = companies.map((company) => ({
    id: company.id,
    name: company.name,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">SEO</h1>
          <p className="text-muted-foreground text-sm">
            {total} site(s) monitorado(s) com auditorias técnicas e de conteúdo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton href="/app/exportar/seo" />
          <SeoSiteFormDialog companies={companyOptions} />
        </div>
      </div>

      {sites.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
          <Search className="text-muted-foreground size-6" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Nenhum site monitorado</p>
            <p className="text-muted-foreground text-sm">
              Adicione a URL de um cliente para executar a primeira auditoria.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card overflow-hidden rounded-2xl border shadow-[0_6px_24px_-14px_rgba(23,23,37,0.18)] dark:shadow-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Última auditoria</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <Link
                        href={`/app/seo/${site.id}`}
                        className="font-medium hover:underline"
                      >
                        {site.label}
                      </Link>
                      <p className="text-muted-foreground max-w-[280px] truncate text-xs">
                        {site.url}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {site.company?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <SeoScoreBadge score={site.latestAudit?.score ?? null} />
                      {site.latestAudit ? (
                        <SeoAuditStatusBadge status={site.latestAudit.status} />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {site.latestAudit
                      ? formatDate(site.latestAudit.created_at)
                      : "Nunca auditado"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <RunAuditButton siteId={site.id} label="Auditar" />
                      <Link
                        href={`/app/seo/${site.id}`}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
                      >
                        Abrir
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination
        page={page}
        total={total}
        hrefFor={(target) =>
          target > 1 ? `/app/seo?page=${target}` : "/app/seo"
        }
      />
    </div>
  )
}
