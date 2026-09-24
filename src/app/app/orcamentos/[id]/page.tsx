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
import { EstimateStatusBadge } from "@/components/app/document-status-badge"
import { ESTIMATE_STATUSES } from "@/lib/constants"
import { formatDate, formatMoney } from "@/lib/format"
import { getMemberships } from "@/lib/auth"
import { getActiveTenant } from "@/lib/tenant"
import { createClient } from "@/lib/supabase/server"
import { getTenantFinanceSettings } from "@/server/documents"
import { getCompany, listCompanies } from "@/server/queries/companies"
import { listProjects } from "@/server/queries/projects"
import { getEstimate, listDocumentItems } from "@/server/queries/documents"
import {
  convertEstimateToInvoiceAction,
  updateEstimateStatusAction,
} from "@/server/actions/estimates"
import { EstimateFormDialog } from "../estimate-form-dialog"
import { DeleteEstimateButton } from "../delete-estimate-button"

const fieldClass =
  "border-input bg-background dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-3"

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberships = await getMemberships()
  const active = await getActiveTenant(memberships)
  if (!active) return null

  const estimate = await getEstimate(active.tenantId, id)
  if (!estimate) notFound()

  const supabase = await createClient()
  const [items, company, companies, projects, settings] = await Promise.all([
    listDocumentItems(active.tenantId, "estimate", estimate.id),
    estimate.company_id
      ? getCompany(active.tenantId, estimate.company_id)
      : Promise.resolve(null),
    listCompanies(active.tenantId),
    listProjects(active.tenantId),
    getTenantFinanceSettings(supabase, active.tenantId),
  ])

  const companyOptions = companies.map((c) => ({ id: c.id, name: c.name }))
  const projectOptions = projects.map((p) => ({ id: p.id, name: p.name }))
  const currency = estimate.currency

  return (
    <div className="space-y-6">
      <Link
        href="/app/orcamentos"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Orçamentos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {estimate.formatted_number}
          </h1>
          <EstimateStatusBadge status={estimate.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EstimateFormDialog
            estimate={estimate}
            items={items}
            companies={companyOptions}
            projects={projectOptions}
            defaultCurrency={settings.currency}
            label="Editar"
          />
          {estimate.invoice_id ? (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/app/faturas/${estimate.invoice_id}`} />}
              nativeButton={false}
            >
              Ver fatura
            </Button>
          ) : (
            <form action={convertEstimateToInvoiceAction}>
              <input type="hidden" name="id" value={estimate.id} />
              <Button type="submit" size="sm">
                Converter em fatura
              </Button>
            </form>
          )}
          <DeleteEstimateButton id={estimate.id} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
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
                <span>{formatMoney(estimate.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impostos</span>
                <span>{formatMoney(estimate.total_tax, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto</span>
                <span>- {formatMoney(estimate.discount_total, currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Total</span>
                <span>{formatMoney(estimate.total, currency)}</span>
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
                <div>{formatDate(estimate.date)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Validade</div>
                <div>{formatDate(estimate.expiry_date)}</div>
              </div>
              {estimate.reference_no ? (
                <div>
                  <div className="text-muted-foreground text-xs">
                    Referência
                  </div>
                  <div>{estimate.reference_no}</div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <form
            action={updateEstimateStatusAction}
            className="flex items-end gap-2"
          >
            <input type="hidden" name="id" value={estimate.id} />
            <select
              name="status"
              defaultValue={String(estimate.status)}
              className={fieldClass}
            >
              {Object.entries(ESTIMATE_STATUSES).map(([value, config]) => (
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

      {estimate.client_note || estimate.terms ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {estimate.client_note ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm whitespace-pre-wrap">
                {estimate.client_note}
              </CardContent>
            </Card>
          ) : null}
          {estimate.terms ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Termos</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm whitespace-pre-wrap">
                {estimate.terms}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
