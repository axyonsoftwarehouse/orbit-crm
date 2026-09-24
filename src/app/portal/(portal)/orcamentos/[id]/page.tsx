import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EstimateStatusBadge } from "@/components/app/document-status-badge"
import { formatDate, formatMoney } from "@/lib/format"
import { getPortalContact } from "@/server/queries/portal"
import { getEstimate, listDocumentItems } from "@/server/queries/documents"
import { respondEstimateAction } from "@/server/actions/portal"

export default async function PortalEstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getPortalContact()
  if (!contact) return null

  const estimate = await getEstimate(contact.tenant_id, id)
  if (!estimate) notFound()

  const items = await listDocumentItems(contact.tenant_id, "estimate", id)
  const currency = estimate.currency
  const canRespond = estimate.status === 1 || estimate.status === 2

  return (
    <div className="space-y-6">
      <Link
        href="/portal/orcamentos"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        Orçamentos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {estimate.formatted_number}
        </h1>
        <EstimateStatusBadge status={estimate.status} />
      </div>

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
          <div className="flex justify-between border-t pt-2 font-medium">
            <span>Total</span>
            <span>{formatMoney(Number(estimate.total), currency)}</span>
          </div>
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>Validade</span>
            <span>{formatDate(estimate.expiry_date)}</span>
          </div>
        </CardContent>
      </Card>

      {canRespond ? (
        <div className="flex gap-2">
          <form action={respondEstimateAction}>
            <input type="hidden" name="id" value={estimate.id} />
            <input type="hidden" name="accept" value="1" />
            <Button type="submit">Aceitar orçamento</Button>
          </form>
          <form action={respondEstimateAction}>
            <input type="hidden" name="id" value={estimate.id} />
            <input type="hidden" name="accept" value="0" />
            <Button type="submit" variant="outline">
              Recusar
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
