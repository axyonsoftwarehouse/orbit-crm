import { createClient } from "@/lib/supabase/server"

export type DocumentKind = "estimate" | "invoice"

export type DocumentItem = {
  id: string
  description: string
  qty: number
  rate: number
  unit: string | null
  tax_name: string | null
  tax_rate: number | null
  position: number
}

export type EstimateRow = {
  id: string
  formatted_number: string
  status: number
  date: string
  expiry_date: string | null
  total: number
  company: { id: string; name: string } | null
}

export type InvoiceRow = {
  id: string
  formatted_number: string
  status: number
  date: string
  due_date: string | null
  total: number
  company: { id: string; name: string } | null
}

export type Estimate = {
  id: string
  company_id: string | null
  project_id: string | null
  formatted_number: string
  status: number
  date: string
  expiry_date: string | null
  currency: string
  subtotal: number
  discount_type: "before_tax" | "after_tax"
  discount_percent: number | null
  discount_total: number
  total_tax: number
  adjustment: number
  total: number
  client_note: string | null
  terms: string | null
  reference_no: string | null
  invoice_id: string | null
}

export type Invoice = {
  id: string
  company_id: string | null
  project_id: string | null
  formatted_number: string
  status: number
  date: string
  due_date: string | null
  currency: string
  subtotal: number
  discount_type: "before_tax" | "after_tax"
  discount_percent: number | null
  discount_total: number
  total_tax: number
  adjustment: number
  total: number
  client_note: string | null
  terms: string | null
  reference_no: string | null
}

export type Payment = {
  id: string
  amount: number
  payment_mode: string | null
  payment_date: string
  transaction_id: string | null
  note: string | null
}

export async function listEstimates(tenantId: string): Promise<EstimateRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("estimates")
    .select(
      "id, formatted_number, status, date, expiry_date, total, company:companies(id, name)",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  return (data ?? []) as unknown as EstimateRow[]
}

export async function listEstimatesPage(
  tenantId: string,
  options: { page: number; pageSize: number },
): Promise<{ rows: EstimateRow[]; total: number }> {
  const supabase = await createClient()
  const from = (options.page - 1) * options.pageSize
  const { data, count } = await supabase
    .from("estimates")
    .select(
      "id, formatted_number, status, date, expiry_date, total, company:companies(id, name)",
      { count: "exact" },
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, from + options.pageSize - 1)

  return { rows: (data ?? []) as unknown as EstimateRow[], total: count ?? 0 }
}

export async function getEstimate(
  tenantId: string,
  id: string,
): Promise<Estimate | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("estimates")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()
  return (data as Estimate | null) ?? null
}

export async function listInvoices(tenantId: string): Promise<InvoiceRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("invoices")
    .select(
      "id, formatted_number, status, date, due_date, total, company:companies(id, name)",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  return (data ?? []) as unknown as InvoiceRow[]
}

export async function listInvoicesPage(
  tenantId: string,
  options: { page: number; pageSize: number },
): Promise<{ rows: InvoiceRow[]; total: number }> {
  const supabase = await createClient()
  const from = (options.page - 1) * options.pageSize
  const { data, count } = await supabase
    .from("invoices")
    .select(
      "id, formatted_number, status, date, due_date, total, company:companies(id, name)",
      { count: "exact" },
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, from + options.pageSize - 1)

  return { rows: (data ?? []) as unknown as InvoiceRow[], total: count ?? 0 }
}

export async function getInvoice(
  tenantId: string,
  id: string,
): Promise<Invoice | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()
  return (data as Invoice | null) ?? null
}

export async function listDocumentItems(
  tenantId: string,
  relType: DocumentKind,
  relId: string,
): Promise<DocumentItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("document_items")
    .select("id, description, qty, rate, unit, tax_name, tax_rate, position")
    .eq("tenant_id", tenantId)
    .eq("rel_type", relType)
    .eq("rel_id", relId)
    .order("position", { ascending: true })

  return (data ?? []) as DocumentItem[]
}

export async function listPayments(
  tenantId: string,
  invoiceId: string,
): Promise<Payment[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("payments")
    .select("id, amount, payment_mode, payment_date, transaction_id, note")
    .eq("tenant_id", tenantId)
    .eq("invoice_id", invoiceId)
    .order("payment_date", { ascending: false })

  return (data ?? []) as Payment[]
}

export async function sumPayments(
  tenantId: string,
  invoiceId: string,
): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("payments")
    .select("amount")
    .eq("tenant_id", tenantId)
    .eq("invoice_id", invoiceId)

  return ((data ?? []) as { amount: number }[]).reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  )
}
