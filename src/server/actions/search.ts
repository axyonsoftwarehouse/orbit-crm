"use server"

import { createClient } from "@/lib/supabase/server"
import { getActiveMembership } from "@/lib/tenant"

export type SearchResult = {
  id: string
  title: string
  subtitle: string | null
  href: string
  type: "cliente" | "projeto" | "tarefa" | "seo"
}

export async function searchAction(query: string): Promise<SearchResult[]> {
  const active = await getActiveMembership()
  if (!active) return []

  const term = query.trim()
  if (term.length < 2) return []
  const like = `%${term}%`

  const supabase = await createClient()
  const [companies, projects, tasks, seoSites] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, city")
      .eq("tenant_id", active.tenantId)
      .is("deleted_at", null)
      .ilike("name", like)
      .limit(5),
    supabase
      .from("projects")
      .select("id, name")
      .eq("tenant_id", active.tenantId)
      .is("deleted_at", null)
      .ilike("name", like)
      .limit(5),
    supabase
      .from("tasks")
      .select("id, name")
      .eq("tenant_id", active.tenantId)
      .is("deleted_at", null)
      .ilike("name", like)
      .limit(5),
    supabase
      .from("seo_sites")
      .select("id, label, url")
      .eq("tenant_id", active.tenantId)
      .is("deleted_at", null)
      .ilike("label", like)
      .limit(5),
  ])

  const results: SearchResult[] = []
  for (const c of (companies.data ?? []) as {
    id: string
    name: string
    city: string | null
  }[]) {
    results.push({
      id: c.id,
      title: c.name,
      subtitle: c.city,
      href: `/app/clientes/${c.id}`,
      type: "cliente",
    })
  }
  for (const p of (projects.data ?? []) as { id: string; name: string }[]) {
    results.push({
      id: p.id,
      title: p.name,
      subtitle: null,
      href: `/app/projetos/${p.id}`,
      type: "projeto",
    })
  }
  for (const t of (tasks.data ?? []) as { id: string; name: string }[]) {
    results.push({
      id: t.id,
      title: t.name,
      subtitle: null,
      href: `/app/tarefas/${t.id}`,
      type: "tarefa",
    })
  }
  for (const s of (seoSites.data ?? []) as {
    id: string
    label: string
    url: string
  }[]) {
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
