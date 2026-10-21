import { createClient } from "@/lib/supabase/server"
import type { SeoAuditResult } from "@/server/seo/audit"

export type SeoSite = {
  id: string
  tenant_id: string
  company_id: string | null
  label: string
  url: string
  check_interval_days: number
  next_audit_at: string | null
  created_at: string
  updated_at: string
}

export type SeoSiteWithCompany = SeoSite & {
  company: { id: string; name: string } | null
}

export type SeoAuditSummaryRow = {
  id: string
  site_id: string
  status: number
  score: number | null
  checks_total: number
  issues_total: number
  created_at: string
  finished_at: string | null
}

export type SeoAudit = SeoAuditSummaryRow & {
  tenant_id: string
  url: string
  major_issues: number
  moderate_issues: number
  minor_issues: number
  result: SeoAuditResult | null
  ai_summary: string | null
  error: string | null
}

export type SeoSiteListRow = SeoSiteWithCompany & {
  latestAudit: SeoAuditSummaryRow | null
}

export async function listSeoSitesPage(
  tenantId: string,
  options: { page: number; pageSize: number },
): Promise<{ rows: SeoSiteListRow[]; total: number }> {
  const supabase = await createClient()
  const from = (options.page - 1) * options.pageSize
  const { data, count } = await supabase
    .from("seo_sites")
    .select(
      "id, tenant_id, company_id, label, url, check_interval_days, next_audit_at, created_at, updated_at",
      { count: "exact" },
    )
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(from, from + options.pageSize - 1)

  const sites = (data ?? []) as SeoSite[]
  if (sites.length === 0) return { rows: [], total: count ?? 0 }

  const siteIds = sites.map((site) => site.id)
  const companyIds = [
    ...new Set(
      sites
        .map((site) => site.company_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  const [{ data: companies }, { data: audits }] = await Promise.all([
    companyIds.length > 0
      ? supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds)
          .eq("tenant_id", tenantId)
      : Promise.resolve({ data: [] }),
    supabase
      .from("seo_audits")
      .select(
        "id, site_id, status, score, checks_total, issues_total, created_at, finished_at",
      )
      .eq("tenant_id", tenantId)
      .in("site_id", siteIds)
      .order("created_at", { ascending: false }),
  ])

  const companyMap = new Map(
    ((companies ?? []) as { id: string; name: string }[]).map((company) => [
      company.id,
      company,
    ]),
  )

  const latestBySite = new Map<string, SeoAuditSummaryRow>()
  for (const audit of (audits ?? []) as SeoAuditSummaryRow[]) {
    if (!latestBySite.has(audit.site_id)) latestBySite.set(audit.site_id, audit)
  }

  return {
    rows: sites.map((site) => ({
      ...site,
      company: site.company_id
        ? (companyMap.get(site.company_id) ?? null)
        : null,
      latestAudit: latestBySite.get(site.id) ?? null,
    })),
    total: count ?? 0,
  }
}

export async function getSeoSite(
  tenantId: string,
  id: string,
): Promise<SeoSiteWithCompany | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("seo_sites")
    .select(
      "id, tenant_id, company_id, label, url, check_interval_days, next_audit_at, created_at, updated_at",
    )
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  const site = data as SeoSite | null
  if (!site) return null

  let company: { id: string; name: string } | null = null
  if (site.company_id) {
    const { data: companyData } = await supabase
      .from("companies")
      .select("id, name")
      .eq("id", site.company_id)
      .eq("tenant_id", tenantId)
      .maybeSingle()
    company = (companyData as { id: string; name: string } | null) ?? null
  }

  return { ...site, company }
}

export async function getLatestSeoAudit(
  tenantId: string,
  siteId: string,
): Promise<SeoAudit | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("seo_audits")
    .select(
      "id, tenant_id, site_id, url, status, score, checks_total, issues_total, major_issues, moderate_issues, minor_issues, result, ai_summary, error, created_at, finished_at",
    )
    .eq("tenant_id", tenantId)
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data as unknown as SeoAudit | null) ?? null
}

export async function listSeoAuditHistory(
  tenantId: string,
  siteId: string,
  limit = 10,
): Promise<SeoAuditSummaryRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("seo_audits")
    .select(
      "id, site_id, status, score, checks_total, issues_total, created_at, finished_at",
    )
    .eq("tenant_id", tenantId)
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(limit)

  return (data ?? []) as SeoAuditSummaryRow[]
}

export type SeoAuditExportRow = SeoAuditSummaryRow & {
  url: string
  major_issues: number
  moderate_issues: number
  minor_issues: number
  site_label: string
}

export async function listSeoAuditsForExport(
  tenantId: string,
): Promise<SeoAuditExportRow[]> {
  const supabase = await createClient()
  const [{ data: audits }, { data: sites }] = await Promise.all([
    supabase
      .from("seo_audits")
      .select(
        "id, site_id, url, status, score, checks_total, issues_total, major_issues, moderate_issues, minor_issues, created_at, finished_at",
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("seo_sites")
      .select("id, label")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
  ])

  const labels = new Map(
    ((sites ?? []) as { id: string; label: string }[]).map((site) => [
      site.id,
      site.label,
    ]),
  )

  return ((audits ?? []) as Omit<SeoAuditExportRow, "site_label">[]).map(
    (audit) => ({
      ...audit,
      site_label: labels.get(audit.site_id) ?? audit.url,
    }),
  )
}
