import type { Metadata } from "next"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatDate, formatDateTime, formatMoney } from "@/lib/format"
import { resolveDocumentLink } from "@/server/document-sharing/links"
import { loadContractView } from "@/server/document-sharing/contract-view"
import { getClientIp, isRateLimited } from "@/server/rate-limit"
import { signContractAction } from "@/server/actions/contract-signature"
import { SignForm } from "./sign-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Contrato",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

function Invalid({
  title = "Link inválido ou expirado",
  detail = "Peça um novo envio do contrato a quem enviou.",
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

export default async function PublicContractPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const ip = await getClientIp()
  if (await isRateLimited(`contract:view:${ip}`, 60, 600)) {
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
  if (!link || link.rel_type !== "contract") return <Invalid />

  const view = await loadContractView(admin, link.tenant_id, link.rel_id)
  if (!view) return <Invalid />

  const { data: linkRow } = await admin
    .from("document_links")
    .select("last_viewed_at")
    .eq("id", link.id)
    .maybeSingle()
  const previousView = (linkRow as { last_viewed_at: string | null } | null)
    ?.last_viewed_at

  await admin
    .from("document_links")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("id", link.id)
  if (!previousView) {
    await admin.from("contract_events").insert({
      tenant_id: link.tenant_id,
      contract_id: view.id,
      kind: "viewed",
      actor_kind: "client",
      ip,
    })
  }

  const color = view.tenant.primaryColor ?? "#0062FF"
  const signerName = [view.acceptance?.firstname, view.acceptance?.lastname]
    .filter(Boolean)
    .join(" ")

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
            render={<a href={`/c/${token}/pdf`} />}
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
                Contrato
              </p>
              <h1 className="font-heading text-2xl font-semibold">
                {view.title}
              </h1>
            </div>
            <dl className="text-muted-foreground space-y-1 text-right text-sm">
              {view.startDate ? (
                <div>
                  <dt className="inline">Início: </dt>
                  <dd className="inline">{formatDate(view.startDate)}</dd>
                </div>
              ) : null}
              {view.endDate ? (
                <div>
                  <dt className="inline">Término: </dt>
                  <dd className="inline">{formatDate(view.endDate)}</dd>
                </div>
              ) : null}
              {view.value !== null ? (
                <div>
                  <dt className="inline">Valor: </dt>
                  <dd className="inline font-medium">
                    {formatMoney(view.value)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {view.company ? (
            <div className="text-sm">
              <p className="text-muted-foreground text-xs font-semibold uppercase">
                Contratante
              </p>
              <p className="font-medium">{view.company.name}</p>
              {view.company.vat ? (
                <p className="text-muted-foreground">{view.company.vat}</p>
              ) : null}
            </div>
          ) : null}

          <article className="text-sm leading-relaxed whitespace-pre-wrap">
            {view.body}
          </article>

          {view.signedAt ? (
            <section className="space-y-3 rounded-xl border border-green-600/30 bg-green-600/10 p-4">
              <div>
                <p className="text-sm font-semibold">
                  Contrato assinado em {formatDate(view.signedAt)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatDateTime(view.signedAt)}
                </p>
              </div>
              {view.signatureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={view.signatureUrl}
                  alt={`Assinatura de ${signerName || "cliente"}`}
                  className="max-h-24 w-auto"
                />
              ) : null}
              <dl className="text-muted-foreground grid gap-1 text-xs sm:grid-cols-2">
                {signerName ? (
                  <div>
                    <dt className="text-foreground inline font-medium">
                      Signatário:{" "}
                    </dt>
                    <dd className="inline">{signerName}</dd>
                  </div>
                ) : null}
                {view.acceptance?.email ? (
                  <div>
                    <dt className="text-foreground inline font-medium">
                      E-mail:{" "}
                    </dt>
                    <dd className="inline">{view.acceptance.email}</dd>
                  </div>
                ) : null}
                {view.acceptance?.ip ? (
                  <div>
                    <dt className="text-foreground inline font-medium">IP: </dt>
                    <dd className="inline">{view.acceptance.ip}</dd>
                  </div>
                ) : null}
                {view.acceptance?.hash ? (
                  <div>
                    <dt className="text-foreground inline font-medium">
                      Integridade:{" "}
                    </dt>
                    <dd className="inline font-mono">
                      {view.acceptance.hash.slice(0, 16)}…
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : (
            <section className="space-y-3 rounded-xl border p-4">
              <h2 className="font-heading text-sm font-semibold">
                Assinar contrato
              </h2>
              <SignForm
                token={token}
                legalText={view.tenant.legalText}
                action={signContractAction}
              />
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
