"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"
import { contractSchema } from "@/lib/validations/contracts"
import { createDocumentLink } from "@/server/document-sharing/links"
import { sendTenantEmail } from "@/server/email"

const MAX_RECIPIENTS = 20

export type ContractFormState = { error?: string; success?: string } | undefined

function parseContract(formData: FormData) {
  return contractSchema.safeParse({
    title: formData.get("title"),
    company_id: formData.get("company_id") || undefined,
    description: formData.get("description") || undefined,
    content: formData.get("content") || undefined,
    value: formData.get("value"),
    start_date: formData.get("start_date") || undefined,
    end_date: formData.get("end_date") || undefined,
    status: formData.get("status") ?? 1,
    note: formData.get("note") || undefined,
  })
}

export async function createContractAction(
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = parseContract(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("contracts").insert({
    tenant_id: active.tenantId,
    created_by: user?.id ?? null,
    ...parsed.data,
    value: parsed.data.value ?? null,
  })

  if (error) return dbError("contracts", error)

  revalidatePath("/app/contratos")
  return { success: "Contrato criado." }
}

export async function updateContractAction(
  _prevState: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Contrato inválido." }

  const parsed = parseContract(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("contracts")
    .update({ ...parsed.data, value: parsed.data.value ?? null })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return dbError("contracts", error)

  revalidatePath("/app/contratos")
  return { success: "Contrato atualizado." }
}

export async function deleteContractAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("contracts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/contratos")
}

export type ContractActionResult = {
  ok?: true
  error?: string
  success?: string
  sent?: number
}

/** Só owner/admin assinam, desfazem ou excluem em nome da empresa. */
function canManage(role: string): boolean {
  return role === "owner" || role === "admin"
}

/**
 * Envia o contrato para assinatura: cria (ou reaproveita) o link público,
 * manda o e-mail com o PDF anexo para os contatos do cliente e registra o
 * envio. Sem nenhum e-mail entregue, o link é revogado.
 */
export async function sendContractForSignatureAction(input: {
  id: string
  contactIds: string[]
  message?: string
}): Promise<ContractActionResult> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const contactIds = [...new Set(input.contactIds)].slice(0, MAX_RECIPIENTS)
  if (contactIds.length === 0) {
    return { error: "Selecione pelo menos um contato." }
  }

  const supabase = await createClient()
  const { data: doc } = await supabase
    .from("contracts")
    .select(
      "id, company_id, title, value, start_date, end_date, signed_at, deleted_at",
    )
    .eq("id", input.id)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  const contract = doc as {
    id: string
    company_id: string | null
    title: string
    value: number | string | null
    start_date: string | null
    end_date: string | null
    signed_at: string | null
  } | null
  if (!contract) return { error: "Contrato não encontrado." }
  if (contract.signed_at) {
    return { error: "Este contrato já está assinado." }
  }
  if (!contract.company_id) {
    return { error: "Defina o cliente do contrato antes de enviar." }
  }

  const { data: contactRows } = await supabase
    .from("contacts")
    .select("id, email")
    .eq("tenant_id", active.tenantId)
    .eq("company_id", contract.company_id)
    .is("deleted_at", null)
    .in("id", contactIds)

  const recipients = ((contactRows ?? []) as { email: string | null }[]).filter(
    (contact) => Boolean(contact.email?.trim()),
  )
  if (recipients.length !== contactIds.length) {
    return { error: "Selecione contatos deste cliente com e-mail." }
  }

  const user = await getUser()
  const link = await createDocumentLink(supabase, {
    tenantId: active.tenantId,
    kind: "contract",
    docId: contract.id,
    expiryDate: null,
    userId: user?.id ?? null,
  })
  if ("error" in link) return { error: link.error }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", active.tenantId)
    .maybeSingle()

  const siteUrl = env().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  const vars = {
    tenant: (tenant as { name?: string } | null)?.name ?? "",
    title: contract.title,
    link: `${siteUrl}/c/${link.token}`,
    message: input.message?.trim() ?? "",
  }

  const results = await Promise.allSettled(
    recipients.map((contact) =>
      sendTenantEmail(supabase, {
        tenantId: active.tenantId,
        templateKey: "contract_sent",
        to: contact.email!.trim(),
        vars,
      }),
    ),
  )
  for (const result of results) {
    if (result.status === "rejected") {
      logger.error("contracts.send_failed", {
        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      })
    }
  }
  const outcomes = results.map((result) =>
    result.status === "fulfilled" ? result.value : { sent: false },
  )
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
        ? "E-mail não configurado. Configure o Resend para enviar contratos."
        : "Não foi possível enviar o e-mail. Tente novamente.",
    }
  }

  const sentAt = new Date().toISOString()
  await supabase
    .from("contracts")
    .update({ last_sent_at: sentAt })
    .eq("id", contract.id)
    .eq("tenant_id", active.tenantId)

  await supabase.from("contract_events").insert({
    tenant_id: active.tenantId,
    contract_id: contract.id,
    kind: "sent",
    actor_kind: "staff",
    actor_id: user?.id ?? null,
    metadata: { recipients: sent },
  })

  revalidatePath(`/app/contratos/${contract.id}`)
  revalidatePath("/app/contratos")
  return {
    sent,
    success: `Enviado para ${sent} contato(s).`,
  }
}

