import Link from "next/link"
import { Receipt } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/app/document-status-badge"
import { formatDate, formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { getTenantFinanceSettings } from "@/server/documents"
import { listCompanies } from "@/server/queries/companies"
import { listProjects } from "@/server/queries/projects"
import { listInvoices } from "@/server/queries/documents"
import { InvoiceFormDialog } from "./invoice-form-dialog"

export default async function FaturasPage() {
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const supabase = await createClient()
  const [invoices, companies, projects, settings] = await Promise.all([
    listInvoices(active.tenantId),
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
          <h1 className="text-xl font-semibold tracking-tight">Faturas</h1>
          <p className="text-muted-foreground text-sm">
            Cobranças, vencimentos e pagamentos.
          </p>
        </div>
        <InvoiceFormDialog
          companies={companyOptions}
          projects={projectOptions}
          defaultCurrency={settings.currency}
          label="Nova fatura"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="text-muted-foreground flex flex-col items-center gap-1 text-sm">
                    <Receipt className="size-5" />
                    Nenhuma fatura cadastrada ainda.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/app/faturas/${invoice.id}`}
                      className="hover:underline"
                    >
                      {invoice.formatted_number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.company?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(invoice.date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(invoice.due_date)}
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge
                      status={invoice.status}
                      dueDate={invoice.due_date}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(invoice.total)}
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
