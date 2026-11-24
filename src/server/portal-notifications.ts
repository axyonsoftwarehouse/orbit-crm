import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { logger } from "@/lib/logger"
import { createNotification } from "@/server/notifications"
import { sendTenantEmail } from "@/server/email"
import { resolveStaffRecipients } from "@/server/recipients"

/**
 * Avisos das ações do cliente no portal (orçamento respondido, ticket aberto,
 * mensagem nova) para a agência, e da resposta da agência para o cliente.
 * Usam o client admin porque avisam outras pessoas (a policy de
 * `notifications` só deixa criar para si mesmo, e o portal não lê
 * `memberships`/`profiles` da equipe). São best-effort: uma falha é logada e
 * nunca desfaz a ação de quem disparou. Os envios rodam em paralelo, e a
 * falha de um não impede os outros.
 */

type Counts = { notifications: number; emails: number }

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  )
}

function excerpt(content: string, length = 140) {
  const value = content.replace(/\s+/g, " ").trim()
  return value.length > length ? `${value.slice(0, length)}…` : value
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

async function companyName(
  admin: SupabaseClient,
  tenantId: string,
  companyId: string | null,
) {
  if (!companyId) return ""
  const { data } = await admin
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .eq("tenant_id", tenantId)
    .maybeSingle()
  return (data as { name?: string } | null)?.name ?? ""
}

/** Notificação no app + e-mail (se `notify_email`) para cada destinatário. */
async function notifyStaff(
  admin: SupabaseClient,
  input: {
    event: string
    tenantId: string
    recipients: string[]
    type: string
    title: string
    body: string | null
    path: string
    templateKey: string
    vars: Record<string, string>
  },
): Promise<Counts> {
  const counts: Counts = { notifications: 0, emails: 0 }
  const url = `${appUrl()}${input.path}`

  const results = await Promise.allSettled(
    input.recipients.map(async (userId) => {
      const notified = await createNotification(admin, {
        tenantId: input.tenantId,
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        url: input.path,
      })
      if (notified) counts.notifications++

      const { data: profile } = await admin
        .from("profiles")
        .select("email, notify_email")
        .eq("id", userId)
        .maybeSingle()
      const prefs = profile as {
        email: string | null
        notify_email: boolean
      } | null

      if (prefs?.email && prefs.notify_email) {
        const result = await sendTenantEmail(admin, {
          tenantId: input.tenantId,
          templateKey: input.templateKey,
          to: prefs.email,
          vars: { ...input.vars, url },
        })
        if (result.sent) counts.emails++
      }
    }),
  )

  for (const result of results) {
    if (result.status === "rejected") {
      logger.error(input.event, { error: errorMessage(result.reason) })
    }
  }
  return counts
}

type EstimateRow = {
  id: string
  tenant_id: string
  company_id: string | null
  formatted_number: string
  created_by: string | null
}

/** Cliente aceitou ou recusou um orçamento no portal. */
export async function notifyStaffEstimateResponse(input: {
  estimateId: string
  accepted: boolean
}): Promise<Counts> {
  const event = "portal.estimate_response_notify_failed"
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("estimates")
      .select("id, tenant_id, company_id, formatted_number, created_by")
      .eq("id", input.estimateId)
      .is("deleted_at", null)
      .maybeSingle()
    if (!data) return { notifications: 0, emails: 0 }
    const row = data as EstimateRow

    const [company, recipients] = await Promise.all([
      companyName(admin, row.tenant_id, row.company_id),
      resolveStaffRecipients(admin, row.tenant_id, row.created_by),
    ])
    const decision = input.accepted ? "aceitou" : "recusou"
    const who = company || "O cliente"

    return await notifyStaff(admin, {
      event,
      tenantId: row.tenant_id,
      recipients,
      type: "portal_estimate_response",
      title: `${who} ${decision} o orçamento ${row.formatted_number}`,
      body: null,
      path: `/app/orcamentos/${row.id}`,
      templateKey: "portal_estimate_response",
      vars: { number: row.formatted_number, company: who, decision },
    })
  } catch (error) {
    logger.error(event, {
      estimateId: input.estimateId,
      error: errorMessage(error),
    })
    return { notifications: 0, emails: 0 }
  }
}

type TicketRow = {
  id: string
  tenant_id: string
  company_id: string | null
  contact_id: string | null
  formatted_number: string
  subject: string
  assignee_id: string | null
}

async function loadPortalTicket(
  admin: SupabaseClient,
  input: { tenantId: string; ticketId: string; companyId: string },
) {
  const { data } = await admin
    .from("tickets")
    .select(
      "id, tenant_id, company_id, contact_id, formatted_number, subject, assignee_id",
    )
    .eq("id", input.ticketId)
    .eq("tenant_id", input.tenantId)
    .eq("company_id", input.companyId)
    .is("deleted_at", null)
    .maybeSingle()
  return data as TicketRow | null
}

