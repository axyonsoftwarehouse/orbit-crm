"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getActiveMembership } from "@/lib/tenant"
import { getUser } from "@/lib/auth"
import {
  DOCUMENT_KIND,
  deliverDocumentEmail,
} from "@/server/document-sharing/deliver"
import type { DocumentKind } from "@/server/queries/documents"

const MAX_RECIPIENTS = 20

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

  const config = DOCUMENT_KIND[input.kind]
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
  if (!(config.sendable as readonly number[]).includes(row.status)) {
    return { error: "Este documento não pode mais ser enviado." }
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

  const user = await getUser()
  const result = await deliverDocumentEmail(supabase, {
    tenantId: active.tenantId,
    kind: input.kind,
    doc: row,
    emails: recipients.map((contact) => contact.email!.trim()),
    message: input.message,
    userId: user?.id ?? null,
  })
  if ("error" in result) return { error: result.error }

  revalidatePath(`${config.path}/${row.id}`)
  revalidatePath(config.path)
  const { sent, total } = result
  return {
    sent,
    success:
      sent === total
        ? `Enviado para ${sent} contato(s).`
        : `Enviado para ${sent} de ${total} contato(s).`,
  }
}
