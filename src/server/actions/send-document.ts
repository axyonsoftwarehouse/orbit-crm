"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getActiveMembership } from "@/lib/tenant"
import { getUser } from "@/lib/auth"
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

const MAX_RECIPIENTS = 20

const KIND = {
  estimate: {
    table: "estimates",
    dateColumn: "expiry_date",
    template: "estimate_sent",
    path: "/app/orcamentos",
    /** Rascunho → Enviado */
    statusFrom: 1,
    statusTo: 2,
  },
  invoice: {
    table: "invoices",
    dateColumn: "due_date",
    template: "invoice_sent",
    path: "/app/faturas",
    /** Rascunho → Em aberto */
    statusFrom: 6,
    statusTo: 1,
  },
} as const

export type SendDocumentResult = {
  error?: string
  success?: string
  sent?: number
}

/**
 * Envia o orçamento ou a fatura por e-mail aos contatos escolhidos do cliente:
 * um link público (token) para ver/responder e o PDF anexo. Os contatos têm de
 * ser do cliente do documento e ter e-mail; o status sai do rascunho se pelo
 * menos um e-mail for enviado.
 */
export async function sendDocumentAction(input: {
  kind: DocumentKind
  id: string
  contactIds: string[]
  message?: string
}): Promise<SendDocumentResult> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const config = KIND[input.kind]
  if (!config) return { error: "Documento inválido." }

  const contactIds = [...new Set(input.contactIds)].slice(0, MAX_RECIPIENTS)
  if (contactIds.length === 0) {
    return { error: "Selecione pelo menos um contato." }
  }

  const supabase = await createClient()
  const { data: doc } = await supabase
    .from(config.table)
    .select(
      `id, company_id, status, formatted_number, total, currency, date, ${config.dateColumn}`,
    )
    .eq("id", input.id)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  const row = doc as {
    id: string
    company_id: string | null
    status: number
    formatted_number: string
    total: number | string
    currency: string
    expiry_date?: string | null
    due_date?: string | null
  } | null
  if (!row) return { error: "Documento não encontrado." }
  if (!row.company_id) {
    return { error: "Defina o cliente do documento antes de enviar." }
  }

  const { data: contactRows } = await supabase
    .from("contacts")
    .select("id, email")
    .eq("tenant_id", active.tenantId)
    .eq("company_id", row.company_id)
    .is("deleted_at", null)
    .in("id", contactIds)

  const recipients = (
    (contactRows ?? []) as {
      id: string
      email: string | null
    }[]
  ).filter((contact) => Boolean(contact.email?.trim()))
  if (recipients.length !== contactIds.length) {
    return { error: "Selecione contatos deste cliente com e-mail." }
  }

  const view = await loadDocument(supabase, active.tenantId, input.kind, row.id)
  if (!view) return { error: "Documento não encontrado." }

  const user = await getUser()
  const dateValue =
    (input.kind === "estimate" ? row.expiry_date : row.due_date) ?? null
  const link = await createDocumentLink(supabase, {
    tenantId: active.tenantId,
    kind: input.kind,
    docId: row.id,
    expiryDate: input.kind === "estimate" ? dateValue : null,
    userId: user?.id ?? null,
  })
  if ("error" in link) return { error: link.error }

  const pdf = Buffer.from(await renderDocumentPdf(view)).toString("base64")
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", active.tenantId)
    .maybeSingle()

  const siteUrl = env().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  const vars = {
    tenant: (tenant as { name?: string } | null)?.name ?? "",
    number: row.formatted_number,
    total: formatMoney(Number(row.total), row.currency),
    date: formatDate(dateValue),
    link: `${siteUrl}/d/${link.token}`,
    message: input.message?.trim() ?? "",
  }
  const attachments = [{ filename: documentFileName(view), content: pdf }]

  const results = await Promise.allSettled(
    recipients.map((contact) =>
      sendTenantEmail(supabase, {
        tenantId: active.tenantId,
        templateKey: config.template,
        to: contact.email!.trim(),
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
      .eq("tenant_id", active.tenantId)
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
    .eq("id", row.id)
    .eq("tenant_id", active.tenantId)
    .eq("status", config.statusFrom)

  revalidatePath(`${config.path}/${row.id}`)
  revalidatePath(config.path)
  return {
    sent,
    success:
      sent === recipients.length
        ? `Enviado para ${sent} contato(s).`
        : `Enviado para ${sent} de ${recipients.length} contato(s).`,
  }
}
