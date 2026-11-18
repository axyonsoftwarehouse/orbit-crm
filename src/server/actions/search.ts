"use server"

import { createClient } from "@/lib/supabase/server"
import { getActiveMembership } from "@/lib/tenant"
import { sanitizeSearchTerm } from "@/lib/search"

export type SearchResultType =
  | "cliente"
  | "contato"
  | "lead"
  | "projeto"
  | "tarefa"
  | "ticket"
  | "fatura"
  | "orçamento"
  | "seo"

export type SearchResult = {
  id: string
  title: string
  subtitle: string | null
  href: string
  type: SearchResultType
}

const PER_TYPE = 5

function fullName(first: string | null, last: string | null) {
  return [first, last].filter(Boolean).join(" ")
}

export async function searchAction(query: string): Promise<SearchResult[]> {
  const active = await getActiveMembership()
  if (!active) return []

  const term = sanitizeSearchTerm(query)
  if (term.length < 2) return []
  const like = `%${term}%`
  const tenantId = active.tenantId

  const supabase = await createClient()
  const [
    companies,
    contacts,
    leads,
    projects,
    tasks,
    tickets,
    invoices,
    estimates,
    seoSites,
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, city")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .ilike("name", like)
      .limit(PER_TYPE),
    supabase
      .from("contacts")
      .select("id, first_name, last_name, email, company_id")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .or(
        `first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`,
      )
      .limit(PER_TYPE),
    supabase
      .from("leads")
      .select("id, name, company")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .or(`name.ilike.${like},company.ilike.${like},email.ilike.${like}`)
      .limit(PER_TYPE),
    supabase
      .from("projects")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .ilike("name", like)
      .limit(PER_TYPE),
    supabase
      .from("tasks")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .ilike("name", like)
      .limit(PER_TYPE),
    supabase
      .from("tickets")
      .select("id, subject, formatted_number")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .or(`subject.ilike.${like},formatted_number.ilike.${like}`)
      .limit(PER_TYPE),
    supabase
      .from("invoices")
      .select("id, formatted_number")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .ilike("formatted_number", like)
      .limit(PER_TYPE),
    supabase
      .from("estimates")
      .select("id, formatted_number")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .ilike("formatted_number", like)
      .limit(PER_TYPE),
    supabase
      .from("seo_sites")
      .select("id, label, url")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .ilike("label", like)
      .limit(PER_TYPE),
  ])

  const results: SearchResult[] = []
  for (const c of companies.data ?? []) {
    results.push({
      id: c.id,
      title: c.name,
      subtitle: c.city,
      href: `/app/clientes/${c.id}`,
      type: "cliente",
    })
  }
  for (const c of contacts.data ?? []) {
    results.push({
      id: c.id,
      title: fullName(c.first_name, c.last_name) || (c.email ?? "Contato"),
      subtitle: c.email,
      href: `/app/clientes/${c.company_id}`,
      type: "contato",
    })
  }
  for (const l of leads.data ?? []) {
    results.push({
      id: l.id,
      title: l.name,
      subtitle: l.company,
      href: `/app/leads/${l.id}`,
      type: "lead",
    })
  }
  for (const p of projects.data ?? []) {
    results.push({
      id: p.id,
      title: p.name,
      subtitle: null,
      href: `/app/projetos/${p.id}`,
      type: "projeto",
    })
  }
  for (const t of tasks.data ?? []) {
    results.push({
      id: t.id,
      title: t.name,
      subtitle: null,
      href: `/app/tarefas/${t.id}`,
      type: "tarefa",
    })
  }
  for (const t of tickets.data ?? []) {
    results.push({
      id: t.id,
      title: t.subject,
      subtitle: t.formatted_number,
      href: `/app/tickets/${t.id}`,
      type: "ticket",
    })
  }
  for (const i of invoices.data ?? []) {
    results.push({
      id: i.id,
      title: i.formatted_number,
      subtitle: null,
      href: `/app/faturas/${i.id}`,
      type: "fatura",
    })
  }
  for (const e of estimates.data ?? []) {
    results.push({
      id: e.id,
      title: e.formatted_number,
      subtitle: null,
      href: `/app/orcamentos/${e.id}`,
      type: "orçamento",
    })
  }
  for (const s of seoSites.data ?? []) {
    results.push({
      id: s.id,
      title: s.label,
      subtitle: s.url,
      href: `/app/seo/${s.id}`,
      type: "seo",
    })
  }

  return results
}
