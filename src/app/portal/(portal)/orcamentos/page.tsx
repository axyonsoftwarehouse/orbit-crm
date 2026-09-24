import Link from "next/link"
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
import { getPortalContact, listPortalEstimates } from "@/server/queries/portal"

export default async function PortalEstimatesPage() {
  const contact = await getPortalContact()
  if (!contact) return null

  const estimates = await listPortalEstimates(contact.company_id)

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">
        Orçamentos
      </h1>

      <div className="bg-card overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estimates.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center text-sm"
                >
                  Nenhum orçamento ainda.
                </TableCell>
              </TableRow>
            ) : (
              estimates.map((estimate) => (
                <TableRow key={estimate.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/portal/orcamentos/${estimate.id}`}
                      className="hover:underline"
                    >
                      {estimate.formatted_number}
                    </Link>
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
                    {formatMoney(Number(estimate.total))}
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
