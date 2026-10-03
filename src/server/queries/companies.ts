import { createClient } from "@/lib/supabase/server"

export type CompanyListRow = {
  id: string
  name: string
  phone: string | null
  website: string | null
  city: string | null
  country: string | null
}

export type Company = {
  id: string
  tenant_id: string
  name: string
  vat: string | null
  phone: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  notes: string | null
}

export type Contact = {
  id: string
  company_id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  title: string | null
  is_primary: boolean
  user_id: string | null
}

export async function listCompanies(
  tenantId: string,
): Promise<CompanyListRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("companies")
    .select("id, name, phone, website, city, country")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true })

  return (data ?? []) as CompanyListRow[]
}

export async function listCompaniesPage(
  tenantId: string,
  options: { page: number; pageSize: number; ids?: string[] },
): Promise<{ rows: CompanyListRow[]; total: number }> {
  if (options.ids && options.ids.length === 0) return { rows: [], total: 0 }

  const supabase = await createClient()
  let query = supabase
    .from("companies")
    .select("id, name, phone, website, city, country", { count: "exact" })
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)

  if (options.ids) query = query.in("id", options.ids)

  const from = (options.page - 1) * options.pageSize
  const { data, count } = await query
    .order("name", { ascending: true })
    .range(from, from + options.pageSize - 1)

  return { rows: (data ?? []) as CompanyListRow[], total: count ?? 0 }
}

export async function getCompany(
  tenantId: string,
  id: string,
): Promise<Company | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  return (data as Company | null) ?? null
}

export async function listContacts(
  tenantId: string,
  companyId: string,
): Promise<Contact[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .eq("company_id", companyId)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("is_primary", { ascending: false })
    .order("first_name", { ascending: true })

  return (data ?? []) as Contact[]
}

export async function countContactsByCompany(
  tenantId: string,
): Promise<Record<string, number>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("contacts")
    .select("company_id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)

  const counts: Record<string, number> = {}
  for (const row of (data ?? []) as { company_id: string }[]) {
    counts[row.company_id] = (counts[row.company_id] ?? 0) + 1
  }
  return counts
}
