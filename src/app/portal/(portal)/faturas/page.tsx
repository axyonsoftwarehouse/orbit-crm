import Link from "next/link"
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
import { getPortalContact, listPortalInvoices } from "@/server/queries/portal"

export default async function PortalInvoicesPage() {
  const contact = await getPortalContact()
  if (!contact) return null

  const invoices = await listPortalInvoices(contact.company_id)

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">
        Faturas
      </h1>

      <div className="bg-card overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center text-sm"
                >
                  Nenhuma fatura ainda.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/portal/faturas/${invoice.id}`}
                      className="hover:underline"
                    >
                      {invoice.formatted_number}
                    </Link>
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
                    {formatMoney(Number(invoice.total))}
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
