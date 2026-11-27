import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { supportEmail } from "@/lib/env"
import { getActiveMembership } from "@/lib/tenant"
import { isManager } from "@/server/permissions"

type ResourceTable =
  | "companies"
  | "projects"
  | "tasks"
  | "tickets"
  | "leads"
  | "seo_sites"
  | "social_accounts"
  | "social_posts"
  | "tags"
  | "custom_field_definitions"
  | "milestones"

/**
 * Como cada chave de `plans.limits` é contada:
 * - `active`: linhas não excluídas (`deleted_at is null`) do tenant;
 * - `month`: linhas criadas desde o início do mês (UTC), inclusive as
 *   excluídas, para que excluir não devolva a cota do mês;
 * - `all`: todas as linhas do tenant, para tabelas sem `deleted_at` (o filtro
 *   falharia e a contagem viria vazia).
 *
 * `storage_mb` não está aqui: soma bytes, ver `checkStorageLimitWith`.
 */
const RESOURCES: Record<
  string,
  { table: ResourceTable; scope: "active" | "month" | "all" }
> = {
  clients: { table: "companies", scope: "active" },
  projects: { table: "projects", scope: "active" },
  tasks: { table: "tasks", scope: "active" },
  tickets: { table: "tickets", scope: "active" },
  leads: { table: "leads", scope: "active" },
  seo_sites: { table: "seo_sites", scope: "active" },
  social_accounts: { table: "social_accounts", scope: "active" },
  social_posts_month: { table: "social_posts", scope: "month" },
  tags: { table: "tags", scope: "all" },
  custom_fields: { table: "custom_field_definitions", scope: "all" },
  milestones: { table: "milestones", scope: "active" },
}

/** Nome do recurso na mensagem: [singular, plural]. */
const RESOURCE_LABELS: Record<string, [string, string]> = {
  clients: ["cliente", "clientes"],
  projects: ["projeto", "projetos"],
  tasks: ["tarefa", "tarefas"],
  tickets: ["ticket", "tickets"],
  leads: ["lead", "leads"],
  seo_sites: ["site de SEO", "sites de SEO"],
  social_accounts: ["conta social", "contas sociais"],
  social_posts_month: ["post social por mês", "posts sociais por mês"],
  tags: ["tag", "tags"],
  custom_fields: ["campo personalizado", "campos personalizados"],
  milestones: ["marco", "marcos"],
}

/**
 * Quem vai ler a mensagem: `manager` (owner/admin) recebe o contato para
 * upgrade; `member` é orientado a falar com um administrador.
 */
export type PlanLimitAudience = "manager" | "member"

export function upgradeHint(audience: PlanLimitAudience): string {
  if (audience === "member") {
    return "Peça a um administrador da conta para aumentar o plano."
  }
  const email = supportEmail()
  return email
    ? `Para aumentar o limite, fale com a gente em ${email}.`
    : "Para aumentar o limite, fale com o suporte do Orbit CRM."
}

export function planLimitMessage(
  resource: string,
  limit: number,
  audience: PlanLimitAudience,
): string {
  const [singular, plural] = RESOURCE_LABELS[resource] ?? ["item", "itens"]
  const what = `${limit} ${limit === 1 ? singular : plural}`
  return `Seu plano permite até ${what}. ${upgradeHint(audience)}`
}

export function storageLimitMessage(
  limitMb: number,
  audience: PlanLimitAudience,
): string {
  const size =
    limitMb >= 1024 && limitMb % 1024 === 0
      ? `${limitMb / 1024} GB`
      : `${limitMb} MB`
  return `O armazenamento do plano (${size}) está cheio. ${upgradeHint(audience)}`
}

/** Papel do usuário logado no tenant, para escolher a mensagem. */
async function currentAudience(tenantId: string): Promise<PlanLimitAudience> {
  const active = await getActiveMembership()
  return active?.tenantId === tenantId && isManager(active.role)
    ? "manager"
    : "member"
}

export type PlanLimitResult = {
  ok: boolean
  message?: string
  remaining?: number
}

async function planLimits(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<Record<string, number | null>> {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan:plans(limits)")
    .eq("id", tenantId)
    .maybeSingle()

  return (
    (
      tenant as {
        plan: { limits: Record<string, number | null> } | null
      } | null
    )?.plan?.limits ?? {}
  )
}

export function startOfMonthUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

/**
 * Mesma verificação de `checkPlanLimit`, mas recebendo o cliente Supabase.
 * Necessário em fluxos sem usuário autenticado (ex.: formulário público) e em
 * fluxos do portal, onde o cliente não enxerga `plans`.
 */
export async function checkPlanLimitWith(
  supabase: SupabaseClient,
  tenantId: string,
  resource: string,
  now: Date = new Date(),
  audience: PlanLimitAudience = "manager",
): Promise<PlanLimitResult> {
  const config = RESOURCES[resource]
  if (!config) return { ok: true }

  const limits = await planLimits(supabase, tenantId)
  const limit = limits[resource]
  if (limit === null || limit === undefined) return { ok: true }

  let query = supabase
    .from(config.table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
  if (config.scope === "month") {
    query = query.gte("created_at", startOfMonthUtc(now).toISOString())
  } else if (config.scope === "active") {
    query = query.is("deleted_at", null)
  }

  const { count } = await query

  const used = count ?? 0
  const remaining = Math.max(0, limit - used)

  if (used >= limit) {
    return {
      ok: false,
      remaining: 0,
      message: planLimitMessage(resource, limit, audience),
    }
  }
  return { ok: true, remaining }
}

export async function checkPlanLimit(
  tenantId: string,
  resource: string,
): Promise<PlanLimitResult> {
  const supabase = await createClient()
  return checkPlanLimitWith(
    supabase,
    tenantId,
    resource,
    new Date(),
    await currentAudience(tenantId),
  )
}

const BYTES_PER_MB = 1024 * 1024

/**
 * Cota `storage_mb`: soma os bytes já guardados pelo tenant (anexos e mídias
 * do Social, via RPC `tenant_storage_bytes`) mais o arquivo novo. `remaining`
 * vem em bytes.
 */
export async function checkStorageLimitWith(
  supabase: SupabaseClient,
  tenantId: string,
  incomingBytes: number,
  audience: PlanLimitAudience = "manager",
): Promise<PlanLimitResult> {
  const limits = await planLimits(supabase, tenantId)
  const limitMb = limits.storage_mb
  if (limitMb === null || limitMb === undefined) return { ok: true }

  const { data, error } = await supabase.rpc("tenant_storage_bytes", {
    p_tenant: tenantId,
  })
  // Falha aberta (conta 0) para não travar uploads se o RPC sumir, mas loga
  // para não passar despercebido.
  if (error) {
    logger.error("plan_limits.storage_usage_failed", { error: error.message })
  }
  const used = Number(data ?? 0)
  const limitBytes = limitMb * BYTES_PER_MB

  if (used + incomingBytes > limitBytes) {
    return {
      ok: false,
      remaining: 0,
      message: storageLimitMessage(limitMb, audience),
    }
  }
  return { ok: true, remaining: limitBytes - used - incomingBytes }
}

export async function checkStorageLimit(
  tenantId: string,
  incomingBytes: number,
): Promise<PlanLimitResult> {
  const supabase = await createClient()
  return checkStorageLimitWith(
    supabase,
    tenantId,
    incomingBytes,
    await currentAudience(tenantId),
  )
}
