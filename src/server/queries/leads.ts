import { createClient } from "@/lib/supabase/server"

export type LeadStatus = {
  id: string
  name: string
  color: string
  position: number
  is_default: boolean
  is_won: boolean
  is_lost: boolean
}

export type LeadSource = { id: string; name: string }

export type LeadListRow = {
  id: string
  name: string
  company: string | null
  email: string | null
  value: number | null
  lost: boolean
  updated_at: string
  status: { id: string; name: string; color: string } | null
  source: { id: string; name: string } | null
  assignee_name: string | null
}

export type Lead = {
  id: string
  name: string
  company: string | null
  title: string | null
  email: string | null
  phone: string | null
  website: string | null
  description: string | null
  status_id: string | null
  source_id: string | null
  value: number | null
  assignee_id: string | null
  city: string | null
  state: string | null
  country: string | null
  lost: boolean
  converted_company_id: string | null
  converted_at: string | null
  created_at: string
  updated_at: string
}

export type LeadActivity = {
  id: string
  description: string
  created_at: string
  author_name: string | null
}

export async function listLeadStatuses(
  tenantId: string,
): Promise<LeadStatus[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("lead_statuses")
    .select("id, name, color, position, is_default, is_won, is_lost")
    .eq("tenant_id", tenantId)
    .order("position")
    .order("name")
  return (data ?? []) as LeadStatus[]
}

export async function listLeadSources(tenantId: string): Promise<LeadSource[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("lead_sources")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .order("name")
  return (data ?? []) as LeadSource[]
}

type RawLead = {
  id: string
  name: string
  company: string | null
  email: string | null
  value: number | null
  lost: boolean
  updated_at: string
  assignee_id: string | null
  status: { id: string; name: string; color: string } | null
  source: { id: string; name: string } | null
}

export async function listLeads(
  tenantId: string,
  options: { statusId?: string } = {},
): Promise<LeadListRow[]> {
  const supabase = await createClient()
  let query = supabase
    .from("leads")
    .select(
      "id, name, company, email, value, lost, updated_at, assignee_id, status:lead_statuses(id, name, color), source:lead_sources(id, name)",
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })

  if (options.statusId) query = query.eq("status_id", options.statusId)

  const { data } = await query
  const rows = (data ?? []) as unknown as RawLead[]

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

export async function getLead(
  tenantId: string,
  id: string,
): Promise<Lead | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()
  return (data as Lead | null) ?? null
}

export async function listLeadActivities(
  tenantId: string,
  leadId: string,
): Promise<LeadActivity[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("lead_activities")
    .select("id, description, created_at, author_id")
    .eq("tenant_id", tenantId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })

  const rows = (data ?? []) as {
    id: string
    description: string
    created_at: string
    author_id: string | null
  }[]
  const ids = Array.from(
    new Set(rows.map((r) => r.author_id).filter(Boolean) as string[]),
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
    id: row.id,
    description: row.description,
    created_at: row.created_at,
    author_name: row.author_id ? (nameById.get(row.author_id) ?? null) : null,
  }))
}
