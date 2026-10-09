"use server"

import { headers } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { publicLeadSchema } from "@/lib/validations/public-lead"
import { checkPlanLimitWith } from "@/server/plan-limits"
import { logger } from "@/lib/logger"

export type PublicLeadState = { error?: string; success?: string } | undefined

const RATE_LIMIT = 5
const RATE_WINDOW_SECONDS = 60

// Rate limit distribuído (tabela + função SECURITY DEFINER). Funciona entre
// instâncias serverless, ao contrário de um contador em memória.
async function isRateLimited(): Promise<boolean> {
  const headerList = await headers()
  const ip =
    (headerList.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown"

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_bucket: `web-lead:${ip}`,
      p_limit: RATE_LIMIT,
      p_window_seconds: RATE_WINDOW_SECONDS,
    })
    if (error) {
      logger.error("public-lead.rate_limit_failed", { error: error.message })
      return false
    }
    return data === false
  } catch (error) {
    logger.error("public-lead.rate_limit_exception", {
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

export async function submitPublicLeadAction(
  _prevState: PublicLeadState,
  formData: FormData,
): Promise<PublicLeadState> {
  const slug = String(formData.get("slug") ?? "").trim()
  if (!slug) return { error: "Formulário inválido." }

  if (await isRateLimited()) {
    return { error: "Muitas tentativas. Tente novamente em instantes." }
  }

  // Honeypot: se preenchido, é bot — finge sucesso.
  const honeypot = String(formData.get("company_website") ?? "")
  if (honeypot.length > 0) {
    return { success: "Recebemos sua mensagem. Obrigado!" }
  }

  const parsed = publicLeadSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    message: String(formData.get("message") ?? "").trim() || undefined,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." }
  }

  const admin = createAdminClient()
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, web_to_lead_enabled, web_to_lead_source_id")
    .eq("slug", slug)
    .maybeSingle()

  if (!tenant || !tenant.web_to_lead_enabled) {
    return { error: "Formulário indisponível." }
  }

  const limit = await checkPlanLimitWith(admin, tenant.id, "leads")
  if (!limit.ok) {
    logger.warn("public-lead.plan_limit", { tenantId: tenant.id })
    return { error: "Formulário indisponível no momento." }
  }

  const { error } = await admin.from("leads").insert({
    tenant_id: tenant.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    description: parsed.data.message || null,
    source_id: tenant.web_to_lead_source_id ?? null,
  })

  if (error) {
    logger.error("public-lead.insert_failed", { error: error.message })
    return { error: "Não foi possível enviar sua mensagem. Tente novamente." }
  }

  return { success: "Recebemos sua mensagem. Em breve entraremos em contato!" }
}
