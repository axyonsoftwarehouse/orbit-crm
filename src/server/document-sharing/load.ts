import type { SupabaseClient } from "@supabase/supabase-js"
import type { DocumentItem, DocumentKind } from "@/server/queries/documents"

/** Tudo que o PDF e a página pública mostram de um orçamento ou fatura. */
export type DocumentView = {
  kind: DocumentKind
  id: string
  number: string
  status: number
  date: string
  /** Validade (orçamento) ou vencimento (fatura). */
  dueOrExpiry: string | null
  currency: string
  subtotal: number
  discountTotal: number
  totalTax: number
  adjustment: number
  total: number
  /** Soma dos pagamentos (só fatura; 0 no orçamento). */
  paid: number
  clientNote: string | null
  terms: string | null
  items: DocumentItem[]
  company: {
    name: string
    vat: string | null
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    country: string | null
  } | null
  tenant: { name: string; logoUrl: string | null; primaryColor: string | null }
}

const COMMON_COLUMNS =
  "id, company_id, formatted_number, status, date, currency, subtotal, discount_total, total_tax, adjustment, total, client_note, terms"

type DocumentRow = {
  id: string
  formatted_number: string
  status: number
  date: string
  expiry_date?: string | null
  due_date?: string | null
  currency: string
  subtotal: number | string
  discount_total: number | string
  total_tax: number | string
  adjustment: number | string
  total: number | string
  client_note: string | null
  terms: string | null
  company_id: string | null
}

/**
 * Carrega o documento com itens, pagamentos e a marca do tenant. Recebe o
 * client: o do usuário no app (RLS) ou o admin na página pública, depois de
 * validar o token. Filtra sempre por tenant e ignora excluídos.
 */
export async function loadDocument(
  supabase: SupabaseClient,
  tenantId: string,
  kind: DocumentKind,
  id: string,
): Promise<DocumentView | null> {
  const table = kind === "estimate" ? "estimates" : "invoices"
  const dateColumn = kind === "estimate" ? "expiry_date" : "due_date"
  const { data } = await supabase
    .from(table)
    .select(`${COMMON_COLUMNS}, ${dateColumn}`)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  const row = data as DocumentRow | null
  if (!row) return null

  // Cliente em consulta separada e filtrada pelo tenant: com o client admin
  // (página pública), um embed pela FK não teria filtro de tenant.
  const [
    { data: items },
    { data: payments },
    { data: tenant },
    { data: company },
  ] = await Promise.all([
    supabase
      .from("document_items")
      .select("id, description, qty, rate, unit, tax_name, tax_rate, position")
      .eq("tenant_id", tenantId)
      .eq("rel_type", kind)
      .eq("rel_id", id)
      .order("position", { ascending: true }),
    kind === "invoice"
      ? supabase
          .from("payments")
          .select("amount")
          .eq("tenant_id", tenantId)
          .eq("invoice_id", id)
      : Promise.resolve({ data: [] as { amount: number }[] }),
    supabase
      .from("tenants")
      .select("name, logo_url, primary_color")
      .eq("id", tenantId)
      .maybeSingle(),
    row.company_id
      ? supabase
          .from("companies")
          .select("name, vat, address, city, state, zip, country")
          .eq("id", row.company_id)
          .eq("tenant_id", tenantId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const brand = tenant as {
    name: string
    logo_url: string | null
    primary_color: string | null
  } | null

  return {
    kind,
    id: row.id,
    number: row.formatted_number,
    status: row.status,
    date: row.date,
    dueOrExpiry: (kind === "estimate" ? row.expiry_date : row.due_date) ?? null,
    currency: row.currency,
    subtotal: Number(row.subtotal),
    discountTotal: Number(row.discount_total),
    totalTax: Number(row.total_tax),
    adjustment: Number(row.adjustment),
    total: Number(row.total),
    paid: ((payments ?? []) as { amount: number | string }[]).reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    ),
    clientNote: row.client_note,
    terms: row.terms,
    items: (items ?? []) as DocumentItem[],
    company: (company as DocumentView["company"]) ?? null,
    tenant: {
      name: brand?.name ?? "",
      logoUrl: brand?.logo_url ?? null,
      primaryColor: brand?.primary_color ?? null,
    },
  }
}
