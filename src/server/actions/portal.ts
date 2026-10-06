"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getPortalContact } from "@/server/queries/portal"
import { signInSchema } from "@/lib/validations/auth"

export type PortalAuthState = { error?: string } | undefined

export async function portalSignInAction(
  _prevState: PortalAuthState,
  formData: FormData,
): Promise<PortalAuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: "Informe um e-mail e senha válidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) return { error: "Credenciais inválidas." }

  redirect("/portal")
}

export async function portalSignOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/portal/login")
}

export async function respondEstimateAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const accept = String(formData.get("accept") ?? "") === "1"
  if (!id) return

  const supabase = await createClient()
  const { error } = await supabase.rpc("client_respond_estimate", {
    p_estimate: id,
    p_accept: accept,
  })
  if (error) return

  revalidatePath("/portal/orcamentos")
  revalidatePath(`/portal/orcamentos/${id}`)
}

export type PortalTicketState = { error?: string } | undefined

export async function createPortalTicketAction(
  _prevState: PortalTicketState,
  formData: FormData,
): Promise<PortalTicketState> {
  const contact = await getPortalContact()
  if (!contact) return { error: "Sem acesso ao portal." }

  const subject = String(formData.get("subject") ?? "").trim()
  const details = String(formData.get("details") ?? "").trim() || null
  const priority = Number(formData.get("priority") ?? 2)
  const type = Number(formData.get("type") ?? 3)

  if (subject.length < 3) return { error: "Informe o assunto." }

  const supabase = await createClient()
  const { data: number, error: numberError } = await supabase.rpc(
    "next_document_number",
    { p_tenant: contact.tenant_id, p_kind: "ticket" },
  )
  if (numberError || number === null) {
    return dbError("portal.ticket.number", numberError, "Falha ao gerar o número.")
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("ticket_prefix")
    .eq("id", contact.tenant_id)
    .maybeSingle()
  const prefix = tenant?.ticket_prefix ?? "TCK-"

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      tenant_id: contact.tenant_id,
      number,
      formatted_number: `${prefix}${String(number).padStart(6, "0")}`,
      subject,
      details,
      status: 1,
      priority,
      type,
      company_id: contact.company_id,
      contact_id: contact.id,
      source: "portal",
    })
    .select("id")
    .single()

  if (error || !ticket) {
    return dbError("portal.ticket.create", error, "Falha ao abrir o ticket.")
  }

  revalidatePath("/portal/tickets")
  redirect(`/portal/tickets/${ticket.id}`)
}

export async function addPortalTicketReplyAction(formData: FormData) {
  const contact = await getPortalContact()
  if (!contact) return

  const ticketId = String(formData.get("ticket_id") ?? "")
  const body = String(formData.get("body") ?? "").trim()
  if (!ticketId || body.length < 1) return

  const supabase = await createClient()
  await supabase.from("ticket_replies").insert({
    tenant_id: contact.tenant_id,
    ticket_id: ticketId,
    contact_id: contact.id,
    body,
    is_internal: false,
  })

  revalidatePath(`/portal/tickets/${ticketId}`)
}