/** Cliente abriu um ticket no portal. */
export async function notifyStaffTicketOpened(input: {
  tenantId: string
  companyId: string
  ticketId: string
  details?: string | null
}): Promise<Counts> {
  const event = "portal.ticket_opened_notify_failed"
  try {
    const admin = createAdminClient()
    const row = await loadPortalTicket(admin, input)
    if (!row) return { notifications: 0, emails: 0 }

    const [company, recipients] = await Promise.all([
      companyName(admin, row.tenant_id, row.company_id),
      resolveStaffRecipients(admin, row.tenant_id, row.assignee_id),
    ])
    const who = company || "O cliente"
    const message = excerpt(input.details ?? "")

    return await notifyStaff(admin, {
      event,
      tenantId: row.tenant_id,
      recipients,
      type: "portal_ticket_opened",
      title: `Novo ticket de ${who}: ${row.formatted_number} ${row.subject}`,
      body: message || null,
      path: `/app/tickets/${row.id}`,
      templateKey: "portal_ticket_opened",
      vars: {
        number: row.formatted_number,
        subject: row.subject,
        company: who,
        message,
      },
    })
  } catch (error) {
    logger.error(event, {
      ticketId: input.ticketId,
      error: errorMessage(error),
    })
    return { notifications: 0, emails: 0 }
  }
}

/** Cliente mandou mensagem num ticket pelo portal. */
export async function notifyStaffTicketReply(input: {
  tenantId: string
  companyId: string
  ticketId: string
  body: string
}): Promise<Counts> {
  const event = "portal.ticket_reply_notify_failed"
  try {
    const admin = createAdminClient()
    const row = await loadPortalTicket(admin, input)
    if (!row) return { notifications: 0, emails: 0 }

    const [company, recipients] = await Promise.all([
      companyName(admin, row.tenant_id, row.company_id),
      resolveStaffRecipients(admin, row.tenant_id, row.assignee_id),
    ])
    const who = company || "O cliente"
    const message = excerpt(input.body)

    return await notifyStaff(admin, {
      event,
      tenantId: row.tenant_id,
      recipients,
      type: "portal_ticket_reply",
      title: `${who} respondeu o ticket ${row.formatted_number}`,
      body: message || null,
      path: `/app/tickets/${row.id}`,
      templateKey: "portal_ticket_reply",
      vars: {
        number: row.formatted_number,
        subject: row.subject,
        company: who,
        message,
      },
    })
  } catch (error) {
    logger.error(event, {
      ticketId: input.ticketId,
      error: errorMessage(error),
    })
    return { notifications: 0, emails: 0 }
  }
}

/**
 * A agência respondeu (sem ser nota interna) um ticket: avisa por e-mail o
 * contato que abriu, se ele tiver acesso ao portal.
 */
export async function notifyClientTicketReply(input: {
  tenantId: string
  ticketId: string
  body: string
}): Promise<{ emails: number }> {
  const event = "portal.client_ticket_reply_notify_failed"
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("tickets")
      .select("id, tenant_id, contact_id, formatted_number, subject")
      .eq("id", input.ticketId)
      .eq("tenant_id", input.tenantId)
      .is("deleted_at", null)
      .maybeSingle()
    const ticket = data as Omit<TicketRow, "company_id" | "assignee_id"> | null
    if (!ticket?.contact_id) return { emails: 0 }

    const [{ data: contact }, { data: tenant }] = await Promise.all([
      admin
        .from("contacts")
        .select("email")
        .eq("id", ticket.contact_id)
        .eq("tenant_id", ticket.tenant_id)
        .not("user_id", "is", null)
        .is("deleted_at", null)
        .maybeSingle(),
      admin
        .from("tenants")
        .select("name")
        .eq("id", ticket.tenant_id)
        .maybeSingle(),
    ])
    const to = (contact as { email: string | null } | null)?.email?.trim()
    if (!to) return { emails: 0 }

    const result = await sendTenantEmail(admin, {
      tenantId: ticket.tenant_id,
      templateKey: "ticket_reply_client",
      to,
      vars: {
        number: ticket.formatted_number,
        subject: ticket.subject,
        tenant: (tenant as { name?: string } | null)?.name ?? "",
        message: excerpt(input.body, 500),
        url: `${appUrl()}/portal/tickets/${ticket.id}`,
      },
    })
    return { emails: result.sent ? 1 : 0 }
  } catch (error) {
    logger.error(event, {
      ticketId: input.ticketId,
      error: errorMessage(error),
    })
    return { emails: 0 }
  }
}
