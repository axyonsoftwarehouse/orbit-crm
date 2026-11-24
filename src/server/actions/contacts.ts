"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { contactSchema } from "@/lib/validations/clients"
import { sendTenantEmail } from "@/server/email"
import { getBaseUrl } from "@/server/base-url"

export type ContactFormState = { error?: string; success?: string } | undefined

function parseContact(formData: FormData) {
  return contactSchema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name") || undefined,
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    title: formData.get("title") || undefined,
    is_primary: formData.get("is_primary") === "on",
  })
}

export async function createContactAction(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const companyId = String(formData.get("company_id") ?? "")
  if (!companyId) return { error: "Cliente inválido." }

  const parsed = parseContact(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("contacts").insert({
    tenant_id: active.tenantId,
    company_id: companyId,
    created_by: user?.id,
    ...parsed.data,
  })

  if (error) return dbError("contacts", error)

  revalidatePath(`/app/clientes/${companyId}`)
  return { success: "Contato adicionado." }
}

export async function updateContactAction(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  const companyId = String(formData.get("company_id") ?? "")
  if (!id || !companyId) return { error: "Contato inválido." }

  const parsed = parseContact(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("contacts")
    .update(parsed.data)
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return dbError("contacts", error)

  revalidatePath(`/app/clientes/${companyId}`)
  return { success: "Contato atualizado." }
}

export async function deleteContactAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const companyId = String(formData.get("company_id") ?? "")

  const supabase = await createClient()
  await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (companyId) revalidatePath(`/app/clientes/${companyId}`)
}

export type InviteContactState =
  { error?: string; success?: string; inviteLink?: string } | undefined

/**
 * Convida o contato para o portal: cria um convite de uso único e manda o
 * link por e-mail. O cliente define a própria senha ao aceitar
 * (`/portal/convite/<token>`). Um convite novo substitui o pendente.
 */
export async function inviteContactToPortalAction(
  _prevState: InviteContactState,
  formData: FormData,
): Promise<InviteContactState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }
  if (!["owner", "admin"].includes(active.role)) {
    return { error: "Você não tem permissão para liberar acesso ao portal." }
  }

  const contactId = String(formData.get("contact_id") ?? "")
  const companyId = String(formData.get("company_id") ?? "")
  if (!contactId) return { error: "Contato não encontrado." }

  const supabase = await createClient()
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, email, first_name, last_name, user_id")
    .eq("id", contactId)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!contact) return { error: "Contato não encontrado." }
  if (!contact.email) {
    return { error: "Cadastre um e-mail para o contato antes de dar acesso." }
  }
  if (contact.user_id) {
    return { error: "Este contato já possui acesso ao portal." }
  }

  const { error: revokeError } = await supabase
    .from("portal_invitations")
    .delete()
    .eq("tenant_id", active.tenantId)
    .eq("contact_id", contact.id)
    .is("accepted_at", null)
  if (revokeError) return dbError("contacts.portal_invite.revoke", revokeError)

  const user = await getUser()
  const email = contact.email.trim().toLowerCase()
  const { data: invitation, error } = await supabase
    .from("portal_invitations")
    .insert({
      tenant_id: active.tenantId,
      contact_id: contact.id,
      email,
      invited_by: user?.id ?? null,
    })
    .select("token")
    .single()

  if (error || !invitation) {
    return dbError("contacts.portal_invite", error, "Falha ao criar o convite.")
  }

  const link = `${await getBaseUrl()}/portal/convite/${invitation.token}`
  const result = await sendTenantEmail(supabase, {
    tenantId: active.tenantId,
    templateKey: "portal_invite",
    to: email,
    vars: {
      tenant: active.tenant.name,
      name: contact.first_name,
      link,
    },
  })

  if (companyId) revalidatePath(`/app/clientes/${companyId}`)
  return {
    success: result.sent
      ? `Convite enviado para ${email}.`
      : "Convite criado. Copie o link e envie ao cliente.",
    inviteLink: link,
  }
}
