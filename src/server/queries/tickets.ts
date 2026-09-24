import { createClient } from "@/lib/supabase/server"

export type TicketListRow = {
  id: string
  formatted_number: string
  subject: string
  status: number
  priority: number
  type: number
  updated_at: string
  department: { name: string } | null
  company: { id: string; name: string } | null
  assignee_name: string | null
}

export type Ticket = {
  id: string
  formatted_number: string
  subject: string
  details: string | null
  status: number
  priority: number
  type: number
  department_id: string | null
  company_id: string | null
  contact_id: string | null
  assignee_id: string | null
  project_id: string | null
  created_at: string
  updated_at: string
  closed_at: string | null
}

export type TicketReply = {
  id: string
  body: string
  is_internal: boolean
  created_at: string
  author_name: string | null
  contact_name: string | null
}

export type Department = { id: string; name: string }

export async function listDepartments(tenantId: string): Promise<Department[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("departments")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("name")
  return (data ?? []) as Department[]
}

type RawTicket = {
  id: string
  formatted_number: string
  subject: string
  status: number
  priority: number
  type: number
  updated_at: string
  department: { name: string } | null
  company: { id: string; name: string } | null
  assignee_id: string | null
}

export async function listTickets(tenantId: string): Promise<TicketListRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tickets")
    .select(
      "id, formatted_number, subject, status, priority, type, updated_at, assignee_id, department:departments(name), company:companies(id, name)",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })

  const rows = (data ?? []) as unknown as RawTicket[]
  const ids = Array.from(
    new Set(rows.map((row) => row.assignee_id).filter(Boolean) as string[]),
  )
  const nameById = new Map<string, string | null>()
  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ids)
    for (const profile of (profiles ?? []) as {
      id: string
      full_name: string | null
    }[]) {
      nameById.set(profile.id, profile.full_name)
    }
  }

  return rows.map((row) => ({
    ...row,
    assignee_name: row.assignee_id
      ? (nameById.get(row.assignee_id) ?? null)
      : null,
  }))
}

export async function getTicket(
  tenantId: string,
  id: string,
): Promise<Ticket | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()
  return (data as Ticket | null) ?? null
}

export async function listTicketReplies(
  tenantId: string,
  ticketId: string,
): Promise<TicketReply[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("ticket_replies")
    .select("id, body, is_internal, created_at, author_id, contact_id")
    .eq("tenant_id", tenantId)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })

  const rows = (data ?? []) as {
    id: string
    body: string
    is_internal: boolean
    created_at: string
    author_id: string | null
    contact_id: string | null
  }[]

  const authorIds = Array.from(
    new Set(rows.map((r) => r.author_id).filter(Boolean) as string[]),
  )
  const contactIds = Array.from(
    new Set(rows.map((r) => r.contact_id).filter(Boolean) as string[]),
  )

  const authorById = new Map<string, string | null>()
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", authorIds)
    for (const profile of (profiles ?? []) as {
      id: string
      full_name: string | null
    }[]) {
      authorById.set(profile.id, profile.full_name)
    }
  }

  const contactById = new Map<string, string | null>()
  if (contactIds.length > 0) {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .in("id", contactIds)
    for (const contact of (contacts ?? []) as {
      id: string
      first_name: string
      last_name: string | null
    }[]) {
      contactById.set(
        contact.id,
        `${contact.first_name} ${contact.last_name ?? ""}`.trim(),
      )
    }
  }

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    is_internal: row.is_internal,
    created_at: row.created_at,
    author_name: row.author_id ? (authorById.get(row.author_id) ?? null) : null,
    contact_name: row.contact_id
      ? (contactById.get(row.contact_id) ?? null)
      : null,
  }))
}
