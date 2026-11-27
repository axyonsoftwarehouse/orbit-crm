import Link from "next/link"
import { Repeat } from "lucide-react"
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
import { InvoiceStatusBadge } from "@/components/app/document-status-badge"
import { formatDate, formatMoney } from "@/lib/format"
import {
  RECURRENCE_INTERVALS,
  nextOccurrenceDate,
  type RecurrenceInterval,
} from "@/lib/recurrence"
import { stopInvoiceRecurrenceAction } from "@/server/actions/invoices"
import type { Invoice, RecurrenceChild } from "@/server/queries/documents"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div>{value}</div>
    </div>
  )
}

/** Resumo da recorrência de um modelo (com "Parar recorrência"). */
export function RecurrenceCard({
  invoice,
  lastSequence,
}: {
  invoice: Invoice
  lastSequence: number
}) {
  const interval = invoice.recurrence_interval_months as RecurrenceInterval
  const next = nextOccurrenceDate(
    {
      date: invoice.date,
      due_date: invoice.due_date,
      recurrence_interval_months: interval,
      recurrence_end_date: invoice.recurrence_end_date,
    },
    lastSequence,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Repeat className="size-4" />
          Recorrência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Row
          label="Repetir"
          value={RECURRENCE_INTERVALS[interval]?.label ?? "—"}
        />
        <Row
          label="Próxima fatura"
          value={next ? formatDate(next) : "Encerrada"}
        />
        <Row
          label="Até"
          value={
            invoice.recurrence_end_date
              ? formatDate(invoice.recurrence_end_date)
              : "Sem data final"
          }
        />
        <Row
          label="Envio"
          value={
            invoice.recurrence_auto_send
              ? "Automático, ao contato principal"
              : "Manual (gera em rascunho)"
          }
        />
        <form action={stopInvoiceRecurrenceAction}>
          <input type="hidden" name="id" value={invoice.id} />
          <Button type="submit" variant="outline" size="sm">
            Parar recorrência
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

/** Aviso numa fatura gerada, com link para o modelo. */
export function GeneratedFromNotice({
  parent,
  sequence,
}: {
  parent: { id: string; formatted_number: string } | null
  sequence: number | null
}) {
  return (
    <p className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
      <Repeat className="size-4" />
      Gerada automaticamente
      {parent ? (
        <>
          {" "}
          a partir de{" "}
          <Link
            href={`/app/faturas/${parent.id}`}
            className="text-foreground hover:underline"
          >
            {parent.formatted_number}
          </Link>
        </>
      ) : null}
      {sequence ? ` (${sequence}ª)` : null}
    </p>
  )
}

export function RecurrenceChildrenCard({
  rows,
  currency,
}: {
  rows: RecurrenceChild[]
  currency: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Faturas geradas</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground h-20 text-center text-sm"
                >
                  Nenhuma fatura gerada ainda.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/app/faturas/${row.id}`}
                      className="font-medium hover:underline"
                    >
                      {row.formatted_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <InvoiceStatusBadge
                      status={row.status}
                      dueDate={row.due_date}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(row.date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(row.due_date)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(Number(row.total), currency)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
