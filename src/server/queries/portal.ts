import { createClient } from "@/lib/supabase/server"

export type PortalContact = {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  company_id: string
  company_name: string
  tenant_id: string
  tenant_name: string
}

export async function getPortalContact(): Promise<PortalContact | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("contacts")
    .select(
      "id, first_name, last_name, email, company_id, tenant_id, company:companies(name), tenant:tenants(name)",
    )
    .eq("user_id", user.id)
    .maybeSingle()

  if (!data) return null
  const row = data as unknown as {
    id: string
    first_name: string
    last_name: string | null
    email: string | null
    company_id: string
    tenant_id: string
    company: { name: string } | null
    tenant: { name: string } | null
  }

  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    company_id: row.company_id,
    company_name: row.company?.name ?? "Empresa",
    tenant_id: row.tenant_id,
    tenant_name: row.tenant?.name ?? "Portal",
  }
}

export type PortalProject = {
  id: string
  name: string
  description: string | null
  status: number
  deadline: string | null
  progress: number
  progress_from_tasks: boolean
}

export async function listPortalProjects(
  companyId: string,
): Promise<PortalProject[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(
      "id, name, description, status, deadline, progress, progress_from_tasks",
    )
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  return (data ?? []) as PortalProject[]
}

export async function getPortalProject(
  companyId: string,
  id: string,
): Promise<PortalProject | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(
      "id, name, description, status, deadline, progress, progress_from_tasks",
    )
    .eq("id", id)
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .maybeSingle()

  return (data as PortalProject | null) ?? null
}

export type PortalDocumentRow = {
  id: string
  formatted_number: string
  status: number
  date: string
  due_date: string | null
  expiry_date: string | null
  total: number
}

export async function listPortalEstimates(
  companyId: string,
): Promise<PortalDocumentRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("estimates")
    .select("id, formatted_number, status, date, expiry_date, total")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("date", { ascending: false })

  return (data ?? []) as unknown as PortalDocumentRow[]
}

export async function listPortalInvoices(
  companyId: string,
): Promise<PortalDocumentRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("invoices")
    .select("id, formatted_number, status, date, due_date, total")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("date", { ascending: false })

  return (data ?? []) as unknown as PortalDocumentRow[]
}
