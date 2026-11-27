import type { SupabaseClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import { formatDate, formatMoney } from "@/lib/format"
import { logger } from "@/lib/logger"
import { sendTenantEmail } from "@/server/email"
import { createDocumentLink } from "@/server/document-sharing/links"
import { loadDocument } from "@/server/document-sharing/load"
import {
  documentFileName,
  renderDocumentPdf,
} from "@/server/document-sharing/pdf"
import type { DocumentKind } from "@/server/queries/documents"

export const DOCUMENT_KIND = {
  estimate: {
    table: "estimates",
    dateColumn: "expiry_date",
    template: "estimate_sent",
    path: "/app/orcamentos",
    /** Rascunho → Enviado */
    statusFrom: 1,
    statusTo: 2,
    /** Só rascunho ou enviado (não respondido nem vencido). */
    sendable: [1, 2],
  },
  invoice: {
    table: "invoices",
    dateColumn: "due_date",
    template: "invoice_sent",
    path: "/app/faturas",
    /** Rascunho → Em aberto */
    statusFrom: 6,
    statusTo: 1,
    /** Qualquer uma, menos cancelada (5). */
    sendable: [1, 2, 3, 6],
  },
} as const

export type DeliverableDocument = {
  id: string
  formatted_number: string
  total: number | string
  currency: string
  expiry_date?: string | null
  due_date?: string | null
}

export type DeliverResult = { error: string } | { sent: number; total: number }

/**
 * Envia o documento por e-mail (link público + PDF anexo) e, se ao menos um
 * e-mail sair, tira o documento do rascunho. Serve à ação "Enviar" e ao cron
 * de faturas recorrentes (com o client admin). Os destinatários já devem ter
 * sido validados por quem chama.
 */
export async function deliverDocumentEmail(
  supabase: SupabaseClient,
  input: {
    tenantId: string
    kind: DocumentKind
    doc: DeliverableDocument
    emails: string[]
    message?: string
    userId: string | null
  },
): Promise<DeliverResult> {
  const config = DOCUMENT_KIND[input.kind]
  const { doc, tenantId } = input

  const view = await loadDocument(supabase, tenantId, input.kind, doc.id)
  if (!view) return { error: "Documento não encontrado." }

  const dateValue =
    (input.kind === "estimate" ? doc.expiry_date : doc.due_date) ?? null

  const pdf = Buffer.from(await renderDocumentPdf(view)).toString("base64")
  const link = await createDocumentLink(supabase, {
    tenantId,
    kind: input.kind,
    docId: doc.id,
    expiryDate: input.kind === "estimate" ? dateValue : null,
    userId: input.userId,
  })
  if ("error" in link) return { error: link.error }
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", tenantId)
    .maybeSingle()

  const siteUrl = env().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  const vars = {
    tenant: (tenant as { name?: string } | null)?.name ?? "",
    number: doc.formatted_number,
    total: formatMoney(Number(doc.total), doc.currency),
    date: formatDate(dateValue),
    link: `${siteUrl}/d/${link.token}`,
    message: input.message?.trim() ?? "",
  }
  const attachments = [{ filename: documentFileName(view), content: pdf }]

  const results = await Promise.allSettled(
    input.emails.map((to) =>
      sendTenantEmail(supabase, {
        tenantId,
        templateKey: config.template,
        to,
        vars,
        attachments,
      }),
    ),
  )
  const outcomes = results.map((result) =>
    result.status === "fulfilled" ? result.value : { sent: false },
  )
  for (const result of results) {
    if (result.status === "rejected") {
      logger.error("documents.send_failed", {
        kind: input.kind,
        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      })
    }
  }
  const sent = outcomes.filter((outcome) => outcome.sent).length

  if (sent === 0) {
    await supabase
      .from("document_links")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", link.id)
      .eq("tenant_id", tenantId)
    const skipped = outcomes.every(
      (outcome) => "skipped" in outcome && outcome.skipped,
    )
    return {
      error: skipped
        ? "E-mail não configurado. Configure o Resend para enviar documentos."
        : "Não foi possível enviar o e-mail. Tente novamente.",
    }
  }

  await supabase
    .from(config.table)
    .update({ status: config.statusTo })
    .eq("id", doc.id)
    .eq("tenant_id", tenantId)
    .eq("status", config.statusFrom)

  return { sent, total: input.emails.length }
}
