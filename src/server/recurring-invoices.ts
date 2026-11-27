import type { SupabaseClient } from "@supabase/supabase-js"
import { todayIso } from "@/lib/format"
import { logger } from "@/lib/logger"
import { dueOccurrences, type Occurrence } from "@/lib/recurrence"
import {
  formatDocumentNumber,
  getTenantFinanceSettings,
} from "@/server/documents"
import { createNotification } from "@/server/notifications"
import { deliverDocumentEmail } from "@/server/document-sharing/deliver"

/** Colunas copiadas do modelo para cada fatura gerada. */
const COPIED_COLUMNS = [
  "company_id",
  "project_id",
  "currency",
  "discount_type",
  "discount_percent",
  "discount_total",
  "subtotal",
  "total_tax",
  "adjustment",
  "total",
  "reference_no",
  "client_note",
  "terms",
] as const

type Template = {
  id: string
  tenant_id: string
  created_by: string | null
  formatted_number: string
  date: string
  due_date: string | null
  recurrence_interval_months: number
  recurrence_end_date: string | null
  recurrence_auto_send: boolean
} & Record<(typeof COPIED_COLUMNS)[number], unknown>

export type RecurringRunResult = {
  templates: number
  generated: number
  sent: number
  failed: number
}

/**
 * Gera as faturas recorrentes que já venceram a data (roda no cron diário com
 * o client admin). Cada ocorrência nasce em rascunho; com envio automático,
 * vai por e-mail ao contato principal do cliente e passa a "Em aberto".
 * O índice único (modelo, sequência) evita duplicar em execuções paralelas.
 */
