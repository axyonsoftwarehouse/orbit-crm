"use server"

import { dbError } from "@/lib/db-error"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { LineItemInput } from "@/lib/documents/totals"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import {
  buildDocumentValues,
  formatDocumentNumber,
  getTenantFinanceSettings,
  parseDocumentForm,
  replaceDocumentItems,
} from "@/server/documents"
import { getEstimate, listDocumentItems } from "@/server/queries/documents"

export type EstimateFormState = { error?: string; success?: string } | undefined

export async function createEstimateAction(
  _prevState: EstimateFormState,
  formData: FormData,
): Promise<EstimateFormState> {
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
    { p_tenant: active.tenantId, p_kind: "estimate" },
  )
  if (numberError || number === null) {
    return dbError("estimates.number", numberError, "Falha ao gerar o número.")
  }

  const values = buildDocumentValues(parsed.data)
  const { data: estimate, error } = await supabase
    .from("estimates")
    .insert({
      tenant_id: active.tenantId,
      created_by: user?.id ?? null,
      number,
      prefix: settings.estimate_prefix,
      formatted_number: formatDocumentNumber(settings.estimate_prefix, number),
      status: 1,
      expiry_date: parsed.data.expiry_date ?? null,
      ...values,
    })
    .select("id")
    .single()

  if (error || !estimate) {
    return dbError("estimates.create", error, "Falha ao criar o orçamento.")
  }

  await replaceDocumentItems(
    supabase,
    active.tenantId,
    "estimate",
    estimate.id,
    parsed.data.items as LineItemInput[],
  )

  revalidatePath("/app/orcamentos")
  return { success: "Orçamento criado." }
}

export async function updateEstimateAction(
  _prevState: EstimateFormState,
  formData: FormData,
): Promise<EstimateFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Orçamento inválido." }

  const parsed = parseDocumentForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const values = buildDocumentValues(parsed.data)
  const supabase = await createClient()
  const { error } = await supabase
    .from("estimates")
    .update({ ...values, expiry_date: parsed.data.expiry_date ?? null })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  if (error) return dbError("estimates", error)

  await replaceDocumentItems(
    supabase,
    active.tenantId,
    "estimate",
    id,
    parsed.data.items as LineItemInput[],
  )

  revalidatePath("/app/orcamentos")
  revalidatePath(`/app/orcamentos/${id}`)
  return { success: "Orçamento atualizado." }
}

export async function updateEstimateStatusAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) return

  const id = String(formData.get("id") ?? "")
  const status = Number(formData.get("status"))
  if (!id || ![1, 2, 3, 4, 5].includes(status)) return

  const supabase = await createClient()
  await supabase
    .from("estimates")
    .update({ status })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/orcamentos")
  revalidatePath(`/app/orcamentos/${id}`)
}

export async function deleteEstimateAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  await supabase
    .from("estimates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/orcamentos")
  redirect("/app/orcamentos")
}

export async function convertEstimateToInvoiceAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app")

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const estimate = await getEstimate(active.tenantId, id)
  if (!estimate) return

  const items = await listDocumentItems(active.tenantId, "estimate", id)
  const supabase = await createClient()
  const settings = await getTenantFinanceSettings(supabase, active.tenantId)
  const user = await getUser()

  const { data: number, error: numberError } = await supabase.rpc(
    "next_document_number",
    { p_tenant: active.tenantId, p_kind: "invoice" },
  )
  if (numberError || number === null) return

  const dueDate = new Date(`${estimate.date}T00:00:00`)
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
      company_id: estimate.company_id,
      project_id: estimate.project_id,
      date: estimate.date,
      due_date: dueDate.toISOString().slice(0, 10),
      currency: estimate.currency,
      subtotal: estimate.subtotal,
      discount_type: estimate.discount_type,
      discount_percent: estimate.discount_percent,
      discount_total: estimate.discount_total,
      total_tax: estimate.total_tax,
      adjustment: estimate.adjustment,
      total: estimate.total,
      client_note: estimate.client_note,
      terms: estimate.terms,
      reference_no: estimate.reference_no,
    })
    .select("id")
    .single()

  if (error || !invoice) return

  await replaceDocumentItems(
    supabase,
    active.tenantId,
    "invoice",
    invoice.id,
    items.map((item) => ({
      description: item.description,
      qty: Number(item.qty),
      rate: Number(item.rate),
      unit: item.unit,
      tax_name: item.tax_name,
      tax_rate: item.tax_rate !== null ? Number(item.tax_rate) : null,
    })),
  )

  await supabase
    .from("estimates")
    .update({ invoice_id: invoice.id, status: 4 })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/orcamentos")
  redirect(`/app/faturas/${invoice.id}`)
}
