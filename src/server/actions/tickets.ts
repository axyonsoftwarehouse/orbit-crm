"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { ticketReplySchema, ticketSchema } from "@/lib/validations/tickets"

export type TicketFormState = { error?: string; success?: string } | undefined

function formatNumber(prefix: string, number: number) {
  return `${prefix}${String(number).padStart(6, "0")}`
}

function parseTicket(formData: FormData) {
  return ticketSchema.safeParse({
    subject: formData.get("subject"),
    details: formData.get("details") || undefined,
    status: formData.get("status") ?? 1,
    priority: formData.get("priority") ?? 2,
    type: formData.get("type") ?? 3,
    department_id: formData.get("department_id") || undefined,
    company_id: formData.get("company_id") || undefined,
    contact_id: formData.get("contact_id") || undefined,
    assignee_id: formData.get("assignee_id") || undefined,
    project_id: formData.get("project_id") || undefined,
  })
}

export async function createTicketAction(
  _prevState: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = parseTicket(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const user = await getUser()

  const { data: number, error: numberError } = await supabase.rpc(
    "next_document_number",
    { p_tenant: active.tenantId, p_kind: "ticket" },
  )
  if (numberError || number === null) {
    return { error: numberError?.message ?? "Falha ao gerar o número." }
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("ticket_prefix")
    .eq("id", active.tenantId)
    .maybeSingle()
  const prefix = tenant?.ticket_prefix ?? "TCK-"

  const { error } = await supabase.from("tickets").insert({
    tenant_id: active.tenantId,
    number,
    formatted_number: formatNumber(prefix, number),
    subject: parsed.data.subject,
    details: parsed.data.details ?? null,
    status: parsed.data.status,
    priority: parsed.data.priority,
    type: parsed.data.type,
    department_id: parsed.data.department_id ?? null,
    company_id: parsed.data.company_id ?? null,
    contact_id: parsed.data.contact_id ?? null,
    assignee_id: parsed.data.assignee_id ?? null,
    project_id: parsed.data.project_id ?? null,
    source: "staff",
    created_by: user?.id ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath("/app/tickets")
  return { success: "Ticket criado." }
}

export async function updateTicketAction(
  _prevState: TicketFormState,
  formData: FormData,
): Promise<TicketFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Ticket inválido." }

  const parsed = parseTicket(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("tickets")
    .update({
      subject: parsed.data.subject,
      details: parsed.data.details ?? null,
      status: parsed.data.status,
      priority: parsed.data.priority,
      type: parsed.data.type,
      department_id: parsed.data.department_id ?? null,
      company_id: parsed.data.company_id ?? null,
      contact_id: parsed.data.contact_id ?? null,
      assignee_id: parsed.data.assignee_id ?? null,
      project_id: parsed.data.project_id ?? null,
      closed_at:
        parsed.data.status === 4 || parsed.data.status === 5
          ? new Date().toISOString()
          : null,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return { error: error.message }

  revalidatePath("/app/tickets")
  revalidatePath(`/app/tickets/${id}`)
  return { success: "Ticket atualizado." }
}

export async function updateTicketStatusAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const status = Number(formData.get("status"))
  if (!id || ![1, 2, 3, 4, 5, 6].includes(status)) return

  const supabase = await createClient()
  await supabase
    .from("tickets")
    .update({
      status,
      closed_at: status === 4 || status === 5 ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/tickets")
  revalidatePath(`/app/tickets/${id}`)
}

export async function deleteTicketAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("tickets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/tickets")
  redirect("/app/tickets")
}

export async function addTicketReplyAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const ticketId = String(formData.get("ticket_id") ?? "")
  const parsed = ticketReplySchema.safeParse({
    body: formData.get("body"),
    is_internal: formData.get("is_internal") === "on",
  })
  if (!ticketId || !parsed.success) return

  const user = await getUser()
  const supabase = await createClient()
  await supabase.from("ticket_replies").insert({
    tenant_id: active.tenantId,
    ticket_id: ticketId,
    author_id: user?.id ?? null,
    body: parsed.data.body,
    is_internal: parsed.data.is_internal,
  })

  revalidatePath(`/app/tickets/${ticketId}`)
}

export async function deleteTicketReplyAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const ticketId = String(formData.get("ticket_id") ?? "")
  if (!id || !ticketId) return

  const supabase = await createClient()
  await supabase
    .from("ticket_replies")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath(`/app/tickets/${ticketId}`)
}
