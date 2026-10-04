import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ContractStatusBadge } from "@/components/app/contract-bits"
import { formatDate, formatMoney } from "@/lib/format"
import { getPortalContact, listPortalContracts } from "@/server/queries/portal"

export default async function PortalContractsPage() {
  const contact = await getPortalContact()
  if (!contact) return null

  const contracts = await listPortalContracts(contact.company_id)

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-semibold tracking-tight">
        Contratos
      </h1>

      <div className="bg-card overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Término</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center text-sm"
                >
                  Nenhum contrato ainda.
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.title}
                    {contract.description ? (
                      <div className="text-muted-foreground text-xs font-normal">
                        {contract.description}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(contract.start_date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(contract.end_date)}
                  </TableCell>
                  <TableCell>
                    <ContractStatusBadge
                      status={contract.status}
                      endDate={contract.end_date}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(contract.value)}
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
