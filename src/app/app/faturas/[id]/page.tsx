import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { InvoiceStatusBadge } from "@/components/app/document-status-badge"
import { INVOICE_STATUSES } from "@/lib/constants"
import { formatDate, formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { getTenantFinanceSettings } from "@/server/documents"
import { getCompany, listCompanies } from "@/server/queries/companies"
import { listProjects } from "@/server/queries/projects"
import {
  getInvoice,
  listDocumentItems,
  listPayments,
  sumPayments,
} from "@/server/queries/documents"
import { updateInvoiceStatusAction } from "@/server/actions/invoices"
import { InvoiceFormDialog } from "../invoice-form-dialog"
import { DeleteInvoiceButton } from "../delete-invoice-button"
import { DeletePaymentButton } from "../delete-payment-button"
import { RecordPaymentDialog } from "../record-payment-dialog"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const invoice = await getInvoice(active.tenantId, id)
  if (!invoice) notFound()

  const supabase = await createClient()
  const [items, payments, paid, company, companies, projects, settings] =
    await Promise.all([
      listDocumentItems(active.tenantId, "invoice", invoice.id),
      listPayments(active.tenantId, invoice.id),
      sumPayments(active.tenantId, invoice.id),
      invoice.company_id
        ? getCompany(active.tenantId, invoice.company_id)
        : Promise.resolve(null),
      listCompanies(active.tenantId),
      listProjects(active.tenantId),
      getTenantFinanceSettings(supabase, active.tenantId),
    ])

  const companyOptions = companies.map((c) => ({ id: c.id, name: c.name }))
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }))
  const currency = invoice.currency
  const amountDue = Number(invoice.total) - paid

  return (
    <div className="space-y-6">
      <Link
        href="/app/faturas"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Faturas
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {invoice.formatted_number}
          </h1>
          <InvoiceStatusBadge
            status={invoice.status}
            dueDate={invoice.due_date}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RecordPaymentDialog
            invoiceId={invoice.id}
            amountDue={amountDue > 0 ? amountDue : 0}
          />
          <InvoiceFormDialog
            invoice={invoice}
            items={items}
            companies={companyOptions}
            projects={projectOptions}
            defaultCurrency={settings.currency}
            label="Editar"
          />
          <DeleteInvoiceButton id={invoice.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Itens</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Imposto</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const amount = Number(item.qty) * Number(item.rate)
                  const tax = item.tax_rate
                    ? (amount / 100) * Number(item.tax_rate)
                    : 0
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">
                        {Number(item.qty)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(Number(item.rate), currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.tax_rate ? `${Number(item.tax_rate)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(amount + tax, currency)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(invoice.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impostos</span>
                <span>{formatMoney(invoice.total_tax, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto</span>
                <span>- {formatMoney(invoice.discount_total, currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Total</span>
                <span>{formatMoney(invoice.total, currency)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Pago</span>
                <span>{formatMoney(paid, currency)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Em aberto</span>
                <span>{formatMoney(amountDue, currency)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Cliente</div>
                <div>{company?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Data</div>
                <div>{formatDate(invoice.date)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Vencimento</div>
                <div>{formatDate(invoice.due_date)}</div>
              </div>
            </CardContent>
          </Card>

          <form
            action={updateInvoiceStatusAction}
            className="flex items-end gap-2"
          >
            <input type="hidden" name="id" value={invoice.id} />
            <select
              name="status"
              defaultValue={String(invoice.status)}
              className={fieldClass}
            >
              {Object.entries(INVOICE_STATUSES).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="sm">
              Atualizar
            </Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Pagamentos</CardTitle>
          <RecordPaymentDialog
            invoiceId={invoice.id}
            amountDue={amountDue > 0 ? amountDue : 0}
            label="Novo pagamento"
          />
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead>Transação</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground h-20 text-center text-sm"
                  >
                    Nenhum pagamento registrado.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.payment_date)}
                    </TableCell>
                    <TableCell>{payment.payment_mode ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.transaction_id ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.note ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(Number(payment.amount), currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeletePaymentButton
                        id={payment.id}
                        invoiceId={invoice.id}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {invoice.client_note || invoice.terms ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {invoice.client_note ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm whitespace-pre-wrap">
                {invoice.client_note}
              </CardContent>
            </Card>
          ) : null}
          {invoice.terms ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Termos</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm whitespace-pre-wrap">
                {invoice.terms}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
