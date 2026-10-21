"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/auth"
import { getActiveMembership } from "@/lib/tenant"
import { dbError } from "@/lib/db-error"
import { logger } from "@/lib/logger"
import type { Json } from "@/lib/database.types"
import { seoMonitoringSchema, seoSiteSchema } from "@/lib/validations/seo"
import { checkPlanLimit } from "@/server/plan-limits"
import { isManager } from "@/server/permissions"
import { runSeoAudit, type SeoAuditResult } from "@/server/seo/audit"
import { generateSeoAiSummary } from "@/server/seo/ai-summary"
import { nextAuditAt } from "@/server/seo/scheduling"

export type SeoSiteFormState = { error?: string; success?: string } | undefined
export type SeoAiSummaryState = { error?: string; success?: string } | undefined

export async function createSeoSiteAction(
  _prevState: SeoSiteFormState,
  formData: FormData,
): Promise<SeoSiteFormState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const limit = await checkPlanLimit(active.tenantId, "seo_sites")
  if (!limit.ok) return { error: limit.message ?? "Limite do plano atingido." }

  const parsed = seoSiteSchema.safeParse({
    label: formData.get("label") || undefined,
    url: formData.get("url"),
    company_id: formData.get("company_id") || undefined,
    check_interval_days: formData.get("check_interval_days") ?? 0,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const label = parsed.data.label ?? new URL(parsed.data.url).hostname
  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase.from("seo_sites").insert({
    tenant_id: active.tenantId,
    company_id: parsed.data.company_id ?? null,
    label,
    url: parsed.data.url,
    check_interval_days: parsed.data.check_interval_days,
    created_by: user?.id ?? null,
  })

  if (error) return dbError("seo_sites", error)

  revalidatePath("/app/seo")
  return { success: "Site adicionado ao monitoramento." }
}

export async function runSeoAuditAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/seo")

  const siteId = String(formData.get("site_id") ?? "")
  if (!siteId) redirect("/app/seo")

  const supabase = await createClient()
  const { data: site } = await supabase
    .from("seo_sites")
    .select("id, url, check_interval_days")
    .eq("id", siteId)
    .eq("tenant_id", active.tenantId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!site) redirect("/app/seo")

  const user = await getUser()
  const { data: audit, error: insertError } = await supabase
    .from("seo_audits")
    .insert({
      tenant_id: active.tenantId,
      site_id: site.id,
      url: site.url,
      status: 1,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single()

  if (insertError || !audit) {
    logger.error("seo.audit_insert_failed", {
      error: insertError?.message ?? "unknown",
    })
    redirect(`/app/seo/${site.id}`)
  }

  try {
    const result = await runSeoAudit(site.url)
    await supabase
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
      .eq("tenant_id", active.tenantId)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao executar a auditoria."
    logger.error("seo.audit_failed", { siteId: site.id, error: message })
    await supabase
      .from("seo_audits")
      .update({
        status: 3,
        error: message,
        finished_at: new Date().toISOString(),
      })
      .eq("id", audit.id)
      .eq("tenant_id", active.tenantId)
  }

  await supabase
    .from("seo_sites")
    .update({ next_audit_at: nextAuditAt(site.check_interval_days) })
    .eq("id", site.id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/seo")
  revalidatePath(`/app/seo/${site.id}`)
  redirect(`/app/seo/${site.id}`)
}

export async function updateSeoMonitoringAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/seo")

  const id = String(formData.get("id") ?? "")
  if (!id) redirect("/app/seo")

  const parsed = seoMonitoringSchema.safeParse({
    check_interval_days: formData.get("check_interval_days"),
  })
  if (!parsed.success) redirect(`/app/seo/${id}`)

  const supabase = await createClient()
  await supabase
    .from("seo_sites")
    .update({
      check_interval_days: parsed.data.check_interval_days,
      next_audit_at: nextAuditAt(parsed.data.check_interval_days),
    })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/seo")
  revalidatePath(`/app/seo/${id}`)
  redirect(`/app/seo/${id}`)
}

export async function generateSeoAiSummaryAction(
  _prevState: SeoAiSummaryState,
  formData: FormData,
): Promise<SeoAiSummaryState> {
  const active = await getActiveMembership()
  if (!active) return { error: "Nenhuma empresa ativa." }

  const auditId = String(formData.get("audit_id") ?? "")
  const siteId = String(formData.get("site_id") ?? "")
  if (!auditId || !siteId) return { error: "Auditoria inválida." }

  const supabase = await createClient()
  const { data: audit } = await supabase
    .from("seo_audits")
    .select("id, result")
    .eq("id", auditId)
    .eq("site_id", siteId)
    .eq("tenant_id", active.tenantId)
    .eq("status", 2)
    .maybeSingle()

  if (!audit?.result) {
    return { error: "Auditoria concluída não encontrada." }
  }

  try {
    const summary = await generateSeoAiSummary(
      audit.result as unknown as SeoAuditResult,
    )
    const { error } = await supabase
      .from("seo_audits")
      .update({ ai_summary: summary })
      .eq("id", auditId)
      .eq("tenant_id", active.tenantId)

    if (error) return dbError("seo_audits.ai_summary", error)

    revalidatePath(`/app/seo/${siteId}`)
    return { success: "Resumo com IA gerado." }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao gerar o resumo."
    logger.error("seo.ai_summary_failed", { auditId, error: message })
    return { error: message }
  }
}

export async function deleteSeoSiteAction(formData: FormData) {
  const active = await getActiveMembership()
  if (!active) redirect("/app/seo")
  if (!isManager(active.role)) redirect("/app/seo")

  const id = String(formData.get("id") ?? "")
  if (!id) redirect("/app/seo")

  const supabase = await createClient()
  await supabase
    .from("seo_sites")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", active.tenantId)

  revalidatePath("/app/seo")
  redirect("/app/seo")
}
