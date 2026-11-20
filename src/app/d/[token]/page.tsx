import type { Metadata } from "next"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  EstimateStatusBadge,
  InvoiceStatusBadge,
} from "@/components/app/document-status-badge"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatDate, formatMoney, todayIso } from "@/lib/format"
import { resolveDocumentLink } from "@/server/document-sharing/links"
import { loadDocument } from "@/server/document-sharing/load"
import { getClientIp, isRateLimited } from "@/server/rate-limit"
import { RespondButtons } from "./respond-buttons"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Documento",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

function Invalid({
  title = "Link inválido ou expirado",
  detail = "Peça um novo envio do documento a quem enviou.",
}: {
  title?: string
  detail?: string
}) {
  return (
    <div className="bg-muted/30 flex min-h-svh items-center justify-center p-6">
      <div className="bg-card max-w-md space-y-2 rounded-2xl border p-6 text-center shadow-sm">
        <h1 className="font-heading text-lg font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{detail}</p>
      </div>
    </div>
  )
}

export default async function PublicDocumentPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const ip = await getClientIp()
  if (await isRateLimited(`doc:view:${ip}`, 60, 600)) {
    return (
      <Invalid
        title="Muitas requisições"
        detail="Aguarde alguns minutos e abra o link de novo."
      />
    )
  }

  const { token } = await params
  const admin = createAdminClient()
  const link = await resolveDocumentLink(admin, token)
  if (!link) return <Invalid />

  const view = await loadDocument(
    admin,
    link.tenant_id,
    link.rel_type,
    link.rel_id,
  )
  if (!view) return <Invalid />

  await admin
    .from("document_links")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("id", link.id)

  const isEstimate = view.kind === "estimate"
  const money = (value: number) => formatMoney(value, view.currency)
  const expired = Boolean(
    isEstimate && view.dueOrExpiry && view.dueOrExpiry < todayIso(),
  )
  const canRespond = isEstimate && view.status === 2 && !expired
  const color = view.tenant.primaryColor ?? "#0062FF"

  return (
    <div className="bg-muted/30 min-h-svh px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {view.tenant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={view.tenant.logoUrl}
                alt={view.tenant.name}
                className="h-10 w-auto max-w-40 object-contain"
              />
            ) : null}
            <span className="font-heading text-lg font-semibold">
              {view.tenant.name}
            </span>
          </div>
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={`/d/${token}/pdf`} />}
          >
            <FileDown className="size-4" />
            Baixar PDF
          </Button>
        </header>

        <main className="bg-card space-y-6 rounded-2xl border p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p
                className="text-xs font-semibold tracking-wide uppercase"
                style={{ color }}
              >
                {isEstimate ? "Orçamento" : "Fatura"}
              </p>
              <h1 className="font-heading text-2xl font-semibold">
                {view.number}
              </h1>
              {isEstimate ? (
                <EstimateStatusBadge status={view.status} />
              ) : (
                <InvoiceStatusBadge
                  status={view.status}
                  dueDate={view.dueOrExpiry}
                />
              )}
            </div>
            <dl className="text-muted-foreground space-y-1 text-right text-sm">
              <div>
                <dt className="inline">Data: </dt>
                <dd className="inline">{formatDate(view.date)}</dd>
              </div>
              {view.dueOrExpiry ? (
                <div>
                  <dt className="inline">
                    {isEstimate ? "Validade: " : "Vencimento: "}
                  </dt>
                  <dd className="inline">{formatDate(view.dueOrExpiry)}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {view.company ? (
            <div className="text-sm">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Para
              </p>
              <p className="font-medium">{view.company.name}</p>
              {view.company.vat ? (
                <p className="text-muted-foreground">{view.company.vat}</p>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-left text-xs">
                <tr>
                  <th className="py-2 font-medium">Descrição</th>
                  <th className="py-2 text-right font-medium">Qtd</th>
                  <th className="py-2 text-right font-medium">Valor</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {view.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 whitespace-pre-wrap">
                      {item.description}
                    </td>
                    <td className="py-2 text-right">{Number(item.qty)}</td>
                    <td className="py-2 text-right">
                      {money(Number(item.rate))}
                    </td>
                    <td className="py-2 text-right">
                      {money(Number(item.qty) * Number(item.rate))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{money(view.subtotal)}</dd>
            </div>
            {view.discountTotal > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Desconto</dt>
                <dd>- {money(view.discountTotal)}</dd>
              </div>
            ) : null}
            {view.totalTax > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Impostos</dt>
                <dd>{money(view.totalTax)}</dd>
              </div>
            ) : null}
            {view.adjustment !== 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ajuste</dt>
                <dd>{money(view.adjustment)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t pt-1 text-base font-semibold">
              <dt>Total</dt>
              <dd>{money(view.total)}</dd>
            </div>
            {!isEstimate ? (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pago</dt>
                  <dd>{money(view.paid)}</dd>
                </div>
                <div className="flex justify-between font-medium">
                  <dt>Em aberto</dt>
                  <dd>{money(Math.max(0, view.total - view.paid))}</dd>
                </div>
              </>
            ) : null}
          </dl>

          {view.clientNote ? (
            <section className="space-y-1 text-sm">
              <h2 className="text-muted-foreground text-xs font-semibold uppercase">
                Observações
              </h2>
              <p className="whitespace-pre-wrap">{view.clientNote}</p>
            </section>
          ) : null}
          {view.terms ? (
            <section className="space-y-1 text-sm">
              <h2 className="text-muted-foreground text-xs font-semibold uppercase">
                Termos
              </h2>
              <p className="whitespace-pre-wrap">{view.terms}</p>
            </section>
          ) : null}

          {canRespond ? <RespondButtons token={token} /> : null}
          {isEstimate && view.status === 4 ? (
            <p className="rounded-xl border border-green-600/30 bg-green-600/10 p-3 text-sm">
              Orçamento aceito. Obrigado!
            </p>
          ) : null}
          {isEstimate && view.status === 3 ? (
            <p className="bg-muted rounded-xl border p-3 text-sm">
              Orçamento recusado.
            </p>
          ) : null}
          {isEstimate && view.status === 2 && expired ? (
            <p className="bg-muted rounded-xl border p-3 text-sm">
              Este orçamento venceu. Peça uma nova proposta a {view.tenant.name}
              .
            </p>
          ) : null}
        </main>
      </div>
    </div>
  )
}
