import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/app/ticket-bits"
import { formatDate } from "@/lib/format"
import { getPortalContact, listPortalTickets } from "@/server/queries/portal"
import { PortalTicketDialog } from "./portal-ticket-dialog"

export default async function PortalTicketsPage() {
  const contact = await getPortalContact()
  if (!contact) return null

  const tickets = await listPortalTickets(contact.company_id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            Tickets
          </h1>
          <p className="text-muted-foreground text-sm">
            Abra e acompanhe seus chamados de suporte.
          </p>
        </div>
        <PortalTicketDialog />
      </div>

      <div className="bg-card overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atualizado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground text-center text-sm"
                >
                  Nenhum ticket ainda.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/portal/tickets/${ticket.id}`}
                      className="hover:underline"
                    >
                      {ticket.formatted_number}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    <TicketPriorityBadge priority={ticket.priority} />
                  </TableCell>
                  <TableCell>
                    <TicketStatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(ticket.updated_at)}
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