/**
 * Desfaz a assinatura: apaga o PNG, limpa a prova e libera o contrato para ser
 * assinado de novo. Só owner/admin.
 */
export async function clearContractSignatureAction(
  id: string,
): Promise<ContractActionResult> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!canManage(active.role)) return { error: "Sem permissão." }

  const supabase = await createClient()
  const { data } = await supabase
    .from("contracts")
    .select("id, signature_path, signed_at, deleted_at")
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  const contract = data as {
    id: string
    signature_path: string | null
    signed_at: string | null
  } | null
  if (!contract) return { error: "Contrato não encontrado." }

  const { error } = await supabase
    .from("contracts")
    .update({
      signed_at: null,
      signature_path: null,
      content_rendered: null,
      content_hash: null,
      acceptance_firstname: null,
      acceptance_lastname: null,
      acceptance_email: null,
      acceptance_ip: null,
      acceptance_user_agent: null,
    })
    .eq("id", contract.id)
    .eq("tenant_id", active.tenantId)

  if (error) return dbError("contracts", error)

  if (contract.signature_path) {
    await supabase.storage.from("contracts").remove([contract.signature_path])
  }

  const user = await getUser()
  await supabase.from("contract_events").insert({
    tenant_id: active.tenantId,
    contract_id: contract.id,
    kind: "unsigned",
    actor_kind: "staff",
    actor_id: user?.id ?? null,
    metadata: { previous_signed_at: contract.signed_at },
  })

  revalidatePath(`/app/contratos/${contract.id}`)
  revalidatePath("/app/contratos")
  return { ok: true }
}

/**
 * Selo operacional: o cliente assinou fora do sistema (papel). Não grava prova
 * nem altera `signed_at` — convive com a assinatura eletrônica.
 */
export async function markContractSignedAction(
  id: string,
): Promise<ContractActionResult> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!canManage(active.role)) return { error: "Sem permissão." }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from("contracts")
    .update({
      marked_as_signed_at: new Date().toISOString(),
      marked_as_signed_by: user?.id ?? null,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)

  if (error) return dbError("contracts", error)

  await supabase.from("contract_events").insert({
    tenant_id: active.tenantId,
    contract_id: id,
    kind: "marked_signed",
    actor_kind: "staff",
    actor_id: user?.id ?? null,
    metadata: { source: "paper" },
  })

  revalidatePath(`/app/contratos/${id}`)
  revalidatePath("/app/contratos")
  return { ok: true }
}
