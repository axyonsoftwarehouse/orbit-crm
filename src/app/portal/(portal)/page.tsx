import Link from "next/link"
import { FileText, FolderKanban, Receipt } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/app/stat-card"
import { ProgressBar, ProjectStatusBadge } from "@/components/app/project-bits"
import {
  EstimateStatusBadge,
  InvoiceStatusBadge,
} from "@/components/app/document-status-badge"
import { formatDate, formatMoney } from "@/lib/format"
import {
  getPortalContact,
  listPortalEstimates,
  listPortalInvoices,
  listPortalProjects,
} from "@/server/queries/portal"

export default async function PortalHomePage() {
  const contact = await getPortalContact()
  if (!contact) return null

  const [projects, estimates, invoices] = await Promise.all([
    listPortalProjects(contact.company_id),
    listPortalEstimates(contact.company_id),
    listPortalInvoices(contact.company_id),
  ])

  const activeProjects = projects.filter(
    (p) => p.status === 2 || p.status === 1,
  )
  const pendingEstimates = estimates.filter(
    (e) => e.status === 1 || e.status === 2,
  )
  let openAmount = 0
  for (const invoice of invoices) {
    if (invoice.status === 1 || invoice.status === 3) {
      openAmount += Number(invoice.total)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Olá, {contact.first_name}!
        </h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe {contact.company_name}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Projetos ativos"
          value={String(activeProjects.length)}
          icon={FolderKanban}
          tone="primary"
        />
        <StatCard
          label="Orçamentos pendentes"
          value={String(pendingEstimates.length)}
          icon={FileText}
          tone="yellow"
        />
        <StatCard
          label="Em aberto"
          value={formatMoney(openAmount)}
          icon={Receipt}
          tone="green"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Projetos</CardTitle>
            <Link
              href="/portal/projetos"
              className="text-primary text-xs hover:underline"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-4"
              >
                <Link
                  href={`/portal/projetos/${project.id}`}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {project.name}
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  <ProjectStatusBadge status={project.status} />
                  <ProgressBar value={project.progress} />
                </div>
              </div>
            ))}
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhum projeto ainda.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Faturas</CardTitle>
            <Link
              href="/portal/faturas"
              className="text-primary text-xs hover:underline"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <Link
                  href={`/portal/faturas/${invoice.id}`}
                  className="font-medium hover:underline"
                >
                  {invoice.formatted_number}
                </Link>
                <span className="text-muted-foreground text-xs">
                  {formatDate(invoice.due_date)}
                </span>
                <InvoiceStatusBadge
                  status={invoice.status}
                  dueDate={invoice.due_date}
                />
                <span className="w-24 text-right">
                  {formatMoney(Number(invoice.total))}
                </span>
              </div>
            ))}
            {invoices.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Nenhuma fatura ainda.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {estimates.length > 0 ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Orçamentos</CardTitle>
            <Link
              href="/portal/orcamentos"
              className="text-primary text-xs hover:underline"
            >
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {estimates.slice(0, 5).map((estimate) => (
              <div
                key={estimate.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <Link
                  href={`/portal/orcamentos/${estimate.id}`}
                  className="font-medium hover:underline"
                >
                  {estimate.formatted_number}
                </Link>
                <span className="text-muted-foreground text-xs">
                  {formatDate(estimate.date)}
                </span>
                <EstimateStatusBadge status={estimate.status} />
                <span className="w-24 text-right">
                  {formatMoney(Number(estimate.total))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
