import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/database.types"
import { logger } from "@/lib/logger"
import { runSeoAudit } from "./audit"
import { nextAuditAt } from "./scheduling"

type DueSite = {
  id: string
  tenant_id: string
  url: string
  check_interval_days: number
}

export type ScheduledSeoResult = {
  processed: number
  ok: number
  failed: number
}

export async function runScheduledSeoAudits(
  limit = 3,
): Promise<ScheduledSeoResult> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("seo_sites")
    .select("id, tenant_id, url, check_interval_days")
    .is("deleted_at", null)
    .gt("check_interval_days", 0)
    .lte("next_audit_at", new Date().toISOString())
    .order("next_audit_at", { ascending: true })
    .limit(limit)

  if (error) throw new Error(error.message)

  const sites = (data ?? []) as DueSite[]
  if (sites.length === 0) {
    return { processed: 0, ok: 0, failed: 0 }
  }

  const results = await Promise.allSettled(
    sites.map(async (site) => {
      let auditId: string | null = null

      try {
        const { data: audit, error: insertError } = await admin
          .from("seo_audits")
          .insert({
            tenant_id: site.tenant_id,
            site_id: site.id,
            url: site.url,
            status: 1,
            created_by: null,
          })
          .select("id")
          .single()

        if (insertError || !audit) {
          throw new Error(insertError?.message ?? "audit_insert_failed")
        }
        auditId = audit.id

        const result = await runSeoAudit(site.url)
        await admin
          .from("seo_audits")
          .update({
            status: 2,
            score: result.summary.score,
            checks_total: result.summary.checksTotal,
            issues_total: result.summary.issuesTotal,
            major_issues: result.summary.majorIssues,
            moderate_issues: result.summary.moderateIssues,
            minor_issues: result.summary.minorIssues,
            result: result as unknown as Json,
            finished_at: new Date().toISOString(),
          })
          .eq("id", audit.id)
          .eq("tenant_id", site.tenant_id)

        await admin
          .from("seo_sites")
          .update({
            next_audit_at: nextAuditAt(site.check_interval_days),
          })
          .eq("id", site.id)
          .eq("tenant_id", site.tenant_id)

        return site.id
      } catch (error) {
        const message = error instanceof Error ? error.message : "audit_failed"
        logger.error("seo.scheduled_audit_failed", {
          siteId: site.id,
          error: message,
        })

        if (auditId) {
          await admin
            .from("seo_audits")
            .update({
              status: 3,
              error: message,
              finished_at: new Date().toISOString(),
            })
            .eq("id", auditId)
            .eq("tenant_id", site.tenant_id)
        }

        await admin
          .from("seo_sites")
          .update({ next_audit_at: nextAuditAt(1) })
          .eq("id", site.id)
          .eq("tenant_id", site.tenant_id)

        throw error
      }
    }),
  )

  const failed = results.filter((result) => result.status === "rejected").length
  return { processed: sites.length, ok: sites.length - failed, failed }
}
