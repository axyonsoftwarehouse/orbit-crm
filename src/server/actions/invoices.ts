"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { computeTotals } from "@/lib/documents/totals"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { listUnbilledBillableEntries } from "@/server/queries/time"
import {
  buildDocumentValues,
  formatDocumentNumber,
  getTenantFinanceSettings,
  parseDocumentForm,
  replaceDocumentItems,
} from "@/server/documents"

export type InvoiceFormState = { error?: string; success?: string } | undefined

async function recomputeInvoiceStatus(
  supabase: SupabaseClient,
  tenantId: string,
  invoiceId: string,
) {
  const { data: invoice } = await supabase
    .from("invoices")
    .select("total, status")
    .eq("id", invoiceId)
    .eq("tenant_id", tenantId)
    .maybeSingle()

  if (!invoice || invoice.status === 5 || invoice.status === 6) return

  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId)
    .eq("tenant_id", tenantId)

  const paid = ((payments ?? []) as { amount: number }[]).reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  )
  const total = Number(invoice.total)

  let status = 1
  if (paid <= 0) status = 1
  else if (paid + 0.001 >= total) status = 2
  else status = 3

  await supabase
    .from("invoices")
    .update({ status })
    .eq("id", invoiceId)
    .eq("tenant_id", tenantId)
}

export async function createInvoiceAction(
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const parsed = parseDocumentForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const supabase = await createClient()
  const settings = await getTenantFinanceSettings(supabase, active.tenantId)
  const user = await getUser()

  const { data: number, error: numberError } = await supabase.rpc(
    "next_document_number",
    { p_tenant: active.tenantId, p_kind: "invoice" },
  )
  if (numberError || number === null) {
    return { error: numberError?.message ?? "Falha ao gerar o número." }
  }

  const values = buildDocumentValues(parsed.data)
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      tenant_id: active.tenantId,
      created_by: user?.id ?? null,
      number,
      prefix: settings.invoice_prefix,
      formatted_number: formatDocumentNumber(settings.invoice_prefix, number),
      status: 1,
      due_date: parsed.data.due_date ?? null,
      ...values,
    })
    .select("id")
    .single()

  if (error || !invoice) {
    return { error: error?.message ?? "Falha ao criar a fatura." }
  }

  await replaceDocumentItems(
    supabase,
    active.tenantId,
    "invoice",
    invoice.id,
    parsed.data.items,
  )

  revalidatePath("/app/faturas")
  return { success: "Fatura criada." }
}

export async function updateInvoiceAction(
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Fatura inválida." }

  const parsed = parseDocumentForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const values = buildDocumentValues(parsed.data)
  const supabase = await createClient()
  const { error } = await supabase
    .from("invoices")
    .update({ ...values, due_date: parsed.data.due_date ?? null })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return { error: error.message }

  await replaceDocumentItems(
    supabase,
    active.tenantId,
    "invoice",
    id,
    parsed.data.items,
  )

  await recomputeInvoiceStatus(supabase, active.tenantId, id)

  revalidatePath("/app/faturas")
  revalidatePath(`/app/faturas/${id}`)
  return { success: "Fatura atualizada." }
}

export async function updateInvoiceStatusAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const status = Number(formData.get("status"))
  if (!id || ![1, 5, 6].includes(status)) return

  const supabase = await createClient()
  await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  await recomputeInvoiceStatus(supabase, active.tenantId, id)

  revalidatePath("/app/faturas")
  revalidatePath(`/app/faturas/${id}`)
}

export async function deleteInvoiceAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("invoices")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/faturas")
  redirect("/app/faturas")
}

export async function recordPaymentAction(
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const invoiceId = String(formData.get("invoice_id") ?? "")
  const amount = Number(formData.get("amount"))
  const paymentDate = String(formData.get("payment_date") ?? "")
  const paymentMode = String(formData.get("payment_mode") ?? "").trim() || null
  const transactionId =
    String(formData.get("transaction_id") ?? "").trim() || null
  const note = String(formData.get("note") ?? "").trim() || null

  if (!invoiceId || !amount || amount <= 0) {
    return { error: "Informe um valor válido." }
  }
  if (!paymentDate) return { error: "Informe a data do pagamento." }

  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("payments").insert({
    tenant_id: active.tenantId,
    invoice_id: invoiceId,
    amount,
    payment_mode: paymentMode,
    payment_date: paymentDate,
    transaction_id: transactionId,
    note,
    created_by: user?.id ?? null,
  })

  if (error) return { error: error.message }

  await recomputeInvoiceStatus(supabase, active.tenantId, invoiceId)

  revalidatePath("/app/faturas")
  revalidatePath(`/app/faturas/${invoiceId}`)
  return { success: "Pagamento registrado." }
}

export async function deletePaymentAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const invoiceId = String(formData.get("invoice_id") ?? "")
  if (!id || !invoiceId) return

  const supabase = await createClient()
  await supabase
    .from("payments")
    .delete()
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  await recomputeInvoiceStatus(supabase, active.tenantId, invoiceId)

  revalidatePath("/app/faturas")
  revalidatePath(`/app/faturas/${invoiceId}`)
}

export async function invoiceBillableTimeAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const projectId = String(formData.get("project_id") ?? "")
  if (!projectId) return

  const entries = await listUnbilledBillableEntries(active.tenantId, projectId)
  if (entries.length === 0) return

  const supabase = await createClient()
  const { data: project } = await supabase
    .from("projects")
    .select("company_id, name")
    .eq("id", projectId)
    .eq("tenant_id", active.tenantId)
    .maybeSingle()

  const settings = await getTenantFinanceSettings(supabase, active.tenantId)
  const user = await getUser()

  const groups = new Map<
    string,
    { description: string; qty: number; rate: number; ids: string[] }
  >()
  for (const entry of entries) {
    const key = `${entry.task_id ?? "none"}|${entry.rate ?? 0}`
    const group = groups.get(key) ?? {
      description: entry.task_name ?? "Horas do projeto",
      qty: 0,
      rate: Number(entry.rate ?? 0),
      ids: [],
    }
    group.qty += entry.duration_seconds / 3600
    group.ids.push(entry.id)
    groups.set(key, group)
  }

  const items = Array.from(groups.values()).map((group) => ({
    description: group.description,
    qty: Math.round(group.qty * 100) / 100,
    rate: group.rate,
  }))

  const { data: number, error: numberError } = await supabase.rpc(
    "next_document_number",
    { p_tenant: active.tenantId, p_kind: "invoice" },
  )
  if (numberError || number === null) return

  const totals = computeTotals(items, { discount_type: "before_tax" })
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      tenant_id: active.tenantId,
      created_by: user?.id ?? null,
      number,
      prefix: settings.invoice_prefix,
      formatted_number: formatDocumentNumber(settings.invoice_prefix, number),
      status: 1,
      company_id: project?.company_id ?? null,
      project_id: projectId,
      date: new Date().toISOString().slice(0, 10),
      due_date: dueDate.toISOString().slice(0, 10),
      currency: settings.currency,
      subtotal: totals.subtotal,
      total_tax: totals.total_tax,
      discount_total: totals.discount_total,
      total: totals.total,
    })
    .select("id")
    .single()

  if (error || !invoice) return

  await replaceDocumentItems(
    supabase,
    active.tenantId,
    "invoice",
    invoice.id,
    items,
  )

  const ids = Array.from(groups.values()).flatMap((group) => group.ids)
  await supabase
    .from("time_entries")
    .update({ billed: true })
    .in("id", ids)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/faturas")
  revalidatePath(`/app/projetos/${projectId}`)
  redirect(`/app/faturas/${invoice.id}`)
}
