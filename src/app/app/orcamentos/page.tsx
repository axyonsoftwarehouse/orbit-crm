import Link from "next/link"
import { FileText } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EstimateStatusBadge } from "@/components/app/document-status-badge"
import { formatDate, formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { getTenantFinanceSettings } from "@/server/documents"
import { listCompanies } from "@/server/queries/companies"
import { listProjects } from "@/server/queries/projects"
import { listEstimates } from "@/server/queries/documents"
import { EstimateFormDialog } from "./estimate-form-dialog"

export default async function OrcamentosPage() {
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const supabase = await createClient()
  const [estimates, companies, projects, settings] = await Promise.all([
    listEstimates(active.tenantId),
    listCompanies(active.tenantId),
    listProjects(active.tenantId),
    getTenantFinanceSettings(supabase, active.tenantId),
  ])

  const companyOptions = companies.map((c) => ({ id: c.id, name: c.name }))
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Orçamentos</h1>
          <p className="text-muted-foreground text-sm">
            Propostas comerciais e conversão em fatura.
          </p>
        </div>
        <EstimateFormDialog
          companies={companyOptions}
          projects={projectOptions}
          defaultCurrency={settings.currency}
          label="Novo orçamento"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm">
                    <FileText className="size-5" />
                    Nenhum orçamento cadastrado ainda.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              estimates.map((estimate) => (
                <TableRow key={estimate.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/app/orcamentos/${estimate.id}`}
                      className="hover:underline"
                    >
                      {estimate.formatted_number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {estimate.company?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(estimate.date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(estimate.expiry_date)}
                  </TableCell>
                  <TableCell>
                    <EstimateStatusBadge status={estimate.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(estimate.total)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
