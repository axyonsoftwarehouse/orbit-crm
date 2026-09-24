import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceStatusBadge } from "@/components/app/document-status-badge"
import { formatDate, formatMoney } from "@/lib/format"
import { getPortalContact } from "@/server/queries/portal"
import {
  getInvoice,
  listDocumentItems,
  listPayments,
  sumPayments,
} from "@/server/queries/documents"

export default async function PortalInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getPortalContact()
  if (!contact) return null

  const invoice = await getInvoice(contact.tenant_id, id)
  if (!invoice) notFound()

  const [items, payments, paid] = await Promise.all([
    listDocumentItems(contact.tenant_id, "invoice", id),
    listPayments(contact.tenant_id, id),
    sumPayments(contact.tenant_id, id),
  ])

  const currency = invoice.currency
  const amountDue = Number(invoice.total) - paid

  return (
    <div className="space-y-6">
      <Link
        href="/portal/faturas"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Faturas
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {invoice.formatted_number}
        </h1>
        <InvoiceStatusBadge
          status={invoice.status}
          dueDate={invoice.due_date}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Itens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0 last:pb-0"
              >
                <span>
                  {item.description}{" "}
                  <span className="text-muted-foreground">
                    × {Number(item.qty)}
                  </span>
                </span>
                <span>
                  {formatMoney(Number(item.qty) * Number(item.rate), currency)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatMoney(Number(invoice.subtotal), currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Impostos</span>
              <span>{formatMoney(Number(invoice.total_tax), currency)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-medium">
              <span>Total</span>
              <span>{formatMoney(Number(invoice.total), currency)}</span>
            </div>
            <div className="flex justify-between text-[#12a06b] dark:text-[#3dd598]">
              <span>Pago</span>
              <span>{formatMoney(paid, currency)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Em aberto</span>
              <span>{formatMoney(amountDue, currency)}</span>
            </div>
            <div className="text-muted-foreground flex justify-between pt-2 text-xs">
              <span>Vencimento</span>
              <span>{formatDate(invoice.due_date)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {payments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-muted-foreground">
                  {formatDate(payment.payment_date)}
                </span>
                <span className="flex-1">{payment.payment_mode ?? "—"}</span>
                <span>{formatMoney(Number(payment.amount), currency)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
