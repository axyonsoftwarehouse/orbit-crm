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

export type PortalTicketRow = {
  id: string
  formatted_number: string
  subject: string
  status: number
  priority: number
  updated_at: string
}

export async function listPortalTickets(
  companyId: string,
): Promise<PortalTicketRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tickets")
    .select("id, formatted_number, subject, status, priority, updated_at")
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })

  return (data ?? []) as PortalTicketRow[]
}

export type PortalTicket = {
  id: string
  formatted_number: string
  subject: string
  details: string | null
  status: number
  priority: number
  created_at: string
  updated_at: string
  closed_at: string | null
}

export async function getPortalTicket(
  id: string,
): Promise<PortalTicket | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tickets")
    .select(
      "id, formatted_number, subject, details, status, priority, created_at, updated_at, closed_at",
    )
    .eq("id", id)
    .maybeSingle()
  return (data as PortalTicket | null) ?? null
}

export type PortalTicketReply = {
  id: string
  body: string
  created_at: string
  from_client: boolean
}

export async function listPortalTicketReplies(
  ticketId: string,
): Promise<PortalTicketReply[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("ticket_replies")
    .select("id, body, created_at, contact_id")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })

  return (
    (data ?? []) as {
      id: string
      body: string
      created_at: string
      contact_id: string | null
    }[]
  ).map((row) => ({
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    from_client: row.contact_id !== null,
  }))
}

export type PortalArticle = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  updated_at: string
  category: { name: string } | null
}

export async function listPortalArticles(): Promise<PortalArticle[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("kb_articles")
    .select(
      "id, title, slug, excerpt, content, updated_at, category:kb_categories(name)",
    )
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })

  return (data ?? []) as unknown as PortalArticle[]
}

export async function getPortalArticle(
  id: string,
): Promise<PortalArticle | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("kb_articles")
    .select(
      "id, title, slug, excerpt, content, updated_at, category:kb_categories(name)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()
  return (data as unknown as PortalArticle | null) ?? null
}

export type PortalFaq = {
  id: string
  question: string
  answer: string | null
}

export async function listPortalFaqs(): Promise<PortalFaq[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("faqs")
    .select("id, question, answer")
    .order("position")
    .order("created_at")
  return (data ?? []) as PortalFaq[]
}