export async function runRecurringInvoices(
  admin: SupabaseClient,
  today: string = todayIso(),
): Promise<RecurringRunResult> {
  const result: RecurringRunResult = {
    templates: 0,
    generated: 0,
    sent: 0,
    failed: 0,
  }

  const { data: templates, error } = await admin
    .from("invoices")
    .select(
      [
        "id",
        "tenant_id",
        "created_by",
        "formatted_number",
        "date",
        "due_date",
        "recurrence_interval_months",
        "recurrence_end_date",
        "recurrence_auto_send",
        ...COPIED_COLUMNS,
      ].join(", "),
    )
    .not("recurrence_interval_months", "is", null)
    .is("deleted_at", null)
    .neq("status", 5)

  if (error) {
    logger.error("recurring_invoices.list_failed", { error: error.message })
    return result
  }

  for (const template of (templates ?? []) as unknown as Template[]) {
    result.templates++
    try {
      await processTemplate(admin, template, today, result)
    } catch (err) {
      result.failed++
      logger.error("recurring_invoices.template_failed", {
        invoice: template.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return result
}

async function processTemplate(
  admin: SupabaseClient,
  template: Template,
  today: string,
  result: RecurringRunResult,
) {
  const { data: last } = await admin
    .from("invoices")
    .select("recurrence_sequence")
    .eq("tenant_id", template.tenant_id)
    .eq("recurrence_parent_id", template.id)
    .order("recurrence_sequence", { ascending: false })
    .limit(1)
    .maybeSingle()
  const lastSequence =
    (last as { recurrence_sequence: number | null } | null)
      ?.recurrence_sequence ?? 0

  const occurrences = dueOccurrences(template, lastSequence, today)
  for (const occurrence of occurrences) {
    const created = await createOccurrence(admin, template, occurrence)
    if (!created) {
      result.failed++
      continue
    }
    result.generated++

    let outcome: string
    if (template.recurrence_auto_send) {
      const delivery = await autoSend(admin, template, created)
      if (delivery.sent) {
        result.sent++
        outcome = `Enviada para ${delivery.to}.`
      } else {
        outcome = `Não foi enviada: ${delivery.reason} Ficou em rascunho.`
      }
    } else {
      outcome = "Ficou em rascunho: revise e envie ao cliente."
    }

    await notifyManagers(admin, template.tenant_id, {
      title: `Fatura recorrente gerada: ${created.formatted_number}`,
      body: `Mensalidade de ${template.formatted_number}. ${outcome}`,
      url: `/app/faturas/${created.id}`,
    })
  }
}

type CreatedInvoice = {
  id: string
  formatted_number: string
  total: number | string
  currency: string
  due_date: string | null
}

async function createOccurrence(
  admin: SupabaseClient,
  template: Template,
  occurrence: Occurrence,
): Promise<CreatedInvoice | null> {
  const settings = await getTenantFinanceSettings(admin, template.tenant_id)
  const { data: number, error: numberError } = await admin.rpc(
    "next_document_number",
    { p_tenant: template.tenant_id, p_kind: "invoice" },
  )
  if (numberError || number === null) {
    logger.error("recurring_invoices.number_failed", {
      invoice: template.id,
      error: numberError?.message,
    })
    return null
  }

  const copied = Object.fromEntries(
    COPIED_COLUMNS.map((column) => [column, template[column]]),
  )
  const { data: invoice, error } = await admin
    .from("invoices")
    .insert({
      ...copied,
      tenant_id: template.tenant_id,
      created_by: template.created_by,
      number,
      prefix: settings.invoice_prefix,
      formatted_number: formatDocumentNumber(settings.invoice_prefix, number),
      status: 6,
      date: occurrence.date,
      due_date: occurrence.due_date,
      recurrence_parent_id: template.id,
      recurrence_sequence: occurrence.sequence,
    })
    .select("id, formatted_number, total, currency, due_date")
    .single()

  if (error || !invoice) {
    // 23505: outra execução já gerou esta ocorrência.
    if (error?.code !== "23505") {
      logger.error("recurring_invoices.insert_failed", {
        invoice: template.id,
        sequence: occurrence.sequence,
        error: error?.message,
      })
    }
    return null
  }

  const { data: items } = await admin
    .from("document_items")
    .select(
      "description, qty, rate, unit, tax_name, tax_rate, item_id, position",
    )
    .eq("tenant_id", template.tenant_id)
    .eq("rel_type", "invoice")
    .eq("rel_id", template.id)
    .order("position")

  const rows = ((items ?? []) as Record<string, unknown>[]).map((item) => ({
    ...item,
    tenant_id: template.tenant_id,
    rel_type: "invoice",
    rel_id: invoice.id,
  }))
  if (rows.length > 0) {
    const { error: itemsError } = await admin
      .from("document_items")
      .insert(rows)
    if (itemsError) {
      logger.error("recurring_invoices.items_failed", {
        invoice: invoice.id,
        error: itemsError.message,
      })
    }
  }

  return invoice as CreatedInvoice
}

async function autoSend(
  admin: SupabaseClient,
  template: Template,
  invoice: CreatedInvoice,
): Promise<{ sent: true; to: string } | { sent: false; reason: string }> {
  if (!template.company_id) {
    return { sent: false, reason: "a fatura não tem cliente." }
  }

  const { data: contact } = await admin
    .from("contacts")
    .select("email")
    .eq("tenant_id", template.tenant_id)
    .eq("company_id", template.company_id as string)
    .eq("is_primary", true)
    .is("deleted_at", null)
    .not("email", "is", null)
    .limit(1)
    .maybeSingle()
  const email = (contact as { email: string | null } | null)?.email?.trim()
  if (!email) {
    return {
      sent: false,
      reason: "o cliente não tem contato principal com e-mail.",
    }
  }

  const delivery = await deliverDocumentEmail(admin, {
    tenantId: template.tenant_id,
    kind: "invoice",
    doc: invoice,
    emails: [email],
    userId: null,
  })
  if ("error" in delivery) {
    return {
      sent: false,
      reason: delivery.error.includes("não configurado")
        ? "o envio de e-mail não está configurado."
        : `o envio para ${email} falhou.`,
    }
  }
  return { sent: true, to: email }
}

async function notifyManagers(
  admin: SupabaseClient,
  tenantId: string,
  input: { title: string; body: string; url: string },
) {
  const { data: managers } = await admin
    .from("memberships")
    .select("user_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .in("role", ["owner", "admin"])

  for (const manager of (managers ?? []) as { user_id: string }[]) {
    await createNotification(admin, {
      tenantId,
      userId: manager.user_id,
      type: "invoice_recurring",
      ...input,
    })
  }
}
