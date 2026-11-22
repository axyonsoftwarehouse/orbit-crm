import type { SupabaseClient } from "@supabase/supabase-js"
import { computeTotals, type LineItemInput } from "@/lib/documents/totals"
import { dbError } from "@/lib/db-error"
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
): Promise<{ error: string | null }> {
  const { data: oldRows } = await supabase
    .from("document_items")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("rel_type", relType)
    .eq("rel_id", relId)
  const oldIds = ((oldRows ?? []) as { id: string }[]).map((row) => row.id)

  const wanted = [
    ...new Set(
      items
        .map((item) => item.item_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const validItems = new Set<string>()
  if (wanted.length > 0) {
    const { data } = await supabase
      .from("items")
      .select("id")
      .eq("tenant_id", tenantId)
      .in("id", wanted)
      .is("deleted_at", null)
    for (const row of (data ?? []) as { id: string }[]) {
      validItems.add(row.id)
    }
  }

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
    item_id:
      item.item_id && validItems.has(item.item_id) ? item.item_id : null,
    position: index,
  }))

  if (rows.length > 0) {
    const { error } = await supabase.from("document_items").insert(rows)
    if (error) {
      return dbError(
        "document_items.replace",
        error,
        "Não foi possível salvar os itens do documento.",
      )
    }
  }

  if (oldIds.length > 0) {
    await supabase.from("document_items").delete().in("id", oldIds)
  }

  return { error: null }
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
