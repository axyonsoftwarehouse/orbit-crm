import { createClient } from "@/lib/supabase/server"
import { todayIso } from "@/lib/format"
import {
  buildTimeline,
  chunk,
  summarizeFinance,
  sumHours,
  type AuditEntry,
  type ClientFinance,
  type ConvertedLead,
  type LeadNote,
  type TimelineItem,
} from "@/lib/client-360"

export type Client360Project = {
  id: string
  name: string
  status: number
  progress: number
  deadline: string | null
}

export type Client360Document = {
  id: string
  formatted_number: string
  status: number
  date: string
  due_date: string | null
  expiry_date: string | null
  total: number
  currency: string
}

export type Client360Contract = {
  id: string
  title: string
  status: number
  value: number | null
  start_date: string | null
  end_date: string | null
  signed_at: string | null
  marked_as_signed_at: string | null
}

export type Client360Ticket = {
  id: string
  formatted_number: string
  subject: string
  status: number
  priority: number
  created_at: string
}

export type Client360SocialPost = {
  id: string
  content: string
  status: string
  scheduled_at: string | null
  published_at: string | null
}

export type Client360 = {
  projects: Client360Project[]
  estimates: Client360Document[]
  invoices: Client360Document[]
  contracts: Client360Contract[]
  tickets: Client360Ticket[]
  socialPosts: Client360SocialPost[]
  finance: ClientFinance
  hours: number
  timeline: TimelineItem[]
}

/** Tamanho dos blocos de IDs em filtros `in` (mantém a URL curta). */
const IN_CHUNK = 100
const TIMELINE_LIMIT = 50

/**
 * Tudo que pertence a um cliente: listas, totais e linha do tempo.
 * Sempre filtra por tenant (RLS também isola).
 */
export async function getClient360(
  tenantId: string,
  companyId: string,
): Promise<Client360> {
  const supabase = await createClient()

  const [
    { data: projects },
    { data: estimates },
    { data: invoices },
    { data: contracts },
    { data: tickets },
    { data: socialPosts },
    { data: contacts },
    { data: leads },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, status, progress, deadline")
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("estimates")
      .select(
        "id, formatted_number, status, date, expiry_date, total, currency",
      )
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("date", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, formatted_number, status, date, due_date, total, currency")
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("date", { ascending: false }),
    supabase
      .from("contracts")
      .select(
        "id, title, status, value, start_date, end_date, signed_at, marked_as_signed_at",
      )
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("tickets")
      .select("id, formatted_number, subject, status, priority, created_at")
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("social_posts")
      .select("id, content, status, scheduled_at, published_at")
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("contacts")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("company_id", companyId),
    supabase
      .from("leads")
      .select("id, name, converted_at")
      .eq("tenant_id", tenantId)
      .eq("converted_company_id", companyId),
  ])

  const projectRows = (projects ?? []) as Client360Project[]
  const estimateRows = ((estimates ?? []) as Client360Document[]).map(
    (row) => ({ ...row, due_date: null }),
  )
  const invoiceRows = ((invoices ?? []) as Client360Document[]).map((row) => ({
    ...row,
    expiry_date: null,
  }))
  const leadRows = (leads ?? []) as ConvertedLead[]

  const [payments, timeEntries, notes] = await Promise.all([
    selectIn<{ id: string; invoice_id: string; amount: number }>(
      "payments",
      "id, invoice_id, amount",
      "invoice_id",
      invoiceRows.map((row) => row.id),
      tenantId,
    ),
    selectIn<{ duration_seconds: number | null }>(
      "time_entries",
      "duration_seconds",
      "project_id",
      projectRows.map((row) => row.id),
      tenantId,
    ),
    listLeadNotes(
      tenantId,
      leadRows.map((lead) => lead.id),
    ),
  ])

  const names = new Map<string, string>()
  names.set(companyId, "")
  for (const row of projectRows) names.set(row.id, row.name)
  for (const row of estimateRows) names.set(row.id, row.formatted_number)
  for (const row of invoiceRows) names.set(row.id, row.formatted_number)
  for (const row of (contracts ?? []) as Client360Contract[])
    names.set(row.id, row.title)
  for (const row of (tickets ?? []) as Client360Ticket[])
    names.set(row.id, row.formatted_number)

  const auditIds = [
    ...names.keys(),
    ...((contacts ?? []) as { id: string }[]).map((row) => row.id),
    ...payments.map((row) => row.id),
  ]
  const audit = await listAudit(tenantId, auditIds)
  names.delete(companyId)

  return {
    projects: projectRows,
    estimates: estimateRows,
    invoices: invoiceRows,
    contracts: (contracts ?? []) as Client360Contract[],
    tickets: (tickets ?? []) as Client360Ticket[],
    socialPosts: (socialPosts ?? []) as Client360SocialPost[],
    finance: summarizeFinance(invoiceRows, payments, todayIso()),
    hours: sumHours(timeEntries),
    timeline: buildTimeline(
      { leads: leadRows, notes, audit, names },
      TIMELINE_LIMIT,
    ),
  }
}

type InTable = "payments" | "time_entries"

async function selectIn<T>(
  table: InTable,
  columns: string,
  column: string,
  ids: string[],
  tenantId: string,
): Promise<T[]> {
  if (ids.length === 0) return []
  const supabase = await createClient()
  const results = await Promise.all(
    chunk(ids, IN_CHUNK).map((part) =>
      supabase
        .from(table)
        .select(columns)
        .eq("tenant_id", tenantId)
        .in(column, part),
    ),
  )
  return results.flatMap(({ data }) => (data ?? []) as unknown as T[])
}

async function listLeadNotes(
  tenantId: string,
  leadIds: string[],
): Promise<LeadNote[]> {
  if (leadIds.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from("lead_activities")
    .select("id, lead_id, description, created_at, author:profiles(full_name)")
    .eq("tenant_id", tenantId)
    .in("lead_id", leadIds)
    .order("created_at", { ascending: false })
    .limit(TIMELINE_LIMIT)

  return (
    (data ?? []) as unknown as {
      id: string
      lead_id: string
      description: string
      created_at: string
      author: { full_name: string | null } | null
    }[]
  ).map((row) => ({
    id: row.id,
    lead_id: row.lead_id,
    description: row.description,
    created_at: row.created_at,
    author_name: row.author?.full_name ?? null,
  }))
}

async function listAudit(
  tenantId: string,
  entityIds: string[],
): Promise<AuditEntry[]> {
  if (entityIds.length === 0) return []
  const supabase = await createClient()
  const results = await Promise.all(
    chunk(entityIds, IN_CHUNK).map((part) =>
      supabase
        .from("activity_log")
        .select(
          "id, entity, entity_id, action, created_at, actor:profiles(full_name)",
        )
        .eq("tenant_id", tenantId)
        .in("entity_id", part)
        .order("created_at", { ascending: false })
        .limit(TIMELINE_LIMIT),
    ),
  )

  return results.flatMap(({ data }) =>
    (
      (data ?? []) as unknown as {
        id: string
        entity: string
        entity_id: string | null
        action: string
        created_at: string
        actor: { full_name: string | null } | null
      }[]
    ).map((row) => ({
      id: row.id,
      entity: row.entity,
      entity_id: row.entity_id,
      action: row.action,
      created_at: row.created_at,
      actor_name: row.actor?.full_name ?? null,
    })),
  )
}
