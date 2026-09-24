import type { SupabaseClient } from "@supabase/supabase-js"
import { computeTotals, type LineItemInput } from "@/lib/documents/totals"
import { documentSchema, type DocumentInput } from "@/lib/validations/documents"

export function parseDocumentForm(formData: FormData) {
  let items: unknown = []
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"))
  } catch {
    items = []
  }

  return documentSchema.safeParse({
    company_id: formData.get("company_id") || undefined,
    project_id: formData.get("project_id") || undefined,
    date: formData.get("date"),
    due_date: formData.get("due_date") || undefined,
    expiry_date: formData.get("expiry_date") || undefined,
    currency: formData.get("currency") || undefined,
    discount_type: formData.get("discount_type") || undefined,
    discount_percent: formData.get("discount_percent"),
    discount_total: formData.get("discount_total"),
    adjustment: formData.get("adjustment"),
    reference_no: formData.get("reference_no") || undefined,
    client_note: formData.get("client_note") || undefined,
    terms: formData.get("terms") || undefined,
    items,
  })
}

export function buildDocumentValues(data: DocumentInput) {
  const totals = computeTotals(data.items as LineItemInput[], {
    discount_type: data.discount_type,
    discount_percent: data.discount_percent ?? null,
    discount_total: data.discount_total ?? null,
    adjustment: data.adjustment ?? null,
  })

  return {
    company_id: data.company_id ?? null,
    project_id: data.project_id ?? null,
    date: data.date,
    currency: data.currency,
    discount_type: data.discount_type,
    discount_percent: data.discount_percent ?? null,
    discount_total: totals.discount_total,
    subtotal: totals.subtotal,
    total_tax: totals.total_tax,
    adjustment: data.adjustment ?? 0,
    total: totals.total,
    reference_no: data.reference_no ?? null,
    client_note: data.client_note ?? null,
    terms: data.terms ?? null,
  }
}

export async function replaceDocumentItems(
  supabase: SupabaseClient,
  tenantId: string,
  relType: "estimate" | "invoice",
  relId: string,
  items: LineItemInput[],
) {
  await supabase
    .from("document_items")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("rel_type", relType)
    .eq("rel_id", relId)

  const rows = items.map((item, index) => ({
    tenant_id: tenantId,
    rel_type: relType,
    rel_id: relId,
    description: item.description,
    qty: item.qty,
    rate: item.rate,
    unit: item.unit ?? null,
    tax_name: item.tax_name ?? null,
    tax_rate: item.tax_rate ?? null,
    position: index,
  }))

  if (rows.length > 0) {
    await supabase.from("document_items").insert(rows)
  }
}

export async function getTenantFinanceSettings(
  supabase: SupabaseClient,
  tenantId: string,
) {
  const { data } = await supabase
    .from("tenants")
    .select("currency, invoice_prefix, estimate_prefix")
    .eq("id", tenantId)
    .maybeSingle()

  return {
    currency: data?.currency ?? "BRL",
    invoice_prefix: data?.invoice_prefix ?? "INV-",
    estimate_prefix: data?.estimate_prefix ?? "EST-",
  }
}

export function formatDocumentNumber(prefix: string, number: number) {
  return `${prefix}${String(number).padStart(6, "0")}`
}
